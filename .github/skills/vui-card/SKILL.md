---
name: vui-card
description: "Use Veracity VUI Card for section surfaces and nested cards (metrics). Enforce department patterns: section header + CTA, tokenized borders, responsive padding, and Cards for tab sections."
---

# VUI Card Skill (Department Standard)

## Source of truth
Consult VUI docs index for Card/Layout guidance:
- https://ui.veracity.com/llms.txt

## 1) Section Card (outer card) — default pattern
Use Card as the primary surface for a page section.

**Default props (typical):**
- w={1}
- maxW={960} (or repo standard content width)
- p={{ xs: 3, md: 4 }}
- column
- gap={3}
- optional mb for vertical rhythm (e.g. mb={3.5})

Use numeric system props where possible to stay aligned with the VUI spacing scale.

## 2) Section header layout inside Card
First child is a layout row:

- Left: a stacked title block (Heading + supporting T lines), using  
  `Box column gap={1}`
- Right: a single primary CTA Button (commonly variant `"tertiaryDark"` in this repo)

Prefer `Box` layout primitives and `gap` rather than custom CSS.

## 3) Nested Cards (metrics / mini-surfaces)
For metric grids/rows:

Map metrics to nested `Card` items.

Typical nested card props:

- flex={1} for equal width tiles
- p={3}
- column
- gap={2}
- bg="neutral.surface"

Avoid custom:

- `style={{ boxShadow: ... }}`
- `className` (unless required for tests or legacy integration)

If elevation is needed, prefer VUI token/elevation patterns rather than custom CSS.

## 4) Tabs convention
Inside each Tabs panel:

- split content into multiple section Cards
- one topic per Card
- avoid creating a single large card for the entire tab

## 5) Don’ts
- Don’t re-implement Card surfaces using `div` + CSS.
- Don’t hardcode colors or shadows.
- Don’t add `display="flex"` to `Box` unless necessary — VUI `Box` is flex-first (use `column` to switch orientation).
