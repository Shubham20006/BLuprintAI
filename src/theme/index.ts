import { createTheme, alpha } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';

// Brand color palette
const brandPrimary = '#6366f1'; // indigo-500
const brandSecondary = '#8b5cf6'; // violet-500
const brandAccent = '#06b6d4'; // cyan-500
const brandSuccess = '#10b981';
const brandWarning = '#f59e0b';
const brandError = '#ef4444';

export const getTheme = (mode: PaletteMode) => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: brandPrimary,
        light: '#818cf8',
        dark: '#4f46e5',
        contrastText: '#ffffff',
      },
      secondary: {
        main: brandSecondary,
        light: '#a78bfa',
        dark: '#7c3aed',
        contrastText: '#ffffff',
      },
      success: { main: brandSuccess },
      warning: { main: brandWarning },
      error: { main: brandError },
      info: { main: brandAccent },
      background: {
        default: isDark ? '#0f0f1a' : '#f8fafc',
        paper: isDark ? '#1a1a2e' : '#ffffff',
      },
      text: {
        primary: isDark ? '#e2e8f0' : '#1e293b',
        secondary: isDark ? '#94a3b8' : '#64748b',
      },
      divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif',
      h1: { fontWeight: 700, letterSpacing: '-0.025em' },
      h2: { fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontWeight: 600, letterSpacing: '-0.015em' },
      h4: { fontWeight: 600, letterSpacing: '-0.01em' },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 500 },
      button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.01em' },
    },
    shape: { borderRadius: 12 },
    shadows: isDark
      ? [
          'none',
          '0 1px 3px rgba(0,0,0,0.4)',
          '0 2px 6px rgba(0,0,0,0.4)',
          '0 4px 12px rgba(0,0,0,0.4)',
          '0 8px 24px rgba(0,0,0,0.4)',
          '0 12px 40px rgba(0,0,0,0.5)',
          ...Array(19).fill('0 12px 40px rgba(0,0,0,0.5)'),
        ] as ReturnType<typeof createTheme>['shadows']
      : [
          'none',
          '0 1px 3px rgba(0,0,0,0.06)',
          '0 2px 6px rgba(0,0,0,0.06)',
          '0 4px 12px rgba(0,0,0,0.08)',
          '0 8px 24px rgba(0,0,0,0.08)',
          '0 12px 40px rgba(0,0,0,0.10)',
          ...Array(19).fill('0 12px 40px rgba(0,0,0,0.10)'),
        ] as ReturnType<typeof createTheme>['shadows'],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: isDark ? '#374151 transparent' : '#cbd5e1 transparent',
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              background: isDark ? '#374151' : '#cbd5e1',
              borderRadius: '3px',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '8px 20px',
            transition: 'all 0.2s ease',
            '&:hover': { transform: 'translateY(-1px)' },
          },
          contained: {
            boxShadow: `0 4px 14px ${alpha(brandPrimary, 0.4)}`,
            '&:hover': {
              boxShadow: `0 6px 20px ${alpha(brandPrimary, 0.5)}`,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            borderRadius: 8,
          },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 10,
              transition: 'box-shadow 0.2s ease',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: brandPrimary,
              },
              '&.Mui-focused': {
                boxShadow: `0 0 0 3px ${alpha(brandPrimary, 0.2)}`,
              },
            },
          },
        },
      },
      MuiSelect: {
        defaultProps: { size: 'small' },
        styleOverrides: {
          root: { borderRadius: 10 },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: isDark ? '#94a3b8' : '#64748b',
              background: isDark ? '#16213e' : '#f1f5f9',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            padding: '12px 16px',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            background: isDark
              ? 'linear-gradient(180deg, #16213e 0%, #0f0f1a 100%)'
              : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            background: isDark ? alpha('#1a1a2e', 0.85) : alpha('#ffffff', 0.85),
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: 'none',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            margin: '2px 8px',
            transition: 'all 0.2s ease',
            '&.Mui-selected': {
              background: `linear-gradient(135deg, ${alpha(brandPrimary, 0.2)}, ${alpha(brandSecondary, 0.15)})`,
              '&:hover': {
                background: `linear-gradient(135deg, ${alpha(brandPrimary, 0.25)}, ${alpha(brandSecondary, 0.2)})`,
              },
            },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 4, height: 6 },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: 8,
            fontSize: '0.75rem',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            textTransform: 'none',
            minHeight: 44,
          },
        },
      },
    },
  });
};
