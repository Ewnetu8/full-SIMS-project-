// ─── Academic Hierarchy API Service (Read-Only for Lecturers) ────────────────

import { api } from '@/services/api-client';
import { API_ENDPOINTS } from '@/constants';
import type {
  University,
  College,
  Department,
  Program,
  AcademicYear,
  Semester,
  Course,
  CoursePrerequisite,
  CourseOffering,
  Enrollment,
} from '@/types/lecturer';

/**
 * All endpoints in this service are READ-ONLY for lecturers.
 * Write operations (POST/PUT/PATCH/DELETE) require ADMIN role.
 */

// ─── Universities ─────────────────────────────────────────────────────────────

/**
 * List all universities.
 *
 * @returns Promise resolving to an array of universities
 */
export async function listUniversities(): Promise<University[]> {
  return api.get<University[]>(API_ENDPOINTS.UNIVERSITIES.ROOT);
}

/**
 * Get a single university by ID.
 *
 * @param id - University UUID
 * @returns Promise resolving to the university object
 */
export async function getUniversity(id: string): Promise<University> {
  return api.get<University>(API_ENDPOINTS.UNIVERSITIES.BY_ID(id));
}

// ─── Colleges ─────────────────────────────────────────────────────────────────

/**
 * List all colleges.
 *
 * @returns Promise resolving to an array of colleges
 */
export async function listColleges(): Promise<College[]> {
  return api.get<College[]>(API_ENDPOINTS.COLLEGES.ROOT);
}

/**
 * Get a single college by ID.
 *
 * @param id - College UUID
 * @returns Promise resolving to the college object
 */
export async function getCollege(id: string): Promise<College> {
  return api.get<College>(API_ENDPOINTS.COLLEGES.BY_ID(id));
}

// ─── Departments ──────────────────────────────────────────────────────────────

/**
 * List all departments.
 *
 * @returns Promise resolving to an array of departments
 */
export async function listDepartments(): Promise<Department[]> {
  return api.get<Department[]>(API_ENDPOINTS.DEPARTMENTS.ROOT);
}

/**
 * Get a single department by ID.
 *
 * @param id - Department UUID
 * @returns Promise resolving to the department object
 */
export async function getDepartment(id: string): Promise<Department> {
  return api.get<Department>(API_ENDPOINTS.DEPARTMENTS.BY_ID(id));
}

// ─── Programs ─────────────────────────────────────────────────────────────────

/**
 * List all programs.
 *
 * @returns Promise resolving to an array of programs
 */
export async function listPrograms(): Promise<Program[]> {
  return api.get<Program[]>(API_ENDPOINTS.PROGRAMS.ROOT);
}

/**
 * Get a single program by ID.
 *
 * @param id - Program UUID
 * @returns Promise resolving to the program object
 */
export async function getProgram(id: string): Promise<Program> {
  return api.get<Program>(API_ENDPOINTS.PROGRAMS.BY_ID(id));
}

// ─── Academic Years ───────────────────────────────────────────────────────────

/**
 * List all academic years.
 *
 * @returns Promise resolving to an array of academic years
 */
export async function listAcademicYears(): Promise<AcademicYear[]> {
  return api.get<AcademicYear[]>(API_ENDPOINTS.ACADEMIC_YEARS.ROOT);
}

/**
 * Get a single academic year by ID.
 *
 * @param id - Academic year UUID
 * @returns Promise resolving to the academic year object
 */
export async function getAcademicYear(id: string): Promise<AcademicYear> {
  return api.get<AcademicYear>(API_ENDPOINTS.ACADEMIC_YEARS.BY_ID(id));
}

// ─── Semesters ────────────────────────────────────────────────────────────────

/**
 * List all semesters.
 *
 * @returns Promise resolving to an array of semesters
 */
export async function listSemesters(): Promise<Semester[]> {
  return api.get<Semester[]>(API_ENDPOINTS.SEMESTERS.ROOT);
}

/**
 * Get a single semester by ID.
 *
 * @param id - Semester UUID
 * @returns Promise resolving to the semester object
 */
export async function getSemester(id: string): Promise<Semester> {
  return api.get<Semester>(API_ENDPOINTS.SEMESTERS.BY_ID(id));
}

// ─── Courses ──────────────────────────────────────────────────────────────────

/**
 * List all courses.
 *
 * @returns Promise resolving to an array of courses
 */
export async function listCourses(): Promise<Course[]> {
  return api.get<Course[]>(API_ENDPOINTS.COURSES.ROOT);
}

/**
 * Get a single course by ID.
 *
 * @param id - Course UUID
 * @returns Promise resolving to the course object
 */
export async function getCourse(id: string): Promise<Course> {
  return api.get<Course>(API_ENDPOINTS.COURSES.BY_ID(id));
}

// ─── Course Prerequisites ─────────────────────────────────────────────────────

/**
 * List all course prerequisites.
 *
 * @returns Promise resolving to an array of course prerequisites
 */
export async function listCoursePrerequisites(): Promise<CoursePrerequisite[]> {
  return api.get<CoursePrerequisite[]>(API_ENDPOINTS.COURSES.PREREQUISITES);
}

/**
 * Get a single course prerequisite by ID.
 *
 * @param id - Course prerequisite UUID
 * @returns Promise resolving to the course prerequisite object
 */
export async function getCoursePrerequisite(id: string): Promise<CoursePrerequisite> {
  return api.get<CoursePrerequisite>(API_ENDPOINTS.COURSES.PREREQUISITE_BY_ID(id));
}

// ─── Course Offerings ─────────────────────────────────────────────────────────

/**
 * List all course offerings.
 * This is the most important endpoint for lecturers, as they need to
 * select a course offering when creating an examination.
 *
 * @returns Promise resolving to an array of course offerings
 *
 * @example
 * const offerings = await listCourseOfferings();
 * // Filter by semester or course code on frontend if needed
 * const cs101Offerings = offerings.filter(
 *   (o) => o.course_detail.course_code === 'CS101'
 * );
 */
export async function listCourseOfferings(): Promise<CourseOffering[]> {
  return api.get<CourseOffering[]>(API_ENDPOINTS.COURSE_OFFERINGS.ROOT);
}

/**
 * Get a single course offering by ID.
 *
 * @param id - Course offering UUID
 * @returns Promise resolving to the course offering object
 */
export async function getCourseOffering(id: string): Promise<CourseOffering> {
  return api.get<CourseOffering>(API_ENDPOINTS.COURSE_OFFERINGS.BY_ID(id));
}

// ─── Enrollments ──────────────────────────────────────────────────────────────

/**
 * List all enrollments.
 * Lecturers can use this to see which students are enrolled in their course offerings.
 *
 * @returns Promise resolving to an array of enrollments
 *
 * @example
 * const enrollments = await listEnrollments();
 * // Filter by course offering to see students enrolled in a specific course
 * const courseEnrollments = enrollments.filter(
 *   (e) => e.course_offering === 'course-offering-uuid'
 * );
 */
export async function listEnrollments(): Promise<Enrollment[]> {
  return api.get<Enrollment[]>(API_ENDPOINTS.ENROLLMENTS.ROOT);
}

/**
 * Get a single enrollment by ID.
 *
 * @param id - Enrollment UUID
 * @returns Promise resolving to the enrollment object
 */
export async function getEnrollment(id: string): Promise<Enrollment> {
  return api.get<Enrollment>(API_ENDPOINTS.ENROLLMENTS.BY_ID(id));
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Get all course offerings for a specific course.
 *
 * @param courseId - Course UUID
 * @returns Promise resolving to an array of course offerings
 */
export async function getCourseOfferingsByCourse(
  courseId: string,
): Promise<CourseOffering[]> {
  const offerings = await listCourseOfferings();
  return offerings.filter((offering) => offering.course === courseId);
}

/**
 * Get all course offerings for a specific semester.
 *
 * @param semesterId - Semester UUID
 * @returns Promise resolving to an array of course offerings
 */
export async function getCourseOfferingsBySemester(
  semesterId: string,
): Promise<CourseOffering[]> {
  const offerings = await listCourseOfferings();
  return offerings.filter((offering) => offering.semester === semesterId);
}

/**
 * Get all enrollments for a specific course offering.
 * Useful for lecturers to see which students are enrolled in their courses.
 *
 * @param courseOfferingId - Course offering UUID
 * @returns Promise resolving to an array of enrollments
 */
export async function getEnrollmentsByCourseOffering(
  courseOfferingId: string,
): Promise<Enrollment[]> {
  const enrollments = await listEnrollments();
  return enrollments.filter((enrollment) => enrollment.course_offering === courseOfferingId);
}

/**
 * Get all courses for a specific program.
 *
 * @param programId - Program UUID
 * @returns Promise resolving to an array of courses
 */
export async function getCoursesByProgram(programId: string): Promise<Course[]> {
  const courses = await listCourses();
  return courses.filter((course) => course.program === programId);
}

/**
 * Get all programs for a specific department.
 *
 * @param departmentId - Department UUID
 * @returns Promise resolving to an array of programs
 */
export async function getProgramsByDepartment(departmentId: string): Promise<Program[]> {
  const programs = await listPrograms();
  return programs.filter((program) => program.department === departmentId);
}
