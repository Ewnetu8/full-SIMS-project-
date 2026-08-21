'use client';

import {
  GraduationCap,
  Eye,
  BookOpen,
  Award,
  Calendar,
  Building,
  Mail,
} from 'lucide-react';
import * as React from 'react';

import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  SearchInput,
} from '@/components/ui';

import { useAdminStore } from '../store';

import type { StudentProfile } from '../types';

export function StudentManagement() {
  const {
    students,
    departments,
    colleges,
    studentSearchQuery,
    studentDeptFilter,
    fetchStudents,
    setStudentSearchQuery,
    setStudentDeptFilter,
  } = useAdminStore();

  React.useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const [selectedStudent, setSelectedStudent] = React.useState<StudentProfile | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [studentCollegeFilter, setStudentCollegeFilter] = React.useState<string>('ALL');
  const itemsPerPage = 10;

  const filteredDepartments = React.useMemo(() => {
    if (!studentCollegeFilter || studentCollegeFilter === 'ALL') return departments;
    return departments.filter(
      (d) =>
        d.college === studentCollegeFilter ||
        (colleges.find((c) => c.name === studentCollegeFilter || c.code === studentCollegeFilter)?.id === d.college)
    );
  }, [departments, colleges, studentCollegeFilter]);

  const filteredStudents = React.useMemo(() => {
    return students.filter((s) => {
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      const matchesSearch =
        fullName.includes(studentSearchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
        s.studentId.toLowerCase().includes(studentSearchQuery.toLowerCase());

      const matchesDept = studentDeptFilter === 'ALL' || s.department === studentDeptFilter;

      return matchesSearch && matchesDept;
    });
  }, [students, studentSearchQuery, studentDeptFilter]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const selectClass =
    'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" /> Student Directory
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View student profiles, academic standings, and departmental affiliations.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <SearchInput
              placeholder="Search by student name, ID, or email..."
              value={studentSearchQuery}
              onChange={(e) => {
                setStudentSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              onClear={() => setStudentSearchQuery('')}
            />
          </div>

          <div>
            <select
              className={selectClass}
              value={studentCollegeFilter}
              onChange={(e) => {
                setStudentCollegeFilter(e.target.value);
                setStudentDeptFilter('ALL');
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Colleges</option>
              {colleges.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name} ({col.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              className={selectClass}
              value={studentDeptFilter}
              onChange={(e) => {
                setStudentDeptFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Academic Departments</option>
              {filteredDepartments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Student List Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Student ID</th>
                <th className="px-4 py-3.5">Student Name</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Program</th>
                <th className="px-4 py-3.5">Academic Level</th>
                <th className="px-4 py-3.5">GPA</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                    <p className="font-medium text-foreground">No student profiles found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {studentSearchQuery || studentDeptFilter !== 'ALL' || studentCollegeFilter !== 'ALL'
                        ? 'No student profiles match your search criteria.'
                        : 'No student profiles are currently available.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((std) => (
                  <tr key={std.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-primary">{std.studentId}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                          {std.firstName?.[0] || 'S'}
                          {std.lastName?.[0] || ''}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {std.firstName} {std.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{std.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-[180px] truncate">{std.department || '—'}</td>
                    <td className="px-4 py-3.5 text-xs text-foreground font-medium">{std.program || '—'}</td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{std.academicYear || std.classStanding || '—'}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant="outline" className="font-mono font-bold text-success bg-success/10 border-success/20">
                        {(std.gpa ?? 0).toFixed(2)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={std.status === 'active' ? 'success' : 'secondary'} className="capitalize">
                        {std.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(std)}>
                        <Eye className="h-4 w-4 mr-1" /> View Profile
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <span className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages} ({filteredStudents.length} total students)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Student Profile Modal */}
      {selectedStudent && (
        <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" /> Student Profile & Academic Record
              </DialogTitle>
            </DialogHeader>

            <DialogBody className="space-y-4 py-3 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center gap-4 border-b border-border pb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl shrink-0">
                  {selectedStudent.firstName?.[0] || 'S'}
                  {selectedStudent.lastName?.[0] || ''}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Mail className="h-3.5 w-3.5" /> {selectedStudent.email}
                  </p>
                  <p className="text-xs font-mono text-primary mt-1 font-semibold">
                    ID: {selectedStudent.studentId}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-foreground">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5" /> Department:
                  </span>
                  <span className="font-medium text-right max-w-[240px]">{selectedStudent.department || 'Not assigned'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" /> Program of Study:
                  </span>
                  <span className="font-medium">{selectedStudent.program || 'Not assigned'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" /> Academic Level:
                  </span>
                  <span className="font-medium">{selectedStudent.academicYear || selectedStudent.classStanding || '—'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5" /> Cumulative GPA:
                  </span>
                  <span className="font-mono font-bold text-success">{(selectedStudent.gpa ?? 0).toFixed(2)} / 4.00</span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    Status:
                  </span>
                  <Badge variant={selectedStudent.status === 'active' ? 'success' : 'secondary'} className="capitalize">
                    {selectedStudent.status}
                  </Badge>
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button onClick={() => setSelectedStudent(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
