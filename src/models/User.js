import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Basic information
    username: {
      type: String,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: true, // We'll handle password visibility in the controllers
    },

    // Professional information
    skill: {
      type: String,
      trim: true,
    },
    workExperience: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      maxlength: 500,
    },

    // Contact information
    phone: {
      type: String,
      trim: true,
    },
    usesWhatsApp: {
      type: Boolean,
      default: false,
    },
    website: {
      type: String,
      trim: true,
    },

    // Profile image
    profileImage: {
      type: String, // URL to stored image or base64 encoded string
    },

    // Authentication related
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    activeSessions: [
      {
        token: String,
        expiresAt: Date,
        device: String,
        ipAddress: String,
        createdAt: Date,
      },
    ],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Remove sensitive fields when converting to JSON
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.activeSessions;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpire;
  return userObject;
};

const User = mongoose.model("User", userSchema);

export default User;
