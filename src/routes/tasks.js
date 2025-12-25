import express from "express";
import {
  getTasks,
  getTaskById,
  searchTasks,
  getTaskCategories,
  getTaskDifficulties,
  getTaskStats,
  getPriceRange,
} from "../controllers/taskController.js";

const router = express.Router();

router.get("/", getTasks);
router.get("/search", searchTasks);
router.get("/categories", getTaskCategories);
router.get("/difficulties", getTaskDifficulties);
router.get("/stats", getTaskStats);
router.get("/price-range", getPriceRange);
router.get("/:id", getTaskById);

export default router;
