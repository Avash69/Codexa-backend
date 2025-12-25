import Task from "../models/Task.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { logger } from "../utils/logger.js";

/**
 * Get all tasks with filtering, sorting, and pagination
 */
export const getTasks = catchAsync(async (req, res, next) => {
  const {
    category,
    difficulty,
    search,
    maxPrice,
    minPrice,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    featured,
    status = "open",
  } = req.query;

  // Build filter object
  const filter = {
    isActive: true,
    status: status === "all" ? { $ne: "cancelled" } : status,
  };

  // Category filter
  if (category && category !== "all") {
    filter.category = category;
  }

  // Difficulty filter
  if (difficulty && difficulty !== "all") {
    filter.difficulty = difficulty;
  }

  // Price range filters
  if (maxPrice || minPrice) {
    filter.payout = {};
    if (maxPrice) filter.payout.$lte = parseInt(maxPrice);
    if (minPrice) filter.payout.$gte = parseInt(minPrice);
  }

  // Search filter
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
      { skills: { $in: [new RegExp(search, "i")] } },
      { tags: { $in: [new RegExp(search, "i")] } },
    ];
  }

  // Featured filter
  if (featured === "true") {
    filter.featured = true;
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  // Build sort object
  const sort = {};
  if (sortBy === "payout") {
    sort.payout = sortOrder === "desc" ? -1 : 1;
  } else if (sortBy === "deadline") {
    sort.deadline = sortOrder === "desc" ? -1 : 1;
  } else if (sortBy === "difficulty") {
    // Custom sort for difficulty
    sort.difficulty = sortOrder === "desc" ? -1 : 1;
  } else {
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;
  }

  // Add featured tasks to top if not specifically filtering
  if (!featured) {
    sort.featured = -1;
  }

  try {
    // Execute query with population
    const tasks = await Task.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate("clientId", "name email avatar")
      .populate("applicants", "name email avatar")
      .populate("assignedTo", "name email avatar")
      .lean();

    // Get total count for pagination
    const totalCount = await Task.countDocuments(filter);

    // Transform tasks for frontend
    const transformedTasks = tasks.map((task) => {
      const transformedTask = {
        id: task._id,
        title: task.title,
        description: task.description,
        company: task.company,
        category: task.category,
        difficulty: task.difficulty,
        payout: task.payout,
        duration: task.duration,
        status: task.status,
        skills: task.skills || [],
        requirements: task.requirements || [],
        tags: task.tags || [],
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        deadline: task.deadline,
        featured: task.featured,
        client: task.clientId,
        applicants: task.applicants || [],
        applicantCount: task.applicants?.length || 0,
        assignedTo: task.assignedTo,
        daysUntilDeadline: task.deadline
          ? Math.ceil(
              (new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24)
            )
          : null,
      };

      // Only include taskId if it exists
      if (task.taskId !== undefined && task.taskId !== null) {
        transformedTask.taskId = task.taskId;
      }

      return transformedTask;
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNum);
    const currentPage = parseInt(page);

    res.status(200).json({
      success: true,
      message: "Tasks retrieved successfully",
      data: {
        tasks: transformedTasks,
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
    logger.error("Error fetching tasks:", error);
    return next(new AppError("Failed to fetch tasks", 500));
  }
});

/**
 * Get task categories with statistics
 */
export const getTaskCategories = catchAsync(async (req, res, next) => {
  try {
    // Get category statistics from database
    const categoryStats = await Task.getCategoryStats();

    // Define category metadata
    const categoryMetadata = {
      frontend: {
        label: "Frontend Development",
        icon: "🎨",
        description: "UI/UX, React, Vue, Angular, HTML/CSS",
      },
      backend: {
        label: "Backend Development",
        icon: "⚙️",
        description: "APIs, databases, server-side logic",
      },
      fullstack: {
        label: "Full Stack Development",
        icon: "🔄",
        description: "End-to-end application development",
      },
      mobile: {
        label: "Mobile Development",
        icon: "📱",
        description: "iOS, Android, React Native, Flutter",
      },
      design: {
        label: "Design",
        icon: "🎨",
        description: "UI/UX design, graphics, branding",
      },
      devops: {
        label: "DevOps",
        icon: "🚀",
        description: "CI/CD, cloud infrastructure, deployment",
      },
    };

    // Combine statistics with metadata
    const categories = Object.keys(categoryMetadata).map((categoryId) => {
      const stats = categoryStats.find((stat) => stat._id === categoryId) || {
        count: 0,
        averagePayout: 0,
        minPayout: 0,
        maxPayout: 0,
      };

      return {
        id: categoryId,
        ...categoryMetadata[categoryId],
        count: stats.count,
        averagePayout: Math.round(stats.averagePayout || 0),
        minPayout: stats.minPayout || 0,
        maxPayout: stats.maxPayout || 0,
      };
    });

    res.status(200).json({
      success: true,
      message: "Categories retrieved successfully",
      data: categories,
    });
  } catch (error) {
    logger.error("Error fetching categories:", error);
    return next(new AppError("Failed to fetch categories", 500));
  }
});

/**
 * Get task difficulties with statistics
 */
export const getTaskDifficulties = catchAsync(async (req, res, next) => {
  try {
    // Get difficulty statistics
    const difficultyStats = await Task.aggregate([
      { $match: { status: "open", isActive: true } },
      {
        $group: {
          _id: "$difficulty",
          count: { $sum: 1 },
          averagePayout: { $avg: "$payout" },
          minPayout: { $min: "$payout" },
          maxPayout: { $max: "$payout" },
        },
      },
    ]);

    // Define difficulty metadata
    const difficultyMetadata = {
      easy: {
        label: "Easy",
        color: "text-green-500",
        description: "Beginner-friendly tasks",
        estimatedHours: "5-20 hours",
      },
      medium: {
        label: "Medium",
        color: "text-yellow-500",
        description: "Intermediate level tasks",
        estimatedHours: "20-50 hours",
      },
      hard: {
        label: "Hard",
        color: "text-red-500",
        description: "Advanced and complex tasks",
        estimatedHours: "50+ hours",
      },
    };

    // Combine statistics with metadata
    const difficulties = Object.keys(difficultyMetadata).map((difficultyId) => {
      const stats = difficultyStats.find(
        (stat) => stat._id === difficultyId
      ) || {
        count: 0,
        averagePayout: 0,
        minPayout: 0,
        maxPayout: 0,
      };

      return {
        id: difficultyId,
        ...difficultyMetadata[difficultyId],
        count: stats.count,
        averagePayout: Math.round(stats.averagePayout || 0),
        minPayout: stats.minPayout || 0,
        maxPayout: stats.maxPayout || 0,
      };
    });

    res.status(200).json({
      success: true,
      message: "Difficulties retrieved successfully",
      data: difficulties,
    });
  } catch (error) {
    logger.error("Error fetching difficulties:", error);
    return next(new AppError("Failed to fetch difficulties", 500));
  }
});

/**
 * Get task statistics
 */
export const getTaskStats = catchAsync(async (req, res, next) => {
  try {
    const stats = await Task.getTaskStats();

    // Additional statistics
    const additionalStats = await Task.aggregate([
      {
        $group: {
          _id: null,
          totalOpenTasks: {
            $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] },
          },
          totalInProgressTasks: {
            $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
          },
          totalCompletedTasks: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          totalFeaturedTasks: { $sum: { $cond: ["$featured", 1, 0] } },
          highestPayout: { $max: "$payout" },
          lowestPayout: { $min: "$payout" },
        },
      },
    ]);

    const combined = {
      ...stats,
      ...additionalStats[0],
    };

    res.status(200).json({
      success: true,
      message: "Task statistics retrieved successfully",
      data: combined,
    });
  } catch (error) {
    logger.error("Error fetching task statistics:", error);
    return next(new AppError("Failed to fetch task statistics", 500));
  }
});

/**
 * Get a single task by ID (MongoDB ObjectId only)
 */
export const getTaskById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Check if the ID is a valid MongoDB ObjectId (24 hex characters)
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return next(new AppError("Invalid task ID format", 400));
  }

  const task = await Task.findById(id)
    .populate("clientId", "name email avatar")
    .populate("applicants.user", "name email avatar")
    .populate("assignedTo", "name email avatar");

  if (!task) {
    return next(new AppError("Task not found", 404));
  }

  // Helper function to format dates
  const formatDate = (date) => {
    if (!date) return "";
    const now = new Date();
    const taskDate = new Date(date);
    const diffTime = Math.abs(now - taskDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays <= 7) return `${diffDays} days ago`;
    return taskDate.toISOString().split("T")[0];
  };

  // Helper function to format deadline
  const formatDeadline = (deadline) => {
    if (!deadline) return "";
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Expired";
    if (diffDays === 1) return "1 day";
    return `${diffDays} days`;
  };

  // Generate company logo from company name
  const generateCompanyLogo = (companyName) => {
    if (!companyName) return "??";
    const words = companyName.split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return companyName.substring(0, 2).toUpperCase();
  };

  // Transform task for frontend with required structure
  const transformedTask = {
    _id: task._id.toString(),
    title: task.title || "",
    company: task.company || "",
    companyLogo: generateCompanyLogo(task.company),
    postedDate: formatDate(task.createdAt),
    deadline: formatDeadline(task.deadline),
    location: "Remote",
    estimatedTime: task.duration ? `${task.duration} days` : "",
    applicants: `${task.applicants?.length || 0} developers`,
    payout: task.payout || 0,
    difficulty:
      task.difficulty === "easy"
        ? "Easy"
        : task.difficulty === "medium"
        ? "Medium"
        : task.difficulty === "hard"
        ? "Hard"
        : "Medium",
    urgency: task.featured ? "High" : "Medium",
    category: task.category
      ? task.category.charAt(0).toUpperCase() + task.category.slice(1)
      : "",
    overview: task.description || "",
    requirements: task.requirements || [],
    deliverables: [
      "Complete source code",
      "Documentation",
      "Testing and quality assurance",
    ],
    requiredSkills: task.skills || [],
    benefits: [
      "Work with cutting-edge technology",
      "Flexible working hours",
      "Portfolio addition",
      "Professional development",
    ],
  };

  res.status(200).json({
    task: transformedTask,
  });
});

/**
 * Get price range statistics
 */
export const getPriceRange = catchAsync(async (req, res, next) => {
  try {
    const priceStats = await Task.aggregate([
      { $match: { status: "open", isActive: true } },
      {
        $group: {
          _id: null,
          minPrice: { $min: "$payout" },
          maxPrice: { $max: "$payout" },
          averagePrice: { $avg: "$payout" },
        },
      },
    ]);

    const stats = priceStats[0] || {
      minPrice: 0,
      maxPrice: 5000,
      averagePrice: 0,
    };

    res.status(200).json({
      success: true,
      message: "Price range retrieved successfully",
      data: {
        min: stats.minPrice,
        max: stats.maxPrice,
        average: Math.round(stats.averagePrice),
      },
    });
  } catch (error) {
    logger.error("Error fetching price range:", error);
    return next(new AppError("Failed to fetch price range", 500));
  }
});

/**
 * Search tasks with advanced filters
 */
export const searchTasks = catchAsync(async (req, res, next) => {
  const { q, ...filters } = req.query;

  // Use the main getTasks function with search query
  req.query = { ...filters, search: q };
  return getTasks(req, res, next);
});
