import mongoose from "mongoose";
const taskApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: [true, "Task ID is required"],
    },
    status: {
      type: String,
      enum: {
        values: [
          "pending",
          "accepted",
          "rejected",
          "submitted",
          "completed",
          "needs_revision",
          "cancelled",
        ],
        message:
          "Status must be one of: pending, accepted, rejected, submitted, completed, needs_revision, cancelled",
      },
      default: "pending",
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    message: {
      type: String,
      trim: true,
      maxLength: [500, "Application message cannot exceed 500 characters"],
    },
    // File submissions for the application
    submissions: [
      {
        filename: {
          type: String,
          required: true,
        },
        originalName: {
          type: String,
          required: true,
        },
        path: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          required: true,
        },
        mimetype: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Progress tracking
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    // Admin review for submissions
    adminReview: {
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reviewedAt: Date,
      status: {
        type: String,
        enum: ["pending", "accepted", "needs_revision"],
        default: "pending",
      },
      comments: {
        type: String,
        trim: true,
        maxLength: [1000, "Review comments cannot exceed 1000 characters"],
      },
    },
    // Client feedback
    feedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: {
        type: String,
        trim: true,
        maxLength: [500, "Feedback comment cannot exceed 500 characters"],
      },
      providedAt: Date,
    },
    // Payment tracking
    paymentStatus: {
      type: String,
      enum: {
        values: ["pending", "paid", "disputed"],
        message: "Payment status must be one of: pending, paid, disputed",
      },
      default: "pending",
    },
    paymentDate: Date,
    // Deadline tracking
    expectedDelivery: Date,
    actualDelivery: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
taskApplicationSchema.index({ userId: 1, taskId: 1 }, { unique: true });
taskApplicationSchema.index({ userId: 1, status: 1 });
taskApplicationSchema.index({ taskId: 1, status: 1 });
taskApplicationSchema.index({ appliedAt: -1 });

// Virtual for duration since application
taskApplicationSchema.virtual("daysSinceApplication").get(function () {
  if (!this.appliedAt) return null;
  const diffTime = new Date() - new Date(this.appliedAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for time until deadline
taskApplicationSchema.virtual("daysUntilDeadline").get(function () {
  if (!this.expectedDelivery) return null;
  const diffTime = new Date(this.expectedDelivery) - new Date();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Virtual for submission count
taskApplicationSchema.virtual("submissionCount").get(function () {
  return this.submissions ? this.submissions.length : 0;
});

// Static method to get user's application statistics
taskApplicationSchema.statics.getUserApplicationStats = async function (
  userId
) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalApplications: { $sum: 1 },
        pendingApplications: {
          $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
        },
        acceptedApplications: {
          $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] },
        },
        completedApplications: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
        },
        rejectedApplications: {
          $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
        },
        totalSubmissions: { $sum: { $size: "$submissions" } },
        averageProgress: { $avg: "$progress" },
      },
    },
  ]);
  return stats[0] || {};
};

// Instance method to check if user can submit files
taskApplicationSchema.methods.canSubmitFiles = function () {
  return this.status === "accepted" || this.status === "needs_revision";
};

// Instance method to check if application is active
taskApplicationSchema.methods.isActive = function () {
  return ["pending", "accepted"].includes(this.status);
};

const TaskApplication = mongoose.model(
  "TaskApplication",
  taskApplicationSchema
);

export default TaskApplication;
