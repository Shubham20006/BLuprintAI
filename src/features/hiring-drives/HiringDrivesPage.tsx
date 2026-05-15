import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar } from 'notistack';
import { useHiringDrives, useCOEs, useCreateHiringDrive } from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { generateId } from '../../utils';
import { PageLoader, LoadingButton } from '../../components/shared';

const schema = z.object({
  coeId: z.string().min(1, 'Required'),
  driveName: z.string().min(3, 'Required'),
  date: z.string().min(1, 'Required'),
  venue: z.string().min(3, 'Required'),
  techCovered: z.string().min(1, 'Required'),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export const HiringDrivesPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useSessionStore();
  const [open, setOpen] = React.useState(false);

  const { data: drives = [], isLoading } = useHiringDrives();
  const { data: coes = [] } = useCOEs();
  const { mutateAsync: createDrive, isPending } = useCreateHiringDrive();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { coeId: '', driveName: '', date: '', venue: '', techCovered: '', notes: '' },
  });

  const scopedDrives = currentUser && can.isCOEScoped(currentUser.role) && Array.isArray(currentUser.coeScopeIds) && currentUser.coeScopeIds.length
    ? drives.filter((d) => currentUser.coeScopeIds?.some(id => String(id) === String(d.coeId)))
    : drives;

  const onSubmit = async (data: FormValues) => {
    try {
      await createDrive({
        id: generateId(),
        ...data,
        techCovered: data.techCovered.split(',').map((t) => t.trim()).filter(Boolean),
        coordinatorId: currentUser?.id || '',
        status: 'planned',
        createdAt: new Date().toISOString(),
      });
      enqueueSnackbar('Hiring drive created', { variant: 'success' });
      setOpen(false);
      reset();
    } catch {
      enqueueSnackbar('Error creating drive', { variant: 'error' });
    }
  };

  const canCreate = currentUser && can.createHiringDrive(currentUser.role);

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <span className="breadcrumb">Hiring Drives / <span>{scopedDrives.length} drives</span></span>
        </div>
        <div className="topbar-right">
          {canCreate && (
            <button className="btn btn-primary btn-sm" onClick={() => { reset(); setOpen(true); }}>
              <i className="ti ti-plus" aria-hidden="true" /> New Drive
            </button>
          )}
        </div>
      </div>

      <div className="content">
        <div className="panel">
          <div className="panel-hd">
            <span className="panel-title">Active Hiring Drives</span>
            <div style={{ display: 'flex', gap: 8 }}>
               <button className="btn btn-ghost btn-sm"><i className="ti ti-download" aria-hidden="true" /> Export</button>
            </div>
          </div>
          <div style={{ padding: 0 }}>
            {isLoading ? (
              <PageLoader message="Loading hiring drives..." />
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Drive Name</th>
                    <th>COE</th>
                    <th>Date</th>
                    <th>Venue</th>
                    <th>Tech Covered</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scopedDrives.map((d) => {
                    const coe = coes.find((c) => String(c.id) === String(d.coeId));
                    return (
                      <tr key={d.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{d.driveName}</div>
                        </td>
                        <td>{coe?.name?.split(' ').slice(0, 2).join(' ') || 'N/A'}</td>
                        <td>{new Date(d.date).toLocaleDateString()}</td>
                        <td style={{ color: 'var(--g500)', fontSize: 13 }}>{d.venue}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {(d.techCovered || []).map((t) => (
                              <span key={t} className="badge loi" style={{ fontSize: 12, padding: '2px 6px' }}>{t}</span>
                            ))}
                          </div>
                        </td>
                        <td><span className={`badge ${d.status === 'planned' ? 'active' : 'draft'}`}>{d.status}</span></td>
                      </tr>
                    );
                  })}
                  {!isLoading && scopedDrives.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--g500)' }}>
                        No drives found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-hd">
              <span className="modal-title">Create Hiring Drive</span>
              <button className="btn-close" onClick={() => setOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                  <div>
                    <label className="form-label">Drive Name</label>
                    <Controller name="driveName" control={control} render={({ field }) => (
                      <input {...field} className={`form-input ${errors.driveName ? 'error' : ''}`} placeholder="e.g. Pune Tech Drive 2025" />
                    )} />
                    {errors.driveName && <span className="error-text">{errors.driveName.message}</span>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                      <label className="form-label">Drive Date</label>
                      <Controller name="date" control={control} render={({ field }) => (
                        <input {...field} type="date" className={`form-input ${errors.date ? 'error' : ''}`} />
                      )} />
                      {errors.date && <span className="error-text">{errors.date.message}</span>}
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Venue</label>
                    <Controller name="venue" control={control} render={({ field }) => (
                      <input {...field} className={`form-input ${errors.venue ? 'error' : ''}`} placeholder="e.g. Pune Lab, Block A" />
                    )} />
                    {errors.venue && <span className="error-text">{errors.venue.message}</span>}
                  </div>

                  <div>
                    <label className="form-label">Tech Covered (comma separated)</label>
                    <Controller name="techCovered" control={control} render={({ field }) => (
                      <input {...field} className={`form-input ${errors.techCovered ? 'error' : ''}`} placeholder="e.g. Java, Python, React" />
                    )} />
                    {errors.techCovered && <span className="error-text">{errors.techCovered.message}</span>}
                  </div>

                  <div>
                    <label className="form-label">Notes</label>
                    <Controller name="notes" control={control} render={({ field }) => (
                      <textarea {...field} className="form-input" style={{ minHeight: 80 }} placeholder="Any special instructions..." />
                    )} />
                  </div>
                </div>
              </div>
              <div className="modal-ft">
                <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
                <LoadingButton type="submit" loading={isPending}>
                  Create Drive
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
