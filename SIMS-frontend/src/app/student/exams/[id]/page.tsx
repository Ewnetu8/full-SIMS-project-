import { ExamDetails } from '@/features/student/components';

export default async function ExamDetailsPage({ params }: PageProps<'/student/exams/[id]'>) {
  const { id } = await params;
  return <ExamDetails examId={id} />;
}