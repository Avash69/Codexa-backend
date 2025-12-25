// import dotenv from "dotenv";
// dotenv.config();

// import express from "express";
// import cors from "cors";
// import morgan from "morgan";

// import connectDB from "./config/db.js";
// import taskRoutes from "./routes/tasks.js";
// import { errorHandler } from "./middlewares/errorHandler.js";

// connectDB();

// const app = express();

// app.use(
//   cors({
//     origin: "http://localhost:5173",
//     credentials: true,
//   })
// );

// app.use(express.json());
// app.use(morgan("dev"));

// app.use("/api/tasks", taskRoutes);

// app.get("/health", (req, res) => {
//   res.json({ status: "OK" });
// });

// app.use(errorHandler);

// const PORT = process.env.PORT || 5001;
// app.listen(PORT, () =>
//   console.log(`🚀 Server running on http://localhost:${PORT}`)
// );


import dotenv from "dotenv";
dotenv.config();

import express from "express";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import connectDB from "./config/db.js";
import config from "./config/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { logger } from "./utils/logger.js";

// Routes
import authRouter from "./routes/auth.js";
import profileRouter from "./routes/profile.js";
import taskRouter from "./routes/tasks.js";
import applicationRouter from "./routes/applications.js";
import adminRouter from "./routes/admin.js";
import completedTaskRouter from "./routes/completedTask.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* -------------------------------------------------- */
/* App Init */
/* -------------------------------------------------- */
const app = express();

/* -------------------------------------------------- */
/* Database */
/* -------------------------------------------------- */
await connectDB();

/* -------------------------------------------------- */
/* Middleware */
/* -------------------------------------------------- */

// ✅ Proper CORS (NO manual headers)
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Logging
if (config.nodeEnv === "development") {
  app.use(morgan("dev"));
}

/* -------------------------------------------------- */
/* Routes */
/* -------------------------------------------------- */

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to Code and Cash API",
    version: "1.0.0",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// API routes
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/applications", applicationRouter);
app.use("/api/admin", adminRouter);
app.use("/api/completed-tasks", completedTaskRouter);

/* -------------------------------------------------- */
/* 404 Handler */
/* -------------------------------------------------- */
app.use((req, res) => {
  res.status(404).json({
    status: "fail",
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/* -------------------------------------------------- */
/* Error Handler */
/* -------------------------------------------------- */
app.use(errorHandler);

/* -------------------------------------------------- */
/* Server */
/* -------------------------------------------------- */
const PORT = config.port || 5002;

const server = app.listen(PORT, () => {
  logger.info(
    `🚀 Server running in ${config.nodeEnv} mode on http://localhost:${PORT}`
  );
});

/* -------------------------------------------------- */
/* Graceful Shutdown (Mongoose v7+ SAFE) */
/* -------------------------------------------------- */
const shutdown = async (signal) => {
  console.log(`\n🔄 ${signal} received. Shutting down gracefully...`);

  try {
    await new Promise((resolve) => server.close(resolve));
    console.log("📡 HTTP server closed");

    await mongoose.connection.close();
    console.log("🗄️ MongoDB connection closed");

    console.log("✅ Shutdown complete");
    process.exit(0);
  } catch (err) {
    console.error("❌ Shutdown error:", err);
    process.exit(1);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("SIGQUIT", shutdown);

process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  shutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
  shutdown("UNHANDLED_REJECTION");
});
