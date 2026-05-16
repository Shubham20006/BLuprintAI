import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSessionStore } from '../../store';
import type { UserRole } from '../../types';
import { Box, Typography, Avatar, Dialog, DialogContent, DialogActions, Button, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  // Shared
  { label: 'Dashboard', path: '/dashboard', icon: 'ti-layout-dashboard', roles: ['COE_LAB_HEAD'] },

  // COE Lab Head
  { label: 'Hiring Drives', path: '/drives', icon: 'ti-calendar-event', roles: ['COE_LAB_HEAD'] },
  { label: 'Candidates', path: '/candidates', icon: 'ti-users', roles: ['COE_LAB_HEAD'] },
  { label: 'AI Mapping', path: '/mappings', icon: 'ti-topology-complex', roles: ['COE_LAB_HEAD'] },
  { label: 'LOI Tracker', path: '/loi', icon: 'ti-file-certificate', roles: ['COE_LAB_HEAD'] },

  // COE Coordinator
  { label: 'Discussion Queue', path: '/discussions', icon: 'ti-messages', roles: ['COE_COORDINATOR'] },
  { label: 'My Candidates', path: '/candidates', icon: 'ti-users', roles: ['COE_COORDINATOR'] },
  { label: 'LOI Status', path: '/loi', icon: 'ti-file-certificate', roles: ['COE_COORDINATOR'] },

  // Account Manager
  { label: 'Dashboard', path: '/dashboard', icon: 'ti-layout-dashboard', roles: ['ACCOUNT_MANAGER'] },
  { label: 'Mandates', path: '/mandates', icon: 'ti-briefcase', roles: ['ACCOUNT_MANAGER'] },
  { label: 'Clients', path: '/clients', icon: 'ti-building', roles: ['ACCOUNT_MANAGER'] },

  // MIS Manager (Analytics, Mandates, Mappings, LOI Reports, COE Performance)
  { label: 'Analytics', path: '/dashboard', icon: 'ti-chart-bar', roles: ['MIS_MANAGER'] },
  { label: 'Mandates', path: '/mandates', icon: 'ti-briefcase', roles: ['MIS_MANAGER'] },
  { label: 'Mappings', path: '/mappings', icon: 'ti-topology-complex', roles: ['MIS_MANAGER'] },
  { label: 'LOI Reports', path: '/loi', icon: 'ti-file-certificate', roles: ['MIS_MANAGER'] },
  { label: 'COE Performance', path: '/dashboard', icon: 'ti-certificate', roles: ['MIS_MANAGER'] },
  { label: 'Admin', path: '/admin/users', icon: 'ti-settings', roles: ['MIS_MANAGER'] }, // Keep Admin as it is usually needed for MIS

  // Head of Engineering
  { label: 'Review Queue', path: '/approvals/engineering', icon: 'ti-user-check', roles: ['HEAD_OF_ENGINEERING'] },
  { label: 'All Mandates', path: '/mandates', icon: 'ti-briefcase', roles: ['HEAD_OF_ENGINEERING'] },
  { label: 'Analytics', path: '/dashboard', icon: 'ti-chart-bar', roles: ['HEAD_OF_ENGINEERING'] },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useSessionStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const role = currentUser?.role;

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  const isItemVisible = (item: NavItem): boolean => {
    if (!item.roles) return true;
    return role ? item.roles.includes(role) : false;
  };

  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const formatRoleLabel = (r?: string) => {
    if (!r) return '';
    return r.replace(/_/g, ' ').toUpperCase();
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  return (
    <Box sx={{ width: 180, bgcolor: 'secondary.main', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: '16px 14px 12px', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
        <Typography variant="h6" sx={{ fontSize: 19, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.2 }}>BLueprint</Typography>
        <Typography sx={{ fontSize: 12, color: '#7CA8D4', mt: '1px' }}>Fellowship MIS</Typography>
      </Box>
      {currentUser && (
        <Typography sx={{ m: '8px 10px 4px', fontSize: 11, fontWeight: 600, color: '#4A6FA5', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          {formatRoleLabel(currentUser.role)}
        </Typography>
      )}

      <Box sx={{ flex: 1, overflowY: 'auto', mt: 0.5 }}>
        <List disablePadding>
          {NAV_ITEMS.filter(isItemVisible)?.map((item) => (
            <ListItemButton
              key={item.label + item.path}
              selected={isActive(item.path)}
              onClick={() => navigate(item.path)}
              sx={{ py: 1, px: 1.75 }}
            >
              <ListItemIcon sx={{ minWidth: 24, color: 'inherit' }}>
                <i className={`ti ${item.icon}`} style={{ fontSize: 17 }} />
              </ListItemIcon>
              <ListItemText 
                primary={item.label} 
                primaryTypographyProps={{ fontSize: 14, fontWeight: isActive(item.path) ? 600 : 400 }} 
              />
            </ListItemButton>
          ))}
        </List>
      </Box>

      {currentUser && (
        <Box sx={{ mt: 'auto', borderTop: '1px solid rgba(255,255,255,.1)', p: '10px 14px' }}>
          <Box 
            onClick={() => setShowLogoutConfirm(true)} 
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
            title="Click to logout"
          >
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', color: '#fff', fontSize: 13, fontWeight: 600 }}>
              {getInitials(currentUser.name)}
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: 13, color: '#A8C8E8', fontWeight: 500, lineHeight: 1.2 }}>{currentUser.name}</Typography>
              <Typography sx={{ fontSize: 10, color: '#4A6FA5', opacity: 0.7 }}>{currentUser.role?.split('_')[0]}</Typography>
            </Box>
          </Box>
        </Box>
      )}

      <Dialog open={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} PaperProps={{ sx: { maxWidth: 450, borderRadius: 4, overflow: 'hidden' } }}>
        <DialogContent sx={{ p: '24px 24px 16px' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', mb: 3.5 }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                background: 'linear-gradient(135deg, var(--blue), var(--navy))', 
                color: '#fff',
                fontSize: 32,
                fontWeight: 800,
                mb: 2,
                boxShadow: '0 10px 20px rgba(10,132,208,0.25)',
                border: '4px solid #fff'
              }}
            >
              {getInitials(currentUser?.name)}
            </Avatar>
            <Typography sx={{ fontSize: 22, fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px' }}>
              {currentUser?.name}
            </Typography>
            <Typography sx={{ fontSize: 14, color: '#64748B', mt: 0.5, fontWeight: 500 }}>
              {currentUser?.email}
            </Typography>
            <Box sx={{ 
              mt: 1.5,
              px: 1.75,
              py: 0.5,
              borderRadius: 100,
              bgcolor: '#F1F5F9',
              color: '#475569',
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              border: '1px solid #E2E8F0'
            }}>
              {currentUser?.role?.replace(/_/g, ' ')}
            </Box>
          </Box>

          <Box sx={{ 
            borderRadius: 5, 
            p: 2.5,
            bgcolor: '#F8FAFC',
            border: '1px solid #F1F5F9',
            mb: 1,
            textAlign: 'center'
          }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#0F172A', mb: 0.75 }}>
              End current session?
            </Typography>
            <Typography sx={{ fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>
              You will be signed out from this device and your local cache will be cleared.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: '0 24px 24px', gap: 1.5, '& > :not(style) ~ :not(style)': { ml: 0 } }}>
          <Button 
            variant="outlined" 
            fullWidth 
            onClick={() => setShowLogoutConfirm(false)}
            sx={{ 
              height: 48, 
              borderRadius: 3, 
              borderColor: '#E2E8F0', 
              color: '#475569',
              fontWeight: 700,
              fontSize: 14,
              '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' }
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            fullWidth 
            onClick={handleLogout}
            sx={{ 
              height: 48, 
              borderRadius: 3, 
              bgcolor: '#E11D48', 
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              boxShadow: '0 4px 12px rgba(225,29,72,0.25)',
              '&:hover': { bgcolor: '#BE123C', boxShadow: '0 6px 16px rgba(225,29,72,0.35)' }
            }}
          >
            Sign Out
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
