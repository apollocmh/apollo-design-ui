# float-button · G1 分析产物

> 契约来源：antd 6.6.4 `components/float-button/`（FloatButton 228 + Group 344 +
> BackTop 121 + PurePanel 69 + index 14 + context 15 + util 10 + style 378 =
> **1079 行**）。Token = **0**（ComponentToken = object）。
> 上游是**兼容性规格**，不是代码来源。

## 1. 结构判定（4 个导出面 + 1 个 context + 1 个 hook）

```
float-button/
├── FloatButton.ts   # 薄壳：包装 Button（本仓已实现 shape/href/icon/语义面）
├── FloatButtonGroup.ts  # 列表 + menu 模式（trigger click/hover + CSSMotion）
├── BackTop.ts       # 滚动可见性 + showProgress + scrollTo（复用 back-top 基建）
├── PurePanel.ts     # 调试面板（items → Group）
├── context.ts       # GroupContext（shape/individual/classNames/styles 注入）
└── style/index.ts   # genFloatButtonStyle + genGroupStyle（机械转换，378 行）
```

无 engine/。依赖组件全部已收口：badge / config-provider / flex / space(Compact) / tooltip。

## 2. FloatButton（壳 12 件事）

1. `floatButtonPrefixCls = 'float-btn'`（antd 逐字；root 类 `.apollo-float-btn`）。
2. **渲染 Button**：`size="large"` + `type` + `shape` + `className` 链
   （`${prefixCls}-${type}` / `-${shape}` / `-individual` / `-icon-only` / `-rtl`）。
3. **mergedContent = content ?? description**（description deprecated 告警）。
4. **mergedIcon**：无内容且无 icon ⇒ 默认 FileTextOutlined。
5. GroupContext 注入：contextShape / contextIndividual / contextClassNames / contextStyles
   （item 或 trigger 两套，由 Group 决定）。
6. 语义：`floatButtonClassNames = { icon: '-icon', content: '-content' }` 基线 +
   context + 用户，useMergeSemantic（函数式变体支持）。
7. **zIndex**：useZIndex('FloatButton', style?.zIndex)（本仓 portal 的 useZIndex）。
8. **badge**：`'badge' in props` 判据；omit title/children/status/text；类 `-badge`、
   `-badge-dot`（dot 时）。
9. **tooltip**：convertToTooltipProps（string/VNode ⇒ {title}；对象 ⇒ props）⇒ 包 Tooltip。
10. **usage 告警**：circle + 文本内容（"supported only when shape is square…"）。
11. href ⇒ 渲染 `<a>`（Button 已支持）；htmlType 默认 button。
12. expose nativeElement。

## 3. FloatButtonGroup（壳 14 件事）

- `groupPrefixCls = ${prefixCls}-group`；**menu 模式**：trigger ∈ click/hover。
- open 受控/非受控（useControlledValue）；disabled 抑制开合；click 模式挂
  **document capture 级**外部点击关闭；hover 模式 mouseenter/leave。
- placement ∈ top/left/right/bottom（默认 top）⇒ `-menu-mode` + `-${placement}` 类 +
  list 方向 vertical。
- **list 渲染**：individual（shape=circle）⇒ Flex vertical；否则 Space.Compact。
- **trigger 按钮**：menu 模式下追加一个 FloatButton（icon = open ? closeIcon : icon，
  默认 CloseOutlined/FileTextOutlined），类 `${groupPrefixCls}-trigger`。
- context 两套：listContext（item/itemIcon/itemContent）与 triggerContext
  （trigger/triggerIcon/triggerContent + individual=true）。
- usage 告警：`open` 必须与 `trigger` 同用。
- expose nativeElement。

## 4. BackTop

- `visibilityHeight=400`（0 ⇒ 初始可见）、`duration=450`、`showProgress`（v6.6.0）。
- **useScroll hook**：getScroll >= visibilityHeight ⇒ visible；showProgress 时
  scrollProgress = scrollTop/maxScroll（0..1）⇒ CSS 变量 `--{prefix}-float-btn-progress`
  以 `${x}turn` 喂 conic-gradient 进度环；resize 重算。
- 可见性经 CSSMotion（`${root}-fade`）过渡；点击 scrollTo(0) + prefers-reduced-motion
  ⇒ duration 0。
- 本仓直接复用 back-top 的基建（getScroll / throttleByAnimationFrame / scrollTo /
  CSSMotion），useScroll 逐字移植为 float-button/hooks/useScroll.ts。

## 5. PurePanel

`_InternalPanelDoNotUseOrYouWillBeFired`：items ⇒ Group（+ `-pure` 类）；否则单个
FloatButton（backTop ⇒ BackTop visibilityHeight=0）。debug-only。

## 6. C8-R2 映射

| antd prop | Vue 侧 |
|---|---|
| `icon` / `content`（ReactNode） | `#icon` / `#content` 插槽（Button 同款；无同名 prop） |
| `description`（deprecated ReactNode） | 并入 `#content`（deprecated 告警） |
| `closeIcon`（Group） | `#closeIcon` 插槽（默认 CloseOutlined） |
| `tooltip`（string/VNode） | 数据 prop 保留（convertToTooltipProps）；TooltipProps 对象形态逐字 |
| `badge`（对象 prop 子字段） | 数据 prop 保留（C8-R2 豁免） |
| onClick/onOpenChange 等回调 | props 形态（Select 同判） |

## 7. 样式（378 行 → 机械转换）

`style/button.ts`（154）+ `style/group.ts`（160）+ `index.ts`（64，fade motion 复用
motion 基线）。genCssVar 交叉引用 `--{prefix}-float-btn-progress`（BackTop 进度环）。
