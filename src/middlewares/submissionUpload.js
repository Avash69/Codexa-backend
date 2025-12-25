import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import AppError from "../utils/appError.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads");
const submissionsDir = path.join(uploadsDir, "submissions");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(submissionsDir)) {
  fs.mkdirSync(submissionsDir, { recursive: true });
}

// Configure storage for task submissions
const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, submissionsDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename: userId-taskId-timestamp.extension
    const extension = path.extname(file.originalname);
    const filename = `${req.user._id}-${
      req.params.taskId || "task"
    }-${Date.now()}${extension}`;
    cb(null, filename);
  },
});

// File filter to only allow PDF and DOCX files
const submissionFileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ];

  const allowedExtensions = [".pdf", ".docx", ".doc"];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (
    allowedTypes.includes(file.mimetype) &&
    allowedExtensions.includes(fileExtension)
  ) {
    cb(null, true);
  } else {
    cb(new AppError("Please upload only PDF or DOCX files", 400), false);
  }
};

// Configure multer for task submissions
const submissionUpload = multer({
  storage: submissionStorage,
  fileFilter: submissionFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Maximum 5 files per submission
  },
});

// Middleware for multiple file uploads (task submissions) with any field name
export const uploadTaskSubmission = submissionUpload.any();

// Middleware for single file upload (task submissions)
export const uploadSingleTaskSubmission = submissionUpload.any();

// Error handling middleware for submission uploads
export const handleSubmissionUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return next(
        new AppError("File size too large. Maximum size is 10MB per file", 400)
      );
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return next(
        new AppError(
          "Too many files. Maximum 5 files allowed per submission",
          400
        )
      );
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return next(
        new AppError(
          "Unexpected file field. Please use the correct field name",
          400
        )
      );
    }
    return next(new AppError(`Upload error: ${error.message}`, 400));
  }

  if (error.message.includes("Please upload only PDF or DOCX files")) {
    return next(error);
  }

  next(error);
};

// Utility function to delete uploaded files
export const deleteUploadedFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
  }
};

// Utility function to get file info
export const getFileInfo = (file) => {
  if (!file) return null;

  return {
    filename: file.filename,
    originalName: file.originalname,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    uploadedAt: new Date(),
  };
};

// Utility function to get multiple files info
export const getFilesInfo = (files) => {
  if (!files || !Array.isArray(files)) return [];

  return files.map((file) => getFileInfo(file));
};

export default {
  uploadTaskSubmission,
  uploadSingleTaskSubmission,
  handleSubmissionUploadError,
  deleteUploadedFile,
  getFileInfo,
  getFilesInfo,
};
