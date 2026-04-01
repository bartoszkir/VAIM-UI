# AIS UI Implementation Rules — Veracity VUI-first

You are an AI coding assistant working in this repository. When implementing UI (React), follow these rules **strictly**.

## Single source of truth (always consult)

- Use Veracity **VUI** as the UI system and component catalog.
- Before choosing components, consult: https://ui.veracity.com/llms.txt
- Prefer existing VUI components and documented VUI patterns over custom implementations.
- Do not duplicate VUI components under new names unless adding real behavior.
- Reuse existing app patterns from `src/pages/*`, `src/layouts/*`, and `src/shared/components/*` before creating new abstractions.

VUI is a React component system with theming + system props, accessible overlays/navigation, and flex-first layout primitives (`Box` defaults to horizontal flex; use `column` for vertical).

---

## Current app architecture (mandatory)

This project is an artifact library UI, not a wizard UI.

- Top-level routes live in `src/Router.tsx`.
- Main pages live in `src/pages/*`.
- Shell layout lives in `src/layouts/*`.
- Shared artifact primitives live in `src/shared/components/` (for example: `ArtifactPageHeader`, `ArtifactSearchFiltersCard`, `ArtifactCard`, `UploadArtifactModal`).
- Domain/shared types live in `src/shared/types/`.
- App-level providers live in `src/App.tsx` (Router, query client, auth, VUI, links provider, toaster).

Do not introduce `src/components/wizard/*` conventions unless the codebase explicitly adds a wizard feature.

---

## Implementation workflow (follow these steps)

### Step 1 — Understand the UI surface

Classify the task:

- routed page (`src/pages/...`)
- shared reusable UI (`src/shared/components/...`)
- shell/navigation (`src/layouts/...`)
- overlay/modal/form flow
- feedback states (loading/empty/error/success)

### Step 2 — Search the solution first

- Find and mirror existing artifact page patterns (header + filters card + grid + modal).
- Reuse existing local directories structure, naming, spacing, and composition.
- Avoid introducing a competing style if a pattern already exists.

### Step 3 — Compose with VUI primitives

- Start with `Box`, `Grid`, `Card`, and semantic text components.
- Use system props for spacing/layout (`gap`, `p`, `m`, `w`, `maxW`, `alignItems`, `justifyContent`, etc.).
- Prefer tokenized colors and semantic props.

### Step 4 — Add states and accessibility

- Include relevant states when applicable:
  - loading: `Skeleton` (preferred) or `Spinner`
  - empty: clear message + action when relevant
  - error: `Message` or `Notification`
  - success: `Toast`/status confirmation
- Ensure labels, heading hierarchy, focus management, and keyboard accessibility.

### Step 5 — Final check

- VUI components used (no custom lookalikes)
- system props + tokens used (avoid ad-hoc CSS)
- component boundaries are clear
- code compiles and matches repo conventions

---

## VUI usage decisions already made in this repo

- Use `Heading as="h1|h2|h3"` (not `level`).
- Do not use `P muted`; use tokenized color props such as `color="neutral.textSecondary"`.
- Do not add `Modal size` unless verified in local theme typings.
- `Tag` variants `subtleBlue` and `subtleGrey` are valid and preferred for artifact metadata.

---

## Styling rules (system props > CSS)

- Prefer VUI system props for spacing, layout, alignment, and sizing.
- Avoid custom CSS and inline style objects unless necessary for behavior that system props cannot express.
- Never hardcode colors when a VUI token exists.
- Avoid custom shadows; use VUI surfaces/tokens/patterns.
- Preserve existing style approach in edited files.

---

## Component architecture rules (KISS, DRY, SRP)

- Keep page files focused on composition and page-level state.
- Keep shared components narrow and typed; avoid over-configurable “framework components”.
- Extract a subcomponent when any is true:
  - a section grows beyond ~100 lines of JSX
  - a section owns its own state/effects/handlers
  - the same VUI composition repeats 2+ times
  - multiple UI states make scanning difficult

Anti-patterns:

- giant all-in-one page components
- rebranding VUI with wrappers that add no behavior
- styling primarily via className/inline style for appearance

---

## Repository structure & placement (mandatory)

Use these placement rules for new code:

- Route pages: `src/pages/<domain>/<DomainPage>.tsx`
- Domain-local code (when specific to one page/domain) should live under: `src/pages/<domain>/<components|types|layouts|hooks|utils>/`
- Prefer domain-local placement first, then promote to shared folders only when reused across domains.
- Shared UI for artifact experiences: `src/shared/components/`
- Shared types for artifact domain: `src/shared/types/`
- Layout and app shell: `src/layouts/`
- Auth/session logic: `src/auth/`
- API/query client and networking: `src/api/`

If a page-specific component is used only once, keep it in its domain folder under `src/pages/<domain>/...`. Promote to `src/shared/components/` or `src/shared/types/` only when reused.

---

## VUI component selection map

- Layout: `Box`, `Grid`, `Card`, `Panel`
- Text/Semantics: `Heading`, `P`, `T`
- Actions: `Button`, `Link`
- Forms: `Label`, `Input`, `Select`, `Checkbox`, `Radio`, `Switch`, `Textarea`
- Feedback: `Message`, `Notification`, `Toast`, `Spinner`, `Skeleton`
- Overlays: `Modal`, `Dialog`, `Drawer`, `Popover`, `Tooltip`
- Navigation: `Sidemenu`, `Breadcrumbs`, `Tabs`, `Pagination`
- Metadata/data display: `Tag`, `Badge`, `Table`, `List`, `Definition`

---

## Output expectations

When implementing UI in this repo:

- use existing artifact-page composition patterns first
- use VUI primitives and tokenized system props
- preserve accessibility and keyboard behavior
- provide TypeScript types for component props/state where applicable
- ensure lint/type-check compatibility with existing files
