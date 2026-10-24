# Drawer Vue 契约修正

2026-10-24，按 ADR 0007 直接修正公共 Vue 用法，不增加旧形态适配或弃用期。

- `DrawerPurePanel` 使用原生 `class` / `style`，移除运行时 `className` 与对象限定的 `style` prop。例如 `<DrawerPurePanel class="preview" style="color: red" id="preview" @click="onClick" />`。对象/数组 style 仍遵循 Vue 原生合并规则。
- `Drawer` 的显式无障碍名称引用使用 `aria-labelledby="external-heading"`；程序化 props 可使用公开类型已有的 `ariaLabelledby`。修正运行时 prop 声明，保留外部引用。
- `getContainer` 对齐 Portal 的 `GetContainer`，可传 `false`、选择器、元素或容器函数；模板内联写法为 `:get-container="false"`。
- 内容使用现有 `#title` / `#footer` / `#extra` / `#closeIcon`，类型由 `DrawerSlots` 导出。空 slot 继续压住 fallback；头尾显隐保留正文 DOM 和输入状态。标题每次包装层渲染只求值一次，面板与自动 ARIA 使用同一结果。

本次没有新增渲染函数 prop，也没有把内部 DrawerPanel 的 VNode 传递协议当作公开渲染 API。历史其他弃用字段不在本次迁移范围。
