// API Configuration
// Use environment variable or fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

console.log('🔧 [API Config] API Base URL:', API_BASE_URL);
console.log('🔧 [API Config] Environment variable VITE_API_URL:', import.meta.env.VITE_API_URL || 'not set');

export default API_BASE_URL;

