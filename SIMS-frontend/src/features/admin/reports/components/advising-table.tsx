'use client';

import { 
  Users, 
  GraduationCap, 
  ArrowUpDown 
} from 'lucide-react';
import * as React from 'react';

import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui';

import type { AdvisingStudent } from '../types';

export interface AdvisingTableProps {
  students: AdvisingStudent[];
  totalRawCount: number;
  semesterLabel: string;
}

type SortField = 'student_identifier' | 'class_standing' | 'enrolled_credit_hours' | 'min_credit_hours' | 'deficit';
type SortDirection = 'asc' | 'desc';

export function AdvisingTable({
  students,
  totalRawCount,
  semesterLabel,
}: AdvisingTableProps) {
  const [sortField, setSortField] = React.useState<SortField>('deficit');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'deficit' ? 'desc' : 'asc');
    }
  };

  const sortedStudents = React.useMemo(() => {
    return [...students].sort((a, b) => {
      let aVal: string | number = 0;
      let bVal: string | number = 0;

      if (sortField === 'student_identifier') {
        aVal = a.student_identifier.toLowerCase();
        bVal = b.student_identifier.toLowerCase();
      } else if (sortField === 'class_standing') {
        aVal = a.class_standing.toLowerCase();
        bVal = b.class_standing.toLowerCase();
      } else if (sortField === 'enrolled_credit_hours') {
        aVal = a.enrolled_credit_hours;
        bVal = b.enrolled_credit_hours;
      } else if (sortField === 'min_credit_hours') {
        aVal = a.min_credit_hours;
        bVal = b.min_credit_hours;
      } else if (sortField === 'deficit') {
        aVal = a.min_credit_hours - a.enrolled_credit_hours;
        bVal = b.min_credit_hours - b.enrolled_credit_hours;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [students, sortField, sortDirection]);

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-500" />
            Advising Roster: Students Under Credit-Hour Minimum
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Advisory list for {semesterLabel || 'selected semester'} according to institutional class standing policy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-normal">
            Showing <span className="font-semibold text-foreground px-1">{students.length}</span> of {totalRawCount} flagged students
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort('student_identifier')}
                    className="flex items-center gap-1 hover:text-foreground font-semibold"
                  >
                    Student ID / Identifier
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3 px-4">
                  <button
                    type="button"
                    onClick={() => handleSort('class_standing')}
                    className="flex items-center gap-1 hover:text-foreground font-semibold"
                  >
                    Class Standing
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleSort('enrolled_credit_hours')}
                    className="inline-flex items-center gap-1 hover:text-foreground font-semibold"
                  >
                    Enrolled Credits
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleSort('min_credit_hours')}
                    className="inline-flex items-center gap-1 hover:text-foreground font-semibold"
                  >
                    Required Min
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => handleSort('deficit')}
                    className="inline-flex items-center gap-1 hover:text-foreground font-semibold"
                  >
                    Credit Deficit
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="py-3 px-4 text-right">Advisory Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedStudents.map((student) => {
                const deficit = Math.max(0, student.min_credit_hours - student.enrolled_credit_hours);
                return (
                  <tr
                    key={student.student_id}
                    className="hover:bg-muted/40 transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-medium text-foreground text-xs">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span>{student.student_identifier}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-xs">
                      <Badge variant="outline" className="text-[11px] font-normal bg-background">
                        {student.class_standing}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-xs text-amber-600 dark:text-amber-400">
                      {student.enrolled_credit_hours} hrs
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-xs text-muted-foreground">
                      {student.min_credit_hours} hrs
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-xs text-destructive">
                      -{deficit} hrs
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Badge variant="warning" className="text-[10px] font-medium">
                        Below Minimum
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
