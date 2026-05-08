import React from 'react';
import { Box, Toolbar } from '@mui/material';
import { Sidebar, DRAWER_WIDTH } from './Sidebar';
import { Topbar } from './Topbar';
import { useUIStore } from '../../store';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sidebarOpen } = useUIStore();
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {sidebarOpen && <Sidebar />}
      <Box
        component="main"
        sx={{
          flex: 1,
          ml: sidebarOpen ? `${DRAWER_WIDTH}px` : 0,
          transition: 'margin-left 0.3s ease',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Topbar />
        <Toolbar sx={{ minHeight: '60px !important' }} />
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3 }, maxWidth: '100%', overflowX: 'hidden' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};
