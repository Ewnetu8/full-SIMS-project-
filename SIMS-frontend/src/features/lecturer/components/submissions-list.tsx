'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Brain, ChevronDown, ChevronUp, Clock, Search, X } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Badge, Button, Card, CardContent, Input } from '@/components/ui';
import { ROUTES } from '@/constants';

import { lecturerService } from '../services';

import type { LecturerExam, StudentSubmission } from '../types';

interface SubmissionsListProps {
  examId: string;
}

const AI_BADGE_VARIANT = {
  COMPLETED: 'success',
  PROCESSING: 'info',
  PENDING: 'secondary',
} as const;

export function SubmissionsList({ examId }: SubmissionsListProps) {
  const [exam, setExam] = React.useState<LecturerExam | null>(null);
  const [submissions, setSubmissions] = React.useState<StudentSubmission[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      const [examData, subs] = await Promise.all([
        lecturerService.getExamById(examId),
        lecturerService.getSubmissions(examId),
      ]);
      setExam(examData ?? null);
      setSubmissions(subs);
      setLoading(false);
    }
    load();
  }, [examId]);

  const filtered = submissions.filter(
    (s) =>
      !search ||
      s.studentName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const graded = submissions.filter((s) => s.aiGradingStatus === 'COMPLETED').length;
  const pending = submissions.filter((s) => s.aiGradingStatus === 'PENDING').length;
  const processing = submissions.filter((s) => s.aiGradingStatus === 'PROCESSING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            <Link href={ROUTES.LECTURER.EXAMS}>Back to Exams</Link>
          </Button>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Student Submissions
          </h1>
          {exam && (
            <p className="text-sm text-muted-foreground">{exam.title} · {exam.courseCode}</p>
          )}
        </div>
      </div>

      {/* AI Grading Status Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{graded}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <Brain className="h-3.5 w-3.5" /> AI Graded
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-info">{processing}</p>
            <p className="text-xs text-muted-foreground mt-1">Processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{pending}</p>
            <p className="text-xs text-muted-foreground mt-1">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Input
        placeholder="Search by student name or ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leadingIcon={<Search className="h-4 w-4" />}
        trailingIcon={
          search ? (
            <button onClick={() => setSearch('')} className="rounded-full p-0.5 hover:bg-muted">
              <X className="h-3.5 w-3.5" />
            </button>
          ) : undefined
        }
      />

      {/* Submissions list */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((sub) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedId((prev) => (prev === sub.id ? null : sub.id))}
                  className="w-full text-left"
                  aria-expanded={expandedId === sub.id}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-foreground">{sub.studentName}</p>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded font-mono">
                            {sub.studentId}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(sub.submittedAt).toLocaleString()}
                          </span>
                          {sub.score !== undefined && (
                            <span className="font-semibold text-foreground">
                              Score: {sub.score} / {sub.totalMarks}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={AI_BADGE_VARIANT[sub.aiGradingStatus]}>
                          {sub.aiGradingStatus === 'COMPLETED'
                            ? 'AI Graded'
                            : sub.aiGradingStatus === 'PROCESSING'
                            ? 'AI Processing'
                            : 'Pending AI'}
                        </Badge>
                        {expandedId === sub.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </button>

                {/* Expanded submission detail */}
                <AnimatePresence>
                  {expandedId === sub.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-border"
                    >
                      <div className="p-4 space-y-3 bg-muted/30">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Student Responses
                        </p>
                        {exam?.questions.map((q, i) => {
                          const answer = sub.answers[q.id];
                          return (
                            <div key={q.id} className="space-y-1.5 rounded-lg border border-border bg-card p-3">
                              <p className="text-xs font-medium text-muted-foreground">
                                Q{i + 1} · {q.marks} marks
                              </p>
                              <p className="text-sm font-medium text-foreground">{q.prompt}</p>
                              {answer !== undefined ? (
                                <p className="text-sm text-muted-foreground bg-muted rounded p-2">
                                  {Array.isArray(answer) ? answer.join(', ') : answer}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground italic">No response recorded</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-16 text-center rounded-2xl border border-dashed border-border">
            <p className="text-muted-foreground">No submissions match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
