// Make sure to import environment variables first
import dotenv from "dotenv";
dotenv.config();

export default {
  port: process.env.PORT || 5002,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "super-secret-key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/codeandcashdb",
  maxActiveSessions: parseInt(process.env.MAX_ACTIVE_SESSIONS || "5"),
};
