/**
 * Create Additional Test Users Script
 *
 * This script creates multiple test users for comprehensive testing
 * Run with: node scripts/create-additional-test-users.js
 */

import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import connectDB from "../src/config/db.js";
import User from "../src/models/User.js";

// Load environment variables
dotenv.config();

const testUsers = [
  {
    name: "John Developer",
    username: "johndeveloper",
    email: "john@example.com",
    password: "john123456",
    role: "user",
    skills: ["JavaScript", "React", "Node.js", "MongoDB"],
    experience: "senior",
    bio: "Full-stack developer with 5+ years experience",
    location: "San Francisco, CA",
    hourlyRate: 75,
    availability: "full-time",
  },
  {
    name: "Sarah Designer",
    username: "sarahdesigner",
    email: "sarah@example.com",
    password: "sarah123456",
    role: "user",
    skills: ["UI/UX Design", "Figma", "Adobe Creative Suite"],
    experience: "intermediate",
    bio: "Creative UI/UX designer passionate about user experience",
    location: "New York, NY",
    hourlyRate: 50,
    availability: "part-time",
  },
  {
    name: "Mike Tester",
    username: "miketester",
    email: "mike@example.com",
    password: "mike123456",
    role: "user",
    skills: ["QA Testing", "Automation", "Selenium"],
    experience: "intermediate",
    bio: "Quality assurance specialist with automation expertise",
    location: "Austin, TX",
    hourlyRate: 40,
    availability: "contract",
  },
];

const createAdditionalTestUsers = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log("🔧 Creating additional test users...");

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`✅ User ${userData.email} already exists!`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user
      const user = new User({
        ...userData,
        password: hashedPassword,
        profileComplete: true,
        socialLinks: {
          linkedin: `https://linkedin.com/in/${userData.name
            .toLowerCase()
            .replace(" ", "")}`,
          github: `https://github.com/${userData.name
            .toLowerCase()
            .replace(" ", "")}`,
          portfolio: `https://${userData.name
            .toLowerCase()
            .replace(" ", "")}-portfolio.com`,
        },
      });

      await user.save();
      console.log(`✅ Created user: ${userData.email}`);
    }

    console.log("\n🎯 All test users ready!");
    console.log("📧 Available test accounts:");
    testUsers.forEach((user) => {
      console.log(`• ${user.email} / ${user.password} (${user.role})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating additional test users:", error);
    process.exit(1);
  }
};

// Run the script
createAdditionalTestUsers();
