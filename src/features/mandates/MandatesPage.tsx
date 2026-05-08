import React from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Grid, Typography, Chip, IconButton,
  Table, TableBody, TableCell, TableHead, TableRow, alpha,
  useTheme, InputAdornment,
} from '@mui/material';
import { Add, Search, Edit, Visibility, FilterList } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useMandates, useClients, useCreateMandate, useUpdateMandate } from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { StatusChip, PageHeader, SectionCard } from '../../components/shared';
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
  const theme = useTheme();
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

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
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
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.id || '',
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
    <Box>
      <PageHeader
        title="Mandates"
        subtitle={`${mandates.length} total mandates`}
        action={canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
            New Mandate
          </Button>
        )}
      />

      <SectionCard>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            placeholder="Search mandates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            sx={{ flex: 1 }}
          />
        </Box>

        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Mandate Name</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Locations</TableCell>
                <TableCell>Onboarding</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((m) => {
                const client = clients.find((c) => c.id === m.clientId);
                return (
                  <TableRow key={m.id} hover sx={{ cursor: 'pointer' }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{m.mandateName}</Typography>
                      <Typography variant="caption" color="text.secondary">{m.contractRef}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{client?.name || m.clientId}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={m.mandateType} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {m.locations.map((l) => (
                          <Chip key={l} label={l} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatDate(m.onboardingDate)}</Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={m.status} type="mandate" />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => navigate(`/mandates/${m.id}`)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                      {canCreate && (
                        <IconButton size="small" onClick={() => handleOpen(m)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No mandates found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </SectionCard>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Mandate' : 'Create New Mandate'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2} pt={1}>
              <Grid item xs={12}>
                <Controller name="mandateName" control={control} render={({ field }) => (
                  <TextField {...field} label="Mandate Name" fullWidth error={!!errors.mandateName} helperText={errors.mandateName?.message} />
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="clientId" control={control} render={({ field }) => (
                  <TextField {...field} label="Client" select fullWidth error={!!errors.clientId} helperText={errors.clientId?.message}>
                    {clients.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="mandateType" control={control} render={({ field }) => (
                  <TextField {...field} label="Mandate Type" select fullWidth>
                    {['NEW','EXPANSION','REPLACEMENT'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="contractRef" control={control} render={({ field }) => (
                  <TextField {...field} label="Contract Ref" fullWidth />
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="locations" control={control} render={({ field }) => (
                  <TextField {...field} label="Locations (comma separated)" fullWidth error={!!errors.locations} helperText={errors.locations?.message} />
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="startDate" control={control} render={({ field }) => (
                  <TextField {...field} label="Start Date" type="date" fullWidth InputLabelProps={{ shrink: true }} error={!!errors.startDate} helperText={errors.startDate?.message} />
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="onboardingDate" control={control} render={({ field }) => (
                  <TextField {...field} label="Onboarding Date" type="date" fullWidth InputLabelProps={{ shrink: true }} error={!!errors.onboardingDate} helperText={errors.onboardingDate?.message} />
                )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="notes" control={control} render={({ field }) => (
                  <TextField {...field} label="Notes" fullWidth multiline rows={3} />
                )} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={creating || updating}>
              {editing ? 'Update' : 'Create'} Mandate
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
