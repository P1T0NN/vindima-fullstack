# Email System — Design & Implementation Spec (Transactional Notifications)

> Spec for implementing transactional email across this template. Model: **one send seam,
> one template sandwich, one email per meaningful state change — and silence otherwise.**
> Every email fires from a named seam in an existing mutation or cron; no new state machines.
> Provider: [Resend](https://resend.com) (already a dependency — `sendVerificationOTP.ts` uses it).
> Backend: Convex. Money: integer minor units, formatted with the existing money helpers.
>
> **Implementer: read `src/convex/_generated/ai/guidelines.md` before writing any Convex code.**
> Read these first — they own the events this spec attaches to:
> `CheckoutPageSystemDesign.md` §3 + §7 (placement/settlement seams), `RewardSystem.md` §6 + §7
> (stamps, claims, expiry cron). The chrome already exists:
> `src/convex/emails/templates/emailHeader.ts` and `emailFooter.ts` (table-based, inline-styled,
> brand values from `COMPANY_DATA` + `EMAIL_CONFIG` in `src/shared/config.ts`).

---

## 1. Goals

1. **Notify on state changes the customer cannot see.** A customer watching the site doesn't
   need email; a customer who closed the tab does. Email exists to answer, asynchronously:
   *did my order go through, did my money move, where is my package, is something about to
   expire?* Every email in this spec maps to exactly one of those questions.
2. **One email per event, ever.** Settlement seams are idempotent (`markOrderPaid` is
   replay-safe); email sends must be too. A webhook replay or mutation retry must never
   produce a duplicate email (§7.3).
3. **Emails never block or break money paths.** Sends are scheduled (`ctx.scheduler.runAfter(0, …)`)
   from mutations, executed in an internal action. A Resend outage must not fail `placeOrder`
   or `markOrderPaid`. Email is a side effect, never a dependency.
4. **Universal.** No brand copy in the send machinery. All brand/contact/palette values come
   from `COMPANY_DATA` / `EMAIL_CONFIG`. Body copy lives one-file-per-email in
   `src/convex/emails/templates/`, so retargeting the template = rewriting copy files, not code.
5. **Readable by tired humans on phones.** Every email follows the copy contract in §5:
   the one fact the customer needs is in the subject, restated in the first line, and
   visible without scrolling. 600px, single column, one CTA maximum.

## 2. Non-Goals (deliberately excluded — YAGNI)

- **Marketing email / newsletters / campaigns.** Different consent regime (opt-in required),
  different tooling (audiences, unsubscribe links, analytics). Transactional only. If the
  project later wants marketing, that's Resend Audiences or a dedicated ESP — not this module.
- **Email preference center.** Transactional emails are exempt from unsubscribe requirements
  and customers expect them. With no marketing emails there is nothing to manage. Revisit
  only if genuinely optional emails (e.g. reward progress) are ever added.
- **Open/click tracking.** Vanity data for transactional mail; hurts deliverability
  (link rewriting) and privacy. Resend's dashboard delivery status is enough.
- **Localized emails (initially).** The site is es-default with an `/en` mirror, but neither
  orders nor users store a locale today. Emails ship **Spanish-only** (matching the existing
  OTP emails). Extension point: add `locale: v.string()` to the order at placement and thread
  it through `sendEmail` — flagged in §8, not built now.
- **React Email / MJML / template engines.** The sandwich is three template literals.
  A compile step for ~10 emails is bloat. The existing header/footer prove the pattern.
- **Digest/batching.** Every email here is triggered by one discrete event a customer wants
  to know about *now*. There is nothing to batch.
- **Abandoned-cart emails.** Marketing in a trench coat (requires consent, feels like
  surveillance for a food/wine store this size). Listed in §6 as *future/optional* only.

## 3. Architecture Overview

```
  mutation / cron (the event happens here, inside its transaction)
        │
        │  ctx.scheduler.runAfter(0, internal.emails.send.sendEmail, { kind, to, data })
        │  — fire-and-forget; the transaction commits regardless of email fate
        ▼
  internal action  src/convex/emails/send.ts
        │  1. FEATURES.EMAILS off? → return (log skip)
        │  2. look up template by `kind` → { subject, html, text }
        │     html = emailHeader() + body(data) + emailFooter()
        │  3. resend.emails.send({ from, to, subject, html, text })
        │  4. failure → console.error + rethrow (Convex retries actions; Resend
        │     idempotency key prevents doubles — §7.3)
        ▼
  Resend → customer inbox
```

**One seam.** Nothing else in the codebase imports Resend after this lands —
`sendVerificationOTP.ts` is refactored to call the same seam (§4.1). Adding an email =
adding one template file + one `scheduler.runAfter` line at the event's seam.

**The sandwich.** Every email is `emailHeader() + <body table> + emailFooter()`. The body
is a 600px single-column table on the `--card`-equivalent background (`#fbfaf7`), padding
`32px 24px`, `font-family: Arial, Helvetica, sans-serif`. Headings may use the Georgia serif
stack from the header for brand continuity. All styles inline; no `<style>` blocks
(Gmail strips them), no images for critical information, no CSS variables.

## 4. Email Inventory — When We Send

Ordered by implementation priority. **NOW** = the triggering seam already exists in the
codebase. **LATER** = the seam arrives with a future feature (Stripe, etc.). Each email's
full content spec is in §5.

### 4.1 NOW — Auth (refactor of existing)

| # | Email | Trigger seam | Recipient |
|---|-------|-------------|-----------|
| A1 | Sign-in code | better-auth OTP hook (`sendVerificationOTP.ts`), type `sign-in` | the address signing in |
| A2 | Verify your email | same hook, type `email-verification` | the address being verified |
| A3 | Reset your password | same hook, type `forget-password` | account email |
| A4 | Confirm new email | same hook, type `change-email` | the **new** address |

These already send as plain text. The work: route them through the §3 seam so they get the
branded sandwich + a proper text alternative. **Do not change their trigger logic** — better-auth
owns when they fire. Note: OTP emails are the one case where the send is *not* fire-and-forget
(the user is actively waiting); they keep their current synchronous await inside the auth flow.

### 4.2 NOW — Orders (the core of this spec)

| # | Email | Trigger seam | Recipient | Condition |
|---|-------|-------------|-----------|-----------|
| O1 | Order received | end of `placeOrder`, after the order doc is written | `order.email` | only when the order will stay `pending` (see collapse rule below) |
| O2 | Payment confirmed / receipt | inside `markOrderPaid`, guarded by its idempotency check | `order.email` | always on settlement |
| O3 | Order shipped | `setFulfillment` when new value = `shipped` | `order.email` | delivery orders only |
| O4 | Order ready for pickup | `setFulfillment` when new value = `shipped` on a **pickup** order (admin uses the same status; copy differs) | `order.email` | pickup orders only |
| O5 | Order cancelled (by you) | `cancelMyOrder`, after status flips | `order.email` | always |
| O6 | Order expired | `expirePendingOrders` cron, per cancelled order | `order.email` | always |
| O7 | Refund issued | `markOrderRefunded` / `refundOrder`, after status flips | `order.email` | always |

**The collapse rule (important):** with `CHECKOUT_CONFIG.SETTLE_ON_PLACE = true` (current
config), placement and settlement happen in the same breath — sending O1 *and* O2 would hit
the customer with two emails for one click. Rule: **O1 fires only if the order remains
`pending` after `placeOrder` returns.** When settlement is immediate, the customer gets only
O2 (the receipt), which contains everything O1 would have said. When Stripe lands
(`PAYMENT_PROVIDER: 'redirect'`), orders genuinely wait in `pending` and O1 earns its place.

**Deliberately no email:** `fulfillment = 'processing'` (noise — "we have your order" was
already said by O1/O2) and `fulfillment = 'delivered'` (the package's arrival is its own
notification; a "it was delivered" email is only useful with contested-delivery volume this
template doesn't assume).

### 4.3 NOW — Rewards

| # | Email | Trigger seam | Recipient | Condition |
|---|-------|-------------|-----------|-----------|
| R1 | Free item unlocked 🎉 | `grantStampForOrder`, only on the stamp that **completes a card** (stamps roll over to `availableRewards`) | account email | `FEATURES.REWARDS` |
| R2 | Rewards about to expire | new warn cron next to `expireInactiveCards`, at `EXPIRY.WARN_DAYS_BEFORE` before the inactivity cutoff | account email | only if the account has stamps > 0 **or** banked rewards > 0 |

**Deliberately no email:** per-stamp progress ("3 of 5!") — that's engagement spam; the card
lives in the account UI and on the O2 receipt (§5, O2 includes the stamp line). Also no email
on claim/redeem — the customer just did it themselves in the UI, and the resulting order
emails already reflect the free item as a line.

R2 needs a `warnedAt` timestamp on the reward account (or ledger entry) so the cron warns
**once per expiry window**, not daily for 30 days. Reset it whenever `lastActivityAt` bumps.

### 4.4 NOW — Store owner (internal notification)

| # | Email | Trigger seam | Recipient |
|---|-------|-------------|-----------|
| S1 | New paid order | same seam as O2 (`markOrderPaid`) | `COMPANY_DATA.EMAIL` |

A small store runs on this email. Same sandwich, terse body: order number, name, phone,
fulfillment type + address, line items, total, link to `/admin` orders. No prose.

### 4.5 LATER — seams that don't exist yet

| # | Email | Arrives with | Notes |
|---|-------|--------------|-------|
| L1 | Payment failed | Stripe adapter | webhook `payment_failed` → "your order is still reserved, retry here". Needs the pending order to survive (it does — 48h window). |
| L2 | Refund processed (provider) | Stripe adapter | today O7 covers manual refunds; Stripe refunds re-use O7's template with a "5–10 días hábiles" line. |
| L3 | Welcome / account created | if the project ever wants it | currently A2 (verify email) doubles as the welcome touch. A separate welcome email is redundant until there's onboarding content to put in it. |
| L4 | Back in stock / abandoned cart | never by default | consent-gated marketing. Requires explicit opt-in storage. Do not build into the template. |

## 5. Per-Email Content Specs (copy contract)

Universal rules first — every email obeys these; per-email specs only add specifics.

**Subject line:** ≤ 50 characters. Contains the one fact (order number, the word "código",
"enviado", etc.). Never "Update on your order". Never emoji in subjects except R1 (a reward
is genuinely celebratory). Never ALL CAPS, never "¡¡…!!" — spam filters and dignity.

**Preheader:** first ~80 chars of body text double as the inbox preview — the opening line
must complete the subject, not repeat it. (No hidden-preheader hack; the natural first
sentence does the job.)

**Structure (top to bottom, no exceptions):**
1. **H1 — the fact.** One line, ≤ 8 words, serif stack, `#1c1418`. The customer knows
   everything before reading further. Example: *"Tu pedido está en camino"*.
2. **One sentence of context.** Greeting folded in: *"Hola {name}, …"*. Use first name only;
   fall back to *"Hola"* if the name is empty. Never "Estimado/a cliente".
3. **The data block.** A bordered/tinted inner table with the specifics (order lines, code,
   address). This is the part people screenshot — it must stand alone.
4. **What happens next.** One or two sentences. Every email answers *"do I need to do
   anything?"* explicitly — usually "nada, nosotros te avisamos".
5. **One CTA button, if any.** Solid `EMAIL_CONFIG.ACCENT` background, white/`#f2f1ed` text,
   full URL as fallback text underneath (button rendering fails in some clients). Zero or
   one buttons per email — never two.
6. Footer (fixed, already built): tagline, contact, legal.

**Data formatting:** money via the shared minor-units formatter, always with currency
(`$450.00 MXN`); dates long-form Spanish (*"22 de julio de 2026"*), no ISO strings, no raw
timestamps; the order number (`ORD-XXXXXX`) always visually prominent (monospace or bold) —
it's what customers read over the phone.

**Tone:** tú-form Spanish (matches the site copy), warm but factual, zero exclamation marks
except R1 (one allowed). No "gracias por tu preferencia" boilerplate. The brand is a small
organic winery, not a bank and not an influencer.

---

### A1 — Sign-in code
- **Subject:** `Tu código: {otp}` — the code in the subject means zero-open sign-in from
  the notification shade. (Codes are short-lived; subject exposure is standard practice.)
- **H1:** the OTP itself, huge (32px, letter-spaced, monospace), centered in the data block.
- **Context:** *"Usa este código para iniciar sesión en {NAME}. Expira en {n} minutos."*
- **Next:** *"¿No fuiste tú? Ignora este correo — nadie puede entrar sin el código."*
- **CTA:** none. The code is the action.
- A2/A3/A4 are the same layout with the verb changed (*verificar tu correo / restablecer tu
  contraseña / confirmar tu nuevo correo*). A4 additionally states the change explicitly:
  *"Solicitaste cambiar tu correo a esta dirección."* — the safety-relevant fact.

### O1 — Order received (pending orders only)
- **Subject:** `Recibimos tu pedido {number}`
- **H1:** *"Recibimos tu pedido"*
- **Context:** *"Hola {name}, tu pedido **{number}** está reservado."*
- **Data block:** every line item (name, qty, line total), then the same breakdown the
  checkout showed — subtotal, each discount **as its own named line** (*"Oferta de
  bienvenida −$45.00"*, *"Recompensa: {item} gratis"*), shipping (or *"Gratis"* / *"Recoger
  en tienda — sin costo"*), **Total** bold. The email must match the checkout screen
  number-for-number — same one-honest-number principle as `CheckoutPageSystemDesign.md` §1.2.
- **Fulfillment sub-block:** delivery → the address as entered; pickup → store pickup line.
- **Next (this is O1's whole reason to exist):** manual provider → *"Pagas al
  {recibir/recoger} tu pedido. Te avisaremos cuando esté en camino/listo."* redirect
  provider → *"Completa tu pago para confirmarlo — tu pedido se reserva por
  {PENDING_EXPIRY_HOURS} horas."* + CTA button **"Completar pago"** → `paymentUrl`.
- **CTA:** only in the redirect case.

### O2 — Payment confirmed / receipt
- **Subject:** `Pedido confirmado {number}`
- **H1:** *"¡Listo! Tu pedido está confirmado"* (no exclamation in subject; one here is fine
  as the H1 — wait, rule says only R1. Use: *"Tu pedido está confirmado"*.)
- **Context:** *"Hola {name}, recibimos tu pago de **{total}**."* — the money fact up front.
- **Data block:** identical line-item + breakdown table as O1 (shared body-building helper —
  write the order-summary table **once**, both templates call it). Add paid-date line.
- **Rewards line (when `FEATURES.REWARDS` and the order earned a stamp):** one quiet line
  under the block: *"Este pedido suma 1 sello a tu tarjeta ({x} de {STAMPS_PER_REWARD})."*
  If the stamp completed a card, say *"…y completó tu tarjeta — tienes un artículo gratis
  esperándote"* and let R1 (arriving alongside) carry the celebration.
- **Next:** delivery → *"Te escribiremos cuando salga de la vinícola."* pickup → *"Te
  avisaremos cuando esté listo para recoger."*
- **CTA:** **"Ver mi pedido"** → order status page (account page for users; the public
  order-lookup URL for guests). This email is the customer's receipt — it must be complete
  enough to serve as proof of purchase on its own.

### O3 — Order shipped (delivery)
- **Subject:** `Tu pedido {number} está en camino`
- **H1:** *"Tu pedido está en camino"*
- **Data block:** destination address + compact item list (names + qty only — no prices;
  the receipt already exists, repetition dilutes).
- **Next:** *"Si algo se ofrece, escríbenos por WhatsApp."* (link, from `COMPANY_DATA`).
  No tracking number field until a carrier integration exists — do not fake one.
- **CTA:** none (nothing to click; WhatsApp link in body + footer covers contact).

### O4 — Ready for pickup
- **Subject:** `Listo para recoger: {number}`
- **H1:** *"Tu pedido está listo para recoger"*
- **Data block:** order number huge (staff will ask for it at the counter), item list
  (names + qty), and the pickup location/hours line (from config/copy — see §8 note on
  adding `PICKUP_INSTRUCTIONS` to `CHECKOUT_CONFIG` rather than hardcoding).
- **Next:** *"Menciona tu número de pedido al llegar."* + payment reminder when the order
  is still `pending` (pay-on-pickup model): *"Pagas al recoger — {total}."*
- **CTA:** none.

### O5 — Cancelled by customer
- **Subject:** `Pedido {number} cancelado`
- **H1:** *"Tu pedido fue cancelado"*
- **Context:** *"Hola {name}, confirmamos que cancelaste el pedido **{number}**."* —
  attribute the action to them explicitly (a cancellation email that doesn't say *who*
  cancelled reads as alarming).
- **Data block:** compact item list + total that was *not* charged. If a reward claim was
  released: *"Tu artículo gratis volvió a tu cuenta — úsalo cuando quieras."*
- **Next:** *"No se realizó ningún cargo."* (manual provider always true pre-settlement).
- **CTA:** **"Volver a la tienda"** → shop URL. Gentle, single.

### O6 — Expired
- Same skeleton as O5, but honest about the cause. **Subject:** `Tu pedido {number} expiró`.
  **Context:** *"Tu pedido quedó pendiente de pago por más de {PENDING_EXPIRY_HOURS} horas,
  así que lo liberamos."* Reward-claim release line same as O5. **Next:** *"Tus artículos
  siguen disponibles si aún los quieres."* **CTA:** "Volver a la tienda".

### O7 — Refund issued
- **Subject:** `Reembolso de tu pedido {number}`
- **H1:** *"Procesamos tu reembolso"*
- **Data block:** refunded amount bold, order number, date.
- **Next:** manual: *"Te contactaremos para coordinar la devolución."* (offline money moves
  offline). Stripe (L2, later): *"Verás el reembolso en tu método de pago en 5–10 días
  hábiles."*
- **CTA:** none. Money emails stay quiet and factual.

### R1 — Free item unlocked
- **Subject:** `🎉 Completaste tu tarjeta — tienes un regalo`
- **H1:** *"¡Ganaste un artículo gratis!"* (the one sanctioned exclamation mark)
- **Context:** *"Hola {name}, tu compra número {STAMPS_PER_REWARD} completó tu tarjeta de
  sellos."*
- **Data block:** a visual of the completed card is tempting — don't (images). Instead:
  *"{STAMPS_PER_REWARD} de {STAMPS_PER_REWARD} sellos ✓"* styled large, plus one line on
  what it's worth: *"Elige cualquier artículo elegible, gratis, en tu próximo pedido."*
- **Next (sets expectations, prevents support tickets):** *"Tu recompensa te espera en tu
  cuenta — se aplica sola al elegir tu artículo en el carrito."* If
  `EXPIRY.INACTIVITY_MONTHS` is set, one honest line: *"Se conserva mientras tu cuenta tenga
  actividad en los últimos {n} meses."*
- **CTA:** **"Elegir mi regalo"** → shop/rewards page.

### R2 — Rewards about to expire
- **Subject:** `Tus sellos expiran en {WARN_DAYS_BEFORE} días`
- **H1:** *"No pierdas tus recompensas"*
- **Context:** exactly what they'd lose: *"Tienes {stamps} sellos{ y {n} artículo(s) gratis}
  que expirarán el {date} por inactividad."* Specific numbers, specific date — vague urgency
  is marketing; specific facts are service.
- **Next:** *"Cualquier compra reinicia el contador y conserva todo tu progreso."* — the
  escape hatch is one purchase, say so plainly.
- **CTA:** **"Ir a la tienda"**. This is the most marketing-adjacent email in the system;
  it stays transactional because it's warning about a real, dated loss the customer opted
  into by joining. Send exactly once per window (the `warnedAt` guard, §4.3).

### S1 — New order (owner)
- **Subject:** `Nuevo pedido {number} — {total}`
- No greeting, no prose. Data block only: customer name + phone + email, fulfillment
  (address or *"pickup"*), line items with quantities, discounts applied, total, payment
  state. **CTA:** **"Abrir admin"** → `/admin` orders. Optimize for reading in 5 seconds
  behind a counter.

## 6. Copy & UX Rules (summary card for the implementer)

- Subject ≤ 50 chars, contains the fact, order number when relevant. Emoji: R1 only.
- H1 restates the fact in ≤ 8 words. First sentence completes (not repeats) the subject.
- Every email states explicitly whether the customer must do anything. Default: "nada".
- 0 or 1 CTA buttons. Full URL printed under every button.
- Order summary table is built by ONE shared helper used by O1/O2/S1 (and O5/O6 compact
  variant). Numbers must match the checkout screen exactly.
- Always send a `text` version alongside `html` — same content, plain lines. (Resend
  accepts both; text is the deliverability + accessibility floor.)
- `alt` on any future image; today there are none, keep it that way for critical info.
- tú-form Spanish, warm-factual, no boilerplate gratitude, no urgency theater.
- Never send an email the UI already answered in the same second (no claim-confirmation,
  no per-stamp progress, no `processing` status).

## 7. Technical Contract

### 7.1 File layout

```
src/convex/emails/
  send.ts                     — the ONLY Resend call site (internal action `sendEmail`)
  templates/
    emailHeader.ts            — exists
    emailFooter.ts            — exists
    orderSummaryTable.ts      — shared line-items + totals block (O1/O2/O5/O6/S1)
    authOtpEmail.ts           — A1–A4 (one file, `type` param — they're one layout)
    orderReceivedEmail.ts     — O1
    orderPaidEmail.ts         — O2
    orderShippedEmail.ts      — O3
    orderPickupReadyEmail.ts  — O4
    orderCancelledEmail.ts    — O5 + O6 (param: 'user' | 'expired')
    orderRefundedEmail.ts     — O7
    rewardUnlockedEmail.ts    — R1
    rewardExpiryWarningEmail.ts — R2
    newOrderOwnerEmail.ts     — S1
```

Each template exports one function returning `{ subject: string; html: string; text: string }`.
Template files contain copy + layout only — no Resend, no ctx, no db. Pure
`(data) => strings`, trivially previewable.

### 7.2 The send seam (`send.ts`)

- `internalAction` taking `{ kind, to, data }`; a `switch` on `kind` picks the template.
- Reads `RESEND_API_KEY` (throws if unset), sends via one `resend.emails.send` call with
  `from: \`${COMPANY_DATA.NAME} <${COMPANY_DATA.RESEND_EMAIL}>\``.
- Gated by `FEATURES.EMAILS` (add to `FEATURES` in `config.ts`, default `true`) — flipping
  it off no-ops every send with a console log; no migration, same pattern as other flags.
- **⚠️ `RESEND_EMAIL` is currently `onboarding@resend.dev`** — Resend's sandbox sender,
  which only delivers to the account owner's address. Before production: verify
  `COMPANY_DATA.DOMAIN` in Resend and change `RESEND_EMAIL` to e.g. `pedidos@vindima.mx`.
  The doc reader implementing this should surface that as a launch-blocker checklist item.

### 7.3 Idempotency & failure

- Mutations schedule sends with `ctx.scheduler.runAfter(0, …)`. Convex guarantees the
  scheduled call enqueues **iff the mutation transaction commits** — so a rolled-back
  `placeOrder` sends nothing, and a committed one schedules exactly once. This is the
  primary dedupe mechanism; no `emailSentAt` bookkeeping columns needed for O1/O2/O5–O7.
- `markOrderPaid` is idempotent by early-returning on already-paid orders — the schedule
  line goes **after** that guard, inside the first-transition branch only. Same rule for
  every seam: schedule only inside the branch that performs the transition.
- Pass a Resend idempotency key (`{kind}-{orderId}` or `{kind}-{accountId}-{window}`) so an
  action retry after a sent-but-crashed run can't double-send.
- Action failure after retries: log and drop. An undelivered email is a shrug; a blocked
  order is an incident. Never propagate email errors into money paths.
- R2's once-per-window guard is state (`warnedAt`), not scheduling — see §4.3.

### 7.4 What NOT to do

- No email-log table (Resend's dashboard is the log; an internal table is bookkeeping
  nobody reads — add only if a real audit requirement appears).
- No queue/retry framework beyond Convex's action retry + scheduler.
- No HTML template engine, no `juice`/inliner build step — styles are hand-inlined in the
  three-ish table patterns this spec defines.
- No per-user notification preferences (§2).
- No dummy/test sends via scripts — verify through the real flows (project rule: all writes
  via app UI).

## 8. Extension Points (documented, not built)

- **Locale:** store `locale` on the order at placement + on the user; templates take it as
  a param defaulting to `'es'`. Copy tables per language inside each template file.
- **Pickup instructions:** O4 needs address/hours copy — add `PICKUP_INSTRUCTIONS` (string)
  under `CHECKOUT_CONFIG.FULFILLMENT` when implementing, don't hardcode in the template.
- **Tracking numbers:** if a carrier integration lands, `setFulfillment` gains an optional
  `trackingUrl` → O3 gets its CTA button ("Rastrear mi pedido").
- **Stripe:** L1/L2 slot into the webhook handler exactly like O2 slots into `markOrderPaid`.
- **Logo image:** the header uses a text wordmark deliberately (webp doesn't render in
  Outlook). To upgrade: host a PNG at a public URL, swap the `<span>` for `<img>` with
  fixed width/height + alt text.

## 9. Implementation Order

1. `FEATURES.EMAILS` flag + `send.ts` seam + refactor `sendVerificationOTP.ts` through it
   (A1–A4 get the sandwich). Smallest end-to-end proof — OTP flows already fire in dev.
2. `orderSummaryTable.ts` + O2 (receipt) + S1 (owner copy) at the `markOrderPaid` seam.
   With `SETTLE_ON_PLACE = true` this makes every dev order send real email — the whole
   pipeline is exercised by existing flows.
3. O5/O6/O7 (cancel/expire/refund) — same summary helper, three small templates.
4. O3/O4 at `setFulfillment`.
5. O1 with the collapse rule (only meaningful once orders can stay pending — but the
   template and the `pending`-guard are cheap to land now, ready for Stripe).
6. R1 at the card-completion branch of `grantStampForOrder`; R2 warn cron + `warnedAt`.

## 10. Verification Checklist (must pass before calling it done)

- [ ] Place a paid order (settle-on-place): exactly **two** emails arrive — O2 to customer,
      S1 to owner. No O1.
- [ ] O2 totals match the checkout screen to the cent, including discount lines and shipping.
- [ ] Replay `markOrderPaid` on a paid order: **zero** additional emails.
- [ ] Cancel a pending order with a reward claim: O5 arrives and mentions the released claim.
- [ ] Let the expiry cron cancel a pending order: O6 arrives (force by lowering
      `PENDING_EXPIRY_HOURS` in dev config, not by writing to the DB).
- [ ] Complete a punch card (5th qualifying order): R1 arrives once; the 1st–4th stamps
      send nothing; O2 for that order carries the completion line.
- [ ] Refund a paid order: O7 arrives with the right amount.
- [ ] `FEATURES.EMAILS = false`: all flows run clean, zero sends, skips logged.
- [ ] Resend outage simulation (bad API key in dev): `placeOrder`/`markOrderPaid` still
      succeed; errors visible in Convex logs only.
- [ ] Every email renders correctly in Gmail (web + iOS) and Outlook — single column,
      header/footer intact, button clickable, plain-text part present.
- [ ] All copy is tú-form Spanish; subjects ≤ 50 chars; ≤ 1 CTA per email.
- [ ] Launch blocker: `RESEND_EMAIL` switched off `onboarding@resend.dev` to a
      domain-verified sender.
