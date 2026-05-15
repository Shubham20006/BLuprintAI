import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSessionStore } from '../../store';
import type { UserRole } from '../../types';

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
  { label: 'Analytics', path: '/dashboard', icon: 'ti-chart-bar', roles: ['ACCOUNT_MANAGER'] },
  { label: 'Mandates', path: '/mandates', icon: 'ti-briefcase', roles: ['ACCOUNT_MANAGER'] },
  { label: 'Clients', path: '/clients', icon: 'ti-building', roles: ['ACCOUNT_MANAGER'] },
  { label: 'LOI Tracker', path: '/loi', icon: 'ti-file-certificate', roles: ['ACCOUNT_MANAGER'] },

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
    <div className="sidebar">
      <div className="sb-logo">
        <div className="sb-logo-name">BLueprint</div>
        <div className="sb-logo-sub">Fellowship MIS</div>
      </div>
      {currentUser && (
        <div className="sb-role">{formatRoleLabel(currentUser.role)}</div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', marginTop: 4 }}>
        {NAV_ITEMS.filter(isItemVisible)?.map((item) => (
          <div
            key={item.label + item.path}
            className={`sb-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <i className={`ti ${item.icon}`} />
            {item.label}
          </div>
        ))}
      </div>

      {currentUser && (
        <div className="sb-bottom">
          <div className="sb-user" onClick={() => setShowLogoutConfirm(true)} style={{ cursor: 'pointer' }} title="Click to logout">
            <div className="sb-avatar" style={{ background: 'var(--blue)', color: '#fff', fontWeight: 700 }}>
              {getInitials(currentUser.name)}
            </div>
            <div>
              <div className="sb-uname">{currentUser.name}</div>
              <div className="sb-urole" style={{ fontSize: 10, opacity: 0.7 }}>
                {currentUser.role?.split('_')[0]}
              </div>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: 450, borderRadius: 16, overflow: 'hidden' }}>
            <div className="modal-body" style={{ padding: '24px 24px 16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 28 }}>
                <div style={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, var(--blue), var(--navy))', 
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  fontWeight: 800,
                  marginBottom: 16,
                  boxShadow: '0 10px 20px rgba(10,132,208,0.25)',
                  border: '4px solid #fff'
                }}>
                  {getInitials(currentUser?.name)}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px' }}>
                  {currentUser?.name}
                </div>
                <div style={{ fontSize: 14, color: '#64748B', marginTop: 2, fontWeight: 500 }}>
                  {currentUser?.email}
                </div>
                <div style={{ 
                  marginTop: 12,
                  padding: '4px 14px',
                  borderRadius: 100,
                  background: '#F1F5F9',
                  color: '#475569',
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  border: '1px solid #E2E8F0'
                }}>
                  {currentUser?.role?.replace(/_/g, ' ')}
                </div>
              </div>

              <div style={{ 
                borderRadius: 20, 
                padding: '20px',
                background: '#F8FAFC',
                border: '1px solid #F1F5F9',
                marginBottom: 28,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                  End current session?
                </div>
                <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>
                  You will be signed out from this device and your local cache will be cleared.
                </div>
              </div>
            </div>

            <div style={{ 
              padding: '0 24px 24px', 
              display: 'flex', 
              gap: 12 
            }}>
              <button 
                style={{ 
                  flex: 1, 
                  height: 48, 
                  borderRadius: 12, 
                  border: '1px solid #E2E8F0', 
                  background: '#fff', 
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }} 
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                style={{ 
                  flex: 1, 
                  height: 48, 
                  borderRadius: 12, 
                  border: 'none', 
                  background: '#E11D48', 
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(225,29,72,0.25)',
                  transition: 'all 0.2s'
                }} 
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
