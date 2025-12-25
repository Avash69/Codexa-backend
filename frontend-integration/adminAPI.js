// Enhanced Admin API Client for Frontend Integration
// Copy this file to your frontend project

const API_BASE_URL = "http://localhost:5001/api";

class AdminAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = null;
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
  }

  // Remove authentication token
  removeToken() {
    this.token = null;
  }

  // Get current token
  getToken() {
    return this.token;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }

  // Helper method to handle API requests with authentication
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add authentication token if available
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        headers,
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  // ========== AUTHENTICATION METHODS ==========

  // Check admin access
  async checkAccess() {
    const response = await this.request("/admin/check-access");
    return response.data;
  }

  // ========== DASHBOARD & STATISTICS ==========

  // Get admin dashboard statistics
  async getStats() {
    const response = await this.request("/admin/stats");
    return response.data;
  }

  // Get platform analytics
  async getAnalytics(period = "30d") {
    const response = await this.request(`/admin/analytics?period=${period}`);
    return response.data;
  }

  // ========== USER MANAGEMENT ==========

  // Get all users with pagination
  async getUsers(page = 1, limit = 10, search = "") {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) {
      params.append("search", search);
    }

    const response = await this.request(`/admin/users?${params}`);
    return response.data;
  }

  // Get user details with applications
  async getUserDetails(userId) {
    const response = await this.request(`/admin/users/${userId}`);
    return response.data;
  }

  // Update user details
  async updateUser(userId, userData) {
    const response = await this.request(`/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
    return response.data;
  }

  // Delete user
  async deleteUser(userId) {
    const response = await this.request(`/admin/users/${userId}`, {
      method: "DELETE",
    });
    return response;
  }

  // ========== TASK MANAGEMENT ==========

  // Get all tasks with pagination
  async getTasks(page = 1, limit = 10, filters = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });

    const response = await this.request(`/admin/tasks?${params}`);
    return response.data;
  }

  // Get task details with applications
  async getTaskDetails(taskId) {
    const response = await this.request(`/admin/tasks/${taskId}`);
    return response.data;
  }

  // Create new task
  async createTask(taskData) {
    const response = await this.request("/admin/tasks", {
      method: "POST",
      body: JSON.stringify(taskData),
    });
    return response.data;
  }

  // Update task details
  async updateTask(taskId, taskData) {
    const response = await this.request(`/admin/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(taskData),
    });
    return response.data;
  }

  // Delete task
  async deleteTask(taskId) {
    const response = await this.request(`/admin/tasks/${taskId}`, {
      method: "DELETE",
    });
    return response;
  }

  // ========== APPLICATION MANAGEMENT ==========

  // Get all applications with filters and pagination
  async getApplications(page = 1, limit = 10, filters = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "all"
      ) {
        params.append(key, value);
      }
    });

    const response = await this.request(`/admin/applications?${params}`);
    return response.data;
  }

  // Get application details
  async getApplicationDetails(applicationId) {
    const response = await this.request(`/admin/applications/${applicationId}`);
    return response.data;
  }

  // Update application status
  async updateApplicationStatus(applicationId, status, feedback = "") {
    const response = await this.request(
      `/admin/applications/${applicationId}/status`,
      {
        method: "PATCH",
        body: JSON.stringify({ status, feedback }),
      }
    );
    return response.data;
  }

  // Bulk update application status
  async bulkUpdateApplications(applicationIds, status, feedback = "") {
    const response = await this.request("/admin/applications/bulk-update", {
      method: "PATCH",
      body: JSON.stringify({ applicationIds, status, feedback }),
    });
    return response.data;
  }

  // ========== SYSTEM MANAGEMENT ==========

  // Get admin activity logs
  async getActivityLogs(page = 1, limit = 20) {
    const response = await this.request(
      `/admin/activity-logs?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  // ========== HELPER METHODS ==========

  // Get applications by status
  async getApplicationsByStatus(status, page = 1, limit = 10) {
    return await this.getApplications(page, limit, { status });
  }

  // Get pending applications
  async getPendingApplications(page = 1, limit = 10) {
    return await this.getApplicationsByStatus("pending", page, limit);
  }

  // Get accepted applications
  async getAcceptedApplications(page = 1, limit = 10) {
    return await this.getApplicationsByStatus("accepted", page, limit);
  }

  // Get rejected applications
  async getRejectedApplications(page = 1, limit = 10) {
    return await this.getApplicationsByStatus("rejected", page, limit);
  }

  // Get applications for a specific task
  async getTaskApplications(taskId, page = 1, limit = 10) {
    return await this.getApplications(page, limit, { taskId });
  }

  // Get applications for a specific user
  async getUserApplications(userId, page = 1, limit = 10) {
    return await this.getApplications(page, limit, { userId });
  }

  // Approve multiple applications
  async approveApplications(applicationIds, feedback = "Application approved") {
    return await this.bulkUpdateApplications(
      applicationIds,
      "accepted",
      feedback
    );
  }

  // Reject multiple applications
  async rejectApplications(applicationIds, feedback = "Application rejected") {
    return await this.bulkUpdateApplications(
      applicationIds,
      "rejected",
      feedback
    );
  }

  // Get users by role
  async getUsersByRole(role, page = 1, limit = 10) {
    return await this.getUsers(page, limit, "", { role });
  }

  // Get tasks by status
  async getTasksByStatus(status, page = 1, limit = 10) {
    return await this.getTasks(page, limit, { status });
  }

  // Get tasks by category
  async getTasksByCategory(category, page = 1, limit = 10) {
    return await this.getTasks(page, limit, { category });
  }
}

// Export for use in React components or other modules
export default AdminAPI;

// Example usage:
/*
import AdminAPI from './adminAPI.js';

const adminAPI = new AdminAPI();

// Set token after admin login
const token = localStorage.getItem('adminToken');
if (token) {
  adminAPI.setToken(token);
}

// Usage examples:
try {
  // Get dashboard stats
  const stats = await adminAPI.getStats();
  
  // Get all applications
  const applications = await adminAPI.getApplications();
  
  // Approve an application
  await adminAPI.updateApplicationStatus('app-id', 'accepted', 'Great application!');
  
  // Bulk approve applications
  await adminAPI.approveApplications(['app1', 'app2'], 'Both applications approved');
  
  // Get analytics
  const analytics = await adminAPI.getAnalytics('7d');
  
} catch (error) {
  console.error('Admin API error:', error);
}
*/
