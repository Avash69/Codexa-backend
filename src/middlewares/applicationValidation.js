import { body, param, query, validationResult } from "express-validator";
import AppError from "../utils/appError.js";

/**
 * Middleware to check validation results
 */
export const checkValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    return next(new AppError("Validation failed", 400, errorMessages));
  }

  next();
};

/**
 * Validation rules for applying to a task
 */
export const validateApplyToTask = [
  param("taskId")
    .isMongoId()
    .withMessage("Task ID must be a valid MongoDB ObjectId"),

  body("message")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Message cannot exceed 500 characters")
    .trim(),

  checkValidation,
];

/**
 * Validation rules for getting applied tasks
 */
export const validateGetMyAppliedTasks = [
  query("status")
    .optional()
    .isIn(["all", "pending", "accepted", "rejected", "completed", "cancelled"])
    .withMessage(
      "Status must be one of: all, pending, accepted, rejected, completed, cancelled"
    ),

  query("page")
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage("Page must be an integer between 1 and 1000"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be an integer between 1 and 100"),

  query("sortBy")
    .optional()
    .isIn(["appliedAt", "status", "progress", "expectedDelivery"])
    .withMessage(
      "SortBy must be one of: appliedAt, status, progress, expectedDelivery"
    ),

  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("SortOrder must be either asc or desc"),

  checkValidation,
];

/**
 * Validation rules for getting application details
 */
export const validateGetApplicationDetails = [
  param("applicationId")
    .isMongoId()
    .withMessage("Application ID must be a valid MongoDB ObjectId"),

  checkValidation,
];

/**
 * Validation rules for updating progress
 */
export const validateUpdateProgress = [
  param("applicationId")
    .isMongoId()
    .withMessage("Application ID must be a valid MongoDB ObjectId"),

  body("progress")
    .notEmpty()
    .withMessage("Progress is required")
    .isInt({ min: 0, max: 100 })
    .withMessage("Progress must be an integer between 0 and 100"),

  checkValidation,
];

/**
 * Validation rules for withdrawing application
 */
export const validateWithdrawApplication = [
  param("applicationId")
    .isMongoId()
    .withMessage("Application ID must be a valid MongoDB ObjectId"),

  checkValidation,
];

/**
 * Validation rules for file submission
 */
export const validateSubmitFiles = [
  param("applicationId")
    .isMongoId()
    .withMessage("Application ID must be a valid MongoDB ObjectId"),

  checkValidation,
];

/**
 * Validation rules for deleting submission file
 */
export const validateDeleteSubmissionFile = [
  param("applicationId")
    .isMongoId()
    .withMessage("Application ID must be a valid MongoDB ObjectId"),

  param("submissionId")
    .isMongoId()
    .withMessage("Submission ID must be a valid MongoDB ObjectId"),

  checkValidation,
];

/**
 * Validation rules for task ID parameter
 */
export const validateTaskId = [
  param("taskId")
    .isMongoId()
    .withMessage("Task ID must be a valid MongoDB ObjectId"),

  checkValidation,
];

export default {
  validateApplyToTask,
  validateGetMyAppliedTasks,
  validateGetApplicationDetails,
  validateUpdateProgress,
  validateWithdrawApplication,
  validateSubmitFiles,
  validateDeleteSubmissionFile,
  validateTaskId,
  checkValidation,
};
