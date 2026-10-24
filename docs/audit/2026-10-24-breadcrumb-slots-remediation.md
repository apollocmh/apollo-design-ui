# F11 · Breadcrumb 原生内容与组合整改（2026-10-24）

## 实施与复现

依据 ADR0006/0007 直接移除四参数 itemRender 函数 prop，改为单对象 `#itemRender="{ route, params, routes, paths, href }"`。不为了保留 React 回调形态限制 Vue 模板；href 直接提供现有解析结果，paths 对每项复制以避免共享累积数组。公开类型、双语示例与调用测试同步，见 [迁移记录](../migrations/breadcrumb-slots.md)。

新增 vue-slots.test.ts，旧实现三条全失败：原生 itemRender 槽及逐项上下文、条件/空/移除内容、默认子组件更新与 keyed 输入身份。有效复现日志 `/tmp/apollo-breadcrumb-slots-red.log`。修复后三条通过；不将静态读码当作额外独立故障的运行证明。

类型门禁额外复现基础工具 ChildrenInput 比 Vue VNodeChild 窄：嵌套 void 被拒绝，运行时原已处理空值。声明改为复用 Vue 的递归 VNodeChild，并保留只读数组/getter支持，补公开类型正例；无 any/强制断言/诊断豁免。实现中的一次泛型误插和测试槽声明偏窄也由类型门禁拒绝，已修正；初次 source errors 不作为通过证据。

默认子节点不再终身缓存；每帧读取一次，items 有值时不读默认槽。cloneVNode 保留调用方 key，原生组合不沿用上游整组件弃用警告，非法子节点 usage 检查与其他数据字段警告仍有既有回归。内部默认链接 helper 保留，无公共函数适配入口。

旧四参数 unit/type 断言依据新契约改为单对象，保留单次调用、原始内容替换和返回值负例。L4 自定义用例通过 slot 产生相同语义输出，React 基线生成器/JSON 均未改动。新增 scoped-item 原生 Demo，Breadcrumb9→10个、全站995→996个；计数哨兵同步且补指定Demo id断言。

## 验证

环境 Node22.22.2 / pnpm12.4.2：

| 命令 | 结果 |
|---|---|
| `pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/breadcrumb/ --maxWorkers=1` | 6文件94条通过，含新增三条、既有DOM/axe/主题与10个Demo |
| `pnpm exec vitest run --project unit packages/utils/src/__tests__/to-array.test.ts packages/ui/src/breadcrumb/ --maxWorkers=1` | 4文件67条通过，既有展平算法和Breadcrumb交互覆盖 |
| `pnpm run lint:types` / scoped types project | 最终源码检查通过；utils API + Breadcrumb 类型项目4文件138条通过，零类型/source错误，包含旧函数prop/多位置槽负例 |
| `pnpm run build:ui` / UI L7 / published types | UI声明/69份CSS与utils构建通过；UI L7 11项通过，utils L7 11项中5项有架构理由n/a，均0 FAIL/PENDING；`node tests/consumer/breadcrumb-types.mjs` 独立目录消费实际dist声明通过，无源码alias |
| `node tests/browser/breadcrumb-slots.mjs` | Chrome150.0.7871.125通过：逐项paths/href、参数42→43、条件/空/恢复、原生子组件重排的输入值与节点身份；零browser/Vue错误 |
| 文档 test / typecheck / build / content:check | 14文件157条与最终类型检查通过；client/server SSG84路由构建通过；996个Demo；72组件内容校验通过；既有大chunk/unbuild产物探测警告保留 |
| Registry / inventory / tooling / scoped Biome / diff | Registry19项与vue-native24 fixed/0 open、501行清单一致性、8条tooling、17文件Biome/diff检查通过；Biome保留两份文档测试中既有5处非空断言警告；Vue夹具由vue-tsc/浏览器验证 |
| `node tests/visual/apollo.mjs --check --component breadcrumb` | **未通过：24张missing-approved-baseline**；未接受新图或修改阈值 |

F11仍开放，清单501行：内容147/renderer78/内部71，12 verified /213 review /152 keep-data /124 skip。新原生协议不自动升级为组件整体验收。未执行全仓verify:full/覆盖率，也未声称Apollo新视觉验收完成。
