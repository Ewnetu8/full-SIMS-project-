// ─── Example React Query Hooks for Questions ──────────────────────────────────
// This is an example implementation. Copy and adapt for production use.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/feedback';
import type {
  Question,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  ListQuestionsParams,
  QuestionOption,
  CreateQuestionOptionRequest,
  RubricCriterion,
  CreateRubricCriterionRequest,
  Tag,
  CreateTagRequest,
} from '@/types/lecturer';
import {
  listQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  patchQuestion,
  deleteQuestion,
  listQuestionOptions,
  createQuestionOption,
  updateQuestionOption,
  patchQuestionOption,
  deleteQuestionOption,
  listRubricCriteria,
  createRubricCriterion,
  updateRubricCriterion,
  patchRubricCriterion,
  deleteRubricCriterion,
  listTags,
  createTag,
} from '../services';

// ─── Questions ────────────────────────────────────────────────────────────────

/**
 * Hook to fetch a list of questions with optional filters.
 * Automatically refetches when params change.
 *
 * @example
 * const { data: questions, isLoading } = useQuestions({ question_type: 'MCQ' });
 */
export function useQuestions(params?: ListQuestionsParams) {
  return useQuery({
    queryKey: ['questions', params],
    queryFn: () => listQuestions(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch a single question by ID.
 *
 * @example
 * const { data: question } = useQuestion('question-uuid');
 */
export function useQuestion(id: string) {
  return useQuery({
    queryKey: ['questions', id],
    queryFn: () => getQuestion(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new question.
 * Automatically invalidates the questions list on success.
 *
 * @example
 * const createMutation = useCreateQuestion();
 * await createMutation.mutateAsync({
 *   question_text: 'What is Python?',
 *   question_type: 'SHORT_ANSWER',
 *   total_points: 10,
 * });
 */
export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQuestionRequest) => createQuestion(data),
    onSuccess: (newQuestion) => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success(`Question "${newQuestion.question_text}" created successfully`);

      // Show warnings if any
      if ('warnings' in newQuestion && newQuestion.warnings && newQuestion.warnings.length > 0) {
        newQuestion.warnings.forEach((warning) => {
          toast.warning(warning);
        });
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to create question: ${error.message}`);
    },
  });
}

/**
 * Hook to update an existing question (full replacement).
 *
 * @example
 * const updateMutation = useUpdateQuestion('question-uuid');
 * await updateMutation.mutateAsync({ ...fullQuestionData });
 */
export function useUpdateQuestion(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQuestionRequest) => updateQuestion(id, data),
    onSuccess: (updatedQuestion) => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions', id] });
      toast.success('Question updated successfully');

      if ('warnings' in updatedQuestion && updatedQuestion.warnings && updatedQuestion.warnings.length > 0) {
        updatedQuestion.warnings.forEach((warning) => {
          toast.warning(warning);
        });
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to update question: ${error.message}`);
    },
  });
}

/**
 * Hook to partially update an existing question.
 *
 * @example
 * const patchMutation = usePatchQuestion('question-uuid');
 * await patchMutation.mutateAsync({ total_points: 15 });
 */
export function usePatchQuestion(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateQuestionRequest) => patchQuestion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: ['questions', id] });
      toast.success('Question updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update question: ${error.message}`);
    },
  });
}

/**
 * Hook to delete (soft-delete) a question.
 *
 * @example
 * const deleteMutation = useDeleteQuestion();
 * await deleteMutation.mutateAsync('question-uuid');
 */
export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteQuestion(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success(result.detail);
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete question: ${error.message}`);
    },
  });
}

// ─── Question Options ─────────────────────────────────────────────────────────

/**
 * Hook to fetch question options, typically filtered by question ID.
 *
 * @example
 * const { data: options } = useQuestionOptions({ question: 'question-uuid' });
 */
export function useQuestionOptions(params?: { question?: string }) {
  return useQuery({
    queryKey: ['question-options', params],
    queryFn: () => listQuestionOptions(params),
    enabled: !!params?.question,
  });
}

/**
 * Hook to create a question option.
 *
 * @example
 * const createMutation = useCreateQuestionOption();
 * await createMutation.mutateAsync({
 *   question: 'question-uuid',
 *   option_text: 'Option A',
 *   is_correct: true,
 * });
 */
export function useCreateQuestionOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQuestionOptionRequest) => createQuestionOption(data),
    onSuccess: (newOption) => {
      queryClient.invalidateQueries({ queryKey: ['question-options'] });
      queryClient.invalidateQueries({ queryKey: ['questions', newOption.question] });
      toast.success('Option created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create option: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a question option.
 *
 * @example
 * const deleteMutation = useDeleteQuestionOption();
 * await deleteMutation.mutateAsync('option-uuid');
 */
export function useDeleteQuestionOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteQuestionOption(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['question-options'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Option deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete option: ${error.message}`);
    },
  });
}

// ─── Rubric Criteria ──────────────────────────────────────────────────────────

/**
 * Hook to fetch rubric criteria, typically filtered by question ID.
 *
 * @example
 * const { data: criteria } = useRubricCriteria({ question: 'question-uuid' });
 */
export function useRubricCriteria(params?: { question?: string }) {
  return useQuery({
    queryKey: ['rubric-criteria', params],
    queryFn: () => listRubricCriteria(params),
    enabled: !!params?.question,
  });
}

/**
 * Hook to create a rubric criterion.
 *
 * @example
 * const createMutation = useCreateRubricCriterion();
 * await createMutation.mutateAsync({
 *   question: 'question-uuid',
 *   criterion_text: 'Clarity of explanation',
 *   point_weight: 5,
 * });
 */
export function useCreateRubricCriterion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRubricCriterionRequest) => createRubricCriterion(data),
    onSuccess: (newCriterion) => {
      queryClient.invalidateQueries({ queryKey: ['rubric-criteria'] });
      queryClient.invalidateQueries({ queryKey: ['questions', newCriterion.question] });
      toast.success('Rubric criterion created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create rubric criterion: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a rubric criterion.
 *
 * @example
 * const deleteMutation = useDeleteRubricCriterion();
 * await deleteMutation.mutateAsync('criterion-uuid');
 */
export function useDeleteRubricCriterion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteRubricCriterion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubric-criteria'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success('Rubric criterion deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete rubric criterion: ${error.message}`);
    },
  });
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

/**
 * Hook to fetch all tags.
 *
 * @example
 * const { data: tags } = useTags();
 */
export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => listTags(),
    staleTime: 1000 * 60 * 10, // 10 minutes (tags change rarely)
  });
}

/**
 * Hook to create a new tag.
 *
 * @example
 * const createMutation = useCreateTag();
 * await createMutation.mutateAsync({ name: 'Python' });
 */
export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTagRequest) => createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create tag: ${error.message}`);
    },
  });
}
