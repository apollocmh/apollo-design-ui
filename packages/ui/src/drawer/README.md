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
├── hooks/useMergedMask.ts
├── interface.ts / index.ts
└── style/{token.ts,index.ts}
```

- **尺寸轴随方位**：`left/right` 用 width、`top/bottom` 用 height；rc 的 378 兜底只管水平，
  垂直靠 `defaultSize`（antd 默认传 378）。
- **push 只由子抽屉触发**：`pushed` 由子抽屉调 `context.push()` 置真；`push` prop 只给距离。
- **`getContainer === false` ⇒ 内联渲染**：根类加 `{p}-inline`（CSS 把 position 从 fixed
  改成 absolute）。⚠️ 这一条**是 L6 抓出来的**（漏传 `inline` 导致 9 张图全红）。
- **`toCssSize`**：`wrapperStyle.width` 必须带 px 字符串，裸数字会被 Vue 静默丢弃
  （PITFALLS 170 / D94）。本包的实现在 `engine/util.ts`（与 `image/util.ts` 同实现，
  第三个消费者出现时提到 `_internal/`）。

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
