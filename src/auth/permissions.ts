import type { UserRole } from '../types';

// ─── Role display names ───────────────────────────────────────────────────────
export const ROLE_LABELS: Record<UserRole, string> = {
  MIS_MANAGER: 'MIS Manager',
  ACCOUNT_MANAGER: 'Account Manager',
  COE_LAB_HEAD: 'COE Lab Head',
  HEAD_OF_ENGINEERING: 'Head of Engineering',
  COE_COORDINATOR: 'COE Coordinator',
};

// ─── Route permissions ────────────────────────────────────────────────────────
export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/mandates': ['MIS_MANAGER', 'ACCOUNT_MANAGER'],
  '/mandates/new': ['MIS_MANAGER', 'ACCOUNT_MANAGER'],
  '/approvals/engineering': ['HEAD_OF_ENGINEERING'],
  '/approvals/mis': ['MIS_MANAGER'],
  '/admin/users': ['MIS_MANAGER'],
};

// ─── Action permissions ───────────────────────────────────────────────────────
export const can = {
  createMandate: (role: UserRole) =>
    ['MIS_MANAGER', 'ACCOUNT_MANAGER'].includes(role),

  createRequirement: (role: UserRole) =>
    ['MIS_MANAGER', 'ACCOUNT_MANAGER'].includes(role),

  createHiringDrive: (role: UserRole) =>
    ['MIS_MANAGER', 'COE_LAB_HEAD'].includes(role),

  importCandidates: (role: UserRole) =>
    ['MIS_MANAGER', 'COE_LAB_HEAD'].includes(role),

  createMapping: (role: UserRole) =>
    ['MIS_MANAGER', 'COE_LAB_HEAD'].includes(role),

  submitMapping: (role: UserRole) =>
    ['MIS_MANAGER', 'COE_LAB_HEAD'].includes(role),

  engineeringApprove: (role: UserRole) =>
    role === 'HEAD_OF_ENGINEERING',

  misConfirm: (role: UserRole) =>
    role === 'MIS_MANAGER',

  updateDiscussion: (role: UserRole) =>
    ['MIS_MANAGER', 'COE_COORDINATOR'].includes(role),

  issueLOI: (role: UserRole) =>
    ['MIS_MANAGER', 'COE_LAB_HEAD'].includes(role),

  adminUsers: (role: UserRole) =>
    role === 'MIS_MANAGER',

  isCOEScoped: (role: UserRole) =>
    ['COE_LAB_HEAD', 'COE_COORDINATOR'].includes(role),
};
