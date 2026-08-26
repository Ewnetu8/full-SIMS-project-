import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/feedback';
import { 
  listQuestions,
  createQuestion,
  updateQuestion,
  patchQuestion,
  deleteQuestion,
  listQuestionOptions,
  createQuestionOption,
  patchQuestionOption,
  deleteQuestionOption,
  createRubricCriterion,
} from '../services/questions-api';
import type { 
  Question as BackendQuestion,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  CreateQuestionOptionRequest,
  CreateRubricCriterionRequest,
  QuestionType as BackendQuestionType
} from '@/types/lecturer';
import type { Question as FrontendQuestion, QuestionType as FrontendQuestionType } from '../types';

// ─── Type Mapping ─────────────────────────────────────────────────────────────

const BACKEND_TO_FRONTEND_TYPE: Record<BackendQuestionType, FrontendQuestionType> = {
  MCQ: 'MCQ',
  SHORT_ANSWER: 'SHORT_ANSWER',
  ESSAY: 'ESSAY',
};

const FRONTEND_TO_BACKEND_TYPE: Record<string, BackendQuestionType> = {
  MCQ: 'MCQ',
  SHORT_ANSWER: 'SHORT_ANSWER',
  ESSAY: 'ESSAY',
  multiple_choice: 'MCQ',
  multiple_select: 'MCQ',
  true_false: 'MCQ',
  short_answer: 'SHORT_ANSWER',
  essay: 'ESSAY',
};

// ─── Transform Functions ──────────────────────────────────────────────────────

/**
 * Transform backend question to frontend format for the wizard
 */
export function transformBackendToFrontend(backendQ: BackendQuestion): FrontendQuestion {
  const frontendType = BACKEND_TO_FRONTEND_TYPE[backendQ.question_type] || 'MCQ';
  
  return {
    id: backendQ.id,
    type: frontendType,
    prompt: backendQ.question_text,
    marks: Math.round(Number(backendQ.total_points) || 1),
    required: true,
    options: backendQ.options?.map(opt => ({
      id: opt.id,
      text: opt.option_text,
    })),
    correctAnswer: backendQ.options?.find(opt => opt.is_correct)?.id,
    explanationNote: backendQ.rubric_criteria
      ?.map(rc => `${rc.criterion_text} (${rc.point_weight} pts)`)
      .join('\n'),
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
    question_type: FRONTEND_TO_BACKEND_TYPE[frontendQ.type] || 'MCQ',
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
      return backendQuestions.map(transformBackendToFrontend);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Create a new question with options/rubric
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

      // 2. Create options if MCQ type (correct option MUST come first for backend validation)
      const backendType = FRONTEND_TO_BACKEND_TYPE[question.type] || 'MCQ';
      if (backendType === 'MCQ' && question.options && question.options.length > 0) {
        const sortedOptions = [...question.options].sort((a, b) => {
          const isCorrectA = question.correctAnswer === a.id || 
                           (Array.isArray(question.correctAnswer) && question.correctAnswer.includes(a.id));
          const isCorrectB = question.correctAnswer === b.id || 
                           (Array.isArray(question.correctAnswer) && question.correctAnswer.includes(b.id));
          return (isCorrectB ? 1 : 0) - (isCorrectA ? 1 : 0);
        });

        for (const option of sortedOptions) {
          const isCorrect = question.correctAnswer === option.id || 
                           (Array.isArray(question.correctAnswer) && question.correctAnswer.includes(option.id));
          
          await createQuestionOption({
            question: createdQuestion.id,
            option_text: option.text,
            is_correct: Boolean(isCorrect),
          });
        }
      }

      // 3. Create rubric criteria if essay/short answer
      if (backendType === 'ESSAY' || backendType === 'SHORT_ANSWER') {
        if (question.explanationNote) {
          const rubricLines = question.explanationNote.split('\n').filter(line => line.trim());
          for (const line of rubricLines) {
            const match = line.match(/^(.+?)\s*\((\d+(?:\.\d+)?)\s*pts?\)$/);
            const textMatch = match?.[1];
            const ptsMatch = match?.[2];
            if (textMatch && ptsMatch) {
              await createRubricCriterion({
                question: createdQuestion.id,
                criterion_text: textMatch.trim(),
                point_weight: parseFloat(ptsMatch),
              });
            } else {
              const pointsPerCriterion = question.marks / rubricLines.length;
              await createRubricCriterion({
                question: createdQuestion.id,
                criterion_text: line.trim(),
                point_weight: pointsPerCriterion,
              });
            }
          }
        }
      }

      return createdQuestion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_QUERY_KEY] });
      toast.success('Question created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || error?.message || 'Failed to create question');
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
      const backendType = FRONTEND_TO_BACKEND_TYPE[question.type] || 'MCQ';
      const updateData: UpdateQuestionRequest = {
        question_text: question.prompt,
        question_type: backendType,
        total_points: question.marks,
        examination: examinationId,
      };

      const updatedQuestion = await patchQuestion(questionId, updateData);

      // If MCQ, synchronize options
      if (backendType === 'MCQ' && question.options && question.options.length > 0) {
        const existingOptions = await listQuestionOptions({ question: questionId }).catch(() => []);
        const existingOptionMap = new Map(existingOptions.map((o) => [o.id, o]));
        const currentOptionIds = new Set(question.options.map((o) => o.id));

        // Delete removed options
        for (const existingOpt of existingOptions) {
          if (!currentOptionIds.has(existingOpt.id)) {
            await deleteQuestionOption(existingOpt.id).catch(() => {});
          }
        }

        // Sort options so that the correct one is created/updated first
        const sortedOptions = [...question.options].sort((a, b) => {
          const isCorrectA = question.correctAnswer === a.id || 
                           (Array.isArray(question.correctAnswer) && question.correctAnswer.includes(a.id));
          const isCorrectB = question.correctAnswer === b.id || 
                           (Array.isArray(question.correctAnswer) && question.correctAnswer.includes(b.id));
          return (isCorrectB ? 1 : 0) - (isCorrectA ? 1 : 0);
        });

        for (const option of sortedOptions) {
          const isCorrect = question.correctAnswer === option.id || 
                           (Array.isArray(question.correctAnswer) && question.correctAnswer.includes(option.id));

          if (existingOptionMap.has(option.id)) {
            await patchQuestionOption(option.id, {
              option_text: option.text,
              is_correct: Boolean(isCorrect),
            }).catch(() => {});
          } else {
            await createQuestionOption({
              question: questionId,
              option_text: option.text,
              is_correct: Boolean(isCorrect),
            });
          }
        }
      }

      return updatedQuestion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_QUERY_KEY] });
      toast.success('Question updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.detail || error?.message || 'Failed to update question');
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
      toast.error(error?.response?.data?.detail || error?.message || 'Failed to delete question');
    },
  });
}
