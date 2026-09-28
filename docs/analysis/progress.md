# progress · G1 分析（antd 6.6.4）

> 规模：progress.tsx 250 + Line 155 + Circle 108 + Steps 52 + utils 73 + style 287 ≈ 925 行；
> rc 依赖 `@rc-component/progress`（H5 → 内核自研 SVG circle）/ `@ant-design/fast-color`（isLight 自研替代）。
> Token 6 个（registry 对账）。依赖组件 tooltip（circle ≤20px 时 indicator 经 Tooltip 显示）。

## 1. 契约要点（逐条对齐 antd 产物）

### 1.1 三形态 + steps

- **line**（纯线）：`-body`（宽度）> `-rail` > `-track`（width=percent%）+ `-track-success`（success.percent）；
  indicator 外置（`-indicator-end/-outer` 类）或 inner（进 track 内）。
- **line + steps**：`-steps-body` > `-steps-item[-active]` × N + indicator（marginInlineStart）。
- **circle / dashboard**：SVG（viewBox 0 0 100 100）+ `<circle>` 元素（非 path！）。
  - rail circle `-circle-rail`；每段 percent 一个 `-circle-path`（**逆序渲染**：主 percent 先、success 后）。
  - gradient（plain object）strokeColor ⇒ conic-gradient 方案：`<mask>` 包 path + `<foreignObject>` 叠加
    `linear-gradient` + `conic-gradient` 两层 div；body 加 `-circle-gradient` 类；linecap 强制 butt。
  - dashboard：gapDegree=75（可覆盖，含 0）；rotate = 90 + gapDegree/2（gap>0）否则 -90。
- **≤20px circle（inline-circle）**：indicator 不进 body，整体包 Tooltip（title=indicator）。

### 1.2 圆环计算（rc-progress 的数学事实，自研实现）

```
r = 50 - strokeWidth/2;  perimeter = 2πr
perimeterWithoutGap = perimeter * (360-gapDegree)/360
rotate = gapDegree>0 ? 90+gapDegree/2 : -90  （再 + offsetDeg/positionDeg per stack）
dasharray = `${perimeterWithoutGap}px ${perimeter}`  （第二段无 px）
dashoffset = (100-ptg)/100 * perimeterWithoutGap
  + strokeWidth/2（linecap=round 且 ptg≠100 的圆头修正）
  clamp: ≥ perimeterWithoutGap ⇒ perimeterWithoutGap-0.01
transform-origin = 50px 50px; transition 固定串
```

- strokeWidth 默认：max((3/width)*100, 6)（CIRCLE_MIN_STROKE_WIDTH=3）。
- percent 列表 = [success%, percent−success%]（getPercentage）；strokeColor 列表同构（success ⇒ green 兜底）。
- circle-steps（steps + circle）：percent 取 [1]（主段），strokeColor 取 [1]，linecap=butt，按 step 分段
  （stepGap=2 的 dashoffset 累进）。

### 1.3 Line 细节

- `--progress-line-stroke-color` 变量**无组件前缀**（产物逐字）——机械转换保留。
- gradient：`{from,to}` ⇒ `linear-gradient(to right, from, to)`（rtl ⇒ to left）；
  多键 ⇒ sortGradient 按 % 排序拼接；两种都同时写 background 与变量。
- strokeLinecap square/butt ⇒ borderRadius 0；size 解析（getSize('line')：字符串 ⇒ height 6/8；数字 ⇒ [w,h]；数组/对象）。
- percentPosition.align=center + type=outer ⇒ `-body-layout-bottom`。

### 1.4 主组件

- 语义面 root/body/rail/track/indicator（classNames/styles，对象+函数式，context 合并）。
- status 推导：非法 status 且 percent≥100 ⇒ 'success'；否则 status||'normal'。
- indicator：format || `${n}%`；exception ⇒ Close(Circle)Filled/Outlined；success ⇒ Check*（line 用 Filled）。
  `-indicator-bright`：strokeColor isLight 且 inner（isLight 自研：hex→lum）。
- percentNumber = parseInt(success?.percent ?? percent)（aria-valuenow / status 判定用）。
- warning ×4 deprecated（width/trailColor/gapPosition/size="default"）+ usage ×2（circle/dashboard 的
  size 数组/对象）。
- role="progressbar" + aria-valuenow/min/max；aria-label/labelledby 透传。

## 2. Vue API 设计

- `format` 为 fn prop（数据通道）；`rounding` fn prop；无插槽需求（children 在 antd 中被显式 progress 覆盖，无效 prop）。
- expose：无（antd 仅 forwardRef div；nativeElement 通过根元素可取）——v1 不暴露。
- sub 组件 Line/Steps/Circle 为内部 engine（不导出）。

## 3. 差异预案

- `@rc-component/progress` 的 `useTransitionDuration`（DOM 直改 dasharray 的动画 hack）v1 不复刻——
  transition 已在 style 上，percent 变化自然过渡（UPSTREAM 微差，动态 demo 视觉一致）。
- useId 生成的 gradientId（React 服务端 `_R_f_` 形态）→ Vue useId（形态不同，DOM 差异在 L4 允许位）。
- FastColor.isLight → 自研 hex/rgb 亮度判定（行为对齐：threshold 128 边界的色值集合一致即可，L4 验证）。
