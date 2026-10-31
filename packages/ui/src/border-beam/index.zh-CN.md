---
category: 数据展示
title: BorderBeam
subtitle: 边框流光
---

沿 HTML 容器边框流动的装饰性描边。

## API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| prefixCls | Effect 的完整类名及运行时 CSS 变量前缀 | `string` | Provider 前缀 + `-border-beam` |
| color | 纯色或色标数组（0–100 映射到 0–70%，保留尾部淡出） | `string \| { color: string; percent: number }[]` | 主题主色渐变 |
| count | 有限且 ≥1 时向下取整，其余回落 1 | `number` | `1` |
| duration | 单圈秒数，有限且 >0 才生效，其余回落 6 | `number` | `6` |
| lineWidth | 流光厚度，数字补 px | `number \| string` | 主题 `lineWidth` |
| outset | 覆盖四边统一 inset；未传时分别跟随宿主边框宽度 | `number \| string` | — |
| size | 流光头部长度，数字补 px | `number \| string` | `100px` |
| classNames.effect | 每个装饰 Effect div 的类名 | `{ effect?: string }` | — |
| styles.effect | 每个装饰 Effect div 的内联样式 | `{ effect?: CSSProperties }` | — |

## 插槽与原生 attrs

默认插槽接受 `VNodeChild`。单一 HTML 根元素可以被装饰，包括组件条件渲染或异步解析后的单根。注释、空白以及单根 Fragment 保留宿主；文本、SVG 和多个有效根完整透传，不绘制流光，也不添加布局容器。

原生 `class`、`style`、`data-*`、`aria-*` 和事件按 Vue 规则合并到选中的宿主 VNode。同名样式由宿主自身优先；组件宿主仍遵守该组件的 attrs 传递规则。原有 key、模板 ref、ref 数组、具名插槽和生命周期钩子由原调用方保有。要访问宿主元素或组件，请在子节点上放模板 ref；BorderBeam 不提供公开方法、事件或 v-model。

宿主自行提供定位上下文，通常设置 `position: relative`。Effect 继承圆角、不接收指针事件，并标记 `aria-hidden`。Effect 样式依次合并运行时变量、Provider `style`、Provider `styles.effect`、组件 `styles.effect`，后者优先。Provider 的 `className` 和 `classNames.effect` 仍是 Effect 配置。

可见宿主的边框宽度使用同一个 500ms 共享时钟采样，并读取实际所属文档。隐藏文档不读样式，恢复可见后立即补采样。没有 HTML 宿主即无采样订阅；更换宿主、迁移文档和卸载会清理相关资源。SSR 只保留内容，不创建 Effect 或定时器。减少动态效果偏好下隐藏流光。

## 迁移

已删除组件的 `className` 和原先落在 Effect 的 `style` Props。宿主使用原生 `class`/`style`，装饰层使用 `classNames.effect`/`styles.effect`。Vue 更新宿主文本而移除装饰节点时，会重建装饰层，保留宿主身份与焦点。
