---
title: TreeSelect
titleTemplate: '%s - @apollo-design/ui'
description: Tree-like selection in a dropdown popup for hierarchical data.
---

# TreeSelect

Select hierarchical data (departments, regions, categories) from a dropdown tree, with single/multiple select, checkable cascade, search filtering, async loading and virtual scrolling.

See `index.zh-CN.md` for the full API tables (40+ props, emits, slots, SHOW_* statics). Key notes:

- **key === value**: the node's `value` field doubles as the tree key (fillFieldNames);
- check cascade (conductCheck) is computed **at the TreeSelect layer** — the embedded tree is always `checkStrictly: true`;
- `treeCheckStrictly` forces labelInValue shape (with `halfChecked`);
- `maxCount` is ignored with `SHOW_ALL` (when not strictly) or `SHOW_PARENT` (antd shell behavior);
- `listItemHeight` defaults to 28 (controlHeightSM + paddingXXS), not rc's 20;
- deprecated props of antd (`dropdownClassName`, `dropdownRender`, `bordered`, `showArrow`, ...) are merged into their new counterparts;
- `<TreeSelectTreeNode>` children form is **not implemented** (deprecated in v6, same as Tree).
