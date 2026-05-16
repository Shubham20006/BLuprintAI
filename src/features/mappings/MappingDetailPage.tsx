import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  Box,
  Typography,
  Button,
  Card,
  Grid,
  Chip,
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import {
  useMapping, useRequirement, useMappingLineItems,
  useCandidates, useApprovals, useUpdateMapping,
  useCreateApproval, useMandates, useClients, useCOEs
} from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { formatDate, generateId } from '../../utils';
import type { MappingStatus } from '../../types';

export const MappingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useSessionStore();

  const { data: mapping } = useMapping(id || '');
  const { data: requirement } = useRequirement(mapping?.requirementId || '');
  const { data: mandates = [] } = useMandates();
  const { data: clients = [] } = useClients();
  const { data: coes = [] } = useCOEs();
  const { data: lineItems = [] } = useMappingLineItems(id);
  const { data: candidates = [] } = useCandidates();
  
  const { mutateAsync: updateMapping } = useUpdateMapping();
  const { mutateAsync: createApproval } = useCreateApproval();

  if (!mapping || !requirement) return <div style={{ padding: 20 }}>Loading...</div>;

  const mandate = mandates.find(m => m.id === requirement.mandateId);
  const client = clients.find(c => c.id === mandate?.clientId);

  const mappedCandidates = lineItems.map((li) => {
    const candidate = candidates.find((c) => c.id === li.candidateId);
    const coe = coes.find((c) => Number(c.id) === Number(candidate?.coeId));
    return {
      ...li,
      candidate,
      coe,
      matchScore: Math.floor(Math.random() * 15) + 80, // Mock score 80-95
      techScore: Math.floor(Math.random() * 15) + 80,
      academicScore: Math.floor(Math.random() * 20) + 75,
      coeScore: Math.floor(Math.random() * 15) + 80,
    };
  }).sort((a, b) => b.matchScore - a.matchScore);

  const canSubmit = currentUser && can.submitMapping(currentUser.role) && mapping.status === 'Draft';

  const handleAction = async (decision: 'Approved' | 'Rejected', nextStatus: MappingStatus) => {
    try {
      await createApproval({
        id: generateId(),
        mappingId: id || '',
        actorRole: currentUser!.role,
        actorId: currentUser!.id,
        decision,
        comment: '',
        timestamp: new Date().toISOString(),
      });
      await updateMapping({ id: id!, status: nextStatus, updatedAt: new Date().toISOString() });
      enqueueSnackbar(`Mapping submitted successfully`, { variant: 'success' });
      navigate('/dashboard');
    } catch {
      enqueueSnackbar('Error processing action', { variant: 'error' });
    }
  };

  const techShort = requirement.techStack.split(' ')[0] || '.NET / C# Stack';
  const confidence = 91;

  // Mock COE allocations for Mix & Match graph
  const coeAllocations = [
    { name: 'SRM', seats: 3, percentage: 60, color: 'var(--blue)' },
    { name: 'GLA', seats: 2, percentage: 40, color: 'var(--teal)' },
  ];

  return (
    <>
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #E5EBF0', px: 2, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography sx={{ fontSize: 15, color: '#6B7C93' }}>
            AI Mapping / <Box component="span" sx={{ color: '#111827', fontWeight: 500 }}>{requirement.requirementCode}</Box>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" color="inherit" onClick={() => navigate('/mappings')}>
            <i className="ti ti-arrow-left" style={{ marginRight: 6 }} /> Back
          </Button>
          {canSubmit && (
            <Button variant="contained" size="small" color="primary" onClick={() => handleAction('Approved', 'Engineering Review')}>
              <i className="ti ti-send" style={{ marginRight: 6 }} /> Submit to HOE
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ p: 3 }}>
        <Box sx={{ bgcolor: 'secondary.light', border: '1px solid rgba(90,45,130,.2)', borderRadius: 2, p: '10px 14px', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'secondary.main', display: 'flex', alignItems: 'center' }}>
              <i className="ti ti-sparkles" style={{ marginRight: 4 }} />
              AI Mapping Engine — Claude 3.5 Sonnet via AWS Bedrock
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.5 }}>
              Ranked {mappedCandidates.length || 7} candidates from 3 COEs for {requirement.openPositions} {techShort} positions in {requirement.location} · Confidence: {confidence}%
            </Typography>
          </Box>
          <Chip label={`${confidence}% Confident`} size="small" sx={{ bgcolor: 'secondary.light', color: 'secondary.main', border: '1px solid rgba(90,45,130,.3)', fontSize: 12, fontWeight: 600 }} />
        </Box>

        <Grid container spacing={2} alignItems="flex-start">
          {/* Left Column: Candidates */}
          <Grid item xs={12} md={6}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.4, mb: 1 }}>
              AI Recommended Mapping
            </Typography>
            
            {mappedCandidates.map((c, idx) => {
              let badgeText = 'Good';
              if (c.matchScore >= 90) badgeText = 'Best Match';
              else if (c.matchScore >= 85) badgeText = 'Strong';

              return (
                <Card key={c.id || idx} sx={{ mb: 1, borderRadius: 2, border: '1px solid #E5EBF0', boxShadow: 'none', transition: 'all 0.2s', '&:hover': { borderColor: '#CBD5E1', boxShadow: '0 2px 8px rgba(15,23,42,0.05)' } }}>
                  <Box sx={{ p: '12px 16px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {idx + 1}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{c.candidate?.name || 'Unknown'}</Typography>
                        <Typography sx={{ fontSize: 12, color: '#6B7C93' }}>{c.coe?.name || 'Unknown University'} · GPA 8.{Math.floor(Math.random() * 9)}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontSize: 18, fontWeight: 700, color: c.matchScore >= 90 ? '#16A34A' : '#2563EB', lineHeight: 1.2 }}>{c.matchScore}%</Typography>
                        <Typography sx={{ fontSize: 10, fontWeight: 600, color: '#6B7C93', textTransform: 'uppercase', letterSpacing: 0.5 }}>{badgeText}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ mb: 0.5 }}>
                      <LinearProgress variant="determinate" value={c.matchScore} sx={{ height: 6, borderRadius: 3, bgcolor: '#E2E8F0', '& .MuiLinearProgress-bar': { bgcolor: c.matchScore >= 90 ? '#16A34A' : '#2563EB', borderRadius: 3 } }} />
                    </Box>
                    <Grid container spacing={1} sx={{ fontSize: 11, color: '#6B7C93', mt: 0.5 }}>
                      <Grid item xs={4}>Tech: {c.techScore}%</Grid>
                      <Grid item xs={4}>Academic: {c.academicScore}%</Grid>
                      <Grid item xs={4}>COE: {c.coeScore}%</Grid>
                    </Grid>
                  </Box>
                </Card>
              );
            })}

            {mappedCandidates.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center', color: '#6B7C93', border: '1px dashed #CBD5E1', borderRadius: 2 }}>
                No candidates mapped yet.
              </Box>
            )}
          </Grid>

          {/* Right Column: Details & Allocation */}
          <Grid item xs={12} md={6}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.4, mb: 1 }}>
              Mandate Details
            </Typography>
            <Card sx={{ mb: 2, borderRadius: 2, boxShadow: 'none', border: '1px solid #E5EBF0' }}>
              <Box sx={{ p: 1.5 }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ color: 'text.secondary', py: 0.5, border: 'none', px: 1 }}>Requirement ID</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#111827', py: 0.5, border: 'none', px: 1 }}>{requirement.requirementCode}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: 'text.secondary', py: 0.5, border: 'none', px: 1 }}>Tech stack</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 0.5, border: 'none', px: 1 }}>{techShort}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: 'text.secondary', py: 0.5, border: 'none', px: 1 }}>Positions</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#111827', py: 0.5, border: 'none', px: 1 }}>{requirement.openPositions} open</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: 'text.secondary', py: 0.5, border: 'none', px: 1 }}>Location</TableCell>
                      <TableCell sx={{ py: 0.5, border: 'none', px: 1 }}>{requirement.location}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: 'text.secondary', py: 0.5, border: 'none', px: 1 }}>Onboarding</TableCell>
                      <TableCell sx={{ py: 0.5, border: 'none', px: 1 }}>{formatDate(requirement.onboardingDate)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Card>

            <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.4, mb: 1 }}>
              Mix &amp; Match COE Allocation
            </Typography>
            <Card sx={{ mb: 2, borderRadius: 2, boxShadow: 'none', border: '1px solid #E5EBF0' }}>
              <Box sx={{ p: 1.5 }}>
                {coeAllocations.map(alloc => (
                  <Box key={alloc.name} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography sx={{ width: 40, fontSize: 12, fontWeight: 600, color: '#475569' }}>{alloc.name}</Typography>
                    <Box sx={{ flex: 1, height: 24, bgcolor: '#F1F5F9', borderRadius: 1, overflow: 'hidden', display: 'flex' }}>
                      <Box sx={{ width: `${alloc.percentage}%`, bgcolor: alloc.color, display: 'flex', alignItems: 'center', px: 1, fontSize: 11, fontWeight: 600, color: '#fff' }}>
                        {alloc.seats} seats
                      </Box>
                    </Box>
                  </Box>
                ))}
                <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 1 }}>
                  <i className="ti ti-info-circle" style={{ marginRight: 4 }} /> AI recommends mix-and-match to maximise COE performance balance.
                </Typography>
              </Box>
            </Card>

            <Box sx={{ bgcolor: 'secondary.light', borderRadius: 2, p: 1.5, border: '1px solid rgba(90,45,130,.15)' }}>
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'secondary.main', mb: 0.5 }}>
                <i className="ti ti-robot" style={{ marginRight: 4 }} /> AI Reasoning
              </Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.5 }}>
                {mappedCandidates[0]?.candidate?.name || 'The top candidate'} scores highest on {techShort} assessments ({mappedCandidates[0]?.techScore || 96}%) with strong proximity to {requirement.location}. Mix-and-match with {coeAllocations[1]?.name || 'partner COEs'} ensures COE diversity and maintains fallback capacity.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};
