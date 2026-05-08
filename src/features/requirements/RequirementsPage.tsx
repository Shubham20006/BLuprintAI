import React from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Grid, Typography, Chip, IconButton,
  Table, TableBody, TableCell, TableHead, TableRow, InputAdornment,
  Autocomplete,
} from '@mui/material';
import { Add, Search, Edit, Visibility } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useRequirements, useMandates, useClients, useCOEs, useCreateRequirement } from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { StatusChip, CapacityBar, PageHeader, SectionCard } from '../../components/shared';
import { formatDate, generateId, generateRequirementId, TECH_STACKS, INTAKE_TYPES, EXP_LEVELS } from '../../utils';

const schema = z.object({
  mandateId: z.string().min(1, 'Required'),
  techStack: z.string().min(1, 'Required'),
  intakeType: z.string().min(1, 'Required'),
  expLevel: z.string().min(1, 'Required'),
  location: z.string().min(1, 'Required'),
  onboardingDate: z.string().min(1, 'Required'),
  openPositions: z.coerce.number().min(1, 'Min 1'),
  targetCoeIds: z.array(z.string()).optional(),
});
type FormValues = z.infer<typeof schema>;

export const RequirementsPage: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useSessionStore();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const { data: requirements = [] } = useRequirements();
  const { data: mandates = [] } = useMandates();
  const { data: clients = [] } = useClients();
  const { data: coes = [] } = useCOEs();
  const { mutateAsync: createReq, isPending } = useCreateRequirement();

  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { mandateId: '', techStack: '', intakeType: 'Fresher ISA', expLevel: 'Fresher', location: '', onboardingDate: '', openPositions: 10, targetCoeIds: [] },
  });

  const watchedMandate = watch('mandateId');
  const watchedTech = watch('techStack');
  const watchedIntake = watch('intakeType');
  const watchedDate = watch('onboardingDate');

  const selectedMandate = mandates.find((m) => m.id === watchedMandate);
  const selectedClient = clients.find((c) => c.id === selectedMandate?.clientId);

  const previewId = selectedClient && watchedTech && watchedIntake && watchedDate
    ? generateRequirementId(
        selectedClient.shortCode,
        selectedMandate?.mandateType || 'NEW',
        watchedTech,
        watchedIntake,
        watchedDate,
        Math.floor(Math.random() * 900 + 100)
      )
    : '—';

  const onSubmit = async (data: FormValues) => {
    try {
      const client = clients.find((c) => c.id === selectedMandate?.clientId);
      const reqCode = client && selectedMandate
        ? generateRequirementId(client.shortCode, selectedMandate.mandateType, data.techStack, data.intakeType, data.onboardingDate, Math.floor(Math.random() * 900 + 100))
        : `REQ-${generateId()}`;
      await createReq({
        id: generateId(),
        requirementCode: reqCode,
        filledPositions: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        ...data,
        targetCoeIds: data.targetCoeIds || [],
      });
      enqueueSnackbar('Requirement created', { variant: 'success' });
      setOpen(false);
      reset();
    } catch {
      enqueueSnackbar('Error creating requirement', { variant: 'error' });
    }
  };

  const filtered = requirements.filter((r) =>
    r.requirementCode.toLowerCase().includes(search.toLowerCase()) ||
    r.techStack.toLowerCase().includes(search.toLowerCase())
  );

  const canCreate = currentUser && can.createRequirement(currentUser.role);

  return (
    <Box>
      <PageHeader
        title="Requirements"
        subtitle={`${requirements.length} total requirements`}
        action={canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => { reset(); setOpen(true); }}>
            New Requirement
          </Button>
        )}
      />

      <SectionCard>
        <TextField
          placeholder="Search by code or tech stack…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          sx={{ mb: 2, width: '100%', maxWidth: 400 }}
        />

        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Requirement ID</TableCell>
                <TableCell>Tech Stack</TableCell>
                <TableCell>Intake Type</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Onboarding</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Typography variant="caption" fontWeight={700} sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {r.requirementCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={r.techStack} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell><Typography variant="body2">{r.intakeType}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{r.location}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{formatDate(r.onboardingDate)}</Typography></TableCell>
                  <TableCell sx={{ minWidth: 160 }}>
                    <CapacityBar filled={r.filledPositions} open={r.openPositions} />
                  </TableCell>
                  <TableCell>
                    <StatusChip status={r.status} type="mandate" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => navigate(`/requirements/${r.id}`)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No requirements found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </SectionCard>

      {/* Create Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Requirement</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2} pt={1}>
              <Grid item xs={12}>
                <Controller name="mandateId" control={control} render={({ field }) => (
                  <TextField {...field} label="Mandate" select fullWidth error={!!errors.mandateId} helperText={errors.mandateId?.message}>
                    {mandates.map((m) => <MenuItem key={m.id} value={m.id}>{m.mandateName}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  <Typography variant="caption" color="text.secondary">Preview: </Typography>
                  <Typography variant="caption" fontWeight={700}>{previewId}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="techStack" control={control} render={({ field }) => (
                  <TextField {...field} label="Tech Stack" select fullWidth error={!!errors.techStack} helperText={errors.techStack?.message}>
                    {TECH_STACKS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="intakeType" control={control} render={({ field }) => (
                  <TextField {...field} label="Intake Type" select fullWidth>
                    {INTAKE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="expLevel" control={control} render={({ field }) => (
                  <TextField {...field} label="Experience Level" select fullWidth>
                    {EXP_LEVELS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="openPositions" control={control} render={({ field }) => (
                  <TextField {...field} label="Open Positions" type="number" fullWidth error={!!errors.openPositions} helperText={errors.openPositions?.message} />
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="location" control={control} render={({ field }) => (
                  <TextField {...field} label="Location" fullWidth error={!!errors.location} helperText={errors.location?.message} />
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="onboardingDate" control={control} render={({ field }) => (
                  <TextField {...field} label="Onboarding Date" type="date" fullWidth InputLabelProps={{ shrink: true }} error={!!errors.onboardingDate} helperText={errors.onboardingDate?.message} />
                )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="targetCoeIds" control={control} render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={coes}
                    getOptionLabel={(o) => o.name}
                    value={coes.filter((c) => (field.value || []).includes(c.id))}
                    onChange={(_, val) => field.onChange(val.map((v) => v.id))}
                    renderInput={(params) => <TextField {...params} label="Target COEs (optional)" />}
                    renderTags={(val, getTagProps) =>
                      val.map((option, i) => (
                        <Chip label={option.name.split(' ')[0]} {...getTagProps({ index: i })} size="small" key={option.id} />
                      ))
                    }
                  />
                )} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isPending}>Create Requirement</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
