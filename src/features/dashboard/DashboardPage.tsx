import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../store';
import { useRequirements, useCandidates, useCOEs, useLOIs } from '../../api/hooks';
import { PageLoader } from '../../components/shared';
import { Box, Typography, Button, Select, MenuItem, Table, TableHead, TableBody, TableRow, TableCell, Grid, Card, Chip, IconButton, LinearProgress } from '@mui/material';

const KpiCard: React.FC<{ label: string; val: number | string; sub: string; color?: 'primary' | 'success' | 'warning' | 'secondary' }> = ({ label, val, sub, color = 'primary' }) => {
  const colorMap = {
    primary: 'var(--blue)',
    success: 'var(--green)',
    warning: 'var(--orange)',
    secondary: 'var(--purple)',
  };
  return (
    <Card sx={{ p: '12px 14px', borderTop: `3px solid ${colorMap[color]}`, borderRadius: 2 }}>
      <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.4, mb: 0.5 }}>{label}</Typography>
      <Typography sx={{ fontSize: 24, fontWeight: 700, color: 'text.primary', lineHeight: 1 }}>{val}</Typography>
      <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>{sub}</Typography>
    </Card>
  );
};

export const DashboardPage: React.FC = () => {
  const { currentUser } = useSessionStore();
  const navigate = useNavigate();
  
  const { data: requirements = [], isLoading: loadingReqs } = useRequirements();
  const { data: candidates = [], isLoading: loadingCands } = useCandidates();
  const { data: coes = [], isLoading: loadingCOEs } = useCOEs();
  const { data: lois = [], isLoading: loadingLOIs } = useLOIs();

  const isLoading = loadingReqs || loadingCands || loadingCOEs || loadingLOIs;

  const totalOpen = requirements.reduce((s, r) => s + r.openPositions, 0);
  const totalFilled = requirements.reduce((s, r) => s + r.filledPositions, 0);
  const totalSent = lois.length; // All LOIs issued (Sent + Signed)
  const totalSigned = lois.filter((l) => l.status === 'Signed').length;
  const totalCFP = candidates.filter((c) => c.status === 'CFP Started').length;

  const isAM = currentUser?.role === 'ACCOUNT_MANAGER';

  if (isLoading) {
    return (
      <Box sx={{ p: 2, flex: 1 }}>
        <PageLoader message="Generating dashboard insights..." />
      </Box>
    );
  }

  if (isAM) {
    return (
      <>
        <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #E5EBF0', px: 2, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <Typography sx={{ fontSize: 15, color: '#6B7C93' }}>
            Dashboard / <Box component="span" sx={{ color: '#111827', fontWeight: 500 }}>Mandates Overview</Box>
          </Typography>
          <Button variant="contained" size="small" onClick={() => navigate('/requirements')}>
            <i className="ti ti-plus" style={{ marginRight: 6 }} /> New Mandate
          </Button>
        </Box>
        
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, color: 'text.primary' }}>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}><KpiCard label="Total Mandates" val={requirements.length} sub="Active requirements" /></Grid>
            <Grid item xs={12} sm={6} md={3}><KpiCard label="Fulfilled" val={totalSigned} sub="LOIs Signed" color="success" /></Grid>
            <Grid item xs={12} sm={6} md={3}><KpiCard label="In Mapping" val={totalFilled} sub="Awaiting HOE Review" color="warning" /></Grid>
            <Grid item xs={12} sm={6} md={3}><KpiCard label="Open Positions" val={totalOpen} sub={`Across ${requirements.length} clients`} color="secondary" /></Grid>
          </Grid>
          
          <Card sx={{ borderRadius: 2 }}>
            <Box sx={{ p: '10px 14px', borderBottom: '1px solid #E5EBF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <i className="ti ti-file-description" style={{ marginRight: 5, color: 'var(--blue)' }} /> Active Mandates
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Select size="small" value="all" sx={{ width: 120, '& .MuiSelect-select': { py: 0.5, fontSize: 13 } }}>
                  <MenuItem value="all">All Clients</MenuItem>
                </Select>
                <Button variant="outlined" size="small" color="inherit">
                  <i className="ti ti-download" style={{ marginRight: 4 }} /> Export
                </Button>
              </Box>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Requirement ID</TableCell>
                    <TableCell>Short Name</TableCell>
                    <TableCell>Tech Stack</TableCell>
                    <TableCell>Positions</TableCell>
                    <TableCell>Mandate Date</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requirements.slice(0, 5).map(req => (
                    <TableRow key={req.id}>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: 'secondary.main', fontWeight: 600 }}>{req.requirementCode}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'secondary.main' }}>{req.requirementCode?.split('-')[0] || 'N/A'}</TableCell>
                      <TableCell>{req.techStack}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'secondary.main' }}>{req.openPositions}</TableCell>
                      <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{req.location || 'Remote'}</TableCell>
                      <TableCell>
                        <Chip label={req.status} size="small" sx={{ 
                          bgcolor: req.status === 'active' ? '#DBEAFE' : '#F0F4F8', 
                          color: req.status === 'active' ? '#1D4ED8' : '#6B7C93',
                          border: `1px solid ${req.status === 'active' ? '#93C5FD' : '#D0D9E4'}`,
                          height: 20, fontSize: 11, fontWeight: 600
                        }} />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" onClick={() => navigate('/requirements', { state: { requirement: req, mode: 'view' } })}>
                          <i className="ti ti-eye" />
                        </IconButton>
                        <IconButton size="small" onClick={() => navigate('/requirements', { state: { requirement: req, mode: 'edit' } })}>
                          <i className="ti ti-pencil" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Card>
        </Box>
      </>
    );
  }

  // Default / MIS Dashboard
  return (
    <>
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #E5EBF0', px: 2, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Typography sx={{ fontSize: 15, color: '#6B7C93' }}>
          Analytics / <Box component="span" sx={{ color: '#111827', fontWeight: 500 }}>MIS Dashboard</Box>
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Select size="small" value="month" sx={{ width: 100, '& .MuiSelect-select': { py: 0.5, fontSize: 13 } }}>
            <MenuItem value="month">This Month</MenuItem>
          </Select>
          <Button variant="outlined" size="small" color="inherit">
            <i className="ti ti-download" style={{ marginRight: 4 }} /> Export
          </Button>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, color: 'text.primary' }}>
        <Grid container spacing={1} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}><KpiCard label="Total Mandates" val={requirements.length} sub="Total reqs loaded" /></Grid>
          <Grid item xs={12} sm={6} md={3}><KpiCard label="Fulfilment rate" val={`${totalOpen ? Math.round((totalSigned/totalOpen)*100) : 0}%`} sub="Target met" color="success" /></Grid>
          <Grid item xs={12} sm={6} md={3}><KpiCard label="LOI conversion" val={`${totalSent ? Math.round((totalSigned/totalSent)*100) : 0}%`} sub="LOI signed / issued" color="warning" /></Grid>
          <Grid item xs={12} sm={6} md={3}><KpiCard label="CFP Started" val={totalCFP} sub="Candidates onboarding" color="secondary" /></Grid>
        </Grid>

        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2 }}>
              <Box sx={{ p: '10px 14px', borderBottom: '1px solid #E5EBF0' }}>
                <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Mandate Pipeline Funnel</Typography>
              </Box>
              <Box sx={{ p: 1.5 }}>
                {[
                  { lbl: 'Total Open Positions', val: totalOpen, w: '100%', bg: 'secondary.main' },
                  { lbl: 'Mapped', val: totalFilled, w: '85%', bg: 'primary.main' },
                  { lbl: 'LOI Issued', val: totalSent, w: '70%', bg: 'info.main' },
                  { lbl: 'LOI Signed', val: totalSigned, w: '70%', bg: 'success.main' },
                  { lbl: 'CFP Started', val: totalCFP, w: '55%', bg: 'primary.main' },
                ].map((step, i) => (
                  <Box key={i} sx={{ mb: 0.5 }}>
                    <Box sx={{ height: 28, borderRadius: 1, bgcolor: step.bg, width: step.w, display: 'flex', alignItems: 'center', px: 1.5, justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{step.lbl}</Typography>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{step.val}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Card>
            
            <Card sx={{ borderRadius: 2, mt: 1.5 }}>
              <Box sx={{ p: '10px 14px', borderBottom: '1px solid #E5EBF0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'var(--purple)', display: 'flex', alignItems: 'center' }}>
                  <i className="ti ti-robot" style={{ marginRight: 4 }} /> AI Weekly Summary
                </Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Mon, 25 Nov 2025</Typography>
              </Box>
              <Box sx={{ p: 1.5, fontSize: 13, color: 'text.secondary', lineHeight: 1.6 }}>
                <Box sx={{ mb: 1, color: 'text.primary', fontWeight: 500 }}>3 recommendations this week:</Box>
                <Box sx={{ p: '6px 10px', bgcolor: 'warning.light', borderRadius: 1, mb: 1, color: 'warning.main', fontSize: 12, display: 'flex', alignItems: 'center' }}>
                  <i className="ti ti-alert-triangle" style={{ marginRight: 6 }} /> Nov21-862 (AIML) at SLA risk — HOE review pending
                </Box>
                <Box sx={{ p: '6px 10px', bgcolor: 'success.light', borderRadius: 1, mb: 1, color: 'success.main', fontSize: 12, display: 'flex', alignItems: 'center' }}>
                  <i className="ti ti-trending-up" style={{ marginRight: 6 }} /> SRM COE placement rate improved 12% — prioritise for next mandate
                </Box>
                <Box sx={{ p: '6px 10px', bgcolor: 'primary.light', borderRadius: 1, color: 'secondary.main', fontSize: 12, display: 'flex', alignItems: 'center' }}>
                  <i className="ti ti-info-circle" style={{ marginRight: 6 }} /> 5 LOIs pending signature &gt; 5 days — coordinate with COE team
                </Box>
              </Box>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2 }}>
              <Box sx={{ p: '10px 14px', borderBottom: '1px solid #E5EBF0' }}>
                <Typography sx={{ fontSize: 15, fontWeight: 600 }}>COE Performance Score</Typography>
              </Box>
              <Box sx={{ p: 1.5 }}>
                {coes.slice(0, 5).map((coe, idx) => {
                  const score = 90 - (idx * 5);
                  const color = idx === 0 ? 'success' : idx < 3 ? 'primary' : 'warning';
                  return (
                    <Box key={coe.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary', width: 64, textAlign: 'right', flexShrink: 0 }}>
                        {coe.name?.split(' ')[0] || 'COE'}
                      </Typography>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', height: 16, bgcolor: '#F0F4F8', borderRadius: 1, position: 'relative' }}>
                          <LinearProgress variant="determinate" value={score} color={color} sx={{ width: '100%', height: '100%', borderRadius: 1, '& .MuiLinearProgress-bar': { borderRadius: 1 } }} />
                          <Typography sx={{ position: 'absolute', left: 8, fontSize: 10, fontWeight: 600, color: score > 20 ? '#fff' : 'text.secondary' }}>{score}%</Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Card>
            
            <Card sx={{ borderRadius: 2, mt: 1.5 }}>
              <Box sx={{ p: '10px 14px', borderBottom: '1px solid #E5EBF0' }}>
                <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Tech Domain Distribution</Typography>
              </Box>
              <Box sx={{ p: 0 }}>
                <Table size="small">
                  <TableBody>
                    {[
                      { tech: 'Java Full Stack', count: '14 mandates', pct: '30%', color: 'primary' },
                      { tech: '.NET / C#', count: '11 mandates', pct: '23%', color: 'warning' },
                      { tech: 'AI/ML & Data Eng', count: '9 mandates', pct: '19%', color: 'secondary' },
                      { tech: 'Python Dev', count: '7 mandates', pct: '15%', color: 'success' },
                    ].map((row, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ color: 'text.secondary' }}>{row.tech}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: 'secondary.main' }}>{row.count}</TableCell>
                        <TableCell align="right">
                          <Chip label={row.pct} size="small" color={row.color as any} sx={{ height: 20, fontSize: 11, fontWeight: 600 }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};
