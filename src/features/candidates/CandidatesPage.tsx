import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar } from 'notistack';
import { useCandidates, useCOEs, useCreateCandidate, useUpdateCandidate } from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { generateId, exportToCSV } from '../../utils';
import type { Candidate } from '../../types';

const schema = z.object({
  name: z.string().min(2, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Invalid phone'),
  coeId: z.string().min(1, 'Required'),
  graduationYear: z.coerce.number().min(2020).max(2030),
  stream: z.string().min(2, 'Required'),
  skills: z.string().min(1, 'Required'),
  assessmentScore: z.coerce.number().min(0).max(100),
});
type FormValues = z.infer<typeof schema>;

const STATUS_OPTIONS = ['Selected','Proposed','Mapped','Discussed','LOI Sent','LOI Signed','CFP Started','Dropped'];

export const CandidatesPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useSessionStore();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Candidate | null>(null);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [coeFilter, setCoeFilter] = React.useState('');

  const { data: candidates = [], isLoading } = useCandidates();
  const { data: coes = [] } = useCOEs();
  const { mutateAsync: createCandidate, isPending: creating } = useCreateCandidate();
  const { mutateAsync: updateCandidate, isPending: updating } = useUpdateCandidate();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', coeId: '', graduationYear: 2025, stream: '', skills: '', assessmentScore: 75 },
  });

  const [importOpen, setImportOpen] = React.useState(false);
  const [csvData, setCsvData] = React.useState('');
  const [importing, setImporting] = React.useState(false);

  const handleCsvImport = async () => {
    if (!csvData.trim()) return;
    setImporting(true);
    try {
      const lines = csvData.trim().split('\n');
      let count = 0;
      for (const line of lines) {
        const [name, email, phone, coeId, year, stream, skills, score] = line.split(',').map(s => s?.trim());
        if (!name || !email) continue;
        
        await createCandidate({
          id: generateId(),
          name,
          email,
          phone: phone || '',
          coeId: coeId || coes[0]?.id || '',
          graduationYear: parseInt(year) || 2025,
          stream: stream || 'CS',
          skills: (skills || '').split(';').map(s => s.trim()),
          assessmentScore: parseInt(score) || 0,
          status: 'Selected',
          resumeLink: '',
          externalKey: `IMP-${generateId()}`,
          createdAt: new Date().toISOString(),
        });
        count++;
      }
      enqueueSnackbar(`Successfully imported ${count} candidates`, { variant: 'success' });
      setImportOpen(false);
      setCsvData('');
    } catch (err) {
      enqueueSnackbar('Error during import', { variant: 'error' });
    } finally {
      setImporting(false);
    }
  };

  const scopedCandidates = currentUser && can.isCOEScoped(currentUser.role) && currentUser.coeScopeIds.length
    ? candidates.filter((c) => currentUser.coeScopeIds.includes(c.coeId))
    : candidates;

  const filtered = scopedCandidates.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    const matchCoe = !coeFilter || c.coeId === coeFilter;
    return matchSearch && matchStatus && matchCoe;
  });

  const handleOpen = (candidate?: Candidate) => {
    if (candidate) {
      setEditing(candidate);
      reset({ ...candidate, skills: candidate.skills.join(', ') });
    } else {
      setEditing(null);
      reset({ name: '', email: '', phone: '', coeId: '', graduationYear: 2025, stream: '', skills: '', assessmentScore: 75 });
    }
    setOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      // Duplicate detection
      const isDuplicate = candidates.some(c => 
        (c.email.toLowerCase() === data.email.toLowerCase() || c.phone === data.phone) && 
        c.id !== editing?.id
      );

      if (isDuplicate) {
        enqueueSnackbar('Candidate with this email or phone already exists', { variant: 'error' });
        return;
      }

      const payload: Partial<Candidate> = {
        ...data,
        skills: data.skills.split(',').map((s) => s.trim()).filter(Boolean),
        status: editing?.status || 'Selected',
        resumeLink: editing?.resumeLink || '',
        externalKey: editing?.externalKey || `${data.coeId.toUpperCase()}-${generateId()}`,
        createdAt: editing?.createdAt || new Date().toISOString(),
      };
      if (editing) {
        await updateCandidate({ id: editing.id, ...payload });
        enqueueSnackbar('Candidate updated', { variant: 'success' });
      } else {
        await createCandidate({ id: generateId(), ...payload });
        enqueueSnackbar('Candidate added', { variant: 'success' });
      }
      setOpen(false);
    } catch {
      enqueueSnackbar('Error saving candidate', { variant: 'error' });
    }
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <span className="breadcrumb">Candidates / <span>{filtered.length} of {candidates.length}</span></span>
        </div>
        <div className="topbar-right">
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setImportOpen(true)}>
              <i className="ti ti-upload" aria-hidden="true" /> Import CSV
            </button>
            {currentUser && can.importCandidates(currentUser.role) && (
              <button className="btn btn-primary btn-sm" onClick={() => handleOpen()}>
                <i className="ti ti-plus" aria-hidden="true" /> Add Candidate
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="content">
        <div className="panel">
          <div className="panel-hd" style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <i className="ti ti-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--g400)' }} aria-hidden="true" />
              <input 
                className="form-input" 
                placeholder="Search by name or email..." 
                style={{ paddingLeft: 32 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="form-select" style={{ width: 140 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="form-select" style={{ width: 160 }} value={coeFilter} onChange={(e) => setCoeFilter(e.target.value)}>
              <option value="">All COEs</option>
              {coes.map(c => <option key={c.id} value={c.id}>{c.name.split(' ')[0]}</option>)}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={() => exportToCSV(filtered.map(c => ({...c, skills: c.skills.join(';')})), 'candidates')}>
              <i className="ti ti-download" aria-hidden="true" /> Export
            </button>
          </div>
          <div style={{ padding: 0 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>COE</th>
                  <th>Stream</th>
                  <th>Skills</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const coe = coes.find((co) => co.id === c.coeId);
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                            {c.name.split(' ').map(w => w[0]).join('').slice(0,2)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{c.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--g500)' }}>{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ fontSize: 13 }}>{coe?.name.split(' ')[0] || c.coeId}</span></td>
                      <td>{c.stream}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 200 }}>
                          {c.skills.slice(0, 2).map((s) => (
                            <span key={s} className="badge mapping" style={{ fontSize: 11 }}>{s}</span>
                          ))}
                          {c.skills.length > 2 && <span className="badge mapping" style={{ fontSize: 11 }}>+{c.skills.length - 2}</span>}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${c.assessmentScore >= 80 ? 'active' : c.assessmentScore >= 60 ? 'mapping' : 'draft'}`} style={{ fontWeight: 700 }}>
                          {c.assessmentScore}%
                        </span>
                      </td>
                      <td><span className={`badge ${c.status === 'Selected' ? 'active' : c.status === 'Dropped' ? 'draft' : 'mapping'}`}>{c.status}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleOpen(c)}>
                          <i className="ti ti-edit" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--g500)' }}>
                      No candidates found
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
              <span className="modal-title">{editing ? 'Edit Candidate' : 'Add Candidate'}</span>
              <button className="btn-close" onClick={() => setOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label">Full Name</label>
                    <Controller name="name" control={control} render={({ field }) => (
                      <input {...field} className={`form-input ${errors.name ? 'error' : ''}`} />
                    )} />
                    {errors.name && <span className="error-text">{errors.name.message}</span>}
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <Controller name="email" control={control} render={({ field }) => (
                      <input {...field} type="email" className={`form-input ${errors.email ? 'error' : ''}`} />
                    )} />
                    {errors.email && <span className="error-text">{errors.email.message}</span>}
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <Controller name="phone" control={control} render={({ field }) => (
                      <input {...field} className={`form-input ${errors.phone ? 'error' : ''}`} />
                    )} />
                    {errors.phone && <span className="error-text">{errors.phone.message}</span>}
                  </div>
                  <div>
                    <label className="form-label">COE</label>
                    <Controller name="coeId" control={control} render={({ field }) => (
                      <select {...field} className={`form-select ${errors.coeId ? 'error' : ''}`}>
                        <option value="">Select COE</option>
                        {coes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    )} />
                    {errors.coeId && <span className="error-text">{errors.coeId.message}</span>}
                  </div>
                  <div>
                    <label className="form-label">Graduation Year</label>
                    <Controller name="graduationYear" control={control} render={({ field }) => (
                      <input {...field} type="number" className="form-input" />
                    )} />
                  </div>
                  <div>
                    <label className="form-label">Stream</label>
                    <Controller name="stream" control={control} render={({ field }) => (
                      <input {...field} className={`form-input ${errors.stream ? 'error' : ''}`} />
                    )} />
                    {errors.stream && <span className="error-text">{errors.stream.message}</span>}
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Skills (comma separated)</label>
                    <Controller name="skills" control={control} render={({ field }) => (
                      <input {...field} className={`form-input ${errors.skills ? 'error' : ''}`} placeholder="e.g. Java, Spring, React" />
                    )} />
                    {errors.skills && <span className="error-text">{errors.skills.message}</span>}
                  </div>
                  <div>
                    <label className="form-label">Assessment Score (0-100)</label>
                    <Controller name="assessmentScore" control={control} render={({ field }) => (
                      <input {...field} type="number" className="form-input" />
                    )} />
                  </div>
                </div>
              </div>
              <div className="modal-ft">
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating || updating}>
                  {editing ? 'Update Candidate' : 'Add Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {importOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <div className="modal-hd">
              <span className="modal-title">Bulk Import Candidates</span>
              <button className="btn-close" onClick={() => setImportOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">CSV Data (Paste here)</label>
                <div style={{ fontSize: 12, color: 'var(--g500)', marginBottom: 8 }}>
                  Format: Name, Email, Phone, COE ID, Year, Stream, Skills, Score
                </div>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: 200, fontFamily: 'monospace', fontSize: 13 }} 
                  placeholder="John Doe, john@example.com, 9876543210, coe1, 2025, CS, Java;React, 85"
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-ft">
              <button type="button" className="btn btn-ghost" onClick={() => setImportOpen(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleCsvImport} disabled={importing}>
                {importing ? 'Importing...' : 'Import Candidates'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};


