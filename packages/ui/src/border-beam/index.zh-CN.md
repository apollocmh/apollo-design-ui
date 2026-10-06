---
category: 反馈
title: BorderBeam
subtitle: 边框流光
---

沿容器边框流动的流光描边。

## 何时使用

- 需要强调某个容器/卡片处于「进行中」或「活跃」状态时。

## 代码演示

见 [`demo/`](./demo)（8 个，与 antd 非 debug demo 一一对应）。

## API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| color | 渐变：纯色或色标数组（0–100 映射到 0–70% 保留尾部淡出） | `string \| {color, percent}[]` | 主题色 |
| count | 流光条数（≥1 取整） | `number` | `1` |
| duration | 单圈时长（秒） | `number` | `6` |
| lineWidth | 描边厚度（默认随宿主 border） | `number \| string` | — |
| outset | 覆盖四边统一 inset 偏移 | `number \| string` | — |
| size | 流光头部长度 | `number \| string` | `100px` |
| classNames.effect | 落在 **Effect 层**（每个流光一个 div）。**本仓自有 API** —— `BorderBeam` 是 renderless（没有自己的 DOM 根），「根类名」在 Vue 里无处可放，槽位给这个落点一个 Vue-native 的名字 | `{ effect?: string }` | — |
| styles.effect | 同槽位的内联样式（在 CSS 变量之后合并） | `{ effect?: CSSProperties }` | — |
| ~~className~~ / ~~style~~ | ⚠️ 透传到 **Effect 层**。**@deprecated**：用 `classNames.effect` / `styles.effect`（同一落点） | — | — |

## 设计说明

- 子元素即宿主：Effect 注入宿主 DOM 内部（`aria-hidden`，纯装饰）。
- 宿主的 `border-radius` 会被继承；`border` 宽度决定流光贴合的偏移。
- `prefers-reduced-motion: reduce` 下自动隐藏。
