import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 10000,
});

/**
 * Fetch all bins from the backend.
 */
export const getBins = async () => {
  const response = await API.get('/bins');
  return response.data;
};

/**
 * Fetch optimized collection routes.
 */
export const getOptimizedRoutes = async () => {
  const response = await API.get('/optimize');
  return response.data;
};

/**
 * Fetch all trucks.
 */
export const getTrucks = async () => {
  const response = await API.get('/trucks');
  return response.data;
};

/**
 * Collect waste from specified bins — resets their fill level to 0.
 */
export const collectBins = async (binIds) => {
  const response = await API.post('/bins/collect', { binIds });
  return response.data;
};

/**
 * Fetch EDA insights from bin_history.
 */
export const getAnalysis = async () => {
  const response = await API.get('/analysis');
  return response.data;
};

export default API;

