import { ContactContent, PublicLayout } from '@/components/public/site';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Contact', description: 'Contact the ExamSphere team to discuss your assessment goals.' };
export default function ContactPage() { return <PublicLayout><ContactContent /></PublicLayout>; }