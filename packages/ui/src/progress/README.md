# progress

> **层**：L3（`packages/ui`）｜ **优先级**：P4 ｜ **复杂度**：M ｜ **antd 版本**：6.6.4
>
> 契约来源：antd `components/progress/`（progress 250 + Line 155 + Circle 108 + Steps 52
> + utils 73 + style 287 ≈ 925 行）。上游是**兼容性规格**，不是代码来源。

## 1. 职责

三形态进度条：line（纯线 / steps 分段）/ circle / dashboard；role=progressbar 语义面、
success 分段、渐变 strokeColor（线性多键 / from-to / conic 圆环）、≤20px 圆环经
Tooltip 展示 indicator。

## 2. 文件布局与关键决策

```
progress/
├── Progress.ts          # 主组件（分发 / status 推导 / indicator / 告警 ×6 / aria）
├── interface.ts         # 类型面（语义 root/body/rail/track/indicator）
├── utils.ts             # validProgress/getSize/getPercentage/handleGradient/isLight/px
├── engine/
│   ├── Line.ts          # 线形（body>rail>track[,track-success]）
│   ├── Steps.ts         # 分段（-steps-item[-active]）
│   ├── Circle.ts        # SVG 圆环（rail/path/gradient mask+foreignObject/circle-steps）
│   └── kernel.ts        # rc-progress 数学事实（getCircleStyle/getPtgColors）
└── style/               # token.ts（6 Token）+ index.ts（机械转换 + DECLS）
```

⚠️ 内核文件名是 `kernel.ts` 而非 `circle.ts`：同目录已有 `Circle.ts`，macOS 文件系统
大小写不敏感，`circle.ts` 与 `Circle.ts` 是同一文件（本次踩坑，见 CHECKLIST §六）。

### 实现判据

1. **SVG 数学逐值反推**（antd 实测 DOM）：dasharray = `${perimeterWithoutGap}px ${perimeter}`
   （第二段无 px）；dashoffset = (100-ptg)/100 × perimeterWithoutGap + strokeWidth/2
   （round 圆头修正，ptg≠100）clamp 到 perimeterWithoutGap-0.01；rotate = gap>0 ?
   90+gap/2 : -90。r = 50 - strokeWidth/2；strokeWidth 默认 max((3/width)×100, 6)。
2. **circle 段序**：percent 列表 [success%, percent−success%]，**逆序渲染**（主段在前）。
3. **gradient circle**：mask 包 path（stroke=#FFF、linecap 强制 butt）+ foreignObject
   叠 linear+conic 双层渐变；body 加 `-circle-gradient`。
4. **aria**：role=progressbar + valuenow（parseInt(success?.percent ?? percent)）；
   aria-label/labelledby 走 attrs 透传（Vue 不把 aria-* 识别为 prop）。
5. **linecap square/butt** ⇒ track/rail 圆角 0；`--progress-line-stroke-color` 无前缀
   （产物逐字）。
6. **H5 替代**：FastColor.isLight → 自研亮度判定（ITU-R 601，threshold 128）。

### 差异登记

- useId 生成的 gradientId 形态与 React 不同（`_R_x_` vs `v-x`）——gradient circle 不入
  L4 基线（结构 L1 覆盖、外观 L6 覆盖）。
- rc-progress 的 useTransitionDuration（DOM 直改 dasharray）不复刻——transition 已在
  style 上，percent 变化自然过渡（UPSTREAM 微差，视觉一致）。

## 3. Component Token 清单

circleTextColor / defaultColor / remainingColor / lineBorderRadius(100) /
circleTextFontSize(1em) / circleIconFontSize(fontSize/fontSizeSM em)。

## 4. 已知缺口

| # | 缺口 | 说明 |
|---|---|---|
| P1 | antd demo `component-token` | Token 定制演示并入 docs，不单列 demo |
| P2 | demo dashboard/circle-steps 用 InputNumber 替换 Segmented/Slider | 依赖组件落地后换回 |

## 5. 收口证据（G13）

- 四层：L1/L2 30 + demo 18 / L3 类型 6 / L5 a11y 18（aria-progressbar-name 豁免同
  antd disabledRules）/ **L4 DOM 契约 21（零 ALLOW 全 exact）**
- L6 视觉 **9/9 全 exact**（line-states / circle-dashboard / gradient-success × 3 viewport）
- lint 0 · registry:check 18/18
