import { LegalContent, PublicLayout } from '@/components/public/site';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Terms of Service', description: 'ExamSphere terms of service placeholder.' };
export default function TermsPage() { return <PublicLayout><LegalContent type="terms" /></PublicLayout>; }