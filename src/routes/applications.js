import express from "express";
import {
  applyToTask,
  deleteSubmissionFile,
  getApplicationDetails,
  getMyApplicationStats,
  getMyAppliedTasks,
  submitFiles,
  updateProgress,
  withdrawApplication,
} from "../controllers/applicationController.js";
import {
  validateApplyToTask,
  validateDeleteSubmissionFile,
  validateGetApplicationDetails,
  validateGetMyAppliedTasks,
  validateSubmitFiles,
  validateUpdateProgress,
  validateWithdrawApplication,
} from "../middlewares/applicationValidation.js";
import { protect } from "../middlewares/auth.js";
import {
  handleSubmissionUploadError,
  uploadTaskSubmission,
} from "../middlewares/submissionUpload.js";

const router = express.Router();

/**
 * All routes require authentication
 */
router.use(protect);

/**
 * Application Management Routes
 */

// POST /api/applications/apply/:taskId - Apply to a task
router.post("/apply/:taskId", validateApplyToTask, applyToTask);

// GET /api/applications/my - Get user's applied tasks
router.get("/my", validateGetMyAppliedTasks, getMyAppliedTasks);

// GET /api/applications/my/stats - Get user's application statistics
router.get("/my/stats", getMyApplicationStats);

// GET /api/applications/:applicationId - Get application details
router.get(
  "/:applicationId",
  validateGetApplicationDetails,
  getApplicationDetails
);

// PUT /api/applications/:applicationId/progress - Update application progress
router.put("/:applicationId/progress", validateUpdateProgress, updateProgress);

// DELETE /api/applications/:applicationId/withdraw - Withdraw application
router.delete(
  "/:applicationId/withdraw",
  validateWithdrawApplication,
  withdrawApplication
);

/**
 * File Submission Routes
 */

// POST /api/applications/:applicationId/submit - Submit files for an application
router.post(
  "/:applicationId/submit",
  validateSubmitFiles,
  uploadTaskSubmission,
  handleSubmissionUploadError,
  submitFiles
);

// DELETE /api/applications/:applicationId/submissions/:submissionId - Delete a submission file
router.delete(
  "/:applicationId/submissions/:submissionId",
  validateDeleteSubmissionFile,
  deleteSubmissionFile
);

export default router;
