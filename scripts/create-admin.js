/**
 * Create Admin User Script
 *
 * This script creates an admin user for testing admin functionality
 * Run with: node scripts/create-admin.js
 */

import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import connectDB from "../src/config/db.js";
import User from "../src/models/User.js";

// Load environment variables
dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log("🔧 Creating admin user...");

    const adminEmail = "admin@codeandcash.com";
    const adminPassword = "admin123456";

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("✅ Admin user already exists!");
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
      console.log(`👑 Role: ${existingAdmin.role}`);

      // Update role to admin if not already
      if (existingAdmin.role !== "admin") {
        existingAdmin.role = "admin";
        await existingAdmin.save();
        console.log("🔄 Updated user role to admin");
      }

      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const adminUser = new User({
      name: "System Administrator",
      username: "admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      firstName: "System",
      lastName: "Administrator",
      bio: "System administrator with full access to all platform features",
    });

    await adminUser.save();

    console.log("✅ Admin user created successfully!");
    console.log("==========================================");
    console.log("📧 Email:", adminEmail);
    console.log("🔑 Password:", adminPassword);
    console.log("👑 Role: admin");
    console.log("==========================================");
    console.log(
      "🚀 You can now use these credentials to test admin functionality"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error.message);
    process.exit(1);
  }
};

// Run the script
createAdminUser();
