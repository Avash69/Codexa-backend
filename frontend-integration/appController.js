// Complete Frontend Implementation Example
// This shows how to integrate the API with a typical React application

import { EnhancedTaskAPI } from "./enhancedTaskAPI.js";

// Initialize API client
const api = new EnhancedTaskAPI();

// Authentication Manager
class AuthManager {
  constructor() {
    this.initializeAuth();
  }

  initializeAuth() {
    const token = localStorage.getItem("authToken");
    if (token) {
      api.setToken(token);
    }
  }

  async login(email, password) {
    try {
      const response = await api.login(email, password);
      localStorage.setItem("authToken", response.token);
      return response;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const response = await api.register(userData);
      localStorage.setItem("authToken", response.token);
      return response;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  }

  async logout() {
    try {
      await api.logout();
    } finally {
      localStorage.removeItem("authToken");
    }
  }

  isAuthenticated() {
    return api.isAuthenticated();
  }
}

// Task Manager
class TaskManager {
  constructor() {
    this.tasks = [];
    this.currentPage = 1;
    this.totalPages = 1;
  }

  async loadTasks(filters = {}) {
    try {
      const response = await api.getTasks({
        page: this.currentPage,
        limit: 20,
        ...filters,
      });

      this.tasks = response.tasks;
      this.totalPages = response.pagination.totalPages;

      return response;
    } catch (error) {
      console.error("Failed to load tasks:", error);
      throw error;
    }
  }

  async searchTasks(query, filters = {}) {
    try {
      const response = await api.searchTasks(query, filters);
      this.tasks = response.tasks;
      return response;
    } catch (error) {
      console.error("Search failed:", error);
      throw error;
    }
  }

  async getTaskById(taskId) {
    try {
      return await api.getTaskById(taskId);
    } catch (error) {
      console.error("Failed to load task:", error);
      throw error;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      return this.loadTasks();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      return this.loadTasks();
    }
  }
}

// Application Manager
class ApplicationManager {
  constructor() {
    this.applications = [];
    this.stats = null;
  }

  async applyToTask(taskId, message) {
    try {
      const application = await api.applyToTask(taskId, message);
      await this.refreshApplications();
      return application;
    } catch (error) {
      console.error("Application failed:", error);
      throw error;
    }
  }

  async getMyApplications(filters = {}) {
    try {
      const response = await api.getMyAppliedTasks({
        status: "all",
        page: 1,
        limit: 50,
        ...filters,
      });

      this.applications = response.applications;
      return response;
    } catch (error) {
      console.error("Failed to load applications:", error);
      throw error;
    }
  }

  async getApplicationStats() {
    try {
      const stats = await api.getMyApplicationStats();
      this.stats = stats;
      return stats;
    } catch (error) {
      console.error("Failed to load stats:", error);
      throw error;
    }
  }

  async submitFiles(applicationId, files) {
    try {
      const submissions = await api.submitFiles(applicationId, files);
      await this.refreshApplications();
      return submissions;
    } catch (error) {
      console.error("File submission failed:", error);
      throw error;
    }
  }

  async updateProgress(applicationId, progress) {
    try {
      const updated = await api.updateProgress(applicationId, progress);
      await this.refreshApplications();
      return updated;
    } catch (error) {
      console.error("Progress update failed:", error);
      throw error;
    }
  }

  async withdrawApplication(applicationId) {
    try {
      await api.withdrawApplication(applicationId);
      await this.refreshApplications();
    } catch (error) {
      console.error("Withdrawal failed:", error);
      throw error;
    }
  }

  async refreshApplications() {
    await this.getMyApplications();
    await this.getApplicationStats();
  }

  getApplicationsByStatus(status) {
    return this.applications.filter((app) => app.status === status);
  }

  getPendingApplications() {
    return this.getApplicationsByStatus("pending");
  }

  getAcceptedApplications() {
    return this.getApplicationsByStatus("accepted");
  }

  getCompletedApplications() {
    return this.getApplicationsByStatus("completed");
  }
}

// Profile Manager
class ProfileManager {
  constructor() {
    this.profile = null;
  }

  async loadProfile() {
    try {
      const profile = await api.getProfile();
      this.profile = profile;
      return profile;
    } catch (error) {
      console.error("Failed to load profile:", error);
      throw error;
    }
  }

  async updateProfile(profileData) {
    try {
      const updated = await api.updateProfile(profileData);
      this.profile = updated;
      return updated;
    } catch (error) {
      console.error("Profile update failed:", error);
      throw error;
    }
  }

  async uploadProfileImage(imageFile) {
    try {
      const updated = await api.uploadProfileImage(imageFile);
      this.profile = updated;
      return updated;
    } catch (error) {
      console.error("Image upload failed:", error);
      throw error;
    }
  }
}

// Error Handler
class ErrorHandler {
  static handle(error) {
    console.error("API Error:", error);

    if (error.message.includes("401") || error.message.includes("403")) {
      // Authentication error
      localStorage.removeItem("authToken");
      api.removeToken();

      // Redirect to login or show login modal
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      return "Authentication failed. Please log in again.";
    } else if (error.message.includes("404")) {
      return "Resource not found.";
    } else if (error.message.includes("500")) {
      return "Server error. Please try again later.";
    } else {
      return error.message || "An unexpected error occurred.";
    }
  }
}

// Main App Controller
class AppController {
  constructor() {
    this.auth = new AuthManager();
    this.tasks = new TaskManager();
    this.applications = new ApplicationManager();
    this.profile = new ProfileManager();
  }

  async initialize() {
    if (this.auth.isAuthenticated()) {
      try {
        await this.profile.loadProfile();
        await this.applications.refreshApplications();
      } catch (error) {
        ErrorHandler.handle(error);
      }
    }
  }

  async login(email, password) {
    try {
      const response = await this.auth.login(email, password);
      await this.initialize();
      return response;
    } catch (error) {
      throw new Error(ErrorHandler.handle(error));
    }
  }

  async logout() {
    try {
      await this.auth.logout();
      this.applications.applications = [];
      this.applications.stats = null;
      this.profile.profile = null;
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  async searchAndApplyWorkflow(searchQuery, applicationMessage) {
    try {
      // Search for tasks
      const searchResults = await this.tasks.searchTasks(searchQuery);

      if (searchResults.tasks.length === 0) {
        throw new Error("No tasks found matching your criteria.");
      }

      // Apply to the first matching task
      const firstTask = searchResults.tasks[0];
      const application = await this.applications.applyToTask(
        firstTask.id,
        applicationMessage
      );

      return {
        task: firstTask,
        application: application,
      };
    } catch (error) {
      throw new Error(ErrorHandler.handle(error));
    }
  }
}

// Export for use in React components or other modules
export {
  api as APIClient,
  AppController,
  ApplicationManager,
  AuthManager,
  ErrorHandler,
  ProfileManager,
  TaskManager,
};

// Example usage in a React component:
/*
import { AppController } from './appController.js';

const appController = new AppController();

function App() {
  useEffect(() => {
    appController.initialize();
  }, []);

  const handleLogin = async (email, password) => {
    try {
      await appController.login(email, password);
      // Handle successful login
    } catch (error) {
      // Handle login error
      console.error(error.message);
    }
  };

  const handleApplyToTask = async (taskId, message) => {
    try {
      await appController.applications.applyToTask(taskId, message);
      // Handle successful application
    } catch (error) {
      // Handle application error
      console.error(error.message);
    }
  };

  return (
    <div>
      // Your React components here
    </div>
  );
}
*/
