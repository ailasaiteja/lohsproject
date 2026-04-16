import axios from 'axios';
 
const api = axios.create({
  //  baseURL: 'https://flh-api-dev.azurewebsites.net/',
  // baseURL: 'http://127.0.0.1:8000/',
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: () => true, // Always resolve, handle status in code
});
 
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
 
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshRequest = originalRequest.url.includes('/auth/refresh-token/');
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest) {
      originalRequest._retry = true;
 
      const refreshToken = localStorage.getItem('refresh_token');
     
      if (!refreshToken) {
        localStorage.removeItem('token');
        window.location.href = '/';
        return Promise.reject(error);
      }
 
      try {
        const response = await axios.post(
          `${baseURL}users/auth/refresh-token/`,
          { refresh_token: refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          }
        );
 
        const newAccessToken = response.data.access;
       
        if (newAccessToken) {
          localStorage.setItem('token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.log('Refresh token failed, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
 
const getCall = async (url, config = {}) => {
  const res = await api.get(url, config);
  return res.data;
};
 
const postCall = async (url, data = {}, config = {}) => {
  const res = await api.post(url, data, config);
  return res;
};

const postCallMultipart = async (url, data = {}, config = {}) => {
  config.headers = {
    ...config.headers,
    'Content-Type': 'multipart/form-data',
  };
  const res = await api.post(url, data, config);
  return res;
};
const putCall = async (url, data = {}, config = {}) => {
  const res = await api.put(url, data, config);
  return res.data;
};
 
const patchCall = async (url, data = {}, config = {}) => {
  const res = await api.patch(url, data, config);
  return res.data; 
};
 
const deleteCall = async (url, config = {}) => {
  const res = await api.delete(url, config);
  return res.data;
};
 
export { getCall, postCall, putCall, patchCall, deleteCall,postCallMultipart };
 