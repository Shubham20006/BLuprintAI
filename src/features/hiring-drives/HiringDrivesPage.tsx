import React from 'react';
import {
  Box, Button, Typography, Table, TableBody, TableCell,
  TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Grid, Chip, IconButton,
} from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar } from 'notistack';
import { useHiringDrives, useCOEs, useCreateHiringDrive } from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { PageHeader, SectionCard, StatusChip } from '../../components/shared';
import { formatDate, generateId, TECH_STACKS } from '../../utils';

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

  const { data: drives = [] } = useHiringDrives();
  const { data: coes = [] } = useCOEs();
  const { mutateAsync: createDrive, isPending } = useCreateHiringDrive();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { coeId: '', driveName: '', date: '', venue: '', techCovered: '', notes: '' },
  });

  const scopedDrives = currentUser && can.isCOEScoped(currentUser.role) && currentUser.coeScopeIds.length
    ? drives.filter((d) => currentUser.coeScopeIds.includes(d.coeId))
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
    <Box>
      <PageHeader
        title="Hiring Drives"
        subtitle={`${scopedDrives.length} drives`}
        action={canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => { reset(); setOpen(true); }}>
            New Drive
          </Button>
        )}
      />

      <SectionCard>
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Drive Name</TableCell>
                <TableCell>COE</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Venue</TableCell>
                <TableCell>Tech Covered</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scopedDrives.map((d) => {
                const coe = coes.find((c) => c.id === d.coeId);
                return (
                  <TableRow key={d.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{d.driveName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{coe?.name.split(' ').slice(0, 2).join(' ')}</Typography>
                    </TableCell>
                    <TableCell><Typography variant="body2">{formatDate(d.date)}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{d.venue}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {d.techCovered.map((t) => (
                          <Chip key={t} label={t} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell><StatusChip status={d.status} type="drive" /></TableCell>
                  </TableRow>
                );
              })}
              {scopedDrives.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No drives found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </SectionCard>

      {/* Create Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Hiring Drive</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2} pt={1}>
              <Grid item xs={12}>
                <Controller name="driveName" control={control} render={({ field }) => (
                  <TextField {...field} label="Drive Name" fullWidth error={!!errors.driveName} helperText={errors.driveName?.message} />
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="coeId" control={control} render={({ field }) => (
                  <TextField {...field} label="COE" select fullWidth error={!!errors.coeId} helperText={errors.coeId?.message}>
                    {coes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </TextField>
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="date" control={control} render={({ field }) => (
                  <TextField {...field} label="Drive Date" type="date" fullWidth InputLabelProps={{ shrink: true }} error={!!errors.date} helperText={errors.date?.message} />
                )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="venue" control={control} render={({ field }) => (
                  <TextField {...field} label="Venue" fullWidth error={!!errors.venue} helperText={errors.venue?.message} />
                )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="techCovered" control={control} render={({ field }) => (
                  <TextField {...field} label="Tech Covered (comma separated)" fullWidth error={!!errors.techCovered} helperText={errors.techCovered?.message || 'e.g. Java, DotNet'} />
                )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="notes" control={control} render={({ field }) => (
                  <TextField {...field} label="Notes" fullWidth multiline rows={2} />
                )} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isPending}>Create Drive</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
