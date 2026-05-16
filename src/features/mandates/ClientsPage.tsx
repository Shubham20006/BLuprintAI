import React from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TextField,
  InputAdornment,
  LinearProgress,
  Chip
} from '@mui/material';
import { useClients } from '../../api/hooks';

export const ClientsPage: React.FC = () => {
  const [search, setSearch] = React.useState('');

  const { data: clients = [], isLoading } = useClients();

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.shortCode.toLowerCase().includes(search.toLowerCase()) ||
      c.tags?.some((tag: string) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #E5EBF0', px: 2, height: 60, display: 'flex', alignItems: 'center' }}>
        <Typography sx={{ fontSize: 15, color: '#111827', fontWeight: 500 }}>
          Clients ({clients.length})
        </Typography>
      </Box>

      <Box sx={{ p: 3 }}>
        <Card sx={{ mb: 3, borderRadius: 2 }}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <TextField
              size="small"
              placeholder="Search clients..."
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
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            {isLoading ? (
              <Box sx={{ p: 4 }}><LinearProgress /></Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#6B7C93', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Client Name</TableCell>
                    <TableCell sx={{ color: '#6B7C93', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Client Short Name</TableCell>
                    <TableCell sx={{ color: '#6B7C93', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((client) => (
                    <TableRow key={client.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>{client.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#475569' }}>
                          {client.shortCode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={client.status || 'inactive'} 
                          size="small" 
                          sx={{ 
                            bgcolor: client.status === 'active' ? '#DCFCE7' : '#FEE2E2', 
                            color: client.status === 'active' ? '#166534' : '#991B1B', 
                            fontWeight: 600, 
                            textTransform: 'capitalize', 
                            borderRadius: 1 
                          }} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} sx={{ textAlign: 'center', py: 4, color: '#6B7C93' }}>
                        No clients found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Box>
        </Card>
      </Box>
    </>
  );
};