'use client';

import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Eye,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  GraduationCap,
  Building2,
  Layers,
  ChevronLeft,
  ChevronRight,
  Hash,
  Clock,
  Calendar,
  Layers3,
  Users,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { ConfirmationDialog, toast } from '@/components/feedback';
import { Label } from '@/components/forms';
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  SearchInput,
} from '@/components/ui';
import { getUserFriendlyErrorMessage, parseFieldErrors } from '@/lib/errors';

import { useAdminStore } from '../store';

import type { Course, ClassStanding, AdminCourseOffering } from '../types';

const CLASS_STANDING_LABELS: Record<ClassStanding, string> = {
  FRESHMAN: 'Freshman',
  SOPHOMORE: 'Sophomore',
  JUNIOR: 'Junior',
  SENIOR: 'Senior',
  GRADUATE: 'Graduate',
};

const CLASS_STANDING_BADGES: Record<ClassStanding, string> = {
  FRESHMAN: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  SOPHOMORE: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  JUNIOR: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
  SENIOR: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  GRADUATE: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
};

export interface CourseManagementProps {
  initialTab?: 'courses' | 'offerings';
}

export function CourseManagement({ initialTab }: CourseManagementProps = {}) {
  const router = useRouter();

  const {
    courses,
    courseOfferings,
    semesters,
    programs,
    departments,
    isLoadingCourses,
    coursesError,
    isLoadingCourseOfferings,
    courseOfferingsError,
    isLoadingPrograms,
    isLoadingDepartments,
    isLoadingSemesters,
    courseSearchQuery,
    courseProgramFilter,
    courseStandingFilter,
    courseDeptFilter,
    fetchCourses,
    fetchCourseOfferings,
    fetchSemesters,
    fetchPrograms,
    fetchDepartments,
    fetchCourseById,
    fetchCourseOfferingById,
    addCourse,
    updateCourse,
    deleteCourse,
    addCourseOffering,
    updateCourseOffering,
    deleteCourseOffering,
    setCourseSearchQuery,
    setCourseProgramFilter,
    setCourseStandingFilter,
    setCourseDeptFilter,
  } = useAdminStore();

  // Active Tab State
  const [activeTab, setActiveTab] = React.useState<'courses' | 'offerings'>(initialTab || 'courses');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'offerings' || initialTab === 'offerings') {
        setActiveTab('offerings');
      } else if (tabParam === 'courses') {
        setActiveTab('courses');
      }
    }
  }, [initialTab]);

  const handleTabChange = (tab: 'courses' | 'offerings') => {
    setActiveTab(tab);
    if (tab === 'offerings') {
      router.replace('/admin/courses?tab=offerings');
    } else {
      router.replace('/admin/courses');
    }
  };

  // ── COURSES STATE ────────────────────────────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingCourse, setEditingCourse] = React.useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = React.useState<Course | null>(null);
  const [viewingCourseId, setViewingCourseId] = React.useState<string | null>(null);
  const [detailedCourse, setDetailedCourse] = React.useState<Course | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);

  const [courseFormData, setCourseFormData] = React.useState<{
    code: string;
    title: string;
    creditHours: number;
    programId: string;
    intendedClassStanding: ClassStanding | '';
  }>({
    code: '',
    title: '',
    creditHours: 3,
    programId: '',
    intendedClassStanding: 'FRESHMAN',
  });

  const [courseFieldErrors, setCourseFieldErrors] = React.useState<Record<string, string>>({});
  const [courseFormError, setCourseFormError] = React.useState<string | null>(null);
  const [isSubmittingCourse, setIsSubmittingCourse] = React.useState(false);
  const [isDeletingCourse, setIsDeletingCourse] = React.useState(false);
  const [coursePage, setCoursePage] = React.useState(1);

  // ── COURSE OFFERINGS STATE ───────────────────────────────────────────────
  const [isOfferingModalOpen, setIsOfferingModalOpen] = React.useState(false);
  const [editingOffering, setEditingOffering] = React.useState<AdminCourseOffering | null>(null);
  const [deletingOffering, setDeletingOffering] = React.useState<AdminCourseOffering | null>(null);
  const [viewingOffering, setViewingOffering] = React.useState<AdminCourseOffering | null>(null);

  const [offeringSearchQuery, setOfferingSearchQuery] = React.useState('');
  const [offeringSemesterFilter, setOfferingSemesterFilter] = React.useState('ALL');
  const [offeringCourseFilter, setOfferingCourseFilter] = React.useState('ALL');

  const [offeringFormData, setOfferingFormData] = React.useState({
    course: '',
    semester: '',
    section: 'A',
    capacity: 50,
  });

  const [offeringFieldErrors, setOfferingFieldErrors] = React.useState<Record<string, string>>({});
  const [offeringFormError, setOfferingFormError] = React.useState<string | null>(null);
  const [isSubmittingOffering, setIsSubmittingOffering] = React.useState(false);
  const [isDeletingOffering, setIsDeletingOffering] = React.useState(false);
  const [offeringPage, setOfferingPage] = React.useState(1);

  const itemsPerPage = 10;

  // Initial Data Fetch
  React.useEffect(() => {
    void fetchCourses();
    void fetchCourseOfferings();
    void fetchSemesters();
    void fetchPrograms();
    void fetchDepartments();
  }, [fetchCourses, fetchCourseOfferings, fetchSemesters, fetchPrograms, fetchDepartments]);

  // Department Resolver (safely checks Course -> Program -> Department)
  const getDepartmentName = React.useCallback(
    (course: Course): string => {
      if (course.programDetail?.department_detail?.name) {
        return course.programDetail.department_detail.name;
      }
      if (course.programDetail?.department) {
        const dept = departments.find((d) => d.id === course.programDetail?.department);
        if (dept?.name) return dept.name;
      }
      if (course.program) {
        const prog = programs.find((p) => p.id === course.program);
        if (prog?.department_detail?.name) return prog.department_detail.name;
        if (prog?.department) {
          const dept = departments.find((d) => d.id === prog.department);
          if (dept?.name) return dept.name;
        }
      }
      return '—';
    },
    [departments, programs]
  );

  // Program Resolver
  const getProgramDisplay = React.useCallback(
    (course: Course): { name: string; code?: string; degreeLevel?: string } => {
      if (course.programDetail?.name) {
        return {
          name: course.programDetail.name,
          code: course.programDetail.code,
          degreeLevel: course.programDetail.degreeLevel,
        };
      }
      if (course.program) {
        const matched = programs.find((p) => p.id === course.program);
        if (matched?.name) {
          return {
            name: matched.name,
            code: matched.code,
            degreeLevel: matched.degreeLevel,
          };
        }
      }
      return { name: 'Unassigned' };
    },
    [programs]
  );

  // ── COURSES HANDLERS ─────────────────────────────────────────────────────
  const handleOpenViewDetails = async (courseId: string) => {
    setViewingCourseId(courseId);
    setIsLoadingDetail(true);
    setDetailError(null);
    try {
      const course = await fetchCourseById(courseId);
      setDetailedCourse(course);
    } catch (err: unknown) {
      setDetailError(getUserFriendlyErrorMessage(err));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleOpenAddModal = () => {
    setCourseFieldErrors({});
    setCourseFormError(null);
    setCourseFormData({
      code: '',
      title: '',
      creditHours: 3,
      programId: programs[0]?.id || '',
      intendedClassStanding: 'FRESHMAN',
    });
    setEditingCourse(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (course: Course) => {
    setCourseFieldErrors({});
    setCourseFormError(null);
    setEditingCourse(course);
    setCourseFormData({
      code: course.code,
      title: course.title || course.name,
      creditHours: course.creditHours,
      programId: course.program || course.programDetail?.id || '',
      intendedClassStanding: (course.intendedClassStanding as ClassStanding) || 'FRESHMAN',
    });
    setIsAddModalOpen(true);
  };

  const validateCourseForm = () => {
    const errors: Record<string, string> = {};
    if (!courseFormData.code.trim()) {
      errors.course_code = 'Course code is required.';
    } else if (courseFormData.code.length > 20) {
      errors.course_code = 'Course code must not exceed 20 characters.';
    }

    if (!courseFormData.title.trim()) {
      errors.title = 'Course title is required.';
    } else if (courseFormData.title.length > 255) {
      errors.title = 'Course title must not exceed 255 characters.';
    }

    if (Number(courseFormData.creditHours) < 0 || isNaN(Number(courseFormData.creditHours))) {
      errors.credit_hours = 'Credit hours must be a positive number.';
    }

    setCourseFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCourseForm()) return;

    setIsSubmittingCourse(true);
    setCourseFieldErrors({});
    setCourseFormError(null);

    const payload = {
      course_code: courseFormData.code.trim().toUpperCase(),
      title: courseFormData.title.trim(),
      credit_hours: Number(courseFormData.creditHours),
      program: courseFormData.programId ? courseFormData.programId : null,
      intended_class_standing: courseFormData.intendedClassStanding
        ? (courseFormData.intendedClassStanding as ClassStanding)
        : undefined,
    };

    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, payload);
        toast.success('Course updated successfully.');
        setEditingCourse(null);
      } else {
        await addCourse(payload);
        toast.success('Course created successfully.');
      }
      setIsAddModalOpen(false);
    } catch (err: unknown) {
      const parsedErrors = parseFieldErrors(err);
      if (Object.keys(parsedErrors).length > 0) {
        setCourseFieldErrors(parsedErrors);
      } else {
        setCourseFormError(getUserFriendlyErrorMessage(err));
      }
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deletingCourse) return;
    setIsDeletingCourse(true);
    try {
      await deleteCourse(deletingCourse.id);
      toast.success('Course deleted successfully.');
      setDeletingCourse(null);
    } catch {
      toast.error(
        'This course could not be deleted because it is currently referenced by another academic record (e.g. course offering or prerequisite).'
      );
    } finally {
      setIsDeletingCourse(false);
    }
  };

  // ── COURSE OFFERING HANDLERS ─────────────────────────────────────────────
  const handleOpenAddOffering = () => {
    setOfferingFieldErrors({});
    setOfferingFormError(null);
    setOfferingFormData({
      course: courses[0]?.id || '',
      semester: semesters[0]?.id || '',
      section: 'A',
      capacity: 50,
    });
    setEditingOffering(null);
    setIsOfferingModalOpen(true);
  };

  const handleOpenEditOffering = (offering: AdminCourseOffering) => {
    setOfferingFieldErrors({});
    setOfferingFormError(null);
    setEditingOffering(offering);
    setOfferingFormData({
      course: offering.course || offering.course_detail?.id || '',
      semester: offering.semester || offering.semester_detail?.id || '',
      section: offering.section || 'A',
      capacity: offering.capacity || 50,
    });
    setIsOfferingModalOpen(true);
  };

  const handleSaveOffering = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfferingFieldErrors({});
    setOfferingFormError(null);

    const errors: Record<string, string> = {};
    if (!offeringFormData.course.trim()) {
      errors.course = 'Please select a course.';
    }
    if (!offeringFormData.semester.trim()) {
      errors.semester = 'Please select an academic semester.';
    }
    if (!offeringFormData.section.trim()) {
      errors.section = 'Section identifier is required (e.g. A).';
    }
    if (Number(offeringFormData.capacity) < 1) {
      errors.capacity = 'Capacity must be at least 1 student.';
    }

    if (Object.keys(errors).length > 0) {
      setOfferingFieldErrors(errors);
      return;
    }

    setIsSubmittingOffering(true);
    try {
      if (editingOffering) {
        await updateCourseOffering(editingOffering.id, {
          course: offeringFormData.course.trim(),
          semester: offeringFormData.semester.trim(),
          section: offeringFormData.section.trim().toUpperCase(),
          capacity: Number(offeringFormData.capacity),
        });
        toast.success('Course offering updated successfully.');
        setEditingOffering(null);
      } else {
        await addCourseOffering({
          course: offeringFormData.course.trim(),
          semester: offeringFormData.semester.trim(),
          section: offeringFormData.section.trim().toUpperCase(),
          capacity: Number(offeringFormData.capacity),
        });
        toast.success('Course offering scheduled successfully.');
      }
      setIsOfferingModalOpen(false);
    } catch (err: unknown) {
      const parsedErrors = parseFieldErrors(err);
      if (Object.keys(parsedErrors).length > 0) {
        setOfferingFieldErrors(parsedErrors);
      } else {
        setOfferingFormError(getUserFriendlyErrorMessage(err));
      }
    } finally {
      setIsSubmittingOffering(false);
    }
  };

  const handleDeleteOffering = async () => {
    if (!deletingOffering) return;
    setIsDeletingOffering(true);
    try {
      await deleteCourseOffering(deletingOffering.id);
      toast.success('Course offering removed successfully.');
      setDeletingOffering(null);
    } catch {
      toast.error(
        'Cannot remove this course offering because active student enrollments or teaching assignments depend on it.'
      );
    } finally {
      setIsDeletingOffering(false);
    }
  };

  // ── FILTERED DATA ────────────────────────────────────────────────────────
  const filteredCourses = React.useMemo(() => {
    return courses.filter((c) => {
      if (courseSearchQuery.trim()) {
        const q = courseSearchQuery.toLowerCase().trim();
        const codeMatch = c.code.toLowerCase().includes(q);
        const nameMatch = (c.name || c.title || '').toLowerCase().includes(q);
        if (!codeMatch && !nameMatch) return false;
      }
      if (courseProgramFilter !== 'ALL') {
        const progId = c.program || c.programDetail?.id;
        if (progId !== courseProgramFilter) return false;
      }
      if (courseDeptFilter !== 'ALL') {
        const courseDeptId =
          c.programDetail?.department_detail?.id ||
          c.programDetail?.department ||
          programs.find((p) => p.id === (c.program || c.programDetail?.id))?.department;
        if (courseDeptId !== courseDeptFilter) return false;
      }
      if (courseStandingFilter !== 'ALL') {
        if (c.intendedClassStanding !== courseStandingFilter) return false;
      }
      return true;
    });
  }, [courses, courseSearchQuery, courseProgramFilter, courseDeptFilter, courseStandingFilter, programs]);

  const paginatedCourses = React.useMemo(() => {
    const start = (coursePage - 1) * itemsPerPage;
    return filteredCourses.slice(start, start + itemsPerPage);
  }, [filteredCourses, coursePage, itemsPerPage]);

  const courseTotalPages = Math.ceil(filteredCourses.length / itemsPerPage) || 1;

  // Filtered Offerings
  const filteredOfferings = React.useMemo(() => {
    return courseOfferings.filter((offering) => {
      const q = offeringSearchQuery.toLowerCase().trim();
      const code = String(offering.course_detail?.course_code || offering.course_detail?.code || '').toLowerCase();
      const title = String(offering.course_detail?.title || offering.course_detail?.name || '').toLowerCase();
      const section = String(offering.section || '').toLowerCase();
      const semYear = String(
        offering.semester_detail?.academic_year_detail?.display_label ||
        offering.semester_detail?.academicYearDetail?.displayLabel ||
        ''
      ).toLowerCase();

      const matchesSearch = !q || code.includes(q) || title.includes(q) || section.includes(q) || semYear.includes(q);

      const semId = offering.semester || offering.semester_detail?.id;
      const matchesSemester = offeringSemesterFilter === 'ALL' || semId === offeringSemesterFilter;

      const crsId = offering.course || offering.course_detail?.id;
      const matchesCourse = offeringCourseFilter === 'ALL' || crsId === offeringCourseFilter;

      return matchesSearch && matchesSemester && matchesCourse;
    });
  }, [courseOfferings, offeringSearchQuery, offeringSemesterFilter, offeringCourseFilter]);

  const paginatedOfferings = React.useMemo(() => {
    const start = (offeringPage - 1) * itemsPerPage;
    return filteredOfferings.slice(start, start + itemsPerPage);
  }, [filteredOfferings, offeringPage, itemsPerPage]);

  const offeringTotalPages = Math.ceil(filteredOfferings.length / itemsPerPage) || 1;

  // Offering Stats
  const offeringStats = React.useMemo(() => {
    const total = courseOfferings.length;
    const totalCapacity = courseOfferings.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
    const distinctCourses = new Set(courseOfferings.map((o) => o.course || o.course_detail?.id).filter(Boolean)).size;
    const distinctSemesters = new Set(courseOfferings.map((o) => o.semester || o.semester_detail?.id).filter(Boolean)).size;
    return { total, totalCapacity, distinctCourses, distinctSemesters };
  }, [courseOfferings]);

  const selectClass =
    'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Course & Offering Management
            </h1>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10">
              Institutional Admin
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Maintain university master curriculum courses and scheduled semester course offerings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void fetchCourses();
              void fetchCourseOfferings();
              void fetchSemesters();
            }}
            disabled={isLoadingCourses || isLoadingCourseOfferings}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingCourses || isLoadingCourseOfferings ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {activeTab === 'courses' ? (
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleOpenAddModal}>
              Add New Course
            </Button>
          ) : (
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={handleOpenAddOffering}>
              Schedule Offering
            </Button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-border gap-2">
        <button
          type="button"
          onClick={() => handleTabChange('courses')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'courses'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Master Course Catalogue ({courses.length})
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('offerings')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'offerings'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers3 className="h-4 w-4" />
          Scheduled Course Offerings ({courseOfferings.length})
        </button>
      </div>

      {/* ── TAB 1: MASTER COURSE CATALOGUE ───────────────────────────────── */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4 border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Courses</span>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{courses.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Master curriculum catalogue</p>
            </Card>

            <Card className="p-4 border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Assigned Programs</span>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-blue-600">
                {new Set(courses.map((c) => c.program || c.programDetail?.id).filter(Boolean)).size}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Degree curricula</p>
            </Card>

            <Card className="p-4 border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Freshman Courses</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <GraduationCap className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {courses.filter((c) => c.intendedClassStanding === 'FRESHMAN').length}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Foundation level courses</p>
            </Card>

            <Card className="p-4 border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Scheduled Sessions</span>
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-purple-600">{courseOfferings.length}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Active semester offerings</p>
            </Card>
          </div>

          {/* Search & Filters */}
          <Card className="p-4 border-border space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <SearchInput
                  placeholder="Search course title or code..."
                  value={courseSearchQuery}
                  onChange={(e) => {
                    setCourseSearchQuery(e.target.value);
                    setCoursePage(1);
                  }}
                  className="w-full"
                />
              </div>

              <div>
                <select
                  className={selectClass}
                  value={courseProgramFilter}
                  onChange={(e) => {
                    setCourseProgramFilter(e.target.value);
                    setCoursePage(1);
                  }}
                >
                  <option value="ALL">All Degree Programs</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  className={selectClass}
                  value={courseDeptFilter}
                  onChange={(e) => {
                    setCourseDeptFilter(e.target.value);
                    setCoursePage(1);
                  }}
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  className={selectClass}
                  value={courseStandingFilter}
                  onChange={(e) => {
                    setCourseStandingFilter(e.target.value);
                    setCoursePage(1);
                  }}
                >
                  <option value="ALL">All Class Standings</option>
                  <option value="FRESHMAN">Freshman</option>
                  <option value="SOPHOMORE">Sophomore</option>
                  <option value="JUNIOR">Junior</option>
                  <option value="SENIOR">Senior</option>
                  <option value="GRADUATE">Graduate</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Courses Table */}
          <Card className="overflow-hidden border-border">
            {isLoadingCourses ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                <Clock className="mx-auto h-8 w-8 animate-spin text-primary mb-2" />
                Loading course catalog...
              </div>
            ) : coursesError ? (
              <div className="p-8 text-center text-sm text-destructive">
                <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                <p className="font-semibold">Error loading courses</p>
                <p className="text-xs text-muted-foreground mt-1">{coursesError}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => void fetchCourses()}>
                  Retry
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">Course Code</th>
                      <th className="px-4 py-3.5">Title</th>
                      <th className="px-4 py-3.5">Credit Hours</th>
                      <th className="px-4 py-3.5">Target Standing</th>
                      <th className="px-4 py-3.5">Degree Program</th>
                      <th className="px-4 py-3.5">Department</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedCourses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                          <p className="font-medium text-foreground">No courses found</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {courseSearchQuery || courseProgramFilter !== 'ALL' || courseDeptFilter !== 'ALL' || courseStandingFilter !== 'ALL'
                              ? 'No courses match your active filter criteria.'
                              : 'No master courses created yet. Click "Add New Course" to create one.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      paginatedCourses.map((course) => {
                        const prog = getProgramDisplay(course);
                        const deptName = getDepartmentName(course);
                        return (
                          <tr key={course.id} className="hover:bg-accent/40 transition-colors">
                            <td className="px-4 py-3.5 font-mono text-xs font-bold text-primary">
                              {course.code}
                            </td>
                            <td className="px-4 py-3.5 font-medium text-foreground text-xs">
                              {course.title || course.name}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-muted-foreground font-semibold">
                              {course.creditHours} cr
                            </td>
                            <td className="px-4 py-3.5 text-xs">
                              {course.intendedClassStanding ? (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${
                                    CLASS_STANDING_BADGES[course.intendedClassStanding as ClassStanding] || ''
                                  }`}
                                >
                                  {CLASS_STANDING_LABELS[course.intendedClassStanding as ClassStanding] ||
                                    course.intendedClassStanding}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-muted-foreground">
                              {prog.name}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-muted-foreground">
                              {deptName}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => void handleOpenViewDetails(course.id)}
                                  title="View Details"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => handleOpenEditModal(course)}
                                  title="Edit Course"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => setDeletingCourse(course)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  title="Delete Course"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {filteredCourses.length > itemsPerPage && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
                <span>
                  Showing {(coursePage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(coursePage * itemsPerPage, filteredCourses.length)} of {filteredCourses.length} courses
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={coursePage === 1}
                    onClick={() => setCoursePage((p) => Math.max(p - 1, 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={coursePage === courseTotalPages}
                    onClick={() => setCoursePage((p) => Math.min(p + 1, courseTotalPages))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── TAB 2: COURSE OFFERINGS (SECTIONS & SESSIONS) ────────────────── */}
      {activeTab === 'offerings' && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4 border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Offerings</span>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Layers3 className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-foreground">{offeringStats.total}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Scheduled class sections</p>
            </Card>

            <Card className="p-4 border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Total Capacity</span>
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-blue-600">{offeringStats.totalCapacity}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Available student seats</p>
            </Card>

            <Card className="p-4 border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Offered Courses</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <BookOpen className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-600">{offeringStats.distinctCourses}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Distinct active courses</p>
            </Card>

            <Card className="p-4 border-border">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Active Semesters</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold text-amber-600">{offeringStats.distinctSemesters}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Semester terms represented</p>
            </Card>
          </div>

          {/* Search & Filters */}
          <Card className="p-4 border-border space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <SearchInput
                  placeholder="Search course code, title, section..."
                  value={offeringSearchQuery}
                  onChange={(e) => {
                    setOfferingSearchQuery(e.target.value);
                    setOfferingPage(1);
                  }}
                  className="w-full"
                />
              </div>

              <div>
                <select
                  className={selectClass}
                  value={offeringSemesterFilter}
                  onChange={(e) => {
                    setOfferingSemesterFilter(e.target.value);
                    setOfferingPage(1);
                  }}
                >
                  <option value="ALL">All Semesters</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.academicYearDetail?.displayLabel || 'Academic Year'} - {s.semesterIndex} Sem
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  className={selectClass}
                  value={offeringCourseFilter}
                  onChange={(e) => {
                    setOfferingCourseFilter(e.target.value);
                    setOfferingPage(1);
                  }}
                >
                  <option value="ALL">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}: {c.name || c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>

          {/* Offerings Table */}
          <Card className="overflow-hidden border-border">
            {isLoadingCourseOfferings ? (
              <div className="p-12 text-center text-sm text-muted-foreground">
                <Clock className="mx-auto h-8 w-8 animate-spin text-primary mb-2" />
                Loading scheduled course offerings...
              </div>
            ) : courseOfferingsError ? (
              <div className="p-8 text-center text-sm text-destructive">
                <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                <p className="font-semibold">Error loading course offerings</p>
                <p className="text-xs text-muted-foreground mt-1">{courseOfferingsError}</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => void fetchCourseOfferings()}>
                  Retry
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">Course Code & Title</th>
                      <th className="px-4 py-3.5">Academic Period</th>
                      <th className="px-4 py-3.5">Section</th>
                      <th className="px-4 py-3.5">Capacity</th>
                      <th className="px-4 py-3.5">Credits</th>
                      <th className="px-4 py-3.5">Created Date</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedOfferings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                          <Layers3 className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                          <p className="font-medium text-foreground">No course offerings found</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {offeringSearchQuery || offeringSemesterFilter !== 'ALL' || offeringCourseFilter !== 'ALL'
                              ? 'No course offerings match your filter criteria.'
                              : 'No course offerings scheduled yet. Click "Schedule Offering" to add one.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      paginatedOfferings.map((offering) => {
                        const course = offering.course_detail;
                        const sem = offering.semester_detail;

                        return (
                          <tr key={offering.id} className="hover:bg-accent/40 transition-colors">
                            <td className="px-4 py-3.5">
                              <div>
                                <p className="font-bold text-primary font-mono text-xs">
                                  {course?.course_code || course?.code || 'Course'}
                                </p>
                                <p className="text-xs font-medium text-foreground mt-0.5">
                                  {course?.title || course?.name || '—'}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-muted-foreground">
                              <div className="flex flex-col">
                                <span className="font-medium text-foreground">
                                  {sem?.academic_year_detail?.display_label || sem?.academicYearDetail?.displayLabel || 'Academic Year'}
                                </span>
                                <span>
                                  {sem?.semester_index || sem?.semesterIndex ? `${sem?.semester_index || sem?.semesterIndex} Semester` : '—'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <Badge variant="outline" className="font-mono text-xs bg-muted/30">
                                Section {offering.section || 'A'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3.5 text-xs font-semibold text-foreground">
                              {offering.capacity ?? 50} seats
                            </td>
                            <td className="px-4 py-3.5 text-xs text-muted-foreground">
                              {course?.credit_hours ?? course?.creditHours ?? '—'} cr
                            </td>
                            <td className="px-4 py-3.5 text-xs text-muted-foreground">
                              {offering.created_at ? new Date(offering.created_at).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => setViewingOffering(offering)}
                                  title="View Details"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => handleOpenEditOffering(offering)}
                                  title="Edit Offering"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => setDeletingOffering(offering)}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  title="Delete Offering"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {filteredOfferings.length > itemsPerPage && (
              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
                <span>
                  Showing {(offeringPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(offeringPage * itemsPerPage, filteredOfferings.length)} of {filteredOfferings.length} offerings
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={offeringPage === 1}
                    onClick={() => setOfferingPage((p) => Math.max(p - 1, 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={offeringPage === offeringTotalPages}
                    onClick={() => setOfferingPage((p) => Math.min(p + 1, offeringTotalPages))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── CREATE / EDIT COURSE DIALOG ────────────────────────────────────── */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {editingCourse ? 'Edit Master Course' : 'Create Master Course'}
            </DialogTitle>
            <DialogDescription>
              {editingCourse
                ? 'Update master curriculum course specifications.'
                : 'Add a new course to the university master curriculum.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCourse}>
            <DialogBody className="space-y-4 py-3 max-h-[75vh] overflow-y-auto">
              {courseFormError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{courseFormError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="courseCodeInput" required>
                  Course Code
                </Label>
                <Input
                  id="courseCodeInput"
                  placeholder="e.g. CS301"
                  value={courseFormData.code}
                  onChange={(e) => {
                    setCourseFormData({ ...courseFormData, code: e.target.value });
                    if (courseFieldErrors.course_code) {
                      setCourseFieldErrors((prev) => ({ ...prev, course_code: '' }));
                    }
                  }}
                  className={courseFieldErrors.course_code ? 'border-destructive font-mono uppercase' : 'font-mono uppercase'}
                />
                {courseFieldErrors.course_code && (
                  <p className="text-xs text-destructive">{courseFieldErrors.course_code}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="courseTitleInput" required>
                  Course Title
                </Label>
                <Input
                  id="courseTitleInput"
                  placeholder="e.g. Data Structures & Algorithms"
                  value={courseFormData.title}
                  onChange={(e) => {
                    setCourseFormData({ ...courseFormData, title: e.target.value });
                    if (courseFieldErrors.title) {
                      setCourseFieldErrors((prev) => ({ ...prev, title: '' }));
                    }
                  }}
                  className={courseFieldErrors.title ? 'border-destructive' : ''}
                />
                {courseFieldErrors.title && (
                  <p className="text-xs text-destructive">{courseFieldErrors.title}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="creditHoursInput" required>
                    Credit Hours
                  </Label>
                  <Input
                    id="creditHoursInput"
                    type="number"
                    min="0"
                    max="30"
                    value={courseFormData.creditHours}
                    onChange={(e) => {
                      setCourseFormData({ ...courseFormData, creditHours: Number(e.target.value) });
                      if (courseFieldErrors.credit_hours) {
                        setCourseFieldErrors((prev) => ({ ...prev, credit_hours: '' }));
                      }
                    }}
                    className={courseFieldErrors.credit_hours ? 'border-destructive' : ''}
                  />
                  {courseFieldErrors.credit_hours && (
                    <p className="text-xs text-destructive">{courseFieldErrors.credit_hours}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="standingSelect">Target Standing</Label>
                  <select
                    id="standingSelect"
                    className={selectClass}
                    value={courseFormData.intendedClassStanding}
                    onChange={(e) =>
                      setCourseFormData({
                        ...courseFormData,
                        intendedClassStanding: e.target.value as ClassStanding,
                      })
                    }
                  >
                    <option value="FRESHMAN">Freshman</option>
                    <option value="SOPHOMORE">Sophomore</option>
                    <option value="JUNIOR">Junior</option>
                    <option value="SENIOR">Senior</option>
                    <option value="GRADUATE">Graduate</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="programSelect">Degree Program (Optional)</Label>
                <select
                  id="programSelect"
                  className={selectClass}
                  value={courseFormData.programId}
                  onChange={(e) =>
                    setCourseFormData({ ...courseFormData, programId: e.target.value })
                  }
                >
                  <option value="">No Degree Program Assigned</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingCourse}>
                {isSubmittingCourse ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── CREATE / EDIT COURSE OFFERING DIALOG ───────────────────────────── */}
      <Dialog open={isOfferingModalOpen} onOpenChange={setIsOfferingModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers3 className="h-5 w-5 text-primary" />
              {editingOffering ? 'Edit Course Offering' : 'Schedule Course Offering'}
            </DialogTitle>
            <DialogDescription>
              {editingOffering
                ? 'Update section code and maximum student capacity for this offering.'
                : 'Schedule a course offering for an academic semester term.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveOffering}>
            <DialogBody className="space-y-4 py-3 max-h-[75vh] overflow-y-auto">
              {offeringFormError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{offeringFormError}</span>
                </div>
              )}

              {/* Course Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="offeringCourseSelect" required>
                  Course
                </Label>
                <select
                  id="offeringCourseSelect"
                  className={`${selectClass} ${offeringFieldErrors.course ? 'border-destructive' : ''}`}
                  value={offeringFormData.course}
                  onChange={(e) => {
                    setOfferingFormData({ ...offeringFormData, course: e.target.value });
                    if (offeringFieldErrors.course) {
                      setOfferingFieldErrors((prev) => ({ ...prev, course: '' }));
                    }
                  }}
                >
                  <option value="">Select a Course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}: {c.title || c.name} ({c.creditHours} cr)
                    </option>
                  ))}
                </select>
                {offeringFieldErrors.course && (
                  <p className="text-xs text-destructive">{offeringFieldErrors.course}</p>
                )}
              </div>

              {/* Semester Selection */}
              <div className="space-y-1.5">
                <Label htmlFor="offeringSemesterSelect" required>
                  Academic Semester
                </Label>
                <select
                  id="offeringSemesterSelect"
                  className={`${selectClass} ${offeringFieldErrors.semester ? 'border-destructive' : ''}`}
                  value={offeringFormData.semester}
                  onChange={(e) => {
                    setOfferingFormData({ ...offeringFormData, semester: e.target.value });
                    if (offeringFieldErrors.semester) {
                      setOfferingFieldErrors((prev) => ({ ...prev, semester: '' }));
                    }
                  }}
                >
                  <option value="">Select an Academic Semester</option>
                  {semesters.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.academicYearDetail?.displayLabel || 'Academic Year'} — {s.semesterIndex} Semester
                    </option>
                  ))}
                </select>
                {offeringFieldErrors.semester && (
                  <p className="text-xs text-destructive">{offeringFieldErrors.semester}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Section */}
                <div className="space-y-1.5">
                  <Label htmlFor="offeringSectionInput" required>
                    Section
                  </Label>
                  <Input
                    id="offeringSectionInput"
                    placeholder="e.g. A, B, Sec-1"
                    value={offeringFormData.section}
                    onChange={(e) => {
                      setOfferingFormData({ ...offeringFormData, section: e.target.value });
                      if (offeringFieldErrors.section) {
                        setOfferingFieldErrors((prev) => ({ ...prev, section: '' }));
                      }
                    }}
                    className={offeringFieldErrors.section ? 'border-destructive uppercase font-mono' : 'uppercase font-mono'}
                  />
                  {offeringFieldErrors.section && (
                    <p className="text-xs text-destructive">{offeringFieldErrors.section}</p>
                  )}
                </div>

                {/* Capacity */}
                <div className="space-y-1.5">
                  <Label htmlFor="offeringCapacityInput" required>
                    Max Capacity
                  </Label>
                  <Input
                    id="offeringCapacityInput"
                    type="number"
                    min="1"
                    max="500"
                    value={offeringFormData.capacity}
                    onChange={(e) => {
                      setOfferingFormData({ ...offeringFormData, capacity: Number(e.target.value) });
                      if (offeringFieldErrors.capacity) {
                        setOfferingFieldErrors((prev) => ({ ...prev, capacity: '' }));
                      }
                    }}
                    className={offeringFieldErrors.capacity ? 'border-destructive' : ''}
                  />
                  {offeringFieldErrors.capacity && (
                    <p className="text-xs text-destructive">{offeringFieldErrors.capacity}</p>
                  )}
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsOfferingModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingOffering}>
                {isSubmittingOffering
                  ? 'Saving...'
                  : editingOffering
                  ? 'Update Offering'
                  : 'Schedule Offering'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── VIEW COURSE DETAILS DIALOG ─────────────────────────────────────── */}
      {detailedCourse && (
        <Dialog open={!!detailedCourse} onOpenChange={() => setDetailedCourse(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Course Specifications
              </DialogTitle>
            </DialogHeader>

            <DialogBody className="space-y-4 py-3">
              <div className="border-b border-border pb-3">
                <p className="font-mono text-xs font-bold text-primary">{detailedCourse.code}</p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {detailedCourse.title || detailedCourse.name}
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-foreground">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Credit Hours:</span>
                  <span className="font-semibold">{detailedCourse.creditHours} hrs</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Target Standing:</span>
                  <span>{detailedCourse.intendedClassStanding || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Degree Program:</span>
                  <span className="font-medium">{getProgramDisplay(detailedCourse).name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium">{getDepartmentName(detailedCourse)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Created:</span>
                  <span>
                    {detailedCourse.createdAt
                      ? new Date(detailedCourse.createdAt).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailedCourse(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── VIEW OFFERING DETAILS DIALOG ───────────────────────────────────── */}
      {viewingOffering && (
        <Dialog open={!!viewingOffering} onOpenChange={() => setViewingOffering(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers3 className="h-5 w-5 text-primary" /> Course Offering Details
              </DialogTitle>
            </DialogHeader>

            <DialogBody className="space-y-4 py-3">
              <div className="border-b border-border pb-3">
                <p className="font-mono text-xs font-bold text-primary">
                  {viewingOffering.course_detail?.course_code || viewingOffering.course_detail?.code || 'Course'}
                </p>
                <p className="text-base font-bold text-foreground mt-0.5">
                  {viewingOffering.course_detail?.title || viewingOffering.course_detail?.name || '—'}
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-foreground">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Academic Year:</span>
                  <span className="font-semibold">
                    {viewingOffering.semester_detail?.academic_year_detail?.display_label ||
                      viewingOffering.semester_detail?.academicYearDetail?.displayLabel ||
                      '—'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Semester Term:</span>
                  <span>
                    {viewingOffering.semester_detail?.semester_index ||
                      viewingOffering.semester_detail?.semesterIndex ||
                      '—'}{' '}
                    Semester
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Section:</span>
                  <span className="font-mono font-bold">Section {viewingOffering.section || 'A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Max Capacity:</span>
                  <span className="font-semibold">{viewingOffering.capacity ?? 50} students</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Course Credits:</span>
                  <span>{viewingOffering.course_detail?.credit_hours ?? viewingOffering.course_detail?.creditHours ?? '—'} hrs</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Scheduled Date:</span>
                  <span>
                    {viewingOffering.created_at
                      ? new Date(viewingOffering.created_at).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingOffering(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── DELETE COURSE CONFIRMATION ─────────────────────────────────────── */}
      <ConfirmationDialog
        open={!!deletingCourse}
        onOpenChange={(open) => {
          if (!open) setDeletingCourse(null);
        }}
        title="Delete Course"
        description={
          deletingCourse
            ? `Are you sure you want to delete course ${deletingCourse.code} - ${
                deletingCourse.title || deletingCourse.name
              }? This action cannot be undone.`
            : ''
        }
        confirmLabel="Yes, Delete Course"
        cancelLabel="Cancel"
        destructive
        loading={isDeletingCourse}
        onConfirm={handleDeleteCourse}
        onCancel={() => setDeletingCourse(null)}
      />

      {/* ── DELETE OFFERING CONFIRMATION ───────────────────────────────────── */}
      <ConfirmationDialog
        open={!!deletingOffering}
        onOpenChange={(open) => {
          if (!open) setDeletingOffering(null);
        }}
        title="Delete Course Offering"
        description={
          deletingOffering
            ? `Are you sure you want to delete offering Section ${deletingOffering.section} for ${
                deletingOffering.course_detail?.course_code || deletingOffering.course_detail?.code || 'Course'
              }? Active student enrollments must not depend on it.`
            : ''
        }
        confirmLabel="Yes, Delete Offering"
        cancelLabel="Cancel"
        destructive
        loading={isDeletingOffering}
        onConfirm={handleDeleteOffering}
        onCancel={() => setDeletingOffering(null)}
      />
    </div>
  );
}
