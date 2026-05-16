import React from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Typography,
  Button,
  Card,
  Grid,
  Avatar,
  Chip,
  TextField,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  InputAdornment,
  Divider,
  Paper
} from '@mui/material';
import {
  useDiscussionLogs, useAllMappingLineItems,
  useCandidates, useMappings, useRequirements,
  useCreateDiscussionLog, useUpdateCandidate,
} from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { formatDate, generateId } from '../../utils';

export const DiscussionsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useSessionStore();
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(null);
  const [outcome, setOutcome] = React.useState<'Accepted' | 'Declined' | 'Reschedule'>('Accepted');
  const [notes, setNotes] = React.useState('');
  const [followUpDate, setFollowUpDate] = React.useState('');

  const { data: discussionLogs = [] } = useDiscussionLogs();
  const { data: lineItems = [] } = useAllMappingLineItems();
  const { data: candidates = [] } = useCandidates();
  const { data: mappings = [] } = useMappings();
  const { data: requirements = [] } = useRequirements();
  const { mutateAsync: createLog, isPending } = useCreateDiscussionLog();
  const { mutateAsync: updateCandidate } = useUpdateCandidate();

  const canUpdate = currentUser && can.updateDiscussion(currentUser.role);

  const pendingItems = lineItems.filter(li => {
    const mapping = mappings.find(m => m.id === li.mappingId);
    const hasLog = discussionLogs.some(log => log.mappingLineItemId === li.id);
    return !hasLog && (mapping?.status === 'Engineering Review' || mapping?.status === 'Confirmed by MIS');
  });

  React.useEffect(() => {
    if (pendingItems.length > 0) {
      if (!selectedItemId || !pendingItems.find(i => i.id === selectedItemId)) {
        setSelectedItemId(pendingItems[0].id);
      }
    } else {
      setSelectedItemId(null);
    }
  }, [pendingItems, selectedItemId]);

  const selectedItem = lineItems.find(li => li.id === selectedItemId);
  const selectedCand = candidates.find(c => c.id === selectedItem?.candidateId);
  const selectedMapping = mappings.find(m => m.id === selectedItem?.mappingId);
  const selectedReq = requirements.find(r => r.id === selectedMapping?.requirementId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !selectedCand) return;
    try {
      await createLog({
        id: generateId(),
        mappingLineItemId: selectedItemId,
        coordinatorId: currentUser?.id || '',
        outcome: outcome as any,
        notes,
        followUpDate: followUpDate || null,
        createdAt: new Date().toISOString(),
      });

      // Update candidate status to enable LOI issuance if accepted
      if (outcome === 'Accepted') {
        await updateCandidate({ id: selectedCand.id, status: 'Discussed' });
      }

      enqueueSnackbar('Discussion outcome submitted', { variant: 'success' });
      setNotes('');
      setFollowUpDate('');
    } catch {
      enqueueSnackbar('Error submitting outcome', { variant: 'error' });
    }
  };

  const getPriority = (cgpa: number) => {
    if (cgpa >= 8.5) return { label: 'Urgent', color: '#EF4444', bg: '#FEE2E2', dot: '#EF4444' };
    if (cgpa >= 7.5) return { label: 'High', color: '#F59E0B', bg: '#FEF3C7', dot: '#F59E0B' };
    return { label: 'Normal', color: '#3B82F6', bg: '#DBEAFE', dot: '#10B981' };
  };

  return (
    <>
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #E5EBF0', px: 2, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography sx={{ fontSize: 15, color: '#6B7C93' }}>
            Discussion Queue / <Box component="span" sx={{ color: '#111827', fontWeight: 500 }}>{pendingItems.length} pending contacts</Box>
          </Typography>
        </Box>
        <Box>
          <Chip label={`${pendingItems.length} Pending`} size="small" sx={{ bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 600, borderRadius: 3 }} />
        </Box>
      </Box>

      <Box sx={{ p: 3, minHeight: 'calc(100vh - 60px)', bgcolor: '#F8FAFC' }}>
        {pendingItems.length > 0 ? (
          <Grid container spacing={3}>
            {/* Left Column: List */}
            <Grid item xs={12} md={5} lg={4}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B7C93', letterSpacing: '0.05em', mb: 2 }}>
                CANDIDATES TO CONTACT
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {pendingItems.map(li => {
                  const cand = candidates.find(c => c.id === li.candidateId);
                  const mapping = mappings.find(m => m.id === li.mappingId);
                  const req = requirements.find(r => r.id === mapping?.requirementId);
                  const prio = getPriority(cand?.cgpa || 7.0);
                  const isActive = selectedItemId === li.id;

                  return (
                    <Card 
                      key={li.id}
                      onClick={() => setSelectedItemId(li.id)}
                      sx={{ 
                        cursor: 'pointer', 
                        p: 2, 
                        border: isActive ? '2px solid' : '1px solid',
                        borderColor: isActive ? 'primary.main' : '#E5EBF0',
                        boxShadow: isActive ? '0 4px 12px rgba(37,99,235,0.1)' : 'none',
                        position: 'relative',
                        transition: 'all 0.2s',
                        borderRadius: 2
                      }}
                    >
                      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                        <Chip label={prio.label} size="small" sx={{ bgcolor: prio.bg, color: prio.color, fontWeight: 700, fontSize: 11, height: 20 }} />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 44, height: 44, bgcolor: 'primary.main', fontSize: 16, fontWeight: 600 }}>
                            {cand?.avatar || cand?.name.slice(0, 2).toUpperCase()}
                          </Avatar>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: prio.dot }} />
                        </Box>
                        <Box sx={{ flex: 1, pr: 6 }}>
                          <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: 16 }}>{cand?.name}</Typography>
                          <Typography sx={{ fontSize: 13, color: '#6B7C93', mt: 0.5 }}>
                            {cand?.stream} • {li.proposedTech} • {req?.requirementCode.split('-').pop()}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1.5 }}>
                            <Typography sx={{ fontSize: 13, color: '#111827', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <i className="ti ti-phone" style={{ fontSize: 16, color: '#6B7C93' }} /> {cand?.phone}
                            </Typography>
                            <Typography sx={{ fontSize: 13, color: '#111827', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <i className="ti ti-mail" style={{ fontSize: 16, color: '#6B7C93' }} /> {cand?.email}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Card>
                  );
                })}
              </Box>
            </Grid>

            {/* Right Column: Detail Form */}
            <Grid item xs={12} md={7} lg={8}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B7C93', letterSpacing: '0.05em', mb: 2 }}>
                LOG DISCUSSION OUTCOME — {selectedCand?.name.toUpperCase()}
              </Typography>
              
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <Box sx={{ p: 4 }}>
                  
                  {/* Context Box */}
                  <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 3, mb: 4, border: '1px solid #E5EBF0' }}>
                    <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
                      Mapped for: {selectedReq?.requirementCode}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 1.5 }}>
                      <Typography sx={{ fontSize: 14, color: '#475569', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <i className="ti ti-users" /> {selectedReq?.openPositions} positions
                      </Typography>
                      <Typography sx={{ fontSize: 14, color: '#475569', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <i className="ti ti-map-pin" /> {selectedReq?.location}
                      </Typography>
                      <Typography sx={{ fontSize: 14, color: '#475569', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <i className="ti ti-calendar-event" /> Onboarding {selectedReq?.onboardingDate ? formatDate(selectedReq.onboardingDate) : 'TBD'}
                      </Typography>
                      <Typography sx={{ fontSize: 14, color: '#475569', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <i className="ti ti-briefcase" /> {selectedReq?.intakeType} model
                      </Typography>
                    </Box>
                  </Box>

                  <form onSubmit={handleSubmit}>
                    {/* Outcomes */}
                    <Box sx={{ mb: 4 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#111827', mb: 1.5 }}>Discussion outcome</Typography>
                      <Grid container spacing={2}>
                        {(['Accepted', 'Declined', 'Reschedule'] as const).map(o => (
                          <Grid item xs={12} sm={4} key={o}>
                            <Paper
                              variant="outlined"
                              onClick={() => setOutcome(o)}
                              sx={{ 
                                p: 2, 
                                borderRadius: 2, 
                                border: outcome === o ? '2px solid' : '1px solid',
                                borderColor: outcome === o ? '#16A34A' : '#CBD5E1',
                                bgcolor: '#fff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                transition: 'all 0.15s'
                              }}
                            >
                              <Radio 
                                checked={outcome === o}
                                value={o}
                                sx={{ p: 0, '&.Mui-checked': { color: '#16A34A' } }}
                              />
                              <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{o}</Typography>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>

                    {/* Notes */}
                    <Box sx={{ mb: 4 }}>
                      <TextField 
                        fullWidth
                        label="Discussion notes"
                        multiline
                        rows={5}
                        placeholder="Candidate showed strong interest. Confirmed availability for location..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        required
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>

                    {/* Follow up */}
                    <Box sx={{ mb: 4 }}>
                      <TextField 
                        type="date"
                        fullWidth
                        label="Next action date (if rescheduled)"
                        value={followUpDate}
                        onChange={e => setFollowUpDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Box>

                    <Button 
                      type="submit" 
                      variant="contained"
                      color="primary"
                      disabled={isPending}
                      fullWidth
                      sx={{ py: 1.5, fontSize: 16, fontWeight: 700, borderRadius: 2 }}
                    >
                      {isPending ? 'Submitting...' : 'Submit Outcome'}
                    </Button>
                  </form>
                </Box>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ height: 'calc(100vh - 150px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <i className="ti ti-circle-check" />
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontWeight: 700, color: '#111827', fontSize: 24 }}>All caught up!</Typography>
              <Typography sx={{ color: '#6B7C93', fontSize: 16, mt: 1, maxWidth: 300, lineHeight: 1.5, mx: 'auto' }}>
                There are no more candidates pending for discussion at this moment.
              </Typography>
              <Button 
                variant="outlined" 
                color="primary"
                sx={{ mt: 3, px: 3, borderRadius: 2 }}
                onClick={() => window.location.reload()}
                startIcon={<i className="ti ti-refresh" />}
              >
                Refresh Queue
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
};
