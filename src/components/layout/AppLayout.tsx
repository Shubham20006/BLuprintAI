import React from 'react';
import { Sidebar } from './Sidebar';
import { useUIStore } from '../../store';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { LinearProgress, Box, CircularProgress, Typography } from '@mui/material';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sidebarOpen } = useUIStore();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  
  const showGlobalLoader = isFetching > 0;
  const showMutationOverlay = isMutating > 0;
  return (
    <div className="shell">
      {showGlobalLoader && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999, height: 2 }}>
          <LinearProgress sx={{ height: 2 }} />
        </div>
      )}
      {sidebarOpen && <Sidebar />}
      <div className="main">
        {/* Global Header */}
        {/* <div style={{ height: 60, borderBottom: '1px solid var(--g200)', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 24px' }}>
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <div style={{ 
              width: 32, 
              height: 32, 
              border: '1px solid var(--g200)', 
              borderRadius: 6, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--g500)'
            }}>
              <i className="ti ti-bell" />
            </div>
            <div style={{
              position: 'absolute',
              top: -6,
              right: -6,
              background: 'var(--red)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              width: 14,
              height: 14,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 2px #fff'
            }}>3</div>
          </div>
        </div> */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

