import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/feedback';
import { 
  listQuestions,
  createQuestion,
  updateQuestion,
  patchQuestion,
  deleteQuestion,
  createQuestionOption,
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
  MCQ: 'multiple_choice',
  SHORT_ANSWER: 'short_answer',
  ESSAY: 'essay',
};

const FRONTEND_TO_BACKEND_TYPE: Record<FrontendQuestionType, BackendQuestionType> = {
  multiple_choice: 'MCQ',
  multiple_select: 'MCQ', // Backend doesn't have multiple_select, treat as MCQ
  true_false: 'MCQ', // True/False is a special case of MCQ
  short_answer: 'SHORT_ANSWER',
  essay: 'ESSAY',
};

// ─── Transform Functions ──────────────────────────────────────────────────────

/**
 * Transform backend question to frontend format for the wizard
 */
function transformBackendToFrontend(backendQ: BackendQuestion): FrontendQuestion {
  const frontendType = BACKEND_TO_FRONTEND_TYPE[backendQ.question_type] || 'multiple_choice';
  
  return {
    id: backendQ.id,
    type: frontendType,
    prompt: backendQ.question_text,
    marks: Math.round(backendQ.total_points),
    required: true,
    options: backendQ.options?.map(opt => ({
      id: opt.id,
      text: opt.option_text,
    })),
    correctAnswer: backendQ.options
      ?.filter(opt => opt.is_correct)
      .map(opt => opt.id)[0], // Get first correct answer ID
    explanationNote: backendQ.rubric_criteria
      ?.map(rc => `${rc.criterion_text} (${rc.point_weight} pts)`)
      .join('\n'),
  };
}

/**
 * Transform frontend question to backend format for saving
 */
function transformFrontendToBackend(
  frontendQ: FrontendQuestion,
  examinationId?: string
): CreateQuestionRequest {
  return {
    examination: examinationId,
    question_text: frontendQ.prompt,
    question_type: FRONTEND_TO_BACKEND_TYPE[frontendQ.type],
    total_points: frontendQ.marks,
  };
}

// ─── React Query Hooks ────────────────────────────────────────────────────────

const QUESTIONS_QUERY_KEY = 'exam-questions';

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

      // 2. Create options if MCQ type
      if (question.options && question.options.length > 0) {
        for (const option of question.options) {
          const isCorrect = question.correctAnswer === option.id || 
                           (Array.isArray(question.correctAnswer) && question.correctAnswer.includes(option.id));
          
          await createQuestionOption({
            question: createdQuestion.id,
            option_text: option.text,
            is_correct: isCorrect,
          });
        }
      }

      // 3. Create rubric criteria if essay/short answer
      if (question.type === 'essay' || question.type === 'short_answer') {
        if (question.explanationNote) {
          // Parse rubric from explanation note if formatted as "text (points)"
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
              // No point weight specified, use equal distribution
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
      toast.error(error?.message || 'Failed to create question');
    },
  });
}

/**
 * Update an existing question
 */
export function useUpdateExamQuestion(questionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (question: Partial<FrontendQuestion>) => {
      const updateData: UpdateQuestionRequest = {};
      
      if (question.prompt) updateData.question_text = question.prompt;
      if (question.type) updateData.question_type = FRONTEND_TO_BACKEND_TYPE[question.type];
      if (question.marks) updateData.total_points = question.marks;

      return patchQuestion(questionId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_QUERY_KEY] });
      toast.success('Question updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update question');
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
      toast.error(error?.message || 'Failed to delete question');
    },
  });
}
