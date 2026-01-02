import express from "express";
import {
  bulkUpdateApplicationStatus,
  checkAdminAccess,
  createTask,
  deleteTask,
  deleteUser,
  downloadSubmissionFile,
  getAdminActivityLogs,
  getAdminStats,
  getAllApplications,
  getAllTasks,
  getAllUsers,
  getApplicationDetails,
  getApplicationSubmissionDetails,
  getCompletedTasks,
  getPlatformAnalytics,
  getSubmittedApplications,
  getTaskDetails,
  getUserDetails,
  getUserSubmissions,
  getUserTaskApplications,
  reviewApplicationSubmission,
  updateApplicationStatus,
  updateTaskDetails,
  updateUserDetails,
} from "../controllers/adminController.js";
import { protect } from "../middlewares/auth.js";
import Task from "../models/Task.js";
import User from "../models/User.js";

const router = express.Router();

// Admin middleware to check if user is admin
const adminAuth = (req, res, next) => {
  // First use the protect middleware
  protect(req, res, (err) => {
    if (err) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
      });
    }

    // Then check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        status: "error",
        message: "Access denied. Admin privileges required.",
      });
    }

    next();
  });
};

// Admin access verification
router.get("/check-access", adminAuth, checkAdminAccess);

// Debug endpoint to check actual database data
router.get("/debug", adminAuth, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const taskCount = await Task.countDocuments();

    const users = await User.find()
      .limit(5)
      .select("name email role createdAt");
    const tasks = await Task.find()
      .limit(5)
      .select("title company status payout difficulty category createdAt");

    console.log("🔍 DEBUG - Database check:");
    console.log(`Users in DB: ${userCount}`);
    console.log(`Tasks in DB: ${taskCount}`);
    console.log("Sample users:", users);
    console.log("Sample tasks with payout details:", tasks);

    // Check payout specifically
    tasks.forEach((task, index) => {
      console.log(
        `Task ${index + 1}: "${task.title}" - Payout: ${
          task.payout
        } (type: ${typeof task.payout})`
      );
    });

    res.json({
      status: "success",
      data: {
        userCount,
        taskCount,
        sampleUsers: users,
        sampleTasks: tasks,
      },
    });
  } catch (error) {
    console.error("❌ Debug endpoint error:", error);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Admin dashboard stats
router.get("/stats", adminAuth, getAdminStats);

// User management routes
router.get("/users", adminAuth, getAllUsers);
router.get("/users/:userId", adminAuth, getUserDetails);
router.put("/users/:userId", adminAuth, updateUserDetails);
router.delete("/users/:userId", adminAuth, deleteUser);

// Task management routes
router.get("/tasks", adminAuth, getAllTasks);
router.get("/tasks/:taskId", adminAuth, getTaskDetails);
router.post("/tasks", adminAuth, createTask);
router.put("/tasks/:taskId", adminAuth, updateTaskDetails);
router.delete("/tasks/:taskId", adminAuth, deleteTask);

// Application management routes
router.get("/applications", adminAuth, getAllApplications);
router.get("/applications/:applicationId", adminAuth, getApplicationDetails);
router.patch(
  "/applications/:applicationId/status",
  adminAuth,
  updateApplicationStatus
);
router.patch(
  "/applications/bulk-update",
  adminAuth,
  bulkUpdateApplicationStatus
);

// Legacy task application routes (for backward compatibility)
router.get("/task-applications", adminAuth, getUserTaskApplications);

// Analytics and reporting routes
router.get("/analytics", adminAuth, getPlatformAnalytics);
router.get("/activity-logs", adminAuth, getAdminActivityLogs);

router.get("/user-submissions/:userId", adminAuth, getUserSubmissions);

// Submission management for new workflow
router.get("/submissions", adminAuth, getSubmittedApplications);
router.get(
  "/applications/:applicationId/submissions",
  adminAuth,
  getApplicationSubmissionDetails
);
router.get(
  "/applications/:applicationId/submissions/:submissionId/download",
  adminAuth,
  downloadSubmissionFile
);
router.patch(
  "/applications/:applicationId/review",
  adminAuth,
  reviewApplicationSubmission
);

// Legacy submission file management (keeping for backward compatibility)
router.get(
  "/submissions/:submissionId/download",
  adminAuth,
  downloadSubmissionFile
);

// New route to get completed tasks
router.get("/completed-tasks", adminAuth, getCompletedTasks);

export default router;