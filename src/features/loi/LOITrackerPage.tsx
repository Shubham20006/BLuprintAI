import React from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Typography,
  Button,
  Card,
  Grid,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Checkbox,
  LinearProgress
} from '@mui/material';
import {
  useLOIs, useCandidates, useRequirements, useMappings,
  useCreateLOI, useUpdateLOI, useUpdateCandidate,
  useDiscussionLogs, useAllMappingLineItems, useUpdateRequirement,
} from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { formatDate, generateId } from '../../utils';
import { LoadingButton } from '../../components/shared';
import type { LOI } from '../../types';

export const LOITrackerPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useSessionStore();
  const [open, setOpen] = React.useState(false);
  const [selectedCandId, setSelectedCandId] = React.useState('');
  const [selectedReqId, setSelectedReqId] = React.useState('');

  const { data: lois = [] } = useLOIs();
  const { data: candidates = [] } = useCandidates();
  const { data: requirements = [] } = useRequirements();
  const { data: mappings = [] } = useMappings();
  const { data: lineItems = [] } = useAllMappingLineItems();
  const { data: discussionLogs = [] } = useDiscussionLogs();
  const { mutateAsync: createLOI, isPending: creating } = useCreateLOI();
  const { mutateAsync: updateLOI } = useUpdateLOI();
  const { mutateAsync: updateCandidate } = useUpdateCandidate();

  const canIssue = currentUser && can.issueLOI(currentUser.role);

  const handleSendLOI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandId || !selectedReqId) return;
    const mapping = mappings.find((m) => m.requirementId === selectedReqId);
    try {
      await createLOI({
        id: generateId(),
        candidateId: selectedCandId,
        requirementId: selectedReqId,
        mappingId: mapping?.id || '',
        sentAt: new Date().toISOString(),
        signedAt: null,
        documentUrl: '',
        status: 'Sent',
      });
      enqueueSnackbar('LOI sent successfully', { variant: 'success' });
      setOpen(false);
      setSelectedCandId('');
      setSelectedReqId('');
    } catch {
      enqueueSnackbar('Error sending LOI', { variant: 'error' });
    }
  };


  const eligibleCandidates = candidates.filter(c => {
    // 1. Must have an Accepted discussion log
    const hasAcceptedLog = discussionLogs.some(log => {
      const li = lineItems.find(item => item.id === log.mappingLineItemId);
      return li?.candidateId === c.id && log.outcome === 'Accepted';
    });

    // 2. Must NOT already have an LOI issued
    const hasLOI = lois.some(l => l.candidateId === c.id);

    return (c.status === 'Discussed' || hasAcceptedLog) && !hasLOI;
  });

  const [selectedCandidates, setSelectedCandidates] = React.useState<string[]>([]);
  const [bulkReqId, setBulkReqId] = React.useState('');

  const toggleCandidate = (id: string) => {
    setSelectedCandidates(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkSend = async () => {
    if (selectedCandidates.length === 0 || !bulkReqId) {
      enqueueSnackbar('Select candidates and requirement', { variant: 'warning' });
      return;
    }
    
    try {
      const mapping = mappings.find(m => m.requirementId === bulkReqId);
      const promises = selectedCandidates.map(cid => 
        createLOI({
          id: generateId(),
          candidateId: cid,
          requirementId: bulkReqId,
          mappingId: mapping?.id || '',
          sentAt: new Date().toISOString(),
          signedAt: null,
          documentUrl: '',
          status: 'Sent'
        })
      );
      
      // Update candidate statuses to 'LOI Sent'
      const statusPromises = selectedCandidates.map(cid => 
        updateCandidate({ id: cid, status: 'LOI Sent' })
      );

      await Promise.all([...promises, ...statusPromises]);
      enqueueSnackbar(`Successfully issued ${selectedCandidates.length} LOIs`, { variant: 'success' });
      setOpen(false);
      setSelectedCandidates([]);
      setBulkReqId('');
    } catch {
      enqueueSnackbar('Error issuing bulk LOIs', { variant: 'error' });
    }
  };

  const { mutateAsync: updateRequirement } = useUpdateRequirement();

  const handleMarkSigned = async (loiId: string) => {
    const loi = lois.find(l => l.id === loiId);
    if (!loi) return;

    try {
      // 1. Update LOI Status
      await updateLOI({ id: loiId, status: 'Signed', signedAt: new Date().toISOString() });

      // 2. Update Candidate Status
      await updateCandidate({ id: loi.candidateId, status: 'LOI Signed' });

      // 3. Update Requirement Filled Positions
      const req = requirements.find(r => r.id === loi.requirementId);
      if (req) {
        await updateRequirement({ 
          id: req.id, 
          filledPositions: (req.filledPositions || 0) + 1 
        });
      }

      enqueueSnackbar('LOI signed and reflected in mandate positions', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error reflecting LOI acceptance', { variant: 'error' });
    }
  };

  const stats = {
    sent: lois.filter((l) => l.status === 'Sent').length,
    signed: lois.filter((l) => l.status === 'Signed').length,
    total: lois.length
  };

  return (
    <>
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #E5EBF0', px: 2, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography sx={{ fontSize: 15, color: '#6B7C93' }}>
            Fellowship MIS / <Box component="span" sx={{ color: '#111827', fontWeight: 500 }}>LOI Tracker</Box>
          </Typography>
        </Box>
        <Box>
          {canIssue && (
            <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
              <i className="ti ti-send" style={{ marginRight: 6 }} /> Issue LOI
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ p: 3 }}>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, borderRadius: 2, borderTop: '4px solid #F59E0B' }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', mb: 1 }}>Sent</Typography>
              <Typography sx={{ fontSize: 32, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{stats.sent}</Typography>
              <Typography sx={{ fontSize: 12, color: '#6B7C93', mt: 1 }}>Awaiting Signature</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, borderRadius: 2, borderTop: '4px solid #10B981' }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', mb: 1 }}>Signed</Typography>
              <Typography sx={{ fontSize: 32, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{stats.signed}</Typography>
              <Typography sx={{ fontSize: 12, color: '#6B7C93', mt: 1 }}>Completed</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, borderRadius: 2, borderTop: '4px solid #6366F1' }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', mb: 1 }}>Total Issued</Typography>
              <Typography sx={{ fontSize: 32, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{stats.total}</Typography>
              <Typography sx={{ fontSize: 12, color: '#6B7C93', mt: 1 }}>LOIs Processed</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, borderRadius: 2, borderTop: '4px solid #3B82F6' }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', mb: 1 }}>Conversion</Typography>
              <Typography sx={{ fontSize: 32, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{stats.total ? Math.round((stats.signed / stats.total) * 100) : 0}%</Typography>
              <Typography sx={{ fontSize: 12, color: '#6B7C93', mt: 1 }}>Sign Rate</Typography>
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ borderRadius: 2 }}>
          <Box sx={{ p: '16px 20px', borderBottom: '1px solid #E5EBF0' }}>
            <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Track Letter of Intent Issuance</Typography>
          </Box>
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#6B7C93', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', pl: 3 }}>Candidate</TableCell>
                  <TableCell sx={{ color: '#6B7C93', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Requirement</TableCell>
                  <TableCell sx={{ color: '#6B7C93', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Sent At</TableCell>
                  <TableCell sx={{ color: '#6B7C93', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Signed At</TableCell>
                  <TableCell sx={{ color: '#6B7C93', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Status</TableCell>
                  <TableCell sx={{ color: '#6B7C93', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', pr: 3 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {lois.map((loi) => {
                  const candidate = candidates.find((c) => c.id === loi.candidateId);
                  const req = requirements.find((r) => r.id === loi.requirementId);
                  return (
                    <TableRow key={loi.id} hover>
                      <TableCell sx={{ pl: 3 }}>
                        <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{candidate?.name || loi.candidateId}</Typography>
                        <Typography sx={{ fontSize: 12, color: '#6B7C93' }}>{candidate?.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13, color: '#2563EB' }}>
                          {req?.requirementCode || loi.requirementId}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: 14 }}>{formatDate(loi.sentAt)}</TableCell>
                      <TableCell sx={{ fontSize: 14 }}>{loi.signedAt ? formatDate(loi.signedAt) : '—'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={loi.status} 
                          size="small" 
                          sx={{ 
                            bgcolor: loi.status === 'Signed' ? '#E0E7FF' : '#DCFCE7', 
                            color: loi.status === 'Signed' ? '#3730A3' : '#166534', 
                            fontWeight: 600, 
                            borderRadius: 1 
                          }} 
                        />
                      </TableCell>
                      <TableCell sx={{ pr: 3 }} align="right">
                        {canIssue && loi.status === 'Sent' && (
                          <Button
                            size="small"
                            variant="text"
                            color="success"
                            onClick={() => handleMarkSigned(loi.id)}
                            sx={{ fontWeight: 600 }}
                          >
                            <i className="ti ti-check" style={{ marginRight: 6 }} /> Mark Signed
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {lois.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 8, color: '#6B7C93' }}>
                      <Box sx={{ fontSize: 40, opacity: 0.2, mb: 1 }}><i className="ti ti-mail-forward" /></Box>
                      <Typography sx={{ fontSize: 14 }}>No LOIs issued yet</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Card>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ borderBottom: '1px solid #E5EBF0', pb: 2 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 600 }}>Issue LOI</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 2.5, bgcolor: '#F8FAFC', borderBottom: '1px solid #E5EBF0' }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1.5 }}>Step 1: Select Requirement</Typography>
            <FormControl fullWidth size="small">
              <InputLabel>Choose requirement...</InputLabel>
              <Select label="Choose requirement..." value={bulkReqId} onChange={e => setBulkReqId(e.target.value)}>
                <MenuItem value=""><em>None</em></MenuItem>
                {requirements.filter(r => r.status === 'active').map(r => (
                  <MenuItem key={r.id} value={r.id}>{r.requirementCode} ({r.location})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ p: 2.5 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1.5 }}>
              Step 2: Select Candidates ({eligibleCandidates.length} eligible)
            </Typography>
            <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {eligibleCandidates.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {eligibleCandidates.map(c => {
                    const isSelected = selectedCandidates.includes(c.id);
                    return (
                      <Box 
                        key={c.id} 
                        onClick={() => toggleCandidate(c.id)}
                        sx={{ 
                          p: '10px 15px', 
                          cursor: 'pointer',
                          border: '1px solid',
                          borderColor: isSelected ? 'primary.main' : '#E5EBF0',
                          bgcolor: isSelected ? 'primary.50' : '#fff',
                          borderRadius: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          transition: 'all 0.15s'
                        }}
                      >
                        <Checkbox 
                          checked={isSelected} 
                          onChange={() => {}} 
                          size="small" 
                          sx={{ p: 0, mr: 1.5 }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{c.name}</Typography>
                          <Typography sx={{ fontSize: 12, color: '#6B7C93' }}>{c.stream} • {c.email}</Typography>
                        </Box>
                        <Chip label="Discussed" size="small" sx={{ fontSize: 11, bgcolor: '#E0F2FE', color: '#0284C7', fontWeight: 600, borderRadius: 1 }} />
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Typography sx={{ textAlign: 'center', p: 3, color: '#6B7C93', fontSize: 14 }}>
                  No candidates in 'Discussed' status. Run discussions first.
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #E5EBF0' }}>
          <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
          <LoadingButton 
            variant="contained" 
            color="primary"
            disabled={creating || selectedCandidates.length === 0 || !bulkReqId}
            onClick={handleBulkSend}
            loading={creating}
          >
            Issue LOI to {selectedCandidates.length} candidates
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
};


