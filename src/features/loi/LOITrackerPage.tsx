import React from 'react';
import {
  Box, Button, Typography, Chip, Table, TableBody,
  TableCell, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Grid,
} from '@mui/material';
import { Send, CheckCircle, Add } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  useLOIs, useCandidates, useRequirements, useMappings,
  useCreateLOI, useUpdateLOI,
} from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { PageHeader, SectionCard, StatusChip } from '../../components/shared';
import { formatDate, formatDateTime, generateId } from '../../utils';

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
  const { mutateAsync: createLOI, isPending: creating } = useCreateLOI();
  const { mutateAsync: updateLOI } = useUpdateLOI();

  const canIssue = currentUser && can.issueLOI(currentUser.role);

  const handleSendLOI = async () => {
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
    } catch {
      enqueueSnackbar('Error sending LOI', { variant: 'error' });
    }
  };

  const handleMarkSigned = async (loiId: string) => {
    try {
      await updateLOI({ id: loiId, status: 'Signed', signedAt: new Date().toISOString() });
      enqueueSnackbar('LOI marked as signed', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error updating LOI', { variant: 'error' });
    }
  };

  const stats = {
    sent: lois.filter((l) => l.status === 'Sent').length,
    signed: lois.filter((l) => l.status === 'Signed').length,
    pending: lois.filter((l) => l.status === 'Pending').length,
  };

  return (
    <Box>
      <PageHeader
        title="LOI Tracker"
        subtitle="Letter of Intent issuance and signing status"
        action={canIssue && (
          <Button variant="contained" startIcon={<Send />} onClick={() => setOpen(true)}>
            Send LOI
          </Button>
        )}
      />

      {/* Summary chips */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Chip icon={<Send fontSize="small" />} label={`${stats.sent} Sent`} color="warning" sx={{ fontWeight: 700 }} />
        <Chip icon={<CheckCircle fontSize="small" />} label={`${stats.signed} Signed`} color="success" sx={{ fontWeight: 700 }} />
        <Chip label={`${lois.length} Total`} sx={{ fontWeight: 700 }} />
      </Box>

      <SectionCard>
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Candidate</TableCell>
                <TableCell>Requirement</TableCell>
                <TableCell>Sent At</TableCell>
                <TableCell>Signed At</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lois.map((loi) => {
                const candidate = candidates.find((c) => c.id === loi.candidateId);
                const req = requirements.find((r) => r.id === loi.requirementId);
                return (
                  <TableRow key={loi.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{candidate?.name || loi.candidateId}</Typography>
                      <Typography variant="caption" color="text.secondary">{candidate?.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                        {req?.requirementCode?.split('-').slice(0, 3).join('-') || loi.requirementId}
                      </Typography>
                    </TableCell>
                    <TableCell><Typography variant="caption">{formatDateTime(loi.sentAt)}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="caption">{loi.signedAt ? formatDateTime(loi.signedAt) : '—'}</Typography>
                    </TableCell>
                    <TableCell><StatusChip status={loi.status} type="loi" /></TableCell>
                    <TableCell align="right">
                      {canIssue && loi.status === 'Sent' && (
                        <Button
                          size="small" variant="outlined" color="success"
                          startIcon={<CheckCircle />}
                          onClick={() => handleMarkSigned(loi.id)}>
                          Mark Signed
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {lois.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No LOIs issued yet</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </SectionCard>

      {/* Send LOI Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Letter of Intent</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} pt={1}>
            <Grid item xs={12}>
              <TextField
                select label="Candidate" fullWidth value={selectedCandId}
                onChange={(e) => setSelectedCandId(e.target.value)}>
                {candidates
                  .filter((c) => ['Mapped', 'Discussed'].includes(c.status))
                  .map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name} — {c.email}</MenuItem>
                  ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select label="Requirement" fullWidth value={selectedReqId}
                onChange={(e) => setSelectedReqId(e.target.value)}>
                {requirements
                  .filter((r) => r.status === 'active')
                  .map((r) => (
                    <MenuItem key={r.id} value={r.id}>{r.requirementCode}</MenuItem>
                  ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<Send />} onClick={handleSendLOI} disabled={creating}>
            Send LOI
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
