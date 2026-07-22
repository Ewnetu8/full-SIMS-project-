import { notFound } from 'next/navigation';

import { ExaminationRunner } from '@/features/examination/components';
import { examinationService } from '@/features/examination/services';

interface ExamTakePageProps {
  params: Promise<{ id: string }>;
}

export default async function ExamTakePage({ params }: ExamTakePageProps) {
  const { id } = await params;
  const session = examinationService.getSession(id);

  if (!session) {
    notFound();
  }

  return <ExaminationRunner session={session} />;
}
