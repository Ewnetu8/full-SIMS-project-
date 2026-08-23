'use client';

import * as React from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  FileCheck,
  FileEdit,
  GraduationCap,
  Layers,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { LoadingSpinner } from '@/components/feedback';
import { ROUTES } from '@/constants';
import { ExamAnalyticsView } from '@/features/analytics/components/exam-analytics-view';
import { lecturerService } from '../services';
import type { LecturerExam } from '../types';

export function LecturerAnalyticsView() {
  const [exams, setExams] = React.useState<LecturerExam[]>([]);
  const [selectedExamId, setSelectedExamId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadExams = React.useCallback(async () => {
    setLoading(true);
    try {
      const list = await lecturerService.getExams();
      setExams(list);
      if (list.length > 0 && list[0]) {
        // Default to first exam if none selected or if previous is no longer in list
        const firstId = list[0].id;
        setSelectedExamId((prev) => (prev && list.some((e) => e.id === prev) ? prev : firstId));
      } else {
        setSelectedExamId(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadExams();
  }, [loadExams]);

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  if (loading && exams.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading examination analytics...</p>
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Examination Analytics & Results</h1>
          <p className="text-sm text-muted-foreground">
            Evaluation metrics, pass rates, score distributions, and student submission results.
          </p>
        </div>

        <Card className="border-dashed p-12 text-center bg-muted/20">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground">No Examinations Created Yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            You have not created any examinations for your assigned courses yet. Create an examination to start monitoring live performance and student results.
          </p>
          <Button asChild className="mt-5" leftIcon={<Plus className="h-4 w-4" />}>
            <Link href={ROUTES.LECTURER.EXAM_CREATE}>Create New Exam</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Examination Analytics & Results</h1>
          <p className="text-sm text-muted-foreground">
            Live evaluation metrics, score distribution, and per-student graded submissions from SIMS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={loadExams}>
            Refresh Exams
          </Button>
          <Button asChild size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
            <Link href={ROUTES.LECTURER.EXAM_CREATE}>New Exam</Link>
          </Button>
        </div>
      </div>

      {/* Exam Selector Pill Bar */}
      <Card className="shadow-sm border-border bg-card/60 p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-primary" /> Select Examination
            </span>
            <span className="text-xs text-muted-foreground">
              {exams.length} exam{exams.length === 1 ? '' : 's'} available
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {exams.map((exam) => {
              const isSelected = exam.id === selectedExamId;
              return (
                <button
                  key={exam.id}
                  onClick={() => setSelectedExamId(exam.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all text-left flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20'
                      : 'bg-muted/40 hover:bg-muted text-foreground border-border/80'
                  }`}
                >
                  <span className="font-semibold truncate max-w-[200px]">{exam.title}</span>
                  <Badge
                    variant={
                      isSelected
                        ? 'outline'
                        : exam.status === 'PUBLISHED'
                        ? 'success'
                        : 'secondary'
                    }
                    className={`text-[10px] uppercase ${isSelected ? 'border-primary-foreground/40 text-primary-foreground' : ''}`}
                  >
                    {exam.status}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Embedded Live Analytics View */}
      {selectedExamId && (
        <ExamAnalyticsView
          examId={selectedExamId}
          examTitle={selectedExam?.title}
        />
      )}
    </div>
  );
}

