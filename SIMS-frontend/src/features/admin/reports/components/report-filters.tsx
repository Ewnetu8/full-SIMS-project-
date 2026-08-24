'use client';

import { 
  Calendar, 
  Search, 
  RefreshCw, 
  Download, 
  Filter 
} from 'lucide-react';
import * as React from 'react';

import { Button, Input, Card, CardContent } from '@/components/ui';

import type { Semester, ClassStandingFilter } from '../types';

export interface ReportFiltersProps {
  semesters: Semester[];
  selectedSemesterId: string | null;
  onSelectSemester: (semesterId: string) => void;
  isLoadingSemesters: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  classStandingFilter: ClassStandingFilter;
  onClassStandingChange: (value: ClassStandingFilter) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onExportCsv: () => void;
  canExport: boolean;
}

const CLASS_STANDING_OPTIONS: { label: string; value: ClassStandingFilter }[] = [
  { label: 'All Class Standings', value: 'ALL' },
  { label: 'Freshman', value: 'FRESHMAN' },
  { label: 'Sophomore', value: 'SOPHOMORE' },
  { label: 'Junior', value: 'JUNIOR' },
  { label: 'Senior', value: 'SENIOR' },
  { label: 'Graduate', value: 'GRADUATE' },
];

export function ReportFilters({
  semesters,
  selectedSemesterId,
  onSelectSemester,
  isLoadingSemesters,
  searchTerm,
  onSearchChange,
  classStandingFilter,
  onClassStandingChange,
  onRefresh,
  isRefreshing,
  onExportCsv,
  canExport,
}: ReportFiltersProps) {
  const selectClasses =
    'flex h-9 rounded-lg border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground transition-colors';

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Semester Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label htmlFor="semester-selector" className="text-xs font-semibold text-foreground flex items-center gap-1.5 shrink-0">
                <Calendar className="h-4 w-4 text-primary" />
                Academic Semester:
              </label>

              {isLoadingSemesters ? (
                <div className="h-9 w-60 rounded-lg border border-input bg-muted/40 animate-pulse" />
              ) : (
                <select
                  id="semester-selector"
                  className={`${selectClasses} w-full sm:w-64 font-medium`}
                  value={selectedSemesterId || ''}
                  onChange={(e) => onSelectSemester(e.target.value)}
                >
                  <option value="" disabled>
                    {semesters.length === 0 ? 'No semesters available' : 'Select a semester...'}
                  </option>
                  {semesters.map((s) => {
                    const yearLabel = s.academicYearDetail?.displayLabel || 'Academic Year';
                    return (
                      <option key={s.id} value={s.id}>
                        {yearLabel} — {s.semesterIndex}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Actions: Refresh & Export */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing || !selectedSemesterId}
                leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
                className="text-xs h-9"
              >
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onExportCsv}
                disabled={!canExport || isRefreshing}
                leftIcon={<Download className="h-3.5 w-3.5" />}
                className="text-xs h-9 bg-background hover:bg-muted/60"
              >
                Export CSV
              </Button>
            </div>
          </div>

          {/* Secondary Filters: Class Standing & Search */}
          <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0 hidden sm:inline" />
              <select
                aria-label="Filter by class standing"
                className={`${selectClasses} w-full sm:w-48`}
                value={classStandingFilter}
                onChange={(e) => onClassStandingChange(e.target.value)}
                disabled={!selectedSemesterId}
              >
                {CLASS_STANDING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search student ID..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8 h-9 text-xs"
                disabled={!selectedSemesterId}
              />
            </div>

            {searchTerm && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-xs text-muted-foreground hover:text-foreground self-center"
              >
                Clear search
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
