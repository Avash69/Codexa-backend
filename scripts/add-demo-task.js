import mongoose from "mongoose";
import Task from "../src/models/Task.js";

const addDemoTask = async () => {
  try {
    // Connect to the correct database
    await mongoose.connect("mongodb://localhost:27017/codeandcashdb", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to the database.");

    // Create a new task
    const demoTask = new Task({
      title: "Demo Task",
      description: "This is a demo task for testing purposes.",
      company: "Demo Company",
      category: "backend", // Updated to match valid categories
      difficulty: "medium", // Updated to match valid difficulties
      payout: 500,
      deadline: new Date("2025-07-31T23:59:59.000Z"),
      applicants: [],
      requiredSkills: ["JavaScript", "React"],
      benefits: ["Flexible hours", "Remote work"],
      requirements: ["Experience with React", "Good communication skills"],
      deliverables: ["Codebase", "Documentation"],
      location: "Remote",
      postedDate: new Date("2025-07-01T12:00:00.000Z"),
      estimatedTime: "2 weeks",
      duration: 2, // Updated to a valid number
      status: "open",
      clientId: new mongoose.Types.ObjectId("60f7c2b8e1b1c8a1b8e1b1c8"), // Replace with a valid client ID
    });

    // Save the task to the database
    await demoTask.save();

    console.log("Demo task added successfully:", demoTask);

    // Close the database connection
    await mongoose.connection.close();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Error adding demo task:", error);
  }
};

addDemoTask();
