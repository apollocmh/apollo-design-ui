# Collapse implementation

Current contracts are the bilingual API pages and behavior/type/browser tests. The historical PLAN and upstream snapshots are dated evidence.

Collapse owns accepted state, current Provider configuration and theme projection. Real CollapsePanel components consume that scope through Vue provide/inject. The items path renders the same Panel component as the default slot; no VNode descriptor parsing or synthetic lifecycle exists.

Each Panel owns a native heading/button, a separate extra region and a stable body region. CSSMotion controls the structural region while Panel controls body content lifetime; this keeps ID relationships stable and delays destruction until close completes. forceRender retains content even with destroyOnHidden. Native input identity, draft, focus and selection are covered beyond a single render tick.

Static CSS resets the native heading/button and uses item-local variant classes so an existing Panel prefix can consume preloaded CSS. Ten component tokens and derived radius consume the current theme source; explicit inactive source metadata preserves CSS-only inheritance.

Validation includes the nine actual demos, all twelve unchanged reference DOM cases plus complete native replacement subtrees, strict public component/slot/event types and independent browser/SSR checks. Source closure and remaining publication boundaries are recorded in [the audit](../../../../docs/audit/2026-10-29-collapse-contract-audit.md). Public changes and examples are in [the migration](../../../../docs/migrations/collapse-contracts.md).
