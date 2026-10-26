# Skeleton implementation and audit

Apollo Vue 3 native placeholders with Skeleton.Avatar/Button/Input/Image/Node. Public behavior is documented in index.zh-CN.md and index.en-US.md. Historical upstream comparisons are evidence, not the specification.

## 1. Scope

Main component, five standalone children, Element/Title/Paragraph, current theme and eight tokens, typed exports, eight original demos plus one live-token demo. The current complete audit is [2026-10-27](../../../../docs/audit/2026-10-27-skeleton-contract-audit.md); acceptance remains open until its checks finish.

## 2. Root ownership

Native attrs/class/style belong to the actual root. Standalone content uses styles.content/classNames.content. Skeleton loading=false renders its slot without a wrapper, so root attrs have no destination and nativeElement is null. Loading intentionally unmounts business content.

## 3. Configuration

Main components.skeleton values are read from the current Provider. Semantic functions receive reactive props. Nested block className/style are data with real targets; semantic classes combine and styles override. The single avatar block no longer pretends to have standalone root/content targets.

## 4. Geometry and content

Existing block derivation, shapes, size values, scalar/array widths and native Node content remain. Image default content now actually works, including intentional empty slots. Nonfinite lengths/rows are handled without invalid CSS or array allocation errors.

## 5. Styles

Static CSS declares all eight component variables and consumes current Alias fallbacks. Each owning root projects current source tokens; current gradient names precede the existing color aliases. Native variables win. Reduced-motion and motion:false stop active animation; RTL uses actual direction styles. Default SVG path is retained from the existing Ant Design 6.6.4 reference.

## 6. Validation

[Structured evidence](../../../../docs/audit/evidence/skeleton-contract.json) retains the source baseline and failing regressions. Full runtime/DOM/a11y/theme, public types and published consumption, SSR/hydration/browser/demo/visual checks are required. Card and Statistic are the actual shared consumers; their relevant regressions and pixels must be checked. Historical 48 mechanical scenarios remain, with exact reviewed native-contract differences.

## 7. Boundaries and migration

[Migration](../../../../docs/migrations/skeleton-contracts.md) describes root styles/attrs, nested configuration, accessible placeholders and current themes. No new compatibility layer or deprecation period is introduced. Existing size/default and color token aliases retain their prior deprecated status. No request model, persistent-content mode or new animation engine is added. Arbitrary custom prefixes require matching static CSS; other browser engines/physical devices and whole-library final gates are tracked separately.
