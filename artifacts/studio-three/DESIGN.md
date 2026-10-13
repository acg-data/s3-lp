---
name: Studio Three Brickell
description: The Studio Three brand expressed through a focused founding-membership lander.
colors:
  ink: "#0b0b0b"
  paper: "#f7f7f4"
  white: "#fff"
  secondary: "#555650"
  line: "#deded7"
  lime: "#bdcc00"
  blue: "#007495"
  orange: "#de4316"
  taupe: "#b5aea5"
  action-hover: "#d1df1b"
typography:
  display:
    fontFamily: '"Trade Gothic Next Condensed", "Arial Narrow", sans-serif'
    fontSize: "clamp(64px, 6.5vw, 88px)"
    fontWeight: 700
    lineHeight: 0.99
    letterSpacing: "-0.015em"
  headline:
    fontFamily: '"Trade Gothic Next Condensed", "Arial Narrow", sans-serif'
    fontSize: "clamp(36px, 3.5vw, 48px)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.015em"
  title:
    fontFamily: '"Trade Gothic Next", Arial, sans-serif'
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: '"Gotham", Arial, sans-serif'
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.95
  label:
    fontFamily: '"Gotham", Arial, sans-serif'
    fontSize: "12px"
    fontWeight: 500
  action:
    fontFamily: '"Trade Gothic Next Condensed", "Arial Narrow", sans-serif'
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
rounded:
  square: "0"
spacing:
  gutter: "clamp(24px, 5vw, 80px)"
  section: "clamp(56px, 5.8vw, 84px)"
  compact: "16px"
  field: "16px"
  medium: "24px"
  content: "28px"
  large: "32px"
  wide: "48px"
components:
  button-primary:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.square}"
    padding: "18px 26px"
  button-primary-hover:
    backgroundColor: "{colors.action-hover}"
  button-compact:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "14px 20px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "12px 14px"
  form-panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
    padding: "0"
---

# Design System: Studio Three Brickell

## Overview

**Creative North Star: "Studio Three, Brickell"**

This lander extends the actual Studio Three identity chosen by the user: the original transparent logo, Gotham and Trade Gothic typography, monochrome training photography, and the blue/orange/lime brand marks. Bold condensed headlines and generous section spacing give the page a confident studio presence; restrained body text keeps the next step understandable.

Scope is this landing page. Evidence is `src/index.css`, `src/pages/LandingPage.tsx`, `src/components/InquiryForm.tsx`, the direction contract in `index.html`, and the final desktop/mobile renders. This records implemented visual decisions, not a new identity proposal.

**Key Characteristics:**

- Large uppercase condensed headings.
- Ink and paper sections with purposeful brand-color accents.
- Human training photography with readable text separation.
- Square, flat actions and fields.
- A legible, intent-preserving mobile composition.

## Colors

The three-color brand signature sits within a restrained ink, white, paper, and taupe environment. Frontmatter values are normative; CSS custom properties are the implementation source.

### Primary

- **Studio Lime** (`lime`): the main action and the hero's Brickell emphasis; its brighter hover shade is `action-hover`.

### Secondary

- **Studio Blue** (`blue`): the community heading emphasis, directional icon, keyboard focus, and first brand slash.
- **Studio Orange** (`orange`): the middle brand slash and the corresponding membership boundary segment.

### Neutral

- **Ink** (`ink`): header, hero, reviews, footer, and primary text on light surfaces.
- **Paper** (`paper`): studio section and inquiry panel.
- **White** (`white`): location strip, field interiors, and major text on ink.
- **Secondary Ink** (`secondary`): supporting text on light surfaces.
- **Quiet Line** (`line`): division between the white location strip and paper section.
- **Brand Taupe** (`taupe`): membership heading emphasis; preserve the supplied logo's own pixel colors.

**The Original Mark Rule.** Use `public/studio-three-logo.png` unchanged. Do not redraw, recolor, or substitute typeset lettering for the user's logo.

## Typography

**Display Font:** Trade Gothic Next Condensed, with Arial Narrow and sans-serif fallbacks.
**Heading Font:** Trade Gothic Next, with Arial and sans-serif fallbacks.
**Body Font:** Gotham, with Arial and sans-serif fallbacks.

Local font files register Gotham Book/Medium/Bold at weights 400/500/700, and both Trade Gothic families at 700. All use `font-display: swap`.

### Hierarchy

- **Display:** the frontmatter hero role; uppercase, tightly spaced, balanced lines. Brickell has its own larger responsive emphasis in source.
- **Headline:** the frontmatter section-heading role; condensed uppercase for the studio and membership sections.
- **Title:** regular-width Trade Gothic for form, confirmation, and direct-membership headings.
- **Body:** Gotham Book for prose; desktop paragraphs generally use the frontmatter body role, with readable widths of 380–440px. Primary mobile paragraphs use 16px.
- **Label:** Gotham Medium for field names. Inputs retain 16px text and a 1.5 line-height at all widths.
- **Action:** bold condensed uppercase. Compact navigation actions use 17px on desktop; form submit uses 19px.

**The Brand Pairing Rule.** Keep condensed Trade Gothic for editorial emphasis and actions, regular Trade Gothic for form titles, and Gotham for readable supporting information.

## Layout

The shared gutter and section spacing in frontmatter set the horizontal and vertical rhythm. The hero leads into the workout gallery, then the membership inquiry, followed by location information, reviews, amenities and FAQs. The workout gallery uses three equal columns; membership uses a 1.1:1 grid with a 1200px-centered inset. The header stays sticky. Section headings are brief labels rather than repeated campaign slogans.

At 1100px and below, the location label leaves the header, gaps compress, and hero copy widens. At 767px and below, modalities, membership, and footer stack. The hero uses centered headlines, offer, body and actions, with its photo below the principal copy. Primary mobile paragraphs use 16px type; inputs retain 16px to avoid iOS focus zoom. Modality photos become matching 1.4-ratio frames. At 360px and below, the header and action tighten further.

The mobile action appears only after the hero leaves view and before the inquiry section reaches the viewport; hidden controls are inert. Safe-area padding protects the bottom action and footer. Anchor offsets account for the sticky header.

**The Intent First Rule.** Responsive changes preserve headline hierarchy, visible faces, readable prose, and access to the founding-membership action.

## Elevation & Depth

No component shadows are used. Flat ink/paper/white section changes and fine dividers establish structure. Hero gradients separate copy from the photograph. Modality labels and descriptions sit on the paper surface below the images.

The hero photo has a single 750ms clip reveal. Buttons change background over 180ms; the mobile action moves over 250ms using the source easing. Reduced-motion preference disables animation, transitions, and smooth scrolling.

## Shapes

Buttons, fields, panels, and photo frames have square corners. Fields use a fine neutral stroke; sections use quiet horizontal rules. The three skewed brand slashes retain their blue/orange/lime order.

The membership section uses a paper surface with fine neutral boundaries. The brand colors remain in the supplied logo and functional controls; there is no decorative three-color section strip.

## Components

### Buttons

Flat lime rectangles with ink lettering, an arrow, generous internal space, and no shadow. Primary actions have a 58px minimum height; compact header actions have a 48px minimum height, reducing to 44px on mobile. Hover uses the frontmatter hover color; keyboard focus has a 3px blue outline offset by 5px. Disabled buttons use 0.65 opacity and a wait cursor. Form and mobile actions span their available width.

Button labels and the shared 19px right arrow are centered together with a 12px gap. Wide actions retain their full touch area and generous outer padding without sending the arrow to the far edge.

### Inputs / Fields

White square fields inside the paper inquiry panel; 52px minimum height, 16px input text, and a `#c9c9c2` stroke. Labels are visible above fields. Focus adds a 2px blue outline offset by 2px. Invalid fields and accompanying messages use `#b42c12`; disabled fields use 0.7 opacity. Preserve the Name, Email, and Phone labels, autocomplete, error associations, and first-error focus.

### Cards / Containers

Membership copy and form share one flat paper section. Inquiry, success and optional direct-membership surfaces use transparent backgrounds and no internal panel padding, radius, shadow or ornamental border. Success is a distinct focusable status state confirming durable inquiry receipt. Provider delivery is tracked separately; this design document does not certify production delivery.

The optional iMessage consent uses an unchecked native 20px checkbox within a full clickable label, with a 44px minimum row. Its copy explains the confirmation and the Brickell team's personal follow-up; it does not promise completed membership or immediate delivery. The hero carries the brand message "Train for Something Bigger," with fluid mobile sizing and a centered three-line composition on narrow phones.

### Navigation

An ink sticky header presents the original logo and a compact membership action. The studio anchor uses condensed uppercase type and turns lime on hover. Mobile removes that auxiliary anchor and keeps the primary action. Text links remain understated Gotham controls, underline on hover, and keep visible keyboard focus.

### Photography and brand signature

Use authentic Studio Three photographs with grayscale treatment. Hero and modality crops must retain the subject and meaningful training context. These are experience images, not evidence of the Brickell building. Reuse the three slashes only in their evidenced brand roles.

The Strength, Pilates, and Yoga gallery uses the user-supplied October 13 photographs, pairing each 4:3 image with a 42px condensed heading and a short, factual 14px Gotham description. The three columns share a 28px gap and remain flat on paper without card borders or overlays. On mobile, they stack with a 36px gap. Landscape frames retain the plank row, Pilates bridge, and full-height Yoga pose. The form follows directly, without an extra CTA strip.

The header uses the supplied group-training photo, anchored to the right inside an overflow-hidden frame. The image spans 140% of its frame to exclude the woman at the far left while retaining the man on the right. Mobile keeps the centered copy and actions above the visible training scene. Responsive WebP sources limit image transfer without retouching the photographs.

## Do's and Don'ts

### Studio network and Brickell amenities

The extension preserves the flat Studio Three system. A white `studio-network` section pairs a condensed heading and Gotham introduction with a three-city directory: Miami, Chicago, Austin. Studios are linked list rows with 1px neutral separators, 14px medium names, supporting addresses, and small navigation arrows. Brickell's row uses the existing blue and returns to the membership action. On mobile the city groups stack in reading order, with 12px address details.

The paper `studio-amenities` section pairs a short heading with three factual rows describing studio essentials, locker rooms and shared space. Each uses a 28px condensed heading and 14px Gotham body copy with existing neutral separators. Desktop is two columns; mobile is one. The source facts come from the official Studio Three directory and Brickell page; the directory does not promise membership access across all studios.

The white FAQ section closes the page, using the same two-column heading/content structure and one-column mobile layout. Native details/summary disclosures keep keyboard and screen-reader behavior intact. Condensed 23px question text, 14px Gotham answers, and fine neutral separators preserve the flat system. Inquiry confirmation states receipt only after durable storage; it does not claim final email delivery.

The ink review section displays six sourced ClassPass excerpts as open quotations with fine dividers, Trade Gothic headings, named reviewers where available, studio/city attribution, and individual source links. Desktop uses three columns, intermediate widths two, and mobile one. Its heading is simply "Studio reviews." No extra membership invitation, star ratings or invented review totals are shown.

At the user's request, five blue decorative stars sit above the membership form beside a link labeled "Reviews from our other studios." The link goes to the sourced review section, wraps within narrow layouts, and has a 44px minimum touch target. The stars do not display a numeric score or claim a Brickell rating.

### Do:

- **Do** preserve the supplied logo and local brand font families.
- **Do** retain monochrome photography, visible faces, and deliberate contrast behind copy.
- **Do** use the existing square lime action, paper panel, and white field primitives.
- **Do** preserve responsive reading order, keyboard focus, field errors, and reduced-motion behavior.

### Don't:

- **Don't** redraw the logo or replace the brand fonts with an invented identity.
- **Don't** add decorative color strips or repeated invitation blocks.
- **Don't** add shadows or rounded pill treatments to these flat primitives.
- **Don't** make headline impact depend on illegible mobile supporting text.
