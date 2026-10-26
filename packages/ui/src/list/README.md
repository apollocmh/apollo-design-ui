# List 实现说明

当前契约见 [中文 API](./index.zh-CN.md) / [English API](./index.en-US.md)。List 是独立维护的 Vue 3 组件，内容使用泛型 `#item` 和原生具名插槽。

原始 Token 默认值与初版样式参考 Ant Design 6.6.4 `es/list/style/index.js`；来源、文件映射和历史对照保留于 [原始分析](../../../../docs/analysis/list.md)。当前 Vue 行为及修正以 Apollo 契约为准。

- List、Item、Meta 均为 SFC；公开 ref 为可空 `nativeElement`。grid Item 暴露 Col 根，原生 attrs 落内层 Item；非 grid 暴露 li。
- 最近的 computed List context 传递布局、前缀、尺寸、边框和分隔状态，Item 再给 Meta 提供所属布局。条件样式使用自身状态类，避免祖先 List 串样式。
- Item 正文使用稳定 main 容器，横向 `display: contents`，竖向为正文列；extra 两种布局都有语义容器。切换布局或额外内容保留正文原生编辑状态。
- `use-list-theme.ts` 读取当前源主题，把 11 个组件 Token 转成静态 CSS 使用的变量。只在根声明默认值，数据容器继承，不再重置 Provider/原生覆盖。
- 分页各字段独立受控，控制移除沿用接收值；页面收敛与业务请求分开。服务端结果页不按本地偏移二次清空。
- loading 对象遵循 Spin 默认 spinning=true；共享 Spin 当前 Provider 配置和原生 attrs 在渲染时读取。这里不代表 Spin 全组件审计完成。
- 12 个 Demo 覆盖数据、Meta、三档尺寸、栅格、响应式、分页、loading、空态、主题与 extra；loadmore 模拟请求在卸载时清理。

本轮完整盘点与验收证据：[2026-10-26 List 审计](../../../../docs/audit/2026-10-26-list-contract-audit.md)。破坏性 DOM/类型调整集中记录于 [迁移说明](../../../../docs/migrations/list-contracts.md)。

2026-10-24 的内容槽迁移记录保留于 [F11 报告](../../../../docs/audit/2026-10-24-list-slots-remediation.md)。历史上游参考 CSS/DOM 不作为 Apollo 当前公共契约；35 个机械参考用例仍保留，按逐项精确差异验收。
