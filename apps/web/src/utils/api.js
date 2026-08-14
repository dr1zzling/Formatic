import axios from "axios";

const USER_API_URL = "http://localhost:3001";
const FORM_API_URL = "http://localhost:3000";

const API_BASE_URL = FORM_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor untuk menambahkan token ke setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRequest =
        error.config?.url?.includes("/user/login") ||
        error.config?.url?.includes("/user/register");
      const isAuthPage =
        window.location.pathname === "/login" ||
        window.location.pathname === "/register";

      if (!isAuthRequest && !isAuthPage) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username, password) =>
    axios.post(`${USER_API_URL}/user/login`, { username, password }, {
      headers: { "Content-Type": "application/json" },
    }),
  register: (username, password) =>
    axios.post(`${USER_API_URL}/user/register`, { username, password }, {
      headers: { "Content-Type": "application/json" },
    }),
  resetPassword: (username, password) =>
    axios.put(`${USER_API_URL}/user/forgot-password`, { username, password }, {
      headers: { "Content-Type": "application/json" },
    }),
};

export default api;
