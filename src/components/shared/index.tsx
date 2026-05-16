import React from 'react';
import {
  Box, Chip, Avatar, Tooltip, LinearProgress, CircularProgress,
  Typography, alpha, useTheme, Button
} from '@mui/material';
import type { ChipProps, ButtonProps } from '@mui/material';
import type {
  CandidateStatus, MappingStatus, MandateStatus,
  LOIStatus, DriveStatus, UserRole,
} from '../../types';
import {
  CANDIDATE_STATUS_COLOR, MAPPING_STATUS_COLOR,
  MANDATE_STATUS_COLOR, LOI_STATUS_COLOR, DRIVE_STATUS_COLOR,
  pct,
} from '../../utils';
import { ROLE_LABELS } from '../../auth/permissions';

// ─── Status Chip ──────────────────────────────────────────────────────────────
type AnyStatus = CandidateStatus | MappingStatus | MandateStatus | LOIStatus | DriveStatus | string;
type StatusType = 'candidate' | 'mapping' | 'mandate' | 'loi' | 'drive';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: AnyStatus;
  type: StatusType;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, type, ...rest }) => {
  const maps: Record<StatusType, Record<string, ChipProps['color']>> = {
    candidate: CANDIDATE_STATUS_COLOR as Record<string, ChipProps['color']>,
    mapping: MAPPING_STATUS_COLOR as Record<string, ChipProps['color']>,
    mandate: MANDATE_STATUS_COLOR as Record<string, ChipProps['color']>,
    loi: LOI_STATUS_COLOR as Record<string, ChipProps['color']>,
    drive: DRIVE_STATUS_COLOR as Record<string, ChipProps['color']>,
  };
  const color = maps[type]?.[status] ?? 'default';
  return (
    <Chip
      label={status}
      color={color}
      size="small"
      variant="filled"
      {...rest}
      sx={{ fontWeight: 600, fontSize: '0.7rem', ...rest.sx }}
    />
  );
};

// ─── Role Badge ───────────────────────────────────────────────────────────────
export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const theme = useTheme();
  const colorMap: Record<UserRole, string> = {
    MIS_MANAGER: theme.palette.error.main,
    ACCOUNT_MANAGER: theme.palette.info.main,
    COE_LAB_HEAD: theme.palette.primary.main,
    HEAD_OF_ENGINEERING: theme.palette.warning.main,
    COE_COORDINATOR: theme.palette.success.main,
  };
  const color = colorMap[role] ?? theme.palette.primary.main;
  return (
    <Chip
      label={ROLE_LABELS[role]}
      size="small"
      sx={{
        fontWeight: 700, fontSize: '0.68rem',
        background: alpha(color, 0.15), color,
        border: `1px solid ${alpha(color, 0.3)}`,
      }}
    />
  );
};

// ─── User Avatar Cell ─────────────────────────────────────────────────────────
export const UserAvatarCell: React.FC<{
  name: string; email?: string; avatar?: string;
}> = ({ name, email, avatar }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
      {avatar || name.slice(0, 2).toUpperCase()}
    </Avatar>
    <Box>
      <Typography variant="body2" fontWeight={600} lineHeight={1.2}>{name}</Typography>
      {email && (
        <Typography variant="caption" color="text.secondary">{email}</Typography>
      )}
    </Box>
  </Box>
);

// ─── Capacity Bar ─────────────────────────────────────────────────────────────
export const CapacityBar: React.FC<{
  filled: number; open: number; showLabel?: boolean;
}> = ({ filled, open, showLabel = true }) => {
  const theme = useTheme();
  const percent = pct(filled, open);
  const color =
    percent >= 100 ? theme.palette.success.main
    : percent >= 60 ? theme.palette.warning.main
    : theme.palette.primary.main;
  return (
    <Box>
      {showLabel && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">{filled}/{open} filled</Typography>
          <Typography variant="caption" fontWeight={700} sx={{ color }}>{percent}%</Typography>
        </Box>
      )}
      <LinearProgress
        variant="determinate"
        value={Math.min(percent, 100)}
        sx={{ bgcolor: alpha(color, 0.15), '& .MuiLinearProgress-bar': { bgcolor: color } }}
      />
    </Box>
  );
};

// ─── Info Row ─────────────────────────────────────────────────────────────────
export const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75 }}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>{label}</Typography>
    <Typography variant="body2" fontWeight={500} textAlign="right">{value}</Typography>
  </Box>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
export const StatCard: React.FC<{
  label: string; value: number | string; icon: React.ReactNode;
  color?: string; trend?: string; trendUp?: boolean;
}> = ({ label, value, icon, color = '#6366f1', trend, trendUp }) => {
  const theme = useTheme();
  return (
    <Box sx={{
      p: 2.5, borderRadius: 3,
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      position: 'relative', overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
    }}>
      <Box sx={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: alpha(color, 0.12),
      }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}
          sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
          {label}
        </Typography>
        <Box sx={{ color, display: 'flex' }}>{icon}</Box>
      </Box>
      <Typography variant="h4" fontWeight={800} sx={{ color, mb: 0.5 }}>{value}</Typography>
      {trend && (
        <Typography variant="caption" sx={{ color: trendUp ? theme.palette.success.main : theme.palette.error.main }}>
          {trendUp ? '▲' : '▼'} {trend}
        </Typography>
      )}
    </Box>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState: React.FC<{
  icon: React.ReactNode; title: string; subtitle?: string;
}> = ({ icon, title, subtitle }) => (
  <Box sx={{ textAlign: 'center', py: 8 }}>
    <Box sx={{ fontSize: 50, color: 'text.secondary', mb: 2, opacity: 0.5 }}>{icon}</Box>
    <Typography variant="h6" color="text.secondary" gutterBottom>{title}</Typography>
    {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
  </Box>
);

// ─── Truncated text ───────────────────────────────────────────────────────────
export const TruncatedText: React.FC<{ text: string; maxLen?: number }> = ({ text, maxLen = 40 }) =>
  text.length > maxLen ? (
    <Tooltip title={text}><span>{text.slice(0, maxLen)}…</span></Tooltip>
  ) : <span>{text}</span>;

// ─── Page Header ─────────────────────────────────────────────────────────────
export const PageHeader: React.FC<{
  title: string; subtitle?: string; action?: React.ReactNode;
}> = ({ title, subtitle, action }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
    <Box>
      <Typography variant="h5" fontWeight={700}>{title}</Typography>
      {subtitle && <Typography variant="body2" color="text.secondary" mt={0.5}>{subtitle}</Typography>}
    </Box>
    {action && <Box>{action}</Box>}
  </Box>
);

// ─── Section Card ─────────────────────────────────────────────────────────────
export const SectionCard: React.FC<{
  title?: string; children: React.ReactNode; action?: React.ReactNode; sx?: object;
}> = ({ title, children, action, sx }) => {
  const theme = useTheme();
  return (
    <Box sx={{
      p: 3, borderRadius: 3,
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      ...sx,
    }}>
      {(title || action) && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          {title && <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>}
          {action}
        </Box>
      )}
      {children}
    </Box>
  );
};
// ─── Loading Button ──────────────────────────────────────────────────────────

interface LoadingButtonProps extends Omit<ButtonProps, 'variant'> {
  loading?: boolean;
  variant?: ButtonProps['variant'] | 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  icon?: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({ 
  loading, 
  variant = 'contained', 
  color = 'primary',
  icon, 
  children, 
  ...props 
}) => {
  const muiVariant = (variant === 'primary' || variant === 'secondary' || variant === 'danger' || variant === 'success' || variant === 'ghost') ? 'contained' : variant;
  
  return (
    <Button 
      variant={muiVariant}
      color={color}
      disabled={loading || props.disabled}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : icon}
      {...props}
    >
      {children}
    </Button>
  );
};
// ─── Page Loader ─────────────────────────────────────────────────────────────
export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Loading data...' }) => (
  <Box sx={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    py: 12,
    gap: 2 
  }}>
    <CircularProgress size={40} sx={{ color: 'var(--blue)' }} />
    <Typography sx={{ color: 'var(--g500)', fontSize: 14, fontWeight: 500 }}>
      {message}
    </Typography>
  </Box>
);
