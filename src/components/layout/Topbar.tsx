import React from 'react';
import {
  AppBar, Toolbar, IconButton, Typography, Box,
  Badge, Avatar, Menu, MenuItem, Tooltip,
  Divider, Switch, FormControlLabel, alpha, useTheme,
} from '@mui/material';
import {
  Notifications, LightMode, DarkMode, Logout,
  Person, MenuOpen, Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useThemeStore, useSessionStore, useUIStore } from '../../store';
import { useNotifications, useMarkNotificationRead } from '../../api/hooks';
import { ROLE_LABELS } from '../../auth/permissions';
import { timeAgo } from '../../utils';
import { DRAWER_WIDTH } from './Sidebar';

export const Topbar: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { mode, toggleMode } = useThemeStore();
  const { currentUser, logout } = useSessionStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = React.useState<null | HTMLElement>(null);

  const { data: notifications = [] } = useNotifications(currentUser?.id);
  const { mutate: markRead } = useMarkNotificationRead();
  const unread = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        left: sidebarOpen ? DRAWER_WIDTH : 0,
        width: sidebarOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%',
        transition: 'left 0.3s ease, width 0.3s ease',
        zIndex: 1100,
        color: theme.palette.text.primary,
      }}
    >
      <Toolbar sx={{ gap: 1, minHeight: 60 }}>
        <IconButton onClick={toggleSidebar} size="small">
          {sidebarOpen ? <MenuOpen /> : <MenuIcon />}
        </IconButton>

        <Typography variant="subtitle2" color="text.secondary" sx={{ flex: 1 }}>
          BridgeLabz · MandateMatch AI
        </Typography>

        {/* Theme toggle */}
        <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
          <IconButton onClick={toggleMode} size="small" sx={{ mr: 0.5 }}>
            {mode === 'dark' ? <LightMode /> : <DarkMode />}
          </IconButton>
        </Tooltip>

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton size="small" onClick={(e) => setNotifAnchor(e.currentTarget)}>
            <Badge badgeContent={unread} color="error" max={9}>
              <Notifications />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* User avatar */}
        <Tooltip title="Account">
          <Avatar
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              width: 34, height: 34, cursor: 'pointer',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              fontSize: '0.8rem', fontWeight: 700,
              boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
            }}
          >
            {currentUser?.avatar || currentUser?.name.slice(0, 2)}
          </Avatar>
        </Tooltip>
      </Toolbar>

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { minWidth: 220, borderRadius: 3, mt: 1 } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>{currentUser?.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {currentUser ? ROLE_LABELS[currentUser.role] : ''}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1.5 }}>
          <Logout fontSize="small" />
          <Typography variant="body2">Sign out</Typography>
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notifAnchor}
        open={Boolean(notifAnchor)}
        onClose={() => setNotifAnchor(null)}
        PaperProps={{ sx: { width: 360, borderRadius: 3, mt: 1 } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
          {unread > 0 && (
            <Typography variant="caption" color="primary.main" fontWeight={600}>
              {unread} unread
            </Typography>
          )}
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No notifications</Typography>
          </Box>
        ) : (
          notifications.slice(0, 8).map((n) => (
            <MenuItem
              key={n.id}
              onClick={() => {
                markRead(n.id);
                navigate(n.linkTo);
                setNotifAnchor(null);
              }}
              sx={{
                py: 1.5, gap: 1.5, alignItems: 'flex-start',
                background: !n.read ? alpha(theme.palette.primary.main, 0.06) : 'transparent',
                borderLeft: !n.read ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={n.read ? 400 : 600} sx={{ whiteSpace: 'normal' }}>
                  {n.message}
                </Typography>
                <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                  {timeAgo(n.createdAt)}
                </Typography>
              </Box>
              {!n.read && (
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.5, flexShrink: 0 }} />
              )}
            </MenuItem>
          ))
        )}
      </Menu>
    </AppBar>
  );
};
