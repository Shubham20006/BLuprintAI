import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  useMapping, useRequirement, useMappingLineItems,
  useCandidates, useApprovals, useUpdateMapping,
  useCreateApproval, useMandates, useClients, useCOEs
} from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { formatDate, generateId } from '../../utils';
import type { MappingStatus } from '../../types';

export const MappingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useSessionStore();

  const { data: mapping } = useMapping(id || '');
  const { data: requirement } = useRequirement(mapping?.requirementId || '');
  const { data: mandates = [] } = useMandates();
  const { data: clients = [] } = useClients();
  const { data: coes = [] } = useCOEs();
  const { data: lineItems = [] } = useMappingLineItems(id);
  const { data: candidates = [] } = useCandidates();
  
  const { mutateAsync: updateMapping } = useUpdateMapping();
  const { mutateAsync: createApproval } = useCreateApproval();

  if (!mapping || !requirement) return <div style={{ padding: 20 }}>Loading...</div>;

  const mandate = mandates.find(m => m.id === requirement.mandateId);
  const client = clients.find(c => c.id === mandate?.clientId);

  const mappedCandidates = lineItems.map((li) => {
    const candidate = candidates.find((c) => c.id === li.candidateId);
    const coe = coes.find((c) => Number(c.id) === Number(candidate?.coeId));
    return {
      ...li,
      candidate,
      coe,
      matchScore: Math.floor(Math.random() * 15) + 80, // Mock score 80-95
      techScore: Math.floor(Math.random() * 15) + 80,
      academicScore: Math.floor(Math.random() * 20) + 75,
      coeScore: Math.floor(Math.random() * 15) + 80,
    };
  }).sort((a, b) => b.matchScore - a.matchScore);

  const canSubmit = currentUser && can.submitMapping(currentUser.role) && mapping.status === 'Draft';

  const handleAction = async (decision: 'Approved' | 'Rejected', nextStatus: MappingStatus) => {
    try {
      await createApproval({
        id: generateId(),
        mappingId: id || '',
        actorRole: currentUser!.role,
        actorId: currentUser!.id,
        decision,
        comment: '',
        timestamp: new Date().toISOString(),
      });
      await updateMapping({ id: id!, status: nextStatus, updatedAt: new Date().toISOString() });
      enqueueSnackbar(`Mapping submitted successfully`, { variant: 'success' });
      navigate('/dashboard');
    } catch {
      enqueueSnackbar('Error processing action', { variant: 'error' });
    }
  };

  const techShort = requirement.techStack.split(' ')[0] || '.NET / C# Stack';
  const confidence = 91;

  // Mock COE allocations for Mix & Match graph
  const coeAllocations = [
    { name: 'SRM', seats: 3, percentage: 60, color: 'var(--blue)' },
    { name: 'GLA', seats: 2, percentage: 40, color: 'var(--teal)' },
  ];

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <span className="breadcrumb">
            AI Mapping / <span>{requirement.requirementCode}</span>
          </span>
        </div>
        <div className="topbar-right">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/mappings')}>
            <i className="ti ti-arrow-left" aria-hidden="true" /> Back
          </button>
          {canSubmit && (
            <button className="btn btn-primary btn-sm" onClick={() => handleAction('Approved', 'Engineering Review')}>
              <i className="ti ti-send" aria-hidden="true" /> Submit to HOE
            </button>
          )}
        </div>
      </div>

      <div className="content">
        <div style={{ background: 'var(--purple-light)', border: '1px solid rgba(90,45,130,.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--purple)' }}>
            <i className="ti ti-sparkles" aria-hidden="true" style={{ marginRight: 4 }} />
            AI Mapping Engine — Claude 3.5 Sonnet via AWS Bedrock
          </div>
          <div style={{ fontSize: 12, color: 'var(--g500)', marginTop: 2 }}>
            Ranked {mappedCandidates.length || 7} candidates from 3 COEs for {requirement.openPositions} {techShort} positions in {requirement.location} · Confidence: {confidence}%
          </div>
        </div>
        <span className="badge" style={{ background: 'var(--purple-light)', color: 'var(--purple)', border: '1px solid rgba(90,45,130,.3)', fontSize: 12 }}>
          {confidence}% Confident
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
        {/* Left Column: Candidates */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--g500)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            AI Recommended Mapping
          </div>
          
          {mappedCandidates.map((c, idx) => {
            let badgeText = 'Good';
            if (c.matchScore >= 90) badgeText = 'Best Match';
            else if (c.matchScore >= 85) badgeText = 'Strong';

            return (
              <div className="ai-card" key={c.id || idx}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div className="ai-rank">{idx + 1}</div>
                  <div>
                    <div className="ai-name">{c.candidate?.name || 'Unknown'}</div>
                    <div className="ai-meta">{c.coe?.name || 'Unknown University'} · GPA 8.{Math.floor(Math.random() * 9)}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div className="ai-score">{c.matchScore}%</div>
                    <div className="ai-badge">{badgeText}</div>
                  </div>
                </div>
                <div style={{ marginBottom: 5 }}>
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${c.matchScore}%`, background: c.matchScore >= 90 ? 'var(--green)' : 'var(--blue)' }}></div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, fontSize: 11, color: 'var(--g500)' }}>
                  <span>Tech: {c.techScore}%</span>
                  <span>Academic: {c.academicScore}%</span>
                  <span>COE: {c.coeScore}%</span>
                </div>
              </div>
            );
          })}

          {mappedCandidates.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--g500)', border: '1px dashed var(--g300)', borderRadius: 8 }}>
              No candidates mapped yet.
            </div>
          )}
        </div>

        {/* Right Column: Details & Allocation */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--g500)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            Mandate Details
          </div>
          <div className="panel" style={{ marginBottom: 8 }}>
            <div className="panel-body" style={{ padding: 10 }}>
              <table style={{ width: '100%', fontSize: 13 }}>
                <tbody>
                  <tr><td style={{ color: 'var(--g500)', padding: '3px 0' }}>Requirement ID</td><td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'var(--navy)' }}>{requirement.requirementCode}</td></tr>
                  <tr><td style={{ color: 'var(--g500)', padding: '3px 0' }}>Tech stack</td><td style={{ fontWeight: 600 }}>{techShort}</td></tr>
                  <tr><td style={{ color: 'var(--g500)', padding: '3px 0' }}>Positions</td><td style={{ fontWeight: 600, color: 'var(--navy)' }}>{requirement.openPositions} open</td></tr>
                  <tr><td style={{ color: 'var(--g500)', padding: '3px 0' }}>Location</td><td>{requirement.location}</td></tr>
                  <tr><td style={{ color: 'var(--g500)', padding: '3px 0' }}>Onboarding</td><td>{formatDate(requirement.onboardingDate)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--g500)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>
            Mix &amp; Match COE Allocation
          </div>
          <div className="panel" style={{ marginBottom: 8 }}>
            <div className="panel-body" style={{ padding: 10 }}>
              {coeAllocations.map(alloc => (
                <div className="chart-bar-row" key={alloc.name}>
                  <span className="chart-bar-label">{alloc.name}</span>
                  <div className="chart-bar-track">
                    <div className="chart-bar-fill" style={{ width: `${alloc.percentage}%`, background: alloc.color }}>
                      {alloc.seats} seats
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 12, color: 'var(--g500)', marginTop: 6 }}>
                <i className="ti ti-info-circle" aria-hidden="true" /> AI recommends mix-and-match to maximise COE performance balance.
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--purple-light)', borderRadius: 6, padding: '8px 10px', border: '1px solid rgba(90,45,130,.15)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--purple)', marginBottom: 3 }}>
              <i className="ti ti-robot" aria-hidden="true" /> AI Reasoning
            </div>
            <div style={{ fontSize: 12, color: 'var(--g500)', lineHeight: 1.5 }}>
              {mappedCandidates[0]?.candidate?.name || 'The top candidate'} scores highest on {techShort} assessments ({mappedCandidates[0]?.techScore || 96}%) with strong proximity to {requirement.location}. Mix-and-match with {coeAllocations[1]?.name || 'partner COEs'} ensures COE diversity and maintains fallback capacity.
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};
