# Splitter（分割面板）· G1–G3 分析产物

> 步骤 3 的产物先于步骤 5 存在（AGENTS.md §2）。
> 事实来源（§5 优先级第 4 层）：antd 6.6.4 `es/splitter/`（898 行：Splitter 231 +
> SplitBar 235 + Panel 35 + hooks 337 + style 330）。
>
> 依赖替换（registry 已登记）：
> - `@rc-component/resize-observer` → `@apollo-design/utils` 的 `useResizeObserver`
>   （strategy=apollo，不独立成包）
> - 图标 → `@apollo-design/icons`（Left/Right/Up/DownOutlined，layout/Sider 同款）

---

## 1. 组件一句话

可拖拽调整大小的面板分割容器：`Splitter.Panel` 子组件声明面板（min/max/size/
collapsible），拖拽把偏移换算成相邻两面板的 px 增减，全程用**百分比归一化**状态机。

## 2. 架构（数据流）

```
children(Panel vnode) --useItems--> items[]（含 collapsible 归一化：showCollapsibleIcon 默认 'auto'）
items + containerSize --useSizes--> [panelSizes(px 或开发者原值), pxSizes, ptgSizes, ptgMin, ptgMax, setInnerSizes]
items + pxSizes + reverse --useResizable--> resizableInfos[]（可拖/可折叠方向/图标显隐）
useResize（状态机：cacheSizes/movingIndex/cacheCollapsedSize）→ onOffsetStart/Update/End/onCollapse
SplitBar（拖拽手柄 + 折叠按钮 + aria separator + lazy 预览）
```

- **containerSize**：`ResizeObserver` 读根元素 offsetWidth/Height（按方向取一）；
  **0 时跳过**（隐藏 tab 内嵌场景，antd issue #51106）。
- **useSizes 的归一化**（sizeUtil.autoPtgSizes）：① 有 prop size ⇒ 全用 prop sizes；
  ② undefined 尺寸先均分、再受 min/max 贪婪填充；③ 全定义但和 ≠1 ⇒ 缩放后
  fitPtgSizes（min/max 夹取 + 按可伸展空间分摊差额）；④ 折叠面板（size=0）忽略 min。
- **useResize 状态机**：start 时缓存 pxSizes + movingIndex{index,confirmed}；
  update 首次 offset≠0 时确认真实 index（负偏移向左找第一个 size>0 且可拖的）；
  四条边界夹取（min/max × 相邻两面板）；collapse 走「直接折叠 / 记忆恢复 /
  半分」三路（cacheCollapsedSizeRef）。
- **reverse**：`!isVertical && isRTL` —— 偏移取反、折叠方向互换、可折叠图标互换。

## 3. DOM 契约

```
div.{p}-splitter.{p}-splitter-horizontal|vertical [-rtl]     ← root（flex）
 ├─ div.{p}-splitter-panel [-hidden(尺寸 0)] [-transition(motion)]   ×n
 │    style: flexBasis:size|'auto', flexGrow:0|1（SSR 用 auto）
 ├─ div.{p}-splitter-bar                                     ×(n-1，可拖才渲染)
 │    ├─ (lazy) div.{p}-splitter-bar-preview [-active]   style: --bar-preview-offset
 │    ├─ div.{p}-splitter-bar-dragger [-disabled|-active|-customize]
 │    │     role="separator" aria-disabled aria-orientation=horizontal|vertical*
 │    │     aria-valuenow/-min/-max（四舍五入整数）
 │    │     (draggerIcon) > div.{p}-splitter-bar-dragger-icon
 │    ├─ (startCollapsible) div.{p}-splitter-bar-collapse-bar -start [-customize]
 │    │     [hover-only|always-visible|always-hidden]  role="button" tabindex=0
 │    │     aria-label="Toggle start panel" > span.{p}-splitter-bar-collapse-icon -start
 │    └─ (endCollapsible) 同上（end / "Toggle end panel"）
 └─ (拖拽中) div.{p}-splitter-mask -horizontal|-vertical [aria-hidden]
```

*注意 `aria-orientation`：vertical 时 separator 的 aria 值是 `horizontal`（分割线
方向与面板排布方向垂直，上游如此）。折叠按钮显隐三态：`auto` ⇒ `-hover-only`
（`@media(hover:none)` 恒显）；`true` ⇒ `-always-visible`；`false` ⇒ `-always-hidden`。

## 4. Props / Events

- Splitter：`orientation|vertical|layout(deprecated)`、`collapsible{motion,icon}`,
  `draggerIcon`、`collapsibleIcon(deprecated)`、`destroyOnHidden`、`lazy`、
  `onResizeStart/onResize/onResizeEnd(sizes: number[])`、`onCollapse(collapsed, sizes)`、
  `onDraggerDoubleClick(index)`、语义槽 `classNames/styles {root,panel,dragger}`
  （dragger 支持 string ⇒ `{default}` 展平）。
- Panel：`size|defaultSize`（%/px）、`min/max`、`collapsible(boolean|{start,end,
  showCollapsibleIcon})`、`resizable`、`destroyOnHidden`、className/style。
- 混用受控 size 与未受控 size 且无 onResize ⇒ dev 告警；`layout`/`collapsibleIcon`
  deprecated 告警。

## 5. 样式契约（4 个 Component Token，全为常量默认值）

| Token | 默认 | 说明 |
|---|---|---|
| splitBarSize | 2 | 把手视觉宽 |
| splitTriggerSize | 6 | 把手热区宽 |
| resizeSpinnerSize | 20 | 拖拽 spinner 尺寸 |
| splitBarDraggableSize | resizeSpinnerSize(20) | spinner 段高 |

（`token.splitBarSize` 等在 alias 上不存在 ⇒ 恒取默认常量，构建期解析值落地。）

要点段：`centerStyle`（absolute 50%/50% translate -50%,-50%）复用为 dragger/::before/
::after/collapse-bar 的定位；dragger 的 `::before`（hover 底）与 `::after`（spinner 底）
在 horizontal/vertical 两段分别定宽高；collapse-bar 定位用 `inset-inline` 跳过侧
（antd 的 `left:{_skip_check_}`）；`--bar-preview-offset` 是组件作用域 CSS 变量
（antd genCssVar(root,'splitter')）⇒ 本仓声明为 `--{root}-splitter-bar-preview-offset`
挂在根类上（B7 先例：grid/--dot-duration 同判），预览元素内联覆盖。
`@media(hover:none)`（collapse-bar hover-only 恒显）与 `prefers-reduced-motion`
（panel-transition，genNoMotionStyle 1 处）逐条保留。

## 6. Vue API 设计（INTENDED 登记点）

| # | 差异 | 分类 |
|---|---|---|
| I1 | `Splitter.Panel` 复合组件（renderless，仅承 props）；children 收集走 slot（descriptions 同范式） | INTENDED |
| I2 | 事件：`onResizeStart/onResize/onResizeEnd/onCollapse/onDraggerDoubleClick` ⇒ `resize-start/resize/resize-end/collapse/dragger-double-click` emits（C19） | INTENDED |
| I3 | `ref` ⇒ `expose({ nativeElement })` | INTENDED |
| I4 | `useResizeObserver`（utils）替代 rc ResizeObserver；回调拿 `{offsetWidth, offsetHeight}` | INTENDED |
| I5 | dragger 语义槽的 string 展平（`{default}`）手动归一化后再进 useMergeSemantic | — |

## 7. 测试策略

- L4 oracle：SSR 路径（无拖拽）——basic/orientation-vertical/rtl/semantic/
  collapsible/aria/destroyOnHidden/size 组合（containerSize 未测量 ⇒ panelSizes
  落开发者原值，SSR 稳定）。
- L1：sizeUtil 归一化全分支（均分/贪婪/缩放/全 0）、useResize 状态机（确认索引/
  四边界/折叠三路）、useResizable 的折叠图标矩阵、SplitBar aria 与事件、
  deprecated 告警、ref、resize 回调链。
- L6：3 variant × 3 viewport（basic / vertical / collapsible）。
