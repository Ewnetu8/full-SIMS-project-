'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  GripVertical,
  Plus,
  Trash2,
  X,
  Save,
  Loader2,
} from 'lucide-react';
import * as React from 'react';

import { Label } from '@/components/forms';
import {
  Button,
  Card,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from '@/components/ui';

import { useLecturerStore } from '../../store';
import { 
  useExamQuestions,
  useCreateExamQuestion,
  useUpdateExamQuestion,
  useDeleteExamQuestion 
} from '../../hooks/use-exam-questions';
import { toast } from '@/components/feedback';

import type { Question, QuestionOption, QuestionType, RubricCriterionItem } from '../../types';

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  MCQ: 'Multiple Choice (MCQ)',
  SHORT_ANSWER: 'Short Answer',
  ESSAY: 'Essay',
  multiple_choice: 'Multiple Choice (MCQ)',
  short_answer: 'Short Answer',
  essay: 'Essay',
};

function generateId() {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function generateOptionId() {
  return `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function generateRubricId() {
  return `rc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function createDefaultQuestion(): Question {
  return {
    id: generateId(),
    type: 'MCQ',
    prompt: '',
    marks: 10,
    required: true,
    options: [
      { id: generateOptionId(), text: '' },
      { id: generateOptionId(), text: '' },
      { id: generateOptionId(), text: '' },
      { id: generateOptionId(), text: '' },
    ],
    correctAnswer: undefined,
    rubricCriteria: [],
  };
}

interface StepQuestionBuilderProps {
  onBack: () => void;
  onNext: () => void;
}

export function StepQuestionBuilder({ onBack, onNext }: StepQuestionBuilderProps) {
  const { wizardData, addQuestion, updateQuestion, removeQuestion, reorderQuestions, editingExamId } =
    useLecturerStore();
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = React.useState<Question | null>(null);
  const [marksInput, setMarksInput] = React.useState<string>('10');
  const [isSaving, setIsSaving] = React.useState(false);

  // Backend integration hooks
  const examId = editingExamId || (wizardData as any).examinationId || (wizardData as any).id;
  const { data: backendQuestions, isLoading: loadingBackend } = useExamQuestions(examId);
  const createQuestion = useCreateExamQuestion();
  const updateQuestionMutation = useUpdateExamQuestion();
  const deleteQuestion = useDeleteExamQuestion();

  // Load backend questions into wizard on mount (if editing existing exam)
  React.useEffect(() => {
    if (backendQuestions && backendQuestions.length > 0 && wizardData.questions.length === 0) {
      backendQuestions.forEach((q) => addQuestion(q));
    }
  }, [backendQuestions]);

  function openNew() {
    const q = createDefaultQuestion();
    setEditingQuestion(q);
    setMarksInput(String(q.marks || 10));
    setExpandedId(q.id);
  }

  async function saveQuestion() {
    if (!editingQuestion) return;

    if (!editingQuestion.prompt.trim()) {
      toast.error('Question text is required');
      return;
    }

    const parsedMarks = marksInput.trim() === '' ? NaN : Number(marksInput);
    if (marksInput.trim() === '' || isNaN(parsedMarks) || parsedMarks <= 0) {
      toast.error('Marks must be greater than 0');
      return;
    }

    if (
      (editingQuestion.type === 'MCQ' || editingQuestion.type === 'multiple_choice') &&
      (!editingQuestion.options || editingQuestion.options.length < 2)
    ) {
      toast.error('At least 2 options are required for MCQ questions');
      return;
    }

    if (
      (editingQuestion.type === 'MCQ' || editingQuestion.type === 'multiple_choice') &&
      !editingQuestion.correctAnswer
    ) {
      toast.error('Please select the correct option for this MCQ question');
      return;
    }

    // Validate Rubric Criteria if specified for Essay / Short Answer
    if (
      (editingQuestion.type === 'ESSAY' || editingQuestion.type === 'essay' || editingQuestion.type === 'SHORT_ANSWER' || editingQuestion.type === 'short_answer') &&
      editingQuestion.rubricCriteria &&
      editingQuestion.rubricCriteria.length > 0
    ) {
      const hasEmpty = editingQuestion.rubricCriteria.some((rc) => !rc.criterionText.trim());
      if (hasEmpty) {
        toast.error('Please provide a description for all rubric criteria');
        return;
      }

      const totalWeight = editingQuestion.rubricCriteria.reduce((sum, rc) => sum + Number(rc.pointWeight || 0), 0);
      if (totalWeight !== parsedMarks) {
        toast.error(
          `Sum of rubric criteria point weights (${totalWeight} pts) must equal question total marks (${parsedMarks} pts).`
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      let savedId = editingQuestion.id;
      const questionWithMarks = { ...editingQuestion, marks: parsedMarks };

      // Persist to backend if editing an existing examination
      if (examId) {
        if (editingQuestion.id && !editingQuestion.id.startsWith('q-')) {
          await updateQuestionMutation.mutateAsync({
            questionId: editingQuestion.id,
            question: questionWithMarks,
            examinationId: examId,
          });
        } else {
          const res = await createQuestion.mutateAsync({
            question: questionWithMarks,
            examinationId: examId,
          });
          savedId = res.id;
        }
      }

      const qToSave: Question = { ...questionWithMarks, id: savedId };

      // Update local wizard state
      const existingIndex = wizardData.questions.findIndex((q) => q.id === editingQuestion.id);
      if (existingIndex >= 0) {
        updateQuestion(existingIndex, qToSave);
      } else {
        addQuestion(qToSave);
      }

      setEditingQuestion(null);
      setExpandedId(null);
    } catch (error: any) {
      console.error('Failed to save question:', error);
      toast.error(error?.response?.data?.detail || error?.message || 'Failed to save question');
    } finally {
      setIsSaving(false);
    }
  }

  function openEdit(index: number) {
    const q = wizardData.questions[index];
    if (!q) return;
    setEditingQuestion({
      ...q,
      options: q.options ? [...q.options] : undefined,
      rubricCriteria: q.rubricCriteria ? [...q.rubricCriteria] : undefined,
    });
    setMarksInput(String(q.marks ?? 10));
    setExpandedId(q.id);
  }

  function duplicateQuestion(index: number) {
    const q = wizardData.questions[index];
    if (!q) return;
    const copy: Question = {
      ...q,
      id: generateId(),
      options: q.options?.map((o) => ({ ...o, id: generateOptionId() })),
      rubricCriteria: q.rubricCriteria?.map((rc) => ({ ...rc, id: generateRubricId() })),
    };
    addQuestion(copy);
  }

  async function handleRemoveQuestion(index: number) {
    const q = wizardData.questions[index];
    if (!q) return;

    if (q.id && !q.id.startsWith('q-')) {
      try {
        await deleteQuestion.mutateAsync(q.id);
      } catch (err) {
        console.error('Failed to delete question from backend:', err);
      }
    }

    removeQuestion(index);
  }

  function updateEditingType(type: QuestionType) {
    if (!editingQuestion) return;
    const base = { ...editingQuestion, type, correctAnswer: undefined };
    if (type === 'MCQ' || type === 'multiple_choice') {
      if (!base.options || base.options.length === 0) {
        base.options = [
          { id: generateOptionId(), text: '' },
          { id: generateOptionId(), text: '' },
          { id: generateOptionId(), text: '' },
          { id: generateOptionId(), text: '' },
        ];
      }
      base.rubricCriteria = undefined;
    } else {
      base.options = undefined;
      if (!base.rubricCriteria || base.rubricCriteria.length === 0) {
        base.rubricCriteria = [
          {
            id: generateRubricId(),
            criterionText: 'Understanding of the concept',
            pointWeight: base.marks,
          },
        ];
      }
    }
    setEditingQuestion(base);
  }

  function addOption() {
    if (!editingQuestion) return;
    setEditingQuestion({
      ...editingQuestion,
      options: [...(editingQuestion.options ?? []), { id: generateOptionId(), text: '' }],
    });
  }

  function updateOption(id: string, text: string) {
    if (!editingQuestion?.options) return;
    setEditingQuestion({
      ...editingQuestion,
      options: editingQuestion.options.map((o) => (o.id === id ? { ...o, text } : o)),
    });
  }

  function removeOption(id: string) {
    if (!editingQuestion?.options) return;
    setEditingQuestion({
      ...editingQuestion,
      options: editingQuestion.options.filter((o) => o.id !== id),
    });
  }

  function addRubricCriterion() {
    if (!editingQuestion) return;
    const current = editingQuestion.rubricCriteria ?? [];
    const usedMarks = current.reduce((sum, rc) => sum + Number(rc.pointWeight || 0), 0);
    const remainingMarks = Math.max(1, editingQuestion.marks - usedMarks);
    setEditingQuestion({
      ...editingQuestion,
      rubricCriteria: [
        ...current,
        {
          id: generateRubricId(),
          criterionText: '',
          pointWeight: remainingMarks,
        },
      ],
    });
  }

  function updateRubricCriterion(id: string, updates: Partial<RubricCriterionItem>) {
    if (!editingQuestion?.rubricCriteria) return;
    setEditingQuestion({
      ...editingQuestion,
      rubricCriteria: editingQuestion.rubricCriteria.map((rc) =>
        rc.id === id ? { ...rc, ...updates } : rc
      ),
    });
  }

  function removeRubricCriterion(id: string) {
    if (!editingQuestion?.rubricCriteria) return;
    setEditingQuestion({
      ...editingQuestion,
      rubricCriteria: editingQuestion.rubricCriteria.filter((rc) => rc.id !== id),
    });
  }

  function distributeRubricMarksEvenly() {
    if (!editingQuestion?.rubricCriteria || editingQuestion.rubricCriteria.length === 0) return;
    const count = editingQuestion.rubricCriteria.length;
    const perItem = Math.floor(editingQuestion.marks / count);
    const remainder = editingQuestion.marks % count;

    setEditingQuestion({
      ...editingQuestion,
      rubricCriteria: editingQuestion.rubricCriteria.map((rc, idx) => ({
        ...rc,
        pointWeight: idx === 0 ? perItem + remainder : perItem,
      })),
    });
  }

  const totalMarksUsed = wizardData.questions.reduce((acc, q) => acc + q.marks, 0);
  const isEssayOrShortAnswer =
    editingQuestion?.type === 'ESSAY' ||
    editingQuestion?.type === 'essay' ||
    editingQuestion?.type === 'SHORT_ANSWER' ||
    editingQuestion?.type === 'short_answer';

  const rubricTotalWeight =
    editingQuestion?.rubricCriteria?.reduce((sum, rc) => sum + Number(rc.pointWeight || 0), 0) ?? 0;

  // Show loading state while fetching backend questions
  if (loadingBackend) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading questions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header summary */}
      <Card>
        <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-foreground">Question Builder</h2>
            <p className="text-xs text-muted-foreground">
              {wizardData.questions.length} question{wizardData.questions.length !== 1 ? 's' : ''} ·{' '}
              <span className={totalMarksUsed > wizardData.totalMarks ? 'text-destructive font-medium' : 'text-foreground'}>
                {totalMarksUsed}
              </span>{' '}
              / {wizardData.totalMarks} marks allocated
            </p>
          </div>
          <Button onClick={openNew} leftIcon={<Plus className="h-4 w-4" />}>
            Add Question
          </Button>
        </CardContent>
      </Card>

      {/* Question Editor panel */}
      <AnimatePresence>
        {editingQuestion && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card className="border-primary/30 shadow-lg">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-foreground">
                    {wizardData.questions.find((q) => q.id === editingQuestion.id)
                      ? 'Edit Question'
                      : 'New Question'}
                  </h3>
                  <button
                    onClick={() => setEditingQuestion(null)}
                    className="rounded-full p-1 hover:bg-muted text-muted-foreground"
                    aria-label="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Type selector */}
                <div className="space-y-1.5">
                  <Label required>Question Type</Label>
                  <Select
                    value={editingQuestion.type}
                    onValueChange={(v) => updateEditingType(v as QuestionType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Prompt */}
                <div className="space-y-1.5">
                  <Label htmlFor="q-prompt" required>Question Text</Label>
                  <Textarea
                    id="q-prompt"
                    value={editingQuestion.prompt}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, prompt: e.target.value })
                    }
                    placeholder="Enter the question clearly and precisely..."
                    rows={3}
                  />
                </div>

                {/* Options for MCQ */}
                {(editingQuestion.type === 'MCQ' || editingQuestion.type === 'multiple_choice') &&
                  editingQuestion.options && (
                    <div className="space-y-2">
                      <Label required>Answer Options (Select correct answer)</Label>
                      {editingQuestion.options.map((opt) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correct"
                            value={opt.id}
                            checked={editingQuestion.correctAnswer === opt.id}
                            onChange={() =>
                              setEditingQuestion({ ...editingQuestion, correctAnswer: opt.id })
                            }
                            className="accent-primary h-4 w-4 cursor-pointer"
                            aria-label={`Mark "${opt.text || opt.id}" as correct`}
                          />
                          <Input
                            value={opt.text}
                            onChange={(e) => updateOption(opt.id, e.target.value)}
                            placeholder="Option text"
                            className="flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(opt.id)}
                            className="text-muted-foreground hover:text-destructive rounded-md p-1"
                            aria-label="Remove option"
                            disabled={editingQuestion.options!.length <= 2}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={addOption}
                        leftIcon={<Plus className="h-3.5 w-3.5" />}
                      >
                        Add Option
                      </Button>
                    </div>
                  )}

                {/* Rubric Criteria for Essay / Short Answer */}
                {isEssayOrShortAnswer && (
                  <div className="space-y-3 rounded-xl border border-border p-4 bg-muted/20">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <Label className="font-semibold text-sm">Evaluation Rubric Criteria</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Define criteria and point weights for evaluating student answers.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {editingQuestion.rubricCriteria && editingQuestion.rubricCriteria.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            onClick={distributeRubricMarksEvenly}
                          >
                            Distribute Evenly
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={addRubricCriterion}
                          leftIcon={<Plus className="h-3 w-3" />}
                        >
                          Add Criterion
                        </Button>
                      </div>
                    </div>

                    {(!editingQuestion.rubricCriteria || editingQuestion.rubricCriteria.length === 0) ? (
                      <div className="py-6 text-center rounded-lg border border-dashed border-border/80 bg-background/50">
                        <p className="text-xs text-muted-foreground">
                          No rubric criteria added yet.
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Click &quot;Add Criterion&quot; to define evaluation metrics and point weights.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {editingQuestion.rubricCriteria.map((rc, idx) => (
                          <div
                            key={rc.id}
                            className="flex items-center gap-2 bg-background p-2.5 rounded-lg border border-border"
                          >
                            <span className="text-xs font-mono text-muted-foreground w-6 text-center">
                              #{idx + 1}
                            </span>
                            <Input
                              value={rc.criterionText}
                              onChange={(e) =>
                                updateRubricCriterion(rc.id, { criterionText: e.target.value })
                              }
                              placeholder="e.g. Quality of explanation, Accuracy of diagram, Depth of analysis"
                              className="flex-1 text-xs"
                            />
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Input
                                type="number"
                                min={0.5}
                                step={0.5}
                                value={rc.pointWeight === 0 ? '0' : (rc.pointWeight ?? '')}
                                onChange={(e) =>
                                  updateRubricCriterion(rc.id, {
                                    pointWeight: e.target.value === '' ? ('' as any) : Number(e.target.value),
                                  })
                                }
                                className="w-20 text-xs"
                                placeholder="Pts"
                              />
                              <span className="text-xs text-muted-foreground font-medium">pts</span>
                              <button
                                type="button"
                                onClick={() => removeRubricCriterion(rc.id)}
                                className="text-muted-foreground hover:text-destructive rounded-md p-1 ml-1"
                                aria-label="Remove criterion"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Weight comparison banner */}
                        <div
                          className={`flex items-center justify-between text-xs px-3 py-2 rounded-lg ${
                            rubricTotalWeight === (marksInput ? Number(marksInput) : editingQuestion.marks)
                              ? 'bg-success/10 text-success border border-success/20'
                              : 'bg-destructive/10 text-destructive border border-destructive/20'
                          }`}
                        >
                          <span>
                            Total Criteria Weight: <strong>{rubricTotalWeight} pts</strong>
                          </span>
                          <span>
                            Question Total Marks: <strong>{marksInput || editingQuestion.marks} pts</strong>
                            {rubricTotalWeight !== (marksInput ? Number(marksInput) : editingQuestion.marks) && ' (Must match)'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Marks + Required toggle */}
                <div className="flex flex-wrap items-end gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="q-marks" required>Marks</Label>
                    <Input
                      id="q-marks"
                      type="number"
                      min={1}
                      className="w-28"
                      value={marksInput}
                      onChange={(e) => setMarksInput(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 pb-1">
                    <Switch
                      id="q-required"
                      checked={editingQuestion.required}
                      onCheckedChange={(checked) =>
                        setEditingQuestion({ ...editingQuestion, required: checked })
                      }
                    />
                    <Label htmlFor="q-required" className="font-medium">Required</Label>
                  </div>
                </div>

                {/* Save / Cancel */}
                <div className="flex justify-end gap-2 border-t border-border pt-4">
                  <Button type="button" variant="outline" onClick={() => setEditingQuestion(null)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={saveQuestion}
                    disabled={!editingQuestion.prompt.trim() || isSaving}
                    leftIcon={isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  >
                    {isSaving ? 'Saving...' : 'Save Question'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Questions list */}
      {wizardData.questions.length === 0 && !editingQuestion ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-border">
          <p className="text-muted-foreground font-medium">No questions added yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Add Question" to build your examination.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {wizardData.questions.map((q, index) => (
            <motion.div key={q.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 pt-0.5">
                      <button
                        type="button"
                        aria-label="Move up"
                        onClick={() => index > 0 && reorderQuestions(index, index - 1)}
                        disabled={index === 0}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                      <button
                        type="button"
                        aria-label="Move down"
                        onClick={() => index < wizardData.questions.length - 1 && reorderQuestions(index, index + 1)}
                        disabled={index === wizardData.questions.length - 1}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                          Q{index + 1}
                        </span>
                        <span className="text-xs text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">
                          {QUESTION_TYPE_LABELS[q.type]}
                        </span>
                        <span className="text-xs text-muted-foreground">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground line-clamp-2">{q.prompt || '(No question text)'}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => openEdit(index)}
                        aria-label="Edit question"
                      >
                        <span className="text-xs">Edit</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => duplicateQuestion(index)}
                        aria-label="Duplicate question"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => handleRemoveQuestion(index)}
                        aria-label="Remove question"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button
          type="button"
          onClick={onNext}
          disabled={wizardData.questions.length === 0}
          size="lg"
        >
          Review & Publish →
        </Button>
      </div>
    </div>
  );
}
