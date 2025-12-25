import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxLength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Task description is required"],
      trim: true,
      maxLength: [1000, "Description cannot exceed 1000 characters"],
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxLength: [50, "Company name cannot exceed 50 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: [
          "frontend",
          "backend",
          "fullstack",
          "mobile",
          "design",
          "devops",
        ],
        message:
          "Category must be one of: frontend, backend, fullstack, mobile, design, devops",
      },
    },
    difficulty: {
      type: String,
      required: [true, "Difficulty is required"],
      enum: {
        values: ["easy", "medium", "hard"],
        message: "Difficulty must be one of: easy, medium, hard",
      },
    },
    payout: {
      type: Number,
      required: [true, "Payout amount is required"],
      min: [0, "Payout cannot be negative"],
      max: [10000, "Payout cannot exceed $10,000"],
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 day"],
      max: [365, "Duration cannot exceed 365 days"],
    },
    status: {
      type: String,
      enum: {
        values: ["open", "in_progress", "completed", "cancelled"],
        message:
          "Status must be one of: open, in_progress, completed, cancelled",
      },
      default: "open",
    },
    requirements: [
      {
        type: String,
        trim: true,
        maxLength: [200, "Each requirement cannot exceed 200 characters"],
      },
    ],
    skills: [
      {
        type: String,
        trim: true,
        maxLength: [30, "Each skill cannot exceed 30 characters"],
      },
    ],
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Client ID is required"],
    },
    applicants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
      },
    ],
    submissions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        file: {
          type: String,
          required: true,
        },
        originalName: {
          type: String,
          required: true,
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["pending", "submitted", "approved", "rejected"],
          default: "submitted",
        },
        feedback: {
          type: String,
          trim: true,
        },
        reviewedAt: {
          type: Date,
        },
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deadline: {
      type: Date,
      validate: {
        validator: function (value) {
          return !value || value > new Date();
        },
        message: "Deadline must be in the future",
      },
    },
    featured: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
        maxLength: [20, "Each tag cannot exceed 20 characters"],
      },
    ],
    attachments: [
      {
        filename: String,
        originalName: String,
        path: String,
        size: Number,
        mimetype: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
taskSchema.index({ category: 1, difficulty: 1, status: 1 });
taskSchema.index({ payout: 1, status: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ featured: -1, createdAt: -1 });
taskSchema.index({
  title: "text",
  description: "text",
  company: "text",
  skills: "text",
});

// Virtual for applicant count
taskSchema.virtual("applicantCount").get(function () {
  return this.applicants ? this.applicants.length : 0;
});

// Virtual for days until deadline
taskSchema.virtual("daysUntilDeadline").get(function () {
  if (!this.deadline) return null;
  const diffTime = this.deadline.getTime() - new Date().getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Pre-save middleware to calculate deadline if not provided
taskSchema.pre("save", function (next) {
  if (!this.deadline && this.duration) {
    this.deadline = new Date(Date.now() + this.duration * 24 * 60 * 60 * 1000);
  }
  next();
});

// Static method to get task statistics
taskSchema.statics.getTaskStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalTasks: { $sum: 1 },
        openTasks: { $sum: { $cond: [{ $eq: ["$status", "open"] }, 1, 0] } },
        averagePayout: { $avg: "$payout" },
        totalPayout: { $sum: "$payout" },
      },
    },
  ]);
  return stats[0] || {};
};

// Static method to get category statistics
taskSchema.statics.getCategoryStats = async function () {
  return await this.aggregate([
    { $match: { status: "open", isActive: true } },
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        averagePayout: { $avg: "$payout" },
        minPayout: { $min: "$payout" },
        maxPayout: { $max: "$payout" },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// Instance method to check if user can apply
taskSchema.methods.canUserApply = function (userId) {
  return (
    this.status === "open" &&
    this.isActive &&
    !this.assignedTo &&
    !this.applicants.includes(userId) &&
    !this.clientId.equals(userId)
  );
};

// Middleware to log errors during save
taskSchema.post("save", function (error, doc, next) {
  if (error.name === "ValidationError") {
    console.error("Validation Error while saving Task:", error);
  } else {
    console.error("Error while saving Task:", error);
  }
  next(error);
});

// Middleware to log errors during update
taskSchema.post("findOneAndUpdate", function (error, doc, next) {
  if (error.name === "ValidationError") {
    console.error("Validation Error during Task update:", error);
  } else {
    console.error("Error during Task update:", error);
  }
  next(error);
});

const Task = mongoose.model("Task", taskSchema);

export default Task;
