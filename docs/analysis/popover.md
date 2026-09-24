# popover 分析（G1）

契约来源：antd 6.6.4 `components/popover/`（index.tsx 192 行 / PurePanel.tsx /
style 259 行）+ `@rc-component/tooltip` 的 `Popup`（PurePanel 复用）。上游是
**兼容性规格**。参考源已解包：`/tmp/ant-design-master/components/popover/`、
`/tmp/antd-src/package/es/popover/`。

## 1. 结构结论：Popover = Tooltip 的薄包装

- 主组件把 `overlay` 通道换成 **Overlay**（`{p}-title` + `{p}-content` 两块 div），
  其余（Trigger/portal/motion/开合协议）全部复用 Tooltip。
- `prefixCls='popover'` ⇒ 浮层 DOM 类名 `apollo-popover-container` /
  `apollo-popover-title` / `apollo-popover-content`（container 由 Tooltip 渲染）。
- 动画：`getTransitionName(root, 'zoom-big')` ⇒ `apollo-zoom-big-*`（tooltip 是
  zoom-big-**fast**）。zoom-big 的 keyframes 内容与 zoom-big-fast 完全一致
  （antd 共享 antZoomBigIn/Out），本仓按组件命名（D5/D7 同判）：
  `apollo-popover-zoom-big-in/-out`。

## 2. API 面（Vue 化）

- 继承 TooltipProps 全部（复用 `@apollo-design/ui` 的 TooltipProps 类型 +
  Trigger 全协议），新增：
  - `content: TooltipContent`（标题/内容双通道；`title`/`content` 皆可为函数）
  - `classNames/styles` 增加 `title` / `content` 两个语义槽
- `onOpenChange` 告警（antd usage 警告「第二参数不支持」在 Vue 无意义，跳过 ——
  回调本来就是单参）。
- ConfigProvider.popover **不消费**（D29：UniqueProvider 未实现，config 不声明）；
  走 `useComponentConfig('popover')` 的 `components` 逃生口等价物 —— 与 Tooltip
  的 context 消费同一模式。

## 3. 行为契约（L1 断言源）

1. `title` 与 `content` **都为空 ⇒ 浮层不渲染**（noTitle 抑制，复用 Tooltip 的
   noTitle 判定 —— Popover 传 overlay=Overlay vnode，需在 Popover 层先判空：
   antd 是 `isReactRenderable(title)||isReactRenderable(content)` 才传 overlay，
   否则传 null ⇒ Tooltip 的 noTitle 生效）。
2. `title=0` / `content=0` 合法（`getRenderPropValue` 与 isReactRenderable 对 0
   的判定 —— antd 的 isReactRenderable 对 0 返回 true？否：0 不是 renderable
   的 ReactNode？—— **antd `isReactRenderable` 排除 null/undefined/boolean**，
   0 属于 renderable。本仓等价物：`!== null && !== undefined && typeof !== 'boolean'`）。
3. `title` / `content` 可为函数（RenderFunction，惰性求值）。
4. `-placement-{placement}` 类、预设色 `{p}-{color}` 类、`-hidden` 残骸 —— 全部
   由样式层/Trigger 承担，Popover 无额外逻辑。
5. PurePanel：root 带 `apollo-popover apollo-popover-pure apollo-popover-placement-{placement}`，
   含箭头空 div + container（结构比 tooltip 的 PurePanel 多 placement 类 + arrow div
   —— 以 L4 基线为准逐字对齐）。
6. expose：`TooltipRef`（forceAlign/nativeElement/popupElement）透传。

## 4. Token（registry 组 token 数 = 4）

titleMinWidth=177、zIndexPopup=1000+30=1030、innerPadding=12、titleMarginBottom=8
（+ titlePadding=0 / titleBorderBottom=none / innerContentPadding=0 非线框缺省 +
arrow 5 件套，contentRadius=borderRadiusLG=8、limitVerticalRadius=true）。
wireframe 不做（本仓无 wireframe 主题态，登记差异）。

## 5. 样式提取

管线同 tooltip（`tests/visual/debug/extract-popover.mjs`，React SSR +
extractStyle）：79 条规则。转换差异：
- 过滤条件 `ant-popover` + `zoom-big`（非 fast）。
- 动画名 → `apollo-popover-zoom-big-in/-out`；keyframes 本轮 SSR 已能吐出
  （zoom-big 段），内容与 tooltip 手抄版一致。
- **丢弃 tooltip css-var 死块**（`.ant-popover-css-var` 上的 tooltip 变量，
  D69 同判 —— popover 规则所需的 `--apollo-tooltip-arrow-offset-x` 等全部由
  placement 规则本地定义，无需 tooltip 块）。
- antd 的 popover token 声明块（`.css-var-_R_0_.ant-popover`）→
  `genPopoverTokenDecls()` 挂根 `.apollo-popover`（D69 同判）。
- `--ant-tooltip-valid-offset-x` → `--apollo-tooltip-valid-offset-x`（与 tooltip
  同款本地运行时变量）。

## 6. 差异预登记（→ COMPATIBILITY）

| # | 差异 | 判定 |
|---|---|---|
| D83 | ConfigProvider.popover 不消费（D29 同判） | INTENDED |
| D84 | wireframe 主题态不支持（titlePadding/titleBorderBottom 取非线框值） | INTENDED |
| D85 | `data-popover-inject` attr 不渲染（React 注入标记，Vue 无对应语义） | INTENDED |

## 7. 实现顺序

token.ts → style/index.ts（生成器）→ interface.ts → Popover.ts → PurePanel.ts →
index.ts/barrel/COMPONENT_STYLES → demo ×12 → L1/L4/L5/L7/L3 → L6 → registry →
docs → 门禁 → push。
