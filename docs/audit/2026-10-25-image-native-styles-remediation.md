# Image 原生根样式（2026-10-25）

从公开Image入口实际复现字符串style抛出CSSStyleDeclaration的数字键错误，以及根padding覆盖img的语义padding。mixed-array与移除回退原本已正常，作为对照保留。原实现副本、仓库外首轮日志保存在 `/tmp/apollo-image-native-audit-path` 指向的目录。正式首批3条回归全部失败，日志 `/tmp/apollo-image-native-style-red.log`；修后3条已通过，继续补CSR/SSR及动态边界。

最终正式12条在保全原Image.ts上由临时Vite pre-loader加载：11失败/1已有通过，日志 `/tmp/apollo-image-native-style-original.log` 明确标注baseline override，未恢复或覆盖正在开发的源文件。修后12条全过。覆盖三种style的SSR、attrs-only更新、富input/img/root身份与草稿/焦点、百分比/busy/纯VNode占位、名称移除默认回退、受控ARIA和click/error/图片槽隔离。全量Image四project为8文件98条通过。

本批修正原生style的Vue合并与根/图片落点，不因相似静态代码修改已被实际测试证伪的其他组件。样式取值不再复制到img，图片自身使用styles.image。公共类型保持原生attrs形态；迁移见 [记录](../migrations/image-native-styles.md)。

Progress与纯占位实际根原来丢失native class/style/id/data/名称ARIA，修复在Image的提前返回处路由到原有单根Progress，不增加DOM或改写Progress。过滤role/range/busy受控键及undefined aria-label，保留当前语义及移除后的百分比名称；click单次通知，不调用开预览的内部处理，不向占位根转发图片error。回归另复现placeholder.progress的公开嵌套类被当作字符串丢失并警告，补全该嵌套schema，去掉进度styles处不必要的as never；不修改共享语义合并器。

全局配置整体替换和prefixCls更新已有独立失败复现，留作后续主题；不夹带renderer、事件或前缀策略变化。

## 检查

根严格检查通过。新增测试的StyleValue使用浅引用，ARIA更新通过真实父级attrs，语义/placeholder对象保持同一引用，未新增公共prop或忽略类型诊断。文档顺序build → test → typecheck → content:check全部通过：84路由、999个Demo、14文件157条测试及72组件检查。Registry检查19项、内容清单检查及tooling8条通过。保留既有completed及视觉历史含义，不因本批样式修复宣称完整Image验收。

发布消费端复制实际样式Demo及ImageStyles.vue，严格vue-tsc通过，无源码alias或测试声明。Chrome150.0.7871.125生产包验证四种根形态的字符串/数组/对象/移除循环、纯attrs更新、root/img独立padding与inline变量、稳定富节点/草稿/焦点，以及进度三态ARIA/事件和真实Demo，零Vue/page错误；原image-render脚本含无结束事件预览关闭也复跑通过。新增浏览器/消费代码Biome3文件通过；此前源代码/回归Biome4文件通过，git diff检查通过。日志分别为 `/tmp/apollo-image-styles-browser.log`、`/tmp/apollo-image-native-style-render-browser.log`、`/tmp/apollo-image-native-style-consumer.log`。

UI构建已生成声明和69份CSS；L7复用本次产物，11项0FAIL/0PENDING。视觉检查仍失败，缺9张Apollo批准基线，未更新或复制旧参考图作为批准图。公共类型未变，保留上一阶段4文件10条类型门禁证据；本批以根严格检查及复制真实Demo/浏览器fixture的发布包vue-tsc验证新增消费代码。

```sh
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/image --maxWorkers=1
pnpm run lint:types
pnpm run build:ui
node tests/consumer/image-slot-types.mjs
node tests/build/run.mjs --package ui --no-build
node tests/browser/image-styles.mjs
node tests/browser/image-render.mjs
pnpm --filter @apollo-design/docs run build
pnpm --filter @apollo-design/docs run test
pnpm --filter @apollo-design/docs run typecheck
pnpm --filter @apollo-design/docs run content:check
pnpm run registry:check
pnpm run audit:content-slots:check
pnpm run test:tooling
node tests/visual/apollo.mjs --check --component image
```
