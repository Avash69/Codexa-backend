// React Integration Example
// This shows how to use the API with React hooks and components

import { createContext, useContext, useEffect, useState } from "react";
import { AppController } from "./appController.js";

// Create App Context
const AppContext = createContext();

// App Provider Component
export const AppProvider = ({ children }) => {
  const [appController] = useState(() => new AppController());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsAuthenticated(appController.auth.isAuthenticated());
        if (appController.auth.isAuthenticated()) {
          await appController.initialize();
          setUser(appController.profile.profile);
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [appController]);

  const login = async (email, password) => {
    try {
      const response = await appController.login(email, password);
      setIsAuthenticated(true);
      setUser(response.data.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await appController.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    appController,
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    setUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use app context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};

// Custom hook for tasks
export const useTasks = () => {
  const { appController } = useApp();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const loadTasks = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await appController.tasks.loadTasks(filters);
      setTasks(response.tasks);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchTasks = async (query, filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await appController.tasks.searchTasks(query, filters);
      setTasks(response.tasks);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  return {
    tasks,
    loading,
    error,
    pagination,
    loadTasks,
    searchTasks,
    nextPage: appController.tasks.nextPage.bind(appController.tasks),
    prevPage: appController.tasks.prevPage.bind(appController.tasks),
  };
};

// Custom hook for applications
export const useApplications = () => {
  const { appController, isAuthenticated } = useApp();
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadApplications = async (filters = {}) => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);
    try {
      const response = await appController.applications.getMyApplications(
        filters
      );
      setApplications(response.applications);

      const statsResponse =
        await appController.applications.getApplicationStats();
      setStats(statsResponse);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyToTask = async (taskId, message) => {
    try {
      const application = await appController.applications.applyToTask(
        taskId,
        message
      );
      await loadApplications(); // Refresh applications
      return application;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const submitFiles = async (applicationId, files) => {
    try {
      const submissions = await appController.applications.submitFiles(
        applicationId,
        files
      );
      await loadApplications(); // Refresh applications
      return submissions;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const updateProgress = async (applicationId, progress) => {
    try {
      const updated = await appController.applications.updateProgress(
        applicationId,
        progress
      );
      await loadApplications(); // Refresh applications
      return updated;
    } catch (err) {
      throw new Error(err.message);
    }
  };

  const withdrawApplication = async (applicationId) => {
    try {
      await appController.applications.withdrawApplication(applicationId);
      await loadApplications(); // Refresh applications
    } catch (err) {
      throw new Error(err.message);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadApplications();
    }
  }, [isAuthenticated]);

  return {
    applications,
    stats,
    loading,
    error,
    loadApplications,
    applyToTask,
    submitFiles,
    updateProgress,
    withdrawApplication,
    getPendingApplications: () =>
      applications.filter((app) => app.status === "pending"),
    getAcceptedApplications: () =>
      applications.filter((app) => app.status === "accepted"),
    getCompletedApplications: () =>
      applications.filter((app) => app.status === "completed"),
  };
};

// Custom hook for profile
export const useProfile = () => {
  const { appController, isAuthenticated, user, setUser } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await appController.profile.updateProfile(profileData);
      setUser(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      throw new Error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadProfileImage = async (imageFile) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await appController.profile.uploadProfileImage(imageFile);
      setUser(updated);
      return updated;
    } catch (err) {
      setError(err.message);
      throw new Error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    updateProfile,
    uploadProfileImage,
  };
};

// Example React Components

// Login Component
export const LoginForm = ({ onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      onSuccess && onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
};

// Task List Component
export const TaskList = ({ filters = {} }) => {
  const { tasks, loading, error, loadTasks, pagination } = useTasks();

  useEffect(() => {
    loadTasks(filters);
  }, [filters]);

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Available Tasks</h2>
      {tasks.length === 0 ? (
        <p>No tasks available</p>
      ) : (
        <div>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}

          {pagination && (
            <div>
              <button
                onClick={() =>
                  loadTasks({ ...filters, page: pagination.prevPage })
                }
                disabled={!pagination.hasPrev}
              >
                Previous
              </button>
              <span>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  loadTasks({ ...filters, page: pagination.nextPage })
                }
                disabled={!pagination.hasNext}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Task Card Component
export const TaskCard = ({ task }) => {
  const [showApplyForm, setShowApplyForm] = useState(false);
  const { isAuthenticated } = useApp();

  return (
    <div className="task-card">
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <div>
        <span>Company: {task.company}</span>
        <span>Category: {task.category}</span>
        <span>Difficulty: {task.difficulty}</span>
        <span>Payout: ${task.payout}</span>
      </div>
      {isAuthenticated && (
        <button onClick={() => setShowApplyForm(!showApplyForm)}>
          Apply to Task
        </button>
      )}
      {showApplyForm && (
        <ApplicationForm
          taskId={task.id}
          onSuccess={() => setShowApplyForm(false)}
        />
      )}
    </div>
  );
};

// Application Form Component
export const ApplicationForm = ({ taskId, onSuccess }) => {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { applyToTask } = useApplications();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await applyToTask(taskId, message);
      setMessage("");
      onSuccess && onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Cover Letter:</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Why are you interested in this task?"
          required
        />
      </div>
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit Application"}
      </button>
    </form>
  );
};

// My Applications Component
export const MyApplications = () => {
  const { applications, stats, loading, error } = useApplications();

  if (loading) return <div>Loading applications...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>My Applications</h2>

      {stats && (
        <div className="stats">
          <h3>Statistics</h3>
          <p>Total: {stats.total}</p>
          <p>Pending: {stats.pending}</p>
          <p>Accepted: {stats.accepted}</p>
          <p>Completed: {stats.completed}</p>
        </div>
      )}

      {applications.length === 0 ? (
        <p>No applications yet</p>
      ) : (
        <div>
          {applications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      )}
    </div>
  );
};

// Application Card Component
export const ApplicationCard = ({ application }) => {
  const { updateProgress, withdrawApplication } = useApplications();
  const [progress, setProgress] = useState(application.progress || 0);

  const handleProgressUpdate = async () => {
    try {
      await updateProgress(application.id, progress);
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  };

  const handleWithdraw = async () => {
    if (window.confirm("Are you sure you want to withdraw this application?")) {
      try {
        await withdrawApplication(application.id);
      } catch (error) {
        console.error("Failed to withdraw application:", error);
      }
    }
  };

  return (
    <div className="application-card">
      <h3>{application.task.title}</h3>
      <p>Status: {application.status}</p>
      <p>Applied: {new Date(application.appliedAt).toLocaleDateString()}</p>
      <p>Progress: {application.progress}%</p>

      {application.status === "accepted" && (
        <div>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(parseInt(e.target.value))}
          />
          <button onClick={handleProgressUpdate}>Update Progress</button>
        </div>
      )}

      {application.status === "pending" && (
        <button onClick={handleWithdraw}>Withdraw Application</button>
      )}
    </div>
  );
};

// Main App Component Example
export const App = () => {
  return (
    <AppProvider>
      <div className="app">
        <Header />
        <main>
          <TaskList />
          <MyApplications />
        </main>
      </div>
    </AppProvider>
  );
};

// Header Component
const Header = () => {
  const { isAuthenticated, user, logout } = useApp();

  return (
    <header>
      <h1>Code & Cash</h1>
      {isAuthenticated ? (
        <div>
          <span>Welcome, {user?.name}!</span>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <LoginForm />
      )}
    </header>
  );
};

export default App;