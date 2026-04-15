import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export function useData(resource) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // Queries
  const query = useQuery({
    queryKey: [resource],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/${resource}.php`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status !== 'success') throw new Error(data.message);
      return data.data;
    },
    enabled: !!token,
  });

  // Generic Mutation
  const mutation = useMutation({
    mutationFn: async ({ method, body, id }) => {
      const url = id ? `${API_BASE}/${resource}.php?id=${id}` : `${API_BASE}/${resource}.php`;
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json();
      if (data.status !== 'success') throw new Error(data.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
      // Extra invalidations for related data
      if (resource === 'payments' || resource === 'appointments' || resource === 'patients') {
        queryClient.invalidateQueries({ queryKey: ['cashflow'] });
      }
      if (resource === 'payments') {
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
        queryClient.invalidateQueries({ queryKey: ['debts'] });
      }
    }
  });

  return {
    ...query,
    mutate: mutation.mutateAsync,
    isMutating: mutation.isPending ?? mutation.isLoading,
  };
}

// Special hook for Dashboard (Cashflow)
export function useDashboard() {
  const { token } = useAuth();
  return useQuery({
    queryKey: ['cashflow'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/cashflow.php`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      return data.data;
    },
    enabled: !!token,
  });
}
