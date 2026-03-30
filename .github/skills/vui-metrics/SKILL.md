---
name: vui-metrics
description: "Render summary metrics using VUI Cards: equal-width tiles, tokenized surfaces, semantic labels and values, no custom shadow CSS."
---

# VUI Metrics Skill

## Pattern
- Metrics live inside a section Card.
- Layout uses Box with gap + flex children or Grid.

## Tile rules
- Use Card for each metric tile.
- Label: `T variant="caption" color="neutral.textSecondary" weight="medium"`
- Value: `Heading` appropriate size (often h2)
- Token surfaces: bg/borderColor via theme tokens, no hardcoded boxShadow.
