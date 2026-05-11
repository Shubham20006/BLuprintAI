import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSessionStore } from '../../store';
import { useNotifications } from '../../api/hooks';

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
    <div className="topbar">
      <div className="topbar-left">
        <span className="breadcrumb">{breadcrumbMain} / <span>Overview</span></span>
      </div>
      <div className="topbar-right">
        <div className={`tb-icon-btn ${unread > 0 ? 'notif-dot' : ''}`} title="Notifications">
          <i className="ti ti-bell" aria-hidden="true" />
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout} title="Logout">
          <i className="ti ti-logout" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
