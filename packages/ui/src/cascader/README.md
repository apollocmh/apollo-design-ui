# Cascader implementation

The current public contract is in [中文 API](./index.zh-CN.md) and [English API](./index.en-US.md). The project’s two-stage workflow replaces the old component-by-component full gate sequence; existing historical audit and compatibility evidence retain their dates and meaning.

Cascader uses the shared BaseSelect for its input, focus and popup transport. Its own OptionList owns path navigation, lazy loading and multi-column selection. CascaderPanel uses the same reactive value/selection helpers without a popup or input. The provided context is a computed value read at consumption time, and option content uses forwarded native Vue slots.

Path keys encode typed value arrays as JSON, distinguishing numeric/string values and values containing the former separator. A lazy computed entity graph follows the current field mapping and reactive option mutations. Both pickers keep the last accepted controlled value when control is released, retain missing paths, apply checked display/output strategies consistently and emit the same empty clear payload.

Owned notifications use Vue Emits. Rendering functions move directly to scoped slots; `popupRender` receives the bound menu VNode for `<component :is="menu" />`. The actual raw trigger keeps all slot content and native attrs. The public selector ref exposes a nativeElement property and focus/blur methods.

Pending lazy paths deduplicate requests. Promise settlement clears loading state, rejection reaches Vue’s error handler, and unmount/replaced data cannot mutate a stale request’s state. The service callback remains a function because its Promise result is consumed. No retry loop or compatibility rendering branch is added.

All eight Cascader component tokens accompany the trigger, teleported popup and standalone panel. The embedded Select shell borrows alias-derived defaults, without consuming Select-specific component overrides. `popupMenuColumnStyle` lands on the menu column ul; semantic listItem styles land on each row.

Historical boundaries remain: `_InternalPanelDoNotUseOrYouWillBeFired` aliases the standalone Panel (D113); the private conduct algorithm’s shape differs from the shared Tree graph. Its record keys use own-property reads and writes, rather than forcing incompatible entities into a shared generic abstraction.

Focused evidence lives in existing core tests, `native-contracts.test.ts`, `type.test-d.ts`, the compiled `fixtures/NativeCascader.vue` and `native-browser.mjs`. Final library-wide nine-dimensional acceptance is a separate frozen-version step.
