import axios from 'axios';

const api = axios.create({
  baseURL:
    window.location.hostname === 'localhost'
      ? 'http://localhost:5000/api'
      : 'https://megamart-backend-h4xa.onrender.com/api', // ← поменяешь при деплое
  withCredentials: false,
});

export default api;
