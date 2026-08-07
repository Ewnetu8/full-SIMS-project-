/**
 * Lecturer Service - Mock Bridge Layer
 * 
 * This is a temporary compatibility layer that provides mock data
 * for existing dashboard components while real API services are ready.
 * 
 * Components using this service:
 * - LecturerDashboard (stats, recent activity)
 * - CourseDetail (course info, students)
 * - ExamPreview (exam details)
 * - LecturerNotifications (notifications)
 * 
 * TODO: Replace mock data with real API calls from:
 * - questions-api.ts
 * - examinations-api.ts
 * - academic-api.ts
 */

import type { Course, LecturerExam, LecturerNotification, LecturerStats } from '../types';

export const lecturerService = {
  /**
   * Get lecturer dashboard statistics
   * TODO: Replace with real API endpoint
   */
  async getStats(): Promise<LecturerStats> {
    return {
      totalStudents: 0,
      totalCourses: 0,
      activeExams: 0,
      pendingGrading: 0,
    };
  },

  /**
   * Get lecturer's courses
   * TODO: Replace with getCourseOfferings from academic-api.ts
   */
  async getCourses(): Promise<Course[]> {
    return [];
  },

  /**
   * Get course by ID
   * TODO: Replace with getCourseOfferingById from academic-api.ts
   */
  async getCourseById(id: string): Promise<Course | null> {
    return null;
  },

  /**
   * Get lecturer's exams
   * TODO: Replace with getExaminations from examinations-api.ts
   */
  async getExams(): Promise<LecturerExam[]> {
    return [];
  },

  /**
   * Get exam by ID
   * TODO: Replace with getExaminationById from examinations-api.ts
   */
  async getExamById(id: string): Promise<LecturerExam | null> {
    return null;
  },

  /**
   * Get lecturer notifications
   * TODO: Backend endpoint not implemented yet
   */
  async getNotifications(): Promise<LecturerNotification[]> {
    return [];
  },

  /**
   * Mark notification as read
   * TODO: Backend endpoint not implemented yet
   */
  async markNotificationAsRead(id: string): Promise<void> {
    // No-op
  },

  /**
   * Get recent activity
   * TODO: Backend endpoint not implemented yet
   */
  async getRecentActivity(): Promise<any[]> {
    return [];
  },
};
