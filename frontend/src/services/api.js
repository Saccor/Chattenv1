// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000'; // Adjust if your backend base URL is different

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

// Interceptor to add the auth token to requests
client.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken'); // Adjust 'authToken' to where your token is stored
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export const fetchConversations = (searchTerm = '') => {
    return client.get(`/conversations?search=${searchTerm}`);
  };

export const fetchMessages = (conversationId) => {
  return client.get(`/messages/${conversationId}`);
};

export const sendMessage = (conversationId, text) => {
  return client.post('/messages', { conversationId, text });
};

export const createConversation = (participantIds) => {
  console.log("Creating conversation with IDs:", participantIds); // Debug output
  return client.post('/conversations', { participants: participantIds });
};

export const fetchUsers = () => {
  return client.get('/users');
};

export const loginUser = () => {
  window.location = `${API_BASE_URL}/auth/google`;
};

export const fetchCurrentUser = () => {
  return client.get('/auth/check')
    .then(response => {
      const { user, isAuthenticated } = response.data;
      if (isAuthenticated) {
        // Store the authentication token
        const token = response.headers['authorization'];
        localStorage.setItem('authToken', token);
      }
      return response;
    })
    .catch(error => {
      console.error('Error fetching current user:', error);
      throw error;
    });
};

