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
  Check,
} from 'lucide-react';
import * as React from 'react';

import { Label } from '@/components/forms';
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

import type { Question, QuestionType } from '../../types';

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  MCQ: 'Multiple Choice (MCQ)',
  TRUE_FALSE: 'True / False (T/F)',
  multiple_choice: 'Multiple Choice (MCQ)',
  true_false: 'True / False (T/F)',
};

function generateId() {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function generateOptionId() {
  return `opt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function createDefaultMcqQuestion(): Question {
  const opt1 = generateOptionId();
  const opt2 = generateOptionId();
  const opt3 = generateOptionId();
  const opt4 = generateOptionId();
  return {
    id: generateId(),
    type: 'MCQ',
    prompt: '',
    marks: 2,
    required: true,
    options: [
      { id: opt1, text: '' },
      { id: opt2, text: '' },
      { id: opt3, text: '' },
      { id: opt4, text: '' },
    ],
    correctAnswer: opt1,
  };
}

function createDefaultTfQuestion(): Question {
  const optTrue = generateOptionId();
  const optFalse = generateOptionId();
  return {
    id: generateId(),
    type: 'TRUE_FALSE',
    prompt: '',
    marks: 1,
    required: true,
    options: [
      { id: optTrue, text: 'True' },
      { id: optFalse, text: 'False' },
    ],
    correctAnswer: optTrue,
  };
}

interface StepQuestionBuilderProps {
  onBack: () => void;
  onNext: () => void;
}

export function StepQuestionBuilder({ onBack, onNext }: StepQuestionBuilderProps) {
  const { wizardData, addQuestion, setQuestions, updateQuestion, removeQuestion, reorderQuestions, editingExamId } =
    useLecturerStore();
  const [editingQuestion, setEditingQuestion] = React.useState<Question | null>(null);
  const [marksInput, setMarksInput] = React.useState<string>('2');
  const [isSaving, setIsSaving] = React.useState(false);
  const [deletingQuestion, setDeletingQuestion] = React.useState<{ question: Question; index: number } | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Backend integration hooks
  const examId = editingExamId || (wizardData as any).examinationId || (wizardData as any).id;
  const { data: backendQuestions, isLoading: loadingBackend } = useExamQuestions(examId);
  const createQuestion = useCreateExamQuestion();
  const updateQuestionMutation = useUpdateExamQuestion();
  const deleteQuestion = useDeleteExamQuestion();

  // Synchronize authoritative backend questions into wizard on load or mutation
  React.useEffect(() => {
    if (examId && backendQuestions) {
      setQuestions(backendQuestions);
    }
  }, [examId, backendQuestions, setQuestions]);

  function openNew(type: QuestionType = 'MCQ') {
    const q = type === 'TRUE_FALSE' || type === 'true_false' ? createDefaultTfQuestion() : createDefaultMcqQuestion();
    setEditingQuestion(q);
    setMarksInput(String(q.marks || (type === 'TRUE_FALSE' ? 1 : 2)));
  }

  function updateEditingType(type: QuestionType) {
    if (!editingQuestion) return;
    if (type === 'TRUE_FALSE' || type === 'true_false') {
      const optTrue = generateOptionId();
      const optFalse = generateOptionId();
      setEditingQuestion({
        ...editingQuestion,
        type: 'TRUE_FALSE',
        marks: editingQuestion.marks || 1,
        options: [
          { id: optTrue, text: 'True' },
          { id: optFalse, text: 'False' },
        ],
        correctAnswer: optTrue,
      });
      setMarksInput(String(editingQuestion.marks || 1));
    } else {
      const opt1 = generateOptionId();
      const opt2 = generateOptionId();
      const opt3 = generateOptionId();
      const opt4 = generateOptionId();
      setEditingQuestion({
        ...editingQuestion,
        type: 'MCQ',
        marks: editingQuestion.marks || 2,
        options: [
          { id: opt1, text: '' },
          { id: opt2, text: '' },
          { id: opt3, text: '' },
          { id: opt4, text: '' },
        ],
        correctAnswer: opt1,
      });
      setMarksInput(String(editingQuestion.marks || 2));
    }
  }

  function addOption() {
    if (!editingQuestion) return;
    const newOptId = generateOptionId();
    setEditingQuestion({
      ...editingQuestion,
      options: [...(editingQuestion.options ?? []), { id: newOptId, text: '' }],
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
    const newOptions = editingQuestion.options.filter((o) => o.id !== id);
    let newCorrect = editingQuestion.correctAnswer;
    if (newCorrect === id && newOptions.length > 0) {
      newCorrect = newOptions[0]?.id;
    }
    setEditingQuestion({
      ...editingQuestion,
      options: newOptions,
      correctAnswer: newCorrect,
    });
  }

  async function saveQuestion() {
    if (!editingQuestion) return;

    if (!editingQuestion.prompt.trim()) {
      toast.error('Question text is required');
      return;
    }

    const parsedMarks = marksInput.trim() === '' ? NaN : Number(marksInput);
    if (marksInput.trim() === '' || isNaN(parsedMarks) || parsedMarks <= 0) {
      toast.error('Total points must be greater than 0');
      return;
    }

    const isTf = editingQuestion.type === 'TRUE_FALSE' || editingQuestion.type === 'true_false';

    if (!isTf) {
      if (!editingQuestion.options || editingQuestion.options.length < 2) {
        toast.error('At least 2 options are required for MCQ questions');
        return;
      }

      const emptyOption = editingQuestion.options.some((o) => !o.text.trim());
      if (emptyOption) {
        toast.error('Please enter text for all options or remove unused ones');
        return;
      }

      if (!editingQuestion.correctAnswer) {
        toast.error('Please select the correct answer option');
        return;
      }
    } else {
      if (!editingQuestion.correctAnswer) {
        toast.error('Please select whether True or False is the correct answer');
        return;
      }
    }

    setIsSaving(true);
    try {
      const questionWithMarks = { ...editingQuestion, marks: parsedMarks };
      let savedQ: Question = questionWithMarks;

      // Persist to backend if editing an existing examination
      if (examId) {
        if (editingQuestion.id && !editingQuestion.id.startsWith('q-')) {
          savedQ = await updateQuestionMutation.mutateAsync({
            questionId: editingQuestion.id,
            question: questionWithMarks,
            examinationId: examId,
          });
        } else {
          savedQ = await createQuestion.mutateAsync({
            question: questionWithMarks,
            examinationId: examId,
          });
        }
      }

      // Update local wizard state with authoritative saved question
      const existingIndex = wizardData.questions.findIndex((q) => q.id === editingQuestion.id);
      if (existingIndex >= 0) {
        updateQuestion(existingIndex, savedQ);
      } else {
        addQuestion(savedQ);
      }

      setEditingQuestion(null);
    } catch (error: any) {
      console.error('[EXAM API ERROR] Failed to save question:', {
        status: error?.response?.status,
        response: error?.response?.data,
      });
      const detail = error?.response?.data?.detail || error?.message || 'Failed to save question';
      toast.error(detail);
    } finally {
      setIsSaving(false);
    }
  }

  function openEdit(index: number) {
    const q = wizardData.questions[index];
    if (!q) return;

    let isTf = q.type === 'TRUE_FALSE' || q.type === 'true_false';
    if (!isTf && q.options && q.options.length === 2) {
      const texts = q.options.map((o) => o.text.trim().toLowerCase());
      if (texts.includes('true') && texts.includes('false')) {
        isTf = true;
      }
    }

    setEditingQuestion({
      ...q,
      type: isTf ? 'TRUE_FALSE' : 'MCQ',
      options: q.options ? q.options.map((o) => ({ ...o })) : undefined,
    });
    setMarksInput(String(q.marks ?? (isTf ? 1 : 2)));
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

  async function handleConfirmDelete() {
    if (!deletingQuestion) return;
    const { question, index } = deletingQuestion;

    setIsDeleting(true);
    try {
      if (question.id && !question.id.startsWith('q-')) {
        await deleteQuestion.mutateAsync(question.id);
      }
      removeQuestion(index);
      setDeletingQuestion(null);
    } catch (err: any) {
      console.error('[DELETE QUESTION ERROR]', {
        status: err?.response?.status,
        data: err?.response?.data,
      });
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail || err?.message;
      if (status === 404) {
        toast.error('Question not found', {
          description: 'The question may have already been deleted.',
        });
        removeQuestion(index);
        setDeletingQuestion(null);
      } else if (status === 403) {
        toast.error('Permission Denied', {
          description: 'You do not have permission to delete this question.',
        });
      } else if (status === 409) {
        toast.error('Cannot Delete Question', {
          description: detail || 'This question cannot be deleted because it has referenced records.',
        });
      } else {
        toast.error('Failed to delete question', {
          description: detail || 'Unable to delete question. Please try again.',
        });
      }
    } finally {
      setIsDeleting(false);
    }
  }

  const totalMarksUsed = wizardData.questions.reduce((acc, q) => acc + q.marks, 0);

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
          <div className="flex items-center gap-2">
            <Button onClick={() => openNew('MCQ')} leftIcon={<Plus className="h-4 w-4" />}>
              Add MCQ
            </Button>
            <Button onClick={() => openNew('TRUE_FALSE')} variant="outline" leftIcon={<Plus className="h-4 w-4" />}>
              Add True / False
            </Button>
          </div>
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
                      <SelectItem value="MCQ">Multiple Choice (MCQ)</SelectItem>
                      <SelectItem value="TRUE_FALSE">True / False (T/F)</SelectItem>
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

                {/* Options for True / False */}
                {(editingQuestion.type === 'TRUE_FALSE' || editingQuestion.type === 'true_false') && (
                  <div className="space-y-2 rounded-xl border border-border p-4 bg-muted/20">
                    <Label required className="font-semibold text-sm">Correct Answer</Label>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {['True', 'False'].map((tfVal) => {
                        const isSelected =
                          editingQuestion.correctAnswer === tfVal ||
                          editingQuestion.options?.find((o) => o.id === editingQuestion.correctAnswer)?.text.toLowerCase() === tfVal.toLowerCase();

                        return (
                          <label
                            key={tfVal}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                              isSelected
                                ? 'border-primary bg-primary/10 text-primary font-semibold'
                                : 'border-border bg-background hover:border-border/80'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="radio"
                                name="tf-correct"
                                value={tfVal}
                                checked={isSelected}
                                onChange={() => {
                                  const matchingOpt = editingQuestion.options?.find(
                                    (o) => o.text.toLowerCase() === tfVal.toLowerCase()
                                  );
                                  setEditingQuestion({
                                    ...editingQuestion,
                                    correctAnswer: matchingOpt ? matchingOpt.id : tfVal,
                                  });
                                }}
                                className="accent-primary h-4 w-4"
                              />
                              <span className="text-sm">{tfVal}</span>
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-primary" />}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Options for Multiple Choice */}
                {(editingQuestion.type === 'MCQ' || editingQuestion.type === 'multiple_choice') &&
                  editingQuestion.options && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label required className="font-semibold text-sm">
                          Answer Options (Select the correct answer)
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          {editingQuestion.options.length} options
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {editingQuestion.options.map((opt, idx) => {
                          const optionLetter = String.fromCharCode(65 + idx);
                          const isCorrect = editingQuestion.correctAnswer === opt.id;

                          return (
                            <div
                              key={opt.id}
                              className={`flex items-center gap-2 p-2.5 rounded-lg border transition ${
                                isCorrect ? 'border-primary/60 bg-primary/5' : 'border-border bg-background'
                              }`}
                            >
                              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                                <input
                                  type="radio"
                                  name="mcq-correct"
                                  value={opt.id}
                                  checked={isCorrect}
                                  onChange={() =>
                                    setEditingQuestion({ ...editingQuestion, correctAnswer: opt.id })
                                  }
                                  className="accent-primary h-4 w-4 cursor-pointer"
                                  aria-label={`Mark Option ${optionLetter} as correct`}
                                />
                                <span className="font-mono text-xs font-bold text-muted-foreground w-5">
                                  {optionLetter}.
                                </span>
                              </label>
                              <Input
                                value={opt.text}
                                onChange={(e) => updateOption(opt.id, e.target.value)}
                                placeholder={`Option ${optionLetter} text`}
                                className="flex-1 text-sm"
                              />
                              {isCorrect && (
                                <Badge variant="success" className="text-2xs shrink-0">
                                  Correct
                                </Badge>
                              )}
                              <button
                                type="button"
                                onClick={() => removeOption(opt.id)}
                                className="text-muted-foreground hover:text-destructive rounded-md p-1 shrink-0 disabled:opacity-30"
                                aria-label="Remove option"
                                disabled={editingQuestion.options!.length <= 2}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
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

                {/* Marks + Required toggle */}
                <div className="flex flex-wrap items-end gap-4 border-t border-border pt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="q-marks" required>Points / Marks</Label>
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
          <p className="text-xs text-muted-foreground mt-1">Click &quot;Add MCQ&quot; or &quot;Add True / False&quot; to build your examination.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {wizardData.questions.map((q, index) => {
            const isTf = q.type === 'TRUE_FALSE' || q.type === 'true_false';
            const typeLabel = isTf ? 'True / False' : 'Multiple Choice';

            return (
              <motion.div key={q.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="hover:border-primary/40 transition">
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

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground font-semibold">
                            Q{index + 1}
                          </span>
                          <Badge variant="secondary" className="text-xs font-medium">
                            {typeLabel}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-medium">
                            {q.marks} pt{q.marks !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <p className="text-sm font-semibold text-foreground">{q.prompt || '(No question text)'}</p>

                        {/* Options display */}
                        {isTf ? (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Correct answer:</span>{' '}
                            <Badge variant="success" className="text-2xs font-mono ml-1">
                              {q.options?.find((o) => o.id === q.correctAnswer)?.text ||
                               (q.correctAnswer === 'True' || q.correctAnswer === 'opt-true' ? 'True' : 'False')}
                            </Badge>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                            {q.options?.map((opt, optIdx) => {
                              const letter = String.fromCharCode(65 + optIdx);
                              const isCorrect = q.correctAnswer === opt.id;
                              return (
                                <div
                                  key={opt.id || optIdx}
                                  className={`text-xs px-2.5 py-1 rounded flex items-center gap-1.5 ${
                                    isCorrect
                                      ? 'bg-success/10 text-success font-semibold border border-success/30'
                                      : 'bg-muted/40 text-muted-foreground'
                                  }`}
                                >
                                  <span className="font-mono font-bold">{letter}.</span>
                                  <span className="truncate">{opt.text}</span>
                                  {isCorrect && <Check className="h-3 w-3 ml-auto text-success" />}
                                </div>
                              );
                            })}
                          </div>
                        )}
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
                          onClick={() => setDeletingQuestion({ question: q, index })}
                          aria-label={`Delete Question ${index + 1}`}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete Question Confirmation Dialog */}
      <Dialog open={!!deletingQuestion} onOpenChange={(open) => !open && !isDeleting && setDeletingQuestion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action will remove it from the examination.
            </DialogDescription>
          </DialogHeader>
          {deletingQuestion && (
            <div className="p-3.5 bg-muted/40 rounded-lg border border-border/70 text-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                  Q{deletingQuestion.index + 1}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {QUESTION_TYPE_LABELS[deletingQuestion.question.type] || deletingQuestion.question.type}
                </Badge>
                <span className="text-muted-foreground">
                  {deletingQuestion.question.marks} mark{deletingQuestion.question.marks !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-foreground font-medium line-clamp-2">
                {deletingQuestion.question.prompt || '(No question text)'}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingQuestion(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              loading={isDeleting}
            >
              Delete Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          Review & Confirm →
        </Button>
      </div>
    </div>
  );
}
