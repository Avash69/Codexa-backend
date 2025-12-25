import express from "express";
import { protect } from "../middlewares/auth.js";
import CompletedTask from "../models/CompletedTask.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";

const router = express.Router();

// Admin: Get all completed tasks (paginated)
router.get(
  "/",
  protect,
  catchAsync(async (req, res, next) => {
    // Only allow admin users
    if (!req.user || req.user.role !== "admin") {
      return next(new AppError("Admin access required", 403));
    }
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      CompletedTask.find().sort({ submittedAt: -1 }).skip(skip).limit(limit),
      CompletedTask.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

// Admin: Get a single completed task by ID
router.get(
  "/:id",
  protect,
  catchAsync(async (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
      return next(new AppError("Admin access required", 403));
    }
    const task = await CompletedTask.findById(req.params.id);
    if (!task) return next(new AppError("Completed task not found", 404));
    res.status(200).json({ success: true, data: task });
  })
);

// Admin: Download a file from CompletedTask
router.get(
  "/:id/download",
  protect,
  catchAsync(async (req, res, next) => {
    if (!req.user || req.user.role !== "admin") {
      return next(new AppError("Admin access required", 403));
    }
    const task = await CompletedTask.findById(req.params.id);
    if (!task || !task.file || !task.file.path) {
      return next(new AppError("File not found for this completed task", 404));
    }
    res.download(
      task.file.path,
      task.file.originalName || task.file.filename,
      (err) => {
        if (err) {
          return next(new AppError("Error downloading file", 500));
        }
      }
    );
  })
);

export default router;
