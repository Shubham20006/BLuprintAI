import React from 'react';
import {
  Box, Typography, Table, TableBody, TableCell,
  TableHead, TableRow, Chip, Avatar,
} from '@mui/material';
import { useUsers, useCOEs } from '../../api/hooks';
import { PageHeader, SectionCard, RoleBadge } from '../../components/shared';
import type { User } from '../../types';

export const AdminUsersPage: React.FC = () => {
  const { data: users = [] } = useUsers();
  const { data: coes = [] } = useCOEs();

  const getCoeName = (coeId: string) =>
    coes.find((c) => c.id === coeId)?.name.split(' ').slice(0, 2).join(' ') || coeId;

  return (
    <Box>
      <PageHeader
        title="User Management"
        subtitle="All provisioned system users (backend-managed)"
      />

      <SectionCard>
        <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>COE Scope</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 36, height: 36, fontSize: '0.8rem', fontWeight: 700, bgcolor: 'primary.main' }}>
                        {user.avatar}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{user.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><RoleBadge role={user.role} /></TableCell>
                  <TableCell>
                    {user.coeScopeIds.length === 0 ? (
                      <Chip label="All COEs" size="small" color="primary" sx={{ fontWeight: 700 }} />
                    ) : (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {user.coeScopeIds.map((coeId) => (
                          <Chip key={coeId} label={getCoeName(coeId)} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                        ))}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.status}
                      size="small"
                      color={user.status === 'active' ? 'success' : 'default'}
                      sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </SectionCard>
    </Box>
  );
};
