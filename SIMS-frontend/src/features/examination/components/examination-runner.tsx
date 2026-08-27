'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, LayoutList, Save, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { ExamProgressBar, ExamTimer, QuestionNavigator } from '@/components/examination';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { ROUTES } from '@/constants';

import { examinationService } from '../services';
import { useExaminationStore } from '../store';

import { AutoSaveIndicator, ExaminationQuestionCard } from './question-card';

import type { ExaminationAnswer, ExaminationSession } from '../types';

const hasAnswer = (answer: ExaminationAnswer | undefined): boolean =>
  Array.isArray(answer) ? answer.length > 0 : Boolean(answer?.trim());

export function ExaminationRunner({ session }: { session: ExaminationSession }) {
  const router = useRouter();
  const sessionState = useExaminationStore((state) => state.session);
  const answers = useExaminationStore((state) => state.answers);
  const flaggedQuestionIds = useExaminationStore((state) => state.flaggedQuestionIds);
  const currentQuestionIndex = useExaminationStore((state) => state.currentQuestionIndex);
  const secondsRemaining = useExaminationStore((state) => state.secondsRemaining);
  const saveState = useExaminationStore((state) => state.saveState);
  const lastSavedAt = useExaminationStore((state) => state.lastSavedAt);

  const initialize = useExaminationStore((state) => state.initialize);
  const setAnswer = useExaminationStore((state) => state.setAnswer);
  const setCurrentQuestion = useExaminationStore((state) => state.setCurrentQuestion);
  const toggleFlag = useExaminationStore((state) => state.toggleFlag);
  const tick = useExaminationStore((state) => state.tick);
  const setSaving = useExaminationStore((state) => state.setSaving);
  const setSaved = useExaminationStore((state) => state.setSaved);
  const setReceipt = useExaminationStore((state) => state.setReceipt);

  const initialSubmitted = Boolean(session.rawAttempt?.submission_time);
  const [navigatorOpen, setNavigatorOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(initialSubmitted);

  const isSubmittedRef = React.useRef(initialSubmitted);

  const markSubmitted = React.useCallback(() => {
    isSubmittedRef.current = true;
    setIsSubmitted(true);
  }, []);

  // Initialize state when session opens
  React.useEffect(() => {
    if (sessionState?.examId !== session.examId) {
      initialize(session);
    }
  }, [initialize, session, sessionState?.examId]);

  // Countdown timer effect
  React.useEffect(() => {
    if (isSubmitted || isSubmitting) return;

    const interval = window.setInterval(() => {
      if (!isSubmittedRef.current) {
        tick();
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isSubmitted, isSubmitting, tick]);

  // Periodic auto-save effect (every 5 seconds) - active ONLY while in progress
  React.useEffect(() => {
    if (isSubmitted || isSubmitting) return;

    const interval = window.setInterval(() => {
      if (!isSubmittedRef.current && !isSubmitting) {
        void triggerAutoSave();
      }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [isSubmitted, isSubmitting]);

  // Auto-submit modal trigger when time reaches 0
  React.useEffect(() => {
    if (secondsRemaining === 0 && sessionState && !isSubmittedRef.current && !isSubmitting) {
      setConfirmOpen(true);
    }
  }, [secondsRemaining, sessionState, isSubmitting]);

  const handleAnswerChange = async (questionId: string, questionType: string, answerVal: ExaminationAnswer) => {
    if (isSubmittedRef.current || isSubmitting || isSubmitted) return;
    setAnswer(questionId, answerVal);
    if (session.attemptId) {
      setSaving();
      try {
        await examinationService.saveSingleAnswer(session.attemptId, questionId, questionType, answerVal);
        if (!isSubmittedRef.current) {
          setSaved(new Date().toISOString());
        }
      } catch (e: any) {
        const detail = e?.detail || e?.response?.data?.detail || e?.message || '';
        if (detail.includes('already been submitted')) {
          markSubmitted();
          return;
        }
        console.error('Failed to auto-save answer:', e);
      }
    }
  };

  const triggerAutoSave = async () => {
    if (!session.attemptId || isSubmittedRef.current || isSubmitting || isSubmitted) return;
    setSaving();
    try {
      const currentAnswers = useExaminationStore.getState().answers;
      for (const q of session.questions) {
        if (isSubmittedRef.current) return;
        const val = currentAnswers[q.id];
        if (val !== undefined) {
          await examinationService.saveSingleAnswer(session.attemptId, q.id, q.type, val);
        }
      }
      if (!isSubmittedRef.current) {
        setSaved(new Date().toISOString());
      }
    } catch (e: any) {
      const detail = e?.detail || e?.response?.data?.detail || e?.message || '';
      if (detail.includes('already been submitted')) {
        markSubmitted();
        return;
      }
      console.error('Auto-save sync error:', e);
    }
  };

  const submitExam = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    markSubmitted(); // Atomically lock autosave before starting submit pipeline

    try {
      const currentAnswers = useExaminationStore.getState().answers;
      // Best-effort final save for any unsaved answer fields before freezing
      try {
        if (session.attemptId) {
          for (const q of session.questions) {
            const val = currentAnswers[q.id];
            if (val !== undefined) {
              await examinationService.saveSingleAnswer(session.attemptId, q.id, q.type, val);
            }
          }
        }
      } catch (saveErr: any) {
        const saveDetail = saveErr?.detail || saveErr?.response?.data?.detail || saveErr?.message || '';
        if (!saveDetail.includes('already been submitted')) {
          console.warn('Pre-submit save warning:', saveErr);
        }
      }

      const receipt = await examinationService.submit(session, currentAnswers);
      setReceipt(receipt);
      router.replace(ROUTES.STUDENT.EXAM_SUBMITTED(session.examId));
    } catch (e: any) {
      const detail = e?.detail || e?.response?.data?.detail || e?.message || '';
      if (detail.includes('already been submitted')) {
        router.replace(ROUTES.STUDENT.EXAM_SUBMITTED(session.examId));
        return;
      }
      setIsSubmitting(false);
      isSubmittedRef.current = false;
      setIsSubmitted(false);
      console.error('Submission failed:', e);
    }
  };

  const activeQuestion = session.questions[currentQuestionIndex] ?? session.questions[0];
  if (!activeQuestion) return null;

  const answeredCount = session.questions.filter((q) => hasAnswer(answers[q.id])).length;
  const unansweredCount = session.questions.length - answeredCount;

  const questionStatuses = session.questions.map((q) =>
    flaggedQuestionIds.includes(q.id)
      ? ('flagged' as const)
      : hasAnswer(answers[q.id])
      ? ('answered' as const)
      : ('unanswered' as const)
  );

  const navigatorElement = (
    <QuestionNavigator
      total={session.questions.length}
      currentIndex={currentQuestionIndex}
      statuses={questionStatuses}
      onSelect={(index) => {
        setCurrentQuestion(index);
        setNavigatorOpen(false);
      }}
    />
  );

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Distraction-free Header */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-foreground">{session.examTitle}</h1>
            <p className="truncate text-xs text-muted-foreground">
              {session.courseCode} · {session.course} ({session.lecturer})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ExamTimer secondsLeft={secondsRemaining} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_280px] lg:px-6">
        <div className="min-w-0 space-y-6">
          {/* Subheader Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm">
            <ExamProgressBar answered={answeredCount} total={session.questions.length} className="min-w-48 flex-1" />

            <div className="flex items-center gap-3">
              <AutoSaveIndicator state={saveState} lastSavedAt={lastSavedAt} />
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setNavigatorOpen(true)}
                leftIcon={<LayoutList className="h-4 w-4" />}
              >
                Question Navigator
              </Button>
            </div>
          </div>

          {/* Animated Question Card Container */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeQuestion.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16 }}
            >
              <ExaminationQuestionCard
                question={activeQuestion}
                index={currentQuestionIndex}
                total={session.questions.length}
                answer={answers[activeQuestion.id]}
                flagged={flaggedQuestionIds.includes(activeQuestion.id)}
                disabled={isSubmitted || isSubmitting}
                onChange={(ans) => handleAnswerChange(activeQuestion.id, activeQuestion.type, ans)}
                onToggleFlag={() => toggleFlag(activeQuestion.id)}
              />
            </motion.div>
          </AnimatePresence>

          {/* Bottom Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              leftIcon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                disabled={isSubmitted || isSubmitting}
                onClick={() => void triggerAutoSave()}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Save Draft
              </Button>

              {currentQuestionIndex < session.questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentQuestion(currentQuestionIndex + 1)}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Next Question
                </Button>
              ) : (
                <Button
                  disabled={isSubmitted || isSubmitting}
                  onClick={() => setConfirmOpen(true)}
                  leftIcon={<Send className="h-4 w-4" />}
                >
                  Submit Exam
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Question Navigator Sidebar */}
        <aside className="hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm lg:block">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Question Navigator</h2>
          {navigatorElement}
        </aside>
      </main>

      {/* Mobile Question Navigator Dialog */}
      <Dialog open={navigatorOpen} onOpenChange={setNavigatorOpen}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Question Navigator</DialogTitle>
            <DialogDescription>Jump directly to any question in this examination.</DialogDescription>
          </DialogHeader>
          <DialogBody>{navigatorElement}</DialogBody>
        </DialogContent>
      </Dialog>

      {/* Submission Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent hideClose size="md">
          <DialogHeader>
            <DialogTitle>
              {secondsRemaining === 0 ? 'Exam Time Expired' : 'Confirm Exam Submission'}
            </DialogTitle>
            <DialogDescription>
              {secondsRemaining === 0
                ? 'Your allocated examination time has ended. Your answers will be submitted automatically.'
                : 'Are you sure you want to finalize your examination? Once submitted, you cannot modify your answers.'}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <dl className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-muted/60 p-3.5 border border-border/60">
                <dt className="text-xs text-muted-foreground font-medium">Answered</dt>
                <dd className="mt-1 text-xl font-bold text-success">{answeredCount}</dd>
              </div>
              <div className="rounded-xl bg-muted/60 p-3.5 border border-border/60">
                <dt className="text-xs text-muted-foreground font-medium">Unanswered</dt>
                <dd className="mt-1 text-xl font-bold text-warning">{unansweredCount}</dd>
              </div>
              <div className="rounded-xl bg-muted/60 p-3.5 border border-border/60">
                <dt className="text-xs text-muted-foreground font-medium">Time Left</dt>
                <dd className="mt-1 text-xl font-bold text-foreground">
                  {Math.max(0, Math.ceil(secondsRemaining / 60))}m
                </dd>
              </div>
            </dl>
          </DialogBody>
          <DialogFooter>
            {secondsRemaining > 0 ? (
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                Return to Exam
              </Button>
            ) : null}
            <Button loading={isSubmitting} onClick={() => void submitExam()} leftIcon={<Send className="h-4 w-4" />}>
              {secondsRemaining === 0 ? 'Submit Automatically' : 'Confirm Submission'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}