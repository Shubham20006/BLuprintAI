import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar } from 'notistack';

import {
  useCandidates,
  useCOEs,
  useCreateCandidate,
  useUpdateCandidate,
} from '../../api/hooks';

import { useSessionStore } from '../../store';
import { can } from '../../auth/permissions';
import { generateId, exportToCSV } from '../../utils';
import { PageLoader, LoadingButton } from '../../components/shared';

import type { Candidate } from '../../types';
import { Box, Typography, Button, Select, MenuItem, Table, TableHead, TableBody, TableRow, TableCell, Grid, Card, Chip, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Avatar } from '@mui/material';


const schema = z.object({
  name: z.string().min(2, 'Required'),

  email: z.string().email('Invalid email'),

  phone: z.string().min(10, 'Invalid phone'),

  // FIXED -> coeId is NUMBER
  coeId: z.coerce.number().min(1, 'Required'),

  graduationYear: z.coerce
    .number()
    .min(2020)
    .max(2030),

  stream: z.string().min(2, 'Required'),

  skills: z.string().min(1, 'Required'),

  cgpa: z.coerce.number().min(0).max(10),
});

type FormValues = z.infer<typeof schema>;

const STATUS_OPTIONS = [
  'Selected',
  'Proposed',
  'Mapped',
  'Discussed',
  'LOI Sent',
  'LOI Signed',
  'CFP Started',
  'Dropped',
];

export const CandidatesPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();

  const { currentUser } = useSessionStore();

  const [open, setOpen] =
    React.useState(false);

  const [editing, setEditing] =
    React.useState<Candidate | null>(
      null
    );

  const [search, setSearch] =
    React.useState('');

  const [statusFilter, setStatusFilter] =
    React.useState('');

  const [coeFilter, setCoeFilter] =
    React.useState('');

  const {
    data: candidates = [],
    isLoading,
  } = useCandidates();

  const { data: coes = [] } = useCOEs();

  const {
    mutateAsync: createCandidate,
    isPending: creating,
  } = useCreateCandidate();

  const {
    mutateAsync: updateCandidate,
    isPending: updating,
  } = useUpdateCandidate();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),

    defaultValues: {
      name: '',
      email: '',
      phone: '',
      coeId: '' as any,
      graduationYear: '' as any,
      stream: '',
      skills: '',
      cgpa: '' as any,
    },
  });

  const [importOpen, setImportOpen] =
    React.useState(false);

  const [csvData, setCsvData] =
    React.useState('');

  const [importing, setImporting] =
    React.useState(false);

  const handleCsvImport =
    async () => {
      if (!csvData.trim()) return;

      setImporting(true);

      try {
        const lines = csvData
          .trim()
          .split('\n');

        let count = 0;

        for (const line of lines) {
          const [
            name,
            email,
            phone,
            coeId,
            year,
            stream,
            skills,
            cgpa,
          ] = line
            .split(',')
            .map((s) => s?.trim());

          if (!name || !email)
            continue;

          await createCandidate({
            id: generateId(),

            name,

            email,

            phone: phone || '',

            // FIXED
            coeId: Number(
              coeId || coes[0]?.id || 0
            ),

            graduationYear:
              parseInt(year) || 2025,

            stream: stream || 'CS',

            skills: (
              skills || ''
            )
              .split(';')
              .map((s) => s.trim()),

            cgpa:
              parseFloat(cgpa) || 0,

            status: 'Selected',

            resumeLink: '',

            externalKey: `IMP-${generateId()}`,

            createdAt:
              new Date().toISOString(),
          });

          count++;
        }

        enqueueSnackbar(
          `Successfully imported ${count} candidates`,
          {
            variant: 'success',
          }
        );

        setImportOpen(false);

        setCsvData('');
      } catch (err) {
        enqueueSnackbar(
          'Error during import',
          {
            variant: 'error',
          }
        );
      } finally {
        setImporting(false);
      }
    };

  // FIXED
  // showing all candidates
  const scopedCandidates =
    React.useMemo(() => {
      return candidates;
    }, [candidates]);

  const filtered = React.useMemo(() => {
    return scopedCandidates.filter(
      (c) => {
        const matchSearch =
          c.name
            .toLowerCase()
            .includes(
              search.toLowerCase()
            ) ||
          c.email
            .toLowerCase()
            .includes(
              search.toLowerCase()
            );

        const matchStatus =
          !statusFilter ||
          c.status === statusFilter;

        // FIXED -> compare as string
        const matchCoe =
          !coeFilter ||
          String(c.coeId) ===
            String(coeFilter);

        return (
          matchSearch &&
          matchStatus &&
          matchCoe
        );
      }
    );
  }, [
    scopedCandidates,
    search,
    statusFilter,
    coeFilter,
  ]);

  const handleOpen = (
    candidate?: Candidate
  ) => {
    if (candidate) {
      setEditing(candidate);

      reset({
        ...candidate,

        // FIXED
        coeId: Number(
          candidate.coeId
        ),

        skills:
          candidate.skills.join(
            ', '
          ),

        cgpa:
          candidate.cgpa || 0,
      });
    } else {
      setEditing(null);

      reset({
        name: '',
        email: '',
        phone: '',
        coeId: '' as any,
        graduationYear: '' as any,
        stream: '',
        skills: '',
        cgpa: '' as any,
      });
    }

    setOpen(true);
  };

  const onSubmit = async (
    data: FormValues
  ) => {
    try {
      const isDuplicate =
        candidates.some(
          (c) =>
            (c.email.toLowerCase() ===
              data.email.toLowerCase() ||
              c.phone ===
                data.phone) &&
            c.id !== editing?.id
        );

      if (isDuplicate) {
        enqueueSnackbar(
          'Candidate with this email or phone already exists',
          {
            variant: 'error',
          }
        );

        return;
      }

      const payload: Partial<Candidate> =
        {
          ...data,

          // FIXED
          coeId: Number(data.coeId),

          skills: data.skills
            .split(',')
            .map((s) =>
              s.trim()
            )
            .filter(Boolean),

          status:
            editing?.status ||
            'Selected',

          resumeLink:
            editing?.resumeLink ||
            '',

          externalKey:
            editing?.externalKey ||
            `${data.coeId}-${generateId()}`,

          createdAt:
            editing?.createdAt ||
            new Date().toISOString(),
        };

      if (editing) {
        await updateCandidate({
          id: editing.id,
          ...payload,
        });

        enqueueSnackbar(
          'Candidate updated',
          {
            variant: 'success',
          }
        );
      } else {
        await createCandidate({
          id: generateId(),
          ...payload,
        });

        enqueueSnackbar(
          'Candidate added',
          {
            variant: 'success',
          }
        );
      }

      setOpen(false);

      reset();

      setEditing(null);
    } catch {
      enqueueSnackbar(
        'Error saving candidate',
        {
          variant: 'error',
        }
      );
    }
  };

  return (
    <>
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #E5EBF0', px: 2, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Typography sx={{ fontSize: 15, color: '#6B7C93' }}>
          Candidates / <Box component="span" sx={{ color: '#111827', fontWeight: 500 }}>{filtered.length} of {candidates.length}</Box>
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={() => setImportOpen(true)} color="inherit">
            <i className="ti ti-upload" style={{ marginRight: 6 }} /> Import CSV
          </Button>
          {currentUser && can.importCandidates(currentUser.role) && (
            <Button variant="contained" size="small" onClick={() => handleOpen()}>
              <i className="ti ti-plus" style={{ marginRight: 6 }} /> Add Candidate
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        <Card sx={{ borderRadius: 2 }}>
          <Box sx={{ p: '12px 16px', display: 'flex', gap: 1.5, alignItems: 'center', borderBottom: '1px solid #E5EBF0' }}>
            <TextField size="small" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ minWidth: 200 }} />
            <Select size="small" displayEmpty value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 150 }}>
              <MenuItem value="">All Status</MenuItem>
              {STATUS_OPTIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
            <Select size="small" displayEmpty value={coeFilter} onChange={(e) => setCoeFilter(e.target.value)} sx={{ minWidth: 150 }}>
              <MenuItem value="">All COEs</MenuItem>
              {coes.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
            <Button variant="outlined" size="small" color="inherit" onClick={() => exportToCSV(filtered.map(c => ({ ...c, skills: c.skills.join(';') })), 'candidates')}>
              <i className="ti ti-download" style={{ marginRight: 6 }} /> Export
            </Button>
          </Box>
          <Box sx={{ overflowX: 'auto' }}>
            {isLoading ? <PageLoader message="Loading candidates..." /> : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Candidate</TableCell>
                    <TableCell>COE</TableCell>
                    <TableCell>Stream</TableCell>
                    <TableCell>Skills</TableCell>
                    <TableCell>CGPA</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((c) => {
                    const coe = coes.find((co) => Number(co.id) === Number(c.coeId));
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 12, fontWeight: 600 }}>
                              {c.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontWeight: 600, color: 'text.primary', fontSize: 13 }}>{c.name}</Typography>
                              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{c.email}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{coe?.name || 'N/A'}</TableCell>
                        <TableCell>{c.stream}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {c.skills.map((s) => <Chip key={s} label={s} size="small" color="warning" sx={{ height: 20, fontSize: 11, fontWeight: 600 }} />)}
                          </Box>
                        </TableCell>
                        <TableCell><Chip label={c.cgpa} size="small" color="primary" sx={{ height: 20, fontSize: 11, fontWeight: 600 }} /></TableCell>
                        <TableCell><Chip label={c.status} size="small" color="warning" sx={{ height: 20, fontSize: 11, fontWeight: 600 }} /></TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleOpen(c)}>
                            <i className="ti ti-edit" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!isLoading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 5 }}>No candidates found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Box>
        </Card>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ borderBottom: '1px solid #E5EBF0', pb: 2 }}>
          {editing ? 'Edit Candidate' : 'Add Candidate'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ py: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller name="name" control={control} render={({ field }) => <TextField {...field} fullWidth placeholder="Name" error={!!errors.name} helperText={errors.name?.message} />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="email" control={control} render={({ field }) => <TextField {...field} fullWidth placeholder="Email" error={!!errors.email} helperText={errors.email?.message} />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="phone" control={control} render={({ field }) => <TextField {...field} fullWidth placeholder="Phone" error={!!errors.phone} helperText={errors.phone?.message} />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="coeId" control={control} render={({ field }) => (
                  <Select {...field} value={field.value || ''} onChange={(e) => field.onChange(Number(e.target.value))} fullWidth displayEmpty error={!!errors.coeId}>
                    <MenuItem value="">Select COE</MenuItem>
                    {coes.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="graduationYear" control={control} render={({ field }) => <TextField {...field} type="number" fullWidth placeholder="Graduation Year (e.g. 2025)" error={!!errors.graduationYear} helperText={errors.graduationYear?.message} />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="stream" control={control} render={({ field }) => <TextField {...field} fullWidth placeholder="Stream" error={!!errors.stream} helperText={errors.stream?.message} />} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="skills" control={control} render={({ field }) => <TextField {...field} fullWidth placeholder="Java, React, Spring" error={!!errors.skills} helperText={errors.skills?.message} />} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="cgpa" control={control} render={({ field }) => <TextField {...field} type="number" inputProps={{ step: "0.1" }} fullWidth placeholder="CGPA (out of 10)" error={!!errors.cgpa} helperText={errors.cgpa?.message} />} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #E5EBF0' }}>
            <Button onClick={() => setOpen(false)} color="inherit">Cancel</Button>
            <LoadingButton type="submit" loading={creating || updating} variant="contained">
              {editing ? 'Update Candidate' : 'Add Candidate'}
            </LoadingButton>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};