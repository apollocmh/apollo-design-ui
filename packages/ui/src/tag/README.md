# Tag 实现说明

Tag、CheckableTag 和 CheckableTagGroup 使用 Vue 状态、完整插槽、当前 Provider 和原生事件。具体公开契约见双语 API；本轮范围和验证见 [完整审计](../../../../docs/audit/2026-10-27-tag-contract-audit.md)，开发版变化见 [迁移记录](../../../../docs/migrations/tag-contracts.md)。

Tag/CheckableTag 使用 render 函数逐次读取插槽，独立的 icon/content/close 宿主避免克隆业务节点。Group 使用泛型 SFC，单选和多选直接支持强类型 v-model。三者公开 nativeElement，Tag 的静态子组件与具名导出指向相同对象。

variant 优先级保持 `variant > -inverse > bordered=false > Provider > filled`。关闭使用所属原生按钮、当前语言和 disabled；MouseEvent.preventDefault 取消隐藏，默认关闭保留 DOM。CheckableTag 点击或空格更新一次，尊重原生事件取消/重复键；Enter 不切换。Group 的 update:value/change 共用一个状态出口。

静态 CSS 消费源主题别名和三个既有 Component Token。根 style 最后覆盖，内部语义样式使用 classNames/styles。已配置主题在根提供当前变量；任意 prefixCls 仍需对应构建 CSS（D04）。原始对照和 PNG 保留作参考，不作为 Apollo 交互规格。Wave 不在本轮范围，关闭 Demo 不声称不存在的过渡动画。

共享 closable 的配置解析与旧图标渲染分离：Tag 只消费配置数据，其他消费者继续使用原 computeClosable 渲染逻辑；验收包含受影响的 Modal/Drawer/Notification/Tour。
