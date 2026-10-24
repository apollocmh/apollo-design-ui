# F11 · Drawer Vue 插槽与原生属性整改（2026-10-24）

## 契约与复现

Drawer 已存在 title/footer/extra/closeIcon 四个内容槽，本次不将它们误报为缺失。依据 ADR 0007，修正为保留旧形态而损害 Vue 用法的边界；迁移写法见 [Drawer 迁移记录](../migrations/drawer-vue-contracts.md)。

新增 slots.test.ts，使用真实 Teleport（内联容器 false），旧实现三条均失败：标题一帧重复消费、空头尾切换重建正文、显式外部 aria-labelledby 被忽略。日志 `/tmp/apollo-drawer-slots-red.log`。初版测试沿用了全局 Teleport stub，产生插槽出现就重挂载的夹具现象；修正为真实 Teleport 后重新取得上述有效复现，没有将 stub 行为算作产品故障。追加 PurePanel 原生 id/字符串 style/事件复现，旧实现一条失败、此前三条修复后通过，见 `/tmp/apollo-drawer-pure-attrs-red.log`。

实现每次包装层 render 只求值一次 title，内容与自动 ARIA 使用同一快照；runtime prop 改为 Vue 规范化的 ariaLabelledby，与既有公开类型一致，模板 aria-labelledby 生效。私有面板 header/body/footer 使用稳定 key，在条件切换中保留正文 DOM。PurePanel 移除旧 className/style 声明，透传根 attrs，并把配置注入移回 setup。

导出 DrawerSlots、声明真实组件槽类型，移除 slot 读取的未知对象强制断言。getContainer 使用共享 GetContainer 类型，修复真实模板传 false 的推断并对齐 Portal 的既有运行能力。没有插槽函数兼容层、额外 DOM 包装或视觉阈值调整。

## 验证

环境 Node 22.22.2 / pnpm 12.4.2。实际执行结果：

| 命令 | 结果 |
|---|---|
| `pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/drawer/ packages/ui/src/modal/ --maxWorkers=1` | 15 文件 225 条通过，包含四条新增回归 |
| `pnpm run lint:types` | 通过，包含实际 Vue 模板 false 容器/具名槽消费 |
| `pnpm exec vitest run --project types packages/ui/src/drawer/ packages/ui/src/modal/ --maxWorkers=1` | 4 文件 42 条通过，零类型错误 |
| `pnpm run build:ui` | 通过，声明和 69 份组件 CSS 生成；保留 unbuild 既有产物探测警告 |
| `node tests/browser/drawer-slots.mjs` | Chrome 150.0.7871.125 通过；动态/空内容、外部与自动 ARIA、正文节点及输入值保留，零 browser/Vue 错误 |
| `node tests/build/run.mjs --package ui --no-build` | 11 项通过，0 FAIL/PENDING |
| 文档站 test / typecheck / build / content:check | 14 文件 157 条、类型检查、client/server SSG 84 路由及 72 组件内容校验通过；994 Demo；既有大 chunk 警告保留 |
| tooling / Registry / inventory / scoped Biome / diff 检查 | 8 条 tooling、19 项 Registry 与 vue-native 24 fixed/0 open、501 行清单一致性、11 文件 Biome 和 diff 检查通过；Vue fixture 不在 Biome 支持范围，由真实 vue-tsc/浏览器验证 |
| `node tests/visual/apollo.mjs --check --component drawer` | **未通过：9 张 missing-approved-baseline**；未接受新图或复制参考图 |

F11 清单现为 501 行：DrawerSlots 五个字段归内部插槽协议，12 verified / 214 review / 152 keep-data / 123 skip。没有将私有面板字段升级为公开缺口或 verified，统计无法代表整组件的运行验证。

全库 F11 与非默认 prefixCls 的 D04 继续开放；本次不宣称 Drawer 完成 Apollo 新视觉验收或执行全仓 verify:full/覆盖率。Registry 仅追加本批证据，保留历史状态含义。
