# F11 · Steps 原生作用域槽与内联Tooltip（2026-10-25）

StepsSlots已有四槽DTO，组件却没挂SlotsType；`.vue`四个精确作用域夹具修前全部类型错误，原8条类型断言虽过、命令仍因4条source错误失败（`/tmp/apollo-steps-scoped-types-red.log`）。现公开/内部槽接入SlotsType，返回值为VNodeChild；类型化图标上下文/标签消除Root→Step→StepIcon的never/unknown桥接。节点变量准确声明VNodeChild，保留Vue空内容与动态槽语义，测试调用方也不再用never强行通过。

运行回归另外发现两条缺陷：inline+itemRender捕获重新赋值后的Tooltip节点，默认槽返回自身，修前直接堆栈溢出并产生大量zIndex层叠警告（`/tmp/apollo-steps-inline-red.log`）；修复闭包后，另补无itemRender的默认inline场景仍失败，原实现完全不创建Tooltip（`/tmp/apollo-steps-inline-default-red.log` 两过一失败）。现捕获真正originNode，默认或自定义itemRender共用Tooltip路径；正文走原生#title槽，避免原先`title as never`掩盖字符串prop与VNode内容不匹配。富内容标题真实Teleport单测通过，未关闭appear/Teleport或删断言。

直接移除未消费的StepsSlots.default空声明，四槽名字/单对象载荷保持，不加renderer prop兼容层。迁移记录见 `docs/migrations/steps-native-slots.md`。自定义点demo删去h包装与两段无用渲染函数，改原生span。新增native-slots Demo检查四槽、当前active/status/data、条件/空/恢复、输入状态及两种内联提示；Steps20→21，全库998→999。a11y计数最初遗漏同步造成唯一失败，修正为真实21，不移除新增axe场景。既有DOM参考基线未改。

| 检查 | 实际结果 |
|---|---|
| Steps/Timeline/Tooltip四层 | 22文件317条通过，新增3个inline场景及Demo/axe；保留jsdom canvas提示 |
| 类型项目 / 全仓source types | 6文件42条通过；全仓 `pnpm run lint:types` 通过 |
| UI build / L7 / 实际声明消费者 | UI声明与69份CSS生成；UI L7 11项、0 FAIL/PENDING；steps-slots-types真实声明消费四槽精确类型及两个原生模板通过，无source alias；保留既有unbuild警告 |
| 生产Chrome | steps-native-slots.mjs通过，Chrome150.0.7871.125；四槽当前active/status/data、条件/空/恢复、输入节点/value、带/不带itemRender的真实Tooltip均通过，零browser/Vue错误 |
| docs build/test/typecheck/content:check | 最终双语说明四项通过，84路由/999Demo、14文件157条、72组件内容校验，保留既有chunk警告 |
| Registry/inventory/tooling/Biome/diff | Registry19项及vue-native24 fixed/0 open、506行清单校验、8条tooling、17文件Biome及diff通过；Biome保留两个既有docs测试的5条非空断言警告，SFC经vue-tsc/构建/浏览器验证 |
| Apollo visual Steps | **未通过：9张missing-approved-baseline**；未接受候选/复制参考图或修改阈值 |

未运行全仓verify:full/覆盖率；不宣称全库F11或新视觉验收。未改基线/阈值，未推送或打标签。


本批主要复验命令（其余docs/registry脚本见上表与根WORKFLOW）：

```sh
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/steps packages/ui/src/timeline packages/ui/src/tooltip --maxWorkers=1
pnpm exec vitest run --project types packages/ui/src/steps packages/ui/src/timeline packages/ui/src/tooltip --maxWorkers=1
pnpm run lint:types
pnpm run build:ui
node tests/build/run.mjs --package ui --no-build
node tests/consumer/steps-slots-types.mjs
node tests/browser/steps-native-slots.mjs
pnpm --filter @apollo-design/docs run build
pnpm --filter @apollo-design/docs run test
pnpm --filter @apollo-design/docs run typecheck
pnpm --filter @apollo-design/docs run content:check
pnpm run registry:check
pnpm run audit:content-slots:check
pnpm run test:tooling
node tests/visual/apollo.mjs --check --component steps
```
