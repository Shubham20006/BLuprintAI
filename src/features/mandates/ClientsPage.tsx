import React from 'react';
import { useClients } from '../../api/hooks';
import { PageLoader } from '../../components/shared';

export const ClientsPage: React.FC = () => {
  const [search, setSearch] =
    React.useState('');

  const {
    data: clients = [],
    isLoading,
  } = useClients();

  const filtered = clients.filter(
    (c) =>
      c.name
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      c.shortCode
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      c.tags?.some((tag: string) =>
        tag
          .toLowerCase()
          .includes(search.toLowerCase())
      )
  );

  return (
    <>
      <div className="topbar">
        <div className="topbar-left" style={{color:"black"}}>
          <span>
            Clients ({clients.length})
          </span>
        </div>
      </div>

      <div className="content">

        {/* SEARCH */}
        <div
          className="panel"
          style={{
            marginBottom: 20,
            width: '40%',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <div
            className="panel-hd"
            style={{
              background: 'var(--g50)',
              borderBottom:
                '1px solid var(--g200)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                gap: 12,
              }}
            >
              <i
                className="ti ti-search"
                style={{
                  color: 'var(--g400)',
                }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Search clients..."
                style={{
                  border: 'none',
                  background:
                    'transparent',
                  padding: 0,
                  boxShadow: 'none',
                }}
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div
          className="panel"
          style={{
            borderRadius: 10,
            overflow: 'hidden',
            border:
              '1px solid var(--g200)',
          }}
        >
          <div
            className="panel-body"
            style={{
              padding: 0,
            }}
          >
            {isLoading ? (
              <PageLoader message="Loading clients..." />
            ) : (
              <table
                className="tbl"
                style={{
                  width: '100%',
                  borderCollapse:
                    'separate',
                  borderSpacing: 0,
                }}
              >
              <thead>
                <tr>
                  <th
                    style={{
                      borderTopLeftRadius: 10,
                      height: "40px",
                    }}
                  >
                    Client Name
                  </th>

                  <th>
                    Client Short Name
                  </th>
                  <th
                    style={{
                      borderTopRightRadius: 10,
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((client) => (
                  <tr key={client.id}>
                    {/* NAME */}
                    <td>
                      <div
                        style={{
                          fontWeight: 600,
                          color:
                            'var(--navy)',
                        }}
                      >
                        {client.name}
                      </div>
                    </td>

                    {/* SHORT CODE */}
                    <td>
                      <span
                        style={{
                          fontFamily:
                            'monospace',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {client.shortCode}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td>
                      <span
                        className={`badge ${
                          client.status ===
                          'active'
                            ? 'active'
                            : 'draft'
                        }`}
                      >
                        {client.status ||
                          'inactive'}
                      </span>
                    </td>
                  </tr>
                ))}

                {!isLoading &&
                  filtered.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          textAlign:
                            'center',
                          padding:
                            '40px 0',
                          color:
                            'var(--g500)',
                        }}
                      >
                        No clients found
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
};