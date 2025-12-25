import bcrypt from "bcryptjs";
import config from "../config/index.js";
import BlacklistedToken from "../models/BlacklistedToken.js";
import User from "../models/User.js";
import {
  calculateExpirationDate,
  generateToken,
  verifyToken,
} from "../services/tokenService.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { logger } from "../utils/logger.js";

/**
 * Create a session token for the user
 * @param {Object} user - User document
 * @param {String} userAgent - User agent string from request
 * @param {String} ipAddress - IP address of the user
 * @returns {Object} token and user data
 */
const createUserSession = async (
  user,
  userAgent = "Unknown device",
  ipAddress = "Unknown IP"
) => {
  // Generate JWT token
  const tokenPayload = { userId: user._id, email: user.email };
  const token = generateToken(tokenPayload, config.jwtExpiresIn);

  // Calculate token expiration date
  const expiresAt = calculateExpirationDate(config.jwtExpiresIn);

  // Limit the number of active sessions
  if (
    user.activeSessions &&
    user.activeSessions.length >= config.maxActiveSessions
  ) {
    // Sort by creation date and remove the oldest session
    user.activeSessions.sort((a, b) => a.createdAt - b.createdAt);
    const removedSession = user.activeSessions.shift();

    // Calculate session duration
    const sessionDuration = new Date() - new Date(removedSession.createdAt);

    // Log session removal
    logger.info(`🗑️  Session removed for user ${user.name} (${user.email})`, {
      userId: user._id,
      removedSessionDevice: removedSession.device,
      removedSessionCreated: removedSession.createdAt,
      sessionDuration: Math.round(sessionDuration / 1000 / 60) + " minutes",
      reason: "Maximum sessions limit reached",
    });

    // Print session end message to console
    console.log("\n" + "=".repeat(60));
    console.log(`🗑️  SESSION ENDED (LIMIT REACHED)`);
    console.log("=".repeat(60));
    console.log(`👤 User: ${user.name} (${user.email})`);
    console.log(`🆔 User ID: ${user._id}`);
    console.log(`📱 Device: ${removedSession.device}`);
    console.log(`🌐 IP Address: ${removedSession.ipAddress || "Unknown"}`);
    console.log(
      `⏰ Started: ${new Date(removedSession.createdAt).toISOString()}`
    );
    console.log(`⏰ Ended: ${new Date().toISOString()}`);
    console.log(
      `⏱️  Duration: ${Math.round(sessionDuration / 1000 / 60)} minutes`
    );
    console.log(`🎯 Reason: Maximum sessions limit reached`);
    console.log(`🔑 Token: ${removedSession.token.substring(0, 20)}...`);
    console.log("=".repeat(60) + "\n");
  }

  // Add the new session
  user.activeSessions = user.activeSessions || [];
  const sessionData = {
    token,
    expiresAt,
    device: userAgent,
    ipAddress,
    createdAt: new Date(),
  };

  user.activeSessions.push(sessionData);

  await user.save({ validateBeforeSave: false });

  // Log successful session creation
  logger.info(`🔐 New session created for user: ${user.name} (${user.email})`, {
    userId: user._id,
    sessionId: sessionData._id,
    device: userAgent,
    ipAddress,
    expiresAt,
    totalActiveSessions: user.activeSessions.length,
  });

  // Print to console for immediate visibility
  console.log("\n" + "=".repeat(60));
  console.log(`🔐 USER SESSION CREATED`);
  console.log("=".repeat(60));
  console.log(`👤 User: ${user.name} (${user.email})`);
  console.log(`🆔 User ID: ${user._id}`);
  console.log(`📱 Device: ${userAgent}`);
  console.log(`🌐 IP Address: ${ipAddress}`);
  console.log(`⏰ Created: ${new Date().toISOString()}`);
  console.log(`⏳ Expires: ${expiresAt.toISOString()}`);
  console.log(`📊 Active Sessions: ${user.activeSessions.length}`);
  console.log(`🔑 Token: ${token.substring(0, 20)}...`);
  console.log("=".repeat(60) + "\n");

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  };
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("Email already in use", 400));
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Parse first and last name from full name
  const nameParts = name.trim().split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  // Generate a username from email
  const username = email.split("@")[0].toLowerCase();

  // Create and save user
  const newUser = new User({
    name,
    fullName: name, // Store the full name in both fields for compatibility
    firstName,
    lastName,
    username,
    email,
    password: hashedPassword,
    activeSessions: [],
  });

  await newUser.save();

  // Create user session
  const userAgent = req.headers["user-agent"] || "Unknown device";
  const ipAddress =
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    "Unknown IP";
  const { token, user } = await createUserSession(
    newUser,
    userAgent,
    ipAddress
  );

  res.status(201).json({
    status: "success",
    token,
    data: { user },
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  // Find user by email with password field
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new AppError("Invalid credentials", 401));
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new AppError("Invalid credentials", 401));
  }

  // Create user session
  const userAgent = req.headers["user-agent"] || "Unknown device";
  const ipAddress =
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    "Unknown IP";
  const { token, user: userData } = await createUserSession(
    user,
    userAgent,
    ipAddress
  );

  res.status(200).json({
    status: "success",
    token,
    data: { user: userData },
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = catchAsync(async (req, res, next) => {
  const token = req.token; // This will be set by the protect middleware
  const userId = req.user._id;
  const userAgent = req.headers["user-agent"] || "Unknown device";
  const ipAddress =
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    "Unknown IP";

  // Find the user
  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Find the session being logged out
  const loggedOutSession = user.activeSessions.find(
    (session) => session.token === token
  );

  // Remove the session from the user's active sessions
  user.activeSessions = user.activeSessions.filter(
    (session) => session.token !== token
  );

  await user.save();

  // Add the token to the blacklist
  const decoded = verifyToken(token);
  const expirationTime = new Date(decoded.exp * 1000); // Convert from seconds to milliseconds

  await BlacklistedToken.create({
    token,
    userId,
    expiresAt: expirationTime,
  });

  // Log successful logout
  logger.info(`🚪 User logged out: ${user.name} (${user.email})`, {
    userId: user._id,
    device: userAgent,
    ipAddress,
    sessionDuration: loggedOutSession
      ? new Date() - new Date(loggedOutSession.createdAt)
      : "Unknown",
    remainingActiveSessions: user.activeSessions.length,
  });

  // Print to console for immediate visibility
  console.log("\n" + "=".repeat(60));
  console.log(`🚪 USER LOGGED OUT`);
  console.log("=".repeat(60));
  console.log(`👤 User: ${user.name} (${user.email})`);
  console.log(`🆔 User ID: ${user._id}`);
  console.log(`📱 Device: ${userAgent}`);
  console.log(`🌐 IP Address: ${ipAddress}`);
  console.log(`⏰ Logged out: ${new Date().toISOString()}`);
  if (loggedOutSession) {
    const sessionDuration = new Date() - new Date(loggedOutSession.createdAt);
    console.log(
      `⏱️  Session duration: ${Math.round(sessionDuration / 1000 / 60)} minutes`
    );
  }
  console.log(`📊 Remaining sessions: ${user.activeSessions.length}`);
  console.log(`🔑 Token: ${token.substring(0, 20)}...`);
  console.log("=".repeat(60) + "\n");

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getCurrentUser = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    },
  });
});

/**
 * @desc    Get all active sessions for the user
 * @route   GET /api/auth/sessions
 * @access  Private
 */
export const getUserSessions = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Format sessions to return relevant info
  const sessions = user.activeSessions.map((session) => ({
    id: session._id,
    device: session.device,
    ipAddress: session.ipAddress,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    isCurrentSession: session.token === req.token,
    daysActive: Math.floor(
      (new Date() - new Date(session.createdAt)) / (1000 * 60 * 60 * 24)
    ),
  }));

  // Log session info request
  logger.info(
    `📊 Session info requested by user: ${user.name} (${user.email})`,
    {
      userId: user._id,
      totalSessions: sessions.length,
      currentUserAgent: req.headers["user-agent"],
      currentIP: req.ip || req.connection.remoteAddress,
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      totalSessions: sessions.length,
      sessions,
    },
  });
});

/**
 * @desc    Logout from a specific session
 * @route   DELETE /api/auth/sessions/:sessionId
 * @access  Private
 */
export const logoutSession = catchAsync(async (req, res, next) => {
  const { sessionId } = req.params;
  const userId = req.user._id;
  const userAgent = req.headers["user-agent"] || "Unknown device";
  const ipAddress =
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    "Unknown IP";

  // Find the user
  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Find the session
  const sessionIndex = user.activeSessions.findIndex(
    (session) => session._id.toString() === sessionId
  );

  if (sessionIndex === -1) {
    return next(new AppError("Session not found", 404));
  }

  // Check if it's the current session
  const sessionToRemove = user.activeSessions[sessionIndex];
  const isCurrentSession = sessionToRemove.token === req.token;

  // Get the token to blacklist
  const tokenToBlacklist = sessionToRemove.token;

  // Remove the session
  user.activeSessions.splice(sessionIndex, 1);
  await user.save();

  // Add the token to blacklist
  const decoded = verifyToken(tokenToBlacklist);
  const expirationTime = new Date(decoded.exp * 1000);

  await BlacklistedToken.create({
    token: tokenToBlacklist,
    userId,
    expiresAt: expirationTime,
  });

  // Log session termination
  const sessionDuration = new Date() - new Date(sessionToRemove.createdAt);
  logger.info(`🔒 Session terminated for user: ${user.name} (${user.email})`, {
    userId: user._id,
    sessionId,
    device: sessionToRemove.device,
    sessionDuration,
    terminatedBy: isCurrentSession ? "self" : "remote",
    remainingActiveSessions: user.activeSessions.length,
  });

  // Print to console for immediate visibility
  console.log("\n" + "=".repeat(60));
  console.log(`🔒 SESSION TERMINATED`);
  console.log("=".repeat(60));
  console.log(`👤 User: ${user.name} (${user.email})`);
  console.log(`🆔 User ID: ${user._id}`);
  console.log(`📱 Terminated device: ${sessionToRemove.device}`);
  console.log(`🌐 IP: ${sessionToRemove.ipAddress || "Unknown"}`);
  console.log(
    `⏰ Session started: ${new Date(sessionToRemove.createdAt).toISOString()}`
  );
  console.log(`⏰ Session ended: ${new Date().toISOString()}`);
  console.log(
    `⏱️  Duration: ${Math.round(sessionDuration / 1000 / 60)} minutes`
  );
  console.log(
    `🎯 Terminated by: ${isCurrentSession ? "Self" : "Remote action"}`
  );
  console.log(`📊 Remaining sessions: ${user.activeSessions.length}`);
  console.log("=".repeat(60) + "\n");

  // If it's the current session, return a different message
  if (isCurrentSession) {
    return res.status(200).json({
      status: "success",
      message: "You have been logged out",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Session ended successfully",
  });
});

/**
 * @desc    Logout from all sessions
 * @route   DELETE /api/auth/sessions
 * @access  Private
 */
export const logoutAllSessions = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const userAgent = req.headers["user-agent"] || "Unknown device";
  const ipAddress =
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    "Unknown IP";

  // Find the user
  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const sessionCount = user.activeSessions.length;

  // Add all tokens to blacklist
  const blacklistPromises = user.activeSessions.map(async (session) => {
    try {
      const decoded = verifyToken(session.token);
      const expirationTime = new Date(decoded.exp * 1000);

      return BlacklistedToken.create({
        token: session.token,
        userId,
        expiresAt: expirationTime,
      });
    } catch (error) {
      // Token might be invalid or expired, just skip it
      return Promise.resolve();
    }
  });

  await Promise.all(blacklistPromises);

  // Clear all sessions
  user.activeSessions = [];
  await user.save();

  // Log bulk session termination
  logger.info(
    `🔒 All sessions terminated for user: ${user.name} (${user.email})`,
    {
      userId: user._id,
      terminatedSessions: sessionCount,
      terminatedBy: userAgent,
      ipAddress,
    }
  );

  // Print to console for immediate visibility
  console.log("\n" + "=".repeat(60));
  console.log(`🔒 ALL SESSIONS TERMINATED`);
  console.log("=".repeat(60));
  console.log(`👤 User: ${user.name} (${user.email})`);
  console.log(`🆔 User ID: ${user._id}`);
  console.log(`📱 Terminated by device: ${userAgent}`);
  console.log(`🌐 IP Address: ${ipAddress}`);
  console.log(`⏰ Terminated at: ${new Date().toISOString()}`);
  console.log(`📊 Sessions terminated: ${sessionCount}`);
  console.log(`🎯 Action: Logout from all devices`);
  console.log("=".repeat(60) + "\n");

  res.status(200).json({
    status: "success",
    message: "Logged out from all sessions",
  });
});
