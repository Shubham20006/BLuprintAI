import type { CandidateStatus, MappingStatus, LOIStatus, DriveStatus, MandateStatus } from '../types';

// ─── Status color maps ────────────────────────────────────────────────────────
export const CANDIDATE_STATUS_COLOR: Record<CandidateStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  Selected: 'info',
  Proposed: 'secondary',
  Mapped: 'primary',
  Discussed: 'warning',
  'LOI Sent': 'warning',
  'LOI Signed': 'success',
  'CFP Started': 'success',
  Dropped: 'error',
};

export const MAPPING_STATUS_COLOR: Record<MappingStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  Draft: 'default',
  Submitted: 'info',
  'Engineering Review': 'warning',
  'Approved by Eng': 'primary',
  'Confirmed by MIS': 'secondary',
  'In Discussion': 'warning',
  'LOI Issued': 'primary',
  Signed: 'success',
  'CFP Started': 'success',
};

export const LOI_STATUS_COLOR: Record<LOIStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  Pending: 'default',
  Sent: 'warning',
  Signed: 'success',
  Acknowledged: 'info',
};

export const DRIVE_STATUS_COLOR: Record<DriveStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  planned: 'info',
  completed: 'success',
  cancelled: 'error',
};

export const MANDATE_STATUS_COLOR: Record<MandateStatus, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  draft: 'default',
  active: 'success',
  closed: 'error',
};

// ─── Date formatters ──────────────────────────────────────────────────────────
export const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

// ─── ID generation ────────────────────────────────────────────────────────────
export const generateRequirementId = (
  clientShort: string,
  mandateType: string,
  techTag: string,
  intakeTag: string,
  date: string,
  seq: number
) => {
  const d = new Date(date);
  const mon = d.toLocaleString('en-US', { month: 'short' });
  const day = String(d.getDate()).padStart(2, '0');
  return `${clientShort}-${mandateType}-${techTag.replace(/\s+/g, '')}-${intakeTag.replace(/\s+/g, '')}-${mon}${day}-${seq}`;
};

export const generateId = () => Math.random().toString(36).slice(2, 10);

// ─── Number helpers ───────────────────────────────────────────────────────────
export const pct = (num: number, den: number) =>
  den === 0 ? 0 : Math.round((num / den) * 100);

export const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max);

// ─── Tech stack options ───────────────────────────────────────────────────────
export const TECH_STACKS = [
  'DotNet', 'Java', 'Python', 'React & Frontend',
  'Full Stack', 'Cloud & DevOps', 'Data Engineering',
  'Mobile (React Native)', 'QA & Automation', 'DevSecOps',
];

export const INTAKE_TYPES = ['Fresher ISA', 'Lateral', 'Internship', 'Contract'];
export const EXP_LEVELS = ['Fresher', '0-1 Year', '1-2 Years', '2-4 Years'];
export const ALLOCATION_TYPES = ['Primary', 'Secondary'];
export const DISCUSSION_OUTCOMES = ['Interested', 'Not Interested', 'Need Time', 'Unreachable'];

// ─── CSV export ───────────────────────────────────────────────────────────────
export const exportToCSV = <T extends Record<string, unknown>>(data: T[], filename: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      const str = Array.isArray(val) ? val.join('; ') : String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}.csv`; a.click();
  URL.revokeObjectURL(url);
};
