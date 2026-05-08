import React from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Grid, Typography, Chip, IconButton,
  Table, TableBody, TableCell, TableHead, TableRow, InputAdornment,
  Step, Stepper, StepLabel, Divider, Alert,
} from '@mui/material';
import { Add, Search, Visibility, Send, CheckCircle, Cancel, ArrowForward } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  useMappings, useRequirements, useCandidates, useCOEs,
  useCreateMapping, useUpdateMapping, useMappingLineItems,
  useCreateMappingLineItem, useCreateApproval, useApprovals,
} from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { StatusChip, PageHeader, SectionCard } from '../../components/shared';
import { formatDate, generateId } from '../../utils';
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

  const { data: mappings = [] } = useMappings();
  const { data: requirements = [] } = useRequirements();
  const { data: candidates = [] } = useCandidates();
  const { data: coes = [] } = useCOEs();
  const { mutateAsync: createMapping } = useCreateMapping();
  const { mutateAsync: updateMapping } = useUpdateMapping();
  const { mutateAsync: createLineItem } = useCreateMappingLineItem();

  const requirement = requirements.find((r) => r.id === selectedReqId);
  const remainingCap = requirement ? requirement.openPositions - requirement.filledPositions : 0;

  const filteredCandidates = candidates.filter((c) =>
    !currentUser || !can.isCOEScoped(currentUser.role) ||
    currentUser.coeScopeIds.includes(c.coeId)
  );

  const filtered = mappings.filter((m) => {
    const req = requirements.find((r) => r.id === m.requirementId);
    return req?.requirementCode.toLowerCase().includes(search.toLowerCase()) ||
      m.status.toLowerCase().includes(search.toLowerCase());
  });

  const handleSubmitMapping = async () => {
    if (!selectedReqId || selectedCandidateIds.length === 0) {
      enqueueSnackbar('Select a requirement and at least one candidate', { variant: 'warning' });
      return;
    }
    if (selectedCandidateIds.length > remainingCap) {
      enqueueSnackbar(`Only ${remainingCap} positions remaining`, { variant: 'error' });
      return;
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

  const handleAdvanceStatus = async (mapping: Mapping) => {
    const idx = MAPPING_STEPS.indexOf(mapping.status);
    if (idx < MAPPING_STEPS.length - 1) {
      const nextStatus = MAPPING_STEPS[idx + 1];
      await updateMapping({ id: mapping.id, status: nextStatus, updatedAt: new Date().toISOString() });
      enqueueSnackbar(`Status → ${nextStatus}`, { variant: 'success' });
    }
  };

  const canCreate = currentUser && can.createMapping(currentUser.role);
  const stepIdx = (status: MappingStatus) => MAPPING_STEPS.indexOf(status);

  return (
    <Box>
      <PageHeader
        title="Mappings"
        subtitle={`${mappings.length} total mapping records`}
        action={canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setNewOpen(true)}>New Mapping</Button>
        )}
      />

      <SectionCard>
        <TextField
          placeholder="Search by requirement or status…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          sx={{ mb: 2, width: '100%', maxWidth: 400 }}
        />
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Requirement</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Updated</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((m) => {
                const req = requirements.find((r) => r.id === m.requirementId);
                return (
                  <TableRow key={m.id} hover>
                    <TableCell>
                      <Typography variant="caption" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                        {req?.requirementCode || m.requirementId}
                      </Typography>
                    </TableCell>
                    <TableCell><StatusChip status={m.status} type="mapping" /></TableCell>
                    <TableCell><Typography variant="caption">{formatDate(m.createdAt)}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{formatDate(m.updatedAt)}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 160, display: 'block' }}>
                        {m.notes || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => navigate(`/mappings/${m.id}`)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                      {currentUser && (
                        (m.status === 'Draft' && can.submitMapping(currentUser.role)) ||
                        (m.status === 'Submitted' && can.engineeringApprove(currentUser.role)) ||
                        (m.status === 'Approved by Eng' && can.misConfirm(currentUser.role))
                      ) && (
                        <IconButton size="small" color="primary" onClick={() => handleAdvanceStatus(m)} title="Advance Status">
                          <ArrowForward fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No mappings found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </SectionCard>

      {/* New Mapping Dialog */}
      <Dialog open={newOpen} onClose={() => setNewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Mapping Proposal</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} pt={1}>
            <Grid item xs={12}>
              <TextField
                select label="Select Requirement" fullWidth value={selectedReqId}
                onChange={(e) => setSelectedReqId(e.target.value)}>
                {requirements.filter((r) => r.status === 'active').map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.requirementCode} — {r.openPositions - r.filledPositions} open
                  </MenuItem>
                ))}
              </TextField>
              {requirement && (
                <Alert severity={remainingCap > 0 ? 'info' : 'error'} sx={{ mt: 1 }}>
                  {remainingCap > 0
                    ? `${remainingCap} of ${requirement.openPositions} positions available`
                    : 'This requirement is at full capacity'}
                </Alert>
              )}
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={700} mb={1}>
                Select Candidates ({selectedCandidateIds.length} selected)
              </Typography>
              <Box sx={{ maxHeight: 280, overflowY: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" />
                      <TableCell>Name</TableCell>
                      <TableCell>COE</TableCell>
                      <TableCell>Skills</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCandidates
                      .filter((c) => ['Selected','Proposed'].includes(c.status))
                      .map((c) => {
                        const coe = coes.find((co) => co.id === c.coeId);
                        const checked = selectedCandidateIds.includes(c.id);
                        return (
                          <TableRow key={c.id} hover
                            onClick={() => setSelectedCandidateIds((prev) =>
                              checked ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                            )}
                            sx={{ cursor: 'pointer', bgcolor: checked ? 'action.selected' : 'inherit' }}>
                            <TableCell padding="checkbox">
                              <input type="checkbox" checked={checked} readOnly />
                            </TableCell>
                            <TableCell><Typography variant="body2" fontWeight={600}>{c.name}</Typography></TableCell>
                            <TableCell><Typography variant="caption">{coe?.name.split(' ')[0]}</Typography></TableCell>
                            <TableCell>
                              {c.skills.slice(0,2).map((s) => <Chip key={s} label={s} size="small" sx={{ mr: 0.5, fontSize: '0.6rem', height: 16 }} />)}
                            </TableCell>
                            <TableCell><Typography variant="caption" fontWeight={700}>{c.assessmentScore}%</Typography></TableCell>
                            <TableCell><StatusChip status={c.status} type="candidate" /></TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Notes" fullWidth multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNewOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitMapping}>Create Draft Mapping</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
