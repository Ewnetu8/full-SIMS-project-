import { AboutContent, PublicLayout } from '@/components/public/site';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'About', description: 'Learn about the ExamSphere mission to improve assessment and learning outcomes.' };
export default function AboutPage() { return <PublicLayout><AboutContent /></PublicLayout>; }