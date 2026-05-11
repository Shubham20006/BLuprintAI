import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useClients, useCreateRequirement, useCreateMandate, useRequirements } from '../../api/hooks';
import { generateId, generateRequirementId, TECH_STACKS } from '../../utils';

const schema = z.object({
  clientId: z.string().min(1, 'Required'),
  mandateType: z.string().min(1, 'Required'),
  techStack: z.string().min(1, 'Required'),
  openPositions: z.coerce.number().min(1, 'Min 1'),
  engagementModel: z.string().min(1, 'Required'),
  mandateDate: z.string().min(1, 'Required'),
  onboardingDate: z.string().min(1, 'Required'),
  location: z.string().min(1, 'Required'),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export const RequirementsPage: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const { data: clients = [] } = useClients();
  const { data: requirements = [] } = useRequirements();
  const { mutateAsync: createMandate } = useCreateMandate();
  const { mutateAsync: createReq, isPending } = useCreateRequirement();

  const { handleSubmit, watch, reset, formState: { errors }, register } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { 
      clientId: '', 
      mandateType: 'NEW', 
      techStack: 'DotNetStack — .NET / C#', 
      engagementModel: 'FresherISA', 
      location: 'Hyderabad, Telangana', 
      onboardingDate: '2026-02-01', 
      mandateDate: '2025-12-10',
      openPositions: 5,
      notes: ''
    },
  });

  const watchedClient = watch('clientId');
  const watchedTech = watch('techStack');
  const watchedEngagement = watch('engagementModel');
  const watchedDate = watch('mandateDate');
  const watchedMandateType = watch('mandateType');

  const selectedClient = clients.find((c) => c.id === watchedClient);

  // Sequence is count of existing requirements + 101
  const nextSeq = requirements.length + 101;

  // Parse the tech stack string for the short code (e.g. "DotNetStack — .NET / C#" -> "DotNetStack")
  const techShort = watchedTech ? watchedTech.split(' ')[0] : 'DotNetStack';
  const monthDay = watchedDate ? new Date(watchedDate).toLocaleString('en-US', { month: 'short', day: '2-digit' }).replace(' ', '') : 'Dec10';

  const previewId = selectedClient && watchedTech && watchedEngagement && watchedDate
    ? generateRequirementId(
        selectedClient.shortCode,
        watchedMandateType || 'NEW',
        techShort,
        watchedEngagement,
        monthDay,
        nextSeq
      )
    : '—';

  const onSubmit = async (data: FormValues) => {
    try {
      const client = clients.find((c) => c.id === data.clientId);
      const reqTechShort = data.techStack.split(' ')[0];
      const reqMonthDay = new Date(data.mandateDate).toLocaleString('en-US', { month: 'short', day: '2-digit' }).replace(' ', '');
      
      const reqCode = client
        ? generateRequirementId(client.shortCode, data.mandateType, reqTechShort, data.engagementModel, reqMonthDay, nextSeq)
        : `REQ-${generateId()}`;

      // 1. Create a real Mandate first
      const mandateId = generateId();
      await createMandate({
        id: mandateId,
        mandateName: `Mandate for ${client?.name || 'Client'} - ${reqTechShort}`,
        clientId: data.clientId,
        mandateType: data.mandateType as any,
        startDate: data.mandateDate,
        onboardingDate: data.onboardingDate,
        locations: [data.location],
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: 'u1', // Default to MIS manager
      });

      // 2. Create the Requirement linked to this mandate
      await createReq({
        id: generateId(),
        mandateId: mandateId,
        requirementCode: reqCode,
        techStack: data.techStack,
        intakeType: data.engagementModel,
        expLevel: 'Fresher',
        location: data.location,
        onboardingDate: data.onboardingDate,
        openPositions: data.openPositions,
        filledPositions: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        targetCoeIds: [],
      });

      enqueueSnackbar('Mandate and Requirement created successfully', { variant: 'success' });
      navigate('/dashboard');
    } catch {
      enqueueSnackbar('Error creating mandate', { variant: 'error' });
    }
  };

  return (
    <>
      <div className="topbar">
        <div className="topbar-left"><span className="breadcrumb">Mandates / <span>Create New Mandate</span></span></div>
        <div className="topbar-right">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <i className="ti ti-arrow-left" aria-hidden="true" /> Back
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: "1rem",margin:'1rem', alignItems: 'start' }}>
        <div>
          <div className="panel">
            <div className="panel-hd"><span className="panel-title">Mandate Details</span></div>
            <div className="panel-body">
              <form id="req-form" onSubmit={handleSubmit(onSubmit)}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Client</label>
                    <select className="form-select" {...register('clientId')}>
                      <option value="">Select Client...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {errors.clientId && <div style={{ fontSize: 10, color: 'var(--red)', marginTop: 4 }}>{errors.clientId.message}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mandate type</label>
                    <select className="form-select" {...register('mandateType')}>
                      <option value="NEW">NEW</option>
                      <option value="RENEW">RENEW</option>
                      <option value="EXT">EXT</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Technology stack</label>
                  <select className="form-select" {...register('techStack')}>
                    <option value="DotNetStack — .NET / C#">DotNetStack — .NET / C#</option>
                    <option value="JavaStack — Java Full Stack">JavaStack — Java Full Stack</option>
                    <option value="AIMLDataEng — AI/ML & Data Engineering">AIMLDataEng — AI/ML & Data Engineering</option>
                    <option value="Python — Python Development">Python — Python Development</option>
                  </select>
                </div>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Open positions</label>
                    <input className="form-input" type="number" {...register('openPositions')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Engagement model</label>
                    <select className="form-select" {...register('engagementModel')}>
                      <option value="FresherISA">FresherISA</option>
                      <option value="FresherFixed">FresherFixed</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Mandate date</label>
                    <input className="form-input" type="date" {...register('mandateDate')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Onboarding date</label>
                    <input className="form-input" type="date" {...register('onboardingDate')} />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Job location</label>
                  <input className="form-input" {...register('location')} />
                </div>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Notes (optional)</label>
                  <textarea className="form-input" rows={2} placeholder="Any specific requirements..." {...register('notes')}></textarea>
                </div>
              </form>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => navigate(-1)}><i className="ti ti-x" aria-hidden="true" /> Cancel</button>
            <button type="submit" form="req-form" className="btn btn-primary" disabled={isPending}><i className="ti ti-check" aria-hidden="true" /> Create Mandate</button>
          </div>
        </div>
        
        <div>
          <div className="panel">
            <div className="panel-hd" style={{ background: 'var(--purple-light)' }}>
              <span className="panel-title" style={{ color: 'var(--purple)' }}>
                <i className="ti ti-sparkles" aria-hidden="true" style={{ marginRight: 5 }} />
                AI Requirement ID Generator
              </span>
              <span className="section-tag" style={{ background: 'var(--purple-light)', color: 'var(--purple)', border: '1px solid rgba(90,45,130,.2)' }}>
                Live Preview
              </span>
            </div>
            <div className="panel-body">
              <div style={{ fontSize: 11, color: 'var(--g500)', marginBottom: 10 }}>
                Generated automatically from your form inputs. The AI checks for duplicates and semantic conflicts.
              </div>
              <div className="rid-box">
                <div className="rid-label">Generated Requirement ID</div>
                <div className="rid-value">
                  {previewId.split('-').map((part, i, arr) => (
                    <React.Fragment key={i}>
                      <span className="rid-tag">{part}</span>
                      {i < arr.length - 1 && '-'}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 10, padding: 8, background: 'var(--green-light)', borderRadius: 6, border: '1px solid #6EE7B7', fontSize: 10, color: 'var(--green)', display: 'flex', gap: 6, alignItems: 'center' }}>
                <i className="ti ti-circle-check" aria-hidden="true" style={{ fontSize: 14 }} />
                <span>No duplicate mandate detected. ID is unique and valid.</span>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--g500)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
                  ID Tag Breakdown
                </div>
                <table style={{ width: '100%', fontSize: 10 }}>
                  <tbody>
                    <tr><td style={{ padding: '3px 0', color: 'var(--g500)' }}>Client code</td><td style={{ fontWeight: 600, color: 'var(--navy)', fontFamily: 'monospace' }}>{selectedClient?.shortCode || '—'}</td></tr>
                    <tr><td style={{ padding: '3px 0', color: 'var(--g500)' }}>Mandate type</td><td style={{ fontWeight: 600, color: 'var(--navy)', fontFamily: 'monospace' }}>{watchedMandateType}</td></tr>
                    <tr><td style={{ padding: '3px 0', color: 'var(--g500)' }}>Tech stack</td><td style={{ fontWeight: 600, color: 'var(--navy)', fontFamily: 'monospace' }}>{techShort}</td></tr>
                    <tr><td style={{ padding: '3px 0', color: 'var(--g500)' }}>Engagement</td><td style={{ fontWeight: 600, color: 'var(--navy)', fontFamily: 'monospace' }}>{watchedEngagement}</td></tr>
                    <tr><td style={{ padding: '3px 0', color: 'var(--g500)' }}>Date</td><td style={{ fontWeight: 600, color: 'var(--navy)', fontFamily: 'monospace' }}>{monthDay}</td></tr>
                    <tr><td style={{ padding: '3px 0', color: 'var(--g500)' }}>Sequence no.</td><td style={{ fontWeight: 600, color: 'var(--navy)', fontFamily: 'monospace' }}>{nextSeq}</td></tr>
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 10, padding: 8, background: 'var(--blue-light)', borderRadius: 6, fontSize: 10, color: 'var(--navy)' }}>
                <i className="ti ti-info-circle" aria-hidden="true" style={{ marginRight: 4 }} />
                Sequence number auto-increments. You can request regeneration if needed.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
