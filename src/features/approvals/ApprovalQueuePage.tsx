import React from 'react';
import {
  Box, Button, Typography, Chip, TextField, MenuItem,
  Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip, alpha, useTheme,
} from '@mui/material';
import { CheckCircle, Cancel, OpenInNew } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  useMappings, useRequirements, useApprovals,
  useUpdateMapping, useCreateApproval,
} from '../../api/hooks';
import { useSessionStore } from '../../store';
import { StatusChip, PageHeader, SectionCard } from '../../components/shared';
import { formatDate, formatDateTime, generateId } from '../../utils';
import type { MappingStatus } from '../../types';

interface ApprovalQueueProps {
  queueType: 'engineering' | 'mis';
}

export const ApprovalQueuePage: React.FC<ApprovalQueueProps> = ({ queueType }) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useSessionStore();
  const [comment, setComment] = React.useState('');
  const [selectedMapping, setSelectedMapping] = React.useState<string | null>(null);
  const [actionType, setActionType] = React.useState<'approve' | 'reject' | null>(null);

  const { data: mappings = [] } = useMappings();
  const { data: requirements = [] } = useRequirements();
  const { data: approvals = [] } = useApprovals();
  const { mutateAsync: updateMapping } = useUpdateMapping();
  const { mutateAsync: createApproval } = useCreateApproval();

  const filterStatus: MappingStatus = queueType === 'engineering' ? 'Engineering Review' : 'Approved by Eng';
  const nextApprove: MappingStatus = queueType === 'engineering' ? 'Approved by Eng' : 'Confirmed by MIS';
  const nextReject: MappingStatus = 'Draft';

  const queueMappings = mappings.filter((m) => m.status === filterStatus);

  const handleAction = async () => {
    if (!selectedMapping || !actionType || !currentUser) return;
    try {
      const isApprove = actionType === 'approve';
      await createApproval({
        id: generateId(),
        mappingId: selectedMapping,
        actorRole: currentUser.role,
        actorId: currentUser.id,
        decision: isApprove ? 'Approved' : 'Rejected',
        comment,
        timestamp: new Date().toISOString(),
      });
      await updateMapping({
        id: selectedMapping,
        status: isApprove ? nextApprove : nextReject,
        updatedAt: new Date().toISOString(),
      });
      enqueueSnackbar(isApprove ? 'Mapping approved!' : 'Mapping rejected', {
        variant: isApprove ? 'success' : 'warning',
      });
      setSelectedMapping(null);
      setActionType(null);
      setComment('');
    } catch {
      enqueueSnackbar('Error processing action', { variant: 'error' });
    }
  };

  const title = queueType === 'engineering' ? 'Engineering Review Queue' : 'MIS Confirmation Queue';
  const subtitle = queueType === 'engineering'
    ? 'Mappings awaiting Head of Engineering approval'
    : 'Mappings awaiting MIS Manager confirmation';

  return (
    <Box>
      <PageHeader title={title} subtitle={subtitle} />

      {queueMappings.length === 0 ? (
        <SectionCard>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" color="text.secondary">All clear!</Typography>
            <Typography variant="body2" color="text.secondary">No mappings pending in this queue.</Typography>
          </Box>
        </SectionCard>
      ) : (
        <SectionCard>
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Requirement ID</TableCell>
                  <TableCell>Tech Stack</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {queueMappings.map((m) => {
                  const req = requirements.find((r) => r.id === m.requirementId);
                  return (
                    <TableRow key={m.id} hover>
                      <TableCell>
                        <Typography variant="caption" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                          {req?.requirementCode || m.requirementId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {req && <Chip label={req.techStack} size="small" color="primary" variant="outlined" />}
                      </TableCell>
                      <TableCell><Typography variant="caption">{formatDate(m.createdAt)}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                          {m.notes || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell><StatusChip status={m.status} type="mapping" /></TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                          <Tooltip title="View detail">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/mappings/${m.id}`)}
                              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                            >
                              <OpenInNew fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={queueType === 'engineering' ? 'Approve' : 'Confirm'}>
                            <IconButton
                              size="small"
                              onClick={() => { setSelectedMapping(m.id); setActionType('approve'); }}
                              sx={{
                                bgcolor: 'success.main', color: '#fff', borderRadius: 1.5,
                                '&:hover': { bgcolor: 'success.dark' },
                              }}
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              onClick={() => { setSelectedMapping(m.id); setActionType('reject'); }}
                              sx={{
                                border: '1px solid', borderColor: 'error.main',
                                color: 'error.main', borderRadius: 1.5,
                                '&:hover': { bgcolor: 'error.main', color: '#fff' },
                              }}
                            >
                              <Cancel fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </SectionCard>
      )}

      {/* Action Confirm Dialog */}
      <Dialog open={!!selectedMapping} onClose={() => { setSelectedMapping(null); setActionType(null); }} maxWidth="xs" fullWidth>
        <DialogTitle>
          {actionType === 'approve'
            ? (queueType === 'engineering' ? 'Approve Mapping' : 'Confirm Mapping')
            : 'Reject Mapping'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Comment (optional)" fullWidth multiline rows={3} value={comment}
            onChange={(e) => setComment(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setSelectedMapping(null); setActionType(null); setComment(''); }}>Cancel</Button>
          <Button
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
            onClick={handleAction}>
            {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
