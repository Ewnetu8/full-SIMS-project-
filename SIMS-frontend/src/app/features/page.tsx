import { FeaturesContent, PublicLayout } from '@/components/public/site';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Features', description: 'Explore ExamSphere’s AI-powered assessment, feedback, and analytics capabilities.' };
export default function FeaturesPage() { return <PublicLayout><FeaturesContent /></PublicLayout>; }