# Image / Group 原生Vue开合模型（2026-10-25）

旧公开文档承诺Image支持v-model:open，但公开props没有open。真实SFC隔离10条8失败/2已有通过，两条精准模板诊断指出Image/Group缺open；旧承诺快照、调用者调查和证据位于 `/tmp/apollo-image-open-model-repro/`。没有模型调用者不构成删除承诺的理由。正式最小真实SFC两入口父模型驱动修前2条全失败，日志 `/tmp/apollo-image-preview-state-model-red.log`。

配置形态下另有defaultOpen、Group初始控态/拒绝请求、非控prevOpen和点击绕过通知的8条失败证据。直接用顶层open/defaultOpen和typed update:open/openChange兑现Image既有承诺，Group作同名一致性扩展；不先修旧配置再增加第二套优先级。PreviewConfig移除5个状态字段，Group change/current改typed Vue事件。正确payload、当前监听器及先后顺序保持，非状态业务配置不夹带迁移。

实现只用Vue ref/computed/watch。open默认undefined，defaultOpen只初始化；watch同步当前控态供移除控制时接续。setter先捕获有效前态，再条件写内态并发请求。Group初始和后续同一路读取、点击走同一setter；preview=false不会隐藏潜在打开状态。

29条局部状态/真实SFC模型回归及6个迁移unit文件91条已通过。类型验证模型/数字payload和旧字段删除，调用者逐个迁移且保留原断言；私有Preview的内部open控制未机械改写。具体旧/新写法见 [迁移](../migrations/image-open-model.md)。组件状态位置决定同步API、类型、Demo和测试，遵循既有Vue模型规范及ADR 0007，没有引入全库新兼容政策。

## 检查

- Image/ConfigProvider全量19文件288条运行回归通过，根严格检查通过；Image类型8文件18条通过，无类型错误，旧状态配置及错误payload保留明确负例。
- UI构建含公开声明/69份CSS；发布消费端复制两真实控制Demo、模型browser fixture和精确类型fixture，vue-tsc通过，无源码alias/测试声明；L7复用本次产物11项0FAIL/0PENDING。
- Chrome150.0.7871.125三条生产浏览器首次通过，零Vue/console/page错误：模型初值/父驱动/内部回写、拒绝650ms持续观察（覆盖500ms离场deadline且保持opacity1）、default只初始化、正确prev、数组/once/当前监听器、Group current与两个真实Demos；迁移后的原native-events/styles脚本原断言也全部保留通过。日志 `/tmp/apollo-image-open-model-browser.log`、`/tmp/apollo-image-state-native-events-browser.log`、`/tmp/apollo-image-state-styles-browser.log`。
- 文档build/test/typecheck/content顺序全部通过：84路由、999Demo、14文件157测试和72组件内容检查；Registry19项/内容清单/tooling8条通过，代码Biome及git diff检查通过。
- 清单重算513行，其中data127、review202、verified19；移除旧配置状态字段引起数据行减少，不虚增插槽verified。视觉仍缺9张Apollo批准基线。历史completed和视觉状态保留证据范围，完整focusTrap及其他预览扩展另行整改。

最小测试最初两条全红，既有配置形态16条隔离为8红8绿；迁移真实公共写法后保留相同controlled/default/prev断言并扩到29条。Group类型测试最初错误地从根入口导入原本未导出的GroupPreviewConfig，已改用现有image入口；负例和参数断言全部保留，不扩大无关导出或忽略诊断，错误导入日志保留。

```sh
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/image packages/ui/src/config-provider --maxWorkers=1
pnpm run lint:types
pnpm exec vitest run --project types packages/ui/src/image --maxWorkers=1
pnpm run build:ui
node tests/consumer/image-slot-types.mjs
node tests/build/run.mjs --package ui --no-build
node tests/browser/image-open-model.mjs
node tests/browser/image-native-events.mjs
node tests/browser/image-styles.mjs
pnpm --filter @apollo-design/docs run build
pnpm --filter @apollo-design/docs run test
pnpm --filter @apollo-design/docs run typecheck
pnpm --filter @apollo-design/docs run content:check
pnpm run registry:check
pnpm run audit:content-slots:check
pnpm run test:tooling
node tests/visual/apollo.mjs --check --component image
```
