# Image 当前全局语义配置（2026-10-25）

正式15条回归在隔离原实现上12失败/3已有通过，无未处理异常。原始及类型修正后的日志分别为 `/tmp/apollo-image-provider-reactivity-red.log`、`/tmp/apollo-image-provider-reactivity-typed-red.log`。初始CSR、SSR和同一对象深修改原本正常；替换classNames/styles对象、整个image或整个components map、晚出现和移除过期。

Image setup解构捕获了初始语义对象。保留 `useComponentConfig<ImageSemanticType>('image')` 返回对象，在既有合并getter中读取当前classNames/styles，并移除两处掩盖字段形态的Record<string, never>断言。合并顺序与原生/local覆盖保持，当前VNode/富输入身份、草稿和焦点保留。局部15条修后通过。

未改共享Provider、前缀、group合并规则或新增函数式API。ImageSemanticType仍是静态对象契约；弱映射允许unknown字段不等于声明函数式支持。Provider popup样式初始接线、PreviewGroup语义、前缀动态及renderer配置继续按独立问题验证。无公开名称或配置形态变更，无迁移兼容层。

现有style-class Demo保留原示例与原生样式循环，新增独立的empty → A → B → removed全新components map操作。生产浏览器fixture另覆盖对象字段/whole-image/whole-map/late/remove/deep对照，提交前补实际结果。

## 检查

核心里程碑94f0b11a已验证：Image/ConfigProvider四project共16文件225条通过，根严格检查通过，UI声明及69份CSS构建通过，L7复用本次产物11项0FAIL/0PENDING。Registry19项、内容清单检查与tooling8条通过。只记录本批证据，不升级历史completed或视觉维度。

Demo复核观测到既有浅合并边界：本地styles.placeholder.progress整组覆盖Provider同组样式，类名仍按schema拼接。这与getter快照修复不同；本批保留已有合并约定，浏览器须验证该局部覆盖，公开说明不能承诺被覆盖的Provider组内CSS变量仍保留。不修改共享合并层或据此宣称新的全局合并规范。

新增Demo最初的过宽断言实际失败于progress根变量缺省，日志 `/tmp/apollo-image-provider-demo-boundary-red.log`。根据既有按键浅合并契约修正错误期待，替代覆盖明确验证4个Provider进度组变量缺省及indicator字段不叠加，同时保留Progress当前类名/公共根变量、普通root/img/cover动态/移除、局部/native优先级和节点/焦点断言；未删除原有正确回归或改源合并规则。

最终Chrome150.0.7871.125生产包检查通过：对象字段/整image/整map替换、late/remove、deep对照、当前槽scope、根/图片/cover/input身份与草稿/焦点、真实Demo empty/A/B/移除及上述覆盖边界，零Vue/page错误，见 `/tmp/apollo-image-provider-browser.log`。这份产物对应getter里程碑，后续prefix源码变化未用于本次证据。

发布消费端复制真实Demo及ImageProvider.vue，vue-tsc通过，无源码alias或测试声明。文档全流水线build/test/typecheck/content通过：84路由、999Demo、14文件157测试和72组件；仅修正最后的Demo解释文案后，重新build/content:check通过，类型及测试复用本批未变Vue/源码的已通过结果。日志 `/tmp/apollo-image-provider-docs.log`、`/tmp/apollo-image-provider-docs-final.log`、`/tmp/apollo-image-provider-consumer.log`。改动代码Biome通过，git diff检查通过。视觉仍明确缺9张Apollo批准基线，未更新批准图。

```sh
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/image packages/ui/src/config-provider --maxWorkers=1
pnpm run lint:types
pnpm run build:ui
node tests/consumer/image-slot-types.mjs
node tests/build/run.mjs --package ui --no-build
node tests/browser/image-provider.mjs
pnpm --filter @apollo-design/docs run build
pnpm --filter @apollo-design/docs run test
pnpm --filter @apollo-design/docs run typecheck
pnpm --filter @apollo-design/docs run content:check
pnpm run registry:check
pnpm run audit:content-slots:check
pnpm run test:tooling
node tests/visual/apollo.mjs --check --component image
```
