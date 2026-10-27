# Button

Vue 3 原生操作按钮与链接。完整公共契约见[index.zh-CN.md](./index.zh-CN.md)及[index.en-US.md](./index.en-US.md)；当前整改单元范围和证据见[Button审计](../../../../docs/audit/2026-10-27-button-contract-audit.md)，公共变更集中见[迁移](../../../../docs/migrations/button-contracts.md)。本轮统一验收仍在进行，不沿用历史completed宣称完成。

实现以当前render中的完整槽、稳定内容宿主、当前Provider配置、挂载后加载调度和静态CSS/变量为基础，不克隆并改写业务中文子节点。19 Props、两个槽、click MouseEvent和唯一nativeElement expose；语义为对象式root/icon/content。根class/style走Vue attrs。

现有45显式+13预设阴影Token接入当前SourceTheme；同一Provider共享纯派生，只投影CSS实际消费的Alias，原生根样式最后合并。生成CSS与Alias投影集合有独立一致性守卫。完整20 Demo保留；SSR/水合、实际浏览器、消费者和视觉按审计分别记录。

历史参考保留在docs/analysis/button.md及tests/compat/baselines/button.dom.json。原65机械场景和投影不变；当前精确差异单列并有反向守卫。上游DOM形态不是Apollo公共规格。
