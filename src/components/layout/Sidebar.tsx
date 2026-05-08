import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Divider, Chip, alpha, useTheme, Collapse,
} from '@mui/material';
import {
  Dashboard, Assignment, Business, School, People,
  AccountTree, CheckCircle, Forum, Description,
  AdminPanelSettings, ExpandLess, ExpandMore,
  FiberManualRecord,
} from '@mui/icons-material';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  roles?: string[];
  children?: NavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  {
    label: 'Mandates', icon: <Assignment />, path: '/mandates',
    roles: ['MIS_MANAGER', 'ACCOUNT_MANAGER'],
  },
  { label: 'Requirements', icon: <Business />, path: '/requirements' },
  { label: 'Hiring Drives', icon: <School />, path: '/drives' },
  { label: 'Candidates', icon: <People />, path: '/candidates' },
  {
    label: 'Mappings', icon: <AccountTree />,
    children: [
      { label: 'All Mappings', icon: <FiberManualRecord sx={{ fontSize: 10 }} />, path: '/mappings' },
      { label: 'New Mapping', icon: <FiberManualRecord sx={{ fontSize: 10 }} />, path: '/mappings/new' },
    ],
  },
  {
    label: 'Approvals', icon: <CheckCircle />,
    children: [
      { label: 'Engineering Queue', icon: <FiberManualRecord sx={{ fontSize: 10 }} />, path: '/approvals/engineering', roles: ['HEAD_OF_ENGINEERING', 'MIS_MANAGER'] },
      { label: 'MIS Queue', icon: <FiberManualRecord sx={{ fontSize: 10 }} />, path: '/approvals/mis', roles: ['MIS_MANAGER'] },
    ],
  },
  {
    label: 'Discussions', icon: <Forum />, path: '/discussions',
    roles: ['MIS_MANAGER', 'COE_COORDINATOR'],
  },
  { label: 'LOI Tracker', icon: <Description />, path: '/loi' },
  {
    label: 'Admin', icon: <AdminPanelSettings />, path: '/admin/users',
    roles: ['MIS_MANAGER'],
  },
];

export const Sidebar: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useSessionStore();
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({
    Mappings: true,
    Approvals: false,
  });

  const role = currentUser?.role;

  const isVisible = (item: NavItem) => {
    if (!item.roles) return true;
    return role ? item.roles.includes(role) : false;
  };

  const isActive = (path?: string) => path && location.pathname === path;
  const isGroupActive = (item: NavItem) =>
    item.children?.some((c) => c.path && location.pathname.startsWith(c.path));

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <Box
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(180deg, #16213e 0%, #0f0f1a 100%)'
          : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        borderRight: `1px solid ${theme.palette.divider}`,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* Logo */}
      <Box sx={{ px: 3, py: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 2,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
          }}>
            <AccountTree sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} lineHeight={1.1}
              sx={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              MM·AI
            </Typography>
            <Typography variant="caption" color="text.secondary" lineHeight={1}>MandateMatch</Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mx: 2, mb: 1 }} />

      {/* User info */}
      {currentUser && (
        <Box sx={{ px: 2, mb: 2 }}>
          <Box sx={{
            p: 1.5, borderRadius: 2,
            background: alpha(theme.palette.primary.main, 0.08),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
          }}>
            <Typography variant="body2" fontWeight={700} noWrap>{currentUser.name}</Typography>
            <Chip
              size="small"
              label={currentUser.role.replace(/_/g, ' ')}
              sx={{
                mt: 0.5, height: 18, fontSize: '0.6rem', fontWeight: 700,
                background: alpha(theme.palette.primary.main, 0.2),
                color: theme.palette.primary.main,
              }}
            />
          </Box>
        </Box>
      )}

      {/* Nav */}
      <List dense sx={{ flex: 1, px: 1 }}>
        {NAV_ITEMS.filter(isVisible).map((item) => {
          if (item.children) {
            const groupActive = isGroupActive(item);
            const open = openGroups[item.label] ?? false;
            return (
              <React.Fragment key={item.label}>
                <ListItemButton
                  onClick={() => toggleGroup(item.label)}
                  sx={{
                    borderRadius: 2, mb: 0.5,
                    background: groupActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: groupActive ? 'primary.main' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: groupActive ? 700 : 500, fontSize: '0.875rem' }}
                  />
                  {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                </ListItemButton>
                <Collapse in={open}>
                  <List dense disablePadding sx={{ pl: 2 }}>
                    {item.children.filter(isVisible).map((child) => (
                      <ListItemButton
                        key={child.path}
                        selected={!!isActive(child.path)}
                        onClick={() => child.path && navigate(child.path)}
                        sx={{ borderRadius: 2, mb: 0.25, pl: 2 }}
                      >
                        <ListItemIcon sx={{ minWidth: 24, color: isActive(child.path) ? 'primary.main' : 'text.secondary' }}>
                          {child.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={child.label}
                          primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: isActive(child.path) ? 700 : 400 }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }
          return (
            <ListItemButton
              key={item.path}
              selected={!!isActive(item.path)}
              onClick={() => item.path && navigate(item.path)}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: isActive(item.path) ? 'primary.main' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: isActive(item.path) ? 700 : 500, fontSize: '0.875rem' }}
              />
            </ListItemButton>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
          BridgeLabz © 2025 · MM-AI v1.0
        </Typography>
      </Box>
    </Box>
  );
};

export { DRAWER_WIDTH };
