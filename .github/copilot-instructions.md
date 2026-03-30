# AIS UI Implementation Rules — Veracity VUI-first

You are an AI coding assistant working in this repository. When implementing UI (React), follow these rules **strictly**.

## Single source of truth (always consult)
- Use Veracity **VUI** as the UI system and component catalog.
- Before choosing components, consult: https://ui.veracity.com/llms.txt
- Prefer existing VUI components and documented VUI patterns over custom implementations.
- Do not duplicate VUI components under new names unless adding real behavior.

VUI is a React component system with theming + system props, accessible overlays/navigation, and flex-first layout primitives (Box defaults to horizontal flex; use `column` for vertical).

---

## Implementation workflow (follow these steps)
### Step 1 — Understand the UI surface
Classify the task:
- page / wizard step
- section surface (Card)
- form
- navigation (Tabs, side menu)
- overlay (Dialog/Modal/Drawer/Popover)
- feedback (loading/empty/error/success)
- data display (Table/List/Definition)

### Step 2 — Search the solution first
- Search the repo for similar implementations (same component, same wizard step patterns).
- Reuse existing local patterns (foldering, naming, spacing, Card layout).
- Do not introduce a competing style if a pattern already exists.

### Step 3 — Consult VUI catalog
- Use the VUI docs index (llms.txt) to pick the closest ready component.
- Prefer composition using: `Box`, `Grid`, `Card`, `Panel`.

### Step 4 — Compose using VUI primitives
- Start with layout primitives: `Box`, `Grid`, `Panel`, `Card`.
- Use system props for spacing/layout (gap, p, m, w, maxW, alignItems, justifyContent, etc.).
- Use semantic typography: `Heading`, `P`, `T`, `Prose`.

### Step 5 — Apply department conventions
- **Tabbed pages**: each tab’s content must be grouped into **shadowed Card sections** (one topic per Card).
- Use consistent spacing rhythm and heading hierarchy.
- Prefer `Divider` or spacing via system props (avoid random `<hr>` and ad-hoc borders).

### Step 6 — Add states (when applicable)
Include relevant states using VUI:
- loading: `Skeleton` (preferred) or `Spinner`
- empty state: clear message + action when relevant
- error: `Message` (inline) or `Notification` (page-level)
- success confirmation: `Toast` / status message

### Step 7 — Validate accessibility
- Keyboard accessible interactions.
- Proper semantics: headings, labels, roles.
- Icon-only buttons must have accessible names.
- Overlays must handle focus + dismissal correctly.

### Step 8 — Final check
Before finishing:
- VUI components used, not custom lookalikes
- system props + tokens used (not CSS/inline styles)
- clean component boundaries and types
- code compiles and matches repo conventions

---

## VUI-first component selection (no “DIY UI”)
When you need UI building blocks:
- **Layout**: `Box`, `Grid`, `Panel`, `Card`, `Divider`
- **Text/Semantics**: `Heading`, `P`, `T`, `Prose`, `Display`
- **Actions**: `Button`, `ButtonGroup`, `ButtonToggleGroup`, `Link`
- **Forms**: `Label`, `Input`, `Select`, `Checkbox`, `Radio`, `Switch`, `Textarea`, `DatePicker`
- **Feedback**: `Message`, `Notification`, `Toast`, `Progress`, `Spinner`, `Skeleton`
- **Overlays**: `Dialog`, `Modal`, `Drawer`, `Popover`, `Tooltip`
- **Navigation**: `Tabs`, `Breadcrumbs`, `Sidemenu/SidemenuV2`, `Pagination`
- **Data**: `Table`, `List`, `Definition`, `Tag`, `Badge`

If a needed component isn’t in VUI:
- implement the smallest possible wrapper using VUI primitives + tokens
- document why it exists and where it should be used

---

## Styling rules (system props > CSS)
- Prefer VUI **system props** for spacing, layout, alignment, sizing.
- Avoid custom CSS, `styled-components`, and inline `style={{...}}` unless absolutely necessary.
- Never hardcode colors; use VUI tokens / theme values (avoid hex unless no token exists).
- Avoid custom shadows/boxShadow. Use VUI surface/elevation/tokens/patterns instead.
- Avoid deprecated alias props if canonical props exist; only keep aliases when editing legacy code in-file.

---

## Accessibility & interaction rules (always)
- All interactive elements must be keyboard accessible.
- Use semantic components (`Heading`, `Label`, `Button`, `Link`) properly.
- Inputs must have labels; validation should use VUI feedback components (`Message`, etc.).
- Overlays (Dialog/Modal/Drawer/Popover): focus managed correctly, ESC dismiss where appropriate, restore focus on close.
- Provide `alt` text for images (`Image`) and accessible names for icon-only buttons.

---

## Code quality & architecture (KISS, DRY, SRP)
### Prefer composition + small files
- Do not implement an entire screen in a single massive component file.
- Split UI into logical pieces: `Page` → `Section` → `CardSection` → `Form/Widget`.
- Keep each component focused (Single Responsibility).

### When to extract a subcomponent (use these thresholds)
Extract when ANY is true:
- JSX exceeds ~80–120 lines for a section
- section has its own state/effects/handlers
- pattern repeats (metric tiles, status banners, input blocks, empty state)
- same VUI composition appears 2+ times
- component has 3+ states (loading/empty/error/success) and becomes hard to scan

### Shared/common components rule
You may create common components ONLY when:
- they are thin wrappers around VUI primitives + tokens
- they do not introduce a new “design system”
- they have a narrow purpose (e.g., `SectionCard`, `MetricTile`, `StatusBanner`)
- they expose a small typed API (TypeScript props)
- they don’t try to be “one component for all cases”

Anti-patterns:
- God components (everything in one file)
- Over-configurable “framework” components
- Rebranding VUI (`AppButton`, `CustomCard`, `Container`) without real behavior
- Styling via `className`/inline `style` for appearance (except unavoidable or test hooks)

---

## Repository structure & placement (mandatory)
### Wizard step tabs
Each wizard step lives in its own **kebab-case** folder under `src/components/wizard/`, suffixed with `-tab`:
- `src/components/wizard/<step-name>-tab/`

Examples:
- `src/components/wizard/data-ingest-operations-tab/`
- `src/components/wizard/schema-tab/` (future)
- `src/components/wizard/summary-tab/` (future)

The main page component keeps its **PascalCase** name inside the folder:
- `src/components/wizard/data-ingest-operations-tab/DataIngestOperations.tsx`

### Step-specific sections
Extract page sections (card groups, form areas, preview panels) into a `sections/` subfolder:
- `src/components/wizard/<step-name>-tab/sections/`

Each section is a focused sub-component of that step. Name sections by what they represent:
- `ReadyForIngestionCard.tsx` — the ingestion form / status card
- `DataPreviewSection.tsx` — raw mapped data preview (future)
- `ValidationResultsSection.tsx` — schema validation results (future)

### When to extract a section
Extract into `sections/` when ANY is true:
- it manages its own visual states (loading/empty/error/success)
- the same Card/panel pattern would repeat
- it has a clear single responsibility (form, preview, results)

### Simple wizard pages
Pages that are small enough to stay in a single file (no sections needed) can remain flat:
- `src/components/wizard/Schema.tsx`
- `src/components/wizard/Summary.tsx`

When they grow, promote them to a `-tab/` folder following the same pattern.

### Shared UI components
Reusable UI belongs in:
- `src/components/common/`
  - `forms/` reusable form sections/controls
  - `layout/` headers/footers/wrappers
  - `session/` auth/session UI
  - `toaster/` toast infra (already exists)

### API / services
- network and backend interactions belong in `src/api/` and/or `src/services/`
- UI components should not implement raw API calls if a service abstraction exists

### Types, constants, context
- shared types → `src/types/`
- reusable constants → `src/constants/`
- contexts → `src/context/`

---

## VUI layout decision tree (use this to choose primitives)
- Need a horizontal/vertical stack → `Box` (`column` for vertical)
- Need 2D layout (rows + columns) → `Grid`
- Need a section surface → `Card` (default) or `Panel` (neutral container)
- Need separators between blocks → `Divider`
- Need sibling views → `Tabs`
- Need overlay → `Dialog`/`Modal`/`Drawer`/`Popover`/`Tooltip`
- Need feedback → `Message`/`Notification`/`Toast`/`Skeleton`/`Spinner`

---

## Output expectations
When asked to implement UI:
- Choose the closest VUI component(s) from the catalog.
- Compose using `Box/Grid/Panel/Card` first; keep markup minimal.
- Use clean boundaries (Page/Section/Form) and extract subcomponents when needed.
- Include loading/empty/error states when relevant.
- Provide TypeScript types for props and state where applicable.
- Ensure code compiles and follows lint + existing patterns.