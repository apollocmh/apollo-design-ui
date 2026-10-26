# Spin

Vue 3加载状态组件。公共数据与布局用props，正文、指示器和文案用原生槽；当前完整范围、失败复现和验收状态统一记录在 [Spin审计清单](../../../../docs/audit/2026-10-26-spin-contract-audit.md)。历史React参考记录不定义当前产品契约。

`#indicator="{ percent }"`接收当前进度并完整渲染Vue内容，空槽抑制默认值。语义样式属于稳定容器，不克隆用户VNode。root始终为正文外壳，section为稳定加载层，fullscreen只改变覆盖层定位；显式数字含0在SSR首帧呈现有名称的进度环，未提供percent则为不定加载。正delay仍用于防闪，关闭和卸载取消待执行任务。

4个Component Token读取当前主题：contentHeight约束嵌套加载层最大高度，三档dotSize控制对应尺寸。根原生CSS变量优先，最近Spin拥有尺寸与busy样式；内置动画尊重motion=false和系统减少动画偏好。源码不引入CSS-in-JS运行时。

Provider当前配置与程序化全局默认内容仍可使用；setDefaultIndicator不主动调度更新，下次实际render读取新值。类型、9个原有Demo与新增Token Demo、双语API及 [集中迁移说明](../../../../docs/migrations/spin-contracts.md) 同步。本轮完整清单已统一验收：45张自有视觉基线、生产SSR水合与相关消费者验证见审计清单；全库其他单元和最终门禁继续开放。
