import React from 'react';
import {
  Box, Button, Typography, Chip, TextField, MenuItem,
  Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import {
  useDiscussionLogs, useMappingLineItems, useAllMappingLineItems,
  useCandidates, useMappings, useRequirements,
  useCreateDiscussionLog,
} from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { PageHeader, SectionCard, StatusChip } from '../../components/shared';
import { formatDate, formatDateTime, generateId, DISCUSSION_OUTCOMES } from '../../utils';
import type { DiscussionOutcome } from '../../types';

export const DiscussionsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useSessionStore();
  const [open, setOpen] = React.useState(false);
  const [selectedLineItemId, setSelectedLineItemId] = React.useState('');
  const [outcome, setOutcome] = React.useState<DiscussionOutcome>('Interested');
  const [notes, setNotes] = React.useState('');
  const [followUpDate, setFollowUpDate] = React.useState('');

  const { data: discussionLogs = [] } = useDiscussionLogs();
  const { data: lineItems = [] } = useAllMappingLineItems();
  const { data: candidates = [] } = useCandidates();
  const { data: mappings = [] } = useMappings();
  const { data: requirements = [] } = useRequirements();
  const { mutateAsync: createLog, isPending } = useCreateDiscussionLog();

  const canUpdate = currentUser && can.updateDiscussion(currentUser.role);

  // Filter line items for mappings that are "Confirmed by MIS" or later
  const eligibleMappings = mappings.filter((m) =>
    ['Confirmed by MIS', 'In Discussion', 'LOI Issued'].includes(m.status)
  );
  const eligibleLineItems = lineItems.filter((li) =>
    eligibleMappings.some((m) => m.id === li.mappingId)
  );

  const handleSubmit = async () => {
    if (!selectedLineItemId) return;
    try {
      await createLog({
        id: generateId(),
        mappingLineItemId: selectedLineItemId,
        coordinatorId: currentUser?.id || '',
        outcome,
        notes,
        followUpDate: followUpDate || null,
        createdAt: new Date().toISOString(),
      });
      enqueueSnackbar('Discussion log saved', { variant: 'success' });
      setOpen(false);
      setNotes('');
      setFollowUpDate('');
    } catch {
      enqueueSnackbar('Error saving discussion log', { variant: 'error' });
    }
  };

  const OUTCOME_COLOR: Record<DiscussionOutcome, 'success' | 'error' | 'warning' | 'default'> = {
    Interested: 'success',
    'Not Interested': 'error',
    'Need Time': 'warning',
    Unreachable: 'default',
  };

  return (
    <Box>
      <PageHeader
        title="Discussions"
        subtitle="COE Coordinator candidate discussion logs"
        action={canUpdate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpen(true)}>
            Log Discussion
          </Button>
        )}
      />

      <SectionCard>
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Candidate</TableCell>
                <TableCell>Requirement</TableCell>
                <TableCell>Outcome</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Follow-up</TableCell>
                <TableCell>Logged At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {discussionLogs.map((log) => {
                const lineItem = lineItems.find((li) => li.id === log.mappingLineItemId);
                const candidate = candidates.find((c) => c.id === lineItem?.candidateId);
                const mapping = mappings.find((m) => m.id === lineItem?.mappingId);
                const req = requirements.find((r) => r.id === mapping?.requirementId);
                return (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{candidate?.name || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{candidate?.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                        {req?.requirementCode?.split('-').slice(0, 3).join('-') || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.outcome}
                        size="small"
                        color={OUTCOME_COLOR[log.outcome as DiscussionOutcome] || 'default'}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                        {log.notes || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{log.followUpDate ? formatDate(log.followUpDate) : '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{formatDateTime(log.createdAt)}</Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              {discussionLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No discussion logs yet</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </SectionCard>

      {/* Log Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log Discussion Outcome</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} pt={1}>
            <Grid item xs={12}>
              <TextField
                select label="Candidate (Line Item)" fullWidth value={selectedLineItemId}
                onChange={(e) => setSelectedLineItemId(e.target.value)}>
                {eligibleLineItems.map((li) => {
                  const c = candidates.find((ca) => ca.id === li.candidateId);
                  return (
                    <MenuItem key={li.id} value={li.id}>
                      {c?.name || li.candidateId} — {li.proposedTech}
                    </MenuItem>
                  );
                })}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select label="Outcome" fullWidth value={outcome}
                onChange={(e) => setOutcome(e.target.value as DiscussionOutcome)}>
                {DISCUSSION_OUTCOMES.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Follow-up Date" type="date" fullWidth value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Notes" fullWidth multiline rows={3} value={notes}
                onChange={(e) => setNotes(e.target.value)} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isPending}>Save Log</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
