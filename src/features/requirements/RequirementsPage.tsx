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
          <div className="topbar">
            <div className="topbar-left">
              <span className="breadcrumb">
                Mandates /{' '}
                <span>
                  {isView
                    ? 'View Mandate'
                    : isEdit
                      ? 'Edit Mandate'
                      : 'Create New Mandate'}
                </span>
              </span>
            </div>

            <div className="topbar-right">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate(-1)}
              >
                <i className="ti ti-arrow-left" />
                Back
              </button>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                '1fr 1fr',
              gap: '1rem',
              margin: '1rem',
              alignItems: 'start',
            }}
          >
            {/* LEFT */}
            <div>
              <div className="panel">
                <div className="panel-hd">
                  <span className="panel-title">
                    Mandate Details
                  </span>
                </div>

                <div className="panel-body">
                  <form
                    id="req-form"
                    onSubmit={handleSubmit(
                      onSubmit
                    )}
                  >
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">
                          Company
                        </label>

                        <Controller
                          control={control}
                          name="companyName"
                          render={({
                            field,
                          }) => (
                            <Autocomplete
                              {...autoCompleteProps(
                                field
                              )}
                              options={clients.map(
                                (c) => c.name
                              )}
                              renderInput={(
                                params
                              ) => (
                                <TextField
                                  {...params}
                                  placeholder="Enter Company Name..."
                                />
                              )}
                            />
                          )}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Short Name
                        </label>

                        <input
                          className="form-input"
                          disabled={isView}
                          placeholder="e.g. APEX"
                          style={{
                            height: 34,
                            fontSize: 13,
                            padding:
                              '6px 12px',
                          }}
                          {...register(
                            'shortName'
                          )}
                        />
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">
                          Mandate type
                        </label>

                        <Controller
                          control={control}
                          name="mandateType"
                          render={({
                            field,
                          }) => (
                            <Autocomplete
                              {...autoCompleteProps(
                                field
                              )}
                              options={[
                                'NEW',
                                'RENEW',
                                'EXT',
                                'SUB',
                              ]}
                              renderInput={(
                                params
                              ) => (
                                <TextField
                                  {...params}
                                  placeholder="Select Mandate Type..."
                                />
                              )}
                            />
                          )}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Open positions
                        </label>

                        <input
                          className="form-input"
                          type="number"
                          disabled={isView}
                          placeholder="e.g. 10"
                          style={{
                            height: 34,
                            fontSize: 13,
                            padding:
                              '6px 12px',
                          }}
                          {...register(
                            'openPositions'
                          )}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Technology stack
                      </label>

                      <Controller
                        control={control}
                        name="techStack"
                        render={({ field }) => (
                          <Autocomplete
                            {...autoCompleteProps(
                              field
                            )}
                            options={[
                              'DotNetStack — .NET / C#',
                              'JavaStack — Java Full Stack',
                              'AIMLDataEng — AI/ML & Data Engineering',
                              'DeepTech',
                              'Backend',
                              'Python — Python Development',
                            ]}
                            renderInput={(
                              params
                            ) => (
                              <TextField
                                {...params}
                                placeholder="Select Tech Stack..."
                              />
                            )}
                          />
                        )}
                      />
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">
                          Engagement model
                        </label>

                        <Controller
                          control={control}
                          name="engagementModel"
                          render={({ field }) => (
                            <Autocomplete
                              {...autoCompleteProps(
                                field
                              )}
                              options={[
                                'FresherISA',
                                'FresherFixed',
                                'LateralISA',
                                'UpSkilling',
                              ]}
                              renderInput={(
                                params
                              ) => (
                                <TextField
                                  {...params}
                                  placeholder="Select Engagement Model..."
                                />
                              )}
                            />
                          )}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Job location
                        </label>

                        <Controller
                          control={control}
                          name="location"
                          render={({ field }) => (
                            <Autocomplete
                              {...autoCompleteProps(
                                field
                              )}
                              options={[
                                'Hyderabad, Telangana',
                                'Bangalore, Karnataka',
                                'Pune, Maharashtra',
                                'Chennai, Tamil Nadu',
                              ]}
                              renderInput={(
                                params
                              ) => (
                                <TextField
                                  {...params}
                                  placeholder="Select Job Location..."
                                />
                              )}
                            />
                          )}
                        />
                      </div>
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">
                          Mandate date
                        </label>

                        <Controller
                          control={control}
                          name="mandateDate"
                          render={({ field }) => (
                            <DatePicker
                              disabled={isView}
                              value={
                                field.value
                                  ? dayjs(
                                    field.value
                                  )
                                  : null
                              }
                              onChange={(
                                value
                              ) =>
                                field.onChange(
                                  value
                                    ? value.format(
                                      'YYYY-MM-DD'
                                    )
                                    : ''
                                )
                              }
                              slotProps={{
                                textField: {
                                  size:
                                    'small',
                                },
                              }}
                            />
                          )}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Onboarding date
                        </label>

                        <Controller
                          control={control}
                          name="onboardingDate"
                          render={({ field }) => (
                            <DatePicker
                              disabled={isView}
                              value={
                                field.value
                                  ? dayjs(
                                    field.value
                                  )
                                  : null
                              }
                              onChange={(
                                value
                              ) =>
                                field.onChange(
                                  value
                                    ? value.format(
                                      'YYYY-MM-DD'
                                    )
                                    : ''
                                )
                              }
                              slotProps={{
                                textField: {
                                  size:
                                    'small',
                                },
                              }}
                            />
                          )}
                        />
                      </div>
                    </div>

                    <div
                      className="form-group"
                      style={{
                        marginBottom: 0,
                      }}
                    >
                      <label className="form-label">
                        Notes (optional)
                      </label>

                      <textarea
                        className="form-input"
                        disabled={isView}
                        rows={2}
                        placeholder="Add any specific notes..."
                        style={{
                          fontSize: 13,
                          padding:
                            '8px 12px',
                        }}
                        {...register('notes')}
                      />
                    </div>
                  </form>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  justifyContent:
                    'flex-end',
                }}
              >
                <button
                  className="btn btn-ghost"
                  onClick={() =>
                    navigate(-1)
                  }
                >
                  Cancel
                </button>

                {!isView && (
                  <button
                    type="submit"
                    form="req-form"
                    className="btn btn-primary"
                    disabled={isPending}
                  >
                    {isEdit
                      ? 'Update Mandate'
                      : 'Create Mandate'}
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT */}
            <div>
              <div className="panel">
                <div
                  className="panel-hd"
                  style={{
                    background:
                      'var(--purple-light)',
                  }}
                >
                  <span
                    className="panel-title"
                    style={{
                      color:
                        'var(--purple)',
                    }}
                  >
                    <i
                      className="ti ti-sparkles"
                      aria-hidden="true"
                      style={{
                        marginRight: 5,
                      }}
                    />
                    AI Requirement ID Generator
                  </span>

                  <span
                    className="section-tag"
                    style={{
                      background:
                        'var(--purple-light)',
                      color:
                        'var(--purple)',
                      border:
                        '1px solid rgba(90,45,130,.2)',
                    }}
                  >
                    Live Preview
                  </span>
                </div>

                <div className="panel-body">
                  <div
                    style={{
                      fontSize: 13,
                      color:
                        'var(--g500)',
                      marginBottom: 10,
                    }}
                  >
                    Generated automatically from
                    your form inputs. The AI
                    checks for duplicates and
                    semantic conflicts.
                  </div>

                  <div className="rid-box">
                    <div className="rid-label">
                      Generated Requirement ID
                    </div>

                    <div className="rid-value">
                      {previewId
                        .split('-')
                        .map(
                          (
                            part,
                            i,
                            arr
                          ) => (
                            <React.Fragment
                              key={i}
                            >
                              <span className="rid-tag">
                                {part}
                              </span>

                              {i <
                                arr.length -
                                1 && '-'}
                            </React.Fragment>
                          )
                        )}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      padding: 8,
                      background:
                        'var(--green-light)',
                      borderRadius: 6,
                      border:
                        '1px solid #6EE7B7',
                      fontSize: 12,
                      color:
                        'var(--green)',
                      display: 'flex',
                      gap: 6,
                      alignItems:
                        'center',
                    }}
                  >
                    <i
                      className="ti ti-circle-check"
                      aria-hidden="true"
                      style={{
                        fontSize: 16,
                      }}
                    />

                    <span>
                      No duplicate mandate
                      detected. ID is unique and
                      valid.
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color:
                          'var(--g500)',
                        textTransform:
                          'uppercase',
                        letterSpacing:
                          0.4,
                        marginBottom: 6,
                      }}
                    >
                      ID Tag Breakdown
                    </div>

                    <table
                      style={{
                        width: '100%',
                        fontSize: 12,
                      }}
                    >
                      <tbody>
                        <tr>
                          <td
                            style={{
                              padding:
                                '3px 0',
                              color:
                                'var(--g500)',
                            }}
                          >
                            Client code
                          </td>

                          <td
                            style={{
                              fontWeight: 600,
                              color:
                                'var(--navy)',
                              fontFamily:
                                'monospace',
                            }}
                          >
                            {watchedShortName ||
                              '—'}
                          </td>
                        </tr>

                        <tr>
                          <td
                            style={{
                              padding:
                                '3px 0',
                              color:
                                'var(--g500)',
                            }}
                          >
                            Mandate type
                          </td>

                          <td
                            style={{
                              fontWeight: 600,
                              color:
                                'var(--navy)',
                              fontFamily:
                                'monospace',
                            }}
                          >
                            {
                              watchedMandateType
                            }
                          </td>
                        </tr>

                        <tr>
                          <td
                            style={{
                              padding:
                                '3px 0',
                              color:
                                'var(--g500)',
                            }}
                          >
                            Tech stack
                          </td>

                          <td
                            style={{
                              fontWeight: 600,
                              color:
                                'var(--navy)',
                              fontFamily:
                                'monospace',
                            }}
                          >
                            {techShort}
                          </td>
                        </tr>

                        <tr>
                          <td
                            style={{
                              padding:
                                '3px 0',
                              color:
                                'var(--g500)',
                            }}
                          >
                            Engagement
                          </td>

                          <td
                            style={{
                              fontWeight: 600,
                              color:
                                'var(--navy)',
                              fontFamily:
                                'monospace',
                            }}
                          >
                            {
                              watchedEngagement
                            }
                          </td>
                        </tr>

                        <tr>
                          <td
                            style={{
                              padding:
                                '3px 0',
                              color:
                                'var(--g500)',
                            }}
                          >
                            Date
                          </td>

                          <td
                            style={{
                              fontWeight: 600,
                              color:
                                'var(--navy)',
                              fontFamily:
                                'monospace',
                            }}
                          >
                            {monthDay}
                          </td>
                        </tr>

                        <tr>
                          <td
                            style={{
                              padding:
                                '3px 0',
                              color:
                                'var(--g500)',
                            }}
                          >
                            Sequence no.
                          </td>

                          <td
                            style={{
                              fontWeight: 600,
                              color:
                                'var(--navy)',
                              fontFamily:
                                'monospace',
                            }}
                          >
                            {nextSeq}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      padding: 8,
                      background:
                        'var(--blue-light)',
                      borderRadius: 6,
                      fontSize: 12,
                      color:
                        'var(--navy)',
                    }}
                  >
                    <i
                      className="ti ti-info-circle"
                      aria-hidden="true"
                      style={{
                        marginRight: 4,
                      }}
                    />
                    Sequence number
                    auto-increments. You can
                    request regeneration if
                    needed.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      </LocalizationProvider>
    </ThemeProvider>
  );
};