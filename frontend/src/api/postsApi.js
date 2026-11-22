import axios from 'axios';

// Use relative /api or custom injected URL (allows port 3000 Nginx reverse proxy to work seamlessly across any domain or tunnel)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const postsApi = {
  // Fetch posts with optional category filter and search keyword
  getAllPosts: async ({ category = 'All', search = '' } = {}) => {
    const params = {};
    if (category && category !== 'All') params.category = category;
    if (search.trim()) params.search = search.trim();

    const response = await apiClient.get('/posts', { params });
    return response.data;
  },

  // Fetch a single post by ID
  getPostById: async (id) => {
    const response = await apiClient.get(`/posts/${id}`);
    return response.data;
  },

  // Create a new blog post
  createPost: async (postData) => {
    const response = await apiClient.post('/posts', postData);
    return response.data;
  },

  // Update an existing blog post
  updatePost: async ({ id, postData }) => {
    const response = await apiClient.put(`/posts/${id}`, postData);
    return response.data;
  },

  // Delete a post
  deletePost: async (id) => {
    const response = await apiClient.delete(`/posts/${id}`);
    return response.data;
  },

  // Like a post
  likePost: async (id) => {
    const response = await apiClient.patch(`/posts/${id}/like`);
    return response.data;
  },

  // Check backend health
  checkBackendHealth: async () => {
    const healthUrl = API_BASE_URL.startsWith('http')
      ? API_BASE_URL.replace('/api', '') + '/health'
      : '/api-health';
    const response = await axios.get(healthUrl, { timeout: 4000 });
    return response.data;
  }
};
