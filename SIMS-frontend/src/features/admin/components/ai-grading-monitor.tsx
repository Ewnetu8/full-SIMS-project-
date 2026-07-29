'use client';

import {
  Brain,
  Clock,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause,
  FileText,
  Activity,
  Zap,
} from 'lucide-react';
import * as React from 'react';

import { toast } from '@/components/feedback';
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Progress,
} from '@/components/ui';

import { useAdminStore } from '../store';

import type { AIGradingJob } from '../types';

export function AIGradingMonitor() {
  const { aiJobs, retryAIJob } = useAdminStore();

  const [inspectingJob, setInspectingJob] = React.useState<AIGradingJob | null>(null);
  const [isQueuePaused, setIsQueuePaused] = React.useState(false);

  const pendingCount = aiJobs.filter((j) => j.status === 'pending').length;
  const processingCount = aiJobs.filter((j) => j.status === 'processing').length;
  const completedCount = aiJobs.filter((j) => j.status === 'completed').length;
  const failedCount = aiJobs.filter((j) => j.status === 'failed').length;

  const handleRetry = (jobId: string, examTitle: string) => {
    retryAIJob(jobId);
    toast.success('AI Evaluation Retried', {
      description: `Re-queued evaluation job for ${examTitle}.`,
    });
  };

  const handleToggleQueue = () => {
    setIsQueuePaused((prev) => !prev);
    toast.info(`AI Cluster ${!isQueuePaused ? 'Paused' : 'Resumed'}`, {
      description: !isQueuePaused
        ? 'Automated evaluation worker queue has been paused.'
        : 'Automated evaluation workers resumed processing queue.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
              <Brain className="h-7 w-7 text-ai-primary" /> AI Grading Engine Monitor
            </h1>
            <Badge variant="outline" className="border-ai-primary/30 text-ai-primary bg-ai-primary/10">
              Live Queue Status
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor real-time AI automated grading worker pipelines, queue metrics, confidence scoring, and error logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isQueuePaused ? 'default' : 'outline'}
            leftIcon={isQueuePaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            onClick={handleToggleQueue}
          >
            {isQueuePaused ? 'Resume AI Queue' : 'Pause Queue'}
          </Button>
        </div>
      </div>

      {/* Stats Breakdown Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Pending in Queue</span>
            <Clock className="h-4 w-4 text-accent" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">{pendingCount}</span>
            <span className="text-[11px] text-muted-foreground">Queued jobs</span>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-ai-primary">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Currently Processing</span>
            <Activity className="h-4 w-4 text-ai-primary animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">{processingCount}</span>
            <span className="text-[11px] text-muted-foreground">Active workers</span>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Completed Batches</span>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">{completedCount}</span>
            <span className="text-[11px] text-success font-medium">95.8% avg confidence</span>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Failed Jobs (Flagged)</span>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-destructive">{failedCount}</span>
            <span className="text-[11px] text-muted-foreground">Requires attention</span>
          </div>
        </Card>
      </div>

      {/* AI Jobs Queue List */}
      <Card className="p-5">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" /> AI Grading Jobs Queue
          </span>
          {isQueuePaused && (
            <Badge variant="warning" className="text-[11px]">
              Worker Queue Currently Paused
            </Badge>
          )}
        </h2>

        <div className="space-y-4">
          {aiJobs.map((job) => {
            const pct = Math.round((job.processedSubmissions / job.totalSubmissions) * 100) || 0;

            return (
              <div
                key={job.id}
                className="p-4 rounded-xl border border-border bg-card/60 space-y-3 transition-all hover:border-ai-primary/30"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-ai-primary">{job.id}</span>
                      <h3 className="text-sm font-semibold text-foreground">{job.examTitle}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{job.courseName}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        job.status === 'completed'
                          ? 'success'
                          : job.status === 'processing'
                          ? 'warning'
                          : job.status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="capitalize text-xs"
                    >
                      {job.status}
                    </Badge>

                    {job.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                        onClick={() => handleRetry(job.id, job.examTitle)}
                      >
                        Retry Job
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<FileText className="h-3.5 w-3.5" />}
                      onClick={() => setInspectingJob(job)}
                    >
                      Inspect Logs
                    </Button>
                  </div>
                </div>

                {/* Progress Bar & Submissions breakdown */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Submissions Processed</span>
                    <span className="font-semibold text-foreground">
                      {job.processedSubmissions} / {job.totalSubmissions} ({pct}%)
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>

                {job.confidenceAverage && (
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Started: {job.startedAt}</span>
                    <span className="font-medium text-success">
                      Confidence Rating: {job.confidenceAverage}%
                    </span>
                  </div>
                )}

                {job.errorReason && (
                  <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{job.errorReason}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Inspect Logs Modal */}
      {inspectingJob && (
        <Dialog open={!!inspectingJob} onOpenChange={() => setInspectingJob(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-mono">
                <FileText className="h-5 w-5 text-ai-primary" /> Evaluation Logs — {inspectingJob.id}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="p-3 rounded bg-muted/40 text-xs space-y-1">
                <p><strong>Target Exam:</strong> {inspectingJob.examTitle}</p>
                <p><strong>Department:</strong> {inspectingJob.department}</p>
                <p><strong>Status:</strong> {inspectingJob.status.toUpperCase()}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-muted-foreground">Raw Process Stream Output:</span>
                <pre className="mt-1.5 p-3 rounded-lg bg-black text-success font-mono text-[11px] h-48 overflow-y-auto leading-relaxed border border-border">
{`[${inspectingJob.startedAt}] [INFO] Initialized worker process for ${inspectingJob.id}
[${inspectingJob.startedAt}] [INFO] Fetching submission payloads for exam ${inspectingJob.examId}...
[${inspectingJob.startedAt}] [INFO] Loaded ${inspectingJob.totalSubmissions} student answer sheets.
[${inspectingJob.startedAt}] [INFO] Model: GPT-4o-Academic-FineTuned v2.4
[${inspectingJob.startedAt}] [SUCCESS] Batch #1 (Submissions 1-50) graded with 96.2% confidence.
${
  inspectingJob.status === 'failed'
    ? `[ERROR] OCR Engine Exception: ${inspectingJob.errorReason}
[ERROR] Worker thread suspended. Job status set to FAILED.`
    : `[${inspectingJob.startedAt}] [SUCCESS] All evaluation tasks completed cleanly.`
}`}
                </pre>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setInspectingJob(null)}>Close Inspector</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
