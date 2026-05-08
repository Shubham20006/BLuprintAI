import React from 'react';
import {
  Box, Typography, Button, Card, CardContent,
  Avatar, Chip, alpha, useTheme, Divider,
} from '@mui/material';
import { Google, AccountTree, Security, Speed, Analytics } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '../../api/hooks';
import { useSessionStore } from '../../store';
import { ROLE_LABELS } from '../../auth/permissions';
import type { User } from '../../types';

const ROLE_COLORS = {
  MIS_MANAGER: '#ef4444',
  ACCOUNT_MANAGER: '#06b6d4',
  COE_LAB_HEAD: '#6366f1',
  HEAD_OF_ENGINEERING: '#f59e0b',
  COE_COORDINATOR: '#10b981',
};

export const LoginPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { setCurrentUser } = useSessionStore();
  const { data: users = [], isLoading } = useUsers();

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    navigate('/dashboard');
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: theme.palette.mode === 'dark'
        ? 'linear-gradient(135deg, #0f0f1a 0%, #16213e 50%, #0f3460 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #ede9fe 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      {[
        { top: '-100px', left: '-100px', size: 400, color: '#6366f1' },
        { bottom: '-120px', right: '-100px', size: 350, color: '#8b5cf6' },
        { top: '40%', left: '60%', size: 200, color: '#06b6d4' },
      ].map((blob, i) => (
        <Box key={i} sx={{
          position: 'absolute',
          width: blob.size, height: blob.size, borderRadius: '50%',
          background: alpha(blob.color, theme.palette.mode === 'dark' ? 0.12 : 0.08),
          filter: 'blur(60px)',
          top: blob.top, bottom: (blob as any).bottom,
          left: blob.left, right: (blob as any).right,
          pointerEvents: 'none',
        }} />
      ))}

      <Box sx={{ position: 'relative', width: '100%', maxWidth: 1000 }}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 4,
          alignItems: 'center',
        }}>
          {/* Left: Brand panel */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Box sx={{
                width: 56, height: 56, borderRadius: 3,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
              }}>
                <AccountTree sx={{ color: '#fff', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800}
                  sx={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  MandateMatch AI
                </Typography>
                <Typography variant="caption" color="text.secondary">BridgeLabz Fellowship Mapping MIS</Typography>
              </Box>
            </Box>

            <Typography variant="h3" fontWeight={800} lineHeight={1.2} mb={2}>
              Smart Mandate{'\n'}
              <Box component="span"
                sx={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Intelligence
              </Box>{' '}System
            </Typography>

            <Typography variant="body1" color="text.secondary" mb={4} lineHeight={1.7}>
              AI-powered fellowship mapping platform. Coordinate mandates, manage candidates,
              and streamline your entire hiring pipeline with full traceability.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { icon: <Security fontSize="small" />, text: 'Role-based access with COE scoping' },
                { icon: <Speed fontSize="small" />, text: 'End-to-end mapping workflow & approvals' },
                { icon: <Analytics fontSize="small" />, text: 'Universal MIS dashboard & analytics' },
              ].map((feat, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: 1.5,
                    background: alpha('#6366f1', 0.15),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#6366f1',
                  }}>
                    {feat.icon}
                  </Box>
                  <Typography variant="body2" color="text.secondary">{feat.text}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Right: Login card */}
          <Card sx={{
            borderRadius: 4,
            border: `1px solid ${theme.palette.divider}`,
            backdropFilter: 'blur(20px)',
            background: theme.palette.mode === 'dark'
              ? alpha('#1a1a2e', 0.9)
              : alpha('#ffffff', 0.9),
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight={700} mb={0.5}>Sign in to MM-AI</Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Select a demo user to explore the platform
              </Typography>

              <Button
                fullWidth variant="outlined" size="large"
                startIcon={<Google />}
                sx={{ mb: 3, borderRadius: 2, py: 1.5, borderColor: 'divider' }}
              >
                Continue with Google SSO
              </Button>

              <Divider sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary">or choose demo user</Typography>
              </Divider>

              {isLoading ? (
                <Typography variant="body2" color="text.secondary" textAlign="center">Loading users…</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {users.map((user) => {
                    const color = ROLE_COLORS[user.role] || '#6366f1';
                    return (
                      <Box
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 2,
                          p: 1.5, borderRadius: 2, cursor: 'pointer',
                          border: `1px solid ${theme.palette.divider}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            background: alpha(color, 0.08),
                            borderColor: alpha(color, 0.3),
                            transform: 'translateX(4px)',
                          },
                        }}
                      >
                        <Avatar sx={{ bgcolor: color, width: 36, height: 36, fontSize: '0.8rem', fontWeight: 700 }}>
                          {user.avatar}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>{user.name}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>{user.email}</Typography>
                        </Box>
                        <Chip
                          label={ROLE_LABELS[user.role].split(' ').map(w => w[0]).join('')}
                          size="small"
                          sx={{
                            fontSize: '0.6rem', fontWeight: 700, height: 20,
                            background: alpha(color, 0.15), color,
                            border: `1px solid ${alpha(color, 0.3)}`,
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};
