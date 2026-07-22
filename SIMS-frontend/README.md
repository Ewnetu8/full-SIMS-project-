# ExamSphere — AI-Powered Examination & Grading System (Frontend)

> **AASTU Student Information & Examination Management System**
> Built with **Next.js 16 (App Router)** · **React 19** · **TypeScript 5** · **Tailwind CSS v4** · **Zustand v5** · **TanStack Query v5**

---

## 📌 Overview

**ExamSphere** is a production-ready, AI-powered examination, grading, and student information platform engineered for **AASTU** (Addis Ababa Science and Technology University). The system provides full role-based access control (RBAC) across three primary user roles:

- 🎓 **Student**: Interactive exam-taking engine with live timer, question navigator, instant result feedback, performance analytics, and notification center.
- 👨‍🏫 **Lecturer**: Course management, exam builder, auto-grading configuration, performance metrics, and student grade tracking.
- 🛠️ **Admin**: Comprehensive user management (students, lecturers, staff), department/course orchestration, system audit logs, AI proctoring monitor, and global settings.

This directory (`SIMS-frontend/`) houses the complete Next.js frontend application.

---

## 🚀 Technology Stack

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | [Next.js](https://nextjs.org/) | 16.2 (App Router) | Server Components, routing, layout management |
| **UI Library** | [React](https://react.dev/) | 19.2 | Core UI rendering engine |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | 5.x (Strict Mode) | End-to-end type safety & developer tooling |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | v4 | Utility-first CSS & theme tokens |
| **Component Primitives** | [Radix UI](https://www.radix-ui.com/) / Shadcn | Latest | Accessible, unstyled UI primitives |
| **State Management** | [Zustand](https://zustand-demo.pmnd.rs/) | v5.0 | Lightweight global client state (auth, UI) |
| **Server State & Caching**| [TanStack Query](https://tanstack.com/query/v5) | v5.101 | Data fetching, background updates, caching |
| **Form Handling** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) | v7 / v4 | High-performance forms with schema validation |
| **Data Visualisation** | [Recharts](https://recharts.org/) | v3.9 | Interactive analytical charts & graphs |
| **Icons** | [Lucide React](https://lucide.dev/) | v1.24 | Modern vector icon set |
| **Animations** | [Framer Motion](https://framer.com/motion) | v12.4 | Dynamic page transitions and UI micro-interactions |
| **HTTP Client** | [Axios](https://axios-http.com/) | v1.18 | REST API integration & response interceptors |
| **Notifications** | [Sonner](https://sonner.emilkowal.ski/) | v2.0 | Toast notification popups |
| **Theme Management** | [next-themes](https://github.com/pacocoursey/next-themes) | v0.4 | Seamless Light/Dark mode toggling |

---

## 📁 Directory Architecture

```
SIMS-frontend/
├── src/
│   ├── app/                      # Next.js App Router (pages & route groups)
│   │   ├── admin/                # Admin Portal routes & sub-pages
│   │   ├── lecturer/             # Lecturer Portal routes & sub-pages
│   │   ├── student/              # Student Portal routes & exam player
│   │   ├── about/                # Public page: About ExamSphere
│   │   ├── contact/              # Public page: Contact & support
│   │   ├── privacy/              # Public page: Privacy Policy
│   │   ├── terms/                # Public page: Terms of Service
│   │   ├── access-denied/        # Unauthorized access handler
│   │   ├── login/                # Authentication page
│   │   ├── forgot-password/      # Password recovery page
│   │   ├── reset-password/       # Password reset page
│   │   ├── globals.css           # Global CSS variables & Tailwind directives
│   │   └── layout.tsx            # Root HTML layout with providers & fonts
│   │
│   ├── components/               # Core UI components
│   │   ├── ui/                   # Primitive components (Button, Dialog, Input, etc.)
│   │   ├── common/               # Shared reusable widgets (ThemeToggle, Avatar, Badge)
│   │   ├── layout/               # Structural layouts (Navbar, Sidebar, Footer)
│   │   ├── forms/                # Form abstractions (FormInput, Select, Checkbox)
│   │   └── charts/               # Reusable analytics charts (BarChart, LineChart)
│   │
│   ├── features/                 # Modular feature domains
│   │   ├── admin/                # User management, audit logs, AI monitor
│   │   ├── analytics/            # Performance analytics & metrics
│   │   ├── auth/                 # Authentication services, state & validations
│   │   ├── examination/          # Active exam player, timer & question navigation
│   │   ├── lecturer/             # Course & exam management modules
│   │   ├── shared/               # Shared domain helpers & utilities
│   │   └── student/              # Student dashboard, exam cards & result views
│   │
│   ├── services/                 # Axios HTTP client setup & API endpoints
│   ├── hooks/                    # Custom React hooks
│   ├── store/                    # Zustand state stores (auth, UI settings)
│   ├── providers/                # Context providers (Theme, TanStack Query, Auth)
│   ├── proxy.ts                  # Next.js Middleware route guard & RBAC proxy
│   ├── lib/                      # Core utility wrappers (cn utility, env loader)
│   ├── utils/                    # Helper functions (date formatting, string helpers)
│   ├── types/                    # Global TypeScript type definitions
│   └── constants/                # App constants (routes, roles, configuration)
│
├── public/                       # Static files & public assets
├── .env.example                  # Environment variable reference template
├── .env.local.example            # Quick local environment setup sample
├── Dockerfile                    # Multi-stage production build container
├── Dockerfile.dev                # Development container with hot-reloading
├── docker-compose.yml            # Docker orchestration configuration
├── eslint.config.mjs             # ESLint flat configuration
├── next.config.ts                # Next.js framework configuration
├── tsconfig.json                 # TypeScript compiler setup (Strict mode)
└── package.json                  # Dependencies & npm build scripts
```

---

## 🗺️ Route Architecture & Role-Based Access

The application relies on `src/proxy.ts` (Next.js middleware guard) to inspect authentication cookies (`examsphere_session`) and strictly enforce role-based access control.

### Public Routes
- `/` — Landing / Home page
- `/about` — System overview
- `/contact` — Contact support
- `/privacy` — Privacy guidelines
- `/terms` — Terms of Service

### Guest / Auth Routes
- `/login` — User authentication portal
- `/forgot-password` — Password recovery request
- `/reset-password` — Password reset form

### 🎓 Student Portal (`/student/*`)
- `/student/dashboard` — Overview of active, upcoming, and past exams
- `/student/exams` — Exam catalogue & active exam entry
- `/student/exams/[id]` — Interactive exam player (timer, auto-save, question grid)
- `/student/completed-exams` — History of submitted exams
- `/student/results` — Detailed grade cards and question breakdowns
- `/student/profile` — Account preferences & student details
- `/student/notifications` — Real-time alerts and exam updates

### 👨‍🏫 Lecturer Portal (`/lecturer/*`)
- `/lecturer/dashboard` — Course statistics & pending grading tasks
- `/lecturer/courses` — Assigned course management
- `/lecturer/exams` — Exam creator, editor, and scheduling tool
- `/lecturer/analytics` — Class performance analytics and mark distributions
- `/lecturer/notifications` — System announcements & grading reminders

### 🛠️ Admin Portal (`/admin/*`)
- `/admin/dashboard` — University-wide system health & user metrics
- `/admin/users` — General user directory & status controls
- `/admin/students` — Student directory & enrollment management
- `/admin/lecturers` — Faculty roster & department assignment
- `/admin/departments` — Department configuration & academic years
- `/admin/courses` — Global course registry
- `/admin/exams` — Master examination directory & overrides
- `/admin/reports` — Institutional reporting & export options
- `/admin/ai-monitor` — Real-time AI proctoring logs & flags
- `/admin/audit-logs` — Security audit trailing & user activity logs
- `/admin/settings` — Platform-wide system configuration
- `/admin/notifications` — Broadcast notification dispatcher

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js**: `>= 20.x`
- **npm**: `>= 10.x`

### Local Development Setup

```bash
# 1. Navigate to the frontend directory
cd SIMS-frontend

# 2. Install dependencies
npm install

# 3. Create environment configuration
cp .env.example .env.local

# 4. Start the Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 📜 Available NPM Scripts

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `next dev` | Start development server with Hot Module Replacement (HMR) |
| `npm run build` | `next build` | Build the standalone production application |
| `npm run start` | `next start` | Launch the production server locally |
| `npm run lint` | `eslint` | Run ESLint checks across source files |
| `npm run type-check` | `tsc --noEmit` | Validate TypeScript types across the codebase |
| `npm run format` | `prettier --write .` | Automatically format code using Prettier |
| `npm run format:check` | `prettier --check .` | Verify code formatting compliance |

---

## 🔑 Environment Variables

Copy `.env.example` to `.env.local` to set up environment configurations.

| Variable | Required | Default Value | Description |
|---|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | No | `ExamSphere` | Application display title |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Deployed application base URL |
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:8000/api/v1` | Django REST Framework API base URL |

> ⚠️ **Security Note**: Variables prefixed with `NEXT_PUBLIC_` are embedded into the client-side JavaScript bundle during build time. Never place secrets or private keys in `NEXT_PUBLIC_` variables.

---

## 🐳 Docker Deployment

The frontend includes a multi-stage Docker environment supporting both hot-reloading development and an optimized production bundle (~150 MB).

### Development Environment (Hot-Reloading)

```bash
# Start containerized development server
docker compose up

# Run in detached mode
docker compose up -d

# Stop container
docker compose down
```

### Production Build (Local Simulation)

```bash
# Build & start production profile container on http://localhost:3001
docker compose --profile prod up --build frontend-prod
```

### Standalone Docker Image Build

```bash
# Build production image with environment build arguments
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.examsphere.aastu.edu.et/api/v1 \
  --build-arg NEXT_PUBLIC_APP_URL=https://examsphere.aastu.edu.et \
  -t examsphere-frontend:latest .

# Run standalone container
docker run -p 3000:3000 --env-file .env.local examsphere-frontend:latest
```

---

## 📐 Coding & Contribution Standards

- **TypeScript Strictness**: Strict mode enabled (`noUncheckedIndexedAccess`, `strict: true`). Explicit types are required for all function arguments and returns. Avoid `any`.
- **Component Patterns**: Functional components with explicit prop types. Server components by default; include `'use client'` only when hook or DOM interaction is required.
- **Styling**: Utility classes merged via `cn()` helper (combines `clsx` and `tailwind-merge`).
- **File Naming**:
  - Components & Hooks: `kebab-case.tsx` / `use-kebab-case.ts`
  - Utility & Service Modules: `kebab-case.ts`
  - Stores & Types: `*-store.ts` / `*.ts`

---

## 📄 License

Private Repository — Proprietary software for **Addis Ababa Science and Technology University (AASTU)**.
