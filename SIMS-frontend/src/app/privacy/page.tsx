import { LegalContent, PublicLayout } from '@/components/public/site';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Privacy Policy', description: 'ExamSphere privacy policy placeholder.' };
export default function PrivacyPage() { return <PublicLayout><LegalContent type="privacy" /></PublicLayout>; }