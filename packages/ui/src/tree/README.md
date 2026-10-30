# Tree implementation

The public contract lives in [the Chinese API](./index.zh-CN.md), [the English API](./index.en-US.md), exported types and behavior tests. Current architecture state comes from `registry/vue-native-audit.json`.

Tree owns controlled models through `useControlledValue`. Computed projections consume the current data and configuration; accepted model values remain separate from ancestors, checked descendants and half checks. DirectoryTree owns its selection policy and uses the same accepted-value boundary while forwarding Tree events.

TreeNode reads title/icon slots during rendering. Slots receive `{ node, data }`, take priority when present and preserve intentionally empty output. Top-level content functions use slots; per-data-item title/icon functions and business predicates keep their separate responsibilities.

NodeList owns virtual scrolling, the actual focus host, indent measurement and expansion motion. Empty motion ranges finish immediately. Tree refs delegate to this owner. Expansion requested by scrollTo resolves ancestors before the list scrolls.

Loads are deduplicated by key and source-node identity. Stale results are ignored; completing a controlled request does not cause polling when the parent refuses loadedKeys. Failure is reported and a later expansion can retry. Drag timers, global listeners and list timers are released on teardown.

The four files under `_internal/tree` provide entity lookup, traversal, field mapping and check conduction shared with Table and TreeSelect. Entity tables retain own prototype-named keys safely. Record key semantics are unchanged: numeric and string representations of the same key must not coexist.

`use-tree-theme.ts` projects current source aliases and all nine component tokens. Without an active source, the static component variables inherit the current CSS aliases. Native root style keeps precedence. The drop indicator obtains its color and height from static CSS and uses logical geometry.

[The dated read-only inventory](../../../../docs/audit/2026-10-29-tree-readonly-inventory.md) and [the historical implementation plan](./PLAN.md) retain their original evidence. Their upstream comparisons and former gates do not define the current Apollo contract or current verification status.
