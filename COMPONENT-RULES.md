# Apollo Design · 组件开发规范

## 组件契约与组织

公共组件共置于 `packages/ui/src/<name>/`，包含导出入口、实现、类型、样式、测试、双语 API 与成对的 `.vue` / `.md` Demo。复杂内部件、composable、上下文按职责拆分；不为匹配上游目录而拆文件。

组件契约说明用途、props/defaults、emits/payload、slots/scope、expose、受控状态、attrs 落点、键盘与焦点行为。分析可参考其他库，但本库类型与用户场景决定 API。简单修复可直接在测试和文档记录契约，无须重复生成分析报告。

## Vue API

- 优先 `<script setup lang="ts">` SFC；动态泛型或复杂渲染可使用 `defineComponent` / `h()` / TSX。
- 保留现有导出名和 `A` 前缀注册名。新能力用明确一致的 Vue 命名，不无意义改已有名称。
- 可绑定状态使用已有 `v-model:<name>` 与 `update:<name>`；不强制全部改成 `modelValue`。受控和非受控状态、undefined/空值与更新顺序须明确。
- 事件通过 emits 或有明确落点的原生监听器表达。`onXxx` 并不天然是错误，取消型回调、异步确认和程序化服务可保留函数参数；必须区分 DOM 事件与业务 payload，避免双发。
- 内容扩展优先默认/具名/作用域插槽。已有 VNode 或 render prop 保留兼容；数据驱动单元格、配置对象、命令式服务可以保留渲染函数。
- 新增插槽时规定 slot 存在则优先于内容 prop（含有意为空的 slot），在 render 中读取并以函数转发。不要将动态 slot 固定到 setup/computed 快照。
- `expose` 仅开放稳定、必要、文档化的方法与元素引用；不暴露整个内部实例。

## Attrs、响应性与生命周期

根 `class` / `style` 走 Vue attrs；复杂或多根组件显式 `inheritAttrs: false` 并路由 attrs。普通单根组件可使用 Vue 自然透传，只要行为明确且有测试。禁止统一把 attrs 放到最后而覆盖受控 value、内部事件或无障碍属性。

对输入控件分别定义根容器与实际 input 的 `id`、`tabindex`、label/ARIA 落点；范围控件应记录每个输入的语义。布局容器、浮层、触发元素的落点不能混为一谈。

动态 props 通过 getter/computed/toRef 消费，动态 provide 值保持响应性。渲染期不得写响应式状态制造更新循环。DOM 操作使用恰当生命周期和 flush 时机；监听、观察器、定时器与容器必须卸载清理。SSR 不无条件访问 window/document。

## 类型、样式和无障碍

公共类型由本项目定义与导出，不 import React 类型或用宽泛 Function/any 掩盖签名。运行时 props、导出类型和插槽定义须一致；负例测试允许带理由的 `@ts-expect-error`。

视觉值来自主题 Token；保持既有语义类名与 CSS 变量兼容。不要为了独立化改变颜色、间距或 DOM。为真实设计需求调整时更新契约与验收基线。

优先原生语义元素；支持可访问名称、状态、键盘、焦点可见性、焦点返回、禁用及 reduced-motion 的适用场景。axe 通过不能代替实际交互断言。上游缺陷不是保留缺陷的理由。

## 完成与回归

新组件须有真实场景 Demo、文档和适用测试；修复应先复现再验证，回归用例保留原缺陷编号。完成标准见 `WORKFLOW.md` 和 `TESTING.md`，不得以已有 completed 标记跳过重新验证。破坏性 API 变更按 `COMPATIBILITY.md` 单独交付迁移说明。
