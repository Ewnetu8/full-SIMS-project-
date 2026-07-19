# ═══════════════════════════════════════════════════════════════════════════════
# ExamSphere — AI-Powered Examination & Grading System
# Production-Ready Multi-Stage Dockerfile for the Next.js Frontend
# ═══════════════════════════════════════════════════════════════════════════════
#
# Stage Overview:
#   1. base      — Shared Node.js Alpine foundation (all stages inherit from this)
#   2. deps      — Installs ALL npm dependencies (dev + prod)
#   3. builder   — Compiles the Next.js application into a standalone output
#   4. runner    — Lean production image — only what is needed to serve the app
#
# The multi-stage approach ensures:
#   • Build-time tools (TypeScript compiler, ESLint, Tailwind CLI, etc.) are
#     never included in the final image.
#   • The final image contains only the compiled output and production runtime,
#     resulting in an image that is typically ~150–200 MB instead of ~1+ GB.
# ═══════════════════════════════════════════════════════════════════════════════

# ── Stage 1: base ──────────────────────────────────────────────────────────────
# Purpose: Establish a consistent, minimal Node.js environment that every
#          subsequent stage inherits. Alpine Linux keeps the base image tiny
#          and reduces the attack surface.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base

# Install libc6-compat for compatibility with some native Node.js addons that
# expect glibc (Alpine uses musl libc). Required by some npm packages.
RUN apk add --no-cache libc6-compat

# Set a consistent working directory used across all stages.
WORKDIR /app


# ── Stage 2: deps ──────────────────────────────────────────────────────────────
# Purpose: Install all npm dependencies (including devDependencies) in an
#          isolated layer. Docker caches this layer as long as package*.json
#          files do not change, making subsequent builds significantly faster.
# ──────────────────────────────────────────────────────────────────────────────
FROM base AS deps

# Copy only the manifest files first — this is the key to effective layer
# caching. As long as these files are unchanged, Docker reuses the cached
# layer and skips the expensive `npm ci` step entirely.
COPY package.json package-lock.json* ./

# `npm ci` is preferred over `npm install` in CI/Docker contexts because:
#   • It performs a clean install from package-lock.json (fully reproducible).
#   • It never modifies package-lock.json.
#   • It fails fast if lock-file and package.json are out of sync.
RUN npm ci


# ── Stage 3: builder ───────────────────────────────────────────────────────────
# Purpose: Compile the Next.js application using the full set of dependencies
#          from the `deps` stage. The `output: 'standalone'` option in
#          next.config.ts tells Next.js to bundle only the files needed to
#          run the server, making the final image as small as possible.
# ──────────────────────────────────────────────────────────────────────────────
FROM base AS builder

# Copy installed node_modules from the deps stage (layer reuse — no re-install).
COPY --from=deps /app/node_modules ./node_modules

# Copy the entire source tree. .dockerignore prevents unnecessary files
# (e.g., .git, local .env files, existing .next cache) from bloating the
# build context and potentially leaking secrets.
COPY . .

# Disable Next.js anonymous telemetry collection during the build.
# This prevents outbound network calls and avoids potential CI failures in
# air-gapped environments.
ENV NEXT_TELEMETRY_DISABLED=1

# Build-time placeholder — NEXT_PUBLIC_* vars are baked into the JS bundle.
# Override this at build time via --build-arg or in docker-compose.yml.
# Example: docker build --build-arg NEXT_PUBLIC_API_URL=https://api.example.com .
ARG NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_NAME="ExamSphere"

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME

# Build the production-optimised Next.js bundle.
# next.config.ts sets `output: 'standalone'`, so the build emits:
#   .next/standalone/ — a self-contained Node server (no node_modules needed)
#   .next/static/     — hashed static assets (JS chunks, CSS, images)
RUN npm run build


# ── Stage 4: runner ────────────────────────────────────────────────────────────
# Purpose: The final production image. It contains only:
#   1. The Node.js runtime (Alpine).
#   2. The compiled standalone server from the builder stage.
#   3. The static and public assets.
#
# Nothing from the source code, node_modules, or build tools is present here,
# which minimises image size, reduces the attack surface, and removes any
# risk of accidentally shipping development secrets.
# ──────────────────────────────────────────────────────────────────────────────
FROM base AS runner

# Set the runtime environment to production. This activates Next.js production
# optimisations (minification, tree-shaking, etc.) and suppresses dev warnings.
ENV NODE_ENV=production

# Disable telemetry in the production runtime as well.
ENV NEXT_TELEMETRY_DISABLED=1

# ── Security: Non-root user ────────────────────────────────────────────────────
# Running as root inside a container is a security anti-pattern. If the
# container is ever compromised, the attacker would have root access on the
# host (when running without user-namespace remapping).
# We create a dedicated system user and group with no login shell.
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy the static public assets (robots.txt, favicons, OG images, etc.).
COPY --from=builder /app/public ./public

# Copy the standalone server bundle and the static asset directory,
# and immediately transfer ownership to the non-root user.
# `--chown` avoids a separate RUN chown layer, saving image size.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

# Switch to the non-root user for all subsequent RUN, CMD, and ENTRYPOINT
# instructions.
USER nextjs

# Declare the port the application listens on. This is documentation only —
# it does not actually publish the port; that is done at `docker run -p`.
EXPOSE 3000

# Tell the Next.js server which host and port to bind to inside the container.
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the standalone Next.js production server.
# Using the standalone server.js directly (instead of `next start`) avoids
# needing a full node_modules directory in the runner stage.
CMD ["node", "server.js"]
