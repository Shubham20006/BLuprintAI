import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PaletteMode } from '@mui/material';
import type { User } from '../types';

// ─── Theme slice ──────────────────────────────────────────────────────────────
interface ThemeSlice {
  mode: PaletteMode;
  toggleMode: () => void;
}

export const useThemeStore = create<ThemeSlice>()(
  persist(
    (set) => ({
      mode: 'light',
      toggleMode: () =>
        set((s) => ({ mode: s.mode === 'dark' ? 'light' : 'dark' })),
    }),
    { name: 'mm-theme' }
  )
);

// ─── Session slice ────────────────────────────────────────────────────────────
interface SessionSlice {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

export const useSessionStore = create<SessionSlice>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      setCurrentUser: (user) =>
        set({ currentUser: user, isAuthenticated: !!user }),
      logout: () => {
        localStorage.clear();
        set({ currentUser: null, isAuthenticated: false });
      },
    }),
    { name: 'mm-session' }
  )
);

// ─── Global filters slice ─────────────────────────────────────────────────────
interface GlobalFilters {
  coeId: string;
  clientId: string;
  techStack: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

interface GlobalFiltersSlice {
  filters: GlobalFilters;
  setFilter: <K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K]) => void;
  resetFilters: () => void;
}

const defaultFilters: GlobalFilters = {
  coeId: '',
  clientId: '',
  techStack: '',
  status: '',
  dateFrom: '',
  dateTo: '',
};

export const useFiltersStore = create<GlobalFiltersSlice>()((set) => ({
  filters: defaultFilters,
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () => set({ filters: defaultFilters }),
}));

// ─── UI slice (sidebar, notifications panel) ──────────────────────────────────
interface UISlice {
  sidebarOpen: boolean;
  notifPanelOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleNotifPanel: () => void;
}

export const useUIStore = create<UISlice>()((set) => ({
  sidebarOpen: true,
  notifPanelOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleNotifPanel: () => set((s) => ({ notifPanelOpen: !s.notifPanelOpen })),
}));
