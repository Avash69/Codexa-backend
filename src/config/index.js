const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  mongoUri: process.env.MONGO_URI,
  maxActiveSessions: parseInt(process.env.MAX_ACTIVE_SESSIONS || "5"),
};

export default config;
