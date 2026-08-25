'use client';

import * as React from 'react';
import { 
  ClipboardCheck, 
  Calendar, 
  Clock, 
  BookOpen, 
  Search, 
  Check, 
  ChevronDown, 
  X,
  AlertCircle
} from 'lucide-react';
import { Badge, Button, Card, CardContent, Input } from '@/components/ui';
import { cn } from '@/lib';
import type { AdminExamOverview } from '@/features/admin/types';

export interface ExamSelectorProps {
  exams: AdminExamOverview[];
  selectedExamId: string | null;
  onSelectExam: (examId: string | null) => void;
  isLoading?: boolean;
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
    case 'PUBLISHED':
      return 'success';
    case 'SCHEDULED':
      return 'secondary';
    case 'CLOSED':
    case 'ARCHIVED':
      return 'warning';
    case 'DRAFT':
    default:
      return 'outline';
  }
}

export function ExamSelector({
  exams,
  selectedExamId,
  onSelectExam,
  isLoading = false,
}: ExamSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedExam = React.useMemo(
    () => exams.find((e) => e.id === selectedExamId) || null,
    [exams, selectedExamId]
  );

  const filteredExams = React.useMemo(() => {
    if (!searchTerm.trim()) return exams;
    const query = searchTerm.toLowerCase();
    return exams.filter(
      (e) =>
        e.title.toLowerCase().includes(query) ||
        (e.courseCode && e.courseCode.toLowerCase().includes(query)) ||
        (e.courseName && e.courseName.toLowerCase().includes(query)) ||
        (e.lecturerName && e.lecturerName.toLowerCase().includes(query)) ||
        e.status.toLowerCase().includes(query)
    );
  }, [exams, searchTerm]);

  return (
    <Card className="border-border bg-card shadow-sm transition-all duration-200">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label htmlFor="exam-select-trigger" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                Select Examination
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose an examination to retrieve official student results and grade breakdowns.
              </p>
            </div>
            {selectedExam && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectExam(null)}
                className="text-xs text-muted-foreground hover:text-foreground self-start sm:self-auto h-7 px-2"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Clear Selection
              </Button>
            )}
          </div>

          {/* Searchable Select Container */}
          <div className="relative" ref={dropdownRef}>
            <button
              id="exam-select-trigger"
              type="button"
              disabled={isLoading || exams.length === 0}
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                'w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border text-left text-sm transition-colors',
                'bg-background hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-border',
                isLoading && 'opacity-60 cursor-not-allowed'
              )}
            >
              {selectedExam ? (
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <Badge variant={getStatusBadgeVariant(selectedExam.status)} className="shrink-0 text-[11px] font-medium">
                    {selectedExam.status}
                  </Badge>
                  <div className="truncate font-medium text-foreground">
                    {selectedExam.title}
                  </div>
                  {selectedExam.courseCode && (
                    <span className="hidden sm:inline text-xs text-muted-foreground truncate border-l border-border pl-2">
                      {selectedExam.courseCode}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">
                  {isLoading
                    ? 'Loading examinations...'
                    : exams.length === 0
                    ? 'No examinations available'
                    : 'Search or select an examination...'}
                </span>
              )}
              <ChevronDown
                className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0', isOpen && 'rotate-180')}
              />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute z-50 mt-1.5 w-full rounded-lg border border-border bg-popover text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95">
                <div className="p-2 border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter by title, course, lecturer, or status..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 h-9 text-xs"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
                  {filteredExams.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      No examinations found matching &ldquo;{searchTerm}&rdquo;
                    </div>
                  ) : (
                    filteredExams.map((exam) => {
                      const isSelected = exam.id === selectedExamId;
                      return (
                        <button
                          key={exam.id}
                          type="button"
                          onClick={() => {
                            onSelectExam(exam.id);
                            setIsOpen(false);
                          }}
                          className={cn(
                            'w-full flex items-center justify-between gap-3 p-2.5 rounded-md text-left text-xs transition-colors',
                            isSelected
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'hover:bg-muted text-foreground'
                          )}
                        >
                          <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm truncate">{exam.title}</span>
                              <Badge
                                variant={getStatusBadgeVariant(exam.status)}
                                className="text-[10px] uppercase px-1.5 py-0"
                              >
                                {exam.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                              {exam.courseCode && (
                                <span className="flex items-center gap-1">
                                  <BookOpen className="h-3 w-3" />
                                  {exam.courseCode}
                                </span>
                              )}
                              {exam.duration_minutes && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {exam.duration_minutes} mins
                                </span>
                              )}
                              {exam.start_window && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(exam.start_window).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Selected Exam Highlight Card */}
          {selectedExam && (
            <div className="rounded-lg bg-muted/40 border border-border/80 p-3 sm:p-4 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-muted-foreground block text-[11px]">Course / Offering</span>
                <span className="font-medium text-foreground truncate block mt-0.5">
                  {selectedExam.courseCode || selectedExam.courseName || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Status</span>
                <div className="mt-0.5">
                  <Badge variant={getStatusBadgeVariant(selectedExam.status)} className="text-[10px]">
                    {selectedExam.status}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Duration</span>
                <span className="font-medium text-foreground block mt-0.5">
                  {selectedExam.duration_minutes ? `${selectedExam.duration_minutes} minutes` : 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Exam Window</span>
                <span className="font-medium text-foreground block mt-0.5">
                  {selectedExam.start_window
                    ? new Date(selectedExam.start_window).toLocaleDateString()
                    : 'Flexible / Unset'}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
