// src/api/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
  // baseURL: 'http://localhost:5000/api', // Adjust to match your backend
  baseURL: '/api', // Adjust to match your backend
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
