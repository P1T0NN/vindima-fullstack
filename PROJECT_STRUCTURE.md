# Customer Experience Map

How a shopper experiences the store, written from **their** side of the screen.
The whole goal: a first-time visitor should never have to *think*. Every screen
answers one question, the next step is always obvious, and nothing is on screen
that doesn't help them buy.

Rule of thumb: **one screen, one job.** If a customer has to ask "what am I
looking at" or "where do I click next," the screen failed.

---

## What's always on screen

These two things follow the customer everywhere, so they never feel lost.

### Top bar (header)
- **Logo** (left) — always goes home. The universal "get me out of here" button.
- **Search** (center) — start typing, results appear. The fastest path to a
  product, especially on a big catalog.
- **Cart** (right) — a little counter showing how many items. Click it and the
  cart slides in *over* the page; they never lose where they were.
- **Account** (right) — "Sign in" if they're a guest, their avatar if logged in.

That's it. Four things. No mega-menus, no clutter. Categories live in a simple
menu under the logo (or a slide-out on mobile).

### Bottom bar (footer)
The quiet stuff people *look for when they want it*: shipping & returns, contact,
FAQ, social, newsletter signup. Never demands attention, always there.

A thin **announcement bar** can sit above the header for one message only
("Free shipping over $50") — and it's dismissible.

---

## The journey: how they get from "just looking" to "bought it"

Each step is one screen with one job. Arrows are the obvious next click.

```
Home  →  Browse  →  Product  →  Cart  →  Checkout  →  "Thank you"
 │         │           │         (slides in)
 └─ Search ┘           └─ keep shopping ↩
```

### 1. Home
First impression. Shows: a hero (what this store is in 2 seconds), a few
featured products, and the main categories. **One clear path in** — don't make
them choose between ten things. They came to look; show them something to look
at.

### 2. Browse (a category or all products)
A clean grid of products: photo, name, price. Above it, simple **filters**
(size, color, price) and a **sort** (newest, price). Filters update the grid
instantly — no "apply" button, no page reload. On mobile, filters tuck into a
slide-up panel so the products stay the star.

The URL quietly remembers their filters, so a shared link shows the same view
and the back button always works the way they expect.

### 3. Search results
Same clean grid, just for what they typed. If nothing matches, we say so kindly
and suggest popular items instead of a dead end.

### 4. Product page
The single most important screen. Everything needed to decide, nothing else:
- **Big photos** they can swipe/zoom.
- **Name, price, short description.**
- **Pick options** (size, color) — clearly, with what's out of stock greyed out.
- **One big "Add to cart" button.** Impossible to miss.
- Below the fold: details, shipping info, reviews. There if they want it, out of
  the way if they don't.

Adding to cart shows a tiny confirmation and the cart counter ticks up — but it
**doesn't yank them away.** They can keep shopping or open the cart. Their call.

### 5. Cart (slides in from the side)
A panel, not a new page. Shows what they picked, lets them change quantity or
remove, shows the running total, and has one button: **Checkout.** They can
close it and keep browsing without losing anything. (There's also a full cart
page for when someone shares a link or wants the big view.)

### 6. Checkout
The make-or-break screen, so we strip it bare: **no header menu, no footer
links** — just the logo, a secure badge, and the form. One page, top to bottom:
- Email → Shipping address → Delivery option → Payment → a clear **order summary**
  on the side the whole time.
- **Guests check out without an account.** We never force a signup — that's the
  #1 reason carts get abandoned. We *offer* to save their info at the end.
- One final **"Place order"** button. They always know the total before they tap.

### 7. Thank-you / order confirmation
Reassurance. "Your order's in, here's your number, here's what happens next,
check your email." Calm, friendly, done. This is where we *invite* (not force) a
guest to create an account — "want to track this? set a password."

---

## When a customer signs in

Signing in is **never required to shop or buy.** It only unlocks "my stuff."
And signing in doesn't dump them on some dashboard — it just lights up the
account menu and sends them back to whatever they were doing.

Behind the account menu, a short list — **not a control panel**:

| What they see | What it's for |
|---------------|---------------|
| **My orders** | "Where's my stuff?" — status, tracking, reorder, return. *This is the main reason anyone logs in.* It's the first thing they land on. |
| **Addresses** | Saved so checkout is faster next time. |
| **Profile** | Name, email, password. |
| **Wishlist** | Things they want but didn't buy yet. *(optional)* |

No charts, no stats, no "dashboard." A shopper isn't managing a business — they
just want to find their order. So that's what we put first.

---

## Sign in / create account / forgot password

Plain, centered card on an otherwise empty page — no shop clutter to distract.
Big email + password fields, social login if we offer it, and clear links
between "sign in," "create account," and "forgot password." Three fields, one
button, done.

---

## The overlays (things that appear *over* the page, not as new screens)

These keep customers in flow — they pop up, do their job, and dismiss, so the
customer never loses their place:

- **Cart** — slides in from the side.
- **Search** — drops down / expands from the top.
- **Mobile menu** — slides in for categories.
- **Quick look** — peek at a product from the grid without leaving it.
- **Photo zoom** — tap a product image to enlarge.
- **Size guide** — a small reference popup on the product page.
- **Toasts** — little "added to cart" / "saved" confirmations, bottom corner.
- **Cookie / promo banners** — quiet, dismissible, one-time.

---

## The promises baked into all of it

What every screen is held to, so the experience stays effortless:

1. **You can always leave.** Logo goes home, cart closes, back button works.
2. **You never lose your place.** Cart and search are overlays; filters live in
   the URL. Nothing resets on you.
3. **You don't sign up to buy.** Account is a perk, not a toll booth.
4. **You always know the price before you commit.** No surprise totals at the end.
5. **One screen asks one thing.** Browse, decide, pay — never all at once.
6. **The next step is always the biggest, most obvious button.**

---

*(The owner/admin side — how the store gets managed behind the scenes — is a
separate map. This document is only what customers see.)*
