import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSessionStore } from '../../store';
import type { UserRole } from '../../types';

interface NavItem {
  label: string;
  path: string;
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  // Shared
  { label: 'Dashboard', path: '/dashboard', roles: ['COE_LAB_HEAD', 'COE_COORDINATOR', 'ACCOUNT_MANAGER', 'MIS_MANAGER', 'HEAD_OF_ENGINEERING'] },

  // COE Lab Head
  { label: 'Hiring Drives', path: '/drives', roles: ['COE_LAB_HEAD'] },
  { label: 'Candidates', path: '/candidates', roles: ['COE_LAB_HEAD'] },
  { label: 'AI Mapping', path: '/mappings', roles: ['COE_LAB_HEAD'] },
  { label: 'LOI Tracker', path: '/loi', roles: ['COE_LAB_HEAD'] },

  // COE Coordinator
  { label: 'Discussion Queue', path: '/discussions', roles: ['COE_COORDINATOR'] },
  { label: 'My Candidates', path: '/candidates', roles: ['COE_COORDINATOR'] },
  { label: 'LOI Status', path: '/loi', roles: ['COE_COORDINATOR'] },

  // Account Manager / MIS Manager
  { label: 'Mandates', path: '/requirements', roles: ['ACCOUNT_MANAGER', 'MIS_MANAGER'] },
  { label: 'Clients', path: '/clients', roles: ['ACCOUNT_MANAGER', 'MIS_MANAGER'] },
  { label: 'MIS Queue', path: '/approvals/mis', roles: ['MIS_MANAGER'] },
  { label: 'LOI Tracker', path: '/loi', roles: ['MIS_MANAGER'] },
  { label: 'Admin', path: '/admin/users', roles: ['MIS_MANAGER'] },

  // Head of Engineering
  { label: 'Review Queue', path: '/approvals/engineering', roles: ['HEAD_OF_ENGINEERING'] },
  { label: 'Analytics', path: '/analytics', roles: ['HEAD_OF_ENGINEERING'] },
];

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useSessionStore();

  const role = currentUser?.role;

  const handleLogout = () => {
    logout();
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
        {NAV_ITEMS.filter(isItemVisible).map((item) => (
          <div
            key={item.label + item.path}
            className={`sb-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            style={{ paddingLeft: 24 }}
          >
            {item.label}
          </div>
        ))}
      </div>

      {currentUser && (
        <div className="sb-bottom">
          <div className="sb-user" onClick={handleLogout} style={{ cursor: 'pointer' }} title="Click to logout">
            <div className="sb-avatar">{currentUser.avatar || currentUser.name.slice(0, 2)}</div>
            <div>
              <div className="sb-uname">{currentUser.name}</div>
              <div className="sb-urole" style={{ fontSize: 8, opacity: 0.7 }}>
                {currentUser.role.split('_')[0]}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
