import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { logger } from "../utils/logger.js";

// Load environment variables
dotenv.config();

// Sample tasks data
const sampleTasks = [
  {
    title: "Build a React Component Library",
    description:
      "Create a comprehensive React component library with TypeScript support, Storybook documentation, and comprehensive testing suite. The library should include common UI components like buttons, forms, modals, and data tables with consistent styling and accessibility features.",
    company: "TechCorp",
    category: "frontend",
    difficulty: "medium",
    payout: 250,
    duration: 5,
    skills: ["React", "TypeScript", "Storybook", "Testing", "CSS"],
    requirements: [
      "3+ years of React experience",
      "Strong TypeScript knowledge",
      "Experience with component libraries",
      "Testing experience (Jest, React Testing Library)",
    ],
    tags: ["React", "TypeScript", "Components", "Library"],
    featured: true,
  },
  {
    title: "API Integration for Payment Gateway",
    description:
      "Integrate Stripe payment gateway with existing Node.js backend. Implement secure payment processing, webhook handling, subscription management, and comprehensive error handling with proper logging and monitoring.",
    company: "DataSys",
    category: "backend",
    difficulty: "hard",
    payout: 300,
    duration: 7,
    skills: ["Node.js", "Express", "Stripe API", "MongoDB", "Security"],
    requirements: [
      "Payment gateway integration experience",
      "Strong Node.js and Express skills",
      "Security best practices knowledge",
      "Database design experience",
    ],
    tags: ["Stripe", "Payments", "API", "Security"],
    featured: true,
  },
  {
    title: "Mobile App Bug Fixes",
    description:
      "Fix responsive design issues on the checkout page of our React Native mobile application. Issues include layout problems on different screen sizes, touch interactions, and iOS-specific styling problems.",
    company: "MobileFirst",
    category: "mobile",
    difficulty: "easy",
    payout: 100,
    duration: 2,
    skills: ["React Native", "JavaScript", "CSS", "Mobile Development"],
    requirements: [
      "React Native experience",
      "Mobile responsive design knowledge",
      "Cross-platform development experience",
    ],
    tags: ["React Native", "Mobile", "Bug Fix", "UI"],
    featured: false,
  },
  {
    title: "Database Query Optimization",
    description:
      "Optimize MongoDB queries for better performance in our e-commerce application. Analyze slow queries, implement proper indexing, and optimize aggregation pipelines to reduce response times by at least 50%.",
    company: "WebSolutions",
    category: "backend",
    difficulty: "medium",
    payout: 200,
    duration: 4,
    skills: ["MongoDB", "Database Optimization", "Node.js", "Performance"],
    requirements: [
      "MongoDB expertise",
      "Database optimization experience",
      "Performance tuning skills",
      "Query analysis experience",
    ],
    tags: ["MongoDB", "Performance", "Database", "Optimization"],
    featured: false,
  },
  {
    title: "JWT Authentication System",
    description:
      "Implement a complete JWT authentication system with refresh tokens, role-based access control, password reset functionality, and secure session management. Include comprehensive API documentation and testing.",
    company: "SecureAuth",
    category: "backend",
    difficulty: "hard",
    payout: 350,
    duration: 6,
    skills: ["Node.js", "JWT", "Security", "Authentication", "Express"],
    requirements: [
      "Authentication system experience",
      "JWT and security best practices",
      "Role-based access control knowledge",
      "API documentation skills",
    ],
    tags: ["JWT", "Authentication", "Security", "API"],
    featured: true,
  },
  {
    title: "Modern Landing Page Design",
    description:
      "Create a responsive landing page using Tailwind CSS with modern design principles. Include animations, interactive elements, contact forms, and ensure perfect mobile responsiveness with fast loading times.",
    company: "DesignCo",
    category: "frontend",
    difficulty: "easy",
    payout: 150,
    duration: 3,
    skills: ["HTML", "CSS", "Tailwind CSS", "JavaScript", "Responsive Design"],
    requirements: [
      "Modern CSS and HTML skills",
      "Tailwind CSS experience",
      "Responsive design expertise",
      "Animation and interaction knowledge",
    ],
    tags: ["Landing Page", "Tailwind", "Design", "Responsive"],
    featured: false,
  },
  {
    title: "Full Stack E-commerce Platform",
    description:
      "Build a complete e-commerce platform with React frontend, Node.js backend, payment integration, inventory management, user authentication, and admin dashboard. Include shopping cart, order management, and email notifications.",
    company: "EcommercePlus",
    category: "fullstack",
    difficulty: "hard",
    payout: 800,
    duration: 20,
    skills: ["React", "Node.js", "MongoDB", "Express", "Payment Integration"],
    requirements: [
      "Full stack development experience",
      "E-commerce platform knowledge",
      "Payment integration experience",
      "Database design skills",
    ],
    tags: ["E-commerce", "Full Stack", "React", "Node.js"],
    featured: true,
  },
  {
    title: "Mobile Game Development",
    description:
      "Develop a simple mobile puzzle game using React Native with game mechanics, scoring system, local storage for high scores, and engaging user interface with smooth animations.",
    company: "GameStudio",
    category: "mobile",
    difficulty: "medium",
    payout: 400,
    duration: 10,
    skills: ["React Native", "Game Development", "Animation", "Mobile"],
    requirements: [
      "React Native experience",
      "Game development knowledge",
      "Animation and UI skills",
      "Mobile app deployment experience",
    ],
    tags: ["Game", "Mobile", "React Native", "Animation"],
    featured: false,
  },
  {
    title: "DevOps Pipeline Setup",
    description:
      "Set up a complete CI/CD pipeline using GitHub Actions, Docker, and AWS. Include automated testing, code quality checks, deployment to staging and production environments, and monitoring setup.",
    company: "CloudTech",
    category: "devops",
    difficulty: "hard",
    payout: 500,
    duration: 8,
    skills: ["DevOps", "GitHub Actions", "Docker", "AWS", "CI/CD"],
    requirements: [
      "DevOps experience",
      "CI/CD pipeline setup",
      "Docker and containerization",
      "AWS cloud services knowledge",
    ],
    tags: ["DevOps", "CI/CD", "Docker", "AWS"],
    featured: true,
  },
  {
    title: "UI/UX Design System",
    description:
      "Create a comprehensive design system with component library, style guide, design tokens, and Figma templates. Include documentation, accessibility guidelines, and implementation examples.",
    company: "DesignPro",
    category: "design",
    difficulty: "medium",
    payout: 300,
    duration: 7,
    skills: ["UI/UX Design", "Figma", "Design Systems", "Accessibility"],
    requirements: [
      "UI/UX design experience",
      "Design system knowledge",
      "Figma expertise",
      "Accessibility standards knowledge",
    ],
    tags: ["Design System", "UI/UX", "Figma", "Accessibility"],
    featured: false,
  },
];

/**
 * Seed the database with sample tasks
 */
async function seedTasks() {
  try {
    // Connect to database
    await connectDB();

    // Clear existing tasks
    await Task.deleteMany({});
    logger.info("Cleared existing tasks");

    // Find a sample user to assign as client (or create one)
    let sampleUser = await User.findOne();
    if (!sampleUser) {
      // Create a sample user if none exists
      sampleUser = await User.create({
        name: "Sample Client",
        email: "client@example.com",
        password: "password123",
        role: "client",
      });
      logger.info("Created sample client user");
    }

    // Add clientId to all tasks
    const tasksWithClient = sampleTasks.map((task) => ({
      ...task,
      clientId: sampleUser._id,
    }));

    // Insert sample tasks
    const createdTasks = await Task.insertMany(tasksWithClient);
    logger.info(`Successfully seeded ${createdTasks.length} tasks`);

    // Log statistics
    const stats = await Task.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          averagePayout: { $avg: "$payout" },
        },
      },
    ]);

    logger.info("Task statistics by category:");
    stats.forEach((stat) => {
      logger.info(
        `${stat._id}: ${
          stat.count
        } tasks, avg payout: $${stat.averagePayout.toFixed(2)}`
      );
    });

    process.exit(0);
  } catch (error) {
    logger.error("Error seeding tasks:", error);
    process.exit(1);
  }
}

/**
 * Clear all tasks from database
 */
async function clearTasks() {
  try {
    await connectDB();
    await Task.deleteMany({});
    logger.info("Successfully cleared all tasks");
    process.exit(0);
  } catch (error) {
    logger.error("Error clearing tasks:", error);
    process.exit(1);
  }
}

// Check command line arguments
const command = process.argv[2];

if (command === "clear") {
  clearTasks();
} else {
  seedTasks();
}

export { clearTasks, seedTasks };
