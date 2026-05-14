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

import type { Candidate } from '../../types';

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
      <div className="topbar">
        <div className="topbar-left">
          <span className="breadcrumb">
            Candidates /{' '}
            <span>
              {filtered.length} of{' '}
              {candidates.length}
            </span>
          </span>
        </div>

        <div className="topbar-right">
          <div
            style={{
              display: 'flex',
              gap: 8,
            }}
          >
            <button
              className="btn btn-ghost btn-sm"
              onClick={() =>
                setImportOpen(true)
              }
            >
              <i className="ti ti-upload" />{' '}
              Import CSV
            </button>

            {currentUser &&
              can.importCandidates(
                currentUser.role
              ) && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() =>
                    handleOpen()
                  }
                >
                  <i className="ti ti-plus" />{' '}
                  Add Candidate
                </button>
              )}
          </div>
        </div>
      </div>

      <div className="content">
        <div className="panel">
          <div
            className="panel-hd"
            style={{
              padding: '12px 16px',
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <input
              className="form-input"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
            >
              <option value="">
                All Status
              </option>

              {STATUS_OPTIONS.map(
                (s) => (
                  <option
                    key={s}
                    value={s}
                  >
                    {s}
                  </option>
                )
              )}
            </select>

            <select
              className="form-select"
              value={coeFilter}
              onChange={(e) =>
                setCoeFilter(
                  e.target.value
                )
              }
            >
              <option value="">
                All COEs
              </option>

              {coes.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                >
                  {c.name}
                </option>
              ))}
            </select>

            <button
              className="btn btn-ghost btn-sm"
              onClick={() =>
                exportToCSV(
                  filtered.map((c) => ({
                    ...c,
                    skills:
                      c.skills.join(
                        ';'
                      ),
                  })),
                  'candidates'
                )
              }
            >
              <i className="ti ti-download" />{' '}
              Export
            </button>
          </div>

          <div style={{ padding: 0 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>COE</th>
                  <th>Stream</th>
                  <th>Skills</th>
                  <th>CGPA</th>
                  <th>Status</th>
                  <th
                    style={{
                      textAlign: 'right',
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((c) => {
                  // FIXED
                  const coe =
                    coes.find(
                      (co) =>
                        Number(
                          co.id
                        ) ===
                        Number(
                          c.coeId
                        )
                    );

                  return (
                    <tr key={c.id}>
                      <td>
                        <div
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'center',
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius:
                                '50%',
                              background:
                                'var(--blue)',
                              color:
                                '#fff',
                              display:
                                'flex',
                              alignItems:
                                'center',
                              justifyContent:
                                'center',
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {c.name
                              .split(' ')
                              .map(
                                (
                                  w
                                ) =>
                                  w[0]
                              )
                              .join('')
                              .slice(
                                0,
                                2
                              )}
                          </div>

                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                              }}
                            >
                              {c.name}
                            </div>

                            <div
                              style={{
                                fontSize: 12,
                                color:
                                  'var(--g500)',
                              }}
                            >
                              {c.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* FIXED */}
                      <td>
                        {coe?.name ||
                          'N/A'}
                      </td>

                      <td>
                        {c.stream}
                      </td>

                      <td>
                        <div
                          style={{
                            display:
                              'flex',
                            gap: 4,
                            flexWrap:
                              'wrap',
                          }}
                        >
                          {c.skills.map(
                            (s) => (
                              <span
                                key={s}
                                className="badge mapping"
                              >
                                {s}
                              </span>
                            )
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="badge active">
                          {c.cgpa}
                        </span>
                      </td>

                      <td>
                        <span className="badge mapping">
                          {c.status}
                        </span>
                      </td>

                      <td
                        style={{
                          textAlign:
                            'right',
                        }}
                      >
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() =>
                            handleOpen(
                              c
                            )
                          }
                        >
                          <i className="ti ti-edit" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {!isLoading &&
                  filtered.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          textAlign:
                            'center',
                          padding:
                            '40px 0',
                        }}
                      >
                        No candidates
                        found
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {open && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              maxWidth: 600,
            }}
          >
            <div className="modal-hd">
              <span className="modal-title">
                {editing
                  ? 'Edit Candidate'
                  : 'Add Candidate'}
              </span>

              <button
                className="btn-close"
                onClick={() =>
                  setOpen(false)
                }
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit(
                onSubmit
              )}
            >
              <div className="modal-body">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    gap: 16,
                  }}
                >
                  <Controller
                    name="name"
                    control={control}
                    render={({
                      field,
                    }) => (
                      <input
                        {...field}
                        placeholder="Name"
                        className="form-input"
                      />
                    )}
                  />

                  <Controller
                    name="email"
                    control={control}
                    render={({
                      field,
                    }) => (
                      <input
                        {...field}
                        placeholder="Email"
                        className="form-input"
                      />
                    )}
                  />

                  <Controller
                    name="phone"
                    control={control}
                    render={({
                      field,
                    }) => (
                      <input
                        {...field}
                        placeholder="Phone"
                        className="form-input"
                      />
                    )}
                  />

                  {/* FIXED */}
                  <Controller
                    name="coeId"
                    control={control}
                    render={({
                      field,
                    }) => (
                      <select
                        {...field}
                        value={
                          field.value ||
                          ''
                        }
                        onChange={(
                          e
                        ) =>
                          field.onChange(
                            Number(
                              e.target
                                .value
                            )
                          )
                        }
                        className="form-select"
                      >
                        <option value="">
                          Select COE
                        </option>

                        {coes.map(
                          (c) => (
                            <option
                              key={
                                c.id
                              }
                              value={
                                c.id
                              }
                            >
                              {
                                c.name
                              }
                            </option>
                          )
                        )}
                      </select>
                    )}
                  />

                  <Controller
                    name="graduationYear"
                    control={control}
                    render={({
                      field,
                    }) => (
                      <input
                        {...field}
                        type="number"
                        placeholder="Graduation Year (e.g. 2025)"
                        className="form-input"
                      />
                    )}
                  />

                  <Controller
                    name="stream"
                    control={control}
                    render={({
                      field,
                    }) => (
                      <input
                        {...field}
                        placeholder="Stream"
                        className="form-input"
                      />
                    )}
                  />

                  <div
                    style={{
                      gridColumn:
                        'span 2',
                    }}
                  >
                    <Controller
                      name="skills"
                      control={control}
                      render={({
                        field,
                      }) => (
                        <input
                          {...field}
                          placeholder="Java, React, Spring"
                          className="form-input"
                        />
                      )}
                    />
                  </div>

                  <Controller
                    name="cgpa"
                    control={control}
                    render={({
                      field,
                    }) => (
                      <input
                        {...field}
                        type="number"
                        step="0.1"
                        placeholder="CGPA (out of 10)"
                        className="form-input"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="modal-ft">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    setOpen(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    creating ||
                    updating
                  }
                >
                  {editing
                    ? 'Update Candidate'
                    : 'Add Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};