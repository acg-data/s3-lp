# Studio Three Brickell — founding membership lander

A focused founding-membership inquiry page for the Brickell opening. There is no public pricing, checkout, membership inventory claim, opening date, or advertised gift. The only requested visitor details are name, email, and phone.

The approved call brief is implemented using existing Studio Three imagery and draft copy. Danielle's final copy and Brickell-specific assets can replace those before launch.

The lander now uses the user-provided original logo and the actual Gotham / Trade Gothic font families from studiothree.com, served locally. Brickell and founding memberships lead the hero. The building name and address are verified against the official Brickell page. See `artifacts/studio-three/FONT-SOURCES.md` for asset provenance and `artifacts/studio-three/DESIGN.md` for the implemented visual system.

## Local preview

Use Node.js 24 and pnpm. From the repository root:

    pnpm install --frozen-lockfile
    pnpm run build:lander
    pnpm run dev:worker

This serves the built website and Worker together at http://localhost:8787.

For frontend hot reload, use a second PowerShell terminal:

    Copy-Item .dev.vars.example .dev.vars
    $env:PORT="5173"
    $env:BASE_PATH="/"
    pnpm --filter @workspace/studio-three run dev

Open http://localhost:5173. Vite proxies `/api` to the local Worker on port 8787. The local `.dev.vars` allows the frontend origin through that proxy. In production, leave `FRONTEND_ORIGIN` blank for same-origin requests unless an explicitly approved proxy origin is required.

## Inquiry delivery

`POST /api/inquiries` validates the visitor's name, email, phone, contact permission, request origin, and payload size. A hidden honeypot and Cloudflare rate limiting protect the public endpoint. The recipient and sender come from server configuration; visitors cannot choose the recipient. Submitted details are not written to application logs.

Every accepted inquiry is saved to Cloudflare D1 before confirmation. Development and production use separate databases. Stored records include contact permission, bounded first-touch campaign attribution, notification status, attempt count, and a follow-up status. No public endpoint exposes these records.

The Worker sends a transactional notification through Cloudflare's native `EMAIL` binding. The visitor's email becomes `replyTo`, so the receiving team can reply personally. No automated email is sent to the visitor. Notification success means Cloudflare accepted the message, not final inbox delivery. The page confirms durable inquiry receipt and does not claim email delivery.

Temporary sending failures leave the lead saved and pending. A five-minute Worker cron retries due records, with backoff and an atomic lease to prevent simultaneous sends. After eight attempts, a record is marked failed for manual attention. Notifications are at-least-once: if sending succeeds but its database update fails, a retry can duplicate that email; every notification includes the same inquiry reference. A stable client request ID prevents a normal network retry from creating a second lead.

An inquiry preserves UTM source/medium/campaign/content/term and supported ad click IDs. Only a referrer hostname is retained, never a full referrer URL. The frontend emits `studio-three:inquiry-received` after confirmed receipt with the reference and studio only; it contains no contact details. GA4, Google Ads, and Meta integrations have not been activated because account IDs are unavailable.

## Before launch

1. The user chose `justin@aryocg.com` as the temporary sender and receiving inbox. These are set in `wrangler.jsonc`, with binding restrictions for both addresses.
2. Authenticate `aryocg.com` for Cloudflare Email Sending. Its nameservers are Cloudflare, but the connected account cannot access its zone; `wrangler email sending enable aryocg.com` was rejected because the zone was not found. Access to the account that manages the domain is required. Do not alter its existing Google Workspace MX records.
3. After domain authentication and a real delivery test, set `EMAIL_ENABLED` to `"true"` in the intended environment. It is currently `"false"`; inquiries are saved while notification attempts remain pending.
4. Confirm the final copy and photography with Danielle. Existing photos illustrate the Studio Three experience; they are not presented as photos of the new Brickell studio.
5. Choose the landing-page domain/subdomain and attach it in the existing Cloudflare account.
6. Send an approved test inquiry and verify inbox arrival, reply-to, and manager follow-up before using the URL in ads.

HTTP 200 means the inquiry is durably stored. If storage fails, the Worker returns HTTP 503 and the visitor can retry. Local email bindings are simulated unless explicitly configured as remote. Do not mistake a simulated send for real inbox delivery.

Review leads in the account's D1 database console. Notification failures can be found with `SELECT id, created_at, notification_status, notification_attempts, last_error_code FROM inquiries WHERE notification_status = 'failed'`. After addressing the sending issue, set a selected record back to pending and reset its attempts to retry it. Keep any exported contact data out of Git and public files.

Database migrations are provisioned and applied in both remote databases. For a new local checkout, run:

    pnpm exec wrangler d1 migrations apply LEADS --local

For deployment to a newly configured database, apply its migrations before deploying:

    pnpm exec wrangler d1 migrations apply LEADS --remote --env dev

Cloudflare setup references:

- https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
- https://developers.cloudflare.com/workers/static-assets/routing/worker-script/

## Build, checks, and deployment

    pnpm --filter @workspace/studio-three run typecheck
    pnpm run typecheck:worker
    pnpm run test:inquiries
    pnpm run deploy:check

`deploy:check` builds the frontend and performs a Wrangler dry run. It does not deploy. The automated inquiry tests use mocked bindings and never send real emails.

The Cloudflare development preview is https://s3-brickell-lander-dev.justin-b75.workers.dev. Update it with `pnpm run deploy:dev`. The named `dev` environment has a separate Worker, D1 database, and rate-limit namespace. The temporary email addresses are configured; sending awaits domain authentication. Production deployment remains separate.

The page now includes four FAQs and six real ClassPass review excerpts from Wynwood, Austin, River North, Lincoln Park, Fulton Market, and West Loop. The requested Miami-history paragraph was removed. Review provenance is recorded in `artifacts/studio-three/REVIEW-SOURCES.md`.

After configuration and an approved launch:

    pnpm run deploy:lander

Wrangler builds and deploys the frontend assets and inquiry Worker together. `wrangler.jsonc` is the Cloudflare entry point; the old Express API scaffold is not part of this lander deployment. Choose an account-unique rate-limit namespace if `310091` is already in use in the existing system.

## Later: Mariana Tek

Set `VITE_MEMBERSHIP_URL` to the approved HTTPS membership-purchase URL in `artifacts/studio-three/.env.local` (or the Cloudflare build environment) and rebuild. Header, hero, and sticky CTAs then open that URL, and the inline inquiry form is replaced with a membership link. No payment integration is needed inside this page.

## Other meeting follow-ups

Existing lead-list exports, Meta ad creative and targeting, the Meta geotag, Google Ads, Google conversion auditing, Apple Maps access, and broader local SEO remain separate workstreams. No marketing platforms or customer lists were changed by this website update.
