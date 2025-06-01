import config from '../config';

// Konfigurasi API URL berdasarkan environment
const getApiBaseUrl = () => {
  // Untuk production (Netlify)
  if (import.meta.env.PROD) {
    // Gunakan URL backend yang di-deploy dari config.js
    return config.productionApiUrl;
  }
  
  // Untuk development (localhost)
  return config.localApiUrl;
};

export const API_BASE_URL = getApiBaseUrl();

// Helper untuk membuat URL API lengkap
export const apiUrl = (endpoint) => {
  // Jika endpoint sudah berisi 'api/', jangan tambahkan lagi
  if (endpoint.includes('api/')) {
    return `${API_BASE_URL.replace('/api', '')}/${endpoint}`;
  }
  
  // Pastikan endpoint tidak dimulai dengan '/'
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  return `${API_BASE_URL}/${formattedEndpoint}`;
};

export default {
  API_BASE_URL,
  apiUrl
};
