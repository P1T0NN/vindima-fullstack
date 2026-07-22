# AGENTS.md

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

---

## Package Manager

This repository uses **Bun**.

For one-off CLIs, always use `bunx` instead of `npx`.

Examples:
```bash
bunx @sveltejs/mcp svelte-autofixer ...
bunx convex codegen
```

Never use `npx`.

---

# Svelte MCP Workflow

You have access to the Svelte MCP server with comprehensive Svelte 5 and SvelteKit documentation.

Always use the MCP tools systematically instead of relying on memory alone.

## Available MCP Tools

### 1. `list-sections`

Use this FIRST when working with Svelte or SvelteKit.

This returns available documentation sections with:
- titles
- use cases
- paths

You must analyze the returned sections and identify ALL potentially relevant documentation before proceeding.

Do not skip this step.

---

### 2. `get-documentation`

After using `list-sections`, fetch ALL documentation sections relevant to the task.

Prioritize:
- official patterns
- idiomatic Svelte 5 approaches
- SSR compatibility
- accessibility
- performance implications
- recommended architecture patterns

Never rely on assumptions when documentation is available.

---

### 3. `svelte-autofixer`

Whenever writing or modifying Svelte code:
1. Run the autofixer
2. Review all warnings and suggestions
3. Apply meaningful improvements
4. Repeat until no relevant issues remain

Always run with Bun:

```bash
bunx @sveltejs/mcp svelte-autofixer ./path/to/Component.svelte --svelte-version 5
```

Never use `npx`.

Do not finalize Svelte code before running the autofixer.

---

# Engineering Philosophy

This project is treated as a **universal template** and reusable long-term architecture foundation, not a one-off application.

Assume components, utilities, patterns, and modules will later be:
- copied into future projects
- extracted into shared libraries
- extended by other developers
- connected to different backends
- styled differently
- reused in unrelated domains

Optimize for:
1. Reusability
2. Maintainability
3. Developer experience (DX)
4. Architectural clarity
5. Performance
6. Simplicity
7. Short-term implementation speed

Never optimize for quick hacks that create future coupling.

---

# Architecture Standards

Before implementing code, evaluate:
- portability
- scalability
- composability
- separation of concerns
- backend independence
- API ergonomics
- future extensibility
- long-term maintainability

Prefer:
- composition over inheritance
- explicit APIs
- backend-agnostic abstractions
- dependency injection where appropriate
- low coupling
- high cohesion
- predictable state flow
- modular design
- reusable primitives

Avoid:
- project-specific assumptions
- hardcoded business logic
- tightly coupled components
- hidden dependencies
- singleton-heavy architecture
- app-specific naming
- deeply nested reactive chains

Business logic should remain separable from UI whenever practical.

---

# Convex Integration Rules

Do not tightly couple UI components to Convex.

Avoid embedding:
- Convex-specific assumptions
- database schema assumptions
- direct mutation/query logic in reusable UI
- app-specific backend logic
- hardcoded endpoints

Prefer:
- adapters
- composables
- injected data sources
- backend-independent interfaces

Components should remain usable even if Convex is later replaced.

---

# Svelte 5 Standards

Use idiomatic Svelte 5 patterns.

Prefer:
- runes where appropriate
- local reasoning
- explicit data flow
- SSR-friendly patterns
- progressive enhancement
- composable components
- minimal reactive complexity

Avoid:
- React-style architecture patterns
- unnecessary stores
- excessive derived state
- lifecycle misuse
- prop drilling caused by poor composition
- over-engineered abstractions
- unnecessary reactivity

Keep components understandable and easy to extend.

---

# DX Standards

Code should feel excellent to work with.

Prioritize:
- strong typing
- intuitive APIs
- self-documenting code
- low cognitive overhead
- clean naming
- minimal boilerplate
- safe defaults
- easy debugging
- consistent structure
- maintainable abstractions

Avoid cleverness that harms readability.

Prefer APIs that are understandable without documentation.

---

# Performance Standards

Default to production-grade performance patterns.

Prefer:
- minimal reactive cascades
- low hydration cost
- SSR when beneficial
- lazy loading where appropriate
- stable derived state
- efficient rendering
- scalable state management
- efficient large-list rendering
- minimal unnecessary client-side work

Avoid premature micro-optimization.

Prioritize architectural performance over trivial optimizations.

---

# Reusability Standards

Assume every exported component may become part of a shared internal library.

Therefore:
- keep dependencies minimal
- avoid hidden assumptions
- expose extensible APIs
- prefer configuration over hardcoding
- support composition
- design for portability
- avoid app-locked patterns

When reasonable, design components like reusable framework primitives rather than app-specific implementations.

---

# Mandatory Review Before Finalizing

Before finalizing any implementation, perform an internal review.

Evaluate:
- Is this reusable?
- Is this portable?
- Is this overly coupled to the current project?
- Is the abstraction level correct?
- Is the API ergonomic?
- Is this production-ready?
- Is accessibility handled properly?
- Is performance acceptable at scale?
- Is there unnecessary complexity?
- Is there unnecessary abstraction?
- Will this still make sense in 12 months?
- Could this be copied into another project cleanly?

If a significantly better architecture or implementation exists, refactor before finalizing.

Do not stop at “working”.

Aim for production-grade, reusable, maintainable code.

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `src/convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
