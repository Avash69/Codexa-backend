import jwt from "jsonwebtoken";
import config from "../config/index.js";
import BlacklistedToken from "../models/BlacklistedToken.js";
import User from "../models/User.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { logger } from "../utils/logger.js";

export const protect = catchAsync(async (req, res, next) => {
  // 1) Get token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in. Please log in to get access.", 401)
    );
  }

  // 2) Check if token is blacklisted
  const isBlacklisted = await BlacklistedToken.findOne({ token });
  if (isBlacklisted) {
    logger.warn(`🚫 Blacklisted token used`, {
      token: token.substring(0, 20) + "...",
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection.remoteAddress,
    });
    return next(
      new AppError("Your session has expired. Please log in again.", 401)
    );
  }

  // 3) Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token. Please log in again.", 401));
    }
    if (error.name === "TokenExpiredError") {
      // Try to get user info from expired token for logging
      try {
        const expiredDecoded = jwt.decode(token);
        if (expiredDecoded && expiredDecoded.userId) {
          const user = await User.findById(expiredDecoded.userId);
          if (user) {
            const expiredSession = user.activeSessions.find(
              (s) => s.token === token
            );
            if (expiredSession) {
              const sessionDuration =
                new Date() - new Date(expiredSession.createdAt);

              logger.warn(
                `⏰ JWT token expired for user: ${user.name} (${user.email})`,
                {
                  userId: user._id,
                  device: expiredSession.device,
                  ipAddress: expiredSession.ipAddress,
                  sessionDuration:
                    Math.round(sessionDuration / 1000 / 60) + " minutes",
                }
              );

              // Print session end message to console
              console.log("\n" + "=".repeat(60));
              console.log(`⏰ SESSION ENDED (JWT EXPIRED)`);
              console.log("=".repeat(60));
              console.log(`👤 User: ${user.name} (${user.email})`);
              console.log(`🆔 User ID: ${user._id}`);
              console.log(`📱 Device: ${expiredSession.device}`);
              console.log(
                `🌐 IP Address: ${expiredSession.ipAddress || "Unknown"}`
              );
              console.log(
                `⏰ Started: ${new Date(
                  expiredSession.createdAt
                ).toISOString()}`
              );
              console.log(`⏰ Ended: ${new Date().toISOString()}`);
              console.log(
                `⏱️  Duration: ${Math.round(
                  sessionDuration / 1000 / 60
                )} minutes`
              );
              console.log(`🎯 Reason: JWT token expired`);
              console.log(`🔑 Token: ${token.substring(0, 20)}...`);
              console.log("=".repeat(60) + "\n");

              // Remove expired session from user's active sessions
              user.activeSessions = user.activeSessions.filter(
                (s) => s.token !== token
              );
              await user.save();
            }
          }
        }
      } catch (decodeError) {
        // If we can't decode or find user, just log the error
        logger.warn(`⏰ JWT token expired but couldn't extract user info`, {
          token: token.substring(0, 20) + "...",
          userAgent: req.headers["user-agent"],
          ip: req.ip || req.connection.remoteAddress,
        });
      }

      return next(
        new AppError("Your token has expired. Please log in again.", 401)
      );
    }
    return next(
      new AppError("Authentication error. Please log in again.", 401)
    );
  }

  // 4) Check if user still exists
  const currentUser = await User.findById(decoded.userId);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token no longer exists.", 401)
    );
  }

  // 5) Check if the token is in the user's active sessions
  const currentSession = currentUser.activeSessions.find(
    (session) => session.token === token
  );

  if (!currentSession) {
    logger.warn(`🚫 Invalid session attempted - session not found`, {
      userId: decoded.userId,
      userEmail: decoded.email,
      token: token.substring(0, 20) + "...",
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection.remoteAddress,
      activeSessions: currentUser.activeSessions.length,
    });
    return next(
      new AppError("Your session is no longer valid. Please log in again.", 401)
    );
  }

  // Check if session has expired
  if (new Date(currentSession.expiresAt) <= new Date()) {
    const sessionDuration = new Date() - new Date(currentSession.createdAt);

    logger.warn(`⏰ Expired session attempted`, {
      userId: decoded.userId,
      userEmail: decoded.email,
      device: currentSession.device,
      ipAddress: currentSession.ipAddress,
      createdAt: currentSession.createdAt,
      expiredAt: currentSession.expiresAt,
      sessionDuration: Math.round(sessionDuration / 1000 / 60) + " minutes",
    });

    // Print session end message to console
    console.log("\n" + "=".repeat(60));
    console.log(`⏰ SESSION ENDED (EXPIRED)`);
    console.log("=".repeat(60));
    console.log(`👤 User: ${currentUser.name} (${currentUser.email})`);
    console.log(`🆔 User ID: ${currentUser._id}`);
    console.log(`📱 Device: ${currentSession.device}`);
    console.log(`🌐 IP Address: ${currentSession.ipAddress || "Unknown"}`);
    console.log(
      `⏰ Started: ${new Date(currentSession.createdAt).toISOString()}`
    );
    console.log(
      `⏰ Expired: ${new Date(currentSession.expiresAt).toISOString()}`
    );
    console.log(
      `⏱️  Duration: ${Math.round(sessionDuration / 1000 / 60)} minutes`
    );
    console.log(`🎯 Reason: Token expired`);
    console.log(`🔑 Token: ${token.substring(0, 20)}...`);
    console.log("=".repeat(60) + "\n");

    // Remove expired session from user's active sessions
    currentUser.activeSessions = currentUser.activeSessions.filter(
      (session) => session.token !== token
    );
    await currentUser.save();

    return next(
      new AppError("Your session has expired. Please log in again.", 401)
    );
  }

  // Optional: Log successful authentication (comment out if too verbose)
  // logger.debug(`✅ Authentication successful for user: ${currentUser.name}`, {
  //   userId: currentUser._id,
  //   endpoint: req.originalUrl,
  //   method: req.method
  // });

  // 6) Grant access to protected route
  req.user = currentUser;
  req.token = token; // Attach token to req for logout functionality
  next();
});
