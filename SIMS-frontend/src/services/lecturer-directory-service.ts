import { api } from './api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

export interface LecturerProfileSummary {
  id: string;
  faculty_identifier?: string;
  user_full_name?: string;
  user_email?: string;
  department_name?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class LecturerDirectoryService {
  private cache = new Map<string, LecturerProfileSummary>();
  private fetchPromise: Promise<Map<string, LecturerProfileSummary>> | null = null;

  /**
   * Pre-loads all lecturers from backend GET /api/v1/lecturers into memory cache.
   */
  async loadLecturers(): Promise<Map<string, LecturerProfileSummary>> {
    if (this.cache.size > 0) return this.cache;
    if (this.fetchPromise) return this.fetchPromise;

    this.fetchPromise = (async () => {
      try {
        const data = await api.get<any>(API_ENDPOINTS.LECTURERS.ROOT);
        const list = Array.isArray(data) ? data : data?.results || data?.data || [];
        for (const item of list) {
          if (!item?.id) continue;
          const fullName =
            item.user_full_name ||
            (item.user && typeof item.user === 'object'
              ? `${item.user.first_name || ''} ${item.user.last_name || ''}`.trim()
              : '') ||
            (item.user_first_name || item.user_last_name
              ? `${item.user_first_name || ''} ${item.user_last_name || ''}`.trim()
              : '') ||
            item.faculty_identifier ||
            'Faculty Instructor';

          this.cache.set(item.id, {
            id: item.id,
            faculty_identifier: item.faculty_identifier,
            user_full_name: fullName,
            user_email: item.user_email,
            department_name: item.department_detail?.name,
          });
        }
      } catch (err) {
        console.warn('[LecturerDirectoryService] Failed to load lecturers:', err);
      } finally {
        this.fetchPromise = null;
      }
      return this.cache;
    })();

    return this.fetchPromise;
  }

  /**
   * Asynchronously resolves a lecturer UUID or identifier to a human-readable display name.
   */
  async resolveLecturerName(lecturerId?: string | null): Promise<string> {
    if (!lecturerId) return 'Faculty Instructor';
    const trimmed = lecturerId.trim();

    // If it's already a non-UUID human-readable name, return it directly
    if (!UUID_REGEX.test(trimmed)) {
      return trimmed;
    }

    if (this.cache.has(trimmed)) {
      return this.cache.get(trimmed)!.user_full_name || 'Faculty Instructor';
    }

    await this.loadLecturers();
    if (this.cache.has(trimmed)) {
      return this.cache.get(trimmed)!.user_full_name || 'Faculty Instructor';
    }

    // Direct single lookup fallback: GET /api/v1/lecturers/{id}
    try {
      const item = await api.get<any>(API_ENDPOINTS.LECTURERS.BY_ID(trimmed));
      if (item) {
        const fullName =
          item.user_full_name ||
          (item.user_first_name || item.user_last_name
            ? `${item.user_first_name || ''} ${item.user_last_name || ''}`.trim()
            : '') ||
          (item.user && typeof item.user === 'object'
            ? `${item.user.first_name || ''} ${item.user.last_name || ''}`.trim()
            : '') ||
          item.faculty_identifier ||
          'Faculty Instructor';

        this.cache.set(trimmed, {
          id: trimmed,
          faculty_identifier: item.faculty_identifier,
          user_full_name: fullName,
          user_email: item.user_email,
          department_name: item.department_detail?.name,
        });
        return fullName;
      }
    } catch {
      // Fall through to clean fallback
    }

    return 'Faculty Instructor';
  }

  /**
   * Synchronously looks up a lecturer name from cached directory.
   * If not yet cached or if given a UUID that isn't cached, returns 'Faculty Instructor' instead of the raw UUID.
   */
  getLecturerNameSync(lecturerId?: string | null): string {
    if (!lecturerId) return 'Faculty Instructor';
    const trimmed = lecturerId.trim();

    if (!UUID_REGEX.test(trimmed)) {
      return trimmed;
    }

    const cached = this.cache.get(trimmed);
    return cached?.user_full_name || 'Faculty Instructor';
  }
}

export const lecturerDirectoryService = new LecturerDirectoryService();
