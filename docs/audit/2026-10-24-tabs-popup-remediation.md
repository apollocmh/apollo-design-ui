# F11 · Tabs 原生溢出插槽整改（2026-10-24）

## 契约与复现

Tabs 已有 popupRender/extra 槽，但 popupRender 按 React 的 `(menu, info)` 调用，Vue 模板不能解构完整上下文。more.popupRender 函数仍保留，extra computed 和底层 Dropdown setup 均锁定 slot 是否存在。依据 ADR 0006 / ADR 0007 直接修正，见 [迁移记录](../migrations/tabs-popup-slots.md)。

新增 vue-slots.test.ts，旧实现三条全部失败：OperationNode 的单对象槽与 onClose、Tabs 条件 extra、已挂载 Dropdown 的条件/空/移除 popupRender。日志 `/tmp/apollo-tabs-slots-red.log`。修复后全部通过；不把已有槽误报为从零新增。

Tabs → TabNavList → OperationNode → Dropdown → 内部 OverlayRenderer 全链路使用真实 Vue 槽，参数为 `{ originNode, restTabs, onClose }`，删除函数 prop 与强制槽断言。extra 在 render 求值，导航参数使用本帧的 extra 快照。Dropdown 将当前槽转交内部组件，使条件变化触发正常 Vue 更新。没有增加 DOM 包装或生命周期模拟。

more 公开类型仅保留实际消费的 icon/transitionName，移除未知键和渲染回调；原先“任意浮层 props 透传”的文档没有运行依据。移除 tabBar 的 never 断言后暴露 empty items 的 activeKey 可为 undefined，公开槽类型同步真实行为。

新增 popup-render 原生模板示例，Tabs Demo 从19增至20，全站994增至995。demo 与全站两处计数断言同步真实新增数量，并增加指定 Demo id 的断言，未降低断言。旧 #23.2 测试改为在渲染边界消费 OperationNode 已转发的槽，仍验证原始节点透传；尝试直接 setProps 修改子组件被 VTU 明确拒绝，该夹具错误不计产品缺陷，最终不修改子组件 props。真实菜单交互由新增 OperationNode 用例和生产浏览器覆盖。

## 验证

环境 Node22.22.2 / pnpm12.4.2：

| 命令 | 结果 |
|---|---|
| `pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/tabs/ packages/ui/src/dropdown/ --maxWorkers=1` | 14文件261条通过；含原有DOM/axe/主题与新增三条回归；最终夹具类型修正后两文件8条再验证通过 |
| `pnpm run lint:types` / scoped types project | 通过；4文件44条类型测试，零类型与source错误；旧双参slot/函数prop有负例 |
| `pnpm run build:ui` / UI L7 / published types | 声明与69份CSS生成；L7 11项通过、0 FAIL/PENDING；`node tests/consumer/tabs-types.mjs` 独立目录消费实际dist声明通过，无源码alias，测试夹具不进入产物 |
| `node tests/browser/tabs-popup.mjs` | Chrome150.0.7871.125，真实窄容器溢出、当前隐藏数量、原始菜单选择、onClose、动态/空/移除与稳定触发器通过，零browser/Vue错误；等待ARIA实际open而非离场残影 |
| 文档 test / typecheck / build / content:check | 14文件157条、类型检查、client/server SSG84路由、72组件内容校验通过；995Demo，新增order无缺失提示；既有大chunk警告保留 |
| Registry / inventory / tooling / scoped Biome / diff | Registry19项与vue-native24 fixed/0 open、501行清单一致性、8条tooling、15文件Biome与diff检查通过；Biome保留两份文档测试中既有5处非空断言警告；Vue夹具另由vue-tsc/浏览器验证 |
| `node tests/visual/apollo.mjs --check --component tabs` / `dropdown` | **未通过：分别缺39/9张已批准Apollo基线**；未接受新图/复制参考图/修改阈值 |

F11 清单当前501行，内容147/renderer79，12 verified /214 review /152 keep-data /123 skip。新 originNode 是槽参数，scanner 将其分入候选 review，不代表缺少公共 prop 插槽；本批不以静态分类冒充运行验收。全库F11及D04仍开放，未声明新视觉验收或全仓verify:full/覆盖率。
