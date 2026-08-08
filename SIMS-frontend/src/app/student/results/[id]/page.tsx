import { ResultDetails } from '@/features/student/components';

export default async function ResultDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResultDetails resultId={id} />;
}