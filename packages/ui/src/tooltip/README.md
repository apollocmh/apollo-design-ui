# tooltip

> **层**：L3（`packages/ui`）｜ **优先级**：P3 ｜ **复杂度**：L ｜ **antd 版本**：6.6.4
>
> 契约来源：antd `components/tooltip/`（index.tsx 436 行 / PurePanel / util /
> useMergedArrow / style 242 行）+ `@rc-component/tooltip@1.5.2`（398 行）+
> `@rc-component/trigger@3.10.1`（2254 行）。上游是**兼容性规格**，不是代码来源。
> 分析产物：[`docs/analysis/tooltip.md`](../../../../docs/analysis/tooltip.md)。

## 1. 职责

文字提示：鼠标悬停 / 聚焦 / 点击时的轻量浮层。**本组件是 trigger 基建的第一个
消费者**（registry 备注：验证 ARCHITECTURE.md AR1），解锁 popover / popconfirm /
dropdown / select 等 15 个下游组件。

## 2. 文件布局与关键决策

```
tooltip/
├── Tooltip.ts               # 主组件（antd index.tsx 的 Vue 化）
├── PurePanel.ts             # 静态面板（SSR 可达的唯一完整浮层 DOM → L4 主载体）
├── use-merged-arrow.ts      # arrow 与 ConfigProvider.tooltip.arrow 的合并
├── util.ts                  # parseTooltipColor（亮度判定）+ clsx
├── style/{token.ts,index.ts}
└── interface.ts
_internal/trigger.ts          # rc-trigger 的 Vue 组装（15 个下游共用）
_internal/__tests__/trigger.test.ts
```

**Trigger = 组装而非重写**：交互语义 `overlay.useOverlay`（开合/延迟/Esc 栈/
外部点击）、几何 `position.measureAlign + alignPopup`（offsetR/B 按 rc 公式在
Trigger 内补齐）、挂载 `portal.Portal`、动画 `motion.CSSMotion`。

## 3. 与 antd 的差异

登记于 `COMPATIBILITY.md` §9.2 **D77–D82**（onOpenChange 通道 / 组件触发元素的
实例归一 / Text vnode 包装 / 动作类型收窄 / keyframes 静态化 / harness 等待）。
L6 视觉 9 张（3 variant × 3 viewport）**全部 0.000% exact**。

## 4. 已知缺口

| # | 缺口 | 说明 |
|---|---|---|
| P1 | `UniqueProvider`（多 trigger 共享浮层容器） | 性能优化，语义等价，overlay-contract §8 P4 |
| P2 | `TableMeasureRowContext`（table 测量行抑制） | table 未落地，恒 false |
| P3 | 色值解析只支持 hex/rgb/rgba | antd 用 fast-color；解析失败按亮色处理（D 登记于 util.ts 头） |
| P4 | `motion` prop 仅支持 motionName 覆盖 | 其余 motion 配置跟随 `apollo-zoom-big-fast` 预设 |

## 5. 收口证据（G13）

- L1 11 用例 / Trigger 冒烟 7 / L4 9（基线 `tooltip.dom.json`）/
  L5 17（含 label 豁免 1）/ L7 14 / L6 **9/9 0.000% exact**
- demo 14 个（Segmented/Select 未落地 ⇒ 原生 select 替换，文件头登记）
- registry 11 维 done，`status: completed`
