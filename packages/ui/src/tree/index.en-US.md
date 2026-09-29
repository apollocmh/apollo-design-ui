---
title: Tree
titleTemplate: '%s - @apollo-design/ui'
description: Hierarchical data display with selection, check, async load, drag and virtual scroll.
---

# Tree

Display hierarchical data (folders, org charts) with expand, select, check, async loading, drag-and-drop and virtual scrolling. Use `DirectoryTree` for folder structures.

See `index.zh-CN.md` for the full API tables (TreeProps 9 groups, TreeEmits 21 events, slots, TreeRef, 9 Component Tokens). Key notes:

- `<TreeNode>` children form is deprecated in v6 and **not implemented** — use `treeData`;
- four controlled keys emit `update:*` **together with** semantic events (expand/check/select/load);
- `defaultExpandAll` on `Tree` only expands nodes **with children**; on `DirectoryTree` it expands **all** entity keys (rc semantics);
- keyboard: ↑↓ / Home / End / ←→ / Enter / Space (check ⇒ toggle, else select).
