import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useMandates, useClients, useCreateMandate, useUpdateMandate } from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { formatDate, generateId } from '../../utils';
import type { Mandate } from '../../types';

const schema = z.object({
  mandateName: z.string().min(3, 'Required'),
  clientId: z.string().min(1, 'Select a client'),
  mandateType: z.string().min(1, 'Required'),
  contractRef: z.string().optional(),
  startDate: z.string().min(1, 'Required'),
  onboardingDate: z.string().min(1, 'Required'),
  locations: z.string().min(1, 'Required'),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export const MandatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useSessionStore();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Mandate | null>(null);
  const [search, setSearch] = React.useState('');

  const { data: mandates = [], isLoading } = useMandates();
  const { data: clients = [] } = useClients();
  const { mutateAsync: createMandate, isPending: creating } = useCreateMandate();
  const { mutateAsync: updateMandate, isPending: updating } = useUpdateMandate();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { mandateName: '', clientId: '', mandateType: 'NEW', contractRef: '', startDate: '', onboardingDate: '', locations: '', notes: '' },
  });

  const handleOpen = (mandate?: Mandate) => {
    if (mandate) {
      setEditing(mandate);
      reset({
        mandateName: mandate.mandateName,
        clientId: mandate.clientId,
        mandateType: mandate.mandateType,
        contractRef: mandate.contractRef,
        startDate: mandate.startDate,
        onboardingDate: mandate.onboardingDate,
        locations: mandate.locations.join(', '),
        notes: mandate.notes,
      });
    } else {
      setEditing(null);
      reset({ mandateName: '', clientId: '', mandateType: 'NEW', contractRef: '', startDate: '', onboardingDate: '', locations: '', notes: '' });
    }
    setOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        ...data,
        locations: data.locations.split(',').map((l) => l.trim()).filter(Boolean),
        status: editing?.status || 'draft' as const,
        createdAt: editing?.createdAt || new Date().toISOString(),
        createdBy: editing?.createdBy || currentUser?.id || '',
      };
      if (editing) {
        await updateMandate({ id: editing.id, ...payload });
        enqueueSnackbar('Mandate updated', { variant: 'success' });
      } else {
        await createMandate({ id: generateId(), ...payload });
        enqueueSnackbar('Mandate created', { variant: 'success' });
      }
      setOpen(false);
    } catch {
      enqueueSnackbar('Error saving mandate', { variant: 'error' });
    }
  };

  const filtered = mandates.filter((m) =>
    m.mandateName.toLowerCase().includes(search.toLowerCase()) ||
    clients.find((c) => c.id === m.clientId)?.name.toLowerCase().includes(search.toLowerCase())
  );

  const canCreate = currentUser && can.createMandate(currentUser.role);

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <span className="breadcrumb">Hiring Management / <span>Mandates</span></span>
        </div>
        <div className="topbar-right">
          {canCreate && (
            <button className="btn btn-primary" onClick={() => handleOpen()}>
              <i className="ti ti-plus" /> New Mandate
            </button>
          )}
        </div>
      </div>

      <div className="content">
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-hd" style={{ background: 'var(--g50)', borderBottom: '1px solid var(--g200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 12 }}>
              <i className="ti ti-search" style={{ color: 'var(--g400)' }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search mandates by name or client..." 
                style={{ border: 'none', background: 'transparent', padding: 0 }}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-hd">
            <span className="panel-title">{mandates.length} Total Mandates</span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Mandate Name</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Locations</th>
                  <th>Onboarding</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const client = clients.find((c) => c.id === m.clientId);
                  return (
                    <tr key={m.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{m.mandateName}</div>
                        <div style={{ fontSize: 11, color: 'var(--g500)' }}>{m.contractRef}</div>
                      </td>
                      <td>{client?.name || m.clientId}</td>
                      <td><span className="badge draft">{m.mandateType}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {m.locations.map((l) => (
                            <span key={l} className="badge draft" style={{ fontSize: 10 }}>{l}</span>
                          ))}
                        </div>
                      </td>
                      <td>{formatDate(m.onboardingDate)}</td>
                      <td><span className={`badge ${m.status.toLowerCase()}`}>{m.status}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/mandates/${m.id}`)}>
                            <i className="ti ti-eye" />
                          </button>
                          {canCreate && (
                            <button className="btn btn-ghost btn-sm" onClick={() => handleOpen(m)}>
                              <i className="ti ti-edit" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--g500)' }}>
                      No mandates found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {open && (
        <div className="modal visible" style={{ zIndex: 1300 }}>
          <div className="modal-box" style={{ maxWidth: 550 }}>
            <div className="modal-hd">
              <span className="modal-title">{editing ? 'Edit Mandate' : 'Create New Mandate'}</span>
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="modal-bd">
                <div className="form-group">
                  <label className="form-label">Mandate Name</label>
                  <input {...register('mandateName')} className={`form-input ${errors.mandateName ? 'error' : ''}`} />
                  {errors.mandateName && <span className="error-text">{errors.mandateName.message}</span>}
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Client</label>
                    <select {...register('clientId')} className={`form-input ${errors.clientId ? 'error' : ''}`}>
                      <option value="">Select client...</option>
                      {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select {...register('mandateType')} className="form-input">
                      <option value="NEW">NEW</option>
                      <option value="EXPANSION">EXPANSION</option>
                      <option value="REPLACEMENT">REPLACEMENT</option>
                    </select>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Contract Ref</label>
                    <input {...register('contractRef')} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Locations (comma separated)</label>
                    <input {...register('locations')} className="form-input" />
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input type="date" {...register('startDate')} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Onboarding Date</label>
                    <input type="date" {...register('onboardingDate')} className="form-input" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea {...register('notes')} className="form-input" rows={3} />
                </div>
              </div>
              <div className="modal-ft">
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={creating || updating}>
                  {editing ? 'Update' : 'Create'} Mandate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
