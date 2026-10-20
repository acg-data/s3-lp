# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People interested in becoming founding members at Studio Three Brickell, Miami, arriving from paid campaign traffic or a shared landing-page link.

## Product Purpose

Capture founding-membership interest and route the visitor's name, email, and phone to the studio manager for personal follow-up. The page introduces Brickell and makes that next action clear.

## Capabilities and Constraints

- Show founding memberships; do not publish prices, gifts, guest passes, or tentative opening dates.
- No payment collection or checkout. No fabricated bookings or membership approvals. Accepted inquiries receive a transactional email confirming receipt; provider delivery remains separate from inquiry acceptance.
- Inline form with name, email, phone, and a required, initially unchecked contact-permission checkbox. The user specified its exact label: "By submitting, you agree to be contacted by Studio Three about your membership inquiry." Submission requires this permission and queues the existing Comms text confirmation. Success requires a confirmed, durable Cloudflare D1 lead record. Provider notifications are separately retried and are not represented as final delivery.
- React/Vite source deployed with a Cloudflare Worker, static assets, and separate dev/production D1 lead databases. Production is studiothreefounders.com. The user chose Resend for email; team notifications go to justin@aryocg.com and adriana@studiothree.com. Production sends from notifications@studiothreefounders.com, and visitor confirmation replies go to the manager. The user chose Comms workspace line +12103933771 for founder confirmations. Both providers are enabled; keys remain server-only secrets.
- A successful form response redirects to /thank-you/. The page confirms inquiry receipt and reminds the visitor to check their inbox or spam folder. A direct visit without a recent receipt offers the membership inquiry instead of claiming a submission was received.
- User-provided Meta Pixel 1319802326887263 tracks PageView on the live campaign domain. A footer effect on the thank-you page tracks Lead after confirmed inquiry receipt, once per receipt with refresh protection. Local and dev JavaScript tracking is excluded. No submitted contact fields are added to the event payload. This is an inquiry conversion, not membership approval or payment.
- Website copy refers to the Brickell studio team/manager, with no personal names, as requested by the user. The hero uses the exact brand message "Train for Something Bigger." A submitted inquiry expresses founder interest; it does not purchase or guarantee a membership.
- Copy should be brief and concrete. Avoid repeated community/chapter/welcome slogans, repeated CTA strips, and decorative embellishment. Present the inquiry form directly after the workouts, using a flat paper layout.
- Later CTAs can switch to the approved Mariana Tek membership purchase URL.

## Brand Commitments

Use the user's provided transparent Studio Three logo, including its original taupe lettering and blue/orange/lime slashes. Use the fonts from studiothree.com: Gotham for body text and Trade Gothic Next / Trade Gothic Next Condensed for headings. The user explicitly wants a more beautiful, finished lander and stronger Brickell/founding-membership emphasis.

## Evidence on Hand

The October 9 Danielle/Justin meeting notes, confirmed by the user; existing Studio Three training photographs; the provided logo; live font and brand evidence from studiothree.com. The official Brickell page identifies 830 Brickell, 96 SE 8th St, Miami, FL 33131. Photos show the Studio Three experience and are not represented as the Brickell building.

The user requested Wynwood and the five other studios as brand context. The official studio directory verifies Wynwood, four Chicago studios (River North, Lincoln Park, Fulton Market, West Loop), Austin, and Brickell. The official Brickell page lists mats/towels, lockers, refillable water, showers and grooming products, blow-dry stations, community space, retail, and Wi-Fi. Location presence is not a claim that a founding membership includes access to every studio.

The user confirmed on October 13 that Brickell's modalities are Strength, Pilates, and Yoga, with no Interval. The header and all three discipline photographs use the new user-supplied images. The header excludes the woman at the far left and retains the man at the right through responsive CSS cropping. General modality descriptions do not announce a Brickell timetable or membership terms. The dedicated Brickell email address and phone number are pending; existing temporary inquiry routing remains in place.

The user requested an on-page map. The embed and directions use the Google Maps place for the 830 Brickell building, verified October 13. Google lists that place as 830 Brickell Plaza, Miami, FL 33131; the Studio Three page lists 96 SE 8th St, Miami, FL 33131. The printed studio street address remains based on Studio Three's source and needs confirmation before launch. The map is labeled as the building rather than as a separately verified studio entrance.

The user authorized launch setup, then prioritized email. Inquiry records retain bounded first-touch campaign attribution and contact permission; a lease-protected notification queue retries temporary sending failures. Four FAQs explain the inquiry process, payment, the selected workouts, and the verified location. The production domain and Meta Pixel are supplied and configured; GA4 and Google Ads IDs remain pending.

The user requested reviews from all six existing studios and removal of the Miami-history paragraph. Six short public ClassPass excerpts are individually attributed and linked to their sources. They describe the existing locations, not Brickell. See REVIEW-SOURCES.md for provenance.

## Product Principles

- Make Brickell and founding memberships immediately recognizable.
- Give visitors one clear next step and explain the human follow-up.
- Preserve the real brand identity and supplied facts.
- Keep unpublished pricing and incentives private.
