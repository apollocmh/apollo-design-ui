# Mentions 包装层原生样式与 silent（2026-10-25）

首批8条回归修前6失败/2已有通过（裸形态CSR/SSR）；日志 `/tmp/apollo-mentions-bindings-red.log`。核实发现class/style在公开层本来已合并，**没有**全局丢弃：带clear或真实Form反馈时，RcMentions未向BaseInput外层转发合并后的根style；裸形态依旧工作。另有独立缺陷：公开silent被loading值替代，显式silent=true仍会Enter回填。

修复仅四行新增、一行替换：RcMentions声明style并分别向BaseInput及裸形态InternalMentions转发；包装时InternalMentions不产额外根，因此style仅落实际最外层。根class合并、style归一与共享BaseInput实现不改。silent改为loading || silent，loading始终禁止选择，显式silent可独立动态切换。没有新增公开API或兼容层。

8条修后通过，覆盖三形态class/style字符串/对象/数组/变量/移除、语义根恢复、textarea节点/值/焦点和id/ARIA落点、SSR真实外层样式；两种clear路径验证silent与loading切换及单次选择/change。新增生产模板夹具含真实Form反馈，并由实际发布声明消费端检查StyleValue绑定。双语API补充既有契约，Demo仍999。

## 检查结果

| 检查 | 实际结果 |
| --- | --- |
| 新增回归 | 修前6失败/2裸形态通过，修后8条全通过 |
| Mentions/Input/Tooltip 四层 | 30文件495条通过，保留既有jsdom canvas/pseudo-style提示 |
| 严格类型 / 实际声明消费者 | 全仓严格检查及实际发布消费者通过，含三形态StyleValue模板；公开类型形状不变，未重复前批70条类型项目 |
| UI / L7 | UI声明+69份CSS生成；UI L7 11项/0 FAIL/PENDING，保留既有unbuild提示 |
| 生产Chrome | Chrome150.0.7871.125通过三形态根样式/恢复、稳定root/editor、id/ARIA目标、silent/loading及单次选择；前批popup槽/回填/clear脚本也通过，零Vue/page错误 |
| docs build/test/typecheck/content:check | 四项通过：84路由/999Demo、14文件157条、72组件内容校验，保留既有chunk警告 |
| Registry / inventory / tooling / Biome / diff | Registry19项及vue-native24 fixed/0 open、519行清单校验、8条tooling、Biome6文件与diff通过 |
| Apollo visual | **未通过：24张missing-approved-baseline**，退出1；未生成或接受基线 |

其他内容槽、原生事件及全库F11继续复审；未运行全仓verify:full/覆盖率，历史completed/视觉维度不升级。未推送或打标签。

```sh
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/mentions packages/ui/src/input packages/ui/src/tooltip --maxWorkers=1
pnpm run lint:types
pnpm run build:ui
node tests/build/run.mjs --package ui --no-build
node tests/consumer/mentions-popup-types.mjs
node tests/browser/mentions-bindings.mjs
node tests/browser/mentions-popup.mjs
pnpm --filter @apollo-design/docs run build
pnpm --filter @apollo-design/docs run test
pnpm --filter @apollo-design/docs run typecheck
pnpm --filter @apollo-design/docs run content:check
pnpm run registry:check
pnpm run audit:content-slots:check
pnpm run test:tooling
node tests/visual/apollo.mjs --check --component mentions
```
