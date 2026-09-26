# modal 分析（G1）

> 契约来源：antd 6.6.4 `components/modal/`（**1405 行 / 10 文件**）+ `@rc-component/dialog@1.10.0`
> （**534 行 / 11 文件**）。上游是**兼容性规格**，不是代码来源。
>
> ⚠️ 本文件是 G1 的**第一遍**：已读文件规模、token 面、`shared.tsx` / `destroyFns` 的角色。
> **渲染结构 / rc-dialog 内核 / confirm 的命令式路径 / locale 文案** 在 G2 开工前必须补读（标 ⏳）。

## 0. 规模与「本批最大」

| 部分 | 行数 | 状态 |
|---|---|---|
| antd `Modal.tsx` | 335 | ❌ 本轮 |
| antd `ConfirmDialog.tsx` | 331 | ❌ 本轮 |
| antd `confirm.tsx`（命令式 `Modal.confirm`） | 198 | ❌ 本轮 |
| antd `PurePanel.tsx` | 117 | ❌ 本轮 |
| antd `shared.tsx` | 100 | ❌ 本轮 |
| antd `interface.ts` / `index.tsx` / `locale.ts` / `context.ts` / `destroyFns.ts` | 200 / 72 / 35 / 15 / 2 | ❌ 本轮 |
| **`@rc-component/dialog`** | **534 / 11 文件** | ❌ 需自建 |
| antd `style/` | ⏳ | ❌ 本轮 |

⇒ 本轮 = **rc-dialog 内核自建 + 组件壳 + confirm 命令式路径 + 样式层**，是这批里最大的一个。

## 1. 可复用的基建（都已就绪 ✅）

| 能力 | 提供方 | 备注 |
|---|---|---|
| `Portal`（含 `autoLock` 滚动锁 / `onEsc` 层栈） | `@apollo-design/portal` | **drawer 那轮刚补的**，modal 是第二个消费者 |
| `useScrollLocker` / `useEscKeyDown` | 同上 | 同上 |
| `useZIndex` / `zIndexContext` | 同上 | |
| `_internal/use-closable.ts` | ui | Tag 建、notification / drawer 复用；modal 是第三个消费者 |
| `useMergedMask` | `drawer/hooks/` | ⚠️ **三次法则已满足** ⇒ 本轮应提到 `_internal/` |
| `CSSMotion` / `MotionList` | `@apollo-design/motion` | |
| `useFocusRestore` | `@apollo-design/a11y` | 焦点归还 |
| `Button` / `Skeleton` / `Space` | `@apollo-design/ui` | confirm 的按钮、loading |

## 2. Token 面（已读 `style/index.ts:19-127`）

`ComponentToken` 的键（约 24 个，⏳ 具体默认值待补读 `prepareComponentToken`）：

`headerBg` / `titleLineHeight` / `titleFontSize` / `titleColor` / `contentBg` / `footerBg` /
`contentPadding` / `headerPadding` / `headerBorderBottom` / `headerMarginBottom` / `bodyPadding` /
`footerPadding` / `footerBorderTop` / `footerBorderRadius` / `footerMarginTop` /
`confirmBodyPadding` / `confirmIconMarginInlineEnd` / `confirmBtnsMarginTop` /
`modalHeaderHeight` / `modalFooterBorderColorSplit` / `modalFooterBorderStyle` /
`modalFooterBorderWidth` / `modalCloseIconColor` / `modalCloseIconHoverColor` /
`modalCloseBtnSize` / `modalConfirmIconSize` / `modalTitleHeight`

已读到的默认值：`footerBg: 'transparent'`、`headerBg: 'transparent'`、
`titleLineHeight: token.lineHeightHeading5`（`style/index.ts:460+`）。

## 3. 文件角色（第一遍结论）

| 文件 | 角色 |
|---|---|
| `Modal.tsx` | 组件本体：受控 `open`、`useModal`（内部 hook）、静态属性 `_InternalPanel*` |
| `ConfirmDialog.tsx` | `Modal.confirm/info/success/error/warning` 的对话框实现（含图标、按钮、`autoFocusButton`） |
| `confirm.tsx` | 命令式路径：`render` 到游离容器 + `destroyFns` 队列 + `update` |
| `PurePanel.tsx` | `_InternalPanelDoNotUseOrYouWillBeFired` |
| `shared.tsx` | 受控/非受控共用的壳（`useModal` 的返回、`sharedProps`） |
| `destroyFns.ts` | 命令式实例的销毁函数队列（2 行） |
| `locale.ts` | `Modal` 的按钮文案（`okText` / `cancelText` / `justOkText`） |
| `context.ts` | `ModalContext`（`confirm` 的默认配置传递） |

## 4. rc-dialog 内核结构（534 行 / 11 文件，⏳ 细节待补读）

```
DialogWrap.js          # 挂载/卸载与 portal 包裹
Dialog/index.js        # mask + content + 焦点/滚动/ESC 的组装
Dialog/Mask.js         # 遮罩
Dialog/Content/index.js        # 内容容器
Dialog/Content/Panel.js        # 面板（header/body/footer + close）
Dialog/Content/MemoChildren.js # children 的记忆化（避免无谓重渲染）
util.js / context.js / IDialogPropTypes.js / index.js
```

## 5. 行为契约（⏳ 待补读后逐条确认）

1. `open` 受控 + `afterClose` / `afterOpenChange`；
2. `mask` / `maskClosable`（⚠️ deprecated ⇒ `mask.closable`）/ `maskStyle`；
3. `keyboard`（ESC）+ `autoFocusButton`（confirm 的默认聚焦按钮）；
4. **焦点陷阱 + 焦点归还**（registry 备注里点名的 a11y 硬要求）；
5. `footer` / `okText` / `cancelText` / `okType` / `confirmLoading` / `okButtonProps` / `cancelButtonProps`；
6. `centered` / `width` / `zIndex` / `getContainer` / `destroyOnHidden`；
7. **命令式**：`Modal.confirm/info/success/error/warning` + `destroyAll` + `update`（`destroyFns` 队列）；
8. `useModal()`（hook 形态，返回 `[instance, contextHolder]`）；
9. `App.useApp()` 的 `modal` 实例（app 的 PENDING-2，本轮应回填）；
10. `loading` / `confirmLoading` 的按钮态。

## 6. 依赖缺口

| # | 缺口 | 说明 |
|---|---|---|
| P1 | **rc-dialog 内核自建**（534 行 / 11 文件） | 可复用 portal / motion / a11y |
| P2 | `useMergedMask` 提到 `_internal/` | 三次法则已满足（drawer 第二个、modal 第三个） |
| P3 | `App.useApp()` 的 modal 实例 | 同 message / notification 的 P1 |
| P4 | ConfigProvider 组件级覆盖 / 函数式语义槽 | staged / D36 |

## 7. 实现顺序

1. **补读**：`Modal.tsx` / `ConfirmDialog.tsx` / `confirm.tsx` / `shared.tsx` 全文 +
   `style/index.ts` 的 `prepareComponentToken` + rc-dialog 的 `DialogWrap` / `Dialog` / `Panel`
2. `interface.ts`（G2）
3. `useMergedMask` 提到 `_internal/`（P2，连带 drawer 的引用）
4. **rc-dialog 内核的 Vue 自建**（P1）→ `modal/engine/`
5. `style/token.ts` + `style/index.ts`（G3/G4，机械转换自 antd 产物）
6. `ModalPanel` / `Modal` / `ConfirmDialog` / `confirm`（命令式）/ `index`（静态方法 + `useModal`）
7. demo → 五层测试 → L6 → 文档 → registry → 收口

## 8. 风险预登记

- **规模最大**：antd 1405 + rc 534 ⇒ 分两次提交（内核 / 壳+confirm）更稳。
- **命令式路径的销毁队列**（`destroyFns`）容易漏「`destroyAll` 之后新开的实例要重新入队」。
- **焦点**：陷阱 + 归还 + `autoFocusButton` 三条都要有测试（registry 备注点名的 a11y 硬要求）。
- **L4/L6**：`open` 的 modal 走 portal ⇒ L4 用 **PurePanel**；L6 用受控 `open` +
  `getContainer={false}`（内联）以免污染其他组件的截图（同 drawer 的判据，PITFALLS 177）。
- **`useMergedMask` 搬家**要连带跑 drawer 的门禁（它是第二个消费者）。
