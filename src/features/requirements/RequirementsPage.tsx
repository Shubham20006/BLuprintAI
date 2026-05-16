import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { useSnackbar } from 'notistack';

import {
  Autocomplete,
  TextField,
  ThemeProvider,
  createTheme,
  Box,
  Typography,
  Button,
  Card,
  Grid,
  Table,
  TableBody,
  TableRow,
  TableCell,
  IconButton
} from '@mui/material';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { api } from '../../api/client';
import dayjs from 'dayjs';

import {
  useClients,
  useCreateRequirement,
  useCreateMandate,
  useRequirements,
  useUpdateRequirement,
  useUpdateClient,
} from '../../api/hooks';

import {
  generateId,
  generateRequirementId,
} from '../../utils';
import { LoadingButton } from '../../components/shared';

const schema = z.object({
  companyName: z.string().min(1, 'Required'),

  shortName: z.string().min(1, 'Required'),

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

const muiTheme = createTheme({
  typography: {
    fontFamily: 'inherit',
    fontSize: 13,
  },

  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          background: '#fff',
          borderRadius: 10,
          minHeight: 34,
          height: 38,

          '& fieldset': {
            borderColor: '#CBD5E1',
          },

          '&:hover fieldset': {
            borderColor: '#2563EB',
          },

          '&.Mui-focused fieldset': {
            borderColor: '#2563EB',
            borderWidth: '1px',
          },
        },

        input: {
          padding: '6px 12px',
          fontSize: 13,
        },
      },
    },

    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
          border: '1px solid #E2E8F0',

          boxShadow:
            '0 8px 24px rgba(15,23,42,0.08)',
        },

        option: {
          minHeight: 34,
          fontSize: 13,
        },
      },
    },

    MuiInputBase: {
      styleOverrides: {
        root: {
          height: 34,
          fontSize: 13,
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        fullWidth: true,
        size: 'small',
      },
    },
  },
});

export const RequirementsPage: React.FC = () => {
  const navigate = useNavigate();

  const locationState = useLocation();

  const { enqueueSnackbar } = useSnackbar();

  const { data: clients = [] } = useClients();

  const { data: requirements = [] } =
    useRequirements();

  const { mutateAsync: createMandate } =
    useCreateMandate();

  const {
    mutateAsync: createReq,
    isPending: isCreating,
  } = useCreateRequirement();

  const {
    mutateAsync: updateReq,
    isPending: isUpdating,
  } = useUpdateRequirement();

  const {
    mutateAsync: updateClient,
  } = useUpdateClient();

  const isPending = isCreating || isUpdating;

  // GET MODE + DATA
  const mode =
    locationState.state?.mode || 'create';

  const requirement =
    locationState.state?.requirement;

  const isView = mode === 'view';

  const isEdit = mode === 'edit';

  const {
    handleSubmit,
    watch,
    register,
    control,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),

    defaultValues: {
      companyName: '',
      shortName: '',
      mandateType: '',
      techStack: '',
      engagementModel: '',
      location: '',
      onboardingDate: '',
      mandateDate: '',
      openPositions: 0,
      notes: '',
    },
  });

  // PREFILL DATA
  useEffect(() => {
    if (requirement) {
      // console.log('Requirement object:', requirement);
      reset({
        companyName:
          requirement.companyName || '',

        shortName:
          requirement.requirementCode
            ?.split('-')[0] || '',

        mandateType:
          requirement.requirementCode
            ?.split('-')[1] || '',

        techStack:
          requirement.techStack || '',

        engagementModel:
          requirement.intakeType || '',

        location:
          requirement.location || '',

        onboardingDate:
          requirement.onboardingDate || '',

        mandateDate:
          requirement.createdAt
            ?.split('T')[0] || '',

        openPositions:
          requirement.openPositions || 0,

        notes: '',
      });
    }
  }, [requirement, reset]);

  const watchedShortName =
    watch('shortName');

  const watchedTech = watch('techStack');

  const watchedEngagement =
    watch('engagementModel');

  const watchedDate = watch('mandateDate');

  const watchedMandateType =
    watch('mandateType');

  const nextSeq = requirements.length + 101;

  const techShort = watchedTech
    ? watchedTech.split(' ')[0]
    : '-';

  const monthDay = watchedDate
    ? new Date(watchedDate)
      .toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
      })
      .replace(' ', '')
    : '-';

  const previewId =
    watchedShortName &&
      watchedTech &&
      watchedEngagement &&
      watchedDate
      ? generateRequirementId(
        watchedShortName
          .replace(/\s+/g, ''),
        watchedMandateType || '-',
        techShort,
        watchedEngagement,
        monthDay,
        nextSeq
      )
      : '—';

  const onSubmit = async (
    data: FormValues
  ) => {
    try {
      // EDIT OPERATION
      if (isEdit && requirement) {
        const reqTechShort = data.techStack.split(' ')[0];
        const reqMonthDay = new Date(data.mandateDate)
          .toLocaleString('en-US', { month: 'short', day: '2-digit' })
          .replace(' ', '');
        const reqSeqStr = requirement.requirementCode?.split('-').pop();
        const reqSeq = reqSeqStr ? parseInt(reqSeqStr) : nextSeq;

        const reqCode = generateRequirementId(
          data.shortName.replace(/\s+/g, ''),
          data.mandateType,
          reqTechShort,
          data.engagementModel,
          reqMonthDay,
          reqSeq
        );

        const updatedRequirement = {
          ...requirement,
          requirementCode: reqCode,
          techStack: data.techStack,
          intakeType: data.engagementModel,
          location: data.location,
          onboardingDate: data.onboardingDate,
          openPositions: data.openPositions,
        };

        await updateReq({ id: requirement.id, ...updatedRequirement });

        const client = clients.find((c) => c.name.toLowerCase() === data.companyName.toLowerCase());
        if (client) {
          await updateClient({
            id: client.id,
            shortCode: data.shortName.toUpperCase().replace(/\s+/g, ''),
          });
        }

        enqueueSnackbar(
          'Requirement updated successfully',
          {
            variant: 'success',
          }
        );

        navigate('/dashboard');

        return;
      }

      // CREATE OPERATION
      let client = clients.find(
        (c) =>
          c.name.toLowerCase() ===
          data.companyName.toLowerCase()
      );

      if (!client) {
        const newClient = {
          id: generateId(),

          name: data.companyName,

          shortCode: data.shortName
            .replace(/\s+/g, '')
            .toUpperCase(),

          tags: [],

          accountOwner: 'u1',

          status: 'active',
        };

        await api.post(
          '/clients',
          newClient
        );

        client = newClient;
      }

      const reqTechShort =
        data.techStack.split(' ')[0];

      const reqMonthDay = new Date(
        data.mandateDate
      )
        .toLocaleString('en-US', {
          month: 'short',
          day: '2-digit',
        })
        .replace(' ', '');

      const reqCode =
        generateRequirementId(
          data.shortName
            .replace(/\s+/g, ''),

          data.mandateType,

          reqTechShort,

          data.engagementModel,

          reqMonthDay,

          nextSeq
        );

      const mandateId = generateId();

      await createMandate({
        id: mandateId,

        companyName: data.companyName,

        clientId: client.id,

        mandateType:
          data.mandateType as any,

        startDate: data.mandateDate,

        onboardingDate:
          data.onboardingDate,

        locations: [data.location],

        status: 'active',

        createdAt:
          new Date().toISOString(),

        createdBy: 'u1',
      });

      await createReq({
        id: generateId(),

        mandateId: mandateId,
        companyName: data.companyName,

        requirementCode: reqCode,

        techStack: data.techStack,

        intakeType:
          data.engagementModel,

        expLevel: 'Fresher',

        location: data.location,

        onboardingDate:
          data.onboardingDate,

        openPositions:
          data.openPositions,

        filledPositions: 0,

        status: 'active',

        createdAt:
          new Date().toISOString(),

        targetCoeIds: [],
      });

      enqueueSnackbar(
        'Mandate and Requirement created successfully',
        {
          variant: 'success',
        }
      );

      navigate('/dashboard');
    } catch (error) {
      console.error(error);

      enqueueSnackbar(
        isEdit
          ? 'Error updating requirement'
          : 'Error creating mandate',
        {
          variant: 'error',
        }
      );
    }
  };

  const autoCompleteProps = (
    field: any
  ) => ({
    freeSolo: true,

    value: field.value || '',

    inputValue: field.value || '',

    onInputChange: (
      _: any,
      value: string
    ) => {
      field.onChange(value);
    },

    onChange: (
      _: any,
      value: string
    ) => {
      field.onChange(value || '');
    },

    disabled: isView,
  });

  return (
    <ThemeProvider theme={muiTheme}>
      <LocalizationProvider
        dateAdapter={AdapterDayjs}
      >
        <>
          <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #E5EBF0', px: 2, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography sx={{ fontSize: 15, color: '#6B7C93' }}>
                Mandates / <Box component="span" sx={{ color: '#111827', fontWeight: 500 }}>
                  {isView ? 'View Mandate' : isEdit ? 'Edit Mandate' : 'Create New Mandate'}
                </Box>
              </Typography>
            </Box>
            <Button variant="outlined" size="small" color="inherit" onClick={() => navigate(-1)}>
              <i className="ti ti-arrow-left" style={{ marginRight: 6 }} /> Back
            </Button>
          </Box>

          <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' }, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Card sx={{ borderRadius: 2 }}>
                <Box sx={{ p: '12px 16px', borderBottom: '1px solid #E5EBF0' }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Mandate Details</Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                  <form id="req-form" onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>Company</Typography>
                        <Controller control={control} name="companyName" render={({ field }) => (
                          <Autocomplete {...autoCompleteProps(field)} options={clients.map((c) => c.name)} renderInput={(params) => <TextField {...params} placeholder="Enter Company Name..." />} />
                        )} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>Short Name</Typography>
                        <input className="form-input" disabled={isView} placeholder="e.g. APEX" style={{ height: 34, fontSize: 13, padding: '6px 12px', width: '100%', border: '1px solid #CBD5E1', borderRadius: 10 }} {...register('shortName')} />
                      </Grid>
                    </Grid>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>Mandate type</Typography>
                        <Controller control={control} name="mandateType" render={({ field }) => (
                          <Autocomplete {...autoCompleteProps(field)} options={['NEW', 'RENEW', 'EXT', 'SUB']} renderInput={(params) => <TextField {...params} placeholder="Select Mandate Type..." />} />
                        )} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>Open positions</Typography>
                        <input className="form-input" type="number" disabled={isView} placeholder="e.g. 10" style={{ height: 34, fontSize: 13, padding: '6px 12px', width: '100%', border: '1px solid #CBD5E1', borderRadius: 10 }} {...register('openPositions')} />
                      </Grid>
                    </Grid>

                    <Box sx={{ mb: 2 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>Technology stack</Typography>
                      <Controller control={control} name="techStack" render={({ field }) => (
                        <Autocomplete {...autoCompleteProps(field)} options={['DotNetStack — .NET / C#', 'JavaStack — Java Full Stack', 'AIMLDataEng — AI/ML & Data Engineering', 'DeepTech', 'Backend', 'Python — Python Development']} renderInput={(params) => <TextField {...params} placeholder="Select Tech Stack..." />} />
                      )} />
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>Engagement model</Typography>
                        <Controller control={control} name="engagementModel" render={({ field }) => (
                          <Autocomplete {...autoCompleteProps(field)} options={['FresherISA', 'FresherFixed', 'LateralISA', 'UpSkilling']} renderInput={(params) => <TextField {...params} placeholder="Select Engagement Model..." />} />
                        )} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>Job location</Typography>
                        <Controller control={control} name="location" render={({ field }) => (
                          <Autocomplete {...autoCompleteProps(field)} options={['Hyderabad, Telangana', 'Bangalore, Karnataka', 'Pune, Maharashtra', 'Chennai, Tamil Nadu']} renderInput={(params) => <TextField {...params} placeholder="Select Job Location..." />} />
                        )} />
                      </Grid>
                    </Grid>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={12} sm={6}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>Mandate date</Typography>
                        <Controller control={control} name="mandateDate" render={({ field }) => (
                          <DatePicker disabled={isView} value={field.value ? dayjs(field.value) : null} onChange={(val) => field.onChange(val ? val.format('YYYY-MM-DD') : '')} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
                        )} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>Onboarding date</Typography>
                        <Controller control={control} name="onboardingDate" render={({ field }) => (
                          <DatePicker disabled={isView} value={field.value ? dayjs(field.value) : null} onChange={(val) => field.onChange(val ? val.format('YYYY-MM-DD') : '')} slotProps={{ textField: { size: 'small', fullWidth: true } }} />
                        )} />
                      </Grid>
                    </Grid>

                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>Notes (optional)</Typography>
                      <textarea className="form-input" disabled={isView} rows={2} placeholder="Add any specific notes..." style={{ fontSize: 13, padding: '8px 12px', width: '100%', border: '1px solid #CBD5E1', borderRadius: 10, fontFamily: 'inherit' }} {...register('notes')} />
                    </Box>
                  </form>
                </Box>
              </Card>

              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button variant="outlined" color="inherit" onClick={() => navigate(-1)}>Cancel</Button>
                {!isView && (
                  <LoadingButton type="submit" form="req-form" loading={isPending}>
                    {isEdit ? 'Update Mandate' : 'Create Mandate'}
                  </LoadingButton>
                )}
              </Box>
            </Box>

            <Box sx={{ width: { xs: '100%', md: 'calc(50% - 8px)' }, flexShrink: 0 }}>
              <Card sx={{ borderRadius: 2 }}>
                <Box sx={{ bgcolor: 'secondary.light', p: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'secondary.main', display: 'flex', alignItems: 'center' }}>
                    <i className="ti ti-sparkles" style={{ marginRight: 6 }} /> AI Requirement ID Generator
                  </Typography>
                  <Box sx={{ bgcolor: 'secondary.light', color: 'secondary.main', border: '1px solid rgba(90,45,130,.2)', borderRadius: 1, px: 1, py: 0.25, fontSize: 11, fontWeight: 600 }}>Live Preview</Box>
                </Box>
                <Box sx={{ p: 2 }}>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 1.5 }}>
                    Generated automatically from your form inputs. The AI checks for duplicates and semantic conflicts.
                  </Typography>
                  
                  <Box sx={{ p: 2, bgcolor: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 2, mb: 1.5 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>Generated Requirement ID</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                      {previewId.split('-').map((part, i, arr) => (
                        <React.Fragment key={i}>
                          <Box sx={{ bgcolor: '#fff', border: '1px solid #E2E8F0', borderRadius: 1, px: 1, py: 0.5, fontSize: 13, fontWeight: 600, color: 'primary.main', fontFamily: 'monospace' }}>{part}</Box>
                          {i < arr.length - 1 && <Box sx={{ color: '#CBD5E1', fontWeight: 600 }}>-</Box>}
                        </React.Fragment>
                      ))}
                    </Box>
                  </Box>

                  <Box sx={{ mt: 1.5, p: 1, bgcolor: 'success.light', borderRadius: 1, border: '1px solid #6EE7B7', fontSize: 12, color: 'success.main', display: 'flex', gap: 1, alignItems: 'center' }}>
                    <i className="ti ti-circle-check" style={{ fontSize: 16 }} />
                    <span>No duplicate mandate detected. ID is unique and valid.</span>
                  </Box>

                  <Box sx={{ mt: 1.5 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.4, mb: 1 }}>ID Tag Breakdown</Typography>
                    <Table size="small">
                      <TableBody>
                        {[
                          { lbl: 'Client code', val: watchedShortName || '—' },
                          { lbl: 'Mandate type', val: watchedMandateType || '—' },
                          { lbl: 'Tech stack', val: techShort || '—' },
                          { lbl: 'Engagement', val: watchedEngagement || '—' },
                          { lbl: 'Date', val: monthDay || '—' },
                          { lbl: 'Sequence no.', val: nextSeq },
                        ].map((row, i) => (
                          <TableRow key={i}>
                            <TableCell sx={{ py: 0.5, border: 'none', color: 'text.secondary', fontSize: 12, px: 0 }}>{row.lbl}</TableCell>
                            <TableCell sx={{ py: 0.5, border: 'none', fontWeight: 600, color: 'secondary.main', fontFamily: 'monospace', fontSize: 12, px: 0 }} align="right">{row.val}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>

                  <Box sx={{ mt: 1.5, p: 1, bgcolor: 'info.light', borderRadius: 1, fontSize: 12, color: 'secondary.main', display: 'flex', gap: 1, alignItems: 'center' }}>
                    <i className="ti ti-info-circle" />
                    <span>Sequence number auto-increments. You can request regeneration if needed.</span>
                  </Box>
                </Box>
              </Card>
            </Box>
          </Box>
        </>
      </LocalizationProvider>
    </ThemeProvider>
  );
};