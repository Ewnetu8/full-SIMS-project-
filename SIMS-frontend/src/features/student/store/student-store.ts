import { create } from 'zustand';
import { studentService } from '../services/student.service';
import type {
  Enrollment,
  Examination,
  Notification,
  Course,
  CourseOffering,
} from '../types/student.types';

function formatErrorMessage(err: any, fallback: string): string {
  const detail =
    typeof err?.detail === 'string'
      ? err.detail
      : typeof err?.message === 'string'
      ? err.message
      : '';

  if (detail.includes('has no student profile')) {
    return 'Your account is not currently linked to an active student profile in SIMS. Please contact your administrator.';
  }
  if (err?.status === 401 || err?.response?.status === 401) {
    return 'Your session has expired. Please sign in again.';
  }
  if (err?.status === 403 || err?.response?.status === 403) {
    return "You don't have permission to access this information.";
  }
  if (
    detail &&
    !detail.startsWith('HTTP') &&
    !detail.startsWith('AxiosError') &&
    !detail.includes('Request failed') &&
    !detail.includes('400') &&
    !detail.includes('500')
  ) {
    return detail;
  }
  return fallback;
}

interface StudentState {
  enrollments: Enrollment[];
  activeExams: Examination[];
  notifications: Notification[];
  courses: Course[];
  courseOfferings: CourseOffering[];

  isLoadingEnrollments: boolean;
  isLoadingExams: boolean;
  isLoadingNotifications: boolean;
  isLoadingCourses: boolean;

  enrollmentsError: string | null;
  examsError: string | null;
  notificationsError: string | null;
  coursesError: string | null;

  fetchEnrollments: () => Promise<void>;
  fetchActiveExams: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchCourses: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  enrollments: [],
  activeExams: [],
  notifications: [],
  courses: [],
  courseOfferings: [],

  isLoadingEnrollments: false,
  isLoadingExams: false,
  isLoadingNotifications: false,
  isLoadingCourses: false,

  enrollmentsError: null,
  examsError: null,
  notificationsError: null,
  coursesError: null,
};

export const useStudentStore = create<StudentState>()((set, get) => ({
  ...initialState,

  fetchEnrollments: async () => {
    set({ isLoadingEnrollments: true, enrollmentsError: null });
    try {
      const enrollments = await studentService.getEnrollments();
      set({ enrollments, isLoadingEnrollments: false });
    } catch (err: any) {
      const message = formatErrorMessage(
        err,
        "We couldn't load your enrolled courses. Please try again."
      );
      set({ enrollmentsError: message, isLoadingEnrollments: false });
    }
  },

  fetchActiveExams: async () => {
    set({ isLoadingExams: true, examsError: null });
    try {
      const activeExams = await studentService.getActiveExams();
      set({ activeExams, isLoadingExams: false });
    } catch (err: any) {
      const message = formatErrorMessage(
        err,
        "We couldn't load active examinations. Please try again."
      );
      set({ examsError: message, isLoadingExams: false });
    }
  },

  fetchNotifications: async () => {
    set({ isLoadingNotifications: true, notificationsError: null });
    try {
      const notifications = await studentService.getNotifications();
      set({ notifications, isLoadingNotifications: false });
    } catch {
      set({ notifications: [], notificationsError: null, isLoadingNotifications: false });
    }
  },

  fetchCourses: async () => {
    set({ isLoadingCourses: true, coursesError: null });
    try {
      const [courses, courseOfferings] = await Promise.all([
        studentService.getCourses(),
        studentService.getCourseOfferings(),
      ]);
      set({ courses, courseOfferings, isLoadingCourses: false });
    } catch (err: any) {
      const message = formatErrorMessage(
        err,
        "We couldn't load course offerings. Please try again."
      );
      set({ coursesError: message, isLoadingCourses: false });
    }
  },

  markNotificationAsRead: async (id: string) => {
    // Optimistic UI update
    const previous = get().notifications;
    set({
      notifications: previous.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
    });

    try {
      await studentService.markNotificationAsRead(id);
    } catch (err) {
      // Rollback on error
      set({ notifications: previous });
    }
  },

  markAllNotificationsAsRead: async () => {
    const unread = get().notifications.filter((n) => !n.is_read);
    if (unread.length === 0) return;

    // Optimistically mark all read locally
    const previous = get().notifications;
    set({
      notifications: previous.map((n) => ({ ...n, is_read: true })),
    });

    try {
      await Promise.all(
        unread.map((n) => studentService.markNotificationAsRead(n.id))
      );
    } catch (err) {
      // Rollback on failure
      set({ notifications: previous });
    }
  },

  reset: () => set(initialState),
}));
