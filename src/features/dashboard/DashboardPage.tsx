import React from 'react';
import {
  Box, Grid, Typography, Select, MenuItem, FormControl,
  InputLabel, Button, useTheme, alpha, Chip, Divider,
  Table, TableBody, TableCell, TableHead, TableRow, Paper,
  LinearProgress,
} from '@mui/material';
import {
  Assignment, People, AccountTree, CheckCircle,
  Download, Refresh, TrendingUp,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  FunnelChart, Funnel, LabelList,
} from 'recharts';
import { useMandates, useRequirements, useCandidates, useMappings, useCOEs, useLOIs } from '../../api/hooks';
import { useFiltersStore, useSessionStore } from '../../store';
import { StatCard, SectionCard, StatusChip, CapacityBar } from '../../components/shared';
import { formatDate, exportToCSV, pct } from '../../utils';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const { filters, setFilter, resetFilters } = useFiltersStore();
  const { currentUser } = useSessionStore();

  const { data: mandates = [] } = useMandates();
  const { data: requirements = [] } = useRequirements();
  const { data: candidates = [] } = useCandidates();
  const { data: mappings = [] } = useMappings();
  const { data: coes = [] } = useCOEs();
  const { data: lois = [] } = useLOIs();

  // ── Derived metrics ──────────────────────────────────────────────────────
  const totalOpen = requirements.reduce((s, r) => s + r.openPositions, 0);
  const totalFilled = requirements.reduce((s, r) => s + r.filledPositions, 0);
  const totalSigned = lois.filter((l) => l.status === 'Signed').length;
  const totalCFP = candidates.filter((c) => c.status === 'CFP Started').length;

  // ── Funnel data ──────────────────────────────────────────────────────────
  const funnelData = [
    { name: 'Open Positions', value: totalOpen, fill: '#6366f1' },
    { name: 'Mapped', value: totalFilled, fill: '#8b5cf6' },
    { name: 'LOI Signed', value: totalSigned, fill: '#06b6d4' },
    { name: 'CFP Started', value: totalCFP, fill: '#10b981' },
  ];

  // ── COE conversion chart ─────────────────────────────────────────────────
  const coeData = coes.map((coe) => {
    const coeCandidates = candidates.filter((c) => c.coeId === coe.id);
    const mapped = coeCandidates.filter((c) =>
      ['Mapped','Discussed','LOI Sent','LOI Signed','CFP Started'].includes(c.status)
    ).length;
    const signed = coeCandidates.filter((c) =>
      ['LOI Signed','CFP Started'].includes(c.status)
    ).length;
    return { name: coe.name.split(' ').slice(0, 2).join(' '), selected: coeCandidates.length, mapped, signed };
  });

  // ── Tech stack distribution ───────────────────────────────────────────────
  const techMap: Record<string, number> = {};
  requirements.forEach((r) => {
    techMap[r.techStack] = (techMap[r.techStack] || 0) + r.openPositions;
  });
  const techData = Object.entries(techMap).map(([name, value]) => ({ name, value }));

  // ── Aging table ───────────────────────────────────────────────────────────
  const agingMappings = mappings
    .filter((m) => !['CFP Started', 'Signed'].includes(m.status))
    .map((m) => {
      const days = Math.floor((Date.now() - new Date(m.updatedAt).getTime()) / 86400000);
      const req = requirements.find((r) => r.id === m.requirementId);
      return { ...m, days, reqCode: req?.requirementCode || m.requirementId };
    })
    .sort((a, b) => b.days - a.days);

  const handleExport = () => {
    exportToCSV(
      requirements.map((r) => ({
        RequirementCode: r.requirementCode,
        TechStack: r.techStack,
        OpenPositions: r.openPositions,
        FilledPositions: r.filledPositions,
        Status: r.status,
        OnboardingDate: r.onboardingDate,
      })),
      'requirements-export'
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>MIS Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">Universal mandate & mapping intelligence view</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button size="small" startIcon={<Refresh />} onClick={resetFilters} variant="outlined">Reset</Button>
          <Button size="small" startIcon={<Download />} onClick={handleExport} variant="contained">Export CSV</Button>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{
        display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3, p: 2,
        borderRadius: 2, background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
      }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>COE</InputLabel>
          <Select value={filters.coeId} label="COE" onChange={(e) => setFilter('coeId', e.target.value)}>
            <MenuItem value="">All COEs</MenuItem>
            {coes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name.split(' ').slice(0,2).join(' ')}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Tech Stack</InputLabel>
          <Select value={filters.techStack} label="Tech Stack" onChange={(e) => setFilter('techStack', e.target.value)}>
            <MenuItem value="">All Stacks</MenuItem>
            {[...new Set(requirements.map((r) => r.techStack))].map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filters.status} label="Status" onChange={(e) => setFilter('status', e.target.value)}>
            <MenuItem value="">All Status</MenuItem>
            {['draft','active','fulfilled','cancelled'].map((s) => (
              <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5} mb={3}>
        {[
          { label: 'Total Open Positions', value: totalOpen, icon: <Assignment />, color: '#6366f1' },
          { label: 'Candidates Mapped', value: totalFilled, icon: <People />, color: '#8b5cf6' },
          { label: 'LOIs Signed', value: totalSigned, icon: <CheckCircle />, color: '#10b981' },
          { label: 'CFP Started', value: totalCFP, icon: <TrendingUp />, color: '#f59e0b' },
        ].map((kpi) => (
          <Grid item xs={6} md={3} key={kpi.label}>
            <StatCard {...kpi} />
          </Grid>
        ))}
      </Grid>

      {/* Charts row */}
      <Grid container spacing={2.5} mb={3}>
        {/* Funnel */}
        <Grid item xs={12} md={5}>
          <SectionCard title="Conversion Funnel">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip
                  contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        </Grid>

        {/* COE Conversion */}
        <Grid item xs={12} md={7}>
          <SectionCard title="COE-wise Pipeline">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={coeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.5)} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="selected" name="Selected" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mapped" name="Mapped" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="signed" name="Signed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        </Grid>

        {/* Tech stack pie */}
        <Grid item xs={12} md={5}>
          <SectionCard title="Open Positions by Tech Stack">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={techData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {techData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </SectionCard>
        </Grid>

        {/* Requirements capacity */}
        <Grid item xs={12} md={7}>
          <SectionCard title="Requirements Capacity">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {requirements.slice(0, 5).map((r) => (
                <Box key={r.id}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" fontWeight={600} noWrap sx={{ maxWidth: '60%' }}>
                      {r.requirementCode.split('-').slice(0, 3).join('-')}
                    </Typography>
                    <StatusChip status={r.status} type="mandate" />
                  </Box>
                  <CapacityBar filled={r.filledPositions} open={r.openPositions} />
                </Box>
              ))}
            </Box>
          </SectionCard>
        </Grid>
      </Grid>

      {/* Aging / SLA table */}
      <SectionCard title="Aging Mappings (SLA Risk)">
        {agingMappings.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>No pending mappings</Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Requirement</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Days Pending</TableCell>
                  <TableCell>Risk</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {agingMappings.slice(0, 8).map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell>
                      <Typography variant="caption" fontWeight={600}>{m.reqCode}</Typography>
                    </TableCell>
                    <TableCell><StatusChip status={m.status} type="mapping" /></TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}
                        sx={{ color: m.days > 7 ? '#ef4444' : m.days > 3 ? '#f59e0b' : 'inherit' }}>
                        {m.days}d
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={m.days > 7 ? 'HIGH' : m.days > 3 ? 'MED' : 'LOW'}
                        size="small"
                        color={m.days > 7 ? 'error' : m.days > 3 ? 'warning' : 'success'}
                        sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </SectionCard>
    </Box>
  );
};
