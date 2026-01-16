import dotenv from "dotenv";
dotenv.config();

import express from "express";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import config from "./config/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { logger } from "./utils/logger.js";

// Routes
import adminRouter from "./routes/admin.js";
import applicationRouter from "./routes/applications.js";
import authRouter from "./routes/auth.js";
import completedTaskRouter from "./routes/completedTask.js";
import profileRouter from "./routes/profile.js";
import taskRouter from "./routes/tasks.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* -------------------------------------------------- */
/* App Init */
/* -------------------------------------------------- */
const app = express();

/* -------------------------------------------------- */
/* Database */
/* -------------------------------------------------- */
connectDB();

/* -------------------------------------------------- */
/* Middleware */
/* -------------------------------------------------- */

// Manual CORS (safe)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With, Content-Type, Authorization"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

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
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/applications", applicationRouter);
app.use("/api/admin", adminRouter);
app.use("/api/completed-tasks", completedTaskRouter);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is healthy" });
});

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to Code and Cash API",
    version: "1.0.0",
    environment: config.nodeEnv,
  });
});

/* -------------------------------------------------- */
/* 404 */
/* -------------------------------------------------- */
app.all("*", (req, res) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

/* -------------------------------------------------- */
/* Error Handler */
/* -------------------------------------------------- */
app.use(errorHandler);

/* -------------------------------------------------- */
/* Server */
/* -------------------------------------------------- */
const PORT = config.port || 5001;

const server = app.listen(PORT, () => {
  logger.info(
    `🚀 Server running in ${config.nodeEnv} mode on http://localhost:${PORT}`
  );
});

/* -------------------------------------------------- */
/* Graceful Shutdown (Mongoose v7+ SAFE) */
/* -------------------------------------------------- */

let isShuttingDown = false;

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n🔄 ${signal} received. Starting graceful shutdown...`);

  try {
    const mongoose = (await import("mongoose")).default;

    /* ---- Log active sessions (SAFE) ---- */
    if (mongoose.models.User) {
      const User = mongoose.models.User;

      const usersWithSessions = await User.find({
        "activeSessions.0": { $exists: true },
      });

      let totalSessions = 0;

      for (const user of usersWithSessions) {
        totalSessions += user.activeSessions.length;

        user.activeSessions.forEach((session) => {
          const duration =
            (Date.now() - new Date(session.createdAt)) / 1000 / 60;

          console.log("\n" + "=".repeat(60));
          console.log("🛑 SESSION ENDED (SERVER SHUTDOWN)");
          console.log(`👤 User: ${user.name} (${user.email})`);
          console.log(`📱 Device: ${session.device}`);
          console.log(`⏱️ Duration: ${Math.round(duration)} minutes`);
          console.log("=".repeat(60));
        });
      }

      if (totalSessions > 0) {
        console.log(
          `\n🛑 SERVER SHUTDOWN: ${totalSessions} active sessions terminated\n`
        );
      }
    }

    /* ---- Close HTTP server ---- */
    await new Promise((resolve) => server.close(resolve));
    console.log("📡 HTTP server closed");

    /* ---- Close MongoDB (NO CALLBACK) ---- */
    await mongoose.connection.close();
    console.log("🗄️ MongoDB connection closed");

    console.log("✅ Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Shutdown error:", error);
    process.exit(1);
  }
};

/* -------------------------------------------------- */
/* Process Handlers */
/* -------------------------------------------------- */

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGQUIT", () => gracefulShutdown("SIGQUIT"));

process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
  gracefulShutdown("UNHANDLED_REJECTION");
});
