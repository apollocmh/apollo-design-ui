# Typography implementation

The five Vue entries share native content, current Provider configuration and two component tokens. Public contracts and all configuration fields are documented in [中文 API](index.zh-CN.md) and [English API](index.en-US.md).

- `Typography.vue` is the configurable article container; Text, Title and Paragraph keep their fixed semantic tags. Link uses an outer span and an inner anchor so its action buttons remain independent native controls.
- `Base.ts` owns decoration order, controlled/uncontrolled edit and expansion, root attrs, operation placement and live content. The default slot is the only public content hook.
- `Editable.ts` owns its actual root and textarea, native multiline/IME behaviour, focus and existing Input autosize calculations.
- `Ellipsis.ts` measures projected mounted DOM through `_util/measure-nodes.ts`. Probes never invoke business component setup or mount hidden Vue copies. Generation cancellation prevents stale results.
- `use-copy-click.ts` permits one pending request per instance and reports successful writes only. `_util/nodes.ts` reads actual mounted content for native rich-text copying.
- `use-typography-theme.ts` reads the current theme and component overrides. Static CSS consumes the existing two title-margin variables; relative native colours preserve readable semantic text across light and dark schemes.

The completed inventory, baseline failures, finite acceptance scope and remaining verification are tracked in [the dated audit](../../../../docs/audit/2026-10-27-typography-contract-audit.md). Public changes and direct development-stage migration are in [the migration record](../../../../docs/migrations/typography-contracts.md). Passing source tests does not mark this unit or the whole library complete.
