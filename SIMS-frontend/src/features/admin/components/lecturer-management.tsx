'use client';

import {
  UserCheck,
  Eye,
  BookOpen,
  Building,
  Mail,
  MapPin,
  ClipboardList,
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
import { COLLEGES, getDepartmentsByCollege } from '@/constants';

import type { LecturerProfile } from '../types';

export function LecturerManagement() {
  const {
    lecturers,
    departments,
    lecturerSearchQuery,
    lecturerDeptFilter,
    fetchLecturers,
    setLecturerSearchQuery,
    setLecturerDeptFilter,
  } = useAdminStore();

  React.useEffect(() => {
    fetchLecturers();
  }, [fetchLecturers]);

  const [selectedLecturer, setSelectedLecturer] = React.useState<LecturerProfile | null>(null);
  const [lecturerCollegeFilter, setLecturerCollegeFilter] = React.useState<string>('ALL');

  const filteredLecturers = lecturers.filter((l) => {
    const fullName = `${l.firstName} ${l.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(lecturerSearchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(lecturerSearchQuery.toLowerCase()) ||
      l.lecturerId.toLowerCase().includes(lecturerSearchQuery.toLowerCase());

    const matchesDept = lecturerDeptFilter === 'ALL' || l.department === lecturerDeptFilter;

    return matchesSearch && matchesDept;
  });

  const selectClass =
    'flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-primary" /> Lecturer & Faculty Directory
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View assigned faculty members, department affiliations, offices, and course responsibilities.
        </p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <SearchInput
              placeholder="Search by lecturer name, ID, or email..."
              value={lecturerSearchQuery}
              onChange={(e) => setLecturerSearchQuery(e.target.value)}
              onClear={() => setLecturerSearchQuery('')}
            />
          </div>

          <div>
            <select
              className={selectClass}
              value={lecturerCollegeFilter}
              onChange={(e) => {
                setLecturerCollegeFilter(e.target.value);
                setLecturerDeptFilter('ALL');
              }}
            >
              <option value="ALL">All Colleges</option>
              {COLLEGES.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              className={selectClass}
              value={lecturerDeptFilter}
              onChange={(e) => setLecturerDeptFilter(e.target.value)}
            >
              <option value="ALL">All Departments</option>
              {getDepartmentsByCollege(lecturerCollegeFilter).map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Lecturer List Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Lecturer ID</th>
                <th className="px-4 py-3.5">Faculty Name</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Office</th>
                <th className="px-4 py-3.5">Assigned Courses</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLecturers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No lecturer records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredLecturers.map((lec) => (
                  <tr key={lec.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-primary">{lec.lecturerId}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                          {lec.firstName[0]}
                          {lec.lastName[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            Dr. {lec.firstName} {lec.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{lec.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-[200px] truncate">{lec.department}</td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{lec.office}</td>
                    <td className="px-4 py-3.5 text-xs">
                      <div className="flex flex-wrap gap-1 max-w-[240px]">
                        {lec.coursesAssigned.map((c) => (
                          <Badge key={c} variant="outline" className="text-[10px] bg-secondary/30">
                            {c.split('-')[0]}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={lec.status === 'active' ? 'success' : 'secondary'} className="capitalize">
                        {lec.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedLecturer(lec)}>
                        <Eye className="h-4 w-4 mr-1" /> View Profile
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Lecturer Profile Modal */}
      {selectedLecturer && (
        <Dialog open={!!selectedLecturer} onOpenChange={() => setSelectedLecturer(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" /> Faculty Member Profile
              </DialogTitle>
            </DialogHeader>

            <DialogBody className="space-y-4 py-3 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center gap-4 border-b border-border pb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl shrink-0">
                  {selectedLecturer.firstName[0]}
                  {selectedLecturer.lastName[0]}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Dr. {selectedLecturer.firstName} {selectedLecturer.lastName}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Mail className="h-3.5 w-3.5" /> {selectedLecturer.email}
                  </p>
                  <p className="text-xs font-mono text-primary mt-1 font-semibold">
                    ID: {selectedLecturer.lecturerId}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-foreground">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5" /> Department:
                  </span>
                  <span className="font-medium text-right max-w-[240px]">{selectedLecturer.department}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Campus Office:
                  </span>
                  <span className="font-medium">{selectedLecturer.office}</span>
                </div>

                <div className="space-y-1.5 py-1">
                  <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                    <ClipboardList className="h-3.5 w-3.5" /> Assigned Course Offerings:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {selectedLecturer.coursesAssigned.map((course) => (
                      <div key={course} className="p-2 rounded-md bg-muted/40 font-medium text-xs border border-border/50">
                        {course}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button onClick={() => setSelectedLecturer(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
