import axios from 'axios';

const API_BASE_URL = 'https://rumtest.onrender.com/api/rum';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Helper to extract data from ApiResponseDTO
const extractData = (response) => {
  // Handle both old format (direct data) and new format (wrapped in ApiResponseDTO)
  if (response.data && response.data.data !== undefined) {
    return response.data.data; // New format with ApiResponseDTO wrapper
  }
  return response.data; // Old format or health endpoint
};

export const rumAPI = {
  // Health check
  health: async () => {
    const response = await apiClient.get('/health');
    return response.data; // HealthResponseDTO is returned directly
  },

  // Get web vitals for time range
  getWebVitals: async (startMs, endMs) => {
    const response = await apiClient.get('/vitals/range', {
      params: { startMs, endMs },
    });
    return extractData(response);
  },

  // Get errors for time range
  getErrors: async (startMs, endMs) => {
    const response = await apiClient.get('/errors/range', {
      params: { startMs, endMs },
    });
    return extractData(response);
  },

  // Get page views for time range
  getPageViews: async (startMs, endMs) => {
    const response = await apiClient.get('/pageviews/range', {
      params: { startMs, endMs },
    });
    return extractData(response);
  },

  // Get page speed for time range
  getPageSpeed: async (startMs, endMs) => {
    const response = await apiClient.get('/pagespeed/range', {
      params: { startMs, endMs },
    });
    return extractData(response);
  },

  // Get page speed statistics by page
  getPageSpeedStats: async (startMs, endMs) => {
    const response = await apiClient.get('/pagespeed/stats', {
      params: { startMs, endMs },
    });
    return extractData(response);
  },

  // Get dashboard statistics
  getDashboardStats: async (startMs, endMs) => {
    const response = await apiClient.get('/stats', {
      params: { startMs, endMs },
    });
    return extractData(response);
  },

  // Get vitals by session
  getSessionVitals: async (sessionId) => {
    const response = await apiClient.get(`/sessions/${sessionId}/vitals`);
    return extractData(response);
  },

  // Get errors by session
  getSessionErrors: async (sessionId) => {
    const response = await apiClient.get(`/sessions/${sessionId}/errors`);
    return extractData(response);
  },
};

export default apiClient;

