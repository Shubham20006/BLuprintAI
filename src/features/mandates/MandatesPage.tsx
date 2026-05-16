import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  Box,
  Typography,
  Button,
  Card,
  Grid,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  LinearProgress,
  FormControl,
  InputLabel,
  FormHelperText
} from '@mui/material';
import { useMandates, useClients, useCreateMandate, useUpdateMandate, useRequirements } from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { formatDate, generateId } from '../../utils';
import { PageLoader, LoadingButton } from '../../components/shared';
import type { Mandate } from '../../types';

const schema = z.object({
  companyName: z.string().min(3, 'Required'),
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
  const { data: requirements = [] } = useRequirements();
  const { data: clients = [] } = useClients();
  const { mutateAsync: createMandate, isPending: creating } = useCreateMandate();
  const { mutateAsync: updateMandate, isPending: updating } = useUpdateMandate();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { companyName: '', clientId: '', mandateType: 'NEW', contractRef: '', startDate: '', onboardingDate: '', locations: '', notes: '' },
  });

  const handleOpen = (mandate?: Mandate) => {
    if (mandate) {
      setEditing(mandate);
      reset({
        companyName: mandate.companyName,
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
      reset({ companyName: '', clientId: '', mandateType: 'NEW', contractRef: '', startDate: '', onboardingDate: '', locations: '', notes: '' });
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
    m.companyName.toLowerCase().includes(search.toLowerCase()) ||
    clients.find((c) => c.id === m.clientId)?.name.toLowerCase().includes(search.toLowerCase())
  );

  const canCreate = currentUser && can.createMandate(currentUser.role);

  return (
    <>
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #E5EBF0', px: 2, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography sx={{ fontSize: 15, color: '#6B7C93' }}>
            Hiring Management / <Box component="span" sx={{ color: '#111827', fontWeight: 500 }}>Mandates</Box>
          </Typography>
        </Box>
        <Box>
          {canCreate && (
            <Button variant="contained" color="primary" onClick={() => navigate('/requirements')}>
              <i className="ti ti-plus" style={{ marginRight: 6 }} /> New Mandate
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ p: 3 }}>
        <Card sx={{ mb: 3, borderRadius: 2 }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              size="small"
              placeholder="Search mandates by name or client..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ width: 400 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className="ti ti-search" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Card>

        <Card sx={{ borderRadius: 2 }}>
          <Box sx={{ p: '16px 20px', borderBottom: '1px solid #E5EBF0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: 16, fontWeight: 600 }}>{mandates.length} Total Mandates</Typography>
          </Box>
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            {isLoading ? (
              <Box sx={{ p: 4 }}><LinearProgress /></Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#6B7C93', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Mandate Name</TableCell>
                    <TableCell sx={{ color: '#6B7C93', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Client</TableCell>
                    <TableCell sx={{ color: '#6B7C93', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Type</TableCell>
                    <TableCell sx={{ color: '#6B7C93', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Locations</TableCell>
                    <TableCell sx={{ color: '#6B7C93', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Onboarding</TableCell>
                    <TableCell sx={{ color: '#6B7C93', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Status</TableCell>
                    <TableCell sx={{ color: '#6B7C93', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((m) => {
                    const client = clients.find((c) => c.id === m.clientId);
                    return (
                      <TableRow key={m.id} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{m.companyName}</Typography>
                          <Typography sx={{ fontSize: 12, color: '#6B7C93' }}>{m.contractRef}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: 14 }}>{client?.name || m.clientId}</TableCell>
                        <TableCell><Chip label={m.mandateType} size="small" sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 600, borderRadius: 1 }} /></TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {m.locations.map((l) => (
                              <Chip key={l} label={l} size="small" sx={{ bgcolor: '#F1F5F9', color: '#475569', fontWeight: 600, borderRadius: 1, fontSize: 11 }} />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: 14 }}>{formatDate(m.onboardingDate)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={m.status} 
                            size="small" 
                            sx={{ 
                              bgcolor: m.status === 'active' ? '#DCFCE7' : m.status === 'closed' ? '#FEE2E2' : '#FEF9C3', 
                              color: m.status === 'active' ? '#166534' : m.status === 'closed' ? '#991B1B' : '#854D0E', 
                              fontWeight: 600, 
                              textTransform: 'capitalize', 
                              borderRadius: 1 
                            }} 
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <IconButton 
                              size="small" 
                              onClick={() => {
                                const req = requirements.find(r => r.mandateId === m.id);
                                if (req) {
                                  navigate('/requirements', { state: { requirement: req, mode: 'view' } });
                                } else {
                                  enqueueSnackbar('No requirement details found', { variant: 'info' });
                                }
                              }}
                            >
                              <i className="ti ti-eye" style={{ fontSize: 18 }} />
                            </IconButton>
                            {canCreate && (
                              <IconButton 
                                size="small" 
                                onClick={() => {
                                  const req = requirements.find(r => r.mandateId === m.id);
                                  if (req) {
                                    navigate('/requirements', { state: { requirement: req, mode: 'edit' } });
                                  } else {
                                    enqueueSnackbar('No requirement details found for editing', { variant: 'info' });
                                  }
                                }}
                              >
                                <i className="ti ti-edit" style={{ fontSize: 18 }} />
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!isLoading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#6B7C93' }}>
                        No mandates found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Box>
        </Card>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ borderBottom: '1px solid #E5EBF0', pb: 2 }}>
          <Typography sx={{ fontSize: 18, fontWeight: 600 }}>{editing ? 'Edit Mandate' : 'Create New Mandate'}</Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Mandate Name" size="small" {...register('companyName')} error={!!errors.companyName} helperText={errors.companyName?.message} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small" error={!!errors.clientId}>
                  <InputLabel>Client</InputLabel>
                  <Select label="Client" {...register('clientId')} defaultValue="">
                    <MenuItem value=""><em>Select client...</em></MenuItem>
                    {clients.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                  {errors.clientId && <FormHelperText>{errors.clientId.message}</FormHelperText>}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select label="Type" {...register('mandateType')} defaultValue="NEW">
                    <MenuItem value="NEW">NEW</MenuItem>
                    <MenuItem value="EXPANSION">EXPANSION</MenuItem>
                    <MenuItem value="REPLACEMENT">REPLACEMENT</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Contract Ref" size="small" {...register('contractRef')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Locations (comma separated)" size="small" {...register('locations')} error={!!errors.locations} helperText={errors.locations?.message} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Start Date" type="date" size="small" InputLabelProps={{ shrink: true }} {...register('startDate')} error={!!errors.startDate} helperText={errors.startDate?.message} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Onboarding Date" type="date" size="small" InputLabelProps={{ shrink: true }} {...register('onboardingDate')} error={!!errors.onboardingDate} helperText={errors.onboardingDate?.message} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Notes" size="small" multiline rows={3} {...register('notes')} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #E5EBF0' }}>
            <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
            <LoadingButton type="submit" variant="contained" color="primary" loading={creating || updating}>
              {editing ? 'Update' : 'Create'} Mandate
            </LoadingButton>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};
