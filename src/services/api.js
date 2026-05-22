import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('discord_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (username, password) => api.post('/auth/register', { username, password }),
  login: (username, password) => api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me')
};

export const channelAPI = {
  getAll: () => api.get('/channels'),
  create: (name, description) => api.post('/channels', { name, description })
};

export const messageAPI = {
  getByChannel: (channelId) => api.get(`/messages/${channelId}`)
};

export { BACKEND_URL };
export default api;
