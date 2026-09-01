import axios from "axios";

export const USER_API_URL = import.meta.env.VITE_USER_API_URL || "http://localhost:3001";
export const FORM_API_URL = import.meta.env.VITE_FORM_API_URL || "http://localhost:3000";

export const API_BASE_URL = FORM_API_URL;

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
    // Hanya redirect ke login jika benar-benar 401 (token expired/invalid)
    // Bukan network error (backend mati) atau error lainnya
    if (error.response?.status === 401) {
      const isAuthRequest =
        error.config?.url?.includes("/user/login") ||
        error.config?.url?.includes("/user/register") ||
        error.config?.url?.includes("/form/submit") ||
        error.config?.url?.includes("/form/share") ||
        error.config?.url?.includes("/form/soal");
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

// Submit API helpers
export const submitAPI = {
  // Cek token sebelum isi form: POST /form/submit?form_slug=
  checkToken: (form_slug, token) =>
    api.post("/form/submit", { token }, { params: { form_slug } }),

  // Get ringkasan jawaban (untuk creator): GET /form/submit?form_slug=
  getSummary: (form_slug) =>
    api.get("/form/submit", { params: { form_slug } }),

  // Get detail jawaban per responden: GET /form/submit/detail?form_slug=
  getDetail: (form_slug) =>
    api.get("/form/submit/detail", { params: { form_slug } }),
};

export default api;
