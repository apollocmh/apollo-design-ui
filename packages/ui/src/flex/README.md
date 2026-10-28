# Flex 实现说明

现行契约见双语 API 与仓库规范。Flex 使用 Vue SFC、当前 ConfigProvider/ThemeContext 和原生 default slot；根 attrs 在 render 中读取，不按子项包装或模拟 React 生命周期。

公开 props 共九个；无业务 emits、v-model 或组件 Token。保留 Flex/default/AFlex、现有类型与样式工具导出。语义类覆盖全部 CSS 值；横向默认顶部、纵向默认拉伸。空宿主保留布局。`nativeElement` 是实际单一 HTMLElement 或 null，自定义根的组件实例不外泄。

Preset gap 从当前主题读取 paddingXS/padding/paddingLG 并仅在所属根写三项 alias；CSS 仍静态生成。Provider 默认样式在前，原生样式在后，flex/gap 派生 prop 优先级保持公开约定。

全部六组成对 Demo 使用本地内容与有名称的原生控件。整改清单、红灯和验收边界见 [2026-10-29 审计](../../../../docs/audit/2026-10-29-flex-contract-audit.md)，开发期行为修正见 [迁移记录](../../../../docs/migrations/flex-contracts.md)。

历史参考仍保留 `docs/analysis/flex.md`、39 个 DOM 场景与 15 个 React 视觉输入。它们不定义本轮规格；DOM 差异须逐项说明，不更新原始参考快照。任意自定义 prefixCls 仍须由消费者加载对应 CSS。
