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
- **🚨 A `computed` created in `setup` cannot see a destructure done inside the render function.** In `Steps`, `rootStyle` is a setup-time `computed` while `const { class: _attrClass, style: _attrStyle, ...rest } = attrs` lives in the returned render fn — referencing `_attrStyle` inside the computed throws `ReferenceError` at render time (the whole L4 suite went red). Read `attrs.style` directly in the computed; keep the render-local destructure only for the render body.
- **🚨 Check `inheritAttrs` BEFORE touching the render body. If it is NOT `false`, Vue already merges native `class`/`style` onto the root — so do NOT also add `attrs.class` / `attrs.style` into the explicit class array / style object.** Adding both doubles them (`tree` showed `apollo-tree-directory` twice in L4). In that case the whole migration is: delete the props, change nothing else. Conversely, if `inheritAttrs: false` (the common case here) you MUST wire `attrs` in by hand. Three shapes exist: (a) `inheritAttrs: false` → wire manually; (b) default `inheritAttrs` → delete props only; (c) `:class="x" v-bind="y"` in a template → `mergeProps` merges, so strip `class` out of `y`.
- **🚨 Do NOT blindly convert a root `style` prop into a native attr — check the upstream landing spot first.** `Input` / `TextArea` / `Password` routed the user's `style` through the **semantic root channel** (`semanticRootStyle(props.style)` → `mergedStyles.root`), which lands on the component root. Feeding it as a plain native `style` made it fall through `...attrs` onto the inner `<input>` instead (L4 `input:group` caught it). Keep the channel, just swap the source: `semanticRootStyle(attrs.style)`.
- **🚨 Pick the work queue by SCANNING CODE, not by trusting `auditStatus`.** Filtering `todo` alone missed 6 components sitting in `analyzing` (`checkbox`, `collapse`, `drawer`, `cascader`, `color-picker`, `date-picker`) — I reported the migration "complete" twice before a full-tree scan of `props.className|props.rootClassName|props.style` found them. Always re-scan the whole `packages/ui/src` tree as the final check.
- **🚨 A component can be HALF-migrated — check the render body, not just the props.** `collapse` had `props.className` AND `attrs.class` in the same class array while also ending its root props with `...attrs` ⇒ the caller's class was applied **twice**. "Someone already added `attrs.class`" is not evidence of completion.
- **🚨 `attrs.class` is Vue's `ClassValue` (may be an array) and `attrs.style` is `StyleValue`** — normalise or cast before feeding them into a `string[]` / `CSSProperties` slot, otherwise `vue-tsc` fails on the engine's prop types.
- **🚨 `inheritAttrs: false` + never reading `attrs` = the caller's `class`/`style` are SILENTLY DROPPED.** `date-picker`'s two files both did this; `checkbox` destructured them into `attrClass`/`attrStyle` and never used them. When migrating, grep for `useAttrs` — if it is absent, you must add it.
- **🚨 BEFORE declaring "the L4 baseline conflicts with this migration", check how an ALREADY-migrated component handles the same case.** The repo's established convention is **per-side vocabulary**: the React generator passes `className`/`rootClassName` (`tests/compat/baseline/button.mjs:190` → `push('class:className', { …, className: 'my-class' })`) while the Vue side passes native `class` (`button/__tests__/semantic.test.ts:188` → `'class:className': () => withText({ …, class: 'my-class' })`). **The case ID is the contract; the baseline is never touched.** `mentions` looked like a baseline conflict but was really the `{ className: X, ...restAttrs }` double-application bug (same family as the Tabs `...attrs` one) — I misdiagnosed it and even shipped a patch (stripping `className`/`rootClassName` out of attrs), which had to be reverted. One grep (`grep 'class:' <other>/__tests__/semantic.test.ts`) would have prevented the whole detour.
- **🚨 The L4 baseline is a PRE-RECORDED React artifact (`tests/compat/baselines/*.dom.json`), not a live React render.** If antd's own component does not put `className`/`rootClassName` on the element your fixture diffs, then after migration the native `class` MUST NOT land there either — and because the shared fixture props are React-shaped, `class` may even render twice on the React side. `mentions` hit exactly this and was left un-migrated pending a ruling. Check the baseline before assuming a root alias is a root alias.
- **🚨 In `.vue` templates using `:class="x" v-bind="y"`, Vue's `mergeProps` MERGES `class` — so strip `class` out of `y`.** If you add `attrs.class` to the explicit class binding *and* leave it in the `v-bind` object, the user's class lands twice. (`list/List.vue`, `list/Item.vue`, `list/ItemMeta.vue` all hit this.) Note this is the opposite of the render-function case, where a later `...attrs` simply overwrites.
- **When the root object ends with `...restAttrs`, strip `style` as well as `class`.** `Steps` renders `{ class: stepsClassName, style: rootStyle, ...restAttrs }` — leaving `style` in `restAttrs` silently overrides the computed `rootStyle` (losing e.g. the `--cmp-steps-items-offset` CSS variable).
- **🚨 Don't put backticks inside a `node -e "…"` script passed through the shell.** zsh performs command substitution on them, silently eating the backticks and leaving mangled source (it corrupted a comment in `Steps.ts`). Use the Edit tool for anything containing backticks, or write the script to a file first.
- **🚨 The runtime props object can declare the same key twice, or in a shape you didn't grep for.** `Progress` had `style` both as a `{ type: [Object, String], ... }` entry AND in `ProgressProps`; a grep for `style: { type` missed the first. Always `grep -n "className\|rootClassName\|style"` in the component file after editing and confirm **zero** hits remain outside comments and `attrs.*`.
- **🚨 Grep for every `props.style` usage — it is often read for more than styling, and it may only be reaching the DOM through the semantic list.** Two real cases: `QrCode` read `props.style.width/height` to derive the canvas size (must become `attrs.style.width/height`); `Listy`'s **virtual** render branch got the caller style only because `rootStyleSem(props.style)` was in the semantic list, so the branch needed `style: [mergedStyles.root, attrs.style]` added explicitly. Also **check every render branch** (raw vs virtual, status vs normal, affixed vs not) — a component can have two roots and only one of them was wired.
- **Preserve the original merge position of the user `style`.** Several components merge user style *between* internal layers rather than last (`Col`: `mergedStyle → user → sizeStyle`, so the responsive `sizeStyle` still wins; `Sider`: user first, computed width last). Read the existing expression before replacing it — moving the user value to the end changes behavior even though types still pass.
- **Some roots deliberately accept only `class`/`style` and drop every other attr.** `Carousel` and `Calendar` roots have no `{...restProps}` upstream (proven by the L4 `carousel:attrs` / `calendar:attrs` cases where the React output has no `data-x`). Spreading the whole `attrs` object there turns the suite red; merge only `{ class: attrs.class, style: attrs.style }`.
- **🚨 Watch for REVERSE dependencies: a component you migrate may forward its class to a NOT-yet-migrated component.** `Timeline` is a thin shell over `Steps`, and our `Steps` **actively strips `class` from attrs** (it only merges the `className` prop) — so `Timeline` must keep emitting `className: classString`, even though its own public API just lost that prop. The forward scan can't see this (the target isn't in your MIG list yet). Record a **migration hint on the target component** (e.g. in the audit registry) so the forwarder gets fixed when the target is migrated.
- **🚨 Phase 2 (2026-10-06, user ruling): the project no longer mirrors antd 1:1.** antd is now a **reference implementation**, not "the judge of answers". Root aliases still must be native `class`/`style`; for **non-root targets** (popup root / inner element / item level) **we design our own `classNames.*` / `styles.*` slots** and keep the upstream name as a `@deprecated` alias — the objection "that would invent an API antd doesn't have" **no longer applies**. Already done: `carousel.classNames.slider`, `border-beam.classNames.effect`; deprecated: `dropdown.rootClassName` → `classNames.root`. The phase statement lives at the top of `COMPATIBILITY.md`; `AGENTS.md` §0 still needs a user edit.
- **✅ The repo's own `COMPATIBILITY.md` prescribes this whole migration** — cite it instead of arguing from first principles: line ~228 `| className | class | 原生属性，通过 $attrs 透传 |` and line ~232 `| rootClassName / rootStyle | 默认并入根节点原生 class / style attrs；仅在语义目标独立于根 attrs 且有实证需求时保留专用 prop |`. That second clause is exactly the "keep as an independent target" list.
- **🚨 The full L6 visual matrix has FLAKY cases — always re-run the affected component in isolation before classifying.** A full run (1125 shots) reported 6 failures (`menu/vertical` ×3, `upload/basic` ×3, diffs 0.1–0.37%); re-running each component alone gave **0.000% exact for all 6**. Cause: runtime-measured geometry (progress-bar width, submenu popup position) captured mid-animation under load. Use `node tests/visual/run.mjs --component <name> --no-build --mode compare` (~19 s) to classify. Also: a failing L6 whose L4 (DOM contract) is green almost certainly is NOT a class-string problem.
- **🚨 The consumer sweep MUST also cover TEMPLATE usages, not just `h()` render functions.** In `.vue` files the old prop appears as `:class-name="…"` / `:root-class-name="…"`. A regex over `h(<Tag>, { className: … })` misses all of them — that is how `card/Card.vue`, `color-picker/*` and `calendar/components/CalendarHeader.ts` (a helper returning `{ className }`) slipped through and cost 36 failing tests in the full run. Sweep both `h(...)` + `className:` and `:class-name=` / `:root-class-name=`.
- **🚨 `{ class: X, ...attrs }` — the trailing `...attrs` OVERRIDES `class` entirely.** Object spread is last-wins, so if a component ends its root props with `...attrs`, passing `class` wipes out the whole computed class string (Tabs lost `apollo-tabs …`, keeping only the caller's class). Fix: destructure `class` (and `style`) out before spreading. Scan for `^\s*(class|style):` followed by `...attrs`/`...restAttrs` in the same object literal.
- **🚨 RUN THE FULL SUITE, not just the component's own tests, before calling a big migration done.** Per-component runs gave false confidence for many batches; the full `unit + dom-contract + types` run surfaced 36 cross-component failures that no per-component run could see. It takes ~7 minutes — budget for it.
- **🚨 The consumer sweep MUST include the component you are migrating itself** (i.e. put it in your MIG list too). Same-directory internals forward to it: `modal/ConfirmDialog.ts` does `h(Modal, { className: classString.value, … })`, and missing that silently dropped the entire `apollo-modal-confirm` class (5 unit tests caught it, L4 did not).
- **⛔ NEVER run `git stash push -u` in this repo.** It desynced the index (6 352 paths reported as staged-deleted while the files were perfectly fine on disk) — `git status` looked catastrophic. Recovery is a plain `git reset` (mixed), which resyncs the index to HEAD without touching the worktree. To get a pristine copy of one file, use `git show HEAD:<path> > /tmp/x` or `cp` it aside first, never stash.
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
- **🚨 Don't add `attrs.class` to the class array when the template already has `v-bind="rootAttrs"` containing `attrs`.** Vue merges `:class` with the `class` key of the bound object, so the caller class ends up rendered **twice** (L4: `[apollo my-class] vs [apollo my-class my-class]`). Rule of thumb: the **render-function** components (no `v-bind`) must push `attrs.class` into the array; the **template** components with `v-bind="rootAttrs"`/`v-bind="$attrs"` must **not**.
- **Check whether the "root" is the component's own root or an inner layer.** `Anchor` puts `restProps` on the **inner wrapper div**, not the outer `Affix` → needs `inheritAttrs: false` plus an explicit bind. `Dropdown`'s `rootClassName` targets the popup (the component has no DOM root) and `Carousel`'s `className`/`style` target the inner `slick-slider` — those are genuine dedicated props, not aliases; keep them and document why.

### Reusable finding: auditing the SHARED LAYERS (utils / `_internal` / foundation packages)

The component pass and the shared-surface pass find different classes of defect. Components
mostly had React-shaped *public APIs*; the shared layers (L0 `utils`, `ui/src/_internal`, and
the foundation packages) are where **Vue lifecycle/reactivity** bugs hide. Techniques that worked:

- **A clean L0 is a real result, not a failed audit.** `packages/utils` (43 files) came back with
  **0 issues**: every React-shaped carryover (`pickAttrs` React attribute-name whitelist, `useId`
  not pinning a test id, `isDev` as a module const with no DCE, module-level singletons in
  `raf`/`focus`/`observers`) is documented with a contract source + intentional-deviation note and
  **locked by a focused test**. Record these as *rejected candidates with rationale*, do not file
  issues for them. The audit is not "done" because you found something; it is done when every
  in-scope file was read to completion.
- **🚨 The highest-yield shared-layer check: does every raw `addEventListener` have a matching
  `removeEventListener` on teardown?** Vue only auto-cleans `watch`'s `onCleanup` — a raw
  `window.addEventListener` registered in `setup` is **never** removed automatically. This found
  the only real defect in the whole `_internal` batch: `trigger.ts` leaked a global `window`
  `resize` listener (no `removeEventListener` / `onBeforeUnmount` / `onScopeDispose` anywhere in
  the file), affecting every popup consumer (tooltip/dropdown/select/cascader/date-picker/tour/
  mentions). Sweep (fast, whole-repo, avoids eyeballing every file):

  ```sh
  node -e '
  const fs=require("fs"),path=require("path");
  const roots=["packages/ui/src","packages/overlay/src","packages/portal/src","packages/position/src","packages/motion/src","packages/a11y/src","packages/virtual-list/src","packages/form-core/src","packages/picker/src","packages/utils/src","packages/test-utils/src"];
  const files=[]; for(const r of roots){ if(!fs.existsSync(r))continue;
   (function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);
   if(e.isDirectory()){if(["__tests__","demo","node_modules","dist"].includes(e.name))continue;w(p);continue;}
   if(/\.(ts|vue|tsx)$/.test(e.name))files.push(p);}})(r); }
  for(const f of files){const s=fs.readFileSync(f,"utf8");
   const a=[...s.matchAll(/(window|document|el|element|container|scroller|target|node|popupEle)\.addEventListener\(/g)].length;
   if(!a)continue; const r=[...s.matchAll(/\.removeEventListener\(/g)].length;
   if(r<a)console.log(`ADD=${a} REMOVE=${r} | ${f}`);}'
  ```

  A hit is a *lead* — read the file to confirm the listener is not removed elsewhere.
  **If the sweep returns exactly one hit across ~950 files, that is strong evidence it is a real
  isolated defect, not a repo-wide convention** (the opposite of the root-alias case, which was
  systemic and mechanical). Say so in the issue.
- **A fix is not verified until the new test FAILS without it.** After adding the regression test,
  temporarily revert the fix, confirm the test goes red, then restore. Report the observed
  `N failed | M passed`. A test that passes both ways is decoration. (Also: a test that asserts the
  *same function reference* is removed — not merely that `removeEventListener` was called — is what
  catches the real leak, since a mismatched handler is silently ignored by the DOM.)
- **Sweep for dead statements and stale doc pointers while you are in the file.** Two P3s came out
  of the same batch: a no-op `void getCurrentInstance();` (the only occurrence in the repo) and two
  comments referencing state that no longer exists (a `docs/KNOWN-ISSUES.md` entry that had been
  cleared, and a hand-written `1 / 72` progress number in the public barrel that contradicted
  itself in the same paragraph). Grep the repo for the suspicious statement to see whether it is
  isolated.
- **`pnpm run registry:check` rewrites `generatedAt` in `components.json` / `dependencies.json` /
  `tokens.json`.** After running it, `git checkout --` those three if the only diff is the
  timestamp — otherwise the audit commit carries timestamp noise.
- **Batch progress lives in `registry/vue-native-audit.json`.** Update `sharedSurfaces.<id>`:
  `auditStatus`, `reviewedFiles`, `batch`, `issueIds`, `notes`; recompute
  `summary.reviewedProductionSourceFiles` **from the `reviewedFiles` arrays** (never hand-add), and
  append to `batches` / `sessionLog` / `observations`. The invariant to assert:
  `sum(component reviewedFiles) + sum(shared reviewedFiles)` grows by exactly the batch's file count.
- **Put one-off audit scripts under `.workbuddy-ai/memory/`**, not a new `.workbuddy-ai/scripts/`
  dir (only `memory/` and `skills/` are tracked; a new top-level dir shows up as untracked).
- **🚨 `registry/foundation.json` records per-package `srcLines`** — so editing a file in a
  **foundation** package (utils / motion / portal / position / a11y / virtual-list / overlay /
  form-core / picker / locale / test-utils / theme / icons) makes it stale and `registry:check`
  fails with `foundation.json 已过期`. Fix: run `node registry/tools/foundation-status.mjs`
  (no flag) and commit the refreshed file — its diff shows the real line-count change alongside
  `generatedAt`. Editing `packages/ui/src` does **not** do this (ui is not a foundation package).
- **🚨 A file-level `biome-ignore-all` makes a per-file `biome check` look clean — which can
  produce a WRONG inference about what the linter flags.** I once concluded "biome's
  `noExplicitAny` doesn't check `any` in interface/type declarations" from a clean
  `biome check packages/form-core/src/form-types.ts`. That was false: the file begins with
  `// biome-ignore-all lint/suspicious/noExplicitAny`, and deleting that one line produced
  **24 errors**. Before concluding "the linter allows this", grep the file (and the line above the
  hit) for `biome-ignore` / `biome-ignore-all`. Conversely, the line-level ignores in
  `use-form.ts` / `use-watch.ts` / `types.ts` are all genuinely needed — do not delete them.
- **🚨 Run the WHOLE-REPO biome (`biome check .`), not just the files you think you touched.**
  Audit scripts under `.workbuddy-ai/memory/` ARE inside biome's `files.includes`
  (`["**", "!**/node_modules", …]`) ⇒ they are format-checked and lint-checked
  (`lint/style/useNodejsImportProtocol` → `require('node:fs')`;
  `lint/correctness/noUnusedVariables` → an unused destructured binding is an **error**).
  `verify:full` runs the repo-wide check and fails on them.
- **When the audit surfaces a contradiction with a NORMATIVE doc, file it `open` — do not fix it.**
  Real example: `COMPONENT-RULES.md:125` still required `rootClassName` / `rootStyle` on every
  component while Phase 2 had removed those props from all 72 (verified: 0 hits in
  `button/interface.ts`), and the `rootPropsTest` helper implemented exactly that obsolete
  contract with **zero** consumers. Changing a rule doc + a public test-utils API is a user
  decision ⇒ recorded as `VNA-TESTUTILS-01` (P2, `open`) with three options + a recommendation.

- **🚨 A gate that has never run is where defects accumulate — check the gate's own status before trusting a green board.**
  The single highest-impact finding of the 2026-10-07 shared-surface pass came from asking *why a check was PENDING*
  rather than from reading code: L7's **B6** ("按需引入单组件后产物体积 ≤ 预算") had been `PENDING` since
  2026-09-18, so **the one gate designed to catch tree-shaking failure had never executed** — and measuring it
  showed `@apollo-design/ui` could not be tree-shaken at all (importing *any* single component = 1272.9 KB =
  63% of the full 2010.1 KB). Two generalizable rules:
  1. **"Found nothing this round" usually means "not measured yet", not "nothing there."** Before concluding a
     surface is clean, ask which gate would have caught a defect there, and whether that gate actually runs
     (in CI *and* locally). `--strict`, `continue-on-error`, `--passWithNoTests`, and `n/a` verdicts are all
     places a check can silently not-check.
  2. **A PENDING entry in a ledger is a to-do, not a pass.** Trace it to a decision: this one turned out to be
     *mandated by an already-decided decision* (`ui-style-output` A said B6 "从 PENDING 转真检查") — i.e. the
     work was owed, not blocked. Distinguish "欠裁决" from "欠实现" before escalating.
- **When measuring a size/performance claim, separate "whole-module drop" from "intra-module DCE".** The pair
  `import 'pkg'` → 0 KB vs `import { X } from 'pkg'` → 1272.9 KB localizes the cause to **module granularity**
  in one step. Corollaries learned the hard way: (a) my first hypothesis (`missing /*#__PURE__*/` on 329
  `defineComponent(` + 126 `withInstall(` calls) was **disproven by measurement** — annotating them recovered
  only 104 KB of 1273; (b) when grepping a **non-minified** bundle for markers, use **quoted string literals**
  (`"ATable"`) — bare identifiers get false positives from preserved comments; (c) put the probe's entry file
  **inside the repo/package directory**, since pnpm links `@apollo-design/utils` only under
  `packages/<pkg>/node_modules/`.

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

- 🚨 **Never trust a filtered vitest run's case count.** `vitest run <file> --project types <file2>` can silently run only a SUBSET — I once reported "84/84 passed" for a file whose new cases had never executed (they were red). **Rule: the reported test count must equal the expected count, otherwise suspect the filter first.** Cross-check with a full-suite run before claiming anything is green.
- 🚨 **When eliminating a `!` (non-null assertion), evaluate the `undefined` branch value-by-value — not just the truthy branch.** `!arr.includes(x!)` looks like `x && !arr.includes(x)`, but `includes(undefined)` is always `false` ⇒ the `!` is always `true` ⇒ the original also took that branch when `x` was `undefined`. My "equivalent" rewrite silently removed that path and two tests caught it. The safe rewrite is `!(x && arr.includes(x))`.
- 📌 **Before designing a fix for a `KNOWN-ISSUES` entry, read the UPSTREAM implementation of the thing you are fixing.** §1.1 said "implement a generic `ContextIsolator`" — reading antd's `ContextIsolator.js` showed it is literally `<NoFormStyle override status>`, and the repo already had `provideNoFormStyle(...)`. One grep replaced a proposed framework.
- 📌 **A guard that tests `entity.parent` does not narrow a local `parent` destructured from it.** Reordering to test the LOCAL (`!parent`) removes N `!`s at once with zero behavior change — far better than `parent?.key`, which inserts `undefined` into `Set`s.

Never remove tests, weaken assertions, or label an API `Vue-native` as a substitute for testing. For visual or DOM-sensitive changes, preserve the Ant Design behavior/visual baseline or record a justified compatibility classification. A component/batch is not verified until its focused tests and type checks pass; the project is not accepted until all required repository gates have run and their actual outcomes are recorded.

## Security and scope

Keep the skill instructional and repository-scoped. Do not add credentials, external network calls, hidden data collection, destructive scripts, or commands that change user files. Do not modify outside the project without explicit request. Keep `.workbuddy-ai` project data intact; update only the named skill, audit Registry, source/test/docs files, and required progress logs.