import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { SnackbarProvider, useSnackbar } from 'notistack';
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
import type { UserRole } from './types';
import { ClientsPage } from './features/mandates/ClientsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ─── Auth guard: redirect to /login if not authenticated ─────────────────────
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useSessionStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
};

// ─── Role guard: redirect to /dashboard if role is not allowed ───────────────
const RoleGuard: React.FC<{ allowedRoles: UserRole[]; children: React.ReactNode }> = ({
  allowedRoles,
  children,
}) => {
  const { currentUser, isAuthenticated } = useSessionStore();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated && currentUser && !allowedRoles.includes(currentUser.role)) {
      enqueueSnackbar('Access denied: you do not have permission to view that page.', {
        variant: 'error',
      });
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, currentUser, allowedRoles, enqueueSnackbar, navigate]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (currentUser && !allowedRoles.includes(currentUser.role)) return null;

  return <AppLayout>{children}</AppLayout>;
};

// ─── Routes ───────────────────────────────────────────────────────────────────
const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useSessionStore();
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      {/* All authenticated roles */}
      <Route path="/dashboard" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
      <Route path="/drives"    element={<ProtectedLayout><HiringDrivesPage /></ProtectedLayout>} />
      <Route path="/candidates" element={<ProtectedLayout><CandidatesPage /></ProtectedLayout>} />

      {/* MIS_MANAGER, ACCOUNT_MANAGER */}
      <Route path="/mandates" element={
        <RoleGuard allowedRoles={['MIS_MANAGER', 'ACCOUNT_MANAGER', 'HEAD_OF_ENGINEERING']}>
          <MandatesPage />
        </RoleGuard>
      } />
       <Route path="/clients" element={
        <RoleGuard allowedRoles={['MIS_MANAGER', 'ACCOUNT_MANAGER']}>
          <ClientsPage />
        </RoleGuard>
      } />

      {/* MIS_MANAGER, ACCOUNT_MANAGER, COE_LAB_HEAD */}
      <Route path="/requirements" element={
        <RoleGuard allowedRoles={['MIS_MANAGER', 'ACCOUNT_MANAGER', 'COE_LAB_HEAD', 'HEAD_OF_ENGINEERING']}>
          <RequirementsPage />
        </RoleGuard>
      } />

      {/* MIS_MANAGER, COE_LAB_HEAD */}
      <Route path="/mappings" element={
        <RoleGuard allowedRoles={['MIS_MANAGER', 'COE_LAB_HEAD']}>
          <MappingsPage />
        </RoleGuard>
      } />
      <Route path="/mappings/new" element={
        <RoleGuard allowedRoles={['MIS_MANAGER', 'COE_LAB_HEAD']}>
          <MappingsPage />
        </RoleGuard>
      } />
      <Route path="/mappings/:id" element={
        <RoleGuard allowedRoles={['MIS_MANAGER', 'COE_LAB_HEAD']}>
          <MappingDetailPage />
        </RoleGuard>
      } />

      {/* HEAD_OF_ENGINEERING, MIS_MANAGER */}
      <Route path="/approvals/engineering" element={
        <RoleGuard allowedRoles={['HEAD_OF_ENGINEERING', 'MIS_MANAGER']}>
          <ApprovalQueuePage queueType="engineering" />
        </RoleGuard>
      } />

      {/* MIS_MANAGER only */}
      <Route path="/approvals/mis" element={
        <RoleGuard allowedRoles={['MIS_MANAGER']}>
          <ApprovalQueuePage queueType="mis" />
        </RoleGuard>
      } />

      {/* MIS_MANAGER, COE_COORDINATOR */}
      <Route path="/discussions" element={
        <RoleGuard allowedRoles={['MIS_MANAGER', 'COE_COORDINATOR']}>
          <DiscussionsPage />
        </RoleGuard>
      } />

      {/* MIS_MANAGER, COE_LAB_HEAD, ACCOUNT_MANAGER, COE_COORDINATOR */}
      <Route path="/loi" element={
        <RoleGuard allowedRoles={['MIS_MANAGER', 'COE_LAB_HEAD', 'ACCOUNT_MANAGER', 'COE_COORDINATOR']}>
          <LOITrackerPage />
        </RoleGuard>
      } />

      {/* MIS_MANAGER only */}
      <Route path="/admin/users" element={
        <RoleGuard allowedRoles={['MIS_MANAGER']}>
          <AdminUsersPage />
        </RoleGuard>
      } />

      {/* Fallback */}
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
