# modal 分析（G1）

> 契约来源：antd 6.6.4 `components/modal/`（**1405 行 / 10 文件**）+ `@rc-component/dialog@1.10.0`
> （**534 行 / 11 文件**）。上游是**兼容性规格**，不是代码来源。
>
> 状态：**第二遍（补读）完成 2026-09-26**。已读全文：`Modal.tsx` / `ConfirmDialog.tsx` /
> `confirm.tsx` / `shared.tsx` / `PurePanel.tsx` / `useModal/index+ HookModal` / `index.tsx` /
> `destroyFns` / `locale` / `context` / `components/*`（4 个按钮）/ `interface.d.ts` /
> `style/index.js` + `style/confirm.js` 的 `prepareComponentToken`，以及 rc-dialog 的
> `DialogWrap` / `Dialog` / `Dialog/Content` / `Panel` / `Mask` / `MemoChildren` / `util` /
> `context` / `index`。
>
> ⚠️ 产物恢复：`/tmp/antd-src` 本轮在（`npm pack antd@6.6.4`）；**rc-dialog 本地没有**，
> 本轮用 `npm pack @rc-component/dialog@1.10.0` 解到 `/tmp/rc-src/rc-dialog/`（PITFALLS 42）。

## 0. 规模与「本批最大」

| 部分 | 行数 | 状态 |
|---|---|---|
| antd `Modal.tsx` | 335 | ✅ 已读 |
| antd `ConfirmDialog.tsx` | 331 | ✅ 已读 |
| antd `confirm.tsx`（命令式 `Modal.confirm`） | 198 | ✅ 已读 |
| antd `PurePanel.tsx` | 117 | ✅ 已读 |
| antd `shared.tsx` | 100 | ✅ 已读 |
| antd `useModal/index + HookModal` | ~150 | ✅ 已读 |
| antd `interface.ts` / `index.tsx` / `locale.ts` / `context.ts` / `destroyFns.ts` | 200 / 72 / 35 / 15 / 2 | ✅ 已读 |
| **`@rc-component/dialog`** | **534 / 10 es 文件** | ✅ 已读，需自建 |
| antd `style/index.js` + `confirm.js` | 319 + 105 | ✅ 已读 |

⇒ 本轮 = **rc-dialog 内核自建 + 组件壳 + confirm 命令式路径 + 样式层**。

## 1. 可复用的基建（都已就绪 ✅）

| 能力 | 提供方 | 备注 |
|---|---|---|
| `Portal`（`autoLock` / `onEsc` 层栈） | `@apollo-design/portal` | drawer 那轮补的；modal 是第二个消费者 |
| `useZIndex` / `zIndexContext` | `@apollo-design/portal` | `useZIndex('Modal', zIndex)` |
| `useLockFocus`（焦点陷阱） | `@apollo-design/utils`（a11y 再导出） | 对应 rc-util `useLockFocus` |
| **`useFocusRestore`** | `@apollo-design/a11y` | ⭐ **契约来源就是 rc-dialog 1.10.0 的 `Dialog/index.js:53-95`** —— 三条门控（save/focusContent/restore）已实现，直接用 |
| `_internal/use-closable.ts` | ui | Tag 建、notification/drawer 复用；modal 是第四个消费者 |
| `useMergedMask` | `drawer/hooks/` | ⚠️ 三次法则满足 ⇒ 本轮提到 `_internal/` |
| `CSSMotion` | `@apollo-design/motion` | mask 的 fade、content 的 zoom |
| `Button` / `Skeleton` | `@apollo-design/ui` | Footer 的按钮、`loading` 的骨架 |
| `useLocale('Modal')` + `getConfirmLocale()` | `@apollo-design/locale` | **`confirm-locale.ts` 已按上游建好**（栈式语义 + `resetConfirmLocale` 测试辅助） |
| `useId` / `pickAttrs` / `isRenderable` / `isPlainObject` / `mergeProps` | `@apollo-design/utils` | |

## 2. Token 面（已读 `style/index.js`）

`prepareComponentToken` 的**全部默认值**（`wireframe` 分支已展开）：

| 键 | 默认值 |
|---|---|
| `footerBg` / `headerBg` | `'transparent'` |
| `titleLineHeight` | `token.lineHeightHeading5`（**unitless**，见 `genStyleHooks` 的 `unitless`） |
| `titleFontSize` | `token.fontSizeHeading5` |
| `contentBg` | `token.colorBgElevated` |
| `titleColor` | `token.colorTextHeading` |
| `contentPadding` | `wireframe ? 0 : '{paddingMD} {paddingContentHorizontalLG}'` |
| `headerPadding` | `wireframe ? '{padding} {paddingLG}' : 0` |
| `headerBorderBottom` | `wireframe ? '{lineWidth} {lineType} {colorSplit}' : 'none'` |
| `headerMarginBottom` | `wireframe ? 0 : token.marginXS` |
| `bodyPadding` | `wireframe ? token.paddingLG : 0` |
| `footerPadding` | `wireframe ? '{paddingXS} {padding}' : 0` |
| `footerBorderTop` | `wireframe ? '{lineWidth} {lineType} {colorSplit}' : 'none'` |
| `footerBorderRadius` | `wireframe ? '0 0 {borderRadiusLG} {borderRadiusLG}' : 0` |
| `footerMarginTop` | `wireframe ? 0 : token.marginSM` |
| `confirmBodyPadding` | `wireframe ? '{padding*2} {padding*2} {paddingLG}' : 0` |
| `confirmIconMarginInlineEnd` | `wireframe ? token.margin : token.marginSM` |
| `confirmBtnsMarginTop` | `wireframe ? token.marginLG : token.marginSM` |
| `mask` | `true` |

**`prepareToken` 派生的 8 个内部键**（不是 ComponentToken，是 `mergeToken` 出来的）：

| 键 | 公式 |
|---|---|
| `modalHeaderHeight` | `lineHeightHeading5 * fontSizeHeading5 + padding * 2` |
| `modalFooterBorderColorSplit` | `colorSplit` |
| `modalFooterBorderStyle` | `lineType` |
| `modalFooterBorderWidth` | `lineWidth` |
| `modalCloseIconColor` | `colorIcon` |
| `modalCloseIconHoverColor` | `colorIconHover` |
| `modalCloseBtnSize` | `controlHeight` |
| `modalConfirmIconSize` | `fontHeight` |
| `modalTitleHeight` | `titleFontSize * titleLineHeight` |

⚠️ registry 记的 `tokenCount: 6` 与实测 **24 个 ComponentToken 键** 不一致 ⇒ 收口时按实测修正
（registry 是生成物，改源后重跑；见 PITFALLS 56）。

## 3. 渲染树（补读结论 —— L4/L6 的判据）

### 3.1 rc-dialog 的树

```
Portal(open = visible || forceRender || animatedVisible, onEsc, autoDestroy: false,
       getContainer, autoLock = scrollLock && (visible || animatedVisible))     ← DialogWrap
└─ <div class="{p}-root [rootClassName]" style={rootStyle} {data-*}>           ← Dialog
   ├─ CSSMotion(key=mask, visible = mask && visible, leavedClassName="{p}-mask-hidden")
   │   └─ <div class="{p}-mask [motion] [classNames.mask]" style={{zIndex, ...maskStyle, ...styles.mask}} />
   └─ <div class="{p}-wrap [wrapClassName] [classNames.wrapper]"
   │        style={{zIndex, ...wrapStyle, ...styles.wrapper, display: !animatedVisible ? 'none' : null}}
   │        onClick={maskClosable ? onWrapperClick : null} onMouseDown={onWrapperMouseDown}>
   │      └─ CSSMotion(visible, removeOnLeave = destroyOnHidden, onVisibleChanged)   ← Content
   │          └─ <div class="{p} [className] [motion]" role="dialog" aria-modal="true"
   │                   aria-labelledby={title ? ariaId : null} tabIndex={-1}
   │                   style={{...motion, ...style, transformOrigin}}>            ← Panel
   │             └─ <div class="{p}-container [classNames.container]">
   │                ├─ closable && <button type="button" aria-label="Close" class="{p}-close" disabled>
   │                │     {closableObj.closeIcon}
   │                ├─ title && <div class="{p}-header"><div class="{p}-title" id={ariaId}>{title}</div></div>
   │                ├─ <div class="{p}-body">{children}</div>
   │                └─ footer && <div class="{p}-footer">{footer}</div>
```

**关键判据（逐条）**：

1. **`{p}` = `apollo-modal`**（antd 侧 `prefixCls`）；mask 在 `{p}-root` **内部**（不是兄弟）。
2. **`display: none` 而不是卸载**：`animatedVisible === false` 时 wrap 靠 inline `display:none`
   隐藏 —— `afterClose` 之后**节点仍在**（除非 `destroyOnHidden`）。
3. **`onWrapperClick` 的两个条件**：`maskClosable` **且** `e.target === wrapperRef.current`
   **且** `mouseDownOnMaskRef.current`（mousedown 也必须落在 mask 上）——
   **拖选文字后松开在 mask 上不关**（防误关）。
4. **`mask && visible`**：mask 的可见性比 content 多一个 `mask` 门。
5. **`aria-modal="true"` 恒在**；`aria-labelledby` **只在有 title 时**挂。
6. **`tabIndex: -1`** 挂在面板上（焦点陷阱的落点）。
7. **`doClose` 的时序**：`setAnimatedVisible(false)` → 焦点恢复（`mask && focusTriggerAfterClose`）
   → **仅当 `animatedVisible` 为真**才 `afterClose()`。
8. **`useEffect(visible)` 的 else 分支**：`visible=false && animatedVisible && enableMotion() && !inMotion()`
   ⇒ 立即 `doClose()`（处理「开了又立刻关、动效没跑」的受控场景）。
9. **`isFixedPos`**：读 wrap 的 `computedStyle.position === 'fixed'`，**焦点陷阱的门控**之一是它。
10. **`transformOrigin`**：`mousePosition` 有值时按 `offset(panel)` 算，否则 `''`；
    只在 `onAppearPrepare` / `onEnterPrepare` 时算。

### 3.2 antd Modal 的包裹

```
ContextIsolator(form, space)                          ← 本仓不落地（D36 同判）
└─ ZIndexContext.Provider(contextZIndex)              ← 本仓用 portal 的 provide
   └─ Dialog(...)                                     ← 上面那棵
```

- `loading` 时 children 换成 `<Skeleton active title={false} paragraph={{rows:4}} class="{p}-body-skeleton">`，
  且 **`footer` 强制为 null**（`footer !== null && !loading`）。
- `modalRender` 非空 ⇒ 包一层 `<div class="{p}-render">`，且 `panelRef` 的选择器
  从 `.{p}-container` 变成 `.{p}-render`。
- `width` 是对象（响应式断点）⇒ `numWidth = undefined` + 把每个断点写进
  `--{p}-{breakpoint}-width` 内联变量；否则 `numWidth = width`。
- `wrapClassNameExtended` = `[wrapClassName, centered && '{p}-centered', rtl && '{p}-wrap-rtl']`。

### 3.3 ConfirmDialog 的树

```
Modal(footer=null, _semanticOmit=['body'], _renderSemanticContent=<ConfirmContent/>)
└─ <div class="{p}-confirm {p}-confirm-{type} [{p}-confirm-rtl] [className]">   ← classString
   └─ <div class="{p}-confirm-body-wrapper">
      ├─ <div class="{p}-confirm-body [{p}-confirm-body-has-title] [{p}-confirm-body-no-icon]">
      │   ├─ icon
      │   └─ <div class="{p}-confirm-paragraph">
      │      ├─ hasTitle && <span class="{p}-confirm-title">{title}</span>
      │      └─ <div class="{p}-confirm-content [contentClassName]" style={contentStyle}>{content}</div>
      └─ footer === undefined || isFunction(footer)
         ? <div class="{p}-confirm-btns">[CancelBtn, OkBtn]</div>
         : footer
```

**关键判据**：

1. `width` 默认 **416**；`zIndex` 默认 **`token.zIndexPopupBase + CONTAINER_MAX_OFFSET`**。
2. `mask` 默认 **`closable: false`**（`normalizeMaskConfig` 后强制补 `closable ??= false`）
   —— **与 `Modal` 的 maskClosable 默认相反**。
3. `closable` 默认 **`false`**（静态方法的确认框没有右上角 ×）。
4. `mergedOkCancel = okCancel ?? type === 'confirm'`；`okText` 默认取
   `mergedOkCancel ? locale.okText : locale.justOkText`。
5. `autoFocusButton` 默认 **`'ok'`**（`base || base === null ? base : 'ok'` ——
   **显式 `null` 表示不自动聚焦**，不能当成 undefined）。
6. 5 种 type 的图标（`icon === undefined` 时才取默认）：
   `info` → `InfoCircleFilled`、`success` → `CheckCircleFilled`、
   `error` → `CloseCircleFilled`、其余（含 `confirm` / `warning` / `warn`）→ `ExclamationCircleFilled`。
   `icon: null` / `false` **显式隐藏**图标。
7. `onCancel` 的路径是 `close({triggerCancel:true})` + `onConfirm(false)`；
   `onOk` 是 `close(...)` + `onConfirm(true)`。`onConfirm` 就是 HookModal 的 `resolvePromise`。
8. `ConfirmContent` 末尾渲染一个 **空的 `<Confirm/>` 样式占位组件**（只为了挂 confirm 的样式）。

## 4. 命令式路径（`confirm.tsx` + `destroyFns`）

```
confirm(config)
├─ container = document.createDocumentFragment()        ← 不进 document
├─ currentConfig = { ...config, close, open: true }
├─ destroy(...args): triggerCancel ⇒ config.onCancel?.(()=>{}, ...)
│                   从 destroyFns 里移除自己 → unmount(container)
├─ scheduleRender(props): clearTimeout + setTimeout(0)  ← 异步渲染（#23623：同步渲染会挡事件）
├─ close(...args): currentConfig = { open:false, afterClose: () => { config.afterClose?.(); destroy(...args) } }
├─ update(cfg): 函数 ⇒ cfg(currentConfig)；对象 ⇒ 浅合并；然后 scheduleRender
├─ scheduleRender(currentConfig)   ← 首次
└─ destroyFns.push(close)          ← ⚠️ 入队
```

**关键判据**：

1. **`destroyFns` 是模块级单例数组**，`Modal.destroyAll()` = `while (destroyFns.length) destroyFns.pop()()`。
2. ⚠️ **`destroyAll` 之后新开的实例要重新入队** —— `confirm()` 末尾的
   `destroyFns.push(close)` 是**每次调用都执行**的，所以自然满足；**风险点在于实现时
   把 push 写进「首次创建」的分支**（本轮预登记的风险）。
3. `destroy` 里**遍历移除自己**（不是 `pop`）—— 因为 `destroyAll` 已经 pop 过了。
4. `close` 不直接卸载：先 `open: false` 触发关闭动效，动效结束的 `afterClose`
   才 `destroy()`。
5. `update` 走的是 `scheduleRender`，即**异步**。
6. 静态方法 = `confirm(withXxx(props))`，其中 `withXxx` 只是补 `type`：
   `info/success/error/confirm` 直接补；`warning` **和 `warn` 是同一个函数**（补 `'warning'`）。
7. `Modal.config` = `modalGlobalConfig`（只设 `defaultRootPrefixCls`）——**已废弃**，
   dev 警告指向 `ConfigProvider.config`。

### 4.1 `useModal()` 的 hook 形态

```
useModal() ⇒ [fns, contextHolder]
  fns = { info, success, error, warning, confirm }   ← 每个都是 getConfirmFunc(withXxx)
  每次调用：
    uuid++
    promise = new Promise(resolve => resolvePromise = resolve)
    modal = <HookModal key={`modal-${uuid}`} config ref afterClose isSilent onConfirm={c => resolvePromise(c)} />
    closeFunc = holderRef.current?.patchElement(modal)
    if (closeFunc) destroyFns.push(closeFunc)        ← ⚠️ 同样入队
    instance = { destroy, update, then(resolve) }     ← thenable
```

- `then()` 会把 `silent = true`（⇒ `isSilent()` 为真，**静默关闭**：不触发 onCancel 等）。
- `destroy` / `update` 在 `modalRef.current` 还没就绪时**入 `actionQueue`**，
  在 `useEffect(actionQueue)` 里回放。
- `HookModal` 内部：`open` state + `innerConfig` state + `useImperativeHandle({destroy, update})`，
  渲染 `ConfirmDialog`，`okText/cancelText` 用 `fallbackProp(innerConfig.x, locale.x)`。

## 5. locale 文案

`Modal` 的三个键（本仓 `packages/locale` 已具备，**无需新增**）：

| 键 | en_US |
|---|---|
| `okText` | `'OK'` |
| `cancelText` | `'Cancel'` |
| `justOkText` | `'OK'` |

模块级 `getConfirmLocale()` / `changeConfirmLocale()` 在 `packages/locale/src/confirm-locale.ts`
**已按上游实现**（栈式 + `resetConfirmLocale` 测试辅助）。

## 6. 焦点三条（registry 点名的 a11y 硬要求）

| # | 要求 | 上游实现位置 | 本仓落点 |
|---|---|---|---|
| 1 | **焦点陷阱** | rc-dialog `Panel`：`useLockFocus(visible && isFixedPos && focusTrap !== false, () => internalRef.current)` | `utils` 的 `useLockFocus`（同 rc-util 对应物）+ Panel 的 `onFocus` 里 `ignoreElement(e.target)` |
| 2 | **焦点归还** | rc-dialog `Dialog.doClose`：`mask && focusTriggerAfterClose` ⇒ `lastOutSideActiveElementRef.focus({preventScroll:true})` | `a11y` 的 `useFocusRestore`（`save` / `focusContent` / `restore` 三条门已实现） |
| 3 | **`autoFocusButton`** | `ConfirmDialog`：`base \|\| base === null ? base : 'ok'` | ConfirmOkBtn / ConfirmCancelBtn 的 `autoFocus` prop |

⚠️ 陷阱的门控链：`focusTrap !== false`（antd 侧 = `mergedFocusable.trap`，默认 `mergedMask`）
**且** `visible` **且** `isFixedPos`。

## 7. 依赖缺口

| # | 缺口 | 说明 |
|---|---|---|
| P1 | **rc-dialog 内核自建**（534 行 / 10 文件） | 可复用 portal / motion / utils / a11y |
| P2 | `useMergedMask` 提到 `_internal/` | 三次法则已满足（drawer 第二个、modal 第三个） |
| P3 | `App.useApp()` 的 modal 实例 | 现为 `stubModal`（`app/App.ts:58`）；本轮用 `useModal` 回填 |
| P4 | ConfigProvider 组件级覆盖 / 函数式语义槽 | staged / D36（只保留对象形态） |

## 8. 实现顺序

1. ✅ **补读**（本文件第二遍）
2. `interface.ts`（G2）
3. `useMergedMask` 提到 `_internal/`（P2，连带 drawer 的引用）
4. **rc-dialog 内核的 Vue 自建**（P1）→ `modal/engine/`（`DialogWrap` / `Dialog` / `Content` / `Panel` / `Mask` / `MemoChildren` / `util` / `context`）
5. `style/token.ts` + `style/index.ts`（G3/G4）
6. `ModalPanel`(Footer) / `Modal` / `ConfirmDialog` / `confirm`（命令式）/ `index`（静态方法 + `useModal`）/ `PurePanel`
7. demo → 五层测试 → L6 → 文档 → registry → 收口

## 9. 风险预登记

- **规模最大**：antd 1405 + rc 534 ⇒ **分两次提交**（① 分析 + interface + 内核；② 壳 + confirm + 样式 + 测试 + 文档）。
- **`destroyFns` 队列**：`destroyAll` 之后新实例要**重新入队**（见 §4 判据 2）。
- **焦点三条**都要有测试（§6）。
- **`{p}-root` 里包 mask**：容易写成兄弟节点 ⇒ L4/L6 会抓到。
- **`display:none` 而非卸载**：L4 断言要覆盖「关闭后节点仍在」。
- **L4/L6 走 `getContainer={false}` 内联 / PurePanel**（PITFALLS 177）。
- **`useMergedMask` 搬家**要连带跑 drawer 的门禁（它是第二个消费者）。
- **`mask` 默认值三处不同**：`Modal`（closable 默认 true）、`ConfirmDialog`（closable 默认 false）、
  `PurePanel`（不涉及）—— 别统一。
