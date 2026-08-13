import { create } from 'zustand';

import type { ExamWizardStep, ExamWizardData, Question, ExamStatus } from '../types';

interface LecturerStoreState {
  // Wizard state
  wizardStep: ExamWizardStep;
  wizardData: ExamWizardData;
  editingExamId: string | null;

  // Filter state for exams list
  searchQuery: string;
  statusFilter: ExamStatus | 'ALL';
  courseFilter: string | 'ALL';

  // Actions
  setWizardStep: (step: ExamWizardStep) => void;
  updateWizardData: (data: Partial<ExamWizardData>) => void;
  resetWizard: () => void;
  setEditingExam: (id: string | null, data?: ExamWizardData) => void;

  addQuestion: (question: Question) => void;
  updateQuestion: (index: number, question: Question) => void;
  removeQuestion: (index: number) => void;
  reorderQuestions: (startIndex: number, endIndex: number) => void;

  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: ExamStatus | 'ALL') => void;
  setCourseFilter: (courseId: string | 'ALL') => void;
}

const initialWizardData: ExamWizardData = {
  title: '',
  courseId: '',
  description: '',
  instructions: 'Ensure a stable internet connection. All answers must be submitted within the time limit.',
  durationMinutes: 60,
  totalMarks: 100,
  passingScore: 50,
  startDate: new Date().toISOString().slice(0, 16),
  endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
  randomizeQuestions: false,
  allowMultipleAttempts: false,
  autoSubmitOnTimeout: true,
  showResultsAfterSubmission: true,
  questions: [],
};

export const useLecturerStore = create<LecturerStoreState>((set) => ({
  wizardStep: 'basic_info',
  wizardData: initialWizardData,
  editingExamId: null,

  searchQuery: '',
  statusFilter: 'ALL',
  courseFilter: 'ALL',

  setWizardStep: (wizardStep) => set({ wizardStep }),

  updateWizardData: (data) =>
    set((state) => ({
      wizardData: { ...state.wizardData, ...data },
    })),

  resetWizard: () =>
    set({
      wizardStep: 'basic_info',
      wizardData: initialWizardData,
      editingExamId: null,
    }),

  setEditingExam: (id, data) =>
    set({
      editingExamId: id,
      wizardData: data ?? initialWizardData,
      wizardStep: 'basic_info',
    }),

  addQuestion: (question) =>
    set((state) => ({
      wizardData: {
        ...state.wizardData,
        questions: [...state.wizardData.questions, question],
      },
    })),

  updateQuestion: (index, question) =>
    set((state) => {
      const updated = [...state.wizardData.questions];
      updated[index] = question;
      return {
        wizardData: { ...state.wizardData, questions: updated },
      };
    }),

  removeQuestion: (index) =>
    set((state) => ({
      wizardData: {
        ...state.wizardData,
        questions: state.wizardData.questions.filter((_, i) => i !== index),
      },
    })),

  reorderQuestions: (startIndex, endIndex) =>
    set((state) => {
      const result = Array.from(state.wizardData.questions);
      const [removed] = result.splice(startIndex, 1);
      if (removed) {
        result.splice(endIndex, 0, removed);
      }
      return {
        wizardData: { ...state.wizardData, questions: result },
      };
    }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setCourseFilter: (courseFilter) => set({ courseFilter }),
}));
