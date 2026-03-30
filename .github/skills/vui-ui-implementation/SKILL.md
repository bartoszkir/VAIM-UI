---
name: vui-ui-implementation
description: Global rules for implementing React UI using Veracity VUI. Prefer VUI components + system props, accessible patterns, and department conventions (Cards per tab sections).
---

# VUI UI Implementation (Umbrella)

## Source of truth (always consult)
Use Veracity VUI docs index as the live catalog:
- https://ui.veracity.com/llms.txt

Rule: pick ready components from VUI first. Only build custom UI as a thin wrapper around VUI primitives when VUI has no component for the job.

## Workflow (always)
1. Search the repo for existing usage/patterns
2. Consult the VUI docs index for the best matching component/pattern
3. Compose with VUI primitives: Box, Grid, Card, Panel
4. Only then create minimal custom UI

## Department conventions (always)
- For pages with Tabs: each tab’s main content is grouped into **shadowed Card sections** (one topic per Card).
- Maintain consistent spacing rhythm and semantic headings.

## Styling rules (system props + tokens)
- Use VUI system props for spacing/layout/alignment/sizing.
- Avoid `style={{...}}`, new CSS files, or styled-components unless unavoidable.
- Don’t hardcode colors (including hex); use VUI tokens / theme config.
- Avoid custom shadows/boxShadow unless VUI provides no option.

## Accessibility rules (non-negotiable)
- Keyboard accessible interactions.
- Proper semantics: Heading hierarchy, labels for inputs, accessible names for icon-only buttons.
- Overlays must follow VUI focus/dismiss patterns.

## Code quality
- KISS / SRP / DRY.
- Extract subcomponents when sections have their own logic or JSX repeats.

## Skill routing (prefer smaller skills when relevant)
If the task focuses on a specific area, apply the corresponding skill:
- Card surfaces / section layout → `vui-card`
- Buttons / action hierarchy → `vui-buttons`
- Tabs pages → `vui-tabs`
- Forms / validation → `vui-forms`
- Dialog/Modal/Drawer/Popover → `vui-overlays`
- Loading/empty/error messaging → `vui-feedback`