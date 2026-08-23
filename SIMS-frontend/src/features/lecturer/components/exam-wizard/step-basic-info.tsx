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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onNext();
  }

  const isValid =
    wizardData.title.trim().length >= 5 &&
    !!wizardData.courseId &&
    wizardData.durationMinutes > 0 &&
    wizardData.totalMarks > 0 &&
    wizardData.passingScore >= 0 &&
    wizardData.passingScore <= wizardData.totalMarks;

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
              onChange={(e) => updateWizardData({ title: e.target.value })}
              placeholder="e.g. Midterm Assessment: Data Structures & Algorithms"
              required
            />
          </div>

          {/* Course */}
          <div className="space-y-1.5">
            <Label htmlFor="exam-course" required>Course</Label>
            <Select value={wizardData.courseId} onValueChange={(v) => updateWizardData({ courseId: v })}>
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
                min={5}
                max={480}
                value={wizardData.durationMinutes}
                onChange={(e) =>
                  updateWizardData({ durationMinutes: parseInt(e.target.value, 10) || 60 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exam-total-marks" required>Total Marks</Label>
              <Input
                id="exam-total-marks"
                type="number"
                min={1}
                value={wizardData.totalMarks}
                onChange={(e) =>
                  updateWizardData({ totalMarks: parseInt(e.target.value, 10) || 100 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exam-passing" required>Passing Score</Label>
              <Input
                id="exam-passing"
                type="number"
                min={0}
                max={wizardData.totalMarks}
                value={wizardData.passingScore}
                onChange={(e) =>
                  updateWizardData({ passingScore: parseInt(e.target.value, 10) || 50 })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={!isValid} size="lg">
          Continue to Settings →
        </Button>
      </div>
    </form>
  );
}
