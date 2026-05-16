import { createTheme, alpha } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';

// Brand color palette from index.css
const brandNavy = '#1A3C6E';
const brandBlue = '#0A84D0';
const brandGreen = '#1B7F4A';
const brandOrange = '#C25A00';
const brandRed = '#B91C1C';
const brandTeal = '#0D7377';
const brandPurple = '#5A2D82';

export const getTheme = (mode: PaletteMode) => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: brandBlue,
        light: '#E8F4FD',
        dark: brandNavy,
        contrastText: '#ffffff',
      },
      secondary: {
        main: brandNavy,
        contrastText: '#ffffff',
      },
      success: { main: brandGreen, light: '#ECFDF5' },
      warning: { main: brandOrange, light: '#FFF7ED' },
      error: { main: brandRed, light: '#FEE2E2' },
      info: { main: brandTeal, light: '#E0F5F5' },
      background: {
        default: isDark ? '#111827' : '#F8FAFC',
        paper: isDark ? '#1F2937' : '#ffffff',
      },
      text: {
        primary: isDark ? '#F3F4F6' : '#111827',
        secondary: isDark ? '#9CA3AF' : '#6B7C93',
      },
      divider: isDark ? 'rgba(255,255,255,0.08)' : '#E5EBF0', // var(--g200)
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
      h1: { fontWeight: 700, letterSpacing: '-0.025em' },
      h2: { fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontWeight: 600, letterSpacing: '-0.015em' },
      h4: { fontWeight: 600, letterSpacing: '-0.01em' },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 500 },
      button: { fontWeight: 500, textTransform: 'none' }, // from .btn { font-weight: 500 }
    },
    shape: { borderRadius: 8 }, // panel border-radius is 8px
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
            borderRadius: 6, // .btn { border-radius: 6px }
            padding: '6px 12px',
            fontSize: '14px',
            transition: 'all .15s',
            minWidth: 'auto',
          },
          sizeSmall: {
            padding: '8px 8px',
            fontSize: '13px',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#D0D9E4'}`, // var(--g300)
            boxShadow: 'none',
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
            borderRadius: 10,
            fontSize: '12px',
            height: '24px',
          },
        },
      },
      MuiTextField: {
        defaultProps: { size: 'small' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 6, // .form-input { border-radius: 6px }
              backgroundColor: '#fff',
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: brandBlue,
              },
              '&.Mui-focused': {
                boxShadow: `0 0 0 3px ${alpha(brandBlue, 0.1)}`,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#D0D9E4', // var(--g300)
              }
            },
          },
        },
      },
      MuiSelect: {
        defaultProps: { size: 'small' },
        styleOverrides: {
          root: { borderRadius: 6, backgroundColor: '#fff' },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              fontWeight: 600,
              fontSize: '12px',
              color: '#fff',
              background: brandNavy, // .tbl th { background: var(--navy) }
              letterSpacing: '.3px',
              padding: '7px 10px',
              borderBottom: 'none',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E5EBF0', // var(--g200)
            padding: '7px 10px',
            fontSize: '13px',
            color: '#111827', // var(--g900)
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:last-child td, &:last-child th': { border: 0 },
            '&:hover': { backgroundColor: '#F8FAFC' }, // var(--g50)
          }
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            background: brandNavy,
            borderRight: 'none',
            color: '#A8C8E8',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            background: '#ffffff',
            borderBottom: `1px solid #D0D9E4`, // var(--g300)
            boxShadow: 'none',
            color: '#111827',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            margin: '0',
            padding: '8px 14px',
            transition: 'all .1s',
            borderLeft: '3px solid transparent',
            color: '#A8C8E8',
            '&:hover': {
              background: 'rgba(255,255,255,.06)',
              color: '#fff',
            },
            '&.Mui-selected': {
              background: brandBlue,
              color: '#fff',
              borderLeftColor: '#fff',
              '&:hover': {
                background: brandBlue,
              },
            },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            minWidth: 'auto',
            marginRight: '8px',
            color: 'inherit',
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            padding: '16px 20px',
            borderBottom: `1px solid #E5EBF0`, // var(--g200)
            fontSize: '17px',
            fontWeight: 600,
            color: '#111827',
          }
        }
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            padding: '20px',
          }
        }
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: '14px 20px',
            borderTop: `1px solid #E5EBF0`, // var(--g200)
          }
        }
      }
    },
  });
};

