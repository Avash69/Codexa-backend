// Enhanced API Utility for Frontend Integration with Applied Tasks
// Copy this file to your frontend project

const API_BASE_URL = "http://localhost:5001/api";

// Enhanced API Service Class
class EnhancedTaskAPI {
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

  // Helper method for file uploads
  async uploadRequest(endpoint, formData) {
    const url = `${this.baseURL}${endpoint}`;

    const headers = {};

    // Add authentication token if available
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
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
      console.error("Upload request failed:", error);
      throw error;
    }
  }

  // ========== AUTHENTICATION METHODS ==========

  // Login user
  async login(email, password) {
    const response = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  // Register user
  async register(userData) {
    const response = await this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  // Logout user
  async logout() {
    try {
      await this.request("/auth/logout", {
        method: "POST",
      });
    } finally {
      this.removeToken();
    }
  }

  // ========== PROFILE METHODS ==========

  // Get user profile
  async getProfile() {
    const response = await this.request("/profile");
    return response.data;
  }

  // Update user profile
  async updateProfile(profileData) {
    const response = await this.request("/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
    return response.data;
  }

  // Upload profile image
  async uploadProfileImage(imageFile) {
    const formData = new FormData();
    formData.append("image", imageFile);

    const response = await this.uploadRequest("/profile/image", formData);
    return response.data;
  }

  // ========== EXISTING TASK METHODS ==========

  // Get all tasks with optional filters
  async getTasks(params = {}) {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value);
      }
    });

    const endpoint = `/tasks${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    const response = await this.request(endpoint);
    return response.data;
  }

  // Get task categories
  async getCategories() {
    const response = await this.request("/tasks/categories");
    return response.data;
  }

  // Get task difficulties
  async getDifficulties() {
    const response = await this.request("/tasks/difficulties");
    return response.data;
  }

  // Get single task by ID
  async getTask(id) {
    const response = await this.request(`/tasks/${id}`);
    return response.data;
  }

  // Search tasks
  async searchTasks(query, filters = {}) {
    const params = { search: query, ...filters };
    return this.getTasks(params);
  }

  // ========== NEW APPLICATION METHODS ==========

  // Apply to a task
  async applyToTask(taskId, message = "") {
    const response = await this.request(`/applications/apply/${taskId}`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
    return response.data;
  }

  // Get user's applied tasks
  async getMyAppliedTasks(params = {}) {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value);
      }
    });

    const endpoint = `/applications/my${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    const response = await this.request(endpoint);
    return response.data;
  }

  // Get application details
  async getApplicationDetails(applicationId) {
    const response = await this.request(`/applications/${applicationId}`);
    return response.data;
  }

  // Submit files for an application
  async submitFiles(applicationId, files) {
    const formData = new FormData();

    // Add files to form data
    files.forEach((file, index) => {
      formData.append("submissions", file);
    });

    const response = await this.uploadRequest(
      `/applications/${applicationId}/submit`,
      formData
    );
    return response.data;
  }

  // Update application progress
  async updateProgress(applicationId, progress) {
    const response = await this.request(
      `/applications/${applicationId}/progress`,
      {
        method: "PUT",
        body: JSON.stringify({ progress }),
      }
    );
    return response.data;
  }

  // Withdraw application
  async withdrawApplication(applicationId) {
    const response = await this.request(
      `/applications/${applicationId}/withdraw`,
      {
        method: "DELETE",
      }
    );
    return response.data;
  }

  // Get application statistics
  async getMyApplicationStats() {
    const response = await this.request("/applications/my/stats");
    return response.data;
  }

  // Delete submission file
  async deleteSubmissionFile(applicationId, submissionId) {
    const response = await this.request(
      `/applications/${applicationId}/submissions/${submissionId}`,
      {
        method: "DELETE",
      }
    );
    return response.data;
  }

  // ========== HELPER METHODS ==========

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }

  // Get filtered applied tasks by status
  async getAppliedTasksByStatus(status, additionalFilters = {}) {
    const params = { status, ...additionalFilters };
    return this.getMyAppliedTasks(params);
  }

  // Get pending applications
  async getPendingApplications() {
    return this.getAppliedTasksByStatus("pending");
  }

  // Get accepted applications
  async getAcceptedApplications() {
    return this.getAppliedTasksByStatus("accepted");
  }

  // Get completed applications
  async getCompletedApplications() {
    return this.getAppliedTasksByStatus("completed");
  }

  // Get applications with sorting
  async getAppliedTasksSorted(
    sortBy = "appliedAt",
    sortOrder = "desc",
    additionalFilters = {}
  ) {
    const params = { sortBy, sortOrder, ...additionalFilters };
    return this.getMyAppliedTasks(params);
  }
}

// Create and export instance
const enhancedTaskAPI = new EnhancedTaskAPI();

// Export both the class and instance
export { EnhancedTaskAPI, enhancedTaskAPI };
export default enhancedTaskAPI;

// Usage Examples:
/*
// Import in your component
import enhancedTaskAPI from './api/enhancedTaskAPI';

// MyAppliedTasks Component Example
const MyAppliedTasks = () => {
  const [appliedTasks, setAppliedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadAppliedTasks = async () => {
      try {
        // Set authentication token (get from your auth context/state)
        const token = localStorage.getItem('authToken');
        enhancedTaskAPI.setToken(token);

        // Check if user is authenticated
        if (!enhancedTaskAPI.isAuthenticated()) {
          // Redirect to login
          window.location.href = '/login';
          return;
        }

        // Get applied tasks
        const appliedData = await enhancedTaskAPI.getMyAppliedTasks({
          status: filter === 'all' ? undefined : filter,
          limit: 10,
          page: 1
        });
        setAppliedTasks(appliedData.applications);

        // Get statistics
        const statsData = await enhancedTaskAPI.getMyApplicationStats();
        setStats(statsData);

      } catch (error) {
        console.error('Error loading applied tasks:', error);
        if (error.message.includes('not logged in')) {
          // Redirect to login
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };

    loadAppliedTasks();
  }, [filter]);

  // Handle file submission
  const handleFileSubmission = async (applicationId, files) => {
    try {
      const result = await enhancedTaskAPI.submitFiles(applicationId, files);
      console.log('Files submitted:', result);
      
      // Refresh the applied tasks list
      const appliedData = await enhancedTaskAPI.getMyAppliedTasks();
      setAppliedTasks(appliedData.applications);
    } catch (error) {
      console.error('Error submitting files:', error);
    }
  };

  // Handle progress update
  const handleProgressUpdate = async (applicationId, progress) => {
    try {
      await enhancedTaskAPI.updateProgress(applicationId, progress);
      
      // Refresh the applied tasks list
      const appliedData = await enhancedTaskAPI.getMyAppliedTasks();
      setAppliedTasks(appliedData.applications);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // Handle application withdrawal
  const handleWithdraw = async (applicationId) => {
    try {
      await enhancedTaskAPI.withdrawApplication(applicationId);
      
      // Refresh the applied tasks list
      const appliedData = await enhancedTaskAPI.getMyAppliedTasks();
      setAppliedTasks(appliedData.applications);
    } catch (error) {
      console.error('Error withdrawing application:', error);
    }
  };

  if (loading) {
    return <div>Loading applied tasks...</div>;
  }

  return (
    <div>
      <h2>My Applied Tasks</h2>
      
      {stats && (
        <div className="stats">
          <p>Total Applications: {stats.totalApplications}</p>
          <p>Success Rate: {stats.successRate}%</p>
          <p>Pending: {stats.pendingApplications}</p>
          <p>Accepted: {stats.acceptedApplications}</p>
          <p>Completed: {stats.completedApplications}</p>
        </div>
      )}

      <div className="filter-buttons">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('pending')}>Pending</button>
        <button onClick={() => setFilter('accepted')}>Accepted</button>
        <button onClick={() => setFilter('completed')}>Completed</button>
      </div>

      <div className="applied-tasks">
        {appliedTasks.map(application => (
          <div key={application.id} className="application-card">
            <h3>{application.task.title}</h3>
            <p>Status: {application.status}</p>
            <p>Progress: {application.progress}%</p>
            <p>Applied: {new Date(application.appliedAt).toLocaleDateString()}</p>
            <p>Submissions: {application.submissionCount}</p>
            
            {application.status === 'accepted' && (
              <div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => handleFileSubmission(application.id, Array.from(e.target.files))}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={application.progress}
                  onChange={(e) => handleProgressUpdate(application.id, parseInt(e.target.value))}
                />
              </div>
            )}
            
            {application.status === 'pending' && (
              <button onClick={() => handleWithdraw(application.id)}>
                Withdraw Application
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Task Application Component Example
const TaskApplication = ({ taskId }) => {
  const [message, setMessage] = useState('');
  const [applying, setApplying] = useState(false);

  const handleApply = async () => {
    try {
      setApplying(true);
      await enhancedTaskAPI.applyToTask(taskId, message);
      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error applying to task:', error);
      alert('Failed to apply to task');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Why are you interested in this task?"
        rows={4}
      />
      <button onClick={handleApply} disabled={applying}>
        {applying ? 'Applying...' : 'Apply to Task'}
      </button>
    </div>
  );
};
*/
