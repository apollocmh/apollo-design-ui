# modal

> **层**：L3（`packages/ui`）｜ **优先级**：P3 ｜ **复杂度**：L ｜ **antd 版本**：6.6.4
>
> 契约来源：antd `components/modal/`（Modal 335 / ConfirmDialog 331 / confirm 198 /  
> PurePanel 117 / shared 100 / useModal ~150 / interface 200 / style 424）
>
> - `@rc-component/dialog@1.10.0`（534 行 / 10 文件）。  
>   上游是**兼容性规格**，不是代码来源。

## 1. 职责

模态对话框：遮罩与滚动锁、焦点陷阱与归还、zoom/fade 动效、语义化槽位、  
以及**命令式路径**（`Modal.confirm/info/success/error/warning` + `destroyAll` + `useModal`）。

## 2. 文件布局与关键决策



```
modal/
├── Modal.ts         # antd 侧壳：mask / focusable / zIndex / closable / 语义槽 / 响应式宽度 / loading
├── ModalPanel.ts    # antd shared.tsx：renderCloseIcon + Footer（+ DisabledContext(false)）
├── ConfirmDialog.ts # ConfirmContent + ConfirmDialog（5 种 type / autoFocusButton / mask.closable 默认 false）
├── components/      # ActionButton（防重复点击 + 异步 onOk 的 loading + autoFocus）
│                    #   + NormalOkBtn / NormalCancelBtn / ConfirmOkBtn / ConfirmCancelBtn
├── confirm.ts       # 命令式：游离容器 + createApp + destroyFns 队列 + close/update
├── useModal.ts      # ElementsHolder + HookModal + actionQueue + thenable instance
├── PurePanel.ts     # _InternalPanelDoNotUseOrYouWillBeFired
├── context.ts / destroyFns.ts / util.ts
├── engine/          # ⭐ rc-dialog 的 Vue 自建
│   ├── DialogWrap.ts  # Portal（autoLock / onEsc）+ destroyOnHidden 短路 + afterClose 三步
│   ├── Dialog.ts      # root + mask + wrap + 焦点归还 + isFixedPos
│   ├── Content.ts     # CSSMotion + transformOrigin
│   ├── Panel.ts       # 三段结构 + 关闭按钮 + role/aria + 焦点陷阱
│   ├── Mask.ts / MemoChildren.ts / context.ts / util.ts
├── interface.ts / index.ts
└── style/{token.ts,index.ts}
```

### 三条必须记住的实现判据

1. **动效名前缀是 `rootPrefixCls`**（`apollo-zoom` / `apollo-fade`），**不是**组件前缀。  
   antd 传 `getTransitionName(rootPrefixCls, 'zoom')` ⇒ `style/index.ts` 里那批  
   `.apollo-zoom-*` / `.apollo-fade-*` **裸类**规则才命中。传错时动效**静默失效**。
2. **`setup()` 里不能创建带 `ref` 的 vnode**（Vue 的 `normalizeRef` 用  
   `currentRenderingInstance` 当 owner）⇒ `useModal` 的 holder 实例走 `onReady` 回调、  
   `HookModal` 的句柄走 **prop 传 `Ref` 对象**。写成 vnode 的 `ref` 会得到  
   `Missing ref owner context` 且 ref **永远不生效**（PITFALLS 178）。
3. **关闭是异步的**：`close()` 只把 `open` 置假，卸载发生在**离场动效结束**的  
   `afterClose` 里 ⇒ 测试必须轮询（PITFALLS 179）。

### 其它易错点

- **`Skeleton` 是 `inheritAttrs: false`** ⇒ 传 `className` **prop**，`class` 会被静默丢弃。
- **`PurePanel` 的类名不含 `prefixCls`** —— `Panel` 的根类已经会加它。
- **`MemoChildren` 缓存 slot 求值结果**（`!shouldUpdate` 时返回同一个 vnode）——  
  Vue 的 `patch` 首行 `if (n1 === n2) return` 让这等价于 React 的 memo。
- **`Content` 加了 `motionDeadline: 500`**（上游没有）：样式表没加载时 CSS 事件不来，  
  没有 deadline 会卡在 active、`afterClose` 不触发（D104）。

## 3. 与 antd 的差异

登记于 `COMPATIBILITY.md` §9.2：**D100**（命令式宿主用游离 `div`，同 D96）、  
**D101**（PurePanel 不包 `withPureRenderTheme`）、**D102**（L4 过滤器补 `css-var-*` 形态）、  
**D103**（无 `ContextIsolator`，同 D36）、**D104**（`Content` 加 `motionDeadline` 兜底）；  
§9.2.1 的 **U11**（`autoFocusButton` 的 `||` 吃掉 `null` —— 只有 deprecated 的顶层  
`autoFocusButton: null` 能表达「不聚焦」）。

## 4. Component Token 清单

registry 数据：token 数 = **6**（公开面）。

| token                   | 来源                   | 默认                 |
| ----------------------- | -------------------- | ------------------ |
| `headerBg` / `footerBg` | 字面量                  | `transparent`      |
| `titleLineHeight`       | `lineHeightHeading5` | 1.5（**unitless**）  |
| `titleFontSize`         | `fontSizeHeading5`   | 16                 |
| `titleColor`            | `colorTextHeading`   | `rgba(0,0,0,0.88)` |
| `contentBg`             | `colorBgElevated`    | `#ffffff`          |

另有 **12 个 internal**（落 CSS 变量、不在公开类型面）：`contentPadding` /  
`headerPadding` / `headerBorderBottom` / `headerMarginBottom` / `bodyPadding` /  
`footerPadding` / `footerBorderTop` / `footerBorderRadius` / `footerMarginTop` /  
`confirmBodyPadding` / `confirmIconMarginInlineEnd` / `confirmBtnsMarginTop`  
—— 全部随 `wireframe` 切换两套值。

以及 **9 个 `prepareToken` 派生**（`calc()` 内联，**不落** CSS 变量）：  
`modalHeaderHeight` / `modalFooterBorder{ColorSplit,Style,Width}` /  
`modalCloseIcon{Color,HoverColor}` / `modalCloseBtnSize` / `modalConfirmIconSize` /  
`modalTitleHeight`。

## 5. 已知缺口

| #  | 缺口                                                    | 说明                                                          |
| -- | ----------------------------------------------------- | ----------------------------------------------------------- |
| P1 | `App.useApp()` 的 `modal` 实例                           | `app/App.ts` 里仍是 `stubModal`；本轮已提供 `useModal`，回填是 `app` 侧的事 |
| P2 | ConfigProvider 组件级 `classNames` / `styles` / token 覆盖 | staged（同 image/message/notification）                        |
| P3 | 函数式语义槽的**类型面**                                        | 运行时已支持（`useMergeSemantic`），类型按 D36 只声明对象形态                  |
| P4 | `holderRender` / `warnContext`                        | D30 同源（D100）                                                |
| P5 | `ContextIsolator`（form / space）                       | D36（D103）                                                   |

## 6. 收口证据（G13）

- L1/L2 24 / 内核 19 / L3 11 / L4 9（基线 `tests/compat/baselines/modal.dom.json`）/  
  L5 35（含焦点三条）/ L7(theme) 17 / demo 23（`expectCount` 钉死）/ L6 9/9
- registry 11 维 done，`status: completed`
