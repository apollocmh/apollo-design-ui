---
name: vue-native-audit
description: Audit and refactor Vue 3 component libraries for genuinely Vue-native APIs and implementations. Use when reviewing or changing React-derived Vue components, especially className/rootClassName, callback props versus emits, children/ReactNode/render props, VNode renderers, attrs/class/style fallthrough, provide/inject, Composition API, public types, or cross-component Vue migration patterns.
agent_created: true
---

# Vue Native Audit

## Purpose

Audit a Vue component library against its behavior/visual compatibility specification without treating React as an implementation template. Find substantiated cases where React APIs or implementation idioms were mechanically carried into Vue, where Vue-native facilities are duplicated, or where Vue fallthrough/reactivity semantics create real bugs. Refactor only when evidence demonstrates a better Vue contract; preserve behavior and visual output.

## Required project context

For `apollo-design-ui`, first read `AGENTS.md`, `ARCHITECTURE.md`, `COMPONENT-RULES.md`, `TESTING.md`, `COMPATIBILITY.md`, `.workbuddy-ai/memory/MEMORY.md`, `.workbuddy-ai/memory/environment.md`, and the relevant `PITFALLS.md` index entries. Use `node registry/tools/ask.mjs` when relying on current Registry facts. Do not modify `AGENTS.md` unless the user explicitly requests it. If a fresh WorkBuddy account/session does not yet expose this project-local skill in its skill selector, read `/Users/nanren/Code/apollo-design-ui/.workbuddy-ai/skills/vue-native-audit/SKILL.md` directly and continue from `registry/vue-native-audit.json`.

Keep audit progress in `registry/vue-native-audit.json`, not in chat history or the component implementation Registry. The implementation Registry is generated and has a separate status contract. Resume by reading the audit JSON, checking `git status`, then selecting the next unreviewed component/surface in its recorded batch order.

## Audit workflow

1. **Establish inventory.** Derive the component list from `registry/components.json`; verify it against `packages/ui/src`. Add shared public-hook and infrastructure surfaces (`packages/utils`, `packages/ui/src/_internal`, and relevant foundation packages). Record exact source paths/counts and `auditStatus` in the audit JSON. Do not claim full coverage from grep counts or a sample.
2. **Build candidates mechanically.** Search all production `.vue`, `.ts`, and `.tsx` files for React-shaped APIs/types, manual attrs handling, renderers, context, and lifecycle/cache idioms. Treat search results as leads, not findings. Include files with no candidate keyword in the per-component source review; inspect each implementation/type/style/hook file to completion.
3. **Trace contracts.** For each candidate, follow public export → runtime prop/emits/slots → implementation → child/internal utility → tests → docs. Inspect template roots and `inheritAttrs`, slots and emitted payloads, plus call sites before proposing API changes. Compare Ant Design's locked source/output only for behavior, DOM, accessibility, and visual expectations; do not copy its React API by default.
4. **Reconcile the project mapping before accepting an API.** Read the applicable mapping in `COMPATIBILITY.md` (especially its Props/attrs/class/style rules) and component-specific decisions/docs. A global mapping such as React `className` → Vue native `class` is binding unless a documented component exception is supported by evidence. Resolve contradictions between the global mapping, the component `interface.ts`, runtime declarations, implementation, and public docs before marking the surface reviewed; never treat an existing declaration as proof that it is intentional.
5. **Separate component Props from Vue attrs and provider configuration.** For a single root, do not declare `class`, `style`, `className`, `rootClassName`, or equivalent root aliases in component Props merely to forward them. Keep root `class`/`style` in `$attrs` and explicitly merge/fall through to the intended root; use `mergeProps` or Vue's class/style merge semantics so string/array/object classes, style precedence, and native listeners remain correct. Under `inheritAttrs: false`, test the actual root, including ConfigProvider defaults plus caller attrs. A dedicated prop is justified only by a separate target or distinct, tested semantics. Distinguish a `ConfigProvider` component-config object (for example `AffixConfig.className/style`) from the component's own Props: do not remove config schema fields just because equivalent root attrs exist.
6. **Compare laterally.** Cluster repeated patterns across all components and shared layers before editing. Decide whether the issue is a shared abstraction/API policy, a package-level convention, or a one-off. Record a single system issue with affected components and evidence rather than mechanically filing identical ungrounded issues.
7. **Record evidence.** Add every substantiated finding to `issues[]` with a stable ID, component/surface, exact file and line(s), category, severity, current behavior, Vue-versus-React semantic difference, recommendation, system-wide scope, regression tests, and status. Keep rejected candidates out of the issue count; optionally note why a public React-shaped API remains justified.
8. **Refactor in dependency order.** Fix P0 architecture defects, then P1 cross-component patterns, shared API/types, P2 component-specific defects, and P3 worthwhile low-risk cleanup. Before broad edits, define the intended public contract and migration impact. Avoid unrelated cleanup and blanket renames.
9. **Synchronize and prove.** Update implementation, runtime Props/Emits/Slots, exported types, tests, demos/docs, and compatibility notes together. Run focused type/unit/DOM/accessibility/theme/visual tests appropriate to the changed behavior. After batches, update issue and component states with commands and observed results. Finish with every required full-repository gate in the project environment guide.

## Vue-native review standards

### React APIs and public API shape

- Review `className`, `rootClassName`, `style`, `children`, React node/event/CSS types, `renderXxx`, `onXxx`, and React-named props as candidates—not automatic removals.
- Prefer Vue `class`/`style` fallthrough and `$attrs` when they reliably reach the intended root. First verify root count, `inheritAttrs`, `attrs` consumption, wrapper structure, and class/style merge order. Keep a dedicated prop only when it has distinct semantics (for example, a separate popup/root target) or is required by a demonstrated compatibility contract.
- Model component events with `emits` and document payloads. Check event casing at render-function/native-element boundaries and whether `emit('change', ...)` already invokes a matching `onChange` listener. Never both emit and call the same callback manually. Retain callback props only when they represent a genuine function-valued configuration/rendering contract rather than an event listener.
- Treat `v-model` as a Vue-native option when it improves a state contract, but preserve controlled/uncontrolled semantics, update timing, defaults, and event payloads. Do not rename merely for style.
- Review `defineExpose` as a deliberate public instance API. Do not mirror `forwardRef` mechanically; expose only methods/state consumers need and test actual template-ref use.

### Slots, ReactNode, and renderers

- Prefer default/named/scoped slots for extensible UI regions that are naturally authored as template content. Use scoped-slot props for useful context (item, size, prefix class, status), with typed `Slots`/slot contracts where supported.
- Audit `children`/`VNodeChild`, `NodeRenderer`, ReactNode adapters, clone-element helpers, JSX/VNode renderers, and render props for purpose and all call sites. Replace an adapter only when a slot expresses the same behavior without losing dynamic composition, primitive values, arrays, custom render timing, or documented APIs.
- Distinguish content from data-driven rendering. A `VNodeChild` icon/content prop may be an intentional Vue API; a per-record render function may be necessary for tree/table algorithms. Propose a slot when the region/context is naturally a template extension, not merely because a function prop looks React-like.
- Account for Vue slot functions being invoked during render, slot normalization (`Comment`, text, nested arrays), and dynamic slot forwarding. Never invoke slots from `watch`/`computed` solely to imitate ordinary React `children` access.
- For any public API change, identify compatibility/migration implications and update demos/docs and type tests; do not silently remove established behavior.

### `$attrs`, class/style, emits, and roots

- For every component root, verify external `class`, `style`, `id`, `aria-*`, `data-*`, and event listeners reach the intended DOM node exactly once and coexist with internal values.
- Check `inheritAttrs: false` for a concrete need and explicit forwarding/merging for every relevant root. Inspect single-root and multi-root behavior; Vue may silently fall through, warn, or drop attributes differently from React.
- Check whether attributes are consumed, split, cloned, or forwarded through wrappers, portals, and child components. Assert rendered DOM/effects rather than only that a value was passed.
- Check class/style merge precedence and style value conversion. Verify events do not duplicate through both manual handlers and `$attrs`/emit listeners.
- Prefer declared `emits` for component events when it gives correct listener classification and payload typing. Do not declare DOM fallthrough listeners as component events unless the public contract intentionally owns them.

### Composition API and internal implementation

- Inspect `ref`, `shallowRef`, `reactive`, `computed`, `watch`, `watchEffect`, lifecycle hooks, `provide`/`inject`, and caches for Vue-native purpose and correctness—not one-to-one React hook correspondence.
- Replace derived mutable state with `computed` only when dependency and timing semantics match. Keep `watch` for side effects; verify `immediate`, `flush`, cleanup, mount/update behavior, and initial-state paths. Do not create memoization/callback caches without measured or semantic need.
- Treat `provide`/`inject` as a Vue tree-context mechanism, not an excuse to clone React Context. Verify scope, key ownership, default behavior, nested overrides, and when props or slots are simpler.
- Review utilities/internal render helpers for duplicate Vue capabilities and cross-layer coupling. Keep abstractions that centralize actual invariants or serve multiple consumers; remove only proven redundancy.

### Props and types

- Audit public declarations and runtime prop validators together. Flag React-only types (`ReactNode`, React CSS/event types, React refs), accidental `any`, overly broad `Function`, and runtime/type divergence.
- Prefer Vue-native `VNodeChild`, native DOM/event types, typed slots, and explicit emits where they accurately describe usage. A function-valued prop may be legitimate for algorithms, semantic class/style callbacks, or custom rendering; inspect all call sites and inference before changing it.
- Verify defaults, nullable/undefined behavior, controlled values, generics, `v-model` modifiers if supported, `defineExpose`, and package-barrel exports. Test both accepted and rejected TypeScript usage without hiding errors.

### Reusable finding: root aliases can survive a superficially complete audit

The first Affix pass marked the component complete while retaining `className`, `rootClassName`, and `style` in its Props. This was a real audit miss, not an intentional exception:

- **Why it slipped:** the audit treated those names as search candidates, then trusted the existing `interface.ts` / React baseline as evidence of intent. It did not first reconcile the public props with `COMPATIBILITY.md` §7, where React `className` and `style` map to Vue-native root attrs. A DOM oracle proving that React `className` adds a class does not prove Vue needs a `className` prop.
- **Per-component decision rule:** inspect the component-facing Props interface separately from any `ConfigProvider` config interface. Remove duplicate React root aliases from component Props unless there is a distinct target or tested semantics. Do not remove same-named fields from a provider configuration schema by association: `AffixConfig.className/style` remain valid configuration keys even though `<Affix>` uses native attrs.
- **Implementation rule:** with `inheritAttrs: false`, merge provider defaults and the live `useAttrs()` object at render time (`mergeProps` is suitable); do not freeze an attrs snapshot in `computed()`. Test changing class/style after mount, class string/array/object forms, style precedence, and native events exactly once.
- **Oracle rule:** translate the reference behavior into the Vue contract instead of copying React input syntax into the Vue test. For Affix, the React `className` baseline case is rendered with Vue `class`; a React-only `rootClassName` oracle case must not pass that alias to Vue. Confirm the exact output against the existing baseline without adding a whitelist.
- **Type-test rule:** positively test native class/style on `InstanceType<typeof Component>['$props']`; negatively test removed aliases both against that public `$props` and the exported ergonomic Props interface. Do not use `h(Component, rawProps)` as the negative oracle because Vue deliberately accepts broad raw vnode props.
- **Completion rule:** never mark a component `done` while an unresolved mismatch remains between global compatibility mapping, component Props, runtime consumes/attrs, type tests, docs, and oracle cases. If user review finds one, reopen it and record the cause in the audit Skill/Registry before continuing the next batch.

### Reusable finding: the root-alias migration is systemic and mechanical

A library-wide scan (`^\s*(className|rootClassName|style)\?:` in every `packages/ui/src/*/interface.ts`) found **69 of 73 components** declaring React root aliases as public Props — the same defect as Affix/Button. Treat it as one systemic finding, then migrate per component:

- **Single root + `inheritAttrs: false`:** delete the alias Props, then merge the live `$attrs` into the root with `mergeProps({ class: internalClass, ...internalStyleAttrs }, attrs, { role })`. Put `attrs` **last** (or after provider style) so caller `class`/`style` win; keep any fixed attribute (e.g. `role="separator"`) after `attrs` if upstream lets it win.
- **Derived style beats caller style in some components.** `Flex` computes `flex`/`gap` inline styles *after* the caller's `style` (antd order: `{...ctx.style, ...style, flex, gap}`). So merge as `mergeProps({class}, providerStyleAttrs, attrs, derivedStyleAttrs)` — caller style must sit *between* provider and derived. Verify with a test that a `flex` prop overrides `style.flex`.
- **🚨 Gotcha that breaks every test at once:** in this repo `useComponentConfig()` destructured fields (`className`, `style`, `classNames`, `styles`) are **plain values, not refs**. Writing `styleAttrs(contextStyle.value)` throws `Cannot read properties of undefined (reading 'value')` on every render, failing the whole suite with a stack pointing at the template. Use `styleAttrs(contextStyle)`.
- **Keep the Provider schema.** `ComponentStyleConfig.className/style` and every `XxxConfig` field stay — they are configuration objects, not component Props.
- **Translate the oracle, don't rename it.** In the DOM-compat fixtures, render the React `className` case with Vue `class` and drop React-only `rootClassName` inputs. Keep the case ids unchanged so the baseline still matches one-to-one.
- **Always run all four layers per component** (unit + dom-contract + types + Biome) before committing; the `contextStyle.value` class of bug is invisible to type checks and only shows up as mass test failure.
- **🚨 Never leave an HTML comment as a sibling of the root element in `<template>`.** A comment counts as a root node, so the component silently becomes **multi-root** and Vue disables automatic `attrs` fallthrough — `class`/`style` vanish with no warning. Symptom: unrelated tests (e.g. a default-value test) fail because `wrapper.element` is a fragment, not the root. Put the note in the `<script>` block instead.
- **When you delete a root alias prop, every test/oracle that fed the old key must be renamed, not just deleted.** A leftover React key such as `className: 'x'` is no longer a prop, so it lands in `attrs` and silently takes over the root class (observed: the internal prefix class disappeared and the DOM class became just `x`). Sweep tests, fixtures and docs for the old key in the same change.
- **Verify precedence explicitly.** Whenever provider/derived/user styles all exist, add a test asserting which one wins (`Flex`: derived `flex` prop beats caller `style.flex`; `Card`/`Breadcrumb`/`Avatar`: caller `style` beats semantic root style). The `mergeProps` argument order *is* the contract.
- **🚨 In a hand-written object literal, `class: <array>` written AFTER `...attrs` silently replaces the caller class.** Object spread is last-wins, so the caller's `class` disappears entirely (L4 reported "Vue side only has the prefix class"). Same for `style:`. Fix: push `attrs.class` **into** the array and don't re-assign the `style` key (let `...attrs` carry it), or use `mergeProps`. Keep the original position of the user value inside the array/merge so the SSR byte contract is unchanged.
- **Preserve the original merge position of the user `style`.** Several components merge user style *between* internal layers rather than last (`Col`: `mergedStyle → user → sizeStyle`, so the responsive `sizeStyle` still wins; `Sider`: user first, computed width last). Read the existing expression before replacing it — moving the user value to the end changes behavior even though types still pass.
- **Some roots deliberately accept only `class`/`style` and drop every other attr.** `Carousel` and `Calendar` roots have no `{...restProps}` upstream (proven by the L4 `carousel:attrs` / `calendar:attrs` cases where the React output has no `data-x`). Spreading the whole `attrs` object there turns the suite red; merge only `{ class: attrs.class, style: attrs.style }`.
- **🚨 After migrating a component, sweep the whole repo for internal consumers that still pass `className` / `rootClassName` to it.** They are no longer props, so the value falls into `attrs` and the class is **silently lost** — the consumer's own suite goes red with a diff like `[apollo-col apollo-form-item-control] vs [apollo-form-item-control]`. This bit us on `Form → Col` (19 L4 cases red at once), `FloatButtonGroup → Flex/SpaceCompact`, `FloatButton → Badge`, `InputNumber → SpaceAddon/SpaceCompact`, `Modal → Skeleton`, `Statistic.Timer → Statistic`. Reusable scan (run it after each component, or once per batch):

```sh
node -e "
const fs=require('fs'),path=require('path');
const MIG=['Button','Divider','Flex','Alert','Breadcrumb','Avatar','Card','Descriptions','Anchor',
'Carousel','App','Calendar','Badge','Dropdown','Space','Row','Col','Layout','Tag','Skeleton',
'Result','Statistic'];                       // ← 追加刚迁移的组件
const out=[];
(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);
if(e.isDirectory()){if(['__tests__','demo','node_modules','dist'].includes(e.name))continue;walk(p);continue;}
if(!/\.(ts|vue|tsx)\$/.test(e.name))continue;const lines=fs.readFileSync(p,'utf8').split('\n');
lines.forEach((l,i)=>{if(!/className:|rootClassName:/.test(l)||/^\s*\//.test(l))return;
const m=[...lines.slice(Math.max(0,i-25),i).join('\n').matchAll(/h\(\s*([A-Z][A-Za-z0-9_]*)\s*,/g)].map(x=>x[1]);
const hit=m.filter(n=>MIG.includes(n));if(hit.length)out.push(p+':'+(i+1)+' ['+hit.at(-1)+'] '+l.trim());});}})('packages/ui/src');
console.log(out.join('\n')||'clean');"
```

  The 25-line lookback is a heuristic — **verify each hit by reading the actual `h(Component, {` it belongs to**. Known false positives: `modal/engine/Dialog.ts`'s own `Content`, `table/hooks/use-filter.ts`'s `FilterWrapper`, and `Dropdown.rootClassName` (a popup target, legitimately kept). Also note a migration can create a **duplicate-key** lint error when two old props (`className` + `rootClassName`) collapse into one `class:` — merge them into an array preserving the original clsx order.
- **Check whether the "root" is the component's own root or an inner layer.** `Anchor` puts `restProps` on the **inner wrapper div**, not the outer `Affix` → needs `inheritAttrs: false` plus an explicit bind. `Dropdown`'s `rootClassName` targets the popup (the component has no DOM root) and `Carousel`'s `className`/`style` target the inner `slick-slider` — those are genuine dedicated props, not aliases; keep them and document why.

## Finding taxonomy and severity

Use one or more categories: `react-api`, `slot`, `emits`, `attrs`, `class-style`, `renderer`, `react-implementation-migration`, `vue-composition-api`, `type-design`, `duplicate-implementation`, `test`, `architecture`.

- **P0 — public architecture:** shared architecture blocks natural Vue usage or causes broad runtime/API defects; fix before component-level changes.
- **P1 — cross-component/systemic:** a repeated public contract or infrastructure pattern affects multiple components/packages; analyze and repair as a coherent batch.
- **P2 — component-local:** a demonstrated API, type, lifecycle, attrs, slot, or behavior defect confined to one component.
- **P3 — low-value optimization:** evidence-backed simplification with low user impact; defer if it risks scope or compatibility.

Do not assign severity from code aesthetics or React resemblance alone. A proposed finding needs reproducible impact, affected call sites, and an appropriate regression test.

## Registry contract

In `registry/vue-native-audit.json`, set each component/shared surface `auditStatus` to one of `todo`, `analyzing`, `refactoring`, `testing`, `done`, or `blocked`. Track reviewed file paths/counts, issue IDs, batch, and notes. `done` means all in-scope implementation/type/style/hook files were reviewed and all related findings are either fixed and verified or explicitly deferred with rationale; it does not mean every possible improvement was made.

Each `issues[]` entry must include: `id`, `component` or `surface`, `files` (with line evidence), `category`, `severity`, `currentImplementation`, `semanticDifference`, `recommendation`, `systemic`, `relatedComponents`, `tests`, and `status` (`open`, `in_progress`, `fixed`, `deferred`, or `wont_fix`). Add `verification` only with real commands/output summaries. Keep global progress and gate results separate from the original component completion status.

## Test and acceptance requirements

For changed contracts, add/adjust checks for applicable items:

- external class and style merge on the real root; explicit root-vs-popup targeting where relevant;
- `$attrs`/ARIA/data attributes and native event passthrough; no dropped or duplicated events;
- emits name, payload, and exactly-once invocation;
- default/named/scoped slots, empty/text/array content, and forwarding through wrappers;
- function/render customizations and their template-slot alternatives where applicable;
- public type positive/negative cases, defaults, controlled/uncontrolled and `v-model` behavior; for root attrs, assert native `class`/`style` on `InstanceType<typeof Component>['$props']` while asserting removed React aliases are absent from both the exported Props interface and component `$props` (do not use `h()` as the negative-type oracle: Vue's render-function props intentionally accept broad raw keys);
- when `inheritAttrs: false`, verify class/style updates are read during render rather than frozen in a non-reactive `useAttrs()` computed snapshot; test context+caller precedence and exactly-once native events;
- expose/ref behavior and provide/inject nesting when public;
- SSR only where the project has an SSR contract, avoiding unsupported assumptions.

Never remove tests, weaken assertions, or label an API `Vue-native` as a substitute for testing. For visual or DOM-sensitive changes, preserve the Ant Design behavior/visual baseline or record a justified compatibility classification. A component/batch is not verified until its focused tests and type checks pass; the project is not accepted until all required repository gates have run and their actual outcomes are recorded.

## Security and scope

Keep the skill instructional and repository-scoped. Do not add credentials, external network calls, hidden data collection, destructive scripts, or commands that change user files. Do not modify outside the project without explicit request. Keep `.workbuddy-ai` project data intact; update only the named skill, audit Registry, source/test/docs files, and required progress logs.