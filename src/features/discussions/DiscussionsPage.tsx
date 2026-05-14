import React from 'react';
import { useSnackbar } from 'notistack';
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
      <div className="topbar">
        <div className="topbar-left">
          <span className="breadcrumb">Discussion Queue / <span>{pendingItems.length} pending contacts</span></span>
        </div>
        <div className="topbar-right">
          <span className="badge mapping" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 12 }}>{pendingItems.length} Pending</span>
        </div>
      </div>

      <div className="content">
        {pendingItems.length > 0 ? (
          <div style={{ display: 'flex', gap: 20, minHeight: 'calc(100vh - 48px)' }}>
            {/* Left Column: List */}
            <div style={{ width: 450, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--g500)', letterSpacing: '0.05em', marginBottom: 4 }}>CANDIDATES TO CONTACT</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pendingItems.map(li => {
                  const cand = candidates.find(c => c.id === li.candidateId);
                  const mapping = mappings.find(m => m.id === li.mappingId);
                  const req = requirements.find(r => r.id === mapping?.requirementId);
                  const prio = getPriority(cand?.cgpa || 7.0);
                  const isActive = selectedItemId === li.id;

                  return (
                    <div 
                      key={li.id}
                      className={`panel ${isActive ? 'active' : ''}`}
                      onClick={() => setSelectedItemId(li.id)}
                      style={{ 
                        cursor: 'pointer', 
                        padding: '16px 20px', 
                        margin: 0,
                        border: isActive ? '2px solid var(--blue)' : '1px solid var(--g200)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ position: 'absolute', top: 16, right: 20 }}>
                        <span style={{ 
                          fontSize: 12, 
                          fontWeight: 700, 
                          padding: '2px 10px', 
                          borderRadius: 10, 
                          background: prio.bg, 
                          color: prio.color 
                        }}>
                          {prio.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                          <div className="sb-avatar" style={{ width: 44, height: 44, background: 'var(--blue)', color: '#fff', fontSize: 17 }}>
                            {cand?.avatar || cand?.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: prio.dot }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 17 }}>{cand?.name}</div>
                          <div style={{ fontSize: 13, color: 'var(--g500)', marginTop: 4 }}>
                            {cand?.stream} • {li.proposedTech} • {req?.requirementCode.split('-').pop()}
                          </div>
                          <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                            <div style={{ fontSize: 13, color: 'var(--navy)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <i className="ti ti-phone" style={{ fontSize: 16 }} /> {cand?.phone}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--navy)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <i className="ti ti-mail" style={{ fontSize: 16 }} /> {cand?.email}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Detail Form */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--g500)', letterSpacing: '0.05em', marginBottom: 4 }}>
                LOG DISCUSSION OUTCOME — {selectedCand?.name.toUpperCase()}
              </div>
              
              <div className="panel" style={{ marginBottom: 40 }}>
                <div className="panel-body" style={{ padding: 30 }}>
                  
                  {/* Context Box */}
                  <div style={{ background: 'var(--g50)', borderRadius: 12, padding: 24, marginBottom: 30, border: '1px solid var(--g200)' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)' }}>
                      Mapped for: {selectedReq?.requirementCode}
                    </div>
                    <div style={{ display: 'flex', gap: 24, marginTop: 10, fontSize: 14, color: 'var(--g600)' }}>
                      <span>{selectedReq?.openPositions} positions</span>
                      <span>{selectedReq?.location}</span>
                      <span>Onboarding {selectedReq?.onboardingDate ? formatDate(selectedReq.onboardingDate) : 'TBD'}</span>
                      <span>{selectedReq?.intakeType} model</span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
                    {/* Outcomes */}
                    <div>
                      <label className="form-label" style={{ marginBottom: 12 }}>Discussion outcome</label>
                      <div style={{ display: 'flex', gap: 15 }}>
                        {(['Accepted', 'Declined', 'Reschedule'] as const).map(o => (
                          <div 
                            key={o}
                            onClick={() => setOutcome(o)}
                            style={{ 
                              flex: 1, 
                              padding: '16px', 
                              borderRadius: 8, 
                              border: outcome === o ? '2px solid var(--green)' : '1px solid var(--g300)',
                              background: '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              transition: 'all 0.15s'
                            }}
                          >
                            <div style={{ 
                              width: 20, 
                              height: 20, 
                              borderRadius: '50%', 
                              border: '2px solid ' + (outcome === o ? 'var(--green)' : 'var(--g300)'),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {outcome === o && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--green)' }} />}
                            </div>
                            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--navy)' }}>{o}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="form-group">
                      <label className="form-label">Discussion notes</label>
                      <textarea 
                        className="form-input" 
                        rows={6} 
                        placeholder="Candidate showed strong interest. Confirmed availability for location..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        required
                        style={{ padding: 15 }}
                      />
                    </div>

                    {/* Follow up */}
                    <div className="form-group">
                      <label className="form-label">Next action date (if rescheduled)</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={followUpDate}
                        onChange={e => setFollowUpDate(e.target.value)}
                        style={{ height: 44 }}
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ 
                        width: '100%', 
                        height: 48, 
                        fontSize: 17, 
                        fontWeight: 700,
                        marginTop: 10,
                        borderRadius: 8,
                        background: 'var(--blue)'
                      }} 
                      disabled={isPending}
                    >
                      {isPending ? 'Submitting...' : 'Submit Outcome'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ height: 'calc(100vh - 150px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--green-light)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42, border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <i className="ti ti-circle-check" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 24 }}>All caught up!</div>
              <div style={{ color: 'var(--g500)', fontSize: 16, marginTop: 8, maxWidth: 300, lineHeight: 1.5 }}>
                There are no more candidates pending for discussion at this moment.
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ marginTop: 24, padding: '10px 24px' }}
                onClick={() => window.location.reload()}
              >
                <i className="ti ti-refresh" /> Refresh Queue
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
