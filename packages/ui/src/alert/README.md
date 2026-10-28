# Alert 实现与验证入口

当前契约以双语 API、导出类型和行为测试为准。旧上游参考、PLAN 和 `docs/analysis/alert.md` 保留来源与历史证据，不定义当前规格。

- Alert 使用原生 Vue render/slots 与 CSSMotion，关闭按钮是具名原生 button；根 div 为 `nativeElement`，普通 attrs、事件修饰符和 class/style 落在该根。
- 当前 `components.alert` 配置在 render/事件发生时消费，局部字段优先；语义样式函数读取本轮合并结果。五个内容 slots 不在 computed 中缓存。
- `close` 使用 MouseEvent，`after-close` 在内部移除终态通知一次。配置业务回调保留，不能抢占 Vue 事件；相同函数不重复调用。没有公开 open/visible/v-model，重显通过挂载控制。
- 四个组件 Token 消费最近 source theme，并把必要 Alias 与组件变量写到自身根。无描述默认横向12px为现有设计常量；其余 padding 来自当前 Alias，可由完整 padding Token 覆盖。
- 显式空主题恢复默认值，缺少主题来源时保留页面 CSS 作用域；消费共享 sourceActive 标识，不按 config 是否为空猜测来源。
- ErrorBoundary 的健康内容保持完整 Fragment；原生 attrs 只在错误回退 Alert 上有 DOM 落点。独立 captured 状态处理包括0/false/null/undefined的抛出值，Vue错误阶段信息不伪称 React 组件栈。
- 默认错误详情可通过 Tab 聚焦，窄视口下使用原生方向键横向滚动。

本轮完整清单、红灯和实际验收边界见 `docs/audit/2026-10-29-alert-contract-audit.md`；事件/空槽/Token和错误边界迁移见 `docs/migrations/alert-contracts.md`。原28个机械参考场景保留，有限ARIA差异在 `__tests__/contract-differences.ts` 逐路径列出，超出仍失败。
