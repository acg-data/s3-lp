# Studio Three Brickell — founding membership lander

A focused founding-membership inquiry page for the Brickell opening. There is no public pricing, checkout, membership inventory claim, opening date, or advertised gift. The only requested visitor details are name, email, and phone.

The approved call brief is implemented using existing Studio Three imagery and draft copy. Danielle's final copy and Brickell-specific assets can replace those before launch.

The lander now uses the user-provided original logo and the actual Gotham / Trade Gothic font families from studiothree.com, served locally. Brickell and founding memberships lead the hero. The building name and address are verified against the official Brickell page. See `artifacts/studio-three/FONT-SOURCES.md` for asset provenance and `artifacts/studio-three/DESIGN.md` for the implemented visual system.

## Local preview

Use Node.js 24 and pnpm. From the repository root:

    pnpm install --frozen-lockfile
    pnpm run build:lander
    pnpm exec wrangler d1 migrations apply LEADS --local --env dev
    pnpm run dev:worker

This serves the built website and Worker together at http://localhost:8787, using the dev configuration and local database. The preview script disables outbound email and Comms. Using dev avoids applying production custom-domain redirects to localhost.

For frontend hot reload, use a second PowerShell terminal:

    Copy-Item .dev.vars.example .dev.vars
    $env:PORT="5173"
    $env:BASE_PATH="/"
    pnpm --filter @workspace/studio-three run dev

Open http://localhost:5173. Vite proxies `/api` to the local Worker on port 8787. The local `.dev.vars` allows the frontend origin through that proxy. In production, leave `FRONTEND_ORIGIN` blank for same-origin requests unless an explicitly approved proxy origin is required.

## Inquiry delivery

`POST /api/inquiries` validates the visitor's name, email, phone, contact permission, request origin, and payload size. A hidden honeypot and Cloudflare rate limiting protect the public endpoint. Recipients and sender come from server configuration; visitors cannot choose the recipients. `LEAD_RECIPIENT` accepts a comma-separated list, validates every address before sending, and removes duplicate addresses. Submitted details are not written to application logs.

Every accepted inquiry is saved to Cloudflare D1 before confirmation. Development and production use separate databases. Stored records include contact permission, bounded first-touch campaign attribution, notification status, attempt count, and a follow-up status. No public endpoint exposes these records.

The Worker sends a transactional notification through Resend. The visitor's email becomes `reply_to`, so the receiving team can reply personally. New inquirers also receive a separate branded thank-you email confirming receipt and explaining that the Brickell team will follow up with founding membership options and pricing. Replies to that confirmation go to `adriana@studiothree.com`. It contains no internal lead details or private delivery-status link. After confirmed receipt, the form redirects to `/thank-you/`, which says, "Check your inbox for a confirmation email. If you don’t see it, check your spam or junk folder."

Team notifications and visitor confirmations have separate queues, attempt counts, leases, idempotency keys, and provider message IDs. A failure in either email does not block the other email or durable inquiry receipt. Existing inquiries default to `confirmation_status = 'skipped'`; deploying this feature does not email past leads. Only new submissions queue the thank-you email. Both `EMAIL_ENABLED` and `CONFIRMATION_EMAIL_ENABLED` must be true, with a valid `CONFIRMATION_REPLY_TO` address.

`notification_status = 'sent'` and `confirmation_status = 'sent'` mean Resend accepted each message. Signed Resend webhooks separately record sent, delayed, delivered, failed, suppressed, bounced, and complained events for each email. The page confirms durable inquiry receipt and invites the visitor to check their email; it does not promise final inbox delivery.

Each team notification includes a private delivery-status link that expires after 30 days. It shows team-email and member-confirmation delivery and spam complaints separately, plus the saved text-send status, without showing visitor contact details. The signature is verified before reading the record. Webhooks use Svix signature/timestamp verification, bounded payloads, event deduplication, and project/message-kind tags to handle a receipt arriving before the send response. Unrelated emails are ignored. Late events cannot overwrite a spam complaint or bounce with a successful status. No raw webhook message or recipient data is retained in the delivery-event table.

Resend delivery means acceptance by the receiving mail server. A spam complaint means the recipient marked the message as spam. Neither proves automatic Inbox/Spam placement; check the receiving mailbox for that. Open and click tracking are disabled for the new production sending domain.

Temporary sending failures leave the lead saved and pending. A five-minute Worker cron retries due records, with backoff and an atomic lease to prevent simultaneous sends. Retries stop after eight attempts or 23 hours from the first attempt, within the providers' 24-hour idempotency retention. Stable provider keys prevent duplicate sends during that window. A stable client request ID prevents a normal network retry from creating a second lead.

The form requires an initially unchecked contact-permission checkbox labeled "By submitting, you agree to be contacted by Studio Three about your membership inquiry." It submits both contact permission and `textConsent: true`, queuing the text confirmation after the inquiry is saved. Comms uses the user-approved workspace line `+12103933771` and the `imessage` channel; it does not fall back to SMS or WhatsApp. The message thanks the visitor for their founder interest and explains that the Brickell team will reach out personally. Phone numbers are normalized to E.164, and consent, the original message/line, attempts, and provider message ID are stored in D1. Unknown delivery is held for manual review rather than automatically resent. Personal replies are handled in the Comms inbox; this project does not activate an AI reply agent.

An inquiry preserves UTM source/medium/campaign/content/term and supported ad click IDs. Only a referrer hostname is retained, never a full referrer URL. The frontend emits `studio-three:inquiry-received` after confirmed receipt with the reference and studio only; it contains no contact details. GA4 and Google Ads integrations remain inactive because account IDs are unavailable.

## Meta Pixel and thank-you conversion — October 20, 2026

The user-provided Meta Pixel `1319802326887263` loads asynchronously and tracks `PageView` on `studiothreefounders.com` and `www.studiothreefounders.com`. JavaScript tracking is disabled on local, development, and other Worker hostnames to keep previews out of live campaign totals. The supplied no-JavaScript PageView image is retained in the HTML.

Only an accepted API response containing a valid inquiry reference navigates to `/thank-you/`. Its footer component sends the standard `Lead` event when the page renders; visitors do not have to scroll to the footer. The event uses the opaque inquiry reference as `eventID` and includes only the membership content name, with no submitted name, email, or phone fields. History and session storage keep a 30-minute receipt and a tracked flag to prevent another Lead on refresh or repeated rendering. Direct visits without a receipt, expired receipts, validation errors, failed requests, and missing Pixel scripts do not fire Lead. A direct visit shows a neutral link back to the inquiry form. The route has a `noindex, nofollow` response header and client meta tag.

"Accepted" means the inquiry was durably saved, not that a membership was approved or purchased. Pixel availability and ad blockers can affect reporting; tests establish application behavior, not receipt in Meta Events Manager. No live synthetic lead was sent to validate this change.

## Live configuration — October 16, 2026

- Production: https://studiothreefounders.com, served by `s3-brickell-lander`. Both HTTP and `www` redirect to the HTTPS apex. Cloudflare manages DNS and TLS for both custom domains. The HTML canonical and Open Graph URL use the apex.
- Production sender: `Studio Three Brickell <notifications@studiothreefounders.com>`. As updated October 20, membership inquiry notifications go to both `justin@aryocg.com` and `brickell@studiothree.com`, in production and dev. Replying to a notification contacts the inquirer directly. Multiple recipients share the provider's email ID; a delivery report alone does not establish delivery to every recipient, and any reported bounce or complaint remains visible.
- Resend verified the domain's DKIM, SPF, bounce-domain MX, and sending CNAME. DMARC is published in monitoring mode (`p=none`, relaxed alignment). This domain is configured for sending; no new receiving inbox was created.
- Resend and Comms are enabled in production and development. The approved Comms workspace line remains `+12103933771`. Existing provider history confirms the October 14 test was delivered over iMessage. No additional text was sent for the October 16 email check.
- `RESEND_API_KEY`, `COMMS_API_KEY`, `RESEND_WEBHOOK_SECRET`, and `DELIVERY_LINK_SECRET` are installed as Worker secrets. Dev and production have separate webhook signing and status-link secrets. Keep these out of Git, browser code, and `VITE_*` variables. Production webhook: `/api/webhooks/resend` on the production domain; dev has its own endpoint on the development Worker.
- The October 16 synthetic inquiry reached `justin@aryocg.com` in Gmail **Inbox**, with SPF, DKIM, and DMARC all **PASS**. Gmail reported delivery in one second. Resend's real webhook updated the production D1 record to `delivered`, and its signed status link returned the same result. This verifies that test; it is not a guarantee about every future mailbox decision.
- The new visitor thank-you email was tested separately using that explicitly marked synthetic inquiry. It reached `justin@aryocg.com` in Gmail **Inbox**, with `reply_to` set to Adriana. Its real webhook updated `confirmation_delivery_status` to `delivered` independently of the earlier team notification. The updated success message was checked in the local form at desktop and mobile widths with outbound providers disabled.

The studio manager's notification inbox is connected. The public Brickell contact email and phone number remain pending; the manager's address is used for notifications and is not published on the page. GA4 and Google Ads IDs remain pending. Meta tracking is configured as described above.

HTTP 200 means the inquiry is durably stored. If storage fails, the Worker returns HTTP 503 and the visitor can retry. Tests mock provider requests; local development keeps both sending switches off unless explicitly configured. A test-suite receipt does not establish real inbox delivery.

Review leads in the account's D1 database console. Notification failures can be found with `SELECT id, created_at, notification_status, notification_attempts, last_error_code FROM inquiries WHERE notification_status = 'failed'`. Delivery problems can be found with `SELECT id, email_delivery_status, email_event_at FROM inquiries WHERE email_delivery_status IN ('bounced', 'complained', 'failed', 'suppressed', 'delivery_delayed')`. Text attention can be found with `SELECT id, created_at, text_status, text_attempts, text_error_code FROM inquiries WHERE text_status IN ('failed', 'unknown')`. Before manually retrying an expired or unknown send, inspect the provider history to avoid contacting someone twice. Keep any exported contact data out of Git and public files.

All four migrations are applied to both remote databases. For a new local checkout, run:

    pnpm exec wrangler d1 migrations apply LEADS --local --env dev

For deployment to a newly configured database, apply its migrations before deploying:

    pnpm exec wrangler d1 migrations apply LEADS --remote --env dev

Cloudflare setup references:

- https://resend.com/docs/api-reference/emails/send-email
- https://resend.com/docs/dashboard/emails/idempotency-keys
- https://docs.osis.co/messages-api/send-message
- https://developers.cloudflare.com/workers/static-assets/routing/worker-script/

## Build, checks, and deployment

    pnpm --filter @workspace/studio-three run typecheck
    pnpm run typecheck:worker
    pnpm run test:inquiries
    pnpm run test:tracking
    pnpm run deploy:check

`deploy:check` builds the frontend and performs a Wrangler dry run. It does not deploy. The automated inquiry tests use mocked bindings and never send real emails.

The Cloudflare development preview is https://s3-brickell-lander-dev.justin-b75.workers.dev. Update it with `pnpm run deploy:dev`. The named `dev` environment has a separate Worker, D1 database, rate-limit namespace, webhook, and status-link signing key. Update the public site with `pnpm run deploy:lander` after applying any new production migrations.

Mobile hero copy and both actions are centered. The user-supplied header and Strength/Pilates/Yoga photos are served as responsive WebP assets, with lazy loading below the fold. The header crop excludes the woman at the far left and keeps the man at the right visible. Original assets remain available for provenance. Regenerate the variants with `node scripts/optimize-lander-images.mjs`.

The page now includes four FAQs and six real ClassPass review excerpts from Wynwood, Austin, River North, Lincoln Park, Fulton Market, and West Loop. The requested Miami-history paragraph was removed. Review provenance is recorded in `artifacts/studio-three/REVIEW-SOURCES.md`.

After configuration and an approved launch:

    pnpm run deploy:lander

Wrangler builds and deploys the frontend assets and inquiry Worker together. `wrangler.jsonc` is the Cloudflare entry point; the old Express API scaffold is not part of this lander deployment. Choose an account-unique rate-limit namespace if `310091` is already in use in the existing system.

## Later: Mariana Tek

Set `VITE_MEMBERSHIP_URL` to the approved HTTPS membership-purchase URL in `artifacts/studio-three/.env.local` (or the Cloudflare build environment) and rebuild. Header, hero, and sticky CTAs then open that URL, and the inline inquiry form is replaced with a membership link. No payment integration is needed inside this page.

## Other meeting follow-ups

Existing lead-list exports, Meta ad creative and targeting, the Meta geotag, Google Ads, Google conversion auditing, Apple Maps access, and broader local SEO remain separate workstreams. No marketing platforms or customer lists were changed by this website update.
