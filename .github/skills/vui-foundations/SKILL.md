---
name: vui-foundations
description: "Global rules for implementing React UI with Veracity VUI: system props, tokens, accessibility, repo-first patterns. Use as the base for any UI work."
---

# VUI Foundations (Base Rules)

## Source of truth
Use Veracity VUI docs index:
- https://ui.veracity.com/llms.txt

## Repo-first workflow (always)
Before implementing UI:
1) Search the repo for existing usage/patterns
2) Consult VUI docs index for the best matching component/pattern
3) Compose with VUI primitives (Box/Grid/Panel/Card)
4) Only then add minimal custom code (thin wrapper) if VUI has no match

## Styling rules
- Prefer VUI system props over custom CSS.
- Use `styled` from `@veracity/vui` only when system props cannot achieve the layout or styling (e.g., animations, pseudo selectors, complex CSS).
- Avoid inline styles and new CSS files unless absolutely necessary.
- Never hardcode colors; use theme tokens.

## Accessibility rules
- Keyboard-first interactions.
- Proper semantics: Heading hierarchy, labels for inputs, accessible names for icon-only buttons.
- Overlay behavior must follow VUI patterns (focus, dismissal).

## Code quality
- KISS / SRP / DRY.
- Extract subcomponents when JSX repeats or section has its own logic.
