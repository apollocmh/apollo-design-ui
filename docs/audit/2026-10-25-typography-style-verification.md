# Typography 原生样式线索验证（2026-10-25）

这是VERIFY结果，未修组件实现。源码中Base/InternalTypography/Editable存在对象展开，但21条真实公开入口回归在原实现全部通过，日志 `/tmp/apollo-typography-native-styles-red.log`（文件名来自预期红测，实际21通过）。不能为制造失败绕过公开SFC边界。五个SFC的v-bind编译为mergeProps，Vue以normalizeStyle([old,new])提前将纯style字符串解析为CSS对象；因此对象展开线索在这些公共路径没有形成缺陷。

覆盖五入口动态string→mixed-array→object→undefined、数组/对象对照、五入口四形态SSR、Text/Paragraph编辑及编辑SSR。样式优先级、移除后的semantic root恢复、CSS变量、无numeric CSS污染、aria-label、textarea/root身份、草稿及焦点均通过。保留21条回归作为证据，不引入兼容层或修改内部style类型。

保留semantic Demo原四例，新增动态StyleValue和草稿保持示例；将其中无效的旧root-class-name残留改成已存在的原生class，配对说明和API补充既有契约，Demo数量不变。生产脚本验证五入口、两编辑和富内容共八根，以及实际semantic Demo循环。原生class/style仍属于attrs，textarea内部继续走styles.textarea。

## 检查

| 检查 | 实际结果 |
| --- | --- |
| 原实现21条回归 | 全通过，CSR/SSR和两编辑分支无numeric污染/Vue警告，已通过项作为对照保留 |
| Typography四层 | 7文件283条通过，保留既有SSR/行为/ARIA/主题断言 |
| 严格类型 / 发布消费者 | 全仓lint:types通过；原生StyleValue、semantic Demo/fixture及上一批槽/编辑/ref发布声明模板通过 |
| 生产Chrome | Chrome150.0.7871.125：八根的四形态循环、class/变量/回退、两textarea与富输入身份/草稿/焦点、textarea aria/semantic目标、实际Demo通过；零Vue/page错误 |
| docs build/test/typecheck/content:check | 全通过：84路由/999Demo、14文件157条、72组件；保留已有chunk提示 |
| Registry / inventory | 19项、vue-native24 fixed/0 open，520行/19个具体字段校验通过，Biome4源码文件及diff通过；没有虚增新修复字段 |

复用fe29bf0f最终生产dist；本批未改发布组件源/CSS/类型，不重复UI/L7/视觉验收，不声明组件重新完成。历史视觉基线缺口与其他F11继续保留，未运行全仓verify:full/覆盖率，未推送或打标签。


```sh
pnpm exec vitest run --project unit packages/ui/src/typography/__tests__/native-styles.test.ts --maxWorkers=1
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/typography --maxWorkers=1
pnpm run lint:types
node tests/browser/typography-styles.mjs
node tests/consumer/typography-slots-types.mjs
pnpm --filter @apollo-design/docs run build
pnpm --filter @apollo-design/docs run test
pnpm --filter @apollo-design/docs run typecheck
pnpm --filter @apollo-design/docs run content:check
pnpm run registry:check
pnpm run audit:content-slots:check
```
