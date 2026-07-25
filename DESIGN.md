---
name: Vindima
description: Organic winery storefront — cellar-ledger warmth in burgundy, gold and warm ash.
colors:
  vino-tinto: '#510128'
  oro-viejo: '#d9af50'
  oro-claro: '#e7c069'
  oro-tostado: '#b8902f'
  ceniza-calida: '#f2f1ed'
  pergamino: '#fbfaf7'
  lias: '#edebe3'
  posos: '#1c1418'
  barrica: '#3a0a22'
  hoja: '#1f7a4d'
  lacre: '#dc2626'
typography:
  display:
    fontFamily: 'Cormorant Garamond, Georgia, serif'
    fontSize: 'clamp(1.45rem, 4vw, 3rem)'
    fontWeight: 600
    lineHeight: 1
    letterSpacing: '0.02em'
  headline:
    fontFamily: 'Cormorant Garamond, Georgia, serif'
    fontSize: '1.55rem'
    fontWeight: 600
    lineHeight: 1.1
  body:
    fontFamily: 'Jost, system-ui, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: 'Jost, system-ui, sans-serif'
    fontSize: '0.7rem'
    fontWeight: 600
    letterSpacing: '0.13em'
rounded:
  seal: '2px'
  sm: '6px'
  md: '8px'
  lg: '10px'
  vessel: '16px'
  pill: '9999px'
spacing:
  row: '14px'
  block: '20px'
  band: '24px'
components:
  button-primary:
    backgroundColor: '{colors.oro-viejo}'
    textColor: '{colors.vino-tinto}'
    rounded: '{rounded.seal}'
    padding: '12px 20px'
    typography: '{typography.label}'
  button-primary-hover:
    backgroundColor: '{colors.oro-claro}'
    textColor: '{colors.vino-tinto}'
  button-outline:
    backgroundColor: 'transparent'
    textColor: '{colors.vino-tinto}'
    rounded: '{rounded.seal}'
  button-destructive:
    backgroundColor: '#dc26261a'
    textColor: '{colors.lacre}'
    rounded: '{rounded.seal}'
  card:
    backgroundColor: '{colors.pergamino}'
    rounded: '{rounded.vessel}'
    padding: '20px 24px'
  status-pill:
    rounded: '{rounded.pill}'
    padding: '4px 12px'
    typography: '{typography.label}'
  total-band:
    backgroundColor: '#d9af500f'
    textColor: '{colors.vino-tinto}'
    padding: '16px 24px'
---

# Design System: Vindima

## 1. Overview

**Creative North Star: "The Cellar Ledger"**

Vindima is an organic winery in Aguascalientes selling wine, charcuterie and tables for people
hosting other people. The interface behaves like the book a cellar master keeps: warm paper,
ruled entries, numbers set in a serif that has weight, and a gold seal reserved for the moment
something is decided. It is a record first and a shop second. Orders are entries, totals are
sealed, and history is never redrawn.

That metaphor resolves the tension in the palette. Deep burgundy is ink, not decoration: it
carries structure, headings and borders. Gold is the seal: it appears where an action is
committed or a total is fixed, and nowhere else. Warm ash is the paper everything rests on.
Nothing is pure white and nothing is pure black, because paper and ink are never either.

This system explicitly rejects the SaaS-dashboard reflex: no cool grays, no blue-on-white
utility chrome, no gradient hero metrics, no card grids of icon-plus-heading-plus-text. It also
rejects rustic-vineyard cliché — no woodgrain textures, no script fonts, no sepia photography
filters. The register is editorial, not folkloric.

**Key Characteristics:**

- Warm ash paper (`#f2f1ed`) under everything; parchment (`#fbfaf7`) for raised surfaces.
- Burgundy as ink and structure; gold strictly as seal and commitment.
- Serif numerals with `tabular-nums` for every amount; sans for prose.
- Sharp seals, soft vessels: buttons are 2px-cornered, cards are 16px.
- Shadows are burgundy-tinted and wide, never neutral drop shadows.

## 2. Colors

A cellar palette: two saturated brand colors on warm neutrals, with one green and one red
reserved for meaning rather than mood.

### Primary

- **Oro Viejo** (`#d9af50`): the seal. Primary buttons, the active fulfillment rail, focus
  rings, total bands. Hover lifts to **Oro Claro** (`#e7c069`). If gold appears on a surface,
  something there is committed or actionable.
- **Oro Tostado** (`#b8902f`): the darker gold used for reward and free-item accents, where
  gold must read as _earned_ rather than _clickable_.

### Secondary

- **Vino Tinto** (`#510128`): the ink. Headings, order numbers, borders (at 10–13% alpha),
  uppercase micro-labels, and the entire dark-mode card surface. Never a background at full
  strength in light mode.
- **Barrica** (`#3a0a22`): the dark-mode page ground, one step deeper than Vino Tinto so cards
  read as raised.

### Tertiary

- **Hoja** (`#1f7a4d`): growth and reward confirmations only (stamps earned, free item granted).
- **Lacre** (`#dc2626`): destructive intent. Always used as a 10–20% tint behind red text, never
  as a solid fill, so a dangerous action reads as a wax seal rather than an alarm.

### Neutral

- **Ceniza Cálida** (`#f2f1ed`): page ground. Warm ash, never white.
- **Pergamino** (`#fbfaf7`): cards, popovers, sidebars — the raised sheet.
- **Lías** (`#edebe3`): secondary surfaces, muted bands, table stripes.
- **Posos** (`#1c1418`): body text. A near-black tinted toward plum; muted text is the same at
  60% alpha, never a separate gray.

### Named Rules

**The Seal Rule.** Gold marks commitment, not decoration. A primary button, a fixed total, an
active step, a focus ring. Two golds on one surface competing for the same meaning is a bug.

**The Single Amber Rule.** Amber (outside the palette above) is reserved for exactly one thing:
a state that requires the customer to act, such as an unpaid order. Any status that needs no
action steps back to a burgundy tint so it cannot compete with the one that does.

**No Pure Ink Rule.** Never `#000` or `#fff`. Neutrals are tinted toward the brand hue; borders
are burgundy at low alpha rather than gray.

## 3. Typography

**Display Font:** Cormorant Garamond (fallback Georgia, serif)
**Body Font:** Jost (fallback system-ui, sans-serif)

**Character:** A high-contrast old-style serif against a geometric grotesque. The serif carries
identity, money and order numbers; the sans carries everything a person has to read quickly.
The pairing works because their contrast is structural, not decorative: nothing is set in the
serif unless it is a name, a number, or a heading.

### Hierarchy

- **Display** (600, `clamp(1.45rem, 4vw, 3rem)`, line-height 1, tracking `0.02em`): order
  numbers, page titles, section mastheads. Uppercase on page titles, natural case on numbers.
- **Headline** (600, ~`1.55rem`, line-height 1.1): totals and card-level headings. Always
  `tabular-nums` when it carries a number.
- **Title** (500–600, `1rem`–`1.125rem`): dialog titles, block headings inside a card.
- **Body** (400, `0.875rem`, line-height 1.6): prose, item names, descriptions. Cap measure at
  65–75ch.
- **Label** (600, `0.7rem`, tracking `0.13em`, uppercase): buttons, status pills, the `TOTAL`
  marker, table headers. This is the system's most recognisable texture — use it sparingly, and
  never for a full sentence.

### Named Rules

**The Ledger Numeral Rule.** Every monetary amount uses `tabular-nums`, and every amount the
customer is committing to (totals, line totals) is set in the display serif. Amounts render
through `formatMoneyMinor`; money is integer minor units everywhere in code and never a float.

## 4. Elevation

Elevation is **ambient and tinted**, never structural. Nothing here uses a neutral drop shadow:
every shadow is `color-mix`ed with the burgundy accent so raised surfaces look like paper under
warm light rather than UI floating over a void. Shadows are wide, heavily offset upward with a
large negative spread, and low opacity.

- `shadow-brand-subtle` — `0 1px 0` accent at 4%. A hairline, used at rest on cards.
- `shadow-brand-lift` — `0 22px 40px -22px` accent at 45%. Hover and active list rows.
- `shadow-brand-elevated` — `0 30px 70px -34px` accent at 50%. Dialogs, popovers.
- `shadow-brand-panel` — `0 24px 60px -34px` accent at 40%. Sidebars, sticky summary panels.
- `shadow-brand-form` — the one foreground-tinted shadow, for forms that must sit forward.

Depth also comes from **tonal layering**: ash ground → parchment card → gold-tinted total band.
Prefer changing the surface over adding a shadow.

## 5. Components

**Sharp seals, soft vessels.** Anything you press is `2px`-cornered and uppercase; anything that
holds content is `16px`-cornered. That single opposition does most of the identity work.

- **Button (primary)**: gold fill, burgundy text, `2px` radius, uppercase label at `0.13em`
  tracking, hover lifts to Oro Claro, presses down 1px. The default for any committing action.
- **Button (outline)**: transparent with a burgundy border at 40%, for secondary navigation.
- **Button (destructive)**: red text on a 10% red tint, never a solid red fill.
- **Button (ghost)**: exists in the primitive, but is **not** used on order or account surfaces —
  actions there must be visibly pressable.
- **Card**: parchment, `16px` radius, burgundy border at 12%, `shadow-brand-subtle` at rest.
  Never nested inside another card.
- **Status pill**: fully rounded, label typography, tinted background. Colour follows the Single
  Amber Rule.
- **Total band**: a gold wash at ~6% with a burgundy top border, `TOTAL` set as an uppercase
  label on the left and the amount in display serif on the right. This is the visual full stop
  of any order surface.
- **Fulfillment rail**: a hairline track with gold fill and `size-7` nodes; the active node
  pulses. Shown only when an order has actually been paid for.
- **Item row**: a `56px` product image, name and unit maths stacked, line total right-aligned.
  Images resolve live against the catalog and fall back to the order's frozen snapshot name.
- **ActionButton**: the confirm-dialog wrapper. Every destructive or irreversible action routes
  through it rather than an inline two-step arm-and-confirm.

## 6. Do's and Don'ts

**Do**

- Put every irreversible action behind `ActionButton` so it opens an alert dialog, and give the
  dialog a specific title naming the object (`¿Cancelar ORD-8B66KY?`).
- Snapshot what a document meant at write time (order line names, prices) and resolve display
  extras (images, current names) live, falling back to the snapshot.
- Let colour carry exactly one meaning per surface, and give amber only to states needing action.
- Vary vertical rhythm between bands: masthead, content rows and the total band should not share
  the same padding.
- Use `Section` with `fillViewport` + `centerContent` for centred pages. Centring classes on the
  outer `<section>` will not centre content, because `Section` renders an inner container div.

**Don't**

- Don't use side-stripe accents: a coloured `border-left`/`border-right` or an absolutely
  positioned vertical bar on a card. Use full borders, tonal bands, or nothing.
- Don't use gradient text, glassmorphism as decoration, or hero-metric layouts.
- Don't use ghost buttons for real actions on order and account surfaces.
- Don't use em dashes in UI copy. Commas, colons and periods only.
- Don't show progress affordances for work that hasn't started (no fulfillment rail on an unpaid
  order).
- Don't fire a success toast immediately before navigating; the destination already confirms it,
  and the toast only flashes.
- Don't introduce neutral grays or untinted shadows. Both break the paper metaphor instantly.
