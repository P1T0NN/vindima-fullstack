# CLAUDE.md

## Universal Template

This repository is a **universal project template**. It is cloned or copied to bootstrap many different applications — not a single client- or product-specific codebase.

**Default rule:** All generated code must be **universal and portable**, not tailored to one product, brand, or domain **unless the user explicitly asks for project-specific behavior**.

Unless instructed otherwise, avoid:
- Client, brand, or product names in code, comments, copy, or identifiers
- Hardcoded business rules tied to one use case or vertical
- App-specific routes, feature flags, or env values baked into shared or reusable modules
- Domain-specific assumptions in primitives, utilities, or layout foundations

Prefer instead:
- Neutral naming, configurable defaults, and clear extension points
- Product-specific values in env, config, or clearly scoped app layers — not in shared code
- Designs that fork cleanly into unrelated projects with minimal surgery

When the user states something is **for this project only**, or names a specific client, brand, or product, apply those choices only in the appropriate scoped layer — not in universal template code.

For full engineering standards (Svelte, Convex, architecture, DX), see `AGENTS.md`.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `src/convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
