import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { universitiesApi } from '../services/universities-api';

import type {
  University,
  UniversityRequest,
  PatchedUniversityRequest,
} from '@/features/admin/types';

export const UNIVERSITY_QUERY_KEYS = {
  all: ['universities'] as const,
  lists: () => [...UNIVERSITY_QUERY_KEYS.all, 'list'] as const,
  details: () => [...UNIVERSITY_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...UNIVERSITY_QUERY_KEYS.details(), id] as const,
};

/**
 * Hook to fetch all universities.
 */
export function useUniversities() {
  return useQuery<University[], Error>({
    queryKey: UNIVERSITY_QUERY_KEYS.lists(),
    queryFn: () => universitiesApi.getUniversities(),
    staleTime: 60_000,
  });
}

/**
 * Hook to fetch a single university by ID.
 */
export function useUniversity(id: string, enabled = true) {
  return useQuery<University, Error>({
    queryKey: UNIVERSITY_QUERY_KEYS.detail(id),
    queryFn: () => universitiesApi.getUniversity(id),
    enabled: Boolean(id) && enabled,
    staleTime: 60_000,
  });
}

/**
 * Mutation hook to create a new university.
 */
export function useCreateUniversity() {
  const queryClient = useQueryClient();

  return useMutation<University, Error, UniversityRequest>({
    mutationFn: (data) => universitiesApi.createUniversity(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: UNIVERSITY_QUERY_KEYS.all });
    },
  });
}

/**
 * Mutation hook to update a university (PUT).
 */
export function useUpdateUniversity() {
  const queryClient = useQueryClient();

  return useMutation<University, Error, { id: string; data: UniversityRequest }>({
    mutationFn: ({ id, data }) => universitiesApi.updateUniversity(id, data),
    onSuccess: (updatedUni) => {
      void queryClient.invalidateQueries({ queryKey: UNIVERSITY_QUERY_KEYS.all });
      queryClient.setQueryData(UNIVERSITY_QUERY_KEYS.detail(updatedUni.id), updatedUni);
    },
  });
}

/**
 * Mutation hook to partially update a university (PATCH).
 */
export function usePatchUniversity() {
  const queryClient = useQueryClient();

  return useMutation<University, Error, { id: string; data: PatchedUniversityRequest }>({
    mutationFn: ({ id, data }) => universitiesApi.patchUniversity(id, data),
    onSuccess: (updatedUni) => {
      void queryClient.invalidateQueries({ queryKey: UNIVERSITY_QUERY_KEYS.all });
      queryClient.setQueryData(UNIVERSITY_QUERY_KEYS.detail(updatedUni.id), updatedUni);
    },
  });
}

/**
 * Mutation hook to delete a university (DELETE).
 */
export function useDeleteUniversity() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => universitiesApi.deleteUniversity(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: UNIVERSITY_QUERY_KEYS.all });
    },
  });
}
