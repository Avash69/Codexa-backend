/**
 * Create Test User Script
 *
 * This     // Create test user
    const testUser = new User({
      name: "Test User",
      username: "testuser",
      email: testEmail,
      password: hashedPassword,
      role: "user",
      profileComplete: true,
      skills: ["JavaScript", "React", "Node.js"],
      experience: "intermediate",
      bio: "I am a test user for development and testing purposes.",
      location: "Test City, Test Country",
      hourlyRate: 25,
      availability: "full-time",
      portfolio: "https://testuser-portfolio.com",
      socialLinks: {
        linkedin: "https://linkedin.com/in/testuser",
        github: "https://github.com/testuser",
        portfolio: "https://testuser-portfolio.com"
      }
    });t user for testing user functionality
 * Run with: node scripts/create-test-user.js
 */

import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import connectDB from "../src/config/db.js";
import User from "../src/models/User.js";

// Load environment variables
dotenv.config();

const createTestUser = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log("🔧 Creating test user...");

    const testEmail = "testuser@example.com";
    const testPassword = "testpass123";

    // Check if test user already exists
    const existingUser = await User.findOne({ email: testEmail });

    if (existingUser) {
      console.log("✅ Test user already exists!");
      console.log(`📧 Email: ${testEmail}`);
      console.log(`🔑 Password: ${testPassword}`);
      console.log(`👤 Role: ${existingUser.role}`);
      console.log(`👤 Name: ${existingUser.name}`);
      console.log(`🆔 User ID: ${existingUser._id}`);

      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(testPassword, 12);

    // Create test user
    const testUser = new User({
      name: "Test User",
      email: testEmail,
      password: hashedPassword,
      role: "user",
      profileComplete: true,
      skills: ["JavaScript", "React", "Node.js"],
      experience: "intermediate",
      bio: "I am a test user for development and testing purposes.",
      location: "Test City, Test Country",
      hourlyRate: 25,
      availability: "full-time",
      portfolio: "https://testuser-portfolio.com",
      socialLinks: {
        linkedin: "https://linkedin.com/in/testuser",
        github: "https://github.com/testuser",
        portfolio: "https://testuser-portfolio.com",
      },
    });

    await testUser.save();

    console.log("✅ Test user created successfully!");
    console.log("📧 Email: " + testEmail);
    console.log("🔑 Password: " + testPassword);
    console.log("👤 Role: " + testUser.role);
    console.log("👤 Name: " + testUser.name);
    console.log("🆔 User ID: " + testUser._id);
    console.log("\n🎯 You can now use these credentials to:");
    console.log("• Login to your application");
    console.log("• Apply for tasks");
    console.log("• Test user functionality");
    console.log("• View applied tasks in my-tasks page");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating test user:", error);
    process.exit(1);
  }
};

// Run the script
createTestUser();
