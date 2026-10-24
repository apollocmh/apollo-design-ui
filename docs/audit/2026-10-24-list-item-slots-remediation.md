# F11 · List.Item / Meta 内容插槽增量（2026-10-24）

## 契约与实施

前一阶段的 List 泛型 item/header/footer/loadMore 已在 `0b946039` 提交，台账在 `5fcc2a98`。本阶段接通 ListItem.extra/actions 和 ListItemMeta.avatar/title/description 五个内容插槽，导出 ListItemSlots / ListItemMetaSlots / ListItemRef。简单内容 prop 与 actions 的 VNode 数组数据继续有效，不增加函数适配层。完整写法和边界见 [迁移记录](../migrations/list-slots.md)。

slot 存在即优先，包括空 slot。extra 在 vertical 且非空时生成 main/extra 两段，horizontal 仍与主体平级；Meta 的头像、标题和描述独立判断，0 可显示，标题继续使用 h4。actions 展开数组/Fragment，忽略注释和纯空白，每个可见顶层节点一个 li，相邻项一个分隔线；保留调用方的 action key，使重排保留控件 DOM。actions prop 数组保持原数组项语义。

移除 Item 的 onBeforeUpdate/getChildNodes 跨帧缓存，以及 computed 对默认 slot 的消费。默认/具名槽均在 render 内各求值一次，布局依据同一快照，attrs 在本次 render 路由到原来的元素。Item 暴露 ref 仍为普通模式的 li / grid 模式的外层 Col div，通过类型化 Col ref 获取其公开 nativeElement，移除旧的未知对象强制断言。

4 个现有 Demo（basic、vertical、item-extra、component-token）使用原生子组件模板，无需新增 Demo 数量。构建声明消费夹具同时覆盖新增槽名。默认布局不变；vertical 的 extra 从空变为非空时需要切换主体容器，该布局转换不承诺重挂载主体的 DOM 身份。同一布局内内容更新、keyed actions 重排和 SSR hydration 有身份覆盖。

## 复现与验证

新增 item-slots.test.ts：用已提交旧实现复现，8 条中 7 条失败、1 条 attrs 行为原已通过；不把已通过场景归为新发现故障。初次夹具重复注册了全局 auto-unmount，修正后重新运行有效复现，以上计数来自实际行为断言。日志 `/tmp/apollo-list-item-red.log`。

当前新实现完整 List runtime：`pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/list/ --maxWorkers=1`，7 文件 131 条通过，包括既有 DOM/axe/主题与首批回归，未更改基线、阈值或豁免。新增覆盖条件出现/移除、空 slot 压住 fallback、独立 Meta wrappers/heading、extra 布局与语义样式、actions Fragment/空白/keyed 重排、每次 render 求值一次、原生 attrs、SSR hydration。

最终执行结果（Node 22.22.2 / pnpm 12.4.2）：

| 命令 | 结果 |
|---|---|
| `pnpm run lint:types` | 通过，包含 Item/Meta SFC 和实际模板消费夹具 |
| `pnpm exec vitest run --project types packages/ui/src/list/__tests__/type.test-d.ts` | 2 文件 36 条通过，无 source/unhandled 错误 |
| `pnpm run build:ui` | 通过，69 份组件 CSS 与 SFC 声明 |
| `node tests/consumer/list-types.mjs` | 独立目录消费产物声明通过，模板包含新增五个具名槽；无源码 alias |
| `node tests/browser/list-slots.mjs` | Chrome 150.0.7871.125；父/子插槽与 4 个实际 Demo、条件/空内容、Meta heading、keyed actions DOM、普通/grid ref，零 browser/Vue 错误 |
| `node tests/build/run.mjs --no-build --package ui` | 11 项通过，0 FAIL/PENDING，复用上述构建 |
| `pnpm --filter @apollo-design/docs run test` | 14 文件 157 条通过 |
| `pnpm --filter @apollo-design/docs run typecheck` | 通过 |
| `pnpm --filter @apollo-design/docs run build` | client/server + SSG 84 路由通过；994 Demo，数量未增加 |
| `pnpm --filter @apollo-design/docs run content:check` | 72 组件通过，303 条旧 order 提示继续开放 |
| `pnpm run test:tooling` | 8 条通过 |
| `pnpm run registry:check` | 19 项通过，vue-native 历史 24 fixed / 0 open |
| `pnpm run audit:content-slots:check` | 496 行：12 verified、214 review、152 keep-data、118 skip；与源码一致 |
| 范围内 `biome check` / `git diff --check` | 34 文件格式检查通过，diff 检查通过 |
| `node tests/visual/apollo.mjs --check --component list` | **未通过：33 张 missing-approved-baseline**；未接受新图或调整阈值 |

保留 Vite 大 chunk、unbuild 产物生成前 potential-missing 与 303 条旧文档 order 提示的既有事实，不把 scoped 通过称作全仓 verify:full/覆盖率/新视觉验收。

## 未完成项

全库 F11、List 根 extra 的历史无实现字段与拖拽示例继续开放。Registry 保留历史 completed 的含义，只追加本批证据，不宣称完整新验收。List 的 Apollo 已批准图片基线缺失沿用原问题，本批不复制参考图或调整视觉阈值。
