import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.mode === 'development' ? 'http://localhost:5000/api' : '/api',
    withCredentials: true, // Send cookies when cross-origin requests to server
});

export default axiosInstance;