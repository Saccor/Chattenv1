// src/services/api.js
import axios from 'axios';

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : 'https://saccoschatt.onrender.com';

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

client.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken');
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
        const token = response.headers['authorization'];
        console.log('Fetched authToken:', token);
        localStorage.setItem('authToken', token);
      }
      console.log('Fetched current user:', user);
      return { isAuthenticated, user };
    })
    .catch(error => {
      console.error('Error fetching current user:', error);
      throw error;
    });
};
