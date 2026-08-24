'use client';

import { Award, ArrowRight, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Card, CardContent, Button } from '@/components/ui';
import { ROUTES } from '@/constants/routes';

export function ExamAnalyticsCard() {
  return (
    <Card className="border-border bg-gradient-to-r from-card to-muted/30 shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                Looking for Examination Performance Analytics?
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                Per-exam score distributions, pass rates, question difficulty metrics, and certified student grade rosters are managed under Examination Results.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link href={ROUTES.ADMIN.RESULTS}>
              <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
                <Award className="h-3.5 w-3.5 text-primary" />
                View Exam Results
                <ArrowRight className="h-3.5 w-3.5 ml-0.5 text-muted-foreground" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
