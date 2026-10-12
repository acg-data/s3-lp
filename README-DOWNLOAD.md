# Studio Three Brickell — founding membership lander

A focused founding-membership inquiry page for the Brickell opening. There is no public pricing, checkout, membership inventory claim, opening date, or advertised gift. The only requested visitor details are name, email, and phone.

The approved call brief is implemented using existing Studio Three imagery and draft copy. Danielle's final copy and Brickell-specific assets can replace those before launch.

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

The Worker sends a transactional notification to the configured studio manager through Cloudflare's native `EMAIL` binding. The visitor's email becomes `replyTo`, so the manager can reply personally. No automated email is sent to the visitor. The page confirms the inquiry only after Cloudflare returns a message ID. This confirms acceptance by the email service, not final inbox delivery.

Email is the lead handoff; this implementation does not create a separate lead database. If sending fails, the visitor receives a retry message and their entered details remain in the form.

## Before launch

1. Confirm Anastasia's email or the Brickell receiving inbox.
2. Choose a sender address on a domain enabled for Cloudflare Email Sending in the existing account. No Studio Three sender has been configured in this project.
3. Set `LEAD_RECIPIENT` and `EMAIL_FROM` in `wrangler.jsonc`. These are email addresses, not API keys. Optionally restrict the `EMAIL` binding to the confirmed recipient using `allowed_destination_addresses`.
4. Confirm the final copy and photography with Danielle. Existing photos illustrate the Studio Three experience; they are not presented as photos of the new Brickell studio.
5. Choose the landing-page domain/subdomain and attach it in the existing Cloudflare account.
6. Send an approved test inquiry and verify inbox arrival, reply-to, and manager follow-up before using the URL in ads.

Both email settings are intentionally blank. The Worker returns HTTP 503 until they are configured; it does not fake success. Local email bindings are simulated unless explicitly configured as remote. Do not mistake a simulated send for real inbox delivery.

Cloudflare setup references:
- https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
- https://developers.cloudflare.com/workers/static-assets/routing/worker-script/

## Build, checks, and deployment

    pnpm --filter @workspace/studio-three run typecheck
    pnpm run typecheck:worker
    pnpm run test:inquiries
    pnpm run deploy:check

`deploy:check` builds the frontend and performs a Wrangler dry run. It does not deploy. The automated inquiry tests use mocked bindings and never send real emails.

After configuration and an approved launch:

    pnpm run deploy:lander

Wrangler builds and deploys the frontend assets and inquiry Worker together. `wrangler.jsonc` is the Cloudflare entry point; the old Express API scaffold is not part of this lander deployment. Choose an account-unique rate-limit namespace if `310091` is already in use in the existing system.

## Later: Mariana Tek

Set `VITE_MEMBERSHIP_URL` to the approved HTTPS membership-purchase URL in `artifacts/studio-three/.env.local` (or the Cloudflare build environment) and rebuild. Header, hero, and sticky CTAs then open that URL, and the inline inquiry form is replaced with a membership link. No payment integration is needed inside this page.

## Other meeting follow-ups

Existing lead-list exports, Meta ad creative and targeting, the Meta geotag, Google Ads, Google conversion auditing, Apple Maps access, and broader local SEO remain separate workstreams. No marketing platforms or customer lists were changed by this website update.
