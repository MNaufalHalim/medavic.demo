import config from '../config';

// Konfigurasi API URL berdasarkan environment
const getApiBaseUrl = () => {
  // Selalu gunakan production API URL jika forceProduction diaktifkan
  if (config.forceProduction) {
    return config.productionApiUrl;
  }
  
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
  // Pastikan endpoint tidak dimulai dengan '/'
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  // Untuk development (localhost), gunakan full URL dengan port 5000
  if (!import.meta.env.PROD) {
    return `http://localhost:5000/api/${formattedEndpoint}`;
  }
  
  // Untuk production (Netlify), gunakan relative URL untuk proxy
  return `${API_BASE_URL}/${formattedEndpoint}`;
};

export default {
  API_BASE_URL,
  apiUrl
};
