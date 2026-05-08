import React from 'react';
import {
  Box, Button, Typography, Chip, Divider, TextField,
  Grid, Avatar, Alert, Stepper, Step, StepLabel,
  Table, TableHead, TableRow, TableCell, TableBody,
} from '@mui/material';
import { ArrowBack, Send, CheckCircle, Cancel } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  useMapping, useRequirement, useMappingLineItems,
  useCandidates, useApprovals, useUpdateMapping,
  useCreateApproval, useAuditEvents,
} from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { StatusChip, SectionCard, InfoRow } from '../../components/shared';
import { formatDate, formatDateTime, generateId } from '../../utils';
import type { MappingStatus } from '../../types';

const STEPS: MappingStatus[] = [
  'Draft','Submitted','Engineering Review','Approved by Eng',
  'Confirmed by MIS','In Discussion','LOI Issued','Signed','CFP Started',
];

export const MappingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useSessionStore();
  const [comment, setComment] = React.useState('');

  const { data: mapping } = useMapping(id || '');
  const { data: requirement } = useRequirement(mapping?.requirementId || '');
  const { data: lineItems = [] } = useMappingLineItems(id);
  const { data: candidates = [] } = useCandidates();
  const { data: approvals = [] } = useApprovals({ mappingId: id });
  const { data: auditEvents = [] } = useAuditEvents({ entityId: id });
  const { mutateAsync: updateMapping } = useUpdateMapping();
  const { mutateAsync: createApproval } = useCreateApproval();

  if (!mapping) return <Box p={4}><Typography>Loading…</Typography></Box>;

  const stepIdx = STEPS.indexOf(mapping.status);
  const mappedCandidates = lineItems.map((li) => ({
    ...li,
    candidate: candidates.find((c) => c.id === li.candidateId),
  }));

  const canApproveEng = currentUser && can.engineeringApprove(currentUser.role) && mapping.status === 'Engineering Review';
  const canConfirmMIS = currentUser && can.misConfirm(currentUser.role) && mapping.status === 'Approved by Eng';
  const canSubmit = currentUser && can.submitMapping(currentUser.role) && mapping.status === 'Draft';

  const handleAction = async (decision: 'Approved' | 'Rejected', nextStatus: MappingStatus) => {
    try {
      await createApproval({
        id: generateId(),
        mappingId: id || '',
        actorRole: currentUser!.role,
        actorId: currentUser!.id,
        decision,
        comment,
        timestamp: new Date().toISOString(),
      });
      await updateMapping({ id: id!, status: nextStatus, updatedAt: new Date().toISOString() });
      enqueueSnackbar(`Mapping ${decision.toLowerCase()}`, { variant: decision === 'Approved' ? 'success' : 'warning' });
      setComment('');
    } catch {
      enqueueSnackbar('Error processing action', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/mappings')} variant="outlined" size="small">Back</Button>
        <Typography variant="h6" fontWeight={700} ml={1}>Mapping Detail</Typography>
        <StatusChip status={mapping.status} type="mapping" sx={{ ml: 'auto' }} />
      </Box>

      {/* Progress Stepper */}
      <SectionCard sx={{ mb: 3 }}>
        <Stepper activeStep={stepIdx} alternativeLabel>
          {STEPS.map((step, i) => (
            <Step key={step} completed={i < stepIdx}>
              <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.7rem' } }}>{step}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </SectionCard>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          {/* Requirement Info */}
          {requirement && (
            <SectionCard title="Requirement" sx={{ mb: 3 }}>
              <Box sx={{ fontFamily: 'monospace', fontSize: '0.8rem', mb: 1.5, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                {requirement.requirementCode}
              </Box>
              <InfoRow label="Tech Stack" value={<Chip label={requirement.techStack} size="small" color="primary" variant="outlined" />} />
              <InfoRow label="Intake Type" value={requirement.intakeType} />
              <InfoRow label="Location" value={requirement.location} />
              <InfoRow label="Open Positions" value={requirement.openPositions} />
              <InfoRow label="Onboarding Date" value={formatDate(requirement.onboardingDate)} />
            </SectionCard>
          )}

          {/* Mapped Candidates */}
          <SectionCard title={`Mapped Candidates (${lineItems.length})`}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Candidate</TableCell>
                  <TableCell>Tech</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mappedCandidates.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.65rem', bgcolor: 'primary.main' }}>
                          {item.candidate?.name.slice(0, 2)}
                        </Avatar>
                        <Box>
                          <Typography variant="caption" fontWeight={600}>{item.candidate?.name || item.candidateId}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">{item.candidate?.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="caption">{item.proposedTech}</Typography></TableCell>
                    <TableCell>
                      <Chip label={item.allocationType} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                    </TableCell>
                    <TableCell>
                      {item.candidate && <StatusChip status={item.candidate.status} type="candidate" />}
                    </TableCell>
                  </TableRow>
                ))}
                {lineItems.length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center">No candidates mapped</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={5}>
          {/* Action Panel */}
          {(canSubmit || canApproveEng || canConfirmMIS) && (
            <SectionCard title="Action Required" sx={{ mb: 3, border: '1px solid', borderColor: 'primary.main' }}>
              <TextField
                label="Comment / Notes" fullWidth multiline rows={3}
                value={comment} onChange={(e) => setComment(e.target.value)} sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {canSubmit && (
                  <Button variant="contained" startIcon={<Send />}
                    onClick={() => handleAction('Approved', 'Engineering Review')}>
                    Submit for Review
                  </Button>
                )}
                {canApproveEng && (
                  <>
                    <Button variant="contained" color="success" startIcon={<CheckCircle />}
                      onClick={() => handleAction('Approved', 'Approved by Eng')}>
                      Approve
                    </Button>
                    <Button variant="outlined" color="error" startIcon={<Cancel />}
                      onClick={() => handleAction('Rejected', 'Draft')}>
                      Reject
                    </Button>
                  </>
                )}
                {canConfirmMIS && (
                  <Button variant="contained" color="success" startIcon={<CheckCircle />}
                    onClick={() => handleAction('Approved', 'Confirmed by MIS')}>
                    Confirm Mapping
                  </Button>
                )}
              </Box>
            </SectionCard>
          )}

          {/* Approval History */}
          <SectionCard title="Approval History" sx={{ mb: 3 }}>
            {approvals.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No approvals yet</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {approvals.map((ap) => (
                  <Box key={ap.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" fontWeight={700}>{ap.actorRole.replace(/_/g, ' ')}</Typography>
                      <Chip
                        label={ap.decision} size="small"
                        color={ap.decision === 'Approved' ? 'success' : ap.decision === 'Rejected' ? 'error' : 'default'}
                        sx={{ fontWeight: 700, fontSize: '0.6rem' }}
                      />
                    </Box>
                    {ap.comment && <Typography variant="caption" color="text.secondary">{ap.comment}</Typography>}
                    <Typography variant="caption" color="text.secondary" display="block">{formatDateTime(ap.timestamp)}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </SectionCard>

          {/* Audit Timeline */}
          <SectionCard title="Audit Timeline">
            {auditEvents.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No audit events</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {auditEvents.map((ev) => (
                  <Box key={ev.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 0.75, flexShrink: 0 }} />
                    <Box>
                      <Typography variant="caption" fontWeight={600}>{ev.action}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block">{formatDateTime(ev.timestamp)}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
};
