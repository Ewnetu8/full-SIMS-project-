'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Check,
  ChevronDown,
  Cloud,
  FileCheck2,
  GraduationCap,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Phone,
  Play,
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
  CardDescription,
  CardHeader,
  CardTitle,
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
              Sign in <ArrowRight className="h-3.5 w-3.5" />
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
            ['Request a demo', ROUTES.CONTACT],
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

export function HomeContent() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,oklch(0.65_0.22_265_/_0.16),transparent_27%),radial-gradient(circle_at_80%_20%,oklch(0.68_0.2_315_/_0.12),transparent_25%)]" />
        <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-20 lg:grid-cols-1 lg:items-center lg:px-8 lg:pb-28 lg:pt-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="flex flex-col items-center"
          >
            <Eyebrow>Assessment, made intelligent</Eyebrow>
            <h1 className="max-w-4xl text-5xl font-semibold tracking-[-.045em] sm:text-6xl lg:text-7xl">
              More time for <span className="gradient-text">learning.</span> Less time grading.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              ExamSphere brings digital exams, AI-assisted grading, timely feedback, and clear academic insight into one calm, capable workspace.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="xl">
                <Link href={ROUTES.LOGIN}>
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link href="#how-it-works">
                  <Play className="h-4 w-4" />Learn more
                </Link>
              </Button>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">Built for modern institutions</p>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30 py-9">
        <div className="mx-auto max-w-7xl px-5 text-center lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">
            Designed for institutions of every shape
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm font-semibold text-muted-foreground sm:grid-cols-4">
            <span>UNIVERSITIES</span>
            <span>COLLEGES</span>
            <span>ACADEMIES</span>
            <span>SCHOOLS</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <SectionTitle
          eyebrow="Everything in one place"
          title="A better assessment experience, end to end."
          description="Purpose-built tools for the moments before, during, and after every examination."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(([Icon, title, description]) => (
            <motion.div {...fade} key={title}>
              <Card hoverable className="h-full">
                <CardHeader>
                  <span className="mb-2 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-muted/40 py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionTitle eyebrow="Simple by design" title="From first draft to actionable feedback." />
          <ol className="mt-12 grid gap-5 md:grid-cols-4">
            {['Create an exam', 'Students complete it', 'AI reviews submissions', 'Insights are ready'].map((step, i) => (
              <li className="relative" key={step}>
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <span className="text-sm font-semibold text-primary">0{i + 1}</span>
                  <h3 className="mt-7 text-lg font-semibold">{step}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {[
                      'Build a thoughtful assessment with the right settings.',
                      'A focused, accessible experience for every learner.',
                      'Consistent scores and feedback, ready for review.',
                      'Turn results into the next best teaching decision.',
                    ][i]}
                  </p>
                </div>
                {i < 3 && (
                  <ArrowRight className="absolute -right-4 top-1/2 hidden h-6 w-6 text-muted-foreground md:block" />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Stats />

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <SectionTitle eyebrow="A clear advantage" title="Assessment that moves at the pace of learning." />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {[
            'Faster grading',
            'Less admin work',
            'Consistent assessment',
            'Actionable AI insight',
            'Better learning outcomes',
          ].map((item) => (
            <div className="rounded-xl border border-border p-5" key={item}>
              <Check className="h-5 w-5 text-success" />
              <p className="mt-4 font-semibold">{item}</p>
            </div>
          ))}
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
    ['24k+', 'Exams completed'],
    ['18k+', 'Students supported'],
    ['96%', 'AI grading accuracy'],
    ['40+', 'Institutions exploring'],
  ];
  return (
    <section className="border-y border-border bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {stats.map(([value, label]) => (
          <motion.div {...fade} key={label}>
            <p className="text-4xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-sm text-primary-foreground/75">{label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    ['Dr. L. Kamau', 'Lecturer', '“The feedback loop is finally fast enough to help students while the learning is still fresh.”'],
    ['Amara O.', 'Student', '“I can understand my results and what to improve without waiting weeks for a response.”'],
    ['R. Tesfaye', 'Academic Administrator', '“It gives our teams a shared, dependable view of assessment quality and progress.”'],
  ];
  return (
    <section className="bg-muted/40 py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionTitle eyebrow="Made for people" title="A calmer way to assess." />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {items.map(([name, role, quote]) => (
            <Card key={name}>
              <CardContent className="p-6">
                <MessageSquare className="h-5 w-5 text-primary" />
                <blockquote className="mt-5 text-lg leading-relaxed">{quote}</blockquote>
                <div className="mt-7">
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-muted-foreground">{role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [active, setActive] = useState<number | null>(0);
  const items = [
    ['How does AI grading work?', 'AI assists with evaluating submitted responses against the assessment criteria. Lecturers retain review and oversight of every result.'],
    ['Is my data secure?', 'The platform is designed around role-aware access, secure authentication, and sensible institutional controls.'],
    ['Can essay questions be graded?', 'Yes. Structured and essay-style responses can be reviewed with AI-generated scores and feedback drafts.'],
    ['Who can use ExamSphere?', 'It is designed for schools, colleges, universities, and education teams of all sizes.'],
    ['Which browsers are supported?', 'The latest versions of Chrome, Firefox, Safari, and Edge are supported.'],
  ];
  return (
    <section className="mx-auto max-w-3xl px-5 py-20">
      <SectionTitle eyebrow="Questions, answered" title="Frequently asked questions." />
      <div className="mt-10 divide-y divide-border rounded-xl border border-border bg-card">
        {items.map(([q, a], i) => (
          <div key={q}>
            <button
              onClick={() => setActive(active === i ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium"
              aria-expanded={active === i}
            >
              <span>{q}</span>
              <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${active === i ? 'rotate-180' : ''}`} />
            </button>
            {active === i && <p className="px-5 pb-5 text-sm text-muted-foreground">{a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="px-5 pb-20">
      <div className="mx-auto max-w-7xl rounded-2xl bg-[linear-gradient(135deg,var(--primary),var(--ai-primary))] px-6 py-14 text-center text-white sm:px-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Ready to make assessment more human?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/80">
          Bring your teaching team and student experience into focus.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
            <Link href={ROUTES.LOGIN}>Sign in</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 hover:text-white">
            <Link href={ROUTES.CONTACT}>Request a demo</Link>
          </Button>
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
  eyebrow: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <section className="border-b border-border bg-muted/30 px-5 py-20 text-center">
        <Eyebrow>{eyebrow}</Eyebrow>
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
      eyebrow="Platform capabilities"
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
      eyebrow="About ExamSphere"
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
      eyebrow="Contact"
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