import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/feedback';

import { 
  listQuestions,
  getQuestion,
  createQuestion,
  patchQuestion,
  deleteQuestion,
  listQuestionOptions,
  createQuestionOption,
  deleteQuestionOption,
} from '../services/questions-api';
import type { Question as FrontendQuestion, QuestionType as FrontendQuestionType } from '../types';

import type { 
  Question as BackendQuestion,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  QuestionType as BackendQuestionType
} from '@/types/lecturer';

// ─── Transform Functions ──────────────────────────────────────────────────────

/**
 * Transform backend question to frontend format for the wizard
 */
export function transformBackendToFrontend(backendQ: BackendQuestion): FrontendQuestion {
  let frontendType: FrontendQuestionType = 'MCQ';
  
  if (backendQ.options && backendQ.options.length === 2) {
    const texts = backendQ.options.map((o) => o.option_text.trim().toLowerCase());
    if ((texts.includes('true') && texts.includes('false')) || (texts.includes('t') && texts.includes('f'))) {
      frontendType = 'TRUE_FALSE';
    }
  }

  return {
    id: backendQ.id,
    type: frontendType,
    prompt: backendQ.question_text,
    marks: Math.round(Number(backendQ.total_points) || 1),
    required: true,
    options: backendQ.options?.map((opt) => ({
      id: opt.id,
      text: opt.option_text,
    })),
    correctAnswer: backendQ.options?.find((opt) => opt.is_correct)?.id,
  };
}

/**
 * Transform frontend question to backend format for saving
 */
export function transformFrontendToBackend(
  frontendQ: FrontendQuestion,
  examinationId?: string
): CreateQuestionRequest {
  return {
    examination: examinationId,
    question_text: frontendQ.prompt,
    question_type: 'MCQ',
    total_points: frontendQ.marks,
  };
}

// ─── React Query Hooks ────────────────────────────────────────────────────────

export const QUESTIONS_QUERY_KEY = 'exam-questions';

/**
 * Fetch all questions (optionally filtered by examination)
 */
export function useExamQuestions(examinationId?: string) {
  return useQuery({
    queryKey: [QUESTIONS_QUERY_KEY, examinationId],
    queryFn: async () => {
      const params = examinationId ? { examination: examinationId } : {};
      const backendQuestions = await listQuestions(params);
      return backendQuestions
        .filter((q) => q.is_active !== false)
        .map(transformBackendToFrontend);
    },
    staleTime: 0,
  });
}

/**
 * Create a new question with options (MCQ / True/False)
 */
export function useCreateExamQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      question,
      examinationId,
    }: {
      question: FrontendQuestion;
      examinationId?: string;
    }) => {
      // 1. Create the question
      const questionData = transformFrontendToBackend(question, examinationId);
      const createdQuestion = await createQuestion(questionData);

      // 2. Prepare options: ensure options exist
      let optionsToCreate: { text: string; isCorrect: boolean }[] = [];
      if (question.type === 'TRUE_FALSE' || question.type === 'true_false') {
        const isTrueCorrect = question.correctAnswer === 'True' || 
          question.options?.find((o) => o.id === question.correctAnswer)?.text.toLowerCase() === 'true';
        optionsToCreate = [
          { text: 'True', isCorrect: isTrueCorrect },
          { text: 'False', isCorrect: !isTrueCorrect },
        ];
      } else if (question.options && question.options.length > 0) {
        optionsToCreate = question.options.map((opt) => ({
          text: opt.text,
          isCorrect: question.correctAnswer === opt.id || 
            (Array.isArray(question.correctAnswer) && question.correctAnswer.includes(opt.id)),
        }));
      }

      // Sort options so that the correct option is posted FIRST (satisfying backend validation)
      const sortedOptions = [...optionsToCreate].sort((a, b) => (b.isCorrect ? 1 : 0) - (a.isCorrect ? 1 : 0));

      for (const option of sortedOptions) {
        await createQuestionOption({
          question: createdQuestion.id,
          option_text: option.text,
          is_correct: option.isCorrect,
        });
      }

      const freshQuestion = await getQuestion(createdQuestion.id);
      return transformBackendToFrontend(freshQuestion);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_QUERY_KEY] });
      toast.success('Question created successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to create question');
    },
  });
}

/**
 * Update an existing question and its options
 */
export function useUpdateExamQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questionId,
      question,
      examinationId,
    }: {
      questionId: string;
      question: FrontendQuestion;
      examinationId?: string;
    }) => {
      const updateData: UpdateQuestionRequest = {
        question_text: question.prompt,
        question_type: 'MCQ',
        total_points: question.marks,
        examination: examinationId,
      };

      await patchQuestion(questionId, updateData);

      // Clean up existing options to avoid single-option validation conflict during updates
      const existingOptions = await listQuestionOptions({ question: questionId }).catch(() => []);
      for (const existingOpt of existingOptions) {
        await deleteQuestionOption(existingOpt.id).catch(() => {});
      }

      // Recreate options with the correct option first
      let optionsToCreate: { text: string; isCorrect: boolean }[] = [];
      if (question.type === 'TRUE_FALSE' || question.type === 'true_false') {
        const isTrueCorrect = question.correctAnswer === 'True' || 
          question.options?.find((o) => o.id === question.correctAnswer)?.text.toLowerCase() === 'true';
        optionsToCreate = [
          { text: 'True', isCorrect: isTrueCorrect },
          { text: 'False', isCorrect: !isTrueCorrect },
        ];
      } else if (question.options && question.options.length > 0) {
        optionsToCreate = question.options.map((opt) => ({
          text: opt.text,
          isCorrect: question.correctAnswer === opt.id || 
            (Array.isArray(question.correctAnswer) && question.correctAnswer.includes(opt.id)),
        }));
      }

      const sortedOptions = [...optionsToCreate].sort((a, b) => (b.isCorrect ? 1 : 0) - (a.isCorrect ? 1 : 0));

      for (const option of sortedOptions) {
        await createQuestionOption({
          question: questionId,
          option_text: option.text,
          is_correct: option.isCorrect,
        });
      }

      const freshQuestion = await getQuestion(questionId);
      return transformBackendToFrontend(freshQuestion);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_QUERY_KEY] });
      toast.success('Question updated successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to update question');
    },
  });
}

/**
 * Delete a question (soft delete)
 */
export function useDeleteExamQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: string) => deleteQuestion(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_QUERY_KEY] });
      toast.success('Question deleted successfully');
    },
    onError: (error: any) => {
      console.error('[DELETE QUESTION ERROR]', {
        status: error?.response?.status,
        data: error?.response?.data,
      });
      const detail = error?.response?.data?.detail || error?.message || 'Failed to delete question';
      toast.error(detail);
    },
  });
}

