// Base URL for the new Express & MongoDB backend
const API_BASE_URL = 'https://bluprint-ai.onrender.com';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  get: async <T>(
    url: string,
    params?: Record<string, any>
  ): Promise<T> => {
    const resource = url.startsWith('/') ? url.slice(1) : url;
    
    // Construct query string if params exist
    let queryString = '';
    if (params) {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          searchParams.append(key, String(params[key]));
        }
      });
      const query = searchParams.toString();
      if (query) {
        queryString = `?${query}`;
      }
    }

    const response = await fetch(`${API_BASE_URL}/api/${resource}${queryString}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.message || `Failed to GET ${resource}`,
        status: response.status,
      };
    }

    return response.json();
  },

  post: async <T>(
    url: string,
    payload: any
  ): Promise<T> => {
    const resource = url.startsWith('/') ? url.slice(1) : url;

    const response = await fetch(`${API_BASE_URL}/api/${resource}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.message || `Failed to POST ${resource}`,
        status: response.status,
      };
    }

    return response.json();
  },

  patch: async <T>(
    url: string,
    payload: any
  ): Promise<T> => {
    const resource = url.startsWith('/') ? url.slice(1) : url;

    const response = await fetch(`${API_BASE_URL}/api/${resource}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.message || `Failed to PATCH ${resource}`,
        status: response.status,
      };
    }

    return response.json();
  },

  put: async <T>(
    url: string,
    payload: any
  ): Promise<T> => {
    const resource = url.startsWith('/') ? url.slice(1) : url;

    const response = await fetch(`${API_BASE_URL}/api/${resource}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.message || `Failed to PUT ${resource}`,
        status: response.status,
      };
    }

    return response.json();
  },

  delete: async (
    url: string
  ): Promise<any> => {
    const resource = url.startsWith('/') ? url.slice(1) : url;

    const response = await fetch(`${API_BASE_URL}/api/${resource}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.message || `Failed to DELETE ${resource}`,
        status: response.status,
      };
    }

    return response.json();
  },
};

export default api;