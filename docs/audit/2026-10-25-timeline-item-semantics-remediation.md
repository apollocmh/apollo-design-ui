# Timeline 项级语义数据转发（2026-10-25）

TimelineItemType 已公开 items[].classNames/styles（复用StepItem项级语义类型），但 useItems 转换只拿出 className/style，返回对象遗漏两个语义对象。已有 semantic Demo传了styles也会被丢弃；旧DOM投影不保留这些style值，不能作为这条契约的证据。

新增 item-semantics.test.ts 三条，修前全部失败（`/tmp/apollo-timeline-semantics-red.log`）：纯转换丢失语义对象；DOM找不到项级root类；SSR同样缺语义类。修复只补齐两个字段的原样转发；map明确返回StepItem以真实检查对象形状，去掉map/pending两处强制断言。没有改变算法、DOM结构或API，也没有删除VNode数据字段。

新测试验证root/content/rail的class与style、显式item.style覆盖item.styles.root的既有优先级，与#itemContent共用时数据更新仍保留输入节点和值，SSR保留项级类与style。浏览器夹具追加min-height值80→120、opacity .45→.7、rail dashed→dotted与旧类移除，保留此前数据/布局/attrs/RTL/current/折叠/点击和输入身份断言。

双语API补清样式合并顺序，Registry/KNOWN-ISSUES补运行证据，未重新宣称整组件验收。

| 检查 | 实际结果 |
|---|---|
| Timeline/Steps四层 | 14文件230条通过，新增3条；保留jsdom canvas提示 |
| 类型项目 / 全仓source types | 4文件32条通过；全仓 `pnpm run lint:types` 通过 |
| UI构建 / L7 / 产物消费者 | UI生成声明与69份CSS，保留既有unbuild警告；UI L7 11项通过、0 FAIL/PENDING；timeline-types真实产物消费者通过 |
| 真实Chrome | timeline-native.mjs / timeline-slots.mjs均通过，Chrome150.0.7871.125；项级语义初始/更新、类移除、输入保持及前批数据/布局/原生attrs/三槽全部通过，零browser/Vue错误 |
| docs build/test/typecheck/content:check | 四项通过；84路由/998Demo，14文件157条，72组件内容校验，保留既有chunk警告 |
| Registry/inventory/tooling/Biome/diff | Registry19项及vue-native24 fixed/0 open、502行清单、8条tooling、3文件Biome及diff检查通过；SFC夹具经vue-tsc/构建/浏览器验证 |
| Apollo visual Timeline | **未通过：36张missing-approved-baseline**；未接受候选或降低阈值 |

无公共API移除或迁移层，未改参考基线/阈值。未运行全仓verify:full/覆盖率，未推送或打标签。
