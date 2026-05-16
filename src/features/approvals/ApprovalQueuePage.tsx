import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  Paper
} from '@mui/material';
import {
  useMappings, useRequirements, useApprovals,
  useUpdateMapping, useCreateApproval, useAllMappingLineItems, useCandidates, useCOEs,
} from '../../api/hooks';
import { useSessionStore } from '../../store';
import { formatDate, generateId } from '../../utils';
import type { MappingStatus } from '../../types';

interface ApprovalQueueProps {
  queueType: 'engineering' | 'mis';
}

export const ApprovalQueuePage: React.FC<ApprovalQueueProps> = ({ queueType }) => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useSessionStore();
  const [comment, setComment] = React.useState('');
  const [selectedMappingId, setSelectedMappingId] = React.useState<string | null>(null);

  const { data: mappings = [] } = useMappings();
  const { data: requirements = [] } = useRequirements();
  const { data: lineItems = [] } = useAllMappingLineItems();
  const { data: candidates = [] } = useCandidates();
  const { data: coes = [] } = useCOEs();
  const { mutateAsync: updateMapping } = useUpdateMapping();
  const { mutateAsync: createApproval } = useCreateApproval();

  const filterStatus: MappingStatus = queueType === 'engineering' ? 'Engineering Review' : 'Approved by Eng';
  const nextApprove: MappingStatus = queueType === 'engineering' ? 'Approved by Eng' : 'Confirmed by MIS';
  const nextReject: MappingStatus = 'Draft';

  const queueMappings = mappings.filter((m) => m.status === filterStatus);
  
  // Auto-select first mapping if none selected
  React.useEffect(() => {
    if (queueMappings.length > 0 && !selectedMappingId) {
      setSelectedMappingId(queueMappings[0].id);
    }
  }, [queueMappings, selectedMappingId]);

  const handleAction = async (decision: 'approve' | 'reject' | 'revision') => {
    if (!selectedMappingId || !currentUser) return;
    try {
      const isApprove = decision === 'approve';
      const isRevision = decision === 'revision';
      
      await createApproval({
        id: generateId(),
        mappingId: selectedMappingId,
        actorRole: currentUser.role,
        actorId: currentUser.id,
        decision: isApprove ? 'Approved' : isRevision ? 'Revision Requested' : 'Rejected',
        comment,
        timestamp: new Date().toISOString(),
      });

      await updateMapping({
        id: selectedMappingId,
        status: isApprove ? nextApprove : 'Draft',
        updatedAt: new Date().toISOString(),
      });

      enqueueSnackbar(isApprove ? 'Mapping approved!' : isRevision ? 'Revision requested' : 'Mapping rejected', {
        variant: isApprove ? 'success' : 'warning',
      });
      
      // Select next in queue or null
      const currentIndex = queueMappings.findIndex(m => m.id === selectedMappingId);
      const nextMapping = queueMappings[currentIndex + 1] || queueMappings[currentIndex - 1];
      setSelectedMappingId(nextMapping?.id || null);
      setComment('');
    } catch {
      enqueueSnackbar('Error processing action', { variant: 'error' });
    }
  };

  const selectedMapping = mappings.find(m => m.id === selectedMappingId);
  const selectedReq = selectedMapping ? requirements.find(r => r.id === selectedMapping.requirementId) : null;
  const selectedItems = lineItems.filter(li => li.mappingId === selectedMappingId);

  return (
    <Box sx={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', bgcolor: '#F8FAFC' }}>
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #E5EBF0', px: 2, minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography sx={{ fontSize: 15, color: '#6B7C93' }}>
            Review Queue / <Box component="span" sx={{ color: '#111827', fontWeight: 500 }}>Pending Approvals ({queueMappings.length})</Box>
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3, overflow: 'hidden' }}>
        <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: '16px 24px', borderBottom: '1px solid #E5EBF0', bgcolor: '#fff' }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Mapping Proposals Awaiting Review</Typography>
            <Chip 
              label={`${queueMappings.length} Pending`} 
              size="small" 
              sx={{ bgcolor: '#FFEDD5', color: '#9A3412', border: '1px solid #FDBA74', fontWeight: 700, borderRadius: 1.5 }} 
            />
          </Box>
          
          <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Left Column: Queue List */}
            <Box sx={{ width: 400, borderRight: '1px solid #E5EBF0', overflowY: 'auto', bgcolor: '#F8FAFC', p: 2 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase', mb: 2, letterSpacing: '0.05em' }}>Queue</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {queueMappings.map((m) => {
                  const req = requirements.find(r => r.id === m.requirementId);
                  const isSelected = selectedMappingId === m.id;
                  // Mock AI score based on avg assessment score of candidates
                  const mItems = lineItems.filter(li => li.mappingId === m.id);
                  const avgScore = mItems.length > 0 
                    ? Math.round(mItems.reduce((acc, li) => {
                        const cand = candidates.find(c => c.id === li.candidateId);
                        return acc + ((cand?.cgpa || 0) * 10);
                      }, 0) / mItems.length)
                    : 85;

                  return (
                    <Paper 
                      key={m.id}
                      elevation={isSelected ? 2 : 0}
                      onClick={() => setSelectedMappingId(m.id)}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: isSelected ? 'primary.main' : '#E5EBF0',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        bgcolor: '#fff'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ fontSize: 15, fontWeight: 700, color: isSelected ? 'primary.main' : '#111827' }}>
                          {req?.requirementCode.split('-').slice(0,2).join('-')}
                        </Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#9333EA' }}>{avgScore}% AI</Typography>
                      </Box>
                      <Typography sx={{ fontSize: 13, color: '#475569', mb: 0.5 }}>
                        {req?.techStack.split(' — ')[0]} · {req?.location.split(',')[0]} · {req?.openPositions} seats
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: '#94A3B8' }}>Proposed by MIS Manager · 2h ago</Typography>
                    </Paper>
                  );
                })}
                {queueMappings.length === 0 && (
                  <Typography sx={{ textAlign: 'center', p: 4, color: '#6B7C93', fontSize: 14 }}>
                    No pending proposals
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Right Column: Review Detail */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
              {selectedMapping ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ p: '16px 24px', borderBottom: '1px solid #E5EBF0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#6B7C93', textTransform: 'uppercase' }}>
                      Review — <Box component="span" sx={{ color: '#111827' }}>{selectedReq?.requirementCode} ({selectedReq?.techStack.split(' — ')[1]})</Box>
                    </Typography>
                  </Box>
                  
                  <Box sx={{ flex: 1, p: 3, overflowY: 'auto' }}>
                    <Box sx={{ mb: 4 }}>
                      <Table sx={{ border: '1px solid #E5EBF0', borderRadius: 2, overflow: 'hidden' }}>
                        <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: 13 }}>Candidate</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: 13 }}>COE</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: 13 }}>CGPA</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: 13 }}>Override</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedItems.map((item) => {
                            const cand = candidates.find(c => c.id === item.candidateId);
                            const coe = coes.find(c => Number(c.id) === Number(cand?.coeId));
                            return (
                              <TableRow key={item.id} hover>
                                <TableCell sx={{ fontWeight: 600, color: '#111827' }}>{cand?.name}</TableCell>
                                <TableCell>{coe?.name.split(' ')[0]}</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#16A34A' }}>{cand?.cgpa}</TableCell>
                                <TableCell><i className="ti ti-minus" style={{ color: '#CBD5E1' }} /></TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </Box>

                    <Box>
                      <TextField 
                        fullWidth
                        label="Review comments"
                        multiline
                        rows={4}
                        placeholder="Add comments for MIS Manager..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        InputLabelProps={{ shrink: true, sx: { fontWeight: 700 } }}
                        sx={{ bgcolor: '#F8FAFC' }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ p: '16px 24px', borderTop: '1px solid #E5EBF0', display: 'flex', gap: 2 }}>
                    <Button 
                      variant="contained" 
                      color="error" 
                      sx={{ flex: 1, py: 1.5, fontWeight: 700, borderRadius: 2 }} 
                      onClick={() => handleAction('reject')}
                    >
                      Reject
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      sx={{ flex: 1, py: 1.5, fontWeight: 700, borderRadius: 2 }} 
                      onClick={() => handleAction('revision')}
                    >
                      Request Revision
                    </Button>
                    <Button 
                      variant="contained" 
                      color="success" 
                      sx={{ flex: 1, py: 1.5, fontWeight: 700, borderRadius: 2 }} 
                      onClick={() => handleAction('approve')}
                    >
                      Approve
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', flexDirection: 'column' }}>
                  <Box sx={{ fontSize: 72, opacity: 0.2, mb: 2 }}><i className="ti ti-clipboard-check" /></Box>
                  <Typography sx={{ fontSize: 16 }}>Select a proposal to begin review</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Card>
      </Box>
    </Box>
  );
};

