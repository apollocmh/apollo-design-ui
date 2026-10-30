---
name: vue-native-audit
description: Audit and refactor Vue 3 component libraries for genuinely Vue-native APIs and implementations. Use when reviewing or changing React-derived Vue components, especially attrs, callback props versus emits, render props versus slots, v-model, provide/inject, reactivity, Expose, public types, or shared responsibilities.
agent_created: true
---

# Vue Native Audit

## Current workflow and authority

For `apollo-design-ui`, read the current user scope, `AGENTS.md`, `WORKFLOW.md`, `TESTING.md`, and `registry/vue-native-audit.json`, then inspect `git status` and active assignments. Consult `ARCHITECTURE.md`, `COMPONENT-RULES.md` and `COMPATIBILITY.md` for the contract being changed. Memory and `PITFALLS.md` contain dated technical evidence, not a second execution policy.

The audit JSON is the only current task and progress source. Static component, foundation and Token inventories do not define another completion state. `registry:next` provides read-only suggestions; it neither claims nor starts work. A paused round must not dispatch new tasks. Resume an existing owner and work product instead of assigning the same scope again.

Keep existing code, tests, findings and acceptance evidence. Historical delivery retains its original meaning and does not claim a fresh pass on the final frozen version. Reuse still-applicable evidence; recheck only missing evidence, subsequent changes or a substantiated defect. Do not repeat the original full audit of a completed component.

This two-stage workflow, effective 2026-10-30, replaces the earlier fixed batch order, per-component G0–G14 closure, full-suite-before-every-batch and per-component nine-dimension acceptance requirements. Retired workstreams and foundation measurement/state writers have no compatibility path. Old scans and implementation status are dated archives under `docs/history/`.

## Stage one: architecture remediation

1. **Bound the unit.** For a new unit, inventory the actual public Props, Slots, Emits, v-model, Expose, attrs, reactivity, Provider and relevant child/shared responsibilities. For an already reviewed unit, use the prior inventory and inspect the changed or affected chain. Historical reports and types are leads, not substitutes for current behavior.
2. **Trace the contract.** Follow declaration → forwarding → consumer → observed behavior, including template and `h()` callers. Resolve contradictions between public documentation, types, runtime and tests before changing the API. Ant Design may supply evidence; its React shape is not the required Vue implementation.
3. **Group root causes.** Check related consumers and repeated patterns before fixing fields individually. Distinguish shared architecture, component behavior and unrelated new capabilities. Avoid opportunistic redesign.
4. **Reproduce and implement.** Establish a meaningful failing scenario, reusing an existing reproducible failure where available. Synchronize implementation, types, affected tests, necessary Demo and contract documentation. A separate report or temporary revert of every fix is not mandatory proof.
5. **Run focused checks.** Related types, core behavior and necessary Demo verification are the normal stage-one gate. Add local DOM, keyboard, theme or browser checks when the change creates a concrete risk. Shared foundation/public-responsibility changes require timely checks of actual affected consumers.
6. **Record and continue.** Preserve compact commands/results and evidence in the task. Architecture can be `done` while final acceptance has not started. A non-blocking issue may be deferred with impact and reason; unresolved core contract, data, resource-safety or integration blockers prevent completion. Unknown, untested and deferred work must not be marked passed.

Do not run full-library tests, coverage, the complete visual matrix or published-consumer acceptance separately for every component. Reuse valid results on the same source/scope. Rerun relevant checks after new changes, failures or an unresolved concern; do not repeat checks merely to produce more receipts.

## Stage two: frozen-version acceptance

After all architecture work is complete, use one frozen source commit for the library's existing API, Token, style, unit, interaction, type, accessibility, visual and documentation dimensions, plus applicable build and consumer checks. Keep existing thresholds and useful tests.

Build once. Browser, visual, tarball and other consumers read that same artifact set without rebuilding it. Merge duplicate runtime/coverage work and reuse documentation already produced by the build. If source or artifacts change, verify the affected scope and ensure the final result identifies one consistent version. Final acceptance verifies integration; it does not restart completed component remediation.

Report implemented, verified, unverified, deferred and blocked scope accurately. A dry run is a plan, not a pass. Nonzero exit, startup error, signal interruption, empty collection, source type error, rendering error or missing baseline must remain failures; test-count text cannot override them.

## Vue-native review standards

### Public API and content

- Treat React-looking names as candidates, not automatic defects. Distinguish component Props, native attrs and Provider configuration before removal.
- Use native root `class`/`style` and Vue merging where they express the contract. A non-root target may need existing semantic fields; inspect actual landing and precedence. Do not delete valid Provider configuration by association.
- Use Emits for owned component events, document native event versus business payload, and verify exactly-once delivery. Never both emit and manually call the same event listener. Keep genuine cancellation, algorithm or service callbacks where their responsibility requires a function.
- Prefer default/named/scoped slots for template extension. A `VNodeChild` icon or data-driven render function may remain valid. Verify empty/text/array content, dynamic slot presence and forwarding; read slots during render rather than caching their presence in setup/computed.
- Preserve controlled/uncontrolled behavior, update timing, defaults, model names and payloads. Expose only necessary public methods/elements and verify actual Vue template refs.
- Follow current compatibility policy for development-time direct migrations. Do not create deprecated or compatibility channels to retain an incorrect React callback or DOM shape.

### Attrs, reactivity and shared responsibilities

- Check `inheritAttrs`, root count, real target, class/style merge order and listener classification. Test actual DOM effects rather than only forwarded values. Do not freeze non-reactive attrs snapshots or apply native fallthrough twice.
- Keep configuration and provide/inject values responsive to replacement, removal and nesting. Verify both ends of shared reactive contracts.
- Use computed for derivation and watch/lifecycle for actual effects. Do not introduce React lifecycle emulation, unnecessary callback caches, or module singletons holding application state.
- Retain valid Vue VNode ownership/clone handling; remove helpers only after tracing all consumers and proving redundancy.
- Keep necessary listener/observer/timer cleanup, SSR boundaries, async races, focus and event correctness. Internal typed data does not need repeated defensive checks, but external/public input boundaries still need their actual validation.

### Types and implementation restraint

- Keep runtime Props/Emits/Slots and exported Vue types consistent. Do not hide defects with `any`, broad `Function`, forced assertions or ignored diagnostics. Type-negative tests may use justified `@ts-expect-error`.
- New guards, fallback paths, retries and compatibility branches need a real supported input, known failure or concrete requirement. No speculative adapter, unused mode, silent success, empty catch or infinite retry.
- Prefer direct code. Abstract only real duplication with a stable boundary; do not rewrite reasonable code simply to demonstrate activity or delete necessary logic for fewer lines.
- New or changed type/behavior tests should cover the contract difference. Reuse existing coverage rather than cloning the implementation into tests.

## Collaboration, state and evidence

At most five parallel subtasks, each with explicit scope, ownership, dependencies and focused verification. Do not split artificial tasks to fill slots. Static imports determine impact; only explicit work dependencies block progress. Independent tasks can move on after stage-one checks without waiting for another component's final visual acceptance.

The integrator owns shared state, public exports, global configuration and progress views. Claim/release/complete through `registry:vue-native`; complete can consume a temporary `--report` and retain compact results in the task. Conflicts fail visibly, updates use a short exclusive lock and atomic replacement, and interruption preserves the recorded owner and evidence. Recover a writer lock only after its process has exited.

`historicalAcceptance` remains historical evidence; `architectureStatus` and `acceptanceStatus` express different claims. Keep only necessary evidence links and commands/results. Do not maintain current counts in chat, memory, per-batch receipts and progress pages independently; generate the page with `registry:progress`.

Historical root-alias, attrs, VNode ownership, context and resource-leak findings remain in the archived scan and `PITFALLS.md`. Their technical observations guide investigation; their old commands, numeric inventories and mandatory full-suite policies do not control current work.

## Scope and stop point

Stay within the user-authorized project scope. Ordinary workflow implementation choices do not require repeated approval. Deleting historical achievements, breaking public contracts or broadening the task requires the applicable user authorization. Project workflow authority does not extend to external platform permissions, security policy, licenses or unrelated business contracts.

For the workflow refactor itself, migrate state and evidence, switch active readers/writers, verify failure/recovery/ownership and remove retired mechanisms after references are moved. Stop when workflow verification is complete; do not resume component audits without user confirmation.
