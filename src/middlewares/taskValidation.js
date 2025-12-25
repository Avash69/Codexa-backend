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
 * Validation rules for getting tasks
 */
export const validateGetTasks = [
  query("category")
    .optional()
    .isIn([
      "all",
      "frontend",
      "backend",
      "fullstack",
      "mobile",
      "design",
      "devops",
    ])
    .withMessage(
      "Category must be one of: all, frontend, backend, fullstack, mobile, design, devops"
    ),

  query("difficulty")
    .optional()
    .isIn(["all", "easy", "medium", "hard"])
    .withMessage("Difficulty must be one of: all, easy, medium, hard"),

  query("search")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search query must be between 1 and 100 characters")
    .trim()
    .escape(),

  query("maxPrice")
    .optional()
    .isNumeric({ min: 0, max: 50000 })
    .withMessage("Max price must be a number between 0 and 50000"),

  query("minPrice")
    .optional()
    .isNumeric({ min: 0, max: 50000 })
    .withMessage("Min price must be a number between 0 and 50000"),

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
    .isIn([
      "createdAt",
      "updatedAt",
      "payout",
      "deadline",
      "difficulty",
      "title",
    ])
    .withMessage(
      "SortBy must be one of: createdAt, updatedAt, payout, deadline, difficulty, title"
    ),

  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("SortOrder must be either asc or desc"),

  query("featured")
    .optional()
    .isBoolean()
    .withMessage("Featured must be a boolean value"),

  query("status")
    .optional()
    .isIn(["all", "open", "in_progress", "completed", "cancelled"])
    .withMessage(
      "Status must be one of: all, open, in_progress, completed, cancelled"
    ),

  checkValidation,
];

/**
 * Validation rules for getting a single task
 */
export const validateGetTask = [
  param("id").custom((value) => {
    // Only allow MongoDB ObjectId (24 hex characters)
    if (/^[0-9a-fA-F]{24}$/.test(value)) {
      return true;
    }
    throw new Error(
      "Task ID must be a valid MongoDB ObjectId (24 hexadecimal characters)"
    );
  }),

  checkValidation,
];

/**
 * Validation rules for creating a task
 */
export const validateCreateTask = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 5, max: 100 })
    .withMessage("Title must be between 5 and 100 characters")
    .trim()
    .escape(),

  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 20, max: 1000 })
    .withMessage("Description must be between 20 and 1000 characters")
    .trim()
    .escape(),

  body("company")
    .notEmpty()
    .withMessage("Company name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Company name must be between 2 and 50 characters")
    .trim()
    .escape(),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn(["frontend", "backend", "fullstack", "mobile", "design", "devops"])
    .withMessage(
      "Category must be one of: frontend, backend, fullstack, mobile, design, devops"
    ),

  body("difficulty")
    .notEmpty()
    .withMessage("Difficulty is required")
    .isIn(["easy", "medium", "hard"])
    .withMessage("Difficulty must be one of: easy, medium, hard"),

  body("payout")
    .notEmpty()
    .withMessage("Payout is required")
    .isNumeric({ min: 10, max: 10000 })
    .withMessage("Payout must be a number between 10 and 10000"),

  body("duration")
    .notEmpty()
    .withMessage("Duration is required")
    .isInt({ min: 1, max: 365 })
    .withMessage("Duration must be an integer between 1 and 365 days"),

  body("skills")
    .optional()
    .isArray()
    .withMessage("Skills must be an array")
    .custom((skills) => {
      if (skills.length > 10) {
        throw new Error("Maximum 10 skills allowed");
      }
      return skills.every(
        (skill) =>
          typeof skill === "string" && skill.length >= 2 && skill.length <= 30
      );
    })
    .withMessage("Each skill must be a string between 2 and 30 characters"),

  body("requirements")
    .optional()
    .isArray()
    .withMessage("Requirements must be an array")
    .custom((requirements) => {
      if (requirements.length > 10) {
        throw new Error("Maximum 10 requirements allowed");
      }
      return requirements.every(
        (req) => typeof req === "string" && req.length >= 5 && req.length <= 200
      );
    })
    .withMessage(
      "Each requirement must be a string between 5 and 200 characters"
    ),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array")
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error("Maximum 10 tags allowed");
      }
      return tags.every(
        (tag) => typeof tag === "string" && tag.length >= 2 && tag.length <= 20
      );
    })
    .withMessage("Each tag must be a string between 2 and 20 characters"),

  body("deadline")
    .optional()
    .isISO8601()
    .withMessage("Deadline must be a valid ISO 8601 date")
    .custom((deadline) => {
      if (new Date(deadline) <= new Date()) {
        throw new Error("Deadline must be in the future");
      }
      return true;
    }),

  body("featured")
    .optional()
    .isBoolean()
    .withMessage("Featured must be a boolean value"),

  checkValidation,
];

/**
 * Validation rules for updating a task
 */
export const validateUpdateTask = [
  param("id")
    .isMongoId()
    .withMessage("Task ID must be a valid MongoDB ObjectId"),

  body("title")
    .optional()
    .isLength({ min: 5, max: 100 })
    .withMessage("Title must be between 5 and 100 characters")
    .trim()
    .escape(),

  body("description")
    .optional()
    .isLength({ min: 20, max: 1000 })
    .withMessage("Description must be between 20 and 1000 characters")
    .trim()
    .escape(),

  body("company")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Company name must be between 2 and 50 characters")
    .trim()
    .escape(),

  body("category")
    .optional()
    .isIn(["frontend", "backend", "fullstack", "mobile", "design", "devops"])
    .withMessage(
      "Category must be one of: frontend, backend, fullstack, mobile, design, devops"
    ),

  body("difficulty")
    .optional()
    .isIn(["easy", "medium", "hard"])
    .withMessage("Difficulty must be one of: easy, medium, hard"),

  body("payout")
    .optional()
    .isNumeric({ min: 10, max: 10000 })
    .withMessage("Payout must be a number between 10 and 10000"),

  body("duration")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("Duration must be an integer between 1 and 365 days"),

  body("status")
    .optional()
    .isIn(["open", "in_progress", "completed", "cancelled"])
    .withMessage(
      "Status must be one of: open, in_progress, completed, cancelled"
    ),

  checkValidation,
];

/**
 * Validation rules for search
 */
export const validateSearchTasks = [
  query("q")
    .notEmpty()
    .withMessage("Search query is required")
    .isLength({ min: 1, max: 100 })
    .withMessage("Search query must be between 1 and 100 characters")
    .trim()
    .escape(),

  // Include all other query validations from validateGetTasks
  ...validateGetTasks.slice(0, -1), // Remove the checkValidation middleware

  checkValidation,
];
