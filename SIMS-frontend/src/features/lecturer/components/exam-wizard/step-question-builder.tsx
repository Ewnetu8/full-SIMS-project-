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

import type { Question, QuestionOption, QuestionType } from '../../types';

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
    setExpandedId(q.id);
  }

  async function saveQuestion() {
    if (!editingQuestion) return;

    if (!editingQuestion.prompt.trim()) {
      toast.error('Question text is required');
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

    setIsSaving(true);
    try {
      let savedId = editingQuestion.id;

      // Persist to backend if editing an existing examination
      if (examId) {
        if (editingQuestion.id && !editingQuestion.id.startsWith('q-')) {
          await updateQuestionMutation.mutateAsync({
            questionId: editingQuestion.id,
            question: editingQuestion,
            examinationId: examId,
          });
        } else {
          const res = await createQuestion.mutateAsync({
            question: editingQuestion,
            examinationId: examId,
          });
          savedId = res.id;
        }
      }

      const qToSave: Question = { ...editingQuestion, id: savedId };

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
    setEditingQuestion({ ...q, options: q.options ? [...q.options] : undefined });
    setExpandedId(q.id);
  }

  function duplicateQuestion(index: number) {
    const q = wizardData.questions[index];
    if (!q) return;
    const copy: Question = {
      ...q,
      id: generateId(),
      options: q.options?.map((o) => ({ ...o, id: generateOptionId() })),
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
    } else {
      base.options = undefined;
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

  function toggleMultiSelectAnswer(optId: string) {
    if (!editingQuestion) return;
    const current = Array.isArray(editingQuestion.correctAnswer) ? editingQuestion.correctAnswer : [];
    const updated = current.includes(optId)
      ? current.filter((id) => id !== optId)
      : [...current, optId];
    setEditingQuestion({ ...editingQuestion, correctAnswer: updated });
  }

  const totalMarksUsed = wizardData.questions.reduce((acc, q) => acc + q.marks, 0);

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

                {/* Short answer correct answer hint */}
                {(editingQuestion.type === 'SHORT_ANSWER' || editingQuestion.type === 'short_answer') && (
                  <div className="space-y-1.5">
                    <Label htmlFor="q-correct">Expected Answer (Grading Reference)</Label>
                    <Input
                      id="q-correct"
                      value={typeof editingQuestion.correctAnswer === 'string' ? editingQuestion.correctAnswer : ''}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, correctAnswer: e.target.value })
                      }
                      placeholder="e.g. O(N log N)"
                    />
                  </div>
                )}

                {/* Essay grading notes */}
                {(editingQuestion.type === 'ESSAY' || editingQuestion.type === 'essay') && (
                  <div className="space-y-1.5">
                    <Label htmlFor="q-rubric">Marking Rubric / Notes</Label>
                    <Textarea
                      id="q-rubric"
                      value={editingQuestion.explanationNote ?? ''}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, explanationNote: e.target.value })
                      }
                      placeholder="Describe how marks should be awarded..."
                      rows={3}
                    />
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
                      value={editingQuestion.marks}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          marks: parseInt(e.target.value, 10) || 1,
                        })
                      }
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
