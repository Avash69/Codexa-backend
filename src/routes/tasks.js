// import express from "express";
// import {
//   getTasks,
//   getTaskById,
//   searchTasks,
//   getTaskCategories,
//   getTaskDifficulties,
//   getTaskStats,
//   getPriceRange,
// } from "../controllers/taskController.js";

// const router = express.Router();

// router.get("/", getTasks);
// router.get("/search", searchTasks);
// router.get("/categories", getTaskCategories);
// router.get("/difficulties", getTaskDifficulties);
// router.get("/stats", getTaskStats);
// router.get("/price-range", getPriceRange);
// router.get("/:id", getTaskById);

// export default router;


import express from "express";
import {
  getPriceRange,
  getTaskById,
  getTaskCategories,
  getTaskDifficulties,
  getTasks,
  getTaskStats,
  searchTasks,
} from "../controllers/taskController.js";
import {
  validateGetTask,
  validateGetTasks,
  validateSearchTasks,
} from "../middlewares/taskValidation.js";

const router = express.Router();

/**
 * Public routes (no authentication required)
 */

// GET /api/tasks - Get all tasks with filtering and pagination
router.get("/", validateGetTasks, getTasks);

// GET /api/tasks/search - Search tasks
router.get("/search", validateSearchTasks, searchTasks);

// GET /api/tasks/categories - Get task categories with statistics
router.get("/categories", getTaskCategories);

// GET /api/tasks/difficulties - Get task difficulties with statistics
router.get("/difficulties", getTaskDifficulties);

// GET /api/tasks/stats - Get task statistics
router.get("/stats", getTaskStats);

// GET /api/tasks/price-range - Get price range statistics
router.get("/price-range", getPriceRange);

// GET /api/tasks/:id - Get a single task by ID
router.get("/:id", validateGetTask, getTaskById);

/**
 * Protected routes (authentication required)
 * These would be for creating, updating, applying to tasks etc.
 * Currently just showing the structure for future implementation
 */

// POST /api/tasks - Create a new task (requires authentication)
// router.post('/', protect, createTask);

// PUT /api/tasks/:id - Update a task (requires authentication)
// router.put('/:id', protect, updateTask);

// DELETE /api/tasks/:id - Delete a task (requires authentication)
// router.delete('/:id', protect, deleteTask);

// POST /api/tasks/:id/apply - Apply to a task (requires authentication)
// router.post('/:id/apply', protect, applyToTask);

// GET /api/tasks/my/created - Get tasks created by current user (requires authentication)
// router.get('/my/created', protect, getMyCreatedTasks);

// GET /api/tasks/my/applied - Get tasks applied to by current user (requires authentication)
// router.get('/my/applied', protect, getMyAppliedTasks);

export default router;