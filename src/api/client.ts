import axios from 'axios';

export const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Request interceptor — attach auth token when real backend is used
apiClient.interceptors.request.use(
  (config) => {
    const session = localStorage.getItem('mm-session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        const userId = parsed?.state?.currentUser?.id;
        if (userId) config.headers['X-User-Id'] = userId;
      } catch (_) {/* ignore */}
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — normalize errors
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject({ message, status: error.response?.status });
  }
);

export default apiClient;

// ─── Generic CRUD helpers ─────────────────────────────────────────────────────

export const api = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    apiClient.get<T>(url, { params }).then((r) => r.data),

  post: <T>(url: string, data?: unknown) =>
    apiClient.post<T>(url, data).then((r) => r.data),

  patch: <T>(url: string, data?: unknown) =>
    apiClient.patch<T>(url, data).then((r) => r.data),

  put: <T>(url: string, data?: unknown) =>
    apiClient.put<T>(url, data).then((r) => r.data),

  delete: (url: string) => apiClient.delete(url).then((r) => r.data),
};
