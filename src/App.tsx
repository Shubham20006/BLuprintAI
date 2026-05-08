import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { getTheme } from './theme';
import { useThemeStore, useSessionStore } from './store';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { MandatesPage } from './features/mandates/MandatesPage';
import { RequirementsPage } from './features/requirements/RequirementsPage';
import { HiringDrivesPage } from './features/hiring-drives/HiringDrivesPage';
import { CandidatesPage } from './features/candidates/CandidatesPage';
import { MappingsPage } from './features/mappings/MappingsPage';
import { MappingDetailPage } from './features/mappings/MappingDetailPage';
import { ApprovalQueuePage } from './features/approvals/ApprovalQueuePage';
import { DiscussionsPage } from './features/discussions/DiscussionsPage';
import { LOITrackerPage } from './features/loi/LOITrackerPage';
import { AdminUsersPage } from './features/admin/AdminUsersPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Route guard wrapper
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useSessionStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useSessionStore();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
      <Route path="/mandates" element={<ProtectedLayout><MandatesPage /></ProtectedLayout>} />
      <Route path="/requirements" element={<ProtectedLayout><RequirementsPage /></ProtectedLayout>} />
      <Route path="/drives" element={<ProtectedLayout><HiringDrivesPage /></ProtectedLayout>} />
      <Route path="/candidates" element={<ProtectedLayout><CandidatesPage /></ProtectedLayout>} />
      <Route path="/mappings" element={<ProtectedLayout><MappingsPage /></ProtectedLayout>} />
      <Route path="/mappings/new" element={<ProtectedLayout><MappingsPage /></ProtectedLayout>} />
      <Route path="/mappings/:id" element={<ProtectedLayout><MappingDetailPage /></ProtectedLayout>} />
      <Route path="/approvals/engineering" element={<ProtectedLayout><ApprovalQueuePage queueType="engineering" /></ProtectedLayout>} />
      <Route path="/approvals/mis" element={<ProtectedLayout><ApprovalQueuePage queueType="mis" /></ProtectedLayout>} />
      <Route path="/discussions" element={<ProtectedLayout><DiscussionsPage /></ProtectedLayout>} />
      <Route path="/loi" element={<ProtectedLayout><LOITrackerPage /></ProtectedLayout>} />
      <Route path="/admin/users" element={<ProtectedLayout><AdminUsersPage /></ProtectedLayout>} />
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const ThemedApp: React.FC = () => {
  const { mode } = useThemeStore();
  const theme = React.useMemo(() => getTheme(mode), [mode]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider
        maxSnack={4}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        autoHideDuration={3500}
      >
        <AppRoutes />
      </SnackbarProvider>
    </ThemeProvider>
  );
};

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemedApp />
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
