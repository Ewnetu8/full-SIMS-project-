'use client';

import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, ClipboardCheck, Clock3, GraduationCap, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { StatsCard } from '@/components/data-display';
import { PageHeader } from '@/components/layout';
import { Breadcrumb } from '@/components/navigation';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { ROUTES } from '@/constants';

import { studentService } from '../services';

const formatDate = (value: string) => new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
const formatTime = (value: string) => new Intl.DateTimeFormat('en-KE', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));

export function StudentDashboard() {
  const profile = studentService.getProfile();
  const exams = studentService.getExams();
  const results = studentService.getResults();
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const upcoming = exams.filter((exam) => exam.status !== 'completed');
  const average = Math.round(results.reduce((total, result) => total + result.score, 0) / results.length);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-7">
      <PageHeader breadcrumb={<Breadcrumb items={[{ label: 'Student portal' }, { label: 'Overview' }]} />} title={`${greeting}, ${profile.fullName.split(' ')[0]}`} description={`${profile.semester} Â· Your academic workspace is ready.`} />
      <section aria-label="Academic statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Available exams" value={exams.filter((exam) => exam.status === 'available').length} icon={<ClipboardCheck className="h-5 w-5" />} />
        <StatsCard title="Upcoming exams" value={exams.filter((exam) => exam.status === 'upcoming').length} icon={<CalendarDays className="h-5 w-5" />} />
        <StatsCard title="Completed exams" value={results.length} icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatsCard title="Average score" value={average} suffix="%" delta={4.2} icon={<GraduationCap className="h-5 w-5" />} />
      </section>
      <section className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader className="flex-row items-center justify-between"><div><CardTitle>Upcoming examinations</CardTitle><p className="mt-1 text-sm text-muted-foreground">Plan ahead and review each exam before it opens.</p></div><Button asChild variant="ghost" size="sm"><Link href={ROUTES.STUDENT.EXAMS}>View all <ArrowRight className="h-4 w-4" /></Link></Button></CardHeader>
          <CardContent className="space-y-3">
            {upcoming.map((exam) => <div key={exam.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-medium">{exam.title}</p><p className="mt-1 text-sm text-muted-foreground">{exam.courseCode} Â· {exam.course}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(exam.startAt)}</span><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{formatTime(exam.startAt)} Â· {exam.duration}</span></div></div><Button asChild variant="outline" size="sm"><Link href={ROUTES.STUDENT.EXAM(exam.id)}>View details</Link></Button></div>)}
          </CardContent>
        </Card>
        <Card className="xl:col-span-2"><CardHeader><CardTitle>Quick actions</CardTitle><p className="text-sm text-muted-foreground">Shortcuts for your most frequent tasks.</p></CardHeader><CardContent className="grid gap-3"><QuickAction href={ROUTES.STUDENT.EXAMS} icon={<ClipboardCheck className="h-5 w-5" />} title="View exams" description="Review available assessments" /><QuickAction href={ROUTES.STUDENT.RESULTS} icon={<GraduationCap className="h-5 w-5" />} title="View results" description="Explore grades and AI feedback" /><QuickAction href={ROUTES.STUDENT.PROFILE} icon={<BookOpen className="h-5 w-5" />} title="Edit profile" description="Keep your academic details current" /></CardContent></Card>
      </section>
      <Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Recent results</CardTitle><p className="mt-1 text-sm text-muted-foreground">Feedback generated after your completed assessments.</p></div><Button asChild variant="ghost" size="sm"><Link href={ROUTES.STUDENT.RESULTS}>All results <ArrowRight className="h-4 w-4" /></Link></Button></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">{results.map((result) => <Link key={result.id} href={ROUTES.STUDENT.RESULT(result.id)} className="rounded-xl border border-border p-4 transition hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><div className="flex items-start justify-between gap-4"><div><p className="font-medium">{result.examTitle}</p><p className="mt-1 text-sm text-muted-foreground">{result.courseCode} Â· {result.course}</p></div><div className="rounded-lg bg-success/10 px-3 py-1 text-sm font-bold text-success">{result.score}%</div></div><p className="mt-3 line-clamp-2 text-sm text-muted-foreground"><Sparkles className="mr-1 inline h-3.5 w-3.5 text-ai-primary" />{result.feedback}</p></Link>)}</CardContent></Card>
    </motion.div>
  );
}
function QuickAction({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string }) { return <Link href={href} className="flex items-center gap-3 rounded-xl border border-border p-3 transition hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</span><span><span className="block text-sm font-medium">{title}</span><span className="block text-xs text-muted-foreground">{description}</span></span><ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" /></Link>; }