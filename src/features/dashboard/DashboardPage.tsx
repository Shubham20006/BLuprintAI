import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../store';
import { useRequirements, useCandidates, useCOEs, useLOIs } from '../../api/hooks';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useSessionStore();
  const navigate = useNavigate();
  
  const { data: requirements = [] } = useRequirements();
  const { data: candidates = [] } = useCandidates();
  const { data: coes = [] } = useCOEs();
  const { data: lois = [] } = useLOIs();

  const totalOpen = requirements.reduce((s, r) => s + r.openPositions, 0);
  const totalFilled = requirements.reduce((s, r) => s + r.filledPositions, 0);
  const totalSent = lois.length; // All LOIs issued (Sent + Signed)
  const totalSigned = lois.filter((l) => l.status === 'Signed').length;
  const totalCFP = candidates.filter((c) => c.status === 'CFP Started').length;

  const isAM = currentUser?.role === 'ACCOUNT_MANAGER';

  if (isAM) {
    return (
      <>
        <div className="topbar">
          <div className="topbar-left"><span className="breadcrumb">Dashboard / <span>Mandates Overview</span></span></div>
          <div className="topbar-right">
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/requirements')}>
              <i className="ti ti-plus" aria-hidden="true" /> New Mandate
            </button>
          </div>
        </div>
        
        <div className="content">
          <div className="kpi-row">
            <div className="kpi"><div className="kpi-label">Total Mandates</div><div className="kpi-val">{requirements.length}</div><div className="kpi-sub">Active requirements</div></div>
            <div className="kpi green"><div className="kpi-label">Fulfilled</div><div className="kpi-val">{totalSigned}</div><div className="kpi-sub">LOIs Signed</div></div>
            <div className="kpi orange"><div className="kpi-label">In Mapping</div><div className="kpi-val">{totalFilled}</div><div className="kpi-sub">Awaiting HOE Review</div></div>
            <div className="kpi purple"><div className="kpi-label">Open Positions</div><div className="kpi-val">{totalOpen}</div><div className="kpi-sub">Across {requirements.length} clients</div></div>
          </div>
          
          <div className="panel">
            <div className="panel-hd">
              <span className="panel-title"><i className="ti ti-file-description" aria-hidden="true" style={{marginRight: 5, color: 'var(--blue)'}} />Active Mandates</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <select className="form-select" style={{ width: 120, padding: '4px 8px', fontSize: 13 }}>
                  <option>All Clients</option>
                </select>
                <button className="btn btn-ghost btn-sm"><i className="ti ti-download" aria-hidden="true" /> Export</button>
              </div>
            </div>
            <div style={{ padding: 0 }}>
              <table className="tbl">
                <thead><tr><th>Requirement ID</th><th>Tech Stack</th><th>Positions</th><th>Mandate Date</th><th>Location</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {requirements.slice(0, 5).map(req => (
                    <tr key={req.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--navy)', fontWeight: 600 }}>{req.requirementCode}</td>
                      <td>{req.techStack}</td>
                      <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{req.openPositions}</td>
                      <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td>{req.location || 'Remote'}</td>
                      <td><span className={`badge ${req.status === 'active' ? 'active' : 'draft'}`}>{req.status}</span></td>
<td>
  <div
    style={{
      display: 'flex',
      gap: 6,
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    {/* VIEW */}
    <button
      className="btn btn-ghost btn-sm"
      onClick={() =>
        navigate('/requirements', {
          state: {
            requirement: req,
            mode: 'view',
          },
        })
      }
    >
      <i
        className="ti ti-eye"
        aria-hidden="true"
      />
    </button>

    {/* EDIT */}
    <button
      className="btn btn-ghost btn-sm"
      onClick={() =>
        navigate('/requirements', {
          state: {
            requirement: req,
            mode: 'edit',
          },
        })
      }
    >
      <i
        className="ti ti-pencil"
        aria-hidden="true"
      />
    </button>
  </div>
</td>                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Default / MIS Dashboard
  return (
    <>
      <div className="topbar">
        <div className="topbar-left"><span className="breadcrumb">Analytics / <span>MIS Dashboard</span></span></div>
        <div className="topbar-right">
          <select className="form-select" style={{ width: 100, padding: '4px 8px', fontSize: 13 }}><option>This Month</option></select>
          <button className="btn btn-ghost btn-sm"><i className="ti ti-download" aria-hidden="true" /> Export</button>
        </div>
      </div>

      <div className="content">
        <div className="kpi-row">
          <div className="kpi"><div className="kpi-label">Total Mandates</div><div className="kpi-val">{requirements.length}</div><div className="kpi-sub">Total reqs loaded</div></div>
          <div className="kpi green"><div className="kpi-label">Fulfilment rate</div><div className="kpi-val">{totalOpen ? Math.round((totalSigned/totalOpen)*100) : 0}%</div><div className="kpi-sub">Target met</div></div>
          <div className="kpi orange"><div className="kpi-label">LOI conversion</div><div className="kpi-val">{totalSent ? Math.round((totalSigned/totalSent)*100) : 0}%</div><div className="kpi-sub">LOI signed / issued</div></div>
          <div className="kpi purple"><div className="kpi-label">CFP Started</div><div className="kpi-val">{totalCFP}</div><div className="kpi-sub">Candidates onboarding</div></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div className="panel">
              <div className="panel-hd"><span className="panel-title">Mandate Pipeline Funnel</span></div>
              <div className="panel-body" style={{ padding: 10 }}>
                <div className="funnel-step"><div className="funnel-bar" style={{ background: 'var(--navy)', width: '100%' }}><span className="funnel-lbl">Total Open Positions</span><span className="funnel-val">{totalOpen}</span></div></div>
                <div className="funnel-step"><div className="funnel-bar" style={{ background: 'var(--blue)', width: '85%' }}><span className="funnel-lbl">Mapped</span><span className="funnel-val">{totalFilled}</span></div></div>
                <div className="funnel-step"><div className="funnel-bar" style={{ background: 'var(--teal)', width: '70%' }}><span className="funnel-lbl">LOI Issued</span><span className="funnel-val">{totalSent}</span></div></div>
                <div className="funnel-step"><div className="funnel-bar" style={{ background: 'var(--green)', width: '70%' }}><span className="funnel-lbl">LOI Signed</span><span className="funnel-val">{totalSigned}</span></div></div>
                <div className="funnel-step"><div className="funnel-bar" style={{ background: 'var(--blue)', width: '55%' }}><span className="funnel-lbl">CFP Started</span><span className="funnel-val">{totalCFP}</span></div></div>
              </div>
            </div>
            <div className="panel" style={{ marginTop: 10 }}>
              <div className="panel-hd">
                <span className="panel-title" style={{ color: 'var(--purple)' }}><i className="ti ti-robot" aria-hidden="true" style={{ marginRight: 4 }} />AI Weekly Summary</span>
                <span style={{ fontSize: 12, color: 'var(--g500)' }}>Mon, 25 Nov 2025</span>
              </div>
              <div className="panel-body" style={{ padding: 10, fontSize: 13, color: 'var(--g500)', lineHeight: 1.6 }}>
                <div style={{ marginBottom: 6, color: 'var(--g900)', fontWeight: 500 }}>3 recommendations this week:</div>
                <div style={{ padding: '5px 8px', background: 'var(--orange-light)', borderRadius: 5, marginBottom: 5, color: 'var(--orange)', fontSize: 12 }}><i className="ti ti-alert-triangle" aria-hidden="true" style={{ marginRight: 4 }} />Nov21-862 (AIML) at SLA risk — HOE review pending</div>
                <div style={{ padding: '5px 8px', background: 'var(--green-light)', borderRadius: 5, marginBottom: 5, color: 'var(--green)', fontSize: 12 }}><i className="ti ti-trending-up" aria-hidden="true" style={{ marginRight: 4 }} />SRM COE placement rate improved 12% — prioritise for next mandate</div>
                <div style={{ padding: '5px 8px', background: 'var(--blue-light)', borderRadius: 5, color: 'var(--navy)', fontSize: 12 }}><i className="ti ti-info-circle" aria-hidden="true" style={{ marginRight: 4 }} />5 LOIs pending signature &gt; 5 days — coordinate with COE team</div>
              </div>
            </div>
          </div>
          <div>
            <div className="panel">
              <div className="panel-hd"><span className="panel-title">COE Performance Score</span></div>
              <div className="panel-body" style={{ padding: 10 }}>
                {coes.slice(0, 5).map((coe, idx) => (
                  <div className="chart-bar-row" key={coe.id}>
                    <span className="chart-bar-label" style={{ width: 64 }}>{coe.name.split(' ')[0]}</span>
                    <div className="chart-bar-track">
                      <div className="chart-bar-fill" style={{ width: `${90 - (idx * 5)}%`, background: idx === 0 ? 'var(--green)' : idx < 3 ? 'var(--blue)' : 'var(--orange)' }}>
                        {90 - (idx * 5)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel" style={{ marginTop: 10 }}>
              <div className="panel-hd"><span className="panel-title">Tech Domain Distribution</span></div>
              <div className="panel-body" style={{ padding: 10 }}>
                <table style={{ width: '100%', fontSize: 13 }}>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--g200)' }}><td style={{ padding: '5px 0', color: 'var(--g500)' }}>Java Full Stack</td><td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--navy)' }}>14 mandates</td><td style={{ textAlign: 'right' }}><span className="badge active">30%</span></td></tr>
                    <tr style={{ borderBottom: '1px solid var(--g200)' }}><td style={{ padding: '5px 0', color: 'var(--g500)' }}>.NET / C#</td><td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--navy)' }}>11 mandates</td><td style={{ textAlign: 'right' }}><span className="badge mapping">23%</span></td></tr>
                    <tr style={{ borderBottom: '1px solid var(--g200)' }}><td style={{ padding: '5px 0', color: 'var(--g500)' }}>AI/ML &amp; Data Eng</td><td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--navy)' }}>9 mandates</td><td style={{ textAlign: 'right' }}><span className="badge mapped">19%</span></td></tr>
                    <tr><td style={{ padding: '5px 0', color: 'var(--g500)' }}>Python Dev</td><td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--navy)' }}>7 mandates</td><td style={{ textAlign: 'right' }}><span className="badge loi">15%</span></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
