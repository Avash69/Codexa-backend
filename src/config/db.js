// import mongoose from "mongoose";
// import { logger } from "../utils/logger.js";

// const connectDB = async () => {
//   try {
//     mongoose.set("strictQuery", false);

//     const conn = await mongoose.connect(process.env.MONGO_URI, {
//       serverSelectionTimeoutMS: 30000,
//       socketTimeoutMS: 45000,
//     });

//     logger.info(`MongoDB Connected: ${conn.connection.host}`);
//   } catch (error) {
//     logger.error(`MongoDB connection error: ${error.message}`);
//     process.exit(1);
//   }
// };

// export default connectDB;

import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

// Function to clean up expired sessions from users
const cleanupExpiredSessions = async () => {
  try {
    const User = mongoose.model("User");
    const now = new Date();
    let totalExpiredSessions = 0;
    let affectedUsers = 0;

    // Find users with expired sessions
    const users = await User.find({
      "activeSessions.expiresAt": { $lt: now },
    });

    // For each user, filter out expired sessions and count them
    for (const user of users) {
      const expiredSessions = user.activeSessions.filter(
        (session) => new Date(session.expiresAt) <= now
      );

      if (expiredSessions.length > 0) {
        affectedUsers++;
        totalExpiredSessions += expiredSessions.length;

        // Log expired sessions for each user
        expiredSessions.forEach((session) => {
          const sessionDuration =
            new Date(session.expiresAt) - new Date(session.createdAt);

          logger.info(
            `⏰ Session expired for user: ${user.name} (${user.email})`,
            {
              userId: user._id,
              device: session.device,
              ipAddress: session.ipAddress,
              createdAt: session.createdAt,
              expiredAt: session.expiresAt,
              sessionDuration:
                Math.round(sessionDuration / 1000 / 60) + " minutes",
            }
          );

          // Print to console for immediate visibility
          console.log("\n" + "=".repeat(60));
          console.log(`⏰ SESSION EXPIRED`);
          console.log("=".repeat(60));
          console.log(`👤 User: ${user.name} (${user.email})`);
          console.log(`🆔 User ID: ${user._id}`);
          console.log(`📱 Device: ${session.device}`);
          console.log(`🌐 IP Address: ${session.ipAddress || "Unknown"}`);
          console.log(
            `⏰ Started: ${new Date(session.createdAt).toISOString()}`
          );
          console.log(
            `⏰ Expired: ${new Date(session.expiresAt).toISOString()}`
          );
          console.log(
            `⏱️  Duration: ${Math.round(sessionDuration / 1000 / 60)} minutes`
          );
          console.log(`🔑 Token: ${session.token.substring(0, 20)}...`);
          console.log("=".repeat(60) + "\n");
        });

        // Remove expired sessions
        user.activeSessions = user.activeSessions.filter(
          (session) => new Date(session.expiresAt) > now
        );
        await user.save();
      }
    }

    if (totalExpiredSessions > 0) {
      logger.info(
        `🧹 Expired sessions cleanup completed: ${totalExpiredSessions} sessions from ${affectedUsers} users`
      );
      console.log(
        `\n🧹 SESSION CLEANUP: Removed ${totalExpiredSessions} expired sessions from ${affectedUsers} users\n`
      );
    } else {
      logger.info(
        "Expired sessions cleanup completed - no expired sessions found"
      );
    }
  } catch (error) {
    logger.error(`Session cleanup error: ${error.message}`);
  }
};

const connectDB = async () => {
  try {
    // Set mongoose connection options
    mongoose.set("strictQuery", false);

    // Connect with longer timeout and retry options
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
      socketTimeoutMS: 45000, // Increase socket timeout to 45 seconds
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Schedule periodic cleanup of expired sessions
    // Run every 24 hours (86400000 ms) for full cleanup
    setInterval(cleanupExpiredSessions, 86400000);

    // Run more frequent cleanup every 30 minutes (1800000 ms) to catch expired sessions in real-time
    setInterval(cleanupExpiredSessions, 1800000);

    // Run initial cleanup
    cleanupExpiredSessions();
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;