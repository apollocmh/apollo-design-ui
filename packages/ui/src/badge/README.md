# Badge / Ribbon 实现说明

公开契约以双语 API、导出类型及行为回归为准；算法的历史参考是 antd 6.6.4，原二十六机械场景、HTML、十八张参考 PNG 与来源保留。参考 DOM 不要求 Vue 内容丢失、错误样式落点或重复朗读。

Badge 公开边界逐帧读取 default/count/text，私有 Indicator 接收普通内容，完整富内容与数字滚动分离。可见内容缓存供离场动画使用；状态和计数保留同一个原生根。数字子组件只拆数字字符，负号原样；过渡序列只有当前值参与朗读，定时器随卸载清理。

两个根使用原生 attrs/class/style 与只读 nativeElement。Ribbon 的 text 数据用 NodeRenderer，#text 按存在性优先。Provider 保留当前视图；九个既有 Token 从当前 Alias 派生并消费组件覆盖，静态 CSS 默认值保留。可读实色前景从实际背景派生，作者显式颜色仍优先；系统 reduced-motion 停止装饰动画。

完整范围与分类见 [当前清单](../../../../docs/audit/2026-10-28-badge-contract-audit.md)，开发期直接修正见 [迁移说明](../../../../docs/migrations/badge-contracts.md)。当前实现/验收状态以清单和证据为准；历史 completed 不代表新单元或全库门禁通过。
