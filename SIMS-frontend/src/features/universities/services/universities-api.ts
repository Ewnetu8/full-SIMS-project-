import { API_ENDPOINTS } from '@/constants/api-endpoints';
import { api } from '@/services/api-client';

import type {
  University,
  UniversityRequest,
  PatchedUniversityRequest,
} from '@/features/admin/types';

export const universitiesApi = {
  /**
   * List all universities (ADMIN only).
   */
  async getUniversities(): Promise<University[]> {
    const response = await api.get<University[] | { results: University[] }>(
      API_ENDPOINTS.UNIVERSITIES.ROOT
    );

    if (Array.isArray(response)) {
      return response;
    }
    if (response && Array.isArray((response as { results: University[] }).results)) {
      return (response as { results: University[] }).results;
    }
    return [];
  },

  /**
   * Get a single university by ID.
   */
  async getUniversity(id: string): Promise<University> {
    return api.get<University>(API_ENDPOINTS.UNIVERSITIES.BY_ID(id));
  },

  /**
   * Create a new university.
   */
  async createUniversity(data: UniversityRequest): Promise<University> {
    return api.post<University>(API_ENDPOINTS.UNIVERSITIES.ROOT, data);
  },

  /**
   * Full update of a university (PUT).
   */
  async updateUniversity(id: string, data: UniversityRequest): Promise<University> {
    return api.put<University>(API_ENDPOINTS.UNIVERSITIES.BY_ID(id), data);
  },

  /**
   * Partial update of a university (PATCH).
   */
  async patchUniversity(id: string, data: PatchedUniversityRequest): Promise<University> {
    return api.patch<University>(API_ENDPOINTS.UNIVERSITIES.BY_ID(id), data);
  },

  /**
   * Delete a university (DELETE).
   */
  async deleteUniversity(id: string): Promise<void> {
    await api.delete<void>(API_ENDPOINTS.UNIVERSITIES.BY_ID(id));
  },
};
