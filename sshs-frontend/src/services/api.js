import axios from 'axios';

// --- API CONFIGURATION ---

// 1. LOCAL DEVELOPMENT (Use this while testing on your computer)
const BASE_URL = 'http://localhost:5001/api';

// 2. VERCEL PRODUCTION (Uncomment this line and paste your Vercel Backend URL before deploying)
// const BASE_URL = 'https://sshs-backend.vercel.app/api'; 

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

export default api;