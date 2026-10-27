# HAWConnect Dash

Student-maintained administration for HAWConnect, built with TanStack Start, React, Tailwind and Bun. This is a separate application using the shared HAWConnect backend, not a second database service. Distributed under [AGPL-3.0](LICENSE); required upstream copyright and attribution must be retained. No university endorsement is claimed.

## Features

- German and English interface with persistent language selection, light/dark themes and responsive navigation.
- Administrator magic-link login and separately provisioned password login; all privileged requests require backend-verified permissions.
- Bilingual announcements, scheduling, audience/platform targeting and validated image URLs.
- Campus Life events and organizer profiles, published through the public app's managed campus feed.
- Privacy Policy and Imprint editing in both languages: formatted in-app text or HTTPS links, save draft, publish, withdraw and conflict protection.
- Public-source status monitoring, delegated capabilities, protected bootstrap grants and paginated audit history.
- Ops-managed clubs stored in the shared database, with per-language TipTap rich descriptions and R2 images.

Student calendars, private subscription URLs and account secrets are not exposed in administration screens. Announcement and club image uploads/galleries use R2 when configured; valid external HTTPS image URLs remain supported.

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

Create a Dockerfile application using repository root, `/Dockerfile`, internal port **3000**, and the target domain `https://dash.hawconnect.de`:

```dotenv
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
APP_URL=https://dash.hawconnect.de
HAWCONNECT_ADMIN_API_URL=https://api.hawconnect.de/api/admin
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

The Git origin is `https://github.com/HAWConnect/hawconnect-dash.git`. Setup does not push or deploy changes automatically. Publishing workflows remain archived until club infrastructure is configured.

Retain [LICENSE](LICENSE) and required upstream copyright/attribution notices. Follow [AGENTS.md](AGENTS.md). Historical attribution and compatibility identifiers are not product branding.

## Announcement images with Cloudflare R2

The existing announcement upload button and image gallery use R2 when configured. Set these **runtime-only** variables on the Dash service in Coolify:

```dotenv
HAWCONNECT_R2_ACCOUNT_ID=YOUR_CLOUDFLARE_ACCOUNT_ID
HAWCONNECT_R2_BUCKET=hawconnect-assets
HAWCONNECT_R2_ACCESS_KEY_ID=YOUR_BUCKET_ACCESS_KEY_ID
HAWCONNECT_R2_SECRET_ACCESS_KEY=YOUR_BUCKET_SECRET_ACCESS_KEY
HAWCONNECT_R2_PUBLIC_URL=https://assets.hawconnect.de
HAWCONNECT_R2_PREFIX=dash-images/
```

`assets.hawconnect.de` is an example custom domain to configure on the bucket, not a hostname created by the app. The account ID is the 32-character Cloudflare account identifier; bucket name and credentials come from your R2 setup. Create an R2 API credential with Object Read & Write access restricted to this bucket. Never use `VITE_*` names or put storage credentials in build arguments or the mobile app.

Enable public read access through an R2 custom domain and use its HTTPS base URL as `HAWCONNECT_R2_PUBLIC_URL`. The S3 API endpoint is used only for authenticated server uploads/listing, not as the public image URL. The optional prefix must be a dedicated nonempty directory name such as `dash-images/`; the gallery lists only that prefix. Use a bucket/prefix for public announcement images, not personal calendar files or private uploads.

The browser sends image files to Dash's existing server function; Dash checks its backend-verified `announcements` capability before accessing R2. The server then uploads with the S3-compatible API, so browser-to-R2 write CORS and presigned upload URLs are unnecessary. Public image GET requests must work without credentials for the mobile/web apps. Keep the existing APP_URL/HTTPS/session configuration and same-origin protections enabled.

Supported uploads: JPEG, PNG, WebP and GIF, up to 5 MiB. Both client checks and server-side size/signature/MIME checks apply; SVG and other formats are rejected. Objects use immutable random names and correct image content types. The returned public URL is stored through the existing announcement API; no database migration is needed. Failed uploads do not replace the form's current image URL. Replacing/removing an image in a form only detaches the reference; it does not delete shared bucket objects.

Without R2 configuration, HTTPS image URL entry remains available; upload/gallery operations show a translated configuration error. Storage failures are reported without raw credentials or SDK error details. The gallery reads at most ten pages of 1,000 objects; if it cannot finish within that bound it reports an error rather than silently returning an incomplete gallery. Use separate prefixes/buckets if the collection grows beyond that size.

Events and organizer profiles currently have no image fields in their saved API schemas. This integration activates the existing announcement image features; it does not invent new event/profile database fields.

After configuring the bucket, verify upload, public image loading, gallery reuse and permission denial in your own deployment. Local automated tests use an injected storage transport; passing them does not verify a live bucket. R2 setup references: [S3 SDK configuration](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/) and [public custom domains](https://developers.cloudflare.com/r2/buckets/public-buckets/).

### Clubs editing

The backend owns club persistence and HTML sanitization. Apply its additive `clubs:migrate` migration separately before using club editing; Dash reports `ClubsSetupRequired` when setup is missing. No Dash database credentials are needed. Clubs are managed solely in the shared database; the directory no longer scrapes or merges website content. Records share an optimistic version across translations, so concurrent changes require reloading and reopening the club. Deleting a club removes every translation. Existing opaque editor identifiers remain valid. No automatic import or seeding is performed by Dash.

The global DE/EN language selects the editing language. A translation fallback explicitly shows its available language; saving creates the current translation. Unsaved drafts remain in memory across language switches and navigation/unload prompts protect them. Descriptions support headings, emphasis, lists, safe links and images. The backend derives the plain description for older clients.

Club uploads use the existing runtime R2 configuration with the reserved `clubs/` subprefix beneath `HAWCONNECT_R2_PREFIX` (default `dash-images/clubs/`). Existing announcement uploads keep their original root prefix and their gallery excludes club images. Every club upload and gallery request checks Ops access. Uploads accept JPEG, PNG, WebP and GIF up to 5 MiB, validate file signatures on the server and never expose storage credentials to the browser. Uploads happen when selected; abandoning a draft leaves the uploaded asset available in the gallery. No automated deletion of stored images is performed.

Local fixtures cover editor HTML parsing, unsafe links/images, image policy and gallery isolation; no live R2 operations are required for tests.

### Formatted legal pages

Privacy Policy and Imprint support text-only rich formatting in German and English: headings, bold, italic, lists and safe HTTPS/mailto links. Their editors expose no image upload, URL or gallery controls and reject pasted images. Legal operations retain the existing Admin capability requirement; no storage access or database migration is needed.

Legacy `body` text is escaped for display in the editor, including literal angle brackets. Opening or saving an unchanged legacy draft preserves the original plain format. The first content edit adds a `bodyHtml` pair and safely converts the untouched language; the backend sanitizes HTML and derives the authoritative plain `body` fallback. Each language supports up to 20,000 HTML characters. Drafts remain in memory when switching legal documents, interface language or text/link mode. Save before publishing; version conflicts, publication and withdrawal retain their existing workflow.

## Managed Quick Links

Ops and administrator accounts can manage `/quick-links`: add bilingual titles and HTTPS URLs, select a visible icon, reorder links, hide them, or delete them. Save publishes the directory immediately to the app links screen and recent-link dashboard card. Existing link IDs remain stable. Concurrent changes are rejected without clearing the editor. The backend owns persistence and audit; Dash never receives database credentials.

Before first use, run `bun run quick-links:migrate` in the backend against the intended configured database. This additive, repeatable command creates the table and seeds existing links only if no directory exists. It never replaces saved edits. Deploy backend before the app; until the endpoint is available the app retains its bundled directory.
