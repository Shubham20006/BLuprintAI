import React from 'react';
import { useUsers, useCOEs } from '../../api/hooks';

export const AdminUsersPage: React.FC = () => {
  const { data: users = [] } = useUsers();
  const { data: coes = [] } = useCOEs();

  const getCoeName = (coeId: string) =>
    coes.find((c) => c.id === coeId)?.name.split(' ').slice(0, 2).join(' ') || coeId;

  const formatRole = (role: string) => 
    role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <span className="breadcrumb">System Admin / <span>User Management</span></span>
        </div>
      </div>

      <div className="content">
        <div className="panel">
          <div className="panel-hd">
            <span className="panel-title">System User Directory</span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>COE Scope</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="sb-avatar" style={{ width: 32, height: 32, fontSize: 10 }}>
                          {user.avatar || user.name.slice(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{user.name}</div>
                          <div style={{ fontSize: 9, color: 'var(--g500)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge active" style={{ fontSize: 9 }}>
                        {formatRole(user.role)}
                      </span>
                    </td>
                    <td>
                      {user.coeScopeIds.length === 0 ? (
                        <span className="badge loi">Global</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {user.coeScopeIds.map((coeId) => (
                            <span key={coeId} className="badge draft" style={{ fontSize: 8 }}>
                              {getCoeName(coeId)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${user.status === 'active' ? 'fulfilled' : 'draft'}`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};


