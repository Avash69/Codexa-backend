import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import morgan from "morgan";

import connectDB from "./config/db.js";
import taskRoutes from "./routes/tasks.js";
import { errorHandler } from "./middlewares/errorHandler.js";

connectDB();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan("dev"));

app.use("/api/tasks", taskRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
