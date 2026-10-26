# Result

Vue 3结果页。完整公共契约见[index.zh-CN.md](index.zh-CN.md)与[index.en-US.md](index.en-US.md)。

- 七个Props、五个无参数完整插槽、六个语义落点、四个组件Token。
- 根attrs/class/style与原生事件由Vue处理；当前Provider、方向、语义工厂和源主题响应更新。
- 普通/异常状态均优先使用`#icon`，有意空槽不回退；无槽时icon控制默认图形。
- nativeElement指向根，卸载归null；没有业务模型、请求、计时或自动公告。
- 三个静态插画及其路径/来源保留，默认使用时是装饰；具名导出仍可独立复用。

完整范围、修前失败、验证与剩余边界见[本轮清单](../../../../docs/audit/2026-10-27-result-contract-audit.md)，公共行为变化集中见[迁移](../../../../docs/migrations/result-contracts.md)。原15机械场景和9张上游参考保留，不作为Apollo自有视觉批准。
