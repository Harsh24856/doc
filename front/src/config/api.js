// API Configuration
// Automatically detect backend URL based on current hostname
const getApiBaseUrl = () => {
  // If environment variable is set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Otherwise, use the same hostname as the frontend but port 3000
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}:3000`;
  }
  
  // Fallback for SSR or build time
  return 'http://localhost:3000';
};

const API_BASE_URL = getApiBaseUrl();

console.log('🔧 [API Config] API Base URL:', API_BASE_URL);
console.log('🔧 [API Config] Environment variable VITE_API_URL:', import.meta.env.VITE_API_URL || 'not set');
console.log('🔧 [API Config] Current hostname:', typeof window !== 'undefined' ? window.location.hostname : 'N/A');

export default API_BASE_URL;

