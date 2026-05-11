import React from 'react';
import { useSnackbar } from 'notistack';
import {
  useLOIs, useCandidates, useRequirements, useMappings,
  useCreateLOI, useUpdateLOI, useUpdateCandidate,
  useDiscussionLogs, useAllMappingLineItems, useUpdateRequirement,
} from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { formatDate, generateId } from '../../utils';
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
      <div className="topbar">
        <div className="topbar-left">
          <span className="breadcrumb">Fellowship MIS / <span>LOI Tracker</span></span>
        </div>
        <div className="topbar-right">
          {canIssue && (
            <button className="btn btn-primary" onClick={() => setOpen(true)}>
              <i className="ti ti-send" /> Issue Bulk LOI
            </button>
          )}
        </div>
      </div>

      <div className="content">
        <div className="kpi-row">
          <div className="kpi" style={{ borderTopColor: '#f59e0b' }}>
            <div className="kpi-label">Sent</div>
            <div className="kpi-val">{stats.sent}</div>
            <div className="kpi-sub">Awaiting Signature</div>
          </div>
          <div className="kpi" style={{ borderTopColor: '#10b981' }}>
            <div className="kpi-label">Signed</div>
            <div className="kpi-val">{stats.signed}</div>
            <div className="kpi-sub">Completed</div>
          </div>
          <div className="kpi" style={{ borderTopColor: '#6366f1' }}>
            <div className="kpi-label">Total Issued</div>
            <div className="kpi-val">{stats.total}</div>
            <div className="kpi-sub">LOIs Processed</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Conversion</div>
            <div className="kpi-val">{stats.total ? Math.round((stats.signed / stats.total) * 100) : 0}%</div>
            <div className="kpi-sub">Sign Rate</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-hd">
            <span className="panel-title">Track Letter of Intent Issuance</span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 24 }}>Candidate</th>
                  <th>Requirement</th>
                  <th>Sent At</th>
                  <th>Signed At</th>
                  <th>Status</th>
                  <th style={{ paddingRight: 24, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lois.map((loi) => {
                  const candidate = candidates.find((c) => c.id === loi.candidateId);
                  const req = requirements.find((r) => r.id === loi.requirementId);
                  return (
                    <tr key={loi.id}>
                      <td style={{ paddingLeft: 24 }}>
                        <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{candidate?.name || loi.candidateId}</div>
                        <div style={{ fontSize: 9, color: 'var(--g500)' }}>{candidate?.email}</div>
                      </td>
                      <td>
                        <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 10, color: 'var(--blue)' }}>
                          {req?.requirementCode || loi.requirementId}
                        </div>
                      </td>
                      <td>{formatDate(loi.sentAt)}</td>
                      <td>{loi.signedAt ? formatDate(loi.signedAt) : '—'}</td>
                      <td>
                        <span className={`badge ${loi.status === 'Signed' ? 'loi' : 'active'}`}>
                          {loi.status}
                        </span>
                      </td>
                      <td style={{ paddingRight: 24, textAlign: 'right' }}>
                        {canIssue && loi.status === 'Sent' && (
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => handleMarkSigned(loi.id)}
                            style={{ color: 'var(--green)' }}
                          >
                            <i className="ti ti-check" /> Mark Signed
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {lois.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '60px 0', color: 'var(--g500)' }}>
                      <div style={{ fontSize: 32, opacity: 0.2, marginBottom: 10 }}><i className="ti ti-mail-forward" /></div>
                      No LOIs issued yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {open && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <div className="modal-hd">
              <span className="modal-title">Issue Bulk LOI</span>
              <button className="btn-close" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              <div style={{ padding: 20, background: 'var(--g50)', borderBottom: '1px solid var(--g200)' }}>
                <label className="form-label">Step 1: Select Requirement</label>
                <select 
                  className="form-input" 
                  value={bulkReqId} 
                  onChange={e => setBulkReqId(e.target.value)}
                >
                  <option value="">Choose requirement...</option>
                  {requirements.filter(r => r.status === 'active').map(r => (
                    <option key={r.id} value={r.id}>{r.requirementCode} ({r.location})</option>
                  ))}
                </select>
              </div>

              <div style={{ padding: 20 }}>
                <label className="form-label" style={{ marginBottom: 12 }}>Step 2: Select Candidates ({eligibleCandidates.length} eligible)</label>
                <div style={{ maxHeight: 300, overflowY: 'auto' }} className="custom-scroll">
                  {eligibleCandidates.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {eligibleCandidates.map(c => (
                        <div 
                          key={c.id} 
                          className="disc-card" 
                          style={{ 
                            padding: '10px 15px', 
                            cursor: 'pointer',
                            border: selectedCandidates.includes(c.id) ? '1px solid var(--blue)' : '1px solid var(--g200)',
                            background: selectedCandidates.includes(c.id) ? 'rgba(10,132,208,0.05)' : '#fff'
                          }}
                          onClick={() => toggleCandidate(c.id)}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedCandidates.includes(c.id)} 
                            onChange={() => {}} // Controlled by div click
                            style={{ width: 16, height: 16, cursor: 'pointer' }}
                          />
                          <div style={{ flex: 1, marginLeft: 10 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{c.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--g500)' }}>{c.stream} • {c.email}</div>
                          </div>
                          <div className="badge active" style={{ fontSize: 9 }}>Discussed</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--g500)', fontSize: 12 }}>
                      No candidates in 'Discussed' status. Run discussions first.
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-ft">
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                disabled={creating || selectedCandidates.length === 0 || !bulkReqId}
                onClick={handleBulkSend}
              >
                {creating ? 'Sending...' : `Issue LOI to ${selectedCandidates.length} candidates`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


