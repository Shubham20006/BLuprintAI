import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  useMappings, useRequirements, useCandidates, useCOEs,
  useCreateMapping, useUpdateMapping, useMappingLineItems,
  useCreateMappingLineItem, useCreateApproval, useApprovals,
  useUpdateCandidate,
} from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { formatDate, generateId } from '../../utils';
import { PageLoader, LoadingButton } from '../../components/shared';
import type { Mapping, MappingStatus } from '../../types';

const MAPPING_STEPS: MappingStatus[] = [
  'Draft','Submitted','Engineering Review','Approved by Eng',
  'Confirmed by MIS','In Discussion','LOI Issued','Signed','CFP Started',
];

export const MappingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useSessionStore();
  const [search, setSearch] = React.useState('');
  const [newOpen, setNewOpen] = React.useState(false);
  const [selectedReqId, setSelectedReqId] = React.useState('');
  const [selectedCandidateIds, setSelectedCandidateIds] = React.useState<string[]>([]);
  const [notes, setNotes] = React.useState('');

  const { data: mappings = [], isLoading: loadingMappings } = useMappings();
  const { data: requirements = [], isLoading: loadingReqs } = useRequirements();
  const { data: candidates = [], isLoading: loadingCands } = useCandidates();
  const { data: coes = [] } = useCOEs();
  const { mutateAsync: createMapping, isPending: creating } = useCreateMapping();
  const { mutateAsync: updateMapping, isPending: updating } = useUpdateMapping();
  const { mutateAsync: createLineItem } = useCreateMappingLineItem();
  const { mutateAsync: updateCandidate } = useUpdateCandidate();

  const isLoading = loadingMappings || loadingReqs || loadingCands;

  const requirement = requirements.find((r) => r.id === selectedReqId);
  const remainingCap = requirement ? requirement.openPositions - requirement.filledPositions : 0;

  const filteredCandidates = candidates.filter((c) =>
    !currentUser || !can.isCOEScoped(currentUser.role) ||
    (Array.isArray(currentUser.coeScopeIds) && currentUser.coeScopeIds.some(id => String(id) === String(c.coeId)))
  );

  const filtered = mappings.filter((m) => {
    const req = requirements.find((r) => r.id === m.requirementId);
    return req?.requirementCode?.toLowerCase().includes(search.toLowerCase()) ||
      m.status?.toLowerCase().includes(search.toLowerCase());
  });

  const handleSubmitMapping = async () => {
    if (!selectedReqId || selectedCandidateIds.length === 0) {
      enqueueSnackbar('Select a requirement and at least one candidate', { variant: 'warning' });
      return;
    }
    const isMIS = currentUser?.role === 'MIS_MANAGER';
    
    if (selectedCandidateIds.length > remainingCap) {
      enqueueSnackbar(`Only ${remainingCap} positions remaining`, { variant: 'error' });
      return;
    }

    // Alignment & Assignment Checks
    for (const cid of selectedCandidateIds) {
      const cand = candidates.find(c => c.id === cid);
      if (!cand) continue;

      // Date Alignment Check
      if (requirement && cand.availabilityDate > requirement.onboardingDate) {
        const confirm = window.confirm(`${cand.name} is available from ${cand.availabilityDate}, but onboarding is on ${requirement.onboardingDate}. Continue anyway?`);
        if (!confirm) return;
      }

      // Conflict Check
      if (cand.status === 'Mapped' && !isMIS) {
        enqueueSnackbar(`${cand.name} is already mapped to another requirement. Only MIS Manager can override this.`, { variant: 'error' });
        return;
      }
    }
    try {
      const mappingId = generateId();
      await createMapping({
        id: mappingId,
        requirementId: selectedReqId,
        status: 'Draft',
        createdBy: currentUser?.id || '',
        currentOwnerRole: 'COE_LAB_HEAD',
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      for (const cid of selectedCandidateIds) {
        await createLineItem({ id: generateId(), mappingId, candidateId: cid, proposedTech: requirement?.techStack || '', allocationType: 'Primary' });
        // Automatically advance candidate status to 'Mapped'
        await updateCandidate({ id: cid, status: 'Mapped' });
      }
      enqueueSnackbar('Mapping created as Draft', { variant: 'success' });
      setNewOpen(false);
      setSelectedReqId('');
      setSelectedCandidateIds([]);
      setNotes('');
    } catch {
      enqueueSnackbar('Error creating mapping', { variant: 'error' });
    }
  };

  const getNextStatus = (current: MappingStatus): MappingStatus | null => {
    switch (current) {
      case 'Draft':            return 'Engineering Review';
      case 'Engineering Review': return 'Approved by Eng';
      case 'Approved by Eng':  return 'Confirmed by MIS';
      default:                 return null;
    }
  };

  const handleAdvanceStatus = async (mapping: Mapping) => {
    const nextStatus = getNextStatus(mapping.status);
    if (!nextStatus) return;
    await updateMapping({ id: mapping.id, status: nextStatus, updatedAt: new Date().toISOString() });
    enqueueSnackbar(`Status → ${nextStatus}`, { variant: 'success' });
  };

  const canCreate = currentUser && can.createMapping(currentUser.role);

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <span className="breadcrumb">Mappings / <span>Overview</span></span>
        </div>
        <div className="topbar-right">
          {canCreate && (
            <button className="btn btn-primary btn-sm" onClick={() => setNewOpen(true)}>
              <i className="ti ti-plus" aria-hidden="true" /> New Mapping
            </button>
          )}
        </div>
      </div>

      <div className="content">
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--navy)', marginBottom: 4 }}>Mappings</div>
          <div style={{ fontSize: 14, color: 'var(--g500)' }}>{mappings.length} total mapping records</div>
        </div>

        <div className="panel">
          <div className="panel-body" style={{ padding: 20 }}>
            <div style={{ marginBottom: 20, maxWidth: 400 }}>
              <div className="form-group" style={{ margin: 0, position: 'relative' }}>
                <i className="ti ti-search" style={{ position: 'absolute', left: 12, top: 10, color: 'var(--g500)' }} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Search by requirement or status..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              {isLoading ? (
                <PageLoader message="Loading mappings..." />
              ) : (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Requirement</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th>Updated</th>
                      <th>Notes</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => {
                      const req = requirements.find((r) => r.id === m.requirementId);
                      return (
                        <tr key={m.id}>
                          <td>
                            <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>
                              {req?.requirementCode || m.requirementId}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${m.status === 'Draft' ? 'draft' : 'active'}`}>{m.status}</span>
                          </td>
                          <td style={{ fontSize: 13, color: 'var(--g600)' }}>{formatDate(m.createdAt)}</td>
                          <td style={{ fontSize: 13, color: 'var(--g600)' }}>{formatDate(m.updatedAt)}</td>
                          <td style={{ fontSize: 13, color: 'var(--g500)', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.notes || '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/mappings/${m.id}`)}>
                              <i className="ti ti-eye" aria-hidden="true" />
                            </button>
                            {currentUser && (
                              (m.status === 'Draft' && can.submitMapping(currentUser.role)) ||
                              (m.status === 'Engineering Review' && can.engineeringApprove(currentUser.role)) ||
                              (m.status === 'Approved by Eng' && can.misConfirm(currentUser.role))
                            ) && (
                              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--blue)' }} onClick={() => handleAdvanceStatus(m)} title="Advance Status">
                                <i className="ti ti-arrow-right" aria-hidden="true" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {!isLoading && filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--g500)' }}>
                          No mappings found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Modal for New Mapping */}
      {newOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 700 }}>
            <div className="modal-hd">
              <span className="modal-title">Create Mapping Proposal</span>
              <button className="btn-close" onClick={() => setNewOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Select Requirement</label>
                <select className="form-select" value={selectedReqId} onChange={(e) => setSelectedReqId(e.target.value)}>
                  <option value="" disabled>Select a requirement</option>
                  {requirements.filter((r) => r.status === 'active').map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.requirementCode} — {r.openPositions - r.filledPositions} open
                    </option>
                  ))}
                </select>
              </div>

              {requirement && (
                <div style={{ background: remainingCap > 0 ? 'var(--blue-light)' : '#FEE2E2', color: remainingCap > 0 ? 'var(--blue)' : '#B91C1C', padding: '8px 12px', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
                  {remainingCap > 0 ? `${remainingCap} of ${requirement.openPositions} positions available` : 'This requirement is at full capacity'}
                </div>
              )}

              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
                Select Candidates ({selectedCandidateIds.length} selected)
              </div>
              <div style={{ border: '1px solid var(--g300)', borderRadius: 6, maxHeight: 250, overflowY: 'auto', marginBottom: 16 }}>
                <table className="tbl" style={{ border: 'none' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--g50)' }}>
                    <tr>
                      <th style={{ width: 30 }}></th>
                      <th>Name</th>
                      <th>COE</th>
                      <th>Availability</th>
                      <th>CGPA</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCandidates
                      .filter((c) => ['Selected','Proposed'].includes(c.status) || (currentUser?.role === 'MIS_MANAGER' && c.status === 'Mapped'))
                      .map((c) => {
                        const coe = coes.find((co) => Number(co.id) === Number(c.coeId));
                        const checked = selectedCandidateIds.includes(c.id);
                        const dateMisaligned = requirement && c.availabilityDate > requirement.onboardingDate;
                        return (
                          <tr 
                            key={c.id} 
                            style={{ 
                              cursor: 'pointer', 
                              background: checked ? 'var(--blue-light)' : 'transparent',
                              opacity: (c.status === 'Mapped' && currentUser?.role !== 'MIS_MANAGER') ? 0.5 : 1
                            }} 
                            onClick={() => {
                              if (c.status === 'Mapped' && currentUser?.role !== 'MIS_MANAGER') return;
                              setSelectedCandidateIds((prev) => checked ? prev.filter((id) => id !== c.id) : [...prev, c.id]);
                            }}
                          >
                            <td style={{ textAlign: 'center' }}>
                              <input type="checkbox" checked={checked} readOnly style={{ cursor: 'pointer' }} disabled={c.status === 'Mapped' && currentUser?.role !== 'MIS_MANAGER'} />
                            </td>
                            <td style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>
                              {c.name}
                              {c.status === 'Mapped' && <div style={{ fontSize: 10, color: 'var(--red)', fontWeight: 700 }}>CONFLICT</div>}
                            </td>
                            <td style={{ fontSize: 13, fontWeight: 500, color: 'var(--navy)' }}>{coe?.name?.split(' ')[0] || 'N/A'}</td>
                            <td style={{ fontSize: 13, color: dateMisaligned ? 'var(--red)' : 'var(--navy)', fontWeight: dateMisaligned ? 700 : 500 }}>
                              {c.availabilityDate}
                              {dateMisaligned && <i className="ti ti-alert-triangle" style={{ marginLeft: 4 }} title="After onboarding date" />}
                            </td>
                            <td style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>{c.cgpa}</td>
                            <td><span className={`badge ${c.status === 'Mapped' ? 'active' : 'draft'}`} style={{ fontSize: 11 }}>{c.status}</span></td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add any specific notes..."></textarea>
              </div>
            </div>
            <div className="modal-ft">
              <button className="btn btn-ghost" onClick={() => setNewOpen(false)}>Cancel</button>
              <LoadingButton loading={creating} onClick={handleSubmitMapping}>
                Create Draft Mapping
              </LoadingButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
