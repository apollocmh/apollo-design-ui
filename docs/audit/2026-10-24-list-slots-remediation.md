# F11 · List 内容插槽整改（2026-10-24）

## 问题与变更

List 仍使用 `renderItem(item,index)`，实际组件忽略示例中的 footer/load-more 插槽。类型与接口注释还宣称不使用 SFC 泛型；整组件废弃警告仅因 antd 6.6.4 上游决定而被继承，Apollo 没有对应决定。

按用户开发阶段直接修改的要求和 ADR 0006，移除 `ListProps.renderItem`，添加泛型 `ListSlots<T>` / `ListItemSlotProps<T>`，`#item` 与 dataSource、rowKey 共享 T。分页内索引、loading 有数据时保留列表、空态、grid/断点、复合导出、ref 契约保持覆盖。

header/footer/loadMore 在渲染中各求值一次，按存在性覆盖同名简单 prop，空 slot 压住 fallback 且不产生空头尾容器；loadMore 的存在性替换底部分页（包括空 slot），顶部分页保留。尾部边框依据同一内容快照和实际分页位置决定。slot 不在 computed/watch/setup 中求值。无函数兼容层或弃用期，迁移见 [记录](../migrations/list-slots.md)。

12 个现有示例改为 `#item`；simple 改为原生 v-for 模板，loadmore 统一为准确的 `#loadMore` 名称，vertical 的 footer 生效。单元、axe case 表、DOM baseline 调用、Vue 视觉调用逐一迁移，React 参考侧和图片阈值不变。移除整组件废弃警告与 Demo 的专属告警豁免；单元/axe 添加零告警检查。

## 复现与验证

- 修复前新增 `slots.test.ts` 的 6 条全部失败，日志 `/tmp/apollo-list-red.log`；修复后 6 条通过。覆盖分页当前 item/index、条件/响应性内容 slot、空 slot 的 fallback/边框/分页、0/空字符串 key 重排 DOM 身份、grid SSR、零废弃警告。
- 完整 List runtime：`pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/list/ --maxWorkers=1`，6 文件 123 条通过。保留原 DOM baseline、语义与 axe 扫描，不删除断言或豁免新差异。
- 新增 hydration 回归：SSR 根与 keyed input 复用，内容更新后 nativeElement 身份保持，各内容 slot 每轮只求值一次。
- 生产浏览器核对 ref 暴露发现根 `id` 已声明却未透传；补充的 attrs/SSR 两条先失败，显示原生字符串 style 被展开为 `0:c;1:o;…`，浏览器挂载还会抛 `TypeError`。改为渲染时调用已有 `mergeDomAttrs` 并显式绑定 id，覆盖 attrs-only 更新与同一根 DOM。日志 `/tmp/apollo-list-attrs-red.log`。
- `ListSlots.vue` 通过实际模板对 Row 和 number 做精确类型约束，unknown/any 均无法通过。UI 产物 tsconfig 排除 `__tests__`，避免把这个新夹具发布；根 lint 与 types 项目继续检查它，没有跳过类型门禁。

最终执行结果（Node 22.22.2 / pnpm 12.4.2）：

| 命令 | 结果 |
|---|---|
| `pnpm run lint:types` | 通过，包含实际 ListSlots.vue 精确类型夹具 |
| `pnpm exec vitest run --project types packages/ui/src/list/__tests__/type.test-d.ts` | 2 文件 34 条通过，无 source/unhandled 类型错误 |
| `pnpm run build:ui` | 通过，生成 SFC 声明与 69 份组件 CSS；无测试夹具进入 List 产物 |
| `node tests/consumer/list-types.mjs` | 独立临时目录消费构建后的包声明，item/index 精确推断与 compound 导出通过；无源码 alias |
| `node tests/build/run.mjs --no-build --package ui` | 11 项通过，0 FAIL / PENDING；构建由上条独立完成 |
| `node tests/browser/list-slots.mjs` | Chrome 150.0.7871.125 通过，零 browser/Vue 错误；条件/空/响应性 slot、ref、keyed DOM、加载更多、双分页、点赞、375/900px grid |
| `pnpm --filter @apollo-design/docs run test` | 14 文件 157 条通过 |
| `pnpm --filter @apollo-design/docs run typecheck` | 通过 |
| `pnpm --filter @apollo-design/docs run build` | client/server + SSG 84 路由通过；内容管线保持 994 Demo |
| `pnpm --filter @apollo-design/docs run content:check` | 72 组件通过；303 条旧 frontmatter order 提示仍开放 |
| `pnpm run test:tooling` | 8 条通过 |
| `pnpm run registry:check` | 19 项通过；历史 vue-native 24 fixed / 0 open |
| `pnpm run audit:content-slots:check` | 重生成后通过，73 interface / 490 行；7 verified、219 review、152 keep-data、112 skip |
| 修改范围 `biome check` / `git diff --check` | 36 文件格式检查通过，无新增诊断；diff 检查通过 |
| `node tests/visual/apollo.mjs --check --component list` | **未通过：33 张 missing-approved-baseline**，未生成/接受基线或调整阈值 |

构建阶段仍有现有 unbuild 的产物生成前 potential-missing 提示与 Vite 大 chunk 提示；实际构建后 L7/消费验证已通过。不把上述 scoped 检查称为全仓 `verify:full` 或覆盖率验收。

## 继续开放

List/Meta 其他内容字段不在本批迁移内。根 `extra` 有历史声明但实现未使用，双语文档如实标明待审查，不临时发明布局。List 拖拽示例继续在能力矩阵内开放。Registry 保留原 completed 历史状态，仅追加本批证据。F11 仍是逐组件整改，不以本批推断所有组件都满足插槽规范。

L6 图片基线和全仓最终验收不由上述行为测试替代；不生成参考图或修改阈值来宣称视觉通过。
