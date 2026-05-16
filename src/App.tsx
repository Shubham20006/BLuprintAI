import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { ClientsPage } from './features/mandates/ClientsPage';

import type { UserRole } from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Default route based on role
// ─────────────────────────────────────────────────────────────────────────────
const getDefaultRouteByRole = (role?: UserRole) => {
  switch (role) {
    case 'COE_COORDINATOR':
      return '/discussions';

    case 'COE_LAB_HEAD':
      return '/dashboard';

    case 'ACCOUNT_MANAGER':
      return '/mandates';

    case 'MIS_MANAGER':
      return '/dashboard';

    case 'HEAD_OF_ENGINEERING':
      return '/approvals/engineering';

    default:
      return '/login';
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Protected Layout
// ─────────────────────────────────────────────────────────────────────────────
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useSessionStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Role Guard
// ─────────────────────────────────────────────────────────────────────────────
const RoleGuard: React.FC<{
  allowedRoles: UserRole[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { currentUser, isAuthenticated } = useSessionStore();
  const { enqueueSnackbar } = useSnackbar();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser && !allowedRoles.includes(currentUser.role)) {
    enqueueSnackbar(
      'Access denied: you do not have permission to view that page.',
      {
        variant: 'error',
      }
    );

    return (
      <Navigate
        to={getDefaultRouteByRole(currentUser.role)}
        replace
      />
    );
  }

  return <AppLayout>{children}</AppLayout>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────────────────
const AppRoutes: React.FC = () => {
  const { isAuthenticated, currentUser } = useSessionStore();

  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate
              to={getDefaultRouteByRole(currentUser?.role)}
              replace
            />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* All authenticated users */}
      <Route
        path="/dashboard"
        element={
          <RoleGuard
            allowedRoles={[
              'MIS_MANAGER',
              'COE_LAB_HEAD',
              'HEAD_OF_ENGINEERING',
              'ACCOUNT_MANAGER'
            ]}
          >
            <DashboardPage />
          </RoleGuard>
        }
      />

      <Route
        path="/drives"
        element={
          <ProtectedLayout>
            <HiringDrivesPage />
          </ProtectedLayout>
        }
      />

      <Route
        path="/candidates"
        element={
          <ProtectedLayout>
            <CandidatesPage />
          </ProtectedLayout>
        }
      />

      {/* Mandates */}
      <Route
        path="/mandates"
        element={
          <RoleGuard
            allowedRoles={[
              'MIS_MANAGER',
              'ACCOUNT_MANAGER',
              'HEAD_OF_ENGINEERING',
            ]}
          >
            {currentUser?.role === 'ACCOUNT_MANAGER' ? (
              <RequirementsPage />
            ) : (
              <MandatesPage />
            )}
          </RoleGuard>
        }
      />

      {/* Clients */}
      <Route
        path="/clients"
        element={
          <RoleGuard
            allowedRoles={['MIS_MANAGER', 'ACCOUNT_MANAGER']}
          >
            <ClientsPage />
          </RoleGuard>
        }
      />

      {/* Requirements */}
      <Route
        path="/requirements"
        element={
          <RoleGuard
            allowedRoles={[
              'MIS_MANAGER',
              'ACCOUNT_MANAGER',
              'COE_LAB_HEAD',
              'HEAD_OF_ENGINEERING',
            ]}
          >
            <RequirementsPage />
          </RoleGuard>
        }
      />

      {/* Mappings */}
      <Route
        path="/mappings"
        element={
          <RoleGuard
            allowedRoles={['MIS_MANAGER', 'COE_LAB_HEAD']}
          >
            <MappingsPage />
          </RoleGuard>
        }
      />

      <Route
        path="/mappings/new"
        element={
          <RoleGuard
            allowedRoles={['MIS_MANAGER', 'COE_LAB_HEAD']}
          >
            <MappingsPage />
          </RoleGuard>
        }
      />

      <Route
        path="/mappings/:id"
        element={
          <RoleGuard
            allowedRoles={['MIS_MANAGER', 'COE_LAB_HEAD']}
          >
            <MappingDetailPage />
          </RoleGuard>
        }
      />

      {/* Engineering approvals */}
      <Route
        path="/approvals/engineering"
        element={
          <RoleGuard
            allowedRoles={[
              'HEAD_OF_ENGINEERING',
              'MIS_MANAGER',
            ]}
          >
            <ApprovalQueuePage queueType="engineering" />
          </RoleGuard>
        }
      />

      {/* MIS approvals */}
      <Route
        path="/approvals/mis"
        element={
          <RoleGuard allowedRoles={['MIS_MANAGER']}>
            <ApprovalQueuePage queueType="mis" />
          </RoleGuard>
        }
      />

      {/* Discussions */}
      <Route
        path="/discussions"
        element={
          <RoleGuard
            allowedRoles={[
              'MIS_MANAGER',
              'COE_COORDINATOR',
            ]}
          >
            <DiscussionsPage />
          </RoleGuard>
        }
      />

      {/* LOI */}
      <Route
        path="/loi"
        element={
          <RoleGuard
            allowedRoles={[
              'MIS_MANAGER',
              'COE_LAB_HEAD',
              'ACCOUNT_MANAGER',
              'COE_COORDINATOR',
            ]}
          >
            <LOITrackerPage />
          </RoleGuard>
        }
      />

      {/* Admin */}
      <Route
        path="/admin/users"
        element={
          <RoleGuard allowedRoles={['MIS_MANAGER']}>
            <AdminUsersPage />
          </RoleGuard>
        }
      />

      {/* Root redirect */}
      <Route
        path="/"
        element={
          <Navigate
            to={
              isAuthenticated
                ? getDefaultRouteByRole(currentUser?.role)
                : '/login'
            }
            replace
          />
        }
      />

      {/* Fallback */}
      <Route
        path="*"
        element={
          <Navigate
            to={
              isAuthenticated
                ? getDefaultRouteByRole(currentUser?.role)
                : '/login'
            }
            replace
          />
        }
      />
    </Routes>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Theme Wrapper
// ─────────────────────────────────────────────────────────────────────────────
const ThemedApp: React.FC = () => {
  const { mode } = useThemeStore();

  const theme = React.useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <SnackbarProvider
        maxSnack={4}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        autoHideDuration={3500}
      >
        <AppRoutes />
      </SnackbarProvider>
    </ThemeProvider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────
const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemedApp />
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;