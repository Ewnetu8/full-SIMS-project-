'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Badge, Button, Card, CardContent } from '@/components/ui';
import { ROUTES } from '@/constants';
import { formatDurationMinutes } from '@/utils/date';

import { lecturerService } from '../services';

import type { LecturerExam } from '../types';

const TYPE_LABELS: Record<string, string> = {
  MCQ: 'Multiple Choice',
  SHORT_ANSWER: 'Short Answer',
  ESSAY: 'Essay',
  multiple_choice: 'Multiple Choice',
  multiple_select: 'Multiple Select',
  true_false: 'True / False',
  short_answer: 'Short Answer',
  essay: 'Essay',
};

interface ExamPreviewProps {
  examId: string;
}

export function ExamPreview({ examId }: ExamPreviewProps) {
  const [exam, setExam] = React.useState<LecturerExam | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    lecturerService.getExamById(examId).then((e) => {
      setExam(e ?? null);
      setLoading(false);
    });
  }, [examId]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Exam not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={ROUTES.LECTURER.EXAMS}>Back to Exams</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Lecturer-only back nav */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
          <Link href={ROUTES.LECTURER.EXAMS}>Back to Exams</Link>
        </Button>
        <Badge variant="info">Preview Mode (Student View)</Badge>
      </div>

      {/* Exam header — as students will see it */}
      <div className="rounded-2xl border border-border bg-card p-7 shadow-sm space-y-4">
        <div className="space-y-1">
          <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded">
            {exam.courseCode}
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-2">{exam.title}</h1>
          <p className="text-sm text-muted-foreground">{exam.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-sm rounded-xl border border-border bg-muted/30 p-4">
          <div>
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="font-medium">{formatDurationMinutes(exam.durationMinutes)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Marks</p>
            <p className="font-medium">{exam.totalMarks}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Passing Score</p>
            <p className="font-medium">{exam.passingScore}</p>
          </div>
        </div>

        {exam.instructions.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Instructions</h2>
            <ul className="list-disc pl-5 space-y-1">
              {exam.instructions.map((inst, i) => (
                <li key={i} className="text-sm text-muted-foreground">{inst}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-5">
        {exam.questions.map((q, index) => (
          <Card key={q.id} className="overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      Question {index + 1}
                    </span>
                    <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded font-medium">
                      {TYPE_LABELS[q.type] ?? q.type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {q.marks} mark{q.marks !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{q.prompt}</p>
                </div>
              </div>

              {/* Answer input simulation */}
              {(q.type === 'MCQ' || q.type === 'multiple_choice') && q.options && (
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <input type="radio" name={`q-${q.id}`} className="accent-primary" disabled />
                      <span className="text-sm">{opt.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {(q.type === 'SHORT_ANSWER' || q.type === 'short_answer') && (
                <input
                  type="text"
                  disabled
                  placeholder="Student types their answer here..."
                  className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground"
                />
              )}

              {(q.type === 'ESSAY' || q.type === 'essay') && (
                <textarea
                  disabled
                  rows={5}
                  placeholder="Student types their essay response here..."
                  className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground resize-none"
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit preview button */}
      <div className="py-4 text-center border-t border-border">
        <Button disabled size="lg">
          Submit Examination (Preview — disabled)
        </Button>
        <p className="text-xs text-muted-foreground mt-2">This is a read-only preview of the student experience.</p>
      </div>
    </div>
  );
}
