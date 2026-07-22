import { create } from 'zustand';

import type { ExaminationAnswer, ExaminationSession, SubmissionReceipt } from '../types';

interface ExaminationState {
  session: ExaminationSession | null;
  answers: Record<string, ExaminationAnswer>;
  flaggedQuestionIds: string[];
  currentQuestionIndex: number;
  secondsRemaining: number;
  lastSavedAt: string | null;
  saveState: 'idle' | 'saving' | 'saved';
  receipt: SubmissionReceipt | null;
  initialize: (session: ExaminationSession) => void;
  setAnswer: (questionId: string, answer: ExaminationAnswer) => void;
  toggleFlag: (questionId: string) => void;
  setCurrentQuestion: (index: number) => void;
  tick: () => void;
  setSaving: () => void;
  setSaved: (timestamp: string) => void;
  setReceipt: (receipt: SubmissionReceipt) => void;
  reset: () => void;
}

const initialState = {
  session: null,
  answers: {},
  flaggedQuestionIds: [],
  currentQuestionIndex: 0,
  secondsRemaining: 0,
  lastSavedAt: null,
  saveState: 'idle' as const,
  receipt: null,
};

export const useExaminationStore = create<ExaminationState>()((set) => ({
  ...initialState,
  initialize: (session) => set({ ...initialState, session, secondsRemaining: session.durationSeconds }),
  setAnswer: (questionId, answer) => set((state) => ({ answers: { ...state.answers, [questionId]: answer } })),
  toggleFlag: (questionId) => set((state) => ({ flaggedQuestionIds: state.flaggedQuestionIds.includes(questionId) ? state.flaggedQuestionIds.filter((id) => id !== questionId) : [...state.flaggedQuestionIds, questionId] })),
  setCurrentQuestion: (index) => set({ currentQuestionIndex: index }),
  tick: () => set((state) => ({ secondsRemaining: Math.max(0, state.secondsRemaining - 1) })),
  setSaving: () => set({ saveState: 'saving' }),
  setSaved: (timestamp) => set({ saveState: 'saved', lastSavedAt: timestamp }),
  setReceipt: (receipt) => set({ receipt }),
  reset: () => set(initialState),
}));