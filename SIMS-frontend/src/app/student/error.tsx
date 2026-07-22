'use client';

import { ErrorState } from '@/components/feedback';

export default function StudentError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState fullPage title="Unable to load student content" description="Please try loading this page again." onRetry={reset} />;
}