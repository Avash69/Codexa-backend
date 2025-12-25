import {
  deleteUploadedFile,
  getFilesInfo,
} from "../middlewares/submissionUpload.js";
import CompletedTask from "../models/CompletedTask.js";
import Task from "../models/Task.js";
import TaskApplication from "../models/TaskApplication.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { logger } from "../utils/logger.js";

/**
 * Apply to a task
 */
export const applyToTask = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const { message } = req.body;
  const userId = req.user._id;

  // Check if task exists and is available - handle both ObjectId and numeric ID
  let task;
  const mongoose = await import("mongoose");

  if (mongoose.default.Types.ObjectId.isValid(taskId)) {
    task = await Task.findById(taskId);
  } else {
    // For numeric IDs, you need to have tasks with an 'id' field or use a different lookup
    // Since your model doesn't have a numeric 'id' field, this will fail
    return next(
      new AppError(
        "Invalid task ID format. Please use a valid task identifier.",
        400
      )
    );
  }

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  if (task.status !== "open") {
    return next(
      new AppError("This task is no longer available for applications", 400)
    );
  }

  if (task.clientId.toString() === userId.toString()) {
    return next(new AppError("You cannot apply to your own task", 400));
  }

  // Check if user has already applied
  const existingApplication = await TaskApplication.findOne({
    userId,
    taskId,
  });

  if (existingApplication) {
    return next(new AppError("You have already applied to this task", 400));
  }

  // Create new application
  const application = await TaskApplication.create({
    userId,
    taskId,
    message,
    expectedDelivery: task.deadline,
  });

  // Update task to include this user in applicants
  await Task.findByIdAndUpdate(taskId, {
    $addToSet: { applicants: userId },
  });

  // Populate the application with task and user details
  const populatedApplication = await TaskApplication.findById(application._id)
    .populate(
      "taskId",
      "title description company category difficulty payout deadline"
    )
    .populate("userId", "name email");

  res.status(201).json({
    success: true,
    message: "Application submitted successfully",
    data: populatedApplication,
  });
});

/**
 * Get user's applied tasks
 */
export const getMyAppliedTasks = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const {
    status,
    page = 1,
    limit = 10,
    sortBy = "appliedAt",
    sortOrder = "desc",
  } = req.query;

  // Build filter object
  const filter = { userId };

  if (status && status !== "all") {
    filter.status = status;
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === "desc" ? -1 : 1;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  try {
    // Get applications with populated task details
    const applications = await TaskApplication.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate({
        path: "taskId",
        select:
          "title description company category difficulty payout duration status deadline clientId",
        populate: {
          path: "clientId",
          select: "name email",
        },
      })
      .lean();

    // Get total count for pagination
    const totalCount = await TaskApplication.countDocuments(filter);

    // Transform applications for frontend
    const transformedApplications = applications.map((app) => ({
      id: app._id,
      applicationId: app._id,
      status: app.status,
      appliedAt: app.appliedAt,
      message: app.message,
      progress: app.progress,
      submissionCount: app.submissions?.length || 0,
      paymentStatus: app.paymentStatus,
      expectedDelivery: app.expectedDelivery,
      actualDelivery: app.actualDelivery,
      daysSinceApplication: app.daysSinceApplication,
      daysUntilDeadline: app.daysUntilDeadline,

      // Task details
      task: app.taskId
        ? {
            id: app.taskId._id,
            title: app.taskId.title,
            description: app.taskId.description,
            company: app.taskId.company,
            category: app.taskId.category,
            difficulty: app.taskId.difficulty,
            payout: app.taskId.payout,
            duration: app.taskId.duration,
            status: app.taskId.status,
            deadline: app.taskId.deadline,
            client: app.taskId.clientId,
          }
        : null,

      // Feedback
      feedback: app.feedback,

      // Recent submissions
      recentSubmissions: app.submissions?.slice(-3) || [],
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNum);
    const currentPage = parseInt(page);

    res.status(200).json({
      success: true,
      message: "Applied tasks retrieved successfully",
      data: {
        applications: transformedApplications,
        pagination: {
          currentPage,
          totalPages,
          totalCount,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1,
          nextPage: currentPage < totalPages ? currentPage + 1 : null,
          prevPage: currentPage > 1 ? currentPage - 1 : null,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching applied tasks:", error);
    return next(new AppError("Failed to fetch applied tasks", 500));
  }
});

/**
 * Get single application details
 */
export const getApplicationDetails = catchAsync(async (req, res, next) => {
  const { applicationId } = req.params;
  const userId = req.user._id;

  const application = await TaskApplication.findOne({
    _id: applicationId,
    userId,
  })
    .populate({
      path: "taskId",
      select:
        "title description company category difficulty payout duration status deadline clientId requirements skills",
      populate: {
        path: "clientId",
        select: "name email phone",
      },
    })
    .populate("userId", "name email");

  if (!application) {
    return next(new AppError("Application not found", 404));
  }

  // Transform application for frontend
  const transformedApplication = {
    id: application._id,
    applicationId: application._id,
    status: application.status,
    appliedAt: application.appliedAt,
    message: application.message,
    progress: application.progress,
    submissionCount: application.submissions?.length || 0,
    paymentStatus: application.paymentStatus,
    expectedDelivery: application.expectedDelivery,
    actualDelivery: application.actualDelivery,
    daysSinceApplication: application.daysSinceApplication,
    daysUntilDeadline: application.daysUntilDeadline,

    // Task details
    task: application.taskId
      ? {
          id: application.taskId._id,
          title: application.taskId.title,
          description: application.taskId.description,
          company: application.taskId.company,
          category: application.taskId.category,
          difficulty: application.taskId.difficulty,
          payout: application.taskId.payout,
          duration: application.taskId.duration,
          status: application.taskId.status,
          deadline: application.taskId.deadline,
          requirements: application.taskId.requirements || [],
          skills: application.taskId.skills || [],
          client: application.taskId.clientId,
        }
      : null,

    // Feedback
    feedback: application.feedback,

    // All submissions
    submissions: application.submissions || [],

    // User details
    user: application.userId,
  };

  res.status(200).json({
    success: true,
    message: "Application details retrieved successfully",
    data: transformedApplication,
  });
});

/**
 * Submit files for an application
 */
export const submitFiles = catchAsync(async (req, res, next) => {
  const { applicationId } = req.params;
  const userId = req.user._id;
  const files = req.files;

  if (!files || files.length === 0) {
    return next(new AppError("Please upload at least one file", 400));
  }

  // Find the application
  const application = await TaskApplication.findOne({
    _id: applicationId,
    userId,
  })
    .populate("userId", "name username")
    .populate("taskId", "title");

  if (!application) {
    return next(new AppError("Application not found", 404));
  }

  if (!application.canSubmitFiles()) {
    return next(
      new AppError("You cannot submit files for this application", 400)
    );
  }

  try {
    // Get file information
    const fileInfo = getFilesInfo(files);

    // Add files to application submissions
    application.submissions.push(...fileInfo);

    // Update status to submitted when files are uploaded
    let markCompleted = false;
    if (application.status === "accepted") {
      application.status = "submitted";
      // If you want to mark as completed immediately, set to "completed" here and set markCompleted = true
      // application.status = "completed";
      // markCompleted = true;
    }

    // Update progress if this is the first submission
    if (application.progress === 0) {
      application.progress = 25;
    }

    await application.save();

    // If marking as completed, also store in CompletedTask collection
    if (markCompleted || application.status === "completed") {
      // Store each file as a separate completed task record
      for (const file of fileInfo) {
        await CompletedTask.create({
          userId: application.userId._id || application.userId,
          username:
            application.userId.name || application.userId.username || "",
          taskId: application.taskId._id || application.taskId,
          taskName: application.taskId.title || "",
          file: {
            filename: file.filename,
            originalName: file.originalName,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype,
            uploadedAt: file.uploadedAt,
          },
          submittedAt: file.uploadedAt || new Date(),
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Files submitted successfully",
      data: {
        applicationId: application._id,
        submittedFiles: fileInfo,
        totalSubmissions: application.submissions.length,
        progress: application.progress,
      },
    });
  } catch (error) {
    // Delete uploaded files if database operation fails
    files.forEach((file) => {
      deleteUploadedFile(file.path);
    });

    logger.error("Error submitting files:", error);
    return next(new AppError("Failed to submit files", 500));
  }
});

/**
 * Update application progress
 */
export const updateProgress = catchAsync(async (req, res, next) => {
  const { applicationId } = req.params;
  const { progress } = req.body;
  const userId = req.user._id;

  if (progress < 0 || progress > 100) {
    return next(new AppError("Progress must be between 0 and 100", 400));
  }

  const application = await TaskApplication.findOneAndUpdate(
    { _id: applicationId, userId },
    { progress },
    { new: true, runValidators: true }
  );

  if (!application) {
    return next(new AppError("Application not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Progress updated successfully",
    data: {
      applicationId: application._id,
      progress: application.progress,
    },
  });
});

/**
 * Withdraw application
 */
export const withdrawApplication = catchAsync(async (req, res, next) => {
  const { applicationId } = req.params;
  const userId = req.user._id;

  const application = await TaskApplication.findOne({
    _id: applicationId,
    userId,
  });

  if (!application) {
    return next(new AppError("Application not found", 404));
  }

  if (!["pending", "accepted"].includes(application.status)) {
    return next(new AppError("You cannot withdraw this application", 400));
  }

  // Update application status
  application.status = "cancelled";
  await application.save();

  // Remove user from task applicants
  await Task.findByIdAndUpdate(application.taskId, {
    $pull: { applicants: userId },
  });

  res.status(200).json({
    success: true,
    message: "Application withdrawn successfully",
    data: {
      applicationId: application._id,
      status: application.status,
    },
  });
});

/**
 * Get user's application statistics
 */
export const getMyApplicationStats = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  try {
    const stats = await TaskApplication.getUserApplicationStats(userId);

    // Additional calculations
    const successRate =
      stats.totalApplications > 0
        ? (
            ((stats.acceptedApplications + stats.completedApplications) /
              stats.totalApplications) *
            100
          ).toFixed(1)
        : 0;

    const responseData = {
      totalApplications: stats.totalApplications || 0,
      pendingApplications: stats.pendingApplications || 0,
      acceptedApplications: stats.acceptedApplications || 0,
      completedApplications: stats.completedApplications || 0,
      rejectedApplications: stats.rejectedApplications || 0,
      totalSubmissions: stats.totalSubmissions || 0,
      averageProgress: Math.round(stats.averageProgress || 0),
      successRate: parseFloat(successRate),
    };

    res.status(200).json({
      success: true,
      message: "Application statistics retrieved successfully",
      data: responseData,
    });
  } catch (error) {
    logger.error("Error fetching application statistics:", error);
    return next(new AppError("Failed to fetch application statistics", 500));
  }
});

/**
 * Delete a submission file
 */
export const deleteSubmissionFile = catchAsync(async (req, res, next) => {
  const { applicationId, submissionId } = req.params;
  const userId = req.user._id;

  const application = await TaskApplication.findOne({
    _id: applicationId,
    userId,
  });

  if (!application) {
    return next(new AppError("Application not found", 404));
  }

  const submission = application.submissions.id(submissionId);
  if (!submission) {
    return next(new AppError("Submission file not found", 404));
  }

  // Delete the physical file
  deleteUploadedFile(submission.path);

  // Remove from database
  application.submissions.pull(submissionId);
  await application.save();

  res.status(200).json({
    success: true,
    message: "Submission file deleted successfully",
    data: {
      applicationId: application._id,
      deletedSubmissionId: submissionId,
      remainingSubmissions: application.submissions.length,
    },
  });
});

export default {
  applyToTask,
  getMyAppliedTasks,
  getApplicationDetails,
  submitFiles,
  updateProgress,
  withdrawApplication,
  getMyApplicationStats,
  deleteSubmissionFile,
};
