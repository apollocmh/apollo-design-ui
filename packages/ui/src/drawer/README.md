> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

# drawer

> **层**：L3（`packages/ui`）｜ **优先级**：P3 ｜ **复杂度**：M ｜ **antd 版本**：6.6.4
>
> 契约来源：antd `components/drawer/`（Drawer 369 / DrawerPanel 249 / useFocusable 26 /
> style 357 + motion 80）+ `@rc-component/drawer@1.4.2`（449 行 / 7 文件）。
> 上游是**兼容性规格**，不是代码来源。

## 1. 职责

从屏幕边缘滑出的浮层面板：四向定位、尺寸预设与拖拽改尺寸、遮罩（可模糊/可点关）、
嵌套推挤、焦点陷阱、语义化槽位。

## 2. 文件布局与关键决策

```
drawer/
├── Drawer.ts       # antd 侧壳：尺寸/mask/zIndex/焦点/语义槽/9 条 deprecated
├── DrawerPanel.ts  # antd 侧面板：header(title/extra/close) / body / footer（loading ⇒ Skeleton）
├── PurePanel.ts    # _InternalPanelDoNotUseOrYouWillBeFired（{p}-pure + {p}-{placement}）
├── engine/         # ⭐ rc-drawer 的 Vue 自建
│   ├── Drawer.ts        # open 归一化（首帧不开门）+ 焦点还原 + Portal 包裹
│   ├── DrawerPopup.ts   # mask + 面板 + 动效 + push + resizable
│   ├── DrawerSection.ts # rc 的 panel（{p}-section div，role=dialog aria-modal）
│   ├── useDrag.ts / useFocusable.ts / context.ts / util.ts
├── interface.ts / index.ts
└── style/{token.ts,index.ts}
```

> ⚠️ `useMergedMask` 2026-09-26 已按三次法则（drawer 第二个、modal 第三个）从
> `drawer/hooks/` 提到 `packages/ui/src/_internal/use-merged-mask.ts`；drawer 从那里引用。

- **尺寸轴随方位**：`left/right` 用 width、`top/bottom` 用 height；rc 的 378 兜底只管水平，
  垂直靠 `defaultSize`（antd 默认传 378）。
- **push 只由子抽屉触发**：`pushed` 由子抽屉调 `context.push()` 置真；`push` prop 只给距离。
- **`getContainer === false` ⇒ 内联渲染**：根类加 `{p}-inline`（CSS 把 position 从 fixed
  改成 absolute）。⚠️ 这一条**是 L6 抓出来的**（漏传 `inline` 导致 9 张图全红）。
- **`toCssSize`**：`wrapperStyle.width` 必须带 px 字符串，裸数字会被 Vue 静默丢弃
  （PITFALLS 170 / D94）。本包的实现在 `engine/util.ts`（与 `image/util.ts` 同实现，
  第三个消费者出现时提到 `_internal/`）。
- **C8-R2（VNode prop → slot）**：公开 `Drawer` / `DrawerPurePanel` 的 `footer` / `extra` /
  `closeIcon` 已删除改为同名 slot（`#footer` / `#extra` / `#closeIcon`，空 slot = 隐藏）；
  `title` 收窄为 `string`（富标题走 `#title` slot，slot 优先）。内部 `DrawerPanel` 仍保留
  VNode prop（由父组件透传，无模板上下文，VNode prop 合法）。

## 3. 与 antd 的差异

登记于 `COMPATIBILITY.md` §9.2：**D96**（命令式 holder 用游离 div —— 本组件不涉及，
但 `Portal` 的两个新能力同批）、**D99**（`useClosable` 的 closeLabel 注入点在 drawer 是
**button** 而不是图标 vnode —— 与 notification 的 D98 同族、注入点不同）。

L6 视觉 9 张（3 variant × 3 viewport，受控 `open` + 内联）**全部 0.000% exact**。

## 4. Component Token 清单

registry 数据：token 数 = 4。

| token | 来源 |
|---|---|
| `zIndexPopup` | `zIndexPopupBase` = **1000（不加偏移）** |
| `footerPaddingBlock` | `paddingXS` = 8 |
| `footerPaddingInline` | `padding` = 16 |
| `draggerSize` | 4 |

## 4.5 push 链路 / 焦点归还 / 标题 ARIA（Issue #20）

1. 🚨 **外层→引擎的 prop 必须逐个显式传**：`push` 是外层公开 prop，而引擎 `Drawer`（rc 层）
   没有声明它 —— 不显式传就进不了 `DrawerPopup`（那里才有 `distance ?? parent ?? 180`），
   自定义推挤距离会静默退化成 180。凡是「外层有、引擎没声明」的 prop 都要这么检查一遍。
2. 🚨 **焦点来源不能在渲染期清空**：rc 只在 `mergedOpen` **变真**那一帧记
   `document.activeElement`（`useLayoutEffect([mergedOpen])`），**从不**在关闭时清。
   本仓改成「渲染期 `!mergedOpen ⇒ null`」后，`afterOpenChange(false)`（离场动效之后）
   拿到 null ⇒ 焦点回不去。现在用 `prevMergedOpen` 只在「未开→开」记录，归还时用完即清，
   并加 `isConnected` 安全回退。
3. 🚨 **标题 ARIA 要在渲染期判定**：`titleSlot`/`hasTitle`/`ariaId` 写进 setup 是快照 ⇒
   标题由「有」变「无」后 `aria-labelledby` 还指向已不存在的节点。用普通函数每渲染现读
   （不要用 computed —— slot 从「无」到「有」时 computed 不失效）。
4. ⚠️ **jsdom 下 CSSMotion 不推进**：`afterOpenChange` 连「打开」那次都不触发 ⇒ 焦点归还
   只能在**引擎层**手动驱动 `afterOpenChange(false)` 验证（见 `s20-issue20.test.ts`）。

## 5. 已知缺口

| # | 缺口 | 说明 |
|---|---|---|
| P1 | ConfigProvider 组件级 `classNames` / `styles` / token 覆盖 | staged（同 image/message/notification） |
| P2 | 函数式语义槽 | D36 同判（只支持对象形态） |
| P3 | watermark 的 `usePanelRef` | antd 用它把面板根注册给水印；本仓未接 |
| P4 | `holderRender` / `warnContext` | D30 同源（不涉及本组件，但同一批决策） |

## 6. 收口证据（G13）

- L1+L2 20（内核 10 + antd 侧 10）/ L3 8 / L4 4（基线 `tests/compat/baselines/drawer.dom.json`）/
  L5 19 / L7(theme) 16 / demo 18（`expectCount` 钉死）/ L6 **9/9 0.000% exact**
- registry 11 维 done，`status: completed`
