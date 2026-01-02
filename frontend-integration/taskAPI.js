// // API Utility for Frontend Integration
// // Copy this file to your frontend project

// const API_BASE_URL = "http://localhost:5001/api";

// // API Service Class
// class TaskAPI {
//   constructor() {
//     this.baseURL = API_BASE_URL;
//   }

//   // Helper method to handle API requests
//   async request(endpoint, options = {}) {
//     const url = `${this.baseURL}${endpoint}`;

//     try {
//       const response = await fetch(url, {
//         headers: {
//           "Content-Type": "application/json",
//           ...options.headers,
//         },
//         ...options,
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data = await response.json();
//       return data;
//     } catch (error) {
//       console.error("API request failed:", error);
//       throw error;
//     }
//   }

//   // Get all tasks with optional filters
//   async getTasks(params = {}) {
//     const queryParams = new URLSearchParams();

//     Object.entries(params).forEach(([key, value]) => {
//       if (value !== undefined && value !== null && value !== "") {
//         queryParams.append(key, value);
//       }
//     });

//     const endpoint = `/tasks${
//       queryParams.toString() ? `?${queryParams.toString()}` : ""
//     }`;
//     const response = await this.request(endpoint);
//     return response.data;
//   }

//   // Get task categories
//   async getCategories() {
//     const response = await this.request("/tasks/categories");
//     return response.data;
//   }

//   // Get task difficulties
//   async getDifficulties() {
//     const response = await this.request("/tasks/difficulties");
//     return response.data;
//   }

//   // Get task statistics
//   async getStats() {
//     const response = await this.request("/tasks/stats");
//     return response.data;
//   }

//   // Get price range
//   async getPriceRange() {
//     const response = await this.request("/tasks/price-range");
//     return response.data;
//   }

//   // Get single task by ID
//   async getTask(id) {
//     const response = await this.request(`/tasks/${id}`);
//     return response.data;
//   }

//   // Search tasks
//   async searchTasks(query, filters = {}) {
//     const params = { search: query, ...filters };
//     return this.getTasks(params);
//   }

//   // Filter tasks by category
//   async getTasksByCategory(category, additionalFilters = {}) {
//     const params = { category, ...additionalFilters };
//     return this.getTasks(params);
//   }

//   // Filter tasks by difficulty
//   async getTasksByDifficulty(difficulty, additionalFilters = {}) {
//     const params = { difficulty, ...additionalFilters };
//     return this.getTasks(params);
//   }

//   // Filter tasks by payout range
//   async getTasksByPayoutRange(minPayout, maxPayout, additionalFilters = {}) {
//     const params = { minPayout, maxPayout, ...additionalFilters };
//     return this.getTasks(params);
//   }

//   // Get featured tasks
//   async getFeaturedTasks(additionalFilters = {}) {
//     const params = { featured: true, ...additionalFilters };
//     return this.getTasks(params);
//   }
// }

// // Create and export instance
// const taskAPI = new TaskAPI();

// // Export both the class and instance
// export { TaskAPI, taskAPI };
// export default taskAPI;

// // Usage Examples:
// /*
// // Import in your component
// import taskAPI from './api/taskAPI';

// // Use in component
// const ExampleComponent = () => {
//   const [tasks, setTasks] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         // Get all tasks
//         const tasksData = await taskAPI.getTasks();
//         setTasks(tasksData.tasks);

//         // Get categories
//         const categoriesData = await taskAPI.getCategories();
//         setCategories(categoriesData);

//         // Get tasks with filters
//         const frontendTasks = await taskAPI.getTasksByCategory('frontend');
        
//         // Search tasks
//         const searchResults = await taskAPI.searchTasks('react');
        
//         // Get tasks by difficulty
//         const easyTasks = await taskAPI.getTasksByDifficulty('easy');
        
//         // Get tasks by payout range
//         const highPayoutTasks = await taskAPI.getTasksByPayoutRange(300, 1000);
        
//         // Get featured tasks
//         const featured = await taskAPI.getFeaturedTasks();
        
//       } catch (error) {
//         console.error('Error loading data:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadData();
//   }, []);

//   return (
//     // Your component JSX
//   );
// };
// */


// API Utility for Frontend Integration
// Copy this file to your frontend project

const API_BASE_URL = "http://localhost:5001/api";

// API Service Class
class TaskAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to handle API requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

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

  // Get task statistics
  async getStats() {
    const response = await this.request("/tasks/stats");
    return response.data;
  }

  // Get price range
  async getPriceRange() {
    const response = await this.request("/tasks/price-range");
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

  // Filter tasks by category
  async getTasksByCategory(category, additionalFilters = {}) {
    const params = { category, ...additionalFilters };
    return this.getTasks(params);
  }

  // Filter tasks by difficulty
  async getTasksByDifficulty(difficulty, additionalFilters = {}) {
    const params = { difficulty, ...additionalFilters };
    return this.getTasks(params);
  }

  // Filter tasks by payout range
  async getTasksByPayoutRange(minPayout, maxPayout, additionalFilters = {}) {
    const params = { minPayout, maxPayout, ...additionalFilters };
    return this.getTasks(params);
  }

  // Get featured tasks
  async getFeaturedTasks(additionalFilters = {}) {
    const params = { featured: true, ...additionalFilters };
    return this.getTasks(params);
  }
}

// Create and export instance
const taskAPI = new TaskAPI();

// Export both the class and instance
export { TaskAPI, taskAPI };
export default taskAPI;

// Usage Examples:
/*
// Import in your component
import taskAPI from './api/taskAPI';

// Use in component
const ExampleComponent = () => {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get all tasks
        const tasksData = await taskAPI.getTasks();
        setTasks(tasksData.tasks);

        // Get categories
        const categoriesData = await taskAPI.getCategories();
        setCategories(categoriesData);

        // Get tasks with filters
        const frontendTasks = await taskAPI.getTasksByCategory('frontend');
        
        // Search tasks
        const searchResults = await taskAPI.searchTasks('react');
        
        // Get tasks by difficulty
        const easyTasks = await taskAPI.getTasksByDifficulty('easy');
        
        // Get tasks by payout range
        const highPayoutTasks = await taskAPI.getTasksByPayoutRange(300, 1000);
        
        // Get featured tasks
        const featured = await taskAPI.getFeaturedTasks();
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    // Your component JSX
  );
};
*/