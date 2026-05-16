import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSessionStore } from '../../store';
import { useNotifications } from '../../api/hooks';
import { Box, Typography, IconButton, Badge, Button } from '@mui/material';

export const Topbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useSessionStore();
  const { data: notifications = [] } = useNotifications(currentUser?.id);
  const unread = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbMain = pathParts[0] ? pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1) : 'Dashboard';

  return (
    <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #E5EBF0', px: 2, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Typography sx={{ fontSize: 15, color: '#6B7C93' }}>
          {breadcrumbMain} / <Box component="span" sx={{ color: '#111827', fontWeight: 500 }}>Overview</Box>
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          title="Notifications"
          sx={{ width: 30, height: 30, borderRadius: 1.5, border: '1px solid #D0D9E4', bgcolor: '#fff', color: '#6B7C93' }}
        >
          <Badge badgeContent={unread} color="error" variant="dot" invisible={unread === 0}>
            <i className="ti ti-bell" style={{ fontSize: 17 }} />
          </Badge>
        </IconButton>
        <Button
          variant="outlined"
          size="small"
          onClick={handleLogout}
          title="Logout"
          sx={{ minWidth: 30, p: '4px 8px', color: '#111827', borderColor: '#D0D9E4', bgcolor: '#F0F4F8' }}
        >
          <i className="ti ti-logout" style={{ fontSize: 15 }} />
        </Button>
      </Box>
    </Box>
  );
};
