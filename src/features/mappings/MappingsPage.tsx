import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  Box,
  Typography,
  Button,
  Card,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TextField,
  InputAdornment,
  LinearProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox
} from '@mui/material';
import {
  useMappings, useRequirements, useCandidates, useCOEs,
  useCreateMapping, useUpdateMapping, useMappingLineItems,
  useCreateMappingLineItem, useCreateApproval, useApprovals,
  useUpdateCandidate,
} from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { formatDate, generateId } from '../../utils';
import { PageLoader, LoadingButton } from '../../components/shared';
import type { Mapping, MappingStatus } from '../../types';

const MAPPING_STEPS: MappingStatus[] = [
  'Draft','Submitted','Engineering Review','Approved by Eng',
  'Confirmed by MIS','In Discussion','LOI Issued','Signed','CFP Started',
];

export const MappingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useSessionStore();
  const [search, setSearch] = React.useState('');
  const [newOpen, setNewOpen] = React.useState(false);
  const [selectedReqId, setSelectedReqId] = React.useState('');
  const [selectedCandidateIds, setSelectedCandidateIds] = React.useState<string[]>([]);
  const [notes, setNotes] = React.useState('');

  const { data: mappings = [], isLoading: loadingMappings } = useMappings();
  const { data: requirements = [], isLoading: loadingReqs } = useRequirements();
  const { data: candidates = [], isLoading: loadingCands } = useCandidates();
  const { data: coes = [] } = useCOEs();
  const { mutateAsync: createMapping, isPending: creating } = useCreateMapping();
  const { mutateAsync: updateMapping, isPending: updating } = useUpdateMapping();
  const { mutateAsync: createLineItem } = useCreateMappingLineItem();
  const { mutateAsync: updateCandidate } = useUpdateCandidate();

  const isLoading = loadingMappings || loadingReqs || loadingCands;

  const requirement = requirements.find((r) => r.id === selectedReqId);
  const remainingCap = requirement ? requirement.openPositions - requirement.filledPositions : 0;

  const filteredCandidates = candidates.filter((c) =>
    !currentUser || !can.isCOEScoped(currentUser.role) ||
    (Array.isArray(currentUser.coeScopeIds) && currentUser.coeScopeIds.some(id => String(id) === String(c.coeId)))
  );

  const filtered = mappings.filter((m) => {
    const req = requirements.find((r) => r.id === m.requirementId);
    return req?.requirementCode?.toLowerCase().includes(search.toLowerCase()) ||
      m.status?.toLowerCase().includes(search.toLowerCase());
  });

  const handleSubmitMapping = async () => {
    if (!selectedReqId || selectedCandidateIds.length === 0) {
      enqueueSnackbar('Select a requirement and at least one candidate', { variant: 'warning' });
      return;
    }
    const isMIS = currentUser?.role === 'MIS_MANAGER';
    
    if (selectedCandidateIds.length > remainingCap) {
      enqueueSnackbar(`Only ${remainingCap} positions remaining`, { variant: 'error' });
      return;
    }

    // Alignment & Assignment Checks
    for (const cid of selectedCandidateIds) {
      const cand = candidates.find(c => c.id === cid);
      if (!cand) continue;

      // Date Alignment Check
      if (requirement && cand.availabilityDate > requirement.onboardingDate) {
        const confirm = window.confirm(`${cand.name} is available from ${cand.availabilityDate}, but onboarding is on ${requirement.onboardingDate}. Continue anyway?`);
        if (!confirm) return;
      }

      // Conflict Check
      if (cand.status === 'Mapped' && !isMIS) {
        enqueueSnackbar(`${cand.name} is already mapped to another requirement. Only MIS Manager can override this.`, { variant: 'error' });
        return;
      }
    }
    try {
      const mappingId = generateId();
      await createMapping({
        id: mappingId,
        requirementId: selectedReqId,
        status: 'Draft',
        createdBy: currentUser?.id || '',
        currentOwnerRole: 'COE_LAB_HEAD',
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      for (const cid of selectedCandidateIds) {
        await createLineItem({ id: generateId(), mappingId, candidateId: cid, proposedTech: requirement?.techStack || '', allocationType: 'Primary' });
        // Automatically advance candidate status to 'Mapped'
        await updateCandidate({ id: cid, status: 'Mapped' });
      }
      enqueueSnackbar('Mapping created as Draft', { variant: 'success' });
      setNewOpen(false);
      setSelectedReqId('');
      setSelectedCandidateIds([]);
      setNotes('');
    } catch {
      enqueueSnackbar('Error creating mapping', { variant: 'error' });
    }
  };

  const getNextStatus = (current: MappingStatus): MappingStatus | null => {
    switch (current) {
      case 'Draft':            return 'Engineering Review';
      case 'Engineering Review': return 'Approved by Eng';
      case 'Approved by Eng':  return 'Confirmed by MIS';
      default:                 return null;
    }
  };

  const handleAdvanceStatus = async (mapping: Mapping) => {
    const nextStatus = getNextStatus(mapping.status);
    if (!nextStatus) return;
    await updateMapping({ id: mapping.id, status: nextStatus, updatedAt: new Date().toISOString() });
    enqueueSnackbar(`Status → ${nextStatus}`, { variant: 'success' });
  };

  const canCreate = currentUser && can.createMapping(currentUser.role);

  return (
    <>
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #E5EBF0', px: 2, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography sx={{ fontSize: 15, color: '#6B7C93' }}>
            Mappings / <Box component="span" sx={{ color: '#111827', fontWeight: 500 }}>Overview</Box>
          </Typography>
        </Box>
        <Box>
          {canCreate && (
            <Button variant="contained" color="primary" onClick={() => setNewOpen(true)}>
              <i className="ti ti-plus" style={{ marginRight: 6 }} /> New Mapping
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: 26, fontWeight: 700, color: '#111827', mb: 0.5 }}>Mappings</Typography>
          <Typography sx={{ fontSize: 14, color: '#6B7C93' }}>{mappings.length} total mapping records</Typography>
        </Box>

        <Card sx={{ borderRadius: 2 }}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2, width: 400 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search by requirement or status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="ti ti-search" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ width: '100%', overflowX: 'auto' }}>
              {isLoading ? (
                <Box sx={{ p: 4 }}><LinearProgress /></Box>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#6B7C93', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Requirement</TableCell>
                      <TableCell sx={{ color: '#6B7C93', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Status</TableCell>
                      <TableCell sx={{ color: '#6B7C93', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Created</TableCell>
                      <TableCell sx={{ color: '#6B7C93', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Updated</TableCell>
                      <TableCell sx={{ color: '#6B7C93', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Notes</TableCell>
                      <TableCell sx={{ color: '#6B7C93', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }} align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((m) => {
                      const req = requirements.find((r) => r.id === m.requirementId);
                      return (
                        <TableRow key={m.id} hover>
                          <TableCell>
                            <Typography sx={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#111827' }}>
                              {req?.requirementCode || m.requirementId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={m.status} 
                              size="small" 
                              sx={{ 
                                bgcolor: m.status === 'Draft' ? '#FEF9C3' : '#E0E7FF', 
                                color: m.status === 'Draft' ? '#854D0E' : '#3730A3', 
                                fontWeight: 600, 
                                borderRadius: 1 
                              }} 
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: 13, color: '#475569' }}>{formatDate(m.createdAt)}</TableCell>
                          <TableCell sx={{ fontSize: 13, color: '#475569' }}>{formatDate(m.updatedAt)}</TableCell>
                          <TableCell sx={{ fontSize: 13, color: '#6B7C93', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.notes || '—'}
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <IconButton size="small" onClick={() => navigate(`/mappings/${m.id}`)}>
                                <i className="ti ti-eye" style={{ fontSize: 18 }} />
                              </IconButton>
                              {currentUser && (
                                (m.status === 'Draft' && can.submitMapping(currentUser.role)) ||
                                (m.status === 'Engineering Review' && can.engineeringApprove(currentUser.role)) ||
                                (m.status === 'Approved by Eng' && can.misConfirm(currentUser.role))
                              ) && (
                                <IconButton size="small" sx={{ color: 'primary.main' }} onClick={() => handleAdvanceStatus(m)} title="Advance Status">
                                  <i className="ti ti-arrow-right" style={{ fontSize: 18 }} />
                                </IconButton>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!isLoading && filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: '#6B7C93' }}>
                          No mappings found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Box>
        </Card>
      </Box>

      <Dialog open={newOpen} onClose={() => setNewOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ borderBottom: '1px solid #E5EBF0', pb: 2 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 600 }}>Create Mapping Proposal</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Requirement</InputLabel>
              <Select label="Select Requirement" value={selectedReqId} onChange={(e) => setSelectedReqId(e.target.value)}>
                <MenuItem value="" disabled>Select a requirement</MenuItem>
                {requirements.filter((r) => r.status === 'active').map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.requirementCode} — {r.openPositions - r.filledPositions} open
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {requirement && (
            <Box sx={{ background: remainingCap > 0 ? '#E0F2FE' : '#FEE2E2', color: remainingCap > 0 ? '#0284C7' : '#B91C1C', padding: '8px 12px', borderRadius: 1.5, fontSize: 13, mb: 3 }}>
              {remainingCap > 0 ? `${remainingCap} of ${requirement.openPositions} positions available` : 'This requirement is at full capacity'}
            </Box>
          )}

          <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#111827', mb: 1 }}>
            Select Candidates ({selectedCandidateIds.length} selected)
          </Typography>
          <Box sx={{ border: '1px solid #CBD5E1', borderRadius: 1.5, maxHeight: 250, overflowY: 'auto', mb: 3 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 30, bgcolor: '#F8FAFC' }}></TableCell>
                  <TableCell sx={{ bgcolor: '#F8FAFC' }}>Name</TableCell>
                  <TableCell sx={{ bgcolor: '#F8FAFC' }}>COE</TableCell>
                  <TableCell sx={{ bgcolor: '#F8FAFC' }}>Availability</TableCell>
                  <TableCell sx={{ bgcolor: '#F8FAFC' }}>CGPA</TableCell>
                  <TableCell sx={{ bgcolor: '#F8FAFC' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCandidates
                  .filter((c) => ['Selected','Proposed'].includes(c.status) || (currentUser?.role === 'MIS_MANAGER' && c.status === 'Mapped'))
                  .map((c) => {
                    const coe = coes.find((co) => Number(co.id) === Number(c.coeId));
                    const checked = selectedCandidateIds.includes(c.id);
                    const dateMisaligned = requirement && c.availabilityDate > requirement.onboardingDate;
                    return (
                      <TableRow 
                        key={c.id} 
                        hover
                        sx={{ 
                          cursor: 'pointer', 
                          bgcolor: checked ? '#E0F2FE' : 'transparent',
                          opacity: (c.status === 'Mapped' && currentUser?.role !== 'MIS_MANAGER') ? 0.5 : 1
                        }} 
                        onClick={() => {
                          if (c.status === 'Mapped' && currentUser?.role !== 'MIS_MANAGER') return;
                          setSelectedCandidateIds((prev) => checked ? prev.filter((id) => id !== c.id) : [...prev, c.id]);
                        }}
                      >
                        <TableCell sx={{ textAlign: 'center', py: 0.5 }}>
                          <Checkbox checked={checked} disabled={c.status === 'Mapped' && currentUser?.role !== 'MIS_MANAGER'} size="small" />
                        </TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                            {c.name}
                          </Typography>
                          {c.status === 'Mapped' && <Typography sx={{ fontSize: 10, color: '#DC2626', fontWeight: 700 }}>CONFLICT</Typography>}
                        </TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{coe?.name?.split(' ')[0] || 'N/A'}</Typography>
                        </TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Typography sx={{ fontSize: 13, color: dateMisaligned ? '#DC2626' : '#111827', fontWeight: dateMisaligned ? 700 : 500, display: 'flex', alignItems: 'center' }}>
                            {c.availabilityDate}
                            {dateMisaligned && <i className="ti ti-alert-triangle" style={{ marginLeft: 4 }} title="After onboarding date" />}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#16A34A' }}>{c.cgpa}</Typography>
                        </TableCell>
                        <TableCell sx={{ py: 0.5 }}>
                          <Chip label={c.status} size="small" sx={{ fontSize: 11, bgcolor: c.status === 'Mapped' ? '#DCFCE7' : '#F1F5F9', color: c.status === 'Mapped' ? '#166534' : '#475569', fontWeight: 600, borderRadius: 1 }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </Box>

          <Box>
            <TextField fullWidth label="Notes" size="small" multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any specific notes..." />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #E5EBF0' }}>
          <Button onClick={() => setNewOpen(false)} color="inherit">Cancel</Button>
          <LoadingButton onClick={handleSubmitMapping} loading={creating} variant="contained" color="primary">
            Create Draft Mapping
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
};
