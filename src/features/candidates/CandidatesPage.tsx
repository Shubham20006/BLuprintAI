import React from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Grid, Typography, Chip, IconButton,
  Table, TableBody, TableCell, TableHead, TableRow, InputAdornment,
  Avatar,
} from '@mui/material';
import { Add, Search, Edit, Visibility, Upload, FilterList } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar } from 'notistack';
import { useCandidates, useCOEs, useCreateCandidate, useUpdateCandidate } from '../../api/hooks';
import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { StatusChip, PageHeader, SectionCard, RoleBadge } from '../../components/shared';
import { formatDate, generateId, TECH_STACKS, exportToCSV } from '../../utils';
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

  // COE scope filter
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
    <Box>
      <PageHeader
        title="Candidates"
        subtitle={`${filtered.length} of ${candidates.length} candidates`}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<Upload />} size="small"
              onClick={() => enqueueSnackbar('CSV import — connect backend for file processing', { variant: 'info' })}>
              Import CSV
            </Button>
            {currentUser && can.importCandidates(currentUser.role) && (
              <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>Add Candidate</Button>
            )}
          </Box>
        }
      />

      <SectionCard>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by name or email…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            sx={{ flex: 1, minWidth: 200 }}
          />
          <TextField
            select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 150 }}>
            <MenuItem value="">All Status</MenuItem>
            {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField
            select label="COE" value={coeFilter} onChange={(e) => setCoeFilter(e.target.value)}
            sx={{ minWidth: 160 }}>
            <MenuItem value="">All COEs</MenuItem>
            {coes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name.split(' ').slice(0,2).join(' ')}</MenuItem>)}
          </TextField>
          <Button variant="outlined" size="small" onClick={() => exportToCSV(filtered.map(c => ({...c, skills: c.skills.join(';')})), 'candidates')}>
            Export
          </Button>
        </Box>

        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Candidate</TableCell>
                <TableCell>COE</TableCell>
                <TableCell>Stream</TableCell>
                <TableCell>Skills</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((c) => {
                const coe = coes.find((co) => co.id === c.coeId);
                return (
                  <TableRow key={c.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                          {c.name.split(' ').map(w => w[0]).join('').slice(0,2)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{c.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{c.email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{coe?.name.split(' ').slice(0,2).join(' ') || c.coeId}</Typography>
                    </TableCell>
                    <TableCell><Typography variant="body2">{c.stream}</Typography></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 200 }}>
                        {c.skills.slice(0, 3).map((s) => (
                          <Chip key={s} label={s} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
                        ))}
                        {c.skills.length > 3 && <Chip label={`+${c.skills.length - 3}`} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${c.assessmentScore}%`} size="small"
                        color={c.assessmentScore >= 80 ? 'success' : c.assessmentScore >= 60 ? 'warning' : 'error'}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell><StatusChip status={c.status} type="candidate" /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpen(c)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No candidates found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </SectionCard>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Candidate' : 'Add Candidate'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Grid container spacing={2} pt={1}>
              <Grid item xs={12} sm={6}>
                <Controller name="name" control={control} render={({ field }) => (
                  <TextField {...field} label="Full Name" fullWidth error={!!errors.name} helperText={errors.name?.message} />
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="email" control={control} render={({ field }) => (
                  <TextField {...field} label="Email" fullWidth error={!!errors.email} helperText={errors.email?.message} />
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="phone" control={control} render={({ field }) => (
                  <TextField {...field} label="Phone" fullWidth error={!!errors.phone} helperText={errors.phone?.message} />
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
                <Controller name="graduationYear" control={control} render={({ field }) => (
                  <TextField {...field} label="Graduation Year" type="number" fullWidth />
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="stream" control={control} render={({ field }) => (
                  <TextField {...field} label="Stream" fullWidth error={!!errors.stream} helperText={errors.stream?.message} />
                )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="skills" control={control} render={({ field }) => (
                  <TextField {...field} label="Skills (comma separated)" fullWidth error={!!errors.skills} helperText={errors.skills?.message || 'e.g. Java, Spring Boot, MySQL'} />
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="assessmentScore" control={control} render={({ field }) => (
                  <TextField {...field} label="Assessment Score (0-100)" type="number" fullWidth />
                )} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={creating || updating}>
              {editing ? 'Update' : 'Add'} Candidate
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
