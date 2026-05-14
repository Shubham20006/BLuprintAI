import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  User, COE, Client, Mandate, Requirement, HiringDrive, Candidate,
  Mapping, MappingLineItem, Approval, DiscussionLog, LOI,
  Notification, AuditEvent,
} from '../types';

// ─── Users ────────────────────────────────────────────────────────────────────
export const useUsers = () =>
  useQuery({ queryKey: ['users'], queryFn: () => api.get<User[]>('/users') });

export const useUser = (id: string) =>
  useQuery({ queryKey: ['users', id], queryFn: () => api.get<User>(`/users/${id}`), enabled: !!id });

// ─── COEs ─────────────────────────────────────────────────────────────────────
export const useCOEs = () =>
  useQuery({ queryKey: ['coes'], queryFn: () => api.get<COE[]>('/coes') });

export const useCOE = (id: string) =>
  useQuery({ queryKey: ['coes', id], queryFn: () => api.get<COE>(`/coes/${id}`), enabled: !!id });

// ─── Clients ──────────────────────────────────────────────────────────────────
export const useClients = () =>
  useQuery({ queryKey: ['clients'], queryFn: () => api.get<Client[]>('/clients') });

// ─── Mandates ─────────────────────────────────────────────────────────────────
export const useMandates = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['mandates', params], queryFn: () => api.get<Mandate[]>('/mandates', params) });

export const useMandate = (id: string) =>
  useQuery({ queryKey: ['mandates', id], queryFn: () => api.get<Mandate>(`/mandates/${id}`), enabled: !!id });

export const useCreateMandate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Mandate>) => api.post<Mandate>('/mandates', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mandates'] }),
  });
};

export const useUpdateMandate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Mandate> & { id: string }) =>
      api.patch<Mandate>(`/mandates/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mandates'] }),
  });
};

// ─── Requirements ─────────────────────────────────────────────────────────────
export const useRequirements = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['requirements', params], queryFn: () => api.get<Requirement[]>('/requirements', params) });

export const useRequirement = (id: string) =>
  useQuery({ queryKey: ['requirements', id], queryFn: () => api.get<Requirement>(`/requirements/${id}`), enabled: !!id });

export const useCreateRequirement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Requirement>) => api.post<Requirement>('/requirements', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requirements'] }),
  });
};

export const useUpdateRequirement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Requirement> & { id: string }) =>
      api.patch<Requirement>(`/requirements/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requirements'] }),
  });
};

// ─── Hiring Drives ────────────────────────────────────────────────────────────
export const useHiringDrives = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['hiringDrives', params], queryFn: () => api.get<HiringDrive[]>('/hiringDrives', params) });

export const useHiringDrive = (id: string) =>
  useQuery({ queryKey: ['hiringDrives', id], queryFn: () => api.get<HiringDrive>(`/hiringDrives/${id}`), enabled: !!id });

export const useCreateHiringDrive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<HiringDrive>) => api.post<HiringDrive>('/hiringDrives', data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['hiringDrives'] });
      await qc.refetchQueries({ queryKey: ['hiringDrives'] });
    },
  });
};

// ─── Candidates ───────────────────────────────────────────────────────────────
export const useCandidates = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['candidates', params], queryFn: () => api.get<Candidate[]>('/candidates', params) });

export const useCandidate = (id: string) =>
  useQuery({ queryKey: ['candidates', id], queryFn: () => api.get<Candidate>(`/candidates/${id}`), enabled: !!id });

export const useCreateCandidate = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (
      data: Partial<Candidate>
    ) =>
      api.post<Candidate>(
        '/candidates',
        data
      ),

    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: ['candidates'],
      });

      await qc.refetchQueries({
        queryKey: ['candidates'],
      });
    },
  });
};
export const useUpdateCandidate = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: Partial<Candidate> & {
      id: string;
    }) =>
      api.patch<Candidate>(
        `/candidates/${id}`,
        data
      ),

    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: ['candidates'],
      });

      await qc.refetchQueries({
        queryKey: ['candidates'],
      });
    },
  });
};

// ─── Mappings ─────────────────────────────────────────────────────────────────
export const useMappings = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['mappings', params], queryFn: () => api.get<Mapping[]>('/mappings', params) });

export const useMapping = (id: string) =>
  useQuery({ queryKey: ['mappings', id], queryFn: () => api.get<Mapping>(`/mappings/${id}`), enabled: !!id });

export const useCreateMapping = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Mapping>) => api.post<Mapping>('/mappings', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mappings'] }),
  });
};

export const useUpdateMapping = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Mapping> & { id: string }) =>
      api.patch<Mapping>(`/mappings/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mappings'] });
    },
  });
};

// ─── Mapping Line Items ───────────────────────────────────────────────────────
export const useMappingLineItems = (mappingId?: string) =>
  useQuery({
    queryKey: ['mappingLineItems', mappingId],
    queryFn: () => api.get<MappingLineItem[]>('/mappingLineItems', mappingId ? { mappingId } : undefined),
    enabled: !!mappingId,
  });

export const useAllMappingLineItems = () =>
  useQuery({ queryKey: ['mappingLineItems'], queryFn: () => api.get<MappingLineItem[]>('/mappingLineItems') });

export const useCreateMappingLineItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<MappingLineItem>) => api.post<MappingLineItem>('/mappingLineItems', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mappingLineItems'] }),
  });
};

export const useDeleteMappingLineItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/mappingLineItems/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mappingLineItems'] }),
  });
};

// ─── Approvals ────────────────────────────────────────────────────────────────
export const useApprovals = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['approvals', params], queryFn: () => api.get<Approval[]>('/approvals', params) });

export const useCreateApproval = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Approval>) => api.post<Approval>('/approvals', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approvals'] });
      qc.invalidateQueries({ queryKey: ['mappings'] });
    },
  });
};

// ─── Discussion Logs ──────────────────────────────────────────────────────────
export const useDiscussionLogs = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['discussionLogs', params], queryFn: () => api.get<DiscussionLog[]>('/discussionLogs', params) });

export const useCreateDiscussionLog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DiscussionLog>) => api.post<DiscussionLog>('/discussionLogs', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['discussionLogs'] }),
  });
};

// ─── LOIs ─────────────────────────────────────────────────────────────────────
export const useLOIs = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['lois', params], queryFn: () => api.get<LOI[]>('/lois', params) });

export const useCreateLOI = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LOI>) => api.post<LOI>('/lois', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lois'] }),
  });
};

export const useUpdateLOI = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<LOI> & { id: string }) =>
      api.patch<LOI>(`/lois/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lois'] }),
  });
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const useNotifications = (userId?: string) =>
  useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => api.get<Notification[]>('/notifications', userId ? { userId } : undefined),
    refetchInterval: 30000,
  });

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<Notification>(`/notifications/${id}`, { read: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

// ─── Audit Events ─────────────────────────────────────────────────────────────
export const useAuditEvents = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['auditEvents', params], queryFn: () => api.get<AuditEvent[]>('/auditEvents', params) });
