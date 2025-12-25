import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "../../uploads/profile-images");

/**
 * Helper function to generate full profile image URL
 * @param {String} profileImage - Relative path to profile image
 * @param {Object} req - Express request object
 * @returns {String|null} - Full URL or null
 */
const getProfileImageUrl = (profileImage, req) => {
  if (!profileImage) return null;

  // Handle both relative and absolute paths
  if (
    profileImage.startsWith("http://") ||
    profileImage.startsWith("https://")
  ) {
    return profileImage;
  }

  // Ensure the path starts with /uploads
  const cleanPath = profileImage.startsWith("/uploads")
    ? profileImage
    : `/uploads${profileImage}`;

  // Generate full URL using the request protocol and host
  const backendUrl = `${req.protocol}://${req.get("host")}`;
  return `${backendUrl}${cleanPath}`;
};

/**
 * Get the current user's profile
 * @route GET /api/profile
 * @access Private
 */
export const getProfile = catchAsync(async (req, res, next) => {
  // User is already attached by the auth middleware
  const userId = req.user._id;

  // Get fresh user data from the database
  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user: {
        username: user.username || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        // name: user.name || "",
        // fullName: user.fullName || user.name || "",
        email: user.email,
        skill: user.skill || "",
        workExperience: user.workExperience || "",
        phone: user.phone || "",
        usesWhatsApp: user.usesWhatsApp || false,
        website: user.website || "",
        bio: user.bio || "",
        profileImage: user.profileImage || null,
        profileImageUrl: getProfileImageUrl(user.profileImage, req),
      },
    },
  });
});

/**
 * Update the user's profile information
 * @route PUT /api/profile
 * @access Private
 */
export const updateProfile = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const {
    username,
    firstName,
    lastName,
    email,
    skill,
    workExperience,
    phone,
    usesWhatsApp,
    website,
    bio,
  } = req.body;

  // Check if username already exists for another user
  if (username) {
    const existingUser = await User.findOne({
      username,
      _id: { $ne: userId },
    });

    if (existingUser) {
      return next(new AppError("Username is already taken", 400));
    }
  }

  // Check if email already exists for another user
  if (email) {
    const existingUser = await User.findOne({
      email,
      _id: { $ne: userId },
    });

    if (existingUser) {
      return next(
        new AppError("Email is already in use by another account", 400)
      );
    }
  }

  // Prepare update data
  const updateData = {
    username,
    firstName,
    lastName,
    email,
    skill,
    workExperience,
    phone,
    usesWhatsApp,
    website,
    bio,
  };

  // If both firstName and lastName are provided, update the name field too
  if (firstName && lastName) {
    updateData.name = `${firstName} ${lastName}`;
    updateData.fullName = `${firstName} ${lastName}`;
  } else if (firstName) {
    updateData.name = firstName;
    updateData.fullName = firstName;
  } else if (lastName) {
    updateData.name = lastName;
    updateData.fullName = lastName;
  }

  // Remove undefined fields
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  // Update the user
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Profile updated successfully",
    data: {
      user: {
        username: updatedUser.username || "",
        firstName: updatedUser.firstName || "",
        lastName: updatedUser.lastName || "",
        name: updatedUser.name || "",
        fullName: updatedUser.fullName || updatedUser.name || "",
        email: updatedUser.email,
        skill: updatedUser.skill || "",
        workExperience: updatedUser.workExperience || "",
        phone: updatedUser.phone || "",
        usesWhatsApp: updatedUser.usesWhatsApp || false,
        website: updatedUser.website || "",
        bio: updatedUser.bio || "",
        profileImage: updatedUser.profileImage || null,
        profileImageUrl: getProfileImageUrl(updatedUser.profileImage, req),
      },
    },
  });
});

/**
 * Update user's password
 * @route PUT /api/profile/password
 * @access Private
 */
export const updatePassword = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const { oldPassword, newPassword } = req.body;

  // Validate input
  if (!oldPassword || !newPassword) {
    return next(new AppError("Please provide both old and new passwords", 400));
  }

  if (newPassword.length < 6) {
    return next(
      new AppError("Password must be at least 6 characters long", 400)
    );
  }

  // Get user with password
  const user = await User.findById(userId).select("+password");

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Verify old password
  const isCorrectPassword = await bcrypt.compare(oldPassword, user.password);

  if (!isCorrectPassword) {
    return next(new AppError("Current password is incorrect", 401));
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password
  user.password = hashedPassword;
  await user.save();

  res.status(200).json({
    status: "success",
    message: "Password updated successfully",
  });
});

/**
 * Upload profile image
 * @route POST /api/profile/image
 * @access Private
 */
export const uploadProfileImage = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  try {
    // Check if file was uploaded
    if (!req.file) {
      return next(new AppError("No image file provided", 400));
    }

    // Validate file type
    if (!req.file.mimetype.startsWith("image/")) {
      // Delete the uploaded file if it's not an image
      fs.unlinkSync(req.file.path);
      return next(new AppError("Please upload only image files", 400));
    }

    // Get the current user to check for existing profile image
    const currentUser = await User.findById(userId);

    // Delete old profile image if it exists
    if (currentUser && currentUser.profileImage) {
      const oldImagePath = path.join(
        __dirname,
        "../../",
        currentUser.profileImage
      );
      try {
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      } catch (error) {
        console.log("Could not delete old profile image:", error.message);
      }
    }

    // Create the image URL (relative path from server root)
    const imageUrl = `/uploads/profile-images/${req.file.filename}`;

    // Update user with new image URL
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profileImage: imageUrl },
      { new: true }
    );

    if (!updatedUser) {
      // Delete the uploaded file if user update failed
      fs.unlinkSync(req.file.path);
      return next(new AppError("User not found", 404));
    }

    // Generate the full URL for the response
    const fullImageUrl = getProfileImageUrl(updatedUser.profileImage, req);

    res.status(200).json({
      status: "success",
      message: "Profile image uploaded successfully",
      data: {
        profileImage: updatedUser.profileImage,
        profileImageUrl: fullImageUrl,
      },
    });
  } catch (error) {
    // Delete the uploaded file if there was an error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.log("Could not delete uploaded file:", unlinkError.message);
      }
    }
    return next(new AppError(`Error uploading image: ${error.message}`, 500));
  }
});
