import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
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
    <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <div className="topbar">
        <div className="topbar-left">
          <span className="breadcrumb">Review Queue / <span>Pending Approvals ({queueMappings.length})</span></span>
        </div>
      </div>

      <div className="content" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="panel-hd" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="panel-title">Mapping Proposals Awaiting Review</span>
            <span className="badge draft" style={{ color: '#9a3412', background: '#ffedd5', borderColor: '#fdba74', fontWeight: 700 }}>
              {queueMappings.length} Pending
            </span>
          </div>
          
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Left Column: Queue List */}
            <div style={{ width: 400, borderRight: '1px solid var(--g200)', overflowY: 'auto', background: 'var(--g50)', padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--g500)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}>Queue</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                    <div 
                      key={m.id}
                      onClick={() => setSelectedMappingId(m.id)}
                      style={{
                        padding: '12px 16px',
                        background: '#fff',
                        borderRadius: 8,
                        border: isSelected ? '2px solid var(--blue)' : '1px solid var(--g200)',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                        position: 'relative',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: isSelected ? 'var(--blue)' : 'var(--navy)' }}>{req?.requirementCode.split('-').slice(0,2).join('-')}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#9333ea' }}>{avgScore}% AI</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--g600)', marginBottom: 2 }}>{req?.techStack.split(' — ')[0]} · {req?.location.split(',')[0]} · {req?.openPositions} seats</div>
                      <div style={{ fontSize: 12, color: 'var(--g400)' }}>Proposed by MIS Manager · 2h ago</div>
                    </div>
                  );
                })}
                {queueMappings.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--g500)', fontSize: 14 }}>
                    No pending proposals
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Review Detail */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
              {selectedMapping ? (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--g100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--g500)', textTransform: 'uppercase' }}>
                      Review — <span style={{ color: 'var(--navy)' }}>{selectedReq?.requirementCode} ({selectedReq?.techStack.split(' — ')[1]})</span>
                    </div>
                  </div>
                  
                  <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                    <div style={{ marginBottom: 24 }}>
                      <table className="tbl" style={{ border: '1px solid var(--g200)', borderRadius: 6, overflow: 'hidden' }}>
                        <thead style={{ background: 'var(--g50)' }}>
                          <tr>
                            <th>Candidate</th>
                            <th>COE</th>
                            <th>CGPA</th>
                            <th>Override</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedItems.map((item) => {
                            const cand = candidates.find(c => c.id === item.candidateId);
                            const coe = coes.find(c => Number(c.id) === Number(cand?.coeId));
                            return (
                              <tr key={item.id}>
                                <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{cand?.name}</td>
                                <td>{coe?.name.split(' ')[0]}</td>
                                <td style={{ fontWeight: 700, color: 'var(--green)' }}>{cand?.cgpa}</td>
                                <td><i className="ti ti-minus" style={{ color: 'var(--g300)' }} /></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: 14 }}>Review comments</label>
                      <textarea 
                        className="form-input" 
                        rows={4} 
                        placeholder="Add comments for MIS Manager..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        style={{ background: 'var(--g50)', border: '1px solid var(--g300)' }}
                      />
                    </div>
                  </div>

                  <div style={{ padding: '16px 24px', borderTop: '1px solid var(--g100)', display: 'flex', gap: 12 }}>
                    <button className="btn" style={{ flex: 1, background: 'var(--red)', color: '#fff', border: 'none', fontWeight: 600 }} onClick={() => handleAction('reject')}>Reject</button>
                    <button className="btn" style={{ flex: 1, background: 'var(--blue-light)', color: 'var(--blue)', border: '1px solid var(--blue-light)', fontWeight: 600 }} onClick={() => handleAction('revision')}>Request Revision</button>
                    <button className="btn" style={{ flex: 1, background: 'var(--green)', color: '#fff', border: 'none', fontWeight: 600 }} onClick={() => handleAction('approve')}>Approve</button>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--g400)', flexDirection: 'column' }}>
                  <i className="ti ti-clipboard-check" style={{ fontSize: 66, opacity: 0.2, marginBottom: 16 }} />
                  <div>Select a proposal to begin review</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

