'use client';

import { AnimatePresence, motion, type Variants } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  ChevronDown,
  ClipboardCheck,
  Cloud,
  FileCheck2,
  GraduationCap,
  LineChart,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  Phone,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import React, { useState, type FormEvent } from 'react';

import { ThemeToggle } from '@/components/common/theme-toggle';
import {
  Button,
  Card,
  CardContent,
  Input,
  Textarea,
} from '@/components/ui';
import { APP_NAME, ROUTES } from '@/constants';

const nav = [
  { href: ROUTES.HOME, label: 'Home' },
  { href: ROUTES.FEATURES, label: 'Features' },
  { href: ROUTES.ABOUT, label: 'About' },
  { href: ROUTES.CONTACT, label: 'Contact' },
];

const fade = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.48 },
};

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.10 } },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.46, ease: [0.22, 1, 0.36, 1] } },
};

export function Brand() {
  return (
    <Link
      href={ROUTES.HOME}
      className="flex items-center gap-2 font-semibold text-foreground no-underline hover:no-underline"
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
        E
      </span>
      <span>{APP_NAME}</span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Brand />
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          {nav.map((item) => (
            <Link
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
              href={item.href}
              key={item.label}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button asChild size="sm">
            <Link href={ROUTES.LOGIN}>
              Sign in
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            className="rounded-md p-2 hover:bg-accent"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <motion.nav
          id="mobile-menu"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t border-border bg-background px-5 py-4 md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                {item.label}
              </Link>
            ))}
            <Button asChild className="mt-2">
              <Link href={ROUTES.LOGIN}>Sign in</Link>
            </Button>
          </div>
        </motion.nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Brand />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Thoughtful assessment tools for institutions that want more time for learning.
          </p>
        </div>
        <FooterLinks
          title="Product"
          links={[
            ['Features', ROUTES.FEATURES],
            ['Sign in', ROUTES.LOGIN],
          ]}
        />
        <FooterLinks
          title="Company"
          links={[
            ['About', ROUTES.ABOUT],
            ['Contact', ROUTES.CONTACT],
          ]}
        />
        <div>
          <h2 className="text-sm font-semibold">Get in touch</h2>
          <a
            className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"
            href="mailto:hello@examsphere.edu"
          >
            <Mail className="h-4 w-4" />
            hello@examsphere.edu
          </a>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Addis Ababa, Ethiopia
          </p>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 py-5 text-xs text-muted-foreground sm:flex-row lg:px-8">
          <span>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</span>
          <span className="flex gap-4">
            <Link href={ROUTES.PRIVACY}>Privacy Policy</Link>
            <Link href={ROUTES.TERMS}>Terms of Service</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-4 space-y-2">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link className="text-sm text-muted-foreground hover:text-foreground" href={href}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
      <Sparkles className="h-3.5 w-3.5" />
      {children}
    </p>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-base text-muted-foreground sm:text-lg">{description}</p>}
    </div>
  );
}

// ─── Preserved export used by FeaturesContent ─────────────────────────────────
const features = [
  [BrainCircuit, 'AI-powered grading', 'Evaluate objective and structured responses with consistent, explainable AI assistance.'],
  [FileCheck2, 'Online examinations', 'Create, schedule, and deliver secure digital assessments from one place.'],
  [Zap, 'Instant results', 'Turn completed assessments into clear results and feedback without the wait.'],
  [BarChart3, 'Live analytics', 'Spot cohort trends and learning gaps with useful academic reporting.'],
  [Users, 'Performance tracking', 'Give each student a clearer view of progress over time.'],
  [LockKeyhole, 'Secure by design', 'Role-aware access and thoughtful controls protect every assessment.'],
  [GraduationCap, 'Built for every role', 'A shared experience for students, lecturers, and institutional teams.'],
  [Cloud, 'Access anywhere', 'Cloud-based tools that work where learning happens.'],
] as const;

// ─── Hero SVG graphic ─────────────────────────────────────────────────────────
function HeroGraphic() {
  return (
    <svg
      viewBox="0 0 480 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-md mx-auto"
      aria-hidden="true"
    >
      {/* Faint grid */}
      <defs>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
        </pattern>
      </defs>
      <rect width="480" height="400" fill="url(#grid)" opacity="0.5" />

      {/* Large background circle */}
      <circle cx="280" cy="200" r="160" stroke="currentColor" strokeWidth="1" className="text-primary/20" />
      <circle cx="280" cy="200" r="110" stroke="currentColor" strokeWidth="1" className="text-primary/15" />

      {/* Filled accent circle */}
      <circle cx="280" cy="200" r="68" fill="currentColor" className="text-primary/8" />

      {/* Document card */}
      <rect x="80" y="90" width="200" height="260" rx="12" fill="currentColor" className="text-card" stroke="currentColor" strokeWidth="1" style={{ stroke: 'var(--border)' }} />
      <rect x="100" y="116" width="120" height="8" rx="4" fill="currentColor" className="text-primary/60" />
      <rect x="100" y="136" width="160" height="6" rx="3" fill="currentColor" className="text-muted-foreground/30" />
      <rect x="100" y="150" width="140" height="6" rx="3" fill="currentColor" className="text-muted-foreground/30" />
      <rect x="100" y="164" width="150" height="6" rx="3" fill="currentColor" className="text-muted-foreground/30" />

      {/* Divider */}
      <line x1="100" y1="186" x2="260" y2="186" stroke="currentColor" strokeWidth="1" className="text-border" />

      {/* Question rows */}
      {[0, 1, 2, 3].map((i) => (
        <React.Fragment key={i}>
          <rect x="100" y={200 + i * 28} width="12" height="12" rx="3" fill="currentColor" className={i === 1 ? 'text-primary/70' : 'text-muted-foreground/20'} />
          <rect x="120" y={203 + i * 28} width={100 + (i % 3) * 20} height="6" rx="3" fill="currentColor" className="text-muted-foreground/25" />
        </React.Fragment>
      ))}

      {/* Submit button shape */}
      <rect x="100" y="316" width="80" height="22" rx="6" fill="currentColor" className="text-primary/80" />

      {/* Floating result chip */}
      <rect x="290" y="140" width="130" height="52" rx="10" fill="currentColor" className="text-card" stroke="currentColor" strokeWidth="1" style={{ stroke: 'var(--border)' }} />
      <circle cx="310" cy="166" r="8" fill="currentColor" className="text-success/70" />
      <rect x="326" y="158" width="60" height="6" rx="3" fill="currentColor" className="text-muted-foreground/40" />
      <rect x="326" y="170" width="40" height="5" rx="2.5" fill="currentColor" className="text-muted-foreground/25" />

      {/* Floating score chip */}
      <rect x="300" y="260" width="110" height="44" rx="10" fill="currentColor" className="text-primary" />
      <text x="320" y="278" fontSize="10" fill="white" opacity="0.8" fontFamily="monospace">AI Score</text>
      <text x="320" y="295" fontSize="14" fontWeight="700" fill="white">96 / 100</text>

      {/* Arc decoration */}
      <path d="M 160 60 Q 340 20 400 180" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 4" className="text-primary/30" fill="none" />

      {/* Small dots */}
      <circle cx="148" cy="72" r="4" fill="currentColor" className="text-primary/50" />
      <circle cx="400" cy="178" r="4" fill="currentColor" className="text-primary/50" />
    </svg>
  );
}

// ─── Home page ────────────────────────────────────────────────────────────────

export function HomeContent() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Subtle background texture */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 70% 50%, oklch(0.52 0.22 265 / 0.06) 0%, transparent 55%), radial-gradient(circle at 10% 80%, oklch(0.60 0.24 295 / 0.05) 0%, transparent 40%)',
          }}
        />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pb-28 lg:pt-24">
          {/* Left — editorial headline */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Eyebrow */}


            <h1 className="text-4xl font-semibold leading-[1.12] tracking-[-0.04em] sm:text-5xl lg:text-[3.4rem]">
              Examinations designed to move at the{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-primary">speed of learning.</span>
                <span
                  className="absolute inset-x-0 bottom-1 -z-0 h-[6px] rounded-full opacity-20"
                  style={{ background: 'var(--primary)' }}
                />
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              ExamSphere unifies digital exams, AI-assisted grading, instant feedback, and clear academic analytics into one purposeful workspace — built for universities and colleges.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="gap-2 px-6">
                <Link href={ROUTES.LOGIN}>
                  Sign in to platform
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 px-6">
                <Link href="#how-it-works">
                  See how it works
                </Link>
              </Button>
            </div>

            {/* Social proof note */}
            <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              Trusted by universities &amp; colleges — no setup fee
            </p>
          </motion.div>

          {/* Right — abstract SVG illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block"
            aria-hidden="true"
          >
            <HeroGraphic />
          </motion.div>
        </div>
      </section>


      {/* ── How It Works — vertical stepper ──────────────────────────── */}
      <section
        id="how-it-works"
        className="border-b border-border bg-muted/25 py-20"
        aria-labelledby="how-heading"
      >
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-14 max-w-2xl">

            <h2 id="how-heading" className="text-3xl font-semibold tracking-tight sm:text-4xl">
              From first draft to actionable feedback.
            </h2>
          </div>

          <div className="grid gap-10 md:grid-cols-2 md:gap-16">
            {/* Stepper */}
            <motion.ol
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              className="relative space-y-0"
              aria-label="How ExamSphere works"
            >
              {([
                {
                  Icon: BookOpen,
                  step: 'Create an exam',
                  detail: 'Lecturers build assessments with flexible question types, time limits, and marking rubrics — in minutes.',
                },
                {
                  Icon: ClipboardCheck,
                  step: 'Students complete it',
                  detail: 'A clean, distraction-free exam interface works on any device. Progress is auto-saved throughout.',
                },
                {
                  Icon: BrainCircuit,
                  step: 'AI reviews submissions',
                  detail: 'Structured and essay responses are evaluated with consistent AI scoring. Lecturers review and approve.',
                },
                {
                  Icon: LineChart,
                  step: 'Insights are ready',
                  detail: 'Results, individual feedback, and cohort analytics are immediately available — no manual compilation.',
                },
              ] as const).map(({ Icon, step, detail }, i, arr) => (
                <motion.li
                  key={step}
                  variants={staggerItem}
                  className="relative flex gap-5 pb-10 last:pb-0"
                >
                  {/* Connector line */}
                  {i < arr.length - 1 && (
                    <div
                      className="absolute left-[19px] top-[40px] h-[calc(100%-8px)] w-px bg-border"
                      aria-hidden="true"
                    />
                  )}

                  {/* Number circle */}
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-sm font-bold text-primary">
                    {i + 1}
                  </div>

                  {/* Content */}
                  <div className="pt-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold">{step}</h3>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{detail}</p>
                  </div>
                </motion.li>
              ))}
            </motion.ol>

            {/* Callout card — right side */}
            <motion.div
              {...fade}
              className="hidden self-center rounded-2xl border border-border bg-card p-8 md:block"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">The result</p>
              <p className="mt-3 text-2xl font-semibold leading-snug tracking-tight">
                Less time grading.<br />More time teaching.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Lecturers report saving an average of 6–8 hours per examination cycle when AI-assisted grading is enabled.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                {([
                  ['96%', 'AI grading accuracy'],
                  ['6–8 hrs', 'Saved per exam cycle'],
                  ['< 1 day', 'Feedback turnaround'],
                  ['40+', 'Institutions onboarded'],
                ] as const).map(([val, label]) => (
                  <div key={label} className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xl font-bold tabular-nums text-foreground">{val}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats — editorial strip ───────────────────────────────────── */}
      <Stats />

      {/* ── Benefits — 3-col role breakdown ──────────────────────────── */}
      <section className="border-t border-border bg-background px-5 py-20 lg:px-8" aria-labelledby="benefits-heading">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 max-w-2xl">

            <h2 id="benefits-heading" className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Built around the people who use it.
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              ExamSphere is designed with the real needs of each role in mind — not a generic one-size-fits-all tool.
            </p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            className="grid gap-6 sm:grid-cols-3"
          >
            {([
              {
                role: 'Students',
                tagline: 'Empowered Learning',
                Icon: GraduationCap,
                benefits: [
                  'Focused, distraction-free exam interface',
                  'Instant personalised feedback after grading',
                  'Clear progress and result history',
                  'Works on any device, anywhere',
                ],
              },
              {
                role: 'Lecturers',
                tagline: 'Intelligent Evaluation',
                Icon: BookOpen,
                benefits: [
                  'Build exams in minutes with flexible question types',
                  'AI handles consistent first-pass grading',
                  'Review, override, and annotate any result',
                  'Cohort analytics surfaced automatically',
                ],
              },
              {
                role: 'Administrators',
                tagline: 'Complete Control',
                Icon: Users,
                benefits: [
                  'Institution-wide view of assessment quality',
                  'Role-based access across all users',
                  'Audit trails and compliance support',
                  'Simple onboarding for new staff and students',
                ],
              },
            ] as const).map(({ role, tagline, Icon, benefits }) => (
              <motion.div
                key={role}
                variants={staggerItem}
                className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary hover:shadow-xl"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                      {tagline}
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>

                  <h3 className="my-2 text-2xl font-bold leading-tight text-foreground">
                    {role}
                  </h3>

                  <ul className="mt-4 space-y-3">
                    {benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <Testimonials />
      <FAQ />
      <CTA />
    </>
  );
}

function Stats() {
  const stats = [
    { value: '24k+', label: 'Exams completed', sub: 'across all institutions' },
    { value: '18k+', label: 'Students supported', sub: 'in active cycles' },
    { value: '96%', label: 'AI grading accuracy', sub: 'verified by lecturers' },
    { value: '40+', label: 'Institutions exploring', sub: 'universities & colleges' },
  ];
  return (
    <section className="border-y border-border bg-muted/20 py-14" aria-label="Platform statistics">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-2 gap-8 lg:grid-cols-4"
        >
          {stats.map(({ value, label, sub }) => (
            <motion.div
              key={label}
              variants={staggerItem}
              className="border-l-2 border-primary/30 pl-4"
            >
              <p className="text-4xl font-bold tabular-nums tracking-tight text-foreground sm:text-5xl">
                {value}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    {
      name: 'Dr. L. Kamau',
      role: 'Lecturer, Computer Science',
      initials: 'LK',
      quote: 'The feedback loop is finally fast enough to help students while the learning is still fresh. We used to wait a week — now results are ready the same afternoon.',
    },
    {
      name: 'Amara O.',
      role: 'Second-year Student',
      initials: 'AO',
      quote: 'I can understand my results and exactly what to improve without waiting weeks for a response. The breakdown by topic is genuinely useful.',
    },
    {
      name: 'R. Tesfaye',
      role: 'Academic Registrar',
      initials: 'RT',
      quote: 'It gives our administration a shared, dependable view of assessment quality and cohort progress. Reporting that used to take days is now instant.',
    },
  ];
  return (
    <section className="border-t border-border bg-background py-20" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-14 max-w-2xl">

          <h2 id="testimonials-heading" className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Heard from the people who use it.
          </h2>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="grid gap-6 md:grid-cols-3"
        >
          {items.map(({ name, role, initials, quote }) => (
            <motion.figure
              key={name}
              variants={staggerItem}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-7 transition-all duration-500 ease-in-out hover:scale-[1.02] hover:shadow-xl"
            >
              {/* Hover inset border */}
              <div
                className="pointer-events-none absolute inset-0 rotate-6 border-2 border-primary/40 opacity-0 transition-all duration-500 ease-in-out group-hover:inset-3 group-hover:rotate-0 group-hover:opacity-100"
                aria-hidden="true"
              />

              {/* Hover bottom badge */}
              <div
                className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 bg-card px-3 py-0.5 text-[9px] font-bold uppercase tracking-[7px] text-primary opacity-0 transition-all duration-500 ease-in-out group-hover:tracking-[3px] group-hover:opacity-100"
                aria-hidden="true"
              >
                TESTIMONIAL
              </div>

              {/* Card content */}
              <div className="relative z-10">
                <span
                  className="mb-2 block text-5xl leading-none text-primary/40 select-none transition-colors duration-500 group-hover:text-primary"
                  aria-hidden="true"
                >
                  &ldquo;
                </span>
                <blockquote className="text-sm leading-relaxed text-foreground">
                  {quote}
                </blockquote>
              </div>

              <figcaption className="relative z-10 mt-6 flex items-center gap-3 border-t border-border pt-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary border border-primary/20">
                  {initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">{role}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FAQ() {
  const [active, setActive] = useState<number | null>(null);
  const items = [
    [
      'How does AI grading work?',
      'AI assists with evaluating submitted responses against the assessment criteria, producing a draft score and feedback for each submission. Lecturers retain full review and override authority — nothing is finalised without human approval.',
    ],
    [
      'Is student data secure?',
      'The platform is designed around role-based access control, secure authentication, and sensible institutional data boundaries. No assessment data is shared outside your institution.',
    ],
    [
      'Can essay questions be graded automatically?',
      'Yes. Structured and open-ended essay responses can be reviewed with AI-generated scores and feedback drafts. Lecturers see the AI rationale alongside each result before publishing.',
    ],
    [
      'Who can use ExamSphere?',
      'ExamSphere is designed for universities, colleges, academies, and any institution that runs formal assessments. It supports students, lecturers, and administrative staff with distinct role-specific views.',
    ],
    [
      'Which browsers and devices are supported?',
      'The latest versions of Chrome, Firefox, Safari, and Edge are supported on desktop, tablet, and mobile. The exam interface is fully responsive and does not require any app installation.',
    ],
  ] as const;
  return (
    <section className="mx-auto max-w-3xl px-5 py-20" aria-labelledby="faq-heading">
      <div className="mb-10 text-center">

        <h2 id="faq-heading" className="text-3xl font-semibold tracking-tight">
          Frequently asked questions
        </h2>
      </div>
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {items.map(([q, a], i) => (
          <div key={q}>
            <button
              onClick={() => setActive(active === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold transition-colors hover:text-primary"
              aria-expanded={active === i}
              aria-controls={`faq-answer-${i}`}
            >
              <span>{q}</span>
              <ChevronDown
                className="h-4.5 w-4.5 shrink-0 text-muted-foreground transition-transform duration-200"
                style={{ transform: active === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>
            <AnimatePresence initial={false}>
              {active === i && (
                <motion.div
                  id={`faq-answer-${i}`}
                  role="region"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="border-t border-border bg-foreground py-20" aria-labelledby="cta-heading">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div>

            <h2
              id="cta-heading"
              className="text-3xl font-semibold leading-tight tracking-tight text-background sm:text-4xl lg:text-[2.75rem]"
            >
              Ready to make assessment more&nbsp;human?
            </h2>
            <p className="mt-4 max-w-md text-base text-background/60">
              Bring your teaching team and student experience into focus with a platform built for real academic workflows.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row md:flex-col md:items-start lg:flex-row">
            <Button
              asChild
              size="lg"
              className="gap-2 bg-background text-foreground hover:bg-background/90"
            >
              <Link href={ROUTES.LOGIN}>
                Sign in to platform
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ContentPage({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string;
  eyebrow?: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <section className="border-b border-border bg-muted/30 px-5 py-20 text-center">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">{description}</p>
      </section>
      {children}
    </>
  );
}

export function FeaturesContent() {
  return (
    <ContentPage
      title="Designed for better assessment decisions."
      description="Every feature is intentionally connected, so institutions can move from a question to a clearer outcome without friction."
    >
      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="space-y-6">
          {features.slice(0, 6).map(([Icon, title, desc], i) => (
            <motion.article
              {...fade}
              key={title}
              className="grid gap-8 rounded-2xl border border-border bg-card p-7 md:grid-cols-[.8fr_1.2fr] md:p-10"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">0{i + 1}</p>
                <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
                <p className="mt-3 max-w-xl text-muted-foreground">
                  {desc} Built to make the assessment experience more useful for both teaching teams and learners.
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </ContentPage>
  );
}

export function AboutContent() {
  const cards = [
    ['Our mission', 'Give educators back the time and clarity they need to guide meaningful learning.'],
    ['Our vision', "A future where assessment is timely, fair, and an active part of every learner's progress."],
    ['The challenge', 'Assessment often creates slow feedback loops, uneven workloads, and fragmented academic insight.'],
    ['Our approach', 'We bring exams, AI-assisted review, feedback, and analytics together in one trusted experience.'],
  ];
  return (
    <ContentPage
      title="Technology in service of better learning."
      description="We believe assessment should be a moment of progress—not a bottleneck for the people who care about it."
    >
      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-20 sm:grid-cols-2 lg:px-8">
        {cards.map(([title, text]) => (
          <Card key={title}>
            <CardContent className="p-7">
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-3 text-muted-foreground">{text}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <h2 className="text-2xl font-semibold">Built with a modern, dependable stack.</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Next.js and React provide a fast, accessible foundation; TypeScript, a component-led design system, and AI-ready workflows keep the experience focused and maintainable.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'AI-ready'].map((x) => (
              <span className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium" key={x}>
                {x}
              </span>
            ))}
          </div>
        </div>
      </section>
    </ContentPage>
  );
}

export function ContactContent() {
  const [sent, setSent] = useState(false);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };
  return (
    <ContentPage
      title="Let's talk about your assessment goals."
      description="Send a message and our team will follow up."
    >
      <section className="mx-auto grid max-w-5xl gap-10 px-5 py-20 lg:grid-cols-[.85fr_1.15fr]">
        <div>
          <h2 className="text-2xl font-semibold">Start a conversation.</h2>
          <p className="mt-3 text-muted-foreground">
            Whether you are exploring a new workflow or planning an institution-wide rollout, we would love to hear from you.
          </p>
          <div className="mt-8 space-y-4 text-sm">
            <a href="mailto:hello@examsphere.edu" className="flex items-center gap-3 text-foreground">
              <Mail className="h-5 w-5 text-primary" />
              hello@examsphere.edu
            </a>
            <p className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary" />
              +251 (0) 11 000 0000
            </p>
            <p className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              Addis Ababa, Ethiopia
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <form className="space-y-4" onSubmit={onSubmit} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  Name
                  <Input required name="name" className="mt-1.5" placeholder="Jane Doe" />
                </label>
                <label className="text-sm font-medium">
                  Email
                  <Input required name="email" type="email" className="mt-1.5" placeholder="jane@institution.edu" />
                </label>
              </div>
              <label className="text-sm font-medium">
                Institution
                <Input required name="institution" className="mt-1.5" placeholder="University of Addis Ababa" />
              </label>
              <label className="text-sm font-medium">
                Message
                <Textarea required name="message" className="mt-1.5" placeholder="Tell us about your assessment goals..." rows={5} />
              </label>
              {sent && (
                <p className="rounded-md bg-success/10 p-3 text-sm text-success" role="status">
                  Thanks—your message has been sent.
                </p>
              )}
              <Button type="submit" size="lg" className="w-full">
                Send message <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </ContentPage>
  );
}

export function LegalContent({ type }: { type: 'privacy' | 'terms' }) {
  const privacy = type === 'privacy';
  const sections = privacy
    ? [
      ['Information we collect', 'This policy describes information you may provide through the platform, such as account details and support requests.'],
      ['How information is used', 'Information may be used to operate the service, provide support, improve the product, and meet applicable obligations.'],
      ['Your choices', 'Institutions and users have clear ways to review, update, or request deletion of their information.'],
    ]
    : [
      ['Using the service', 'This describes the expected responsible use of ExamSphere by authorized institutional users.'],
      ['Institutional responsibility', 'Institutions are responsible for their users, assessment content, and compliance with applicable education policies.'],
      ['Service availability', 'We aim to provide a reliable service while reserving the right to maintain and improve it over time.'],
    ];
  return (
    <ContentPage
      eyebrow="Legal"
      title={privacy ? 'Privacy Policy' : 'Terms of Service'}
      description="Review the legal policies governing the use of ExamSphere."
    >
      <article className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-sm text-muted-foreground">Last updated: July 2026</p>
        {sections.map(([heading, body]) => (
          <section className="mt-10" key={heading}>
            <h2 className="text-xl font-semibold">{heading}</h2>
            <p className="mt-3 text-muted-foreground">{body}</p>
          </section>
        ))}
      </article>
    </ContentPage>
  );
}

export function NotFoundContent() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-5 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles className="h-10 w-10" />
      </div>
      <p className="mt-8 text-sm font-semibold text-primary">Error 404</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">This page wandered off campus.</h1>
      <p className="mt-4 text-muted-foreground">The link may be outdated, or the page may have moved.</p>
      <Button asChild className="mt-8" size="lg">
        <Link href={ROUTES.HOME}>
          Back to home <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </section>
  );
}