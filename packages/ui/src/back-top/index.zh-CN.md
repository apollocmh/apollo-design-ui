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
| target | 滚动容器 getter；可返回尚未挂载的模板 ref，引用变化时自动重绑 | `() => HTMLElement \| Window \| Document \| null` | `ownerDocument` |
| prefixCls | 组件类名前缀 | `string` | `apollo-back-top` |

### 事件、插槽与实例

| 名称 | 契约 |
|---|---|
| `@click` | 回顶开始后触发一次，参数为原生 `MouseEvent`；支持 `.once` |
| 默认插槽 | 完整按钮内容，支持文本、数字、多节点和 Fragment；显式空槽隐藏按钮，未提供则显示默认图标 |
| `nativeElement` | 实例暴露的实际 `HTMLButtonElement \| null` |

根节点为 `type="button"` 的原生按钮，支持 Tab、Enter、Space 与焦点样式；不可见时不进入键盘顺序。
原生 `class` / `style`、`aria-*`、`data-*` 和原生监听器均落在按钮上。
默认图标使用名称“Back to top”；可用 `aria-label="返回顶部"` 本地化。自定义图标内容应提供可访问名称，不应嵌套按钮或链接。

`ConfigProvider.components['back-top']` 的 `className` / `style` 随配置替换和移除更新；根 `style` 优先。
`theme.components.BackTop.zIndexPopup` 控制层叠顺序，默认 `zIndexBase + 10`。主题 `motion: false` 或系统减少动态效果设置会关闭回顶动画。

## 设计说明

- `visibilityHeight={0}` 恒显。
- 默认内容为 `-content > -icon`（VerticalAlignTopOutlined），自定义内容完整渲染在稳定的 `-custom` 宿主中；动效类属于宿主，不修改插槽 VNode。
- 视口 ≤ 768px / ≤ 480px 时右边界收窄（响应式断点）。
- 更换容器、重复点击和卸载都会取消先前回顶动画；滚动监听及待执行帧在离开容器时释放。

## 开发期迁移（2026-10-30）

按 ADR 0007 直接修正旧 React DOM / 回调形态：根 `div` 改为原生按钮，默认 `div` 内容宿主改为 `span`，自定义内容增加稳定 `span` 宿主。依赖标签选择器或把按钮/链接放在默认槽内的调用方需调整；类名入口继续保留。
模板使用 `@click="handleClick"`；`h(BackTop, { onClick })` 仍以 `MouseEvent` 接收同一个事件。原来的首节点克隆改为完整默认槽消费，不需要手工包成单根。
此开发版修正无兼容层或弃用期，历史 DOM 基线保留，当前精确差异由本目录测试断言。
