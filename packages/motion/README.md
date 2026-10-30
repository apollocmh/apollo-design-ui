# @apollo-design/motion

CSSMotion and MotionList coordinate CSS animation phases, DOM measurements and completion. They generate class/style timelines without shipping CSS or choosing component visuals. Vue owns rendering, scoped slots, notifications, attrs, refs and disposal. The established frame/status algorithm and historical 002/hydration evidence remain in [the contract](../../docs/foundation/motion-contract.md).

## CSSMotion

| Prop | Meaning | Default |
| --- | --- | --- |
| visible | Requested visibility; the component does not mutate it | false |
| motionName | CSS class prefix; no name means no CSS animation | - |
| motionAppear / motionEnter / motionLeave | Enable the corresponding phase | true |
| motionLeaveImmediately | Allow an initial hidden node to leave | false |
| motionDeadline | Fallback deadline in milliseconds, read when a phase becomes active | 0 |
| removeOnLeave | Remove the element after leave | true |
| forceRender | Keep a hidden element rendered | false |
| leavedClassName | Class for an already rendered retained node | - |
| hooks | Prepare, start, active and end service callbacks | - |
| supportMotion | Explicit environment/preference input; otherwise detect CSS support | Detected |

The native default slot receives `{ className, style, visible, status, step }`. Bind className/style to the actual animated root. There must be one element or component root; native Fragments, conditional comments and empty content are supported without adding a layout host. Multiple real roots and text-only animation targets report a clear error instead of silently discarding siblings. Animate multiple elements with MotionList, or provide an explicit root yourself.

Native attrs merge onto that root, including class/style/listeners, while its existing Vue ref remains bound. `@visibleChanged="handler"` is an owned Vue event: it fires after the requested visibility settles, skips an initially hidden idle node, and supports current listeners and listener arrays. It is the only component completion channel; `hooks.onVisibleChanged` is removed.

Prepare callbacks may return a Promise, start/active return style or nothing, and end returns false to veto completion. They remain functions because their results control the animation. Current phase flags apply to subsequent visibility transitions; current hook functions are read at each phase step/end. Render options and CSS names remain reactive. Replacing an active root moves its end listeners; unmount cancels frames, deadlines and pending DOM work. A preparation rejection aborts only its own generation, releases resources and reaches Vue’s transition error handling. It does not silently succeed or retry.

## MotionList

`keys` accepts a readonly list of keys or key objects carrying business data. MotionList has a real generic functional public entry in TypeScript: the same type parameter covers keys and the actual slot context, while the existing Vue state loop stays in a private core. It makes no public constructor/ref/expose promise and needs no constructor assertion or SFC build support. Keys keep the established String normalization; numeric 0 and strings such as constructor/__proto__ remain valid. Key object data survives leave until removal finishes. The default slot receives this retained data plus the CSSMotion fields, `itemKey: string` and `index: number`; motion fields take precedence over conflicting metadata.

`component` selects the wrapper (default div); false/null omit it. Native attrs land on an existing wrapper, including a functional/component wrapper’s normal Vue attrs contract. An unwrapped list has no native attr target: bind per-item attrs in the slot instead of expecting one id or listener to be spread over multiple roots.

The animation props are the same as CSSMotion. `@visibleChanged` forwards each item’s settled visibility, replacing the former hook notification. `@allRemoved` fires once when all requested removals finish. A reintroduced key cancels its pending leave; finished list entries are removed even when standalone CSSMotion would retain an element.

## Composables and boundaries

useMotionStatus accepts values or getters for current animation/render configuration. Its callback is a composition service, while component notifications use Emits. createMotionDriver stays framework independent: its phase hooks control the timeline; onVisibleChanged and onError are driver options for host integration. No Vue dependency is added to the driver. Public component/slot types are exported with the existing state, scheduler, support and preset APIs.

The package has no Token, CSS generator, Portal dependency, MotionProvider, global preference subscription or useMotion API. UI consumers supply CSS, delay/stagger and reduced-motion policy through their existing configuration. These unimplemented historical plans are not advertised as completed APIs.

Related core behavior, types and necessary real-DOM/browser consumers are the architecture-stage gate. The final frozen library version retains the project’s separate full acceptance step; historical PoC, hydration and visual results are not a fresh full-library pass.
