import { ResultDetails } from '@/features/student/components';

export default async function ResultDetailsPage({ params }: PageProps<'/student/results/[id]'>) {
  const { id } = await params;
  return <ResultDetails resultId={id} />;
}