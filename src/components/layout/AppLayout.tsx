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
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {showGlobalLoader && (
        <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999, height: 2 }}>
          <LinearProgress sx={{ height: 2 }} />
        </Box>
      )}
      {sidebarOpen && <Sidebar />}
      <Box sx={{ flex: 1, bgcolor: 'background.default', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

