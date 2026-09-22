---
category: 导航
title: BackTop
subtitle: 返回顶部
---

返回页面顶部的操作按钮。

> ⚠️ 该组件在 antd 6.x 已废弃，请使用 `FloatButton.BackTop`。本实现为兼容保留。

## 何时使用

- 当页面内容区域较长时，提供一个快速返回顶部的入口。

## 代码演示

见 [`demo/`](./demo)（deprecated 组件在 antd 仅剩 basic）。

## API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| visibilityHeight | 滚动超过该值才显示（px） | `number` | `400` |
| duration | 回顶动画时长（ms；<=0 直落） | `number` | `450` |
| target | 滚动容器 | `() => HTMLElement \| Window \| Document` | `ownerDocument \| window` |
| onClick | 点击回调（滚动开始后调用） | `(e: MouseEvent) => void` | — |

## 设计说明

- `visibilityHeight={0}` 恒显。
- 默认内容为 `-content > -icon`（VerticalAlignTopOutlined），自定义插槽内容会
  被注入 motion 类名。
- 视口 ≤ 768px / ≤ 480px 时右边界收窄（响应式断点）。
