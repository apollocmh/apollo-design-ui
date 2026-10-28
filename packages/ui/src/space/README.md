# Space / Compact / Addon

当前实现使用 Vue render、响应式 props、插槽与 typed provide/inject；静态 CSS 消费现有 Alias 变量。公开 Props/Slots/Ref 和使用示例以 [中文 API](index.zh-CN.md) / [English API](index.en-US.md) 为准。

- Space 在 render 中读取当前默认/分隔槽，DOM-free SpaceItems 为当前列表提供 latestIndex，Item 拥有 item/separator 区域。
- children.ts 展平数组/Fragment，同时保留合法 key 及 Fragment key 作用域；包装键独立于类名、前缀和主题。无 key 按位置，移除项不缓存历史身份。
- Compact 为每个实际非空子节点提供当前 size/direction/first/last，无额外控件宿主；NoCompactStyle 提供 null 隔离子树。
- use-focus.ts 仅在原生 keyed DOM 移动导致仍所属的聚焦元素退到 body 时恢复焦点，不抢占外部焦点。
- 三组件在有主题上下文时把当前 Alias 写到自身作用域，原生 style 最后合并。ComponentToken 为空，prepareComponentToken 返回 {}；预设 gap 仍来自 paddingXS/padding/paddingLG。
- Addon 的 underlined 绘制零圆角的单独底线，borderless 无边框；error/warning 消费状态边框色，disabled 文字优先级保留。边界依赖上下文，支持横/纵、RTL、独项与嵌套。状态不会给布局单元格添加表单语义。
- 十五个 Demo 使用实际 Apollo 控件和公开包入口；旧替身 helper 已无引用并移除。

源码回归覆盖实际 Button、Input、TextArea、Search、InputNumber、Select、Cascader、TreeSelect、DatePicker、RangePicker、ColorPicker、Addon。InputGroup、legacy addon InputNumber 和 FloatButtonGroup 的实际组合链亦被盘点；本轮不等于这些消费组件的全契约验收。

历史 Ant Design 6.6.4 参考、原始 DOM/PNG 与来源说明保留在 docs/analysis/space.md、tests/compat 和 tests/visual/baselines/react。上游树形态和规则数量不替代当前 Apollo 契约。当前样式为 Space 16 / Compact 4 / Addon 31 条；新边界测试取代了旧的无依据位置规则。

验证与剩余边界见 [本轮审计](../../../../docs/audit/2026-10-28-space-contract-audit.md) 和 [迁移说明](../../../../docs/migrations/space-contracts.md)。源码浏览器通过不能当成发布 JS/CSS、正式 Apollo 视觉或全库门禁通过。任意自定义前缀自动 CSS 仍属共享 D04。
