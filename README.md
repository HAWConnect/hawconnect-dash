# HAWConnect Dash

Student-maintained administration for HAWConnect, built with TanStack Start, React, Tailwind and Bun. This is a separate application using the shared HAWConnect backend, not a second database service. Distributed under [AGPL-3.0](LICENSE); required upstream copyright and attribution must be retained. No university endorsement is claimed.

## Features

- German and English interface with persistent language selection, light/dark themes and responsive navigation.
- Administrator magic-link login and separately provisioned password login; all privileged requests require backend-verified permissions.
- Bilingual announcements, scheduling, audience/platform targeting and validated image URLs.
- Campus Life events and organizer profiles, published through the public app's managed campus feed.
- Privacy Policy and Imprint editing in both languages: in-app text or HTTPS links, save draft, publish, withdraw and conflict protection.
- Public-source status monitoring, delegated capabilities, protected bootstrap grants and paginated audit history.

Student calendars, private subscription URLs and account secrets are not exposed in administration screens. Image uploads/library integration remain unavailable until club storage is implemented; valid external image URLs are supported.

## Shared architecture

```text
HAWConnect/
├── hawconnect/          # Android / iOS / web app
├── hawconnect-backend/  # API, identity, scrapers and shared PostgreSQL
└── hawconnect-dash/     # this repository
```

Dashboard server functions call `/api/admin` on the backend. Encrypted HttpOnly dashboard cookies retain the backend session token; database credentials stay exclusively in backend infrastructure. Capability checks, origin checks, CSRF protection, version conflicts and backend audit transactions remain in place.

## Local setup

Use the version in `.bun-version`:

```bash
bun install --frozen-lockfile
cp .env.example .env.local
```

Configure the ignored local environment:

```dotenv
APP_URL=http://localhost:43127
SESSION_SECRET=REPLACE_WITH_A_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS
HAWCONNECT_ADMIN_API_URL=http://localhost:4000/api/admin
```

Generate a secret locally with `openssl rand -base64 32`; do not paste it into documentation or commit it. The pre-publication audit removed the legacy `.env` from Git tracking while preserving the local file. Keep that removal in the publication commit and use the sanitised `.env.example` as the shared template.

The backend additionally needs its account/database settings and:

```dotenv
HAWCONNECT_DASH_ORIGIN=http://localhost:43127
HAWCONNECT_ADMIN_EMAILS=maintainer@haw-hamburg.de
```

An address must have a bootstrap grant or a delegated capability. A university domain alone grants no access. The backend's `HAWCONNECT_ACCOUNTS_DATABASE_URL` selects the shared database for account and campus-content operations; no database connection belongs in this repository.

Start the backend, then:

```bash
bun run dev
```

Open `http://localhost:43127/login`. Request a magic link, or use password login after a maintainer has provisioned the authorised, verified account through the backend's `admin:set-password` command. Passwords are supplied to that command through stdin, not shell arguments. Email delivery requires a functioning, authorised backend SMTP configuration.

## Database prerequisites

The backend needs its campus-content, identity/sync, admin-role, organizer-profile and legal-document tables. It owns all migrations and does not apply them on startup. A fresh database and an existing database require different checks: inspect schema/history and take a backup before selecting migration commands. See the backend README and the sibling backend’s local admin operations notes.

Earlier local setup applied migrations to the configured database; do not assume those changes exist in a new deployment database, or blindly replay every migration. Browser fixture tests do not establish production database or SMTP readiness.

## Checks

```bash
bun test
bun run typecheck
bun run check
bun run generate-routes
bun run build
```

Do not hand-edit `src/routeTree.gen.ts`. Current checks passed four tests / 217 assertions, TypeScript, lint and production build. Backend policy and isolated database tests provide additional coverage. Real SMTP delivery, production deployment and a complete live admin workflow remain separate verification tasks.

## Deployment with Coolify

Create a Dockerfile application using repository root, `/Dockerfile`, internal port **3000**, and the target domain `https://hawconnect-dash.raju.app`:

```dotenv
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
APP_URL=https://hawconnect-dash.raju.app
HAWCONNECT_ADMIN_API_URL=https://hawconnect-api.raju.app/api/admin
SESSION_SECRET=YOUR_STABLE_PRIVATE_SESSION_SECRET
```

These addresses are deployment targets, not a claim that they are live. Set these values in Coolify's runtime environment. Set the matching `HAWCONNECT_DASH_ORIGIN` in the backend. The Dockerfile includes a health check at `/api/health`; Docker image builds have not been verified.

Optional footer links are build-time configuration:

```dotenv
VITE_IMPRINT_URL=
VITE_PRIVACY_URL=
```

The public app's dashboard-managed legal documents are a separate publication feature. Editing those documents does not automatically configure the dashboard's own footer URLs. Configure appropriate real URLs before publishing the dashboard.

No database or SMTP credentials belong here. Do not log request bodies, authentication tokens or private data. Runtime environment changes require restarting/redeploying the dashboard; build-time changes require rebuilding it.

## Content and access maintenance

Legal publication requires the admin capability. Save both languages before publishing; drafts are not public. Withdrawing a document removes its public version while retaining the draft. Content is displayed as plain text, or opened through a validated HTTPS link; the tool does not generate legally approved policy text.

Keep bootstrap access and recovery under club control, preferably with more than one maintainer. Remove departing maintainers from both delegated roles and bootstrap configuration. Rotating `SESSION_SECRET` invalidates dashboard cookies; backend sessions must be revoked separately. Keep database, email, domain and repository recovery details in a password manager.

The interface selector changes labels and date formatting; it does not translate edited content. Add German source labels and English mappings together in `src/lib/translations.json`. Lists are bounded to 500 records; audit pagination has its own limits. See verification (local maintainer documentation) for fixture coverage and limitations.

## Repository and licence

Git metadata was removed at the maintainer’s request; initialise a fresh repository before configuring the intended origin `https://github.com/HAWConnect/hawconnect-dash.git`; verify remote availability before pushing. Setup does not push or deploy changes automatically. Publishing workflows remain archived until club infrastructure is configured.

Retain [LICENSE](LICENSE) and required upstream copyright/attribution notices. Follow [AGENTS.md](AGENTS.md). Historical attribution and compatibility identifiers are not product branding.
