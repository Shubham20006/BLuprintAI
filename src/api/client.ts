import dbData from '../data/db.json';

// In-memory store initialized from db.json
let store: any = { ...dbData };

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  get: async <T>(url: string, params?: Record<string, any>): Promise<T> => {
    await delay(100);
    const resource = url.startsWith('/') ? url.slice(1) : url;
    
    // Handle individual resource requests like /users/u1
    const parts = resource.split('/');
    const key = parts[0];
    const id = parts[1];
    
    if (!store[key]) {
      throw { message: `Resource ${key} not found`, status: 404 };
    }
    
    let data = store[key];
    
    if (id) {
      const item = data.find((i: any) => i.id === id);
      if (!item) throw { message: `Item ${id} not found in ${key}`, status: 404 };
      return item as T;
    }
    
    // Handle query params filtering (simplified)
    if (params) {
      Object.keys(params).forEach(p => {
        if (params[p] !== undefined && params[p] !== null) {
          data = data.filter((item: any) => String(item[p]) === String(params[p]));
        }
      });
    }
    
    return data as T;
  },

  post: async <T>(url: string, payload: any): Promise<T> => {
    await delay(100);
    const key = url.startsWith('/') ? url.slice(1) : url;
    if (!store[key]) store[key] = [];
    
    const newItem = {
      id: Math.random().toString(36).substring(2, 10),
      ...payload,
      createdAt: new Date().toISOString()
    };
    
    store[key] = [...store[key], newItem];
    return newItem as T;
  },

  patch: async <T>(url: string, payload: any): Promise<T> => {
    await delay(100);
    const parts = (url.startsWith('/') ? url.slice(1) : url).split('/');
    const key = parts[0];
    const id = parts[1];
    
    if (!store[key]) throw { message: `Resource ${key} not found`, status: 404 };
    
    const index = store[key].findIndex((i: any) => i.id === id);
    if (index === -1) throw { message: `Item ${id} not found`, status: 404 };
    
    const updatedItem = { ...store[key][index], ...payload, updatedAt: new Date().toISOString() };
    const newList = [...store[key]];
    newList[index] = updatedItem;
    store[key] = newList;
    
    return updatedItem as T;
  },

  put: async <T>(url: string, payload: any): Promise<T> => {
    return api.patch<T>(url, payload);
  },

  delete: async (url: string): Promise<any> => {
    await delay(100);
    const parts = (url.startsWith('/') ? url.slice(1) : url).split('/');
    const key = parts[0];
    const id = parts[1];
    
    if (!store[key]) throw { message: `Resource ${key} not found`, status: 404 };
    
    store[key] = store[key].filter((i: any) => i.id !== id);
    return { success: true };
  }
};

export default api;
