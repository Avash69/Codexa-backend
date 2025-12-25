import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Task from "../models/Task.js";
import TaskApplication from "../models/TaskApplication.js";
import User from "../models/User.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { logger } from "../utils/logger.js";

/**
 * Get all completed tasks with user and file info (for admin dashboard)
 */
export const getCompletedTasks = catchAsync(async (req, res) => {
  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [completedApps, total] = await Promise.all([
    TaskApplication.find({ status: "completed" })
      .populate("userId", "name email")
      .populate("taskId", "title")
      .select("userId taskId submissions status updatedAt")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
    TaskApplication.countDocuments({ status: "completed" }),
  ]);

  res.status(200).json({
    status: "success",
    data: completedApps,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Check if user has admin access
 */
export const checkAdminAccess = catchAsync(async (req, res) => {
  // If this route is accessed, the user is already authenticated as admin
  // due to the adminAuth middleware
  logger.info(`👑 Admin access verified for user: ${req.user.email}`);

  res.status(200).json({
    status: "success",
    message: "Admin access verified",
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
 * Get admin dashboard statistics
 */
export const getAdminStats = catchAsync(async (req, res) => {
  console.log("🔍 Getting admin stats...");

  const totalUsers = await User.countDocuments();
  const totalTasks = await Task.countDocuments();
  // Count completed tasks (case-insensitive for status)
  const completedTasks = await Task.countDocuments({
    status: { $regex: /^completed$/i },
  });
  // Count pending tasks (case-insensitive for status)
  const pendingTasks = await Task.countDocuments({
    status: { $regex: /^pending$/i },
  });

  console.log(
    `📊 Stats: Users: ${totalUsers}, Tasks: ${totalTasks}, Completed: ${completedTasks}, Pending: ${pendingTasks}`
  );

  // Get users registered in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentUsers = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  // Get tasks created in the last 30 days
  const recentTasks = await Task.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  // Get task applications count
  const taskApplications = await Task.aggregate([
    { $unwind: "$applicants" },
    { $count: "total" },
  ]);

  // Get task submissions count
  const taskSubmissions = await Task.aggregate([
    { $unwind: "$submissions" },
    { $count: "total" },
  ]);

  // Get pending reviews (submissions that need review)
  const pendingReviews = await Task.aggregate([
    { $unwind: "$submissions" },
    {
      $match: {
        "submissions.status": { $in: ["pending", "submitted"] },
      },
    },
    { $count: "total" },
  ]);

  // Get approved submissions
  const approvedSubmissions = await Task.aggregate([
    { $unwind: "$submissions" },
    { $match: { "submissions.status": "approved" } },
    { $count: "total" },
  ]);

  // Get rejected submissions
  const rejectedSubmissions = await Task.aggregate([
    { $unwind: "$submissions" },
    { $match: { "submissions.status": "rejected" } },
    { $count: "total" },
  ]);

  logger.info(`🔍 Admin stats accessed by user: ${req.user.email}`);

  res.status(200).json({
    status: "success",
    data: {
      totalUsers,
      totalTasks,
      completedTasks,
      pendingTasks,
      recentUsers,
      recentTasks,
      totalApplications:
        taskApplications.length > 0 ? taskApplications[0].total : 0,
      totalSubmissions:
        taskSubmissions.length > 0 ? taskSubmissions[0].total : 0,
      pendingReviews: pendingReviews.length > 0 ? pendingReviews[0].total : 0,
      approvedSubmissions:
        approvedSubmissions.length > 0 ? approvedSubmissions[0].total : 0,
      rejectedSubmissions:
        rejectedSubmissions.length > 0 ? rejectedSubmissions[0].total : 0,
      lastUpdated: new Date().toISOString(),
    },
  });
});

/**
 * Get all registered users
 */
export const getAllUsers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const users = await User.find()
    .select("-password -sessions") // Exclude sensitive information
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalUsers = await User.countDocuments();
  const totalPages = Math.ceil(totalUsers / limit);

  logger.info(`📋 Admin ${req.user.email} retrieved ${users.length} users`);

  res.status(200).json({
    status: "success",
    data: {
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
});

/**
 * Get all tasks posted on the platform
 */
export const getAllTasks = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const tasks = await Task.find()
    .populate("applicants.user", "name email")
    .populate("submissions.user", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Debug payout values
  console.log("🔍 getAllTasks - Checking payout values:");
  tasks.forEach((task, index) => {
    console.log(
      `Task ${index + 1}: "${task.title}" - Payout: ${
        task.payout
      } (type: ${typeof task.payout})`
    );
  });

  const totalTasks = await Task.countDocuments();
  const totalPages = Math.ceil(totalTasks / limit);

  logger.info(`📋 Admin ${req.user.email} retrieved ${tasks.length} tasks`);

  res.status(200).json({
    status: "success",
    data: {
      tasks,
      pagination: {
        currentPage: page,
        totalPages,
        totalTasks,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
});

/**
 * View which users have applied to which tasks
 */
export const getUserTaskApplications = catchAsync(async (req, res) => {
  const applications = await Task.aggregate([
    { $unwind: "$applicants" },
    {
      $lookup: {
        from: "users",
        localField: "applicants.user",
        foreignField: "_id",
        as: "userInfo",
      },
    },
    { $unwind: "$userInfo" },
    {
      $project: {
        taskId: "$_id",
        taskTitle: "$title",
        taskCategory: "$category",
        taskPayout: "$payout",
        userId: "$applicants.user",
        userName: "$userInfo.name",
        userEmail: "$userInfo.email",
        applicationDate: "$applicants.appliedAt",
        applicationStatus: "$applicants.status",
      },
    },
    { $sort: { applicationDate: -1 } },
  ]);

  logger.info(
    `📋 Admin ${req.user.email} retrieved ${applications.length} task applications`
  );

  res.status(200).json({
    status: "success",
    data: {
      applications,
      total: applications.length,
    },
  });
});

/**
 * Get user submissions for a specific user
 */
export const getUserSubmissions = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select("name email");
  if (!user) {
    return res.status(404).json({
      status: "error",
      message: "User not found",
    });
  }

  const applications = await TaskApplication.find({ userId })
    .populate("taskId", "title category payout clientId")
    .populate("userId", "name email")
    .sort({ updatedAt: -1 });

  // Filter applications that have submissions
  const applicationsWithSubmissions = applications.filter(
    (app) => app.submissions && app.submissions.length > 0
  );

  logger.info(
    `📋 Admin ${req.user.email} retrieved ${applicationsWithSubmissions.length} applications with submissions for user ${user.name}`
  );

  res.status(200).json({
    status: "success",
    data: {
      user,
      applications: applicationsWithSubmissions,
      total: applicationsWithSubmissions.length,
    },
  });
});

/**
 * Download submission file
 */
export const downloadSubmissionFile = catchAsync(async (req, res) => {
  const { applicationId, submissionId } = req.params;

  const application = await TaskApplication.findById(applicationId)
    .populate("taskId", "title")
    .populate("userId", "name email");

  if (!application) {
    return res.status(404).json({
      status: "error",
      message: "Application not found",
    });
  }

  const submission = application.submissions.id(submissionId);
  if (!submission) {
    return res.status(404).json({
      status: "error",
      message: "Submission not found",
    });
  }

  const filePath = path.join(__dirname, "..", "..", submission.path);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      status: "error",
      message: "File not found",
    });
  }

  logger.info(
    `📥 Admin ${req.user.email} downloaded submission file: ${submission.originalName} from application ${applicationId}`
  );

  res.download(filePath, submission.originalName);
});

/**
 * Review and update application submission status
 */
export const reviewApplicationSubmission = catchAsync(async (req, res) => {
  const { applicationId } = req.params;
  const { status, comments } = req.body;

  const validStatuses = ["accepted", "needs_revision"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid status. Must be one of: accepted, needs_revision",
    });
  }

  const application = await TaskApplication.findById(applicationId)
    .populate("taskId", "title")
    .populate("userId", "name email");

  if (!application) {
    return res.status(404).json({
      status: "error",
      message: "Application not found",
    });
  }

  if (application.status !== "submitted") {
    return res.status(400).json({
      status: "error",
      message: "Application must be in submitted status to be reviewed",
    });
  }

  // Update application status based on review
  application.status = status === "accepted" ? "completed" : "needs_revision";

  // If application is now completed, also mark the Task as completed
  if (application.status === "completed" && application.taskId) {
    await Task.findByIdAndUpdate(application.taskId, { status: "completed" });
  }

  // Update admin review information
  application.adminReview = {
    reviewedBy: req.user._id,
    reviewedAt: new Date(),
    status: status,
    comments: comments || "",
  };

  await application.save();

  logger.info(
    `✅ Admin ${req.user.email} reviewed application ${applicationId} with status ${status}`
  );

  res.status(200).json({
    status: "success",
    message: "Application submission reviewed successfully",
    data: {
      applicationId,
      status: application.status,
      adminReview: application.adminReview,
      task: application.taskId,
      user: application.userId,
    },
  });
});

/**
 * Create/post new task (Admin only)
 */
export const createTask = catchAsync(async (req, res) => {
  const {
    title,
    description,
    category,
    difficulty,
    payout,
    deadline,
    requirements,
    tags,
    company,
    duration,
    status,
  } = req.body;

  // Validate required fields
  if (!title || !description || !category || !difficulty || !payout) {
    return res.status(400).json({
      status: "error",
      message:
        "Missing required fields: title, description, category, difficulty, payout",
    });
  }

  const task = new Task({
    title,
    description,
    category,
    difficulty,
    payout,
    company: company || "Codexa",
    clientId: req.user._id, // Admin is the client
    duration: duration || 7, // Default 7 days
    status: status || "open",
    deadline: deadline ? new Date(deadline) : null,
    requirements: requirements || [],
    tags: tags || [],
    createdBy: req.user._id,
    isActive: true,
  });

  await task.save();

  logger.info(`✅ Admin ${req.user.email} created new task: ${title}`);

  res.status(201).json({
    status: "success",
    message: "Task created successfully",
    data: {
      task,
    },
  });
});

/**
 * Delete any user
 */
export const deleteUser = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      status: "error",
      message: "User not found",
    });
  }

  // Prevent deleting other admin users
  if (
    user.role === "admin" &&
    user._id.toString() !== req.user._id.toString()
  ) {
    return res.status(403).json({
      status: "error",
      message: "Cannot delete other admin users",
    });
  }

  // Remove user from all task applications and submissions
  await Task.updateMany(
    { "applicants.user": userId },
    { $pull: { applicants: { user: userId } } }
  );

  await Task.updateMany(
    { "submissions.user": userId },
    { $pull: { submissions: { user: userId } } }
  );

  await User.findByIdAndDelete(userId);

  logger.info(
    `🗑️ Admin ${req.user.email} deleted user: ${user.name} (${user.email})`
  );

  res.status(200).json({
    status: "success",
    message: "User deleted successfully",
  });
});

/**
 * Delete any task
 */
export const deleteTask = catchAsync(async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId);
  if (!task) {
    return res.status(404).json({
      status: "error",
      message: "Task not found",
    });
  }

  await Task.findByIdAndDelete(taskId);

  logger.info(`🗑️ Admin ${req.user.email} deleted task: ${task.title}`);

  res.status(200).json({
    status: "success",
    message: "Task deleted successfully",
  });
});

/**
 * Get all applications across all tasks
 */

export const getAllApplications = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { status, taskId, userId, search } = req.query;

  // Build filter object
  const filter = {};
  if (status && status !== "all") {
    filter.status = status;
  }
  if (taskId) {
    filter.taskId = taskId;
  }
  if (userId) {
    filter.userId = userId;
  }
  if (search) {
    filter.$or = [
      { "userId.name": { $regex: search, $options: "i" } },
      { "taskId.title": { $regex: search, $options: "i" } },
    ];
  }

  const applications = await TaskApplication.find(filter)
    .select("+submissions") // Explicitly include submissions
    .populate("userId", "name email username")
    .populate(
      "taskId",
      "title company category difficulty payout status deadline"
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalApplications = await TaskApplication.countDocuments(filter);
  const totalPages = Math.ceil(totalApplications / limit);

  // Transform applications for frontend consistency
  const transformedApplications = applications.map((app) => ({
    id: app._id,
    applicationId: app._id,
    status: app.status,
    appliedAt: app.appliedAt,
    message: app.message,
    progress: app.progress,
    submissionCount: app.submissions?.length || 0,
    submissions: app.submissions || [], // Ensure submissions is included
    paymentStatus: app.paymentStatus,
    expectedDelivery: app.expectedDelivery,
    actualDelivery: app.actualDelivery,
    feedback: app.feedback,
    task: app.taskId
      ? {
          id: app.taskId._id,
          title: app.taskId.title,
          company: app.taskId.company,
          category: app.taskId.category,
          difficulty: app.taskId.difficulty,
          payout: app.taskId.payout,
          status: app.taskId.status,
          deadline: app.taskId.deadline,
        }
      : null,
    user: app.userId
      ? {
          id: app.userId._id,
          name: app.userId.name,
          email: app.userId.email,
          username: app.userId.username,
        }
      : null,
  }));

  logger.info(
    `📋 Admin ${req.user.email} retrieved ${applications.length} applications`
  );

  res.status(200).json({
    status: "success",
    data: {
      applications: transformedApplications,
      pagination: {
        currentPage: page,
        totalPages,
        totalApplications,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
});

/**
 * Get application details
 */
export const getApplicationDetails = catchAsync(async (req, res, next) => {
  const { applicationId } = req.params;

  const application = await TaskApplication.findById(applicationId)
    .select("+submissions") // Explicitly include submissions
    .populate("userId", "name email username bio skills hourlyRate")
    .populate(
      "taskId",
      "title description company category difficulty payout status deadline requirements"
    );

  if (!application) {
    return next(new AppError("Application not found", 404));
  }

  // Transform application for frontend consistency
  const transformedApplication = {
    id: application._id,
    applicationId: application._id,
    status: application.status,
    appliedAt: application.appliedAt,
    message: application.message,
    progress: application.progress,
    submissionCount: application.submissions?.length || 0,
    submissions: application.submissions || [], // Ensure submissions is included
    paymentStatus: application.paymentStatus,
    expectedDelivery: application.expectedDelivery,
    actualDelivery: application.actualDelivery,
    feedback: application.feedback,
    task: application.taskId
      ? {
          id: application.taskId._id,
          title: application.taskId.title,
          description: application.taskId.description,
          company: application.taskId.company,
          category: application.taskId.category,
          difficulty: application.taskId.difficulty,
          payout: application.taskId.payout,
          status: application.taskId.status,
          deadline: application.taskId.deadline,
          requirements: application.taskId.requirements || [],
        }
      : null,
    user: application.userId
      ? {
          id: application.userId._id,
          name: application.userId.name,
          email: application.userId.email,
          username: application.userId.username,
          bio: application.userId.bio,
          skills: application.userId.skills,
          hourlyRate: application.userId.hourlyRate,
        }
      : null,
  };

  logger.info(
    `🔍 Admin ${req.user.email} viewed application details: ${applicationId}`
  );

  res.status(200).json({
    status: "success",
    data: transformedApplication,
  });
});

/**
 * Update application status
 */
export const updateApplicationStatus = catchAsync(async (req, res) => {
  const { applicationId } = req.params;
  const { status, feedback } = req.body;

  const validStatuses = [
    "pending",
    "accepted",
    "rejected",
    "completed",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      status: "error",
      message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
  }

  const application = await TaskApplication.findById(applicationId)
    .populate("taskId", "title")
    .populate("userId", "name email");

  if (!application) {
    return res.status(404).json({
      status: "error",
      message: "Application not found",
    });
  }

  // Update application status
  application.status = status;
  if (feedback) {
    application.feedback = {
      comment: feedback,
      providedAt: new Date(),
    };
  }

  // If accepted, update task to mark user as assigned
  if (status === "accepted") {
    await Task.findByIdAndUpdate(application.taskId._id, {
      assignedTo: application.userId._id,
      status: "in_progress",
    });
  }

  await application.save();

  logger.info(
    `✅ Admin ${req.user.email} updated application ${applicationId} to ${status}`
  );

  res.status(200).json({
    status: "success",
    message: "Application status updated successfully",
    data: {
      application,
    },
  });
});

/**
 * Bulk update application status
 */
export const bulkUpdateApplicationStatus = catchAsync(async (req, res) => {
  const { applicationIds, status, feedback } = req.body;

  const validStatuses = [
    "pending",
    "accepted",
    "rejected",
    "completed",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      status: "error",
      message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
  }

  if (
    !applicationIds ||
    !Array.isArray(applicationIds) ||
    applicationIds.length === 0
  ) {
    return res.status(400).json({
      status: "error",
      message: "Application IDs are required",
    });
  }

  const applications = await TaskApplication.find({
    _id: { $in: applicationIds },
  })
    .populate("taskId", "title")
    .populate("userId", "name email");

  if (applications.length === 0) {
    return res.status(404).json({
      status: "error",
      message: "No applications found",
    });
  }

  // Update all applications
  for (const application of applications) {
    application.status = status;
    if (feedback) {
      application.feedback = {
        comment: feedback,
        providedAt: new Date(),
      };
    }

    // If accepted, update task to mark user as assigned
    if (status === "accepted") {
      await Task.findByIdAndUpdate(application.taskId._id, {
        assignedTo: application.userId._id,
        status: "in_progress",
      });
    }

    await application.save();
  }

  logger.info(
    `✅ Admin ${req.user.email} bulk updated ${applications.length} applications to ${status}`
  );

  res.status(200).json({
    status: "success",
    message: `${applications.length} applications updated successfully`,
    data: {
      updatedCount: applications.length,
      status,
    },
  });
});

/**
 * Get user details with applications
 */
export const getUserDetails = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select("-password -sessions");
  if (!user) {
    return res.status(404).json({
      status: "error",
      message: "User not found",
    });
  }

  // Get user's applications
  const applications = await TaskApplication.find({ userId })
    .populate(
      "taskId",
      "title company category difficulty payout status deadline"
    )
    .sort({ createdAt: -1 });

  // Get user's application stats
  const stats = {
    total: applications.length,
    pending: applications.filter((app) => app.status === "pending").length,
    accepted: applications.filter((app) => app.status === "accepted").length,
    rejected: applications.filter((app) => app.status === "rejected").length,
    completed: applications.filter((app) => app.status === "completed").length,
  };

  logger.info(`🔍 Admin ${req.user.email} viewed user details: ${userId}`);

  res.status(200).json({
    status: "success",
    data: {
      user,
      applications,
      stats,
    },
  });
});

/**
 * Update user details
 */
export const updateUserDetails = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { name, email, role, isActive } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      status: "error",
      message: "User not found",
    });
  }

  // Update user fields
  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  if (typeof isActive === "boolean") user.isActive = isActive;

  await user.save();

  logger.info(`✅ Admin ${req.user.email} updated user: ${userId}`);

  res.status(200).json({
    status: "success",
    message: "User updated successfully",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    },
  });
});

/**
 * Get task details with applications
 */
export const getTaskDetails = catchAsync(async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId)
    .populate("clientId", "name email")
    .populate("assignedTo", "name email");

  if (!task) {
    return res.status(404).json({
      status: "error",
      message: "Task not found",
    });
  }

  // Get task applications
  const applications = await TaskApplication.find({ taskId })
    .populate("userId", "name email username bio skills hourlyRate")
    .sort({ createdAt: -1 });

  // Get application stats for this task
  const applicationStats = {
    total: applications.length,
    pending: applications.filter((app) => app.status === "pending").length,
    accepted: applications.filter((app) => app.status === "accepted").length,
    rejected: applications.filter((app) => app.status === "rejected").length,
    completed: applications.filter((app) => app.status === "completed").length,
  };

  logger.info(`🔍 Admin ${req.user.email} viewed task details: ${taskId}`);

  res.status(200).json({
    status: "success",
    data: {
      task,
      applications,
      applicationStats,
    },
  });
});

/**
 * Update task details
 */
export const updateTaskDetails = catchAsync(async (req, res) => {
  const { taskId } = req.params;
  const updateData = req.body;

  const task = await Task.findById(taskId);
  if (!task) {
    return res.status(404).json({
      status: "error",
      message: "Task not found",
    });
  }

  // Update task fields
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] !== undefined) {
      task[key] = updateData[key];
    }
  });

  await task.save();

  logger.info(`✅ Admin ${req.user.email} updated task: ${taskId}`);

  res.status(200).json({
    status: "success",
    message: "Task updated successfully",
    data: {
      task,
    },
  });
});

/**
 * Get admin activity logs
 */
export const getAdminActivityLogs = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // This would typically come from a dedicated audit log collection
  // For now, we'll return a placeholder response
  const logs = [
    {
      id: "1",
      adminId: req.user._id,
      adminName: req.user.name,
      action: "UPDATE_APPLICATION_STATUS",
      entityType: "application",
      entityId: "app123",
      details: "Changed status from pending to accepted",
      timestamp: new Date(),
    },
    // Add more log entries as needed
  ];

  logger.info(`📋 Admin ${req.user.email} retrieved activity logs`);

  res.status(200).json({
    status: "success",
    data: {
      logs,
      pagination: {
        currentPage: page,
        totalPages: 1,
        totalLogs: logs.length,
        hasNext: false,
        hasPrev: false,
      },
    },
  });
});

/**
 * Get platform analytics
 */
export const getPlatformAnalytics = catchAsync(async (req, res) => {
  const { period = "30d" } = req.query;

  let dateFilter = {};
  const now = new Date();

  switch (period) {
    case "7d":
      dateFilter = {
        createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) },
      };
      break;
    case "30d":
      dateFilter = {
        createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) },
      };
      break;
    case "90d":
      dateFilter = {
        createdAt: { $gte: new Date(now - 90 * 24 * 60 * 60 * 1000) },
      };
      break;
    default:
      dateFilter = {};
  }

  // User registration analytics
  const userRegistrations = await User.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Task creation analytics
  const taskCreations = await Task.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Application analytics
  const applicationStats = await TaskApplication.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Category analytics
  const categoryStats = await Task.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        avgPayout: { $avg: "$payout" },
      },
    },
    { $sort: { count: -1 } },
  ]);

  logger.info(`📊 Admin ${req.user.email} retrieved platform analytics`);

  res.status(200).json({
    status: "success",
    data: {
      period,
      userRegistrations,
      taskCreations,
      applicationStats,
      categoryStats,
    },
  });
});

/**
 * Get all applications with submitted files for admin review
 */
export const getSubmittedApplications = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status = "submitted" } = req.query;

  const query = {
    submissions: { $exists: true, $ne: [] },
  };

  if (status) {
    query.status = status;
  }

  const applications = await TaskApplication.find(query)
    .populate("taskId", "title category payout clientId")
    .populate("userId", "name email profileImage")
    .sort({ updatedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await TaskApplication.countDocuments(query);

  logger.info(
    `📋 Admin ${req.user.email} retrieved ${applications.length} submitted applications (page ${page})`
  );

  res.status(200).json({
    status: "success",
    data: {
      applications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    },
  });
});

/**
 * Get application details with all submissions
 */
export const getApplicationSubmissionDetails = catchAsync(async (req, res) => {
  const { applicationId } = req.params;

  const application = await TaskApplication.findById(applicationId)
    .populate("taskId", "title category payout clientId description")
    .populate("userId", "name email profileImage")
    .populate("adminReview.reviewedBy", "name email");

  if (!application) {
    return res.status(404).json({
      status: "error",
      message: "Application not found",
    });
  }

  logger.info(
    `📋 Admin ${req.user.email} retrieved application details for ${applicationId}`
  );

  res.status(200).json({
    status: "success",
    data: {
      application,
    },
  });
});
