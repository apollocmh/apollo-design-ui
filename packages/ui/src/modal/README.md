# Modal

Modal owns Vue events, slots and the current modal configuration. It shares the delivered Portal, Motion, Button and focus helpers; it does not import a React engine or a runtime style injector.

- `Modal.ts` resolves current mask, closable, focusable, width, semantic and theme inputs. Native attrs land once on the actual `role="dialog"` panel. `rootStyle` and `styles.root` target the outer root.
- `engine/` renders Portal → root/mask/wrapper → motion → panel. Motion completion controls `afterClose`, `afterOpenChange`, focus restoration and hidden destruction. The 500ms motion deadline remains necessary for environments without animation events.
- `ModalPanel.ts` supplies current locale/button configuration to the stable scoped `OkBtn` and `CancelBtn` components. Global disabled configuration does not disable these action buttons. Existing button override order is retained.
- `ConfirmDialog.ts` renders programmatic data and services. Confirm `body` semantics land on `-confirm-content`. `modalRender` and functional `footer` remain programmatic configuration; ordinary Modal content uses slots.
- `confirm.ts` owns a detached application's pending/open/closing/closed session. `useModal.ts` keeps `[api, holderVNode]`; the holder renders reactive session data in its actual Vue context. Setup-time commands, updates, close results and owner teardown use the same sessions. Closing/closed sessions reject later updates and cannot resurrect.
- `PurePanel.ts` renders inline without Portal/motion/mask. Its title/content slots override text props; an existing default slot remains the confirm body input when `#content` is absent.

Ordinary notifications are `ok`, `cancel`, `afterClose`, `afterOpenChange` and `update:open`. OK only notifies. Cancel, close button, mask and Escape request `open=false`; a controlled parent can refuse. With `open` withdrawn, the last accepted value remains. `confirmLoading` continues to block cancellation.

Use `#footer="{ OkBtn, CancelBtn }"` and `#modalRender="{ ModalPanel }"`; render scoped components with `<component :is="…" />`. Their identities remain stable while content changes. Empty slots hide content and zero is rendered. No focus/blur component methods are promised; `panelRef` receives the actual panel element and `null` when it is removed.

Command `onOk(close)` / `onCancel(close)` remain services: a returned promise controls loading and successful closing; a rejection keeps the session open. Hook commands return `ModalHookInstance`, a `PromiseLike<boolean>`: accepted OK resolves `true`, cancellation/programmatic destruction/owner teardown resolves `false`. Static commands return `ModalInstance` without a thenable promise. Both paths remove their `destroyAll` registrations on completion.

All six declared public tokens (`headerBg`, `footerBg`, `titleLineHeight`, `titleFontSize`, `titleColor`, `contentBg`) and their existing wireframe/default derivatives are projected from the current theme. Portal content and PurePanel receive the same variables; dynamic replacement/removal restores the appropriate defaults. Prefixes and locale are read from the current Provider.

Retained behavior: default width 520 (confirm 416), responsive widths, mask-drag protection, top-layer Escape, scroll locking through leave motion, focus trap only for fixed wrappers, existing mask-gated restoration, and explicit `focusable.autoFocusButton:null` disabling button autofocus. Root motion names follow `rootPrefixCls`; custom component prefixes change classes without renaming the static CSS variable namespace.

Stage-one evidence is recorded in `/tmp/apollo-modal-checks.json`. Historical Button content reference allowances, DOM baselines, S19 wrap/prefix regressions and static CSS token declarations remain unchanged. Full visual/coverage/release acceptance belongs to the final frozen library run.
