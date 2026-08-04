'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Button } from '@/components/ui';
import { ROUTES } from '@/constants';

import { useLecturerStore } from '../../store';

import { StepBasicInfo } from './step-basic-info';
import { StepQuestionBuilder } from './step-question-builder';
import { StepReview } from './step-review';
import { StepSettings } from './step-settings';
import { WizardNavigation } from './wizard-navigation';

import type { ExamWizardStep, LecturerExam } from '../../types';

const STEP_ORDER: ExamWizardStep[] = ['basic_info', 'settings', 'questions', 'review'];

interface ExamWizardProps {
  initialExam?: LecturerExam;
}

export function ExamWizard({ initialExam }: ExamWizardProps) {
  const { wizardStep, setWizardStep, setEditingExam, editingExamId, resetWizard } =
    useLecturerStore();
  const router = useRouter();
  const [completedSteps, setCompletedSteps] = React.useState<Set<ExamWizardStep>>(new Set());

  React.useEffect(() => {
    if (initialExam) {
      setEditingExam(initialExam.id, {
        title: initialExam.title,
        courseId: initialExam.courseId,
        description: initialExam.description,
        instructions: initialExam.instructions.join('\n'),
        durationMinutes: initialExam.durationMinutes,
        totalMarks: initialExam.totalMarks,
        passingScore: initialExam.passingScore,
        startDate: initialExam.startDate.slice(0, 16),
        endDate: initialExam.endDate.slice(0, 16),
        randomizeQuestions: initialExam.randomizeQuestions,
        allowMultipleAttempts: initialExam.allowMultipleAttempts,
        autoSubmitOnTimeout: initialExam.autoSubmitOnTimeout,
        showResultsAfterSubmission: initialExam.showResultsAfterSubmission,
        questions: initialExam.questions,
      });
      setCompletedSteps(new Set(['basic_info', 'settings', 'questions'] as ExamWizardStep[]));
    } else {
      resetWizard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialExam?.id]);

  function goToStep(step: ExamWizardStep) {
    setWizardStep(step);
  }

  function advanceStep() {
    const currentIndex = STEP_ORDER.indexOf(wizardStep);
    const nextStep = STEP_ORDER[currentIndex + 1];
    if (nextStep) {
      setCompletedSteps((prev) => new Set([...prev, wizardStep]));
      setWizardStep(nextStep);
    }
  }

  function retreatStep() {
    const currentIndex = STEP_ORDER.indexOf(wizardStep);
    const prevStep = STEP_ORDER[currentIndex - 1];
    if (prevStep) {
      setWizardStep(prevStep);
    }
  }

  const variants = {
    enter: { opacity: 0, x: 24 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {initialExam ? 'Edit Examination' : 'Create New Examination'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete all steps to build and publish your exam.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            resetWizard();
            router.push(ROUTES.LECTURER.EXAMS);
          }}
        >
          Cancel
        </Button>
      </div>

      <WizardNavigation
        currentStep={wizardStep}
        completedSteps={completedSteps}
        onStepClick={goToStep}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={wizardStep}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: 'easeInOut' }}
        >
          {wizardStep === 'basic_info' && <StepBasicInfo onNext={advanceStep} />}
          {wizardStep === 'settings' && <StepSettings onBack={retreatStep} onNext={advanceStep} />}
          {wizardStep === 'questions' && (
            <StepQuestionBuilder onBack={retreatStep} onNext={advanceStep} />
          )}
          {wizardStep === 'review' && (
            <StepReview onBack={retreatStep} editingExamId={editingExamId} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
