'use client';

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
  Textarea,
} from '@/components/ui';

import { lecturerService } from '../../services';
import { useLecturerStore } from '../../store';

import type { Course } from '../../types';

interface StepBasicInfoProps {
  onNext: () => void;
}

export function StepBasicInfo({ onNext }: StepBasicInfoProps) {
  const { wizardData, updateWizardData } = useLecturerStore();
  const [courses, setCourses] = React.useState<Course[]>([]);

  // String state for raw numeric editing
  const [durationInput, setDurationInput] = React.useState(
    wizardData.durationMinutes !== undefined && wizardData.durationMinutes !== null
      ? String(wizardData.durationMinutes)
      : '60',
  );
  const [totalMarksInput, setTotalMarksInput] = React.useState(
    wizardData.totalMarks !== undefined && wizardData.totalMarks !== null
      ? String(wizardData.totalMarks)
      : '100',
  );
  const [passingScoreInput, setPassingScoreInput] = React.useState(
    wizardData.passingScore !== undefined && wizardData.passingScore !== null
      ? String(wizardData.passingScore)
      : '50',
  );

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    lecturerService.getCourses().then((loadedCourses) => {
      setCourses(loadedCourses);
      if (loadedCourses.length > 0) {
        const exists = loadedCourses.some((c) => c.id === wizardData.courseId);
        if (!exists && loadedCourses[0]) {
          updateWizardData({ courseId: loadedCourses[0].id });
        }
      }
    });
  }, []);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!wizardData.title.trim()) {
      newErrors.title = 'Exam title is required.';
    } else if (wizardData.title.trim().length < 5) {
      newErrors.title = 'Exam title must be at least 5 characters.';
    }

    if (!wizardData.courseId) {
      newErrors.course = 'Please select a course.';
    }

    const duration = durationInput.trim() === '' ? NaN : Number(durationInput);
    if (durationInput.trim() === '' || isNaN(duration)) {
      newErrors.duration = 'Duration is required.';
    } else if (duration <= 0) {
      newErrors.duration = 'Duration must be greater than 0 minutes.';
    }

    const totalMarks = totalMarksInput.trim() === '' ? NaN : Number(totalMarksInput);
    if (totalMarksInput.trim() === '' || isNaN(totalMarks)) {
      newErrors.totalMarks = 'Total marks is required.';
    } else if (totalMarks <= 0) {
      newErrors.totalMarks = 'Total marks must be greater than 0.';
    }

    const passingScore = passingScoreInput.trim() === '' ? NaN : Number(passingScoreInput);
    if (passingScoreInput.trim() === '' || isNaN(passingScore)) {
      newErrors.passingScore = 'Passing score is required.';
    } else if (passingScore < 0) {
      newErrors.passingScore = 'Passing score must be 0 or greater.';
    } else if (!isNaN(totalMarks) && passingScore > totalMarks) {
      newErrors.passingScore = 'Passing score cannot be greater than total marks.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    updateWizardData({
      durationMinutes: Number(durationInput),
      totalMarks: Number(totalMarksInput),
      passingScore: Number(passingScoreInput),
    });
    onNext();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-5">
          <h2 className="text-base font-semibold text-foreground">Examination Details</h2>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="exam-title" required>Exam Title</Label>
            <Input
              id="exam-title"
              value={wizardData.title}
              onChange={(e) => {
                updateWizardData({ title: e.target.value });
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              placeholder="e.g. Midterm Assessment: Data Structures & Algorithms"
              error={!!errors.title}
            />
            {errors.title && (
              <p className="text-xs text-destructive font-medium">{errors.title}</p>
            )}
          </div>

          {/* Course */}
          <div className="space-y-1.5">
            <Label htmlFor="exam-course" required>Course</Label>
            <Select
              value={wizardData.courseId}
              onValueChange={(v) => {
                updateWizardData({ courseId: v });
                if (errors.course) setErrors((prev) => ({ ...prev, course: '' }));
              }}
            >
              <SelectTrigger id="exam-course">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.course && (
              <p className="text-xs text-destructive font-medium">{errors.course}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="exam-desc">Description</Label>
            <Textarea
              id="exam-desc"
              value={wizardData.description}
              onChange={(e) => updateWizardData({ description: e.target.value })}
              placeholder="Brief overview of what this examination covers..."
              rows={3}
            />
          </div>

          {/* Instructions */}
          <div className="space-y-1.5">
            <Label htmlFor="exam-instructions">Instructions for Students</Label>
            <Textarea
              id="exam-instructions"
              value={wizardData.instructions}
              onChange={(e) => updateWizardData({ instructions: e.target.value })}
              placeholder="Enter instructions (one per line)..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">Students will see these instructions before beginning the exam.</p>
          </div>

          {/* Duration, Marks, Passing */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="exam-duration" required>Duration (Minutes)</Label>
              <Input
                id="exam-duration"
                type="number"
                min={1}
                value={durationInput}
                onChange={(e) => {
                  setDurationInput(e.target.value);
                  if (errors.duration) setErrors((prev) => ({ ...prev, duration: '' }));
                }}
                error={!!errors.duration}
              />
              {errors.duration && (
                <p className="text-xs text-destructive font-medium">{errors.duration}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exam-total-marks" required>Total Marks</Label>
              <Input
                id="exam-total-marks"
                type="number"
                min={1}
                value={totalMarksInput}
                onChange={(e) => {
                  setTotalMarksInput(e.target.value);
                  if (errors.totalMarks) setErrors((prev) => ({ ...prev, totalMarks: '' }));
                }}
                error={!!errors.totalMarks}
              />
              {errors.totalMarks && (
                <p className="text-xs text-destructive font-medium">{errors.totalMarks}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exam-passing" required>Passing Score</Label>
              <Input
                id="exam-passing"
                type="number"
                min={0}
                value={passingScoreInput}
                onChange={(e) => {
                  setPassingScoreInput(e.target.value);
                  if (errors.passingScore) setErrors((prev) => ({ ...prev, passingScore: '' }));
                }}
                error={!!errors.passingScore}
              />
              {errors.passingScore && (
                <p className="text-xs text-destructive font-medium">{errors.passingScore}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg">
          Continue to Settings →
        </Button>
      </div>
    </form>
  );
}
