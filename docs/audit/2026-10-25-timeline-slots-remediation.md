# F11 · Timeline 原生条目槽（2026-10-25）

按 ADR0006/0007 增加 itemTitle/itemContent/itemIcon，统一接收 TimelineItemSlotProps { item, index }；item 为当前原始数据，index为反转后的显示索引。slots在Timeline当前render求值，再将VNode数据交给Steps，不在computed/setup中缓存或调用槽。原有数据及别名回退仍支持；存在的空槽压住回退，移除槽恢复。空标题不制造交错布局占位。合成旧pending节点不伪造源item，显示索引包含其位置。

新增item-slots.test.ts，旧实现4条全失败（`/tmp/apollo-timeline-slots-red.log`），修复后通过：作用域数据/三槽优先、条件/当前/空/移除、keyed输入在数据更新和reverse时保持、SSR内容。扩展空图标和空标题布局检查，并断言正常items原生槽不再误发弃用告警。

直接移除只返回null的 Timeline.Item / TimelineItemComponent，与声明默认槽却无消费点的 TimelineSlot 类型。没有添加空壳兼容或弃用层；单独迁移记录 `docs/migrations/timeline-item-slots.md`。旧「空壳必须不渲染」断言改为运行时导出不存在；类型层检查具名模块导出移除、槽作用域与install。初版类型负断言误认为Vue组件类型是封闭对象，检查Item属性不存在失败；Vue ComponentOptionsBase有开放索引签名，该检查不适用，改由运行时检查静态属性、模块类型检查具名导出，保留实际移除约束，未用断言/忽略诊断隐藏。另以真实Vue模板检查item/index精确类型，能拒绝any/unknown推导。

新native-slots Demo用Vue模板完成标题/正文/图标、条件/空槽、反转与数据更新，不要求h函数。Timeline示例14→15，全库997→998；两处文档计数断言和新Demo哨兵同步。旧数据别名/pending警告仍按使用保留，移除错误的「只要传items就警告Timeline.Item」判断；未扩宽警告豁免。参考DOM/像素基线未改。

Node22.22.2 / pnpm12.4.2：

| 检查 | 实际结果 |
|---|---|
| Timeline/Steps unit/dom-contract/a11y/theme | 13文件227条通过，含新增4条与新Demo；保留jsdom canvas提示 |
| 类型项目 / 全仓source types | 4文件32条通过；全仓 `pnpm run lint:types` 通过 |
| UI build / L7 | 构建声明与69份CSS生成，保留既有unbuild警告；UI L7 11项通过、0 FAIL/PENDING |
| `node tests/consumer/timeline-types.mjs` | 真实产物声明、无source alias；三个槽、精确item/index夹具与之前Timeline/Steps语义函数均通过；测试目录未入包 |
| 生产Chrome | timeline-slots.mjs / timeline-native.mjs均通过，Chrome150.0.7871.125；实际SFC三槽/动态/空/移除/恢复、显示索引、数据替换、根/输入身份和值，之前布局/attrs/RTL/current/折叠/回调继续通过；零browser/Vue错误 |
| docs build/test/typecheck/content:check | 四项通过；84路由/998Demo，14文件157条，72组件内容校验；保留既有chunk警告 |
| Registry/inventory/tooling/Biome/diff | Registry19项及vue-native24 fixed/0 open、502行清单、8条tooling、18文件Biome及diff检查通过；Biome保留两个既有docs测试的5条非空断言警告，SFC由vue-tsc/浏览器/构建验证 |
| Apollo visual check Timeline | **未通过：36张missing-approved-baseline**；未接受候选/复制参考图或修改阈值 |

保留历史状态，不宣称Timeline新视觉验收或全库F11完成。未运行全仓verify:full/覆盖率；本阶段完成后自动本地提交，本阶段未推送。此前用户要求推送时已将当时17个已提交阶段推到origin/master（69d80782），本阶段未提交工作未混入该次推送。
