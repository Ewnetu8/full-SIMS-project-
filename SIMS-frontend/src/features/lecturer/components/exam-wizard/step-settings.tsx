import * as React from 'react';

import { Label } from '@/components/forms';
import { Button, Card, CardContent, Input, Switch } from '@/components/ui';
import { calculateDurationMinutes, formatDurationMinutes } from '@/utils/date';

import { useLecturerStore } from '../../store';

interface StepSettingsProps {
  onBack: () => void;
  onNext: () => void;
}

export function StepSettings({ onBack, onNext }: StepSettingsProps) {
  const { wizardData, updateWizardData } = useLecturerStore();

  const calculatedDuration = calculateDurationMinutes(wizardData.startDate, wizardData.endDate);

  React.useEffect(() => {
    console.log('[SCHEDULE DEBUG] Settings values', {
      startDate: wizardData.startDate,
      endDate: wizardData.endDate,
    });
  }, [wizardData.startDate, wizardData.endDate]);

  function handleStartDateChange(value: string) {
    const dur = calculateDurationMinutes(value, wizardData.endDate);
    console.log('[SCHEDULE DEBUG] StartDate changed in settings:', value, 'new duration:', dur);
    updateWizardData({
      startDate: value,
      durationMinutes: dur ?? 0,
    });
  }

  function handleEndDateChange(value: string) {
    const dur = calculateDurationMinutes(wizardData.startDate, value);
    console.log('[SCHEDULE DEBUG] EndDate changed in settings:', value, 'new duration:', dur);
    updateWizardData({
      endDate: value,
      durationMinutes: dur ?? 0,
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    onNext();
  }

  const hasBothDates = !!wizardData.startDate && !!wizardData.endDate;
  const isEndAfterStart = hasBothDates && new Date(wizardData.endDate) > new Date(wizardData.startDate);
  const isValid = hasBothDates && isEndAfterStart && calculatedDuration !== null && calculatedDuration > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-6">
          <h2 className="text-base font-semibold text-foreground">Scheduling & Access Configuration</h2>

          {/* Date/time and calculated duration */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="start-date" required>Start Date & Time</Label>
              <Input
                id="start-date"
                type="datetime-local"
                value={wizardData.startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                required
              />
              <p className="text-2xs text-muted-foreground">Select examination start window.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end-date" required>End Date & Time</Label>
              <Input
                id="end-date"
                type="datetime-local"
                value={wizardData.endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                required
              />
              <p className="text-2xs text-muted-foreground">Must be after start window.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calculated-duration">Duration</Label>
              <Input
                id="calculated-duration"
                type="text"
                readOnly
                disabled
                value={formatDurationMinutes(calculatedDuration)}
                className="bg-muted/50 font-medium cursor-not-allowed"
              />
              <p className="text-2xs text-muted-foreground">Calculated automatically from window.</p>
            </div>
          </div>
          {hasBothDates && !isEndAfterStart && (
            <p className="text-xs text-destructive font-medium">End time must be after start time.</p>
          )}
          {hasBothDates && isEndAfterStart && (!calculatedDuration || calculatedDuration <= 0) && (
            <p className="text-xs text-destructive font-medium">Duration must be greater than 0 minutes.</p>
          )}

          {/* Toggle options */}
          <div className="space-y-0 divide-y divide-border rounded-xl border border-border">
            {[
              {
                id: 'randomize',
                label: 'Randomise Question Order',
                description: 'Each student sees questions in a different sequence to reduce collusion.',
                value: wizardData.randomizeQuestions,
                key: 'randomizeQuestions' as const,
              },
              {
                id: 'multiple-attempts',
                label: 'Allow Multiple Attempts',
                description: 'Students may re-take the exam after their first submission is recorded.',
                value: wizardData.allowMultipleAttempts,
                key: 'allowMultipleAttempts' as const,
              },
              {
                id: 'auto-submit',
                label: 'Auto-Submit on Timeout',
                description: 'Responses are automatically submitted when the countdown reaches zero.',
                value: wizardData.autoSubmitOnTimeout,
                key: 'autoSubmitOnTimeout' as const,
              },
              {
                id: 'show-results',
                label: 'Show Results After Submission',
                description: 'Students see their score and feedback immediately after completing the exam.',
                value: wizardData.showResultsAfterSubmission,
                key: 'showResultsAfterSubmission' as const,
              },
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 px-4 py-4 first:rounded-t-xl last:rounded-b-xl"
              >
                <div>
                  <Label htmlFor={item.id} className="font-medium text-sm">
                    {item.label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
                <Switch
                  id={item.id}
                  checked={item.value}
                  onCheckedChange={(checked) => updateWizardData({ [item.key]: checked })}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button type="submit" disabled={!isValid} size="lg">
          Continue to Question Builder →
        </Button>
      </div>
    </form>
  );
}
