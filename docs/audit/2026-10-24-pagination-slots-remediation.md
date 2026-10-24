# F11 / F10 · Pagination 原生插槽与容器转发整改（2026-10-24）

## 契约与复现

按 ADR0006/0007 直接移除 itemRender/showTotal/sizeChangerRender 三个渲染函数 prop，原生 #itemRender/#total 改为单个具名对象，#sizeChanger 沿原生槽传递。List/Table 新增三个 pagination 前缀槽，完整写法见 [迁移记录](../migrations/pagination-slots.md)。没有函数兼容、弃用期或两套载荷适配。

新增 vue-slots.test.ts，旧实现六条全部失败：多位置参数、动态 item/size 槽、根 attrs/string style 与容器 total 转发。日志 `/tmp/apollo-pagination-slots-red.log`。修复后六条通过，覆盖单次尺寸更新、SSR、attrs-only 更新与根身份。容器测试的旧实现先在 List 断言失败，不能据此宣称已独立执行完旧 Table 路径；新实现两容器路径均实际执行通过。

Pager/Options 使用真实槽，删除内部 renderer 注入函数；root 默认 Select 渲染不读取缓存的槽存在性。页码/prev/next/jump-prev/jump-next 均传单对象，空内容不回退。Table 的分页 VNode 改为 render 期创建，动态槽不被 computed 缓存；List 每次创建顶部/底部实例时转交当前槽。

根原生 attrs/events 经过已有 DOM helper，style 使用 Vue normalizeStyle；没有为旧 whitelist 保留另一条路径。旧 total/itemRender unit、L4、axe 调用迁为槽，保留范围、末页、simple、节点替换、默认 DOM 与可访问性断言，React 基线生成器/JSON 未改。原函数 prop 优先级测试改为有效的空 sizeChanger 槽抑制默认 Select；类型负例明确拒绝旧函数入口。

产物声明消费进一步暴露 PaginationConfig 缺少已有业务回调类型，补 onChange/onShowSizeChange，Table 继承同一配置协议；List 不再断言未知对象取回调。它们是状态命令/通知，不是渲染函数。消费者夹具以显式 refs 同步受控配置，不把固定 pageSize 当非受控值。三容器槽声明直接引用共享 payload 类型，保持对外签名一致。

4 个 Pagination Demo、List 的 simple 示例与 2 个 Table 分页示例迁为模板，相关 Markdown 同步；另增 native-slots Demo，Pagination14→15、全站996→997。两个站点计数哨兵同时增加指定Demo id断言。

## 验证

环境 Node22.22.2 / pnpm12.4.2：

| 命令 | 结果 |
|---|---|
| `pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/pagination/ packages/ui/src/list/ packages/ui/src/table/ --maxWorkers=1` | 最终21文件692条通过，含原有DOM/axe/主题、三组件Demo与六条新增回归 |
| `pnpm run lint:types` / scoped types project | 最终源码检查通过；4文件66条类型测试通过，零类型/source错误，包含单对象载荷、容器协议与旧函数入口负例 |
| `pnpm run build:ui` / UI L7 / published declarations | 最终UI声明和69份CSS生成；L7 11项通过、0 FAIL/PENDING；`node tests/consumer/pagination-types.mjs` 独立目录消费实际dist声明通过，无源码alias，原生Pagination及List/Table六个模板槽均检查 |
| `node tests/browser/pagination-slots.mjs` | Chrome150.0.7871.125通过：原生item/total/size的条件/空/更新、单次page/size事件、原生click/style和根身份；List/Table三个槽、顶部/底部范围与每动作单次业务回调；零browser/Vue错误 |
| 文档 test/typecheck/build/content:check | `pnpm --filter @apollo-design/docs run <script>` 四项通过；14文件157条、最终类型检查、client/server SSG84路由、72组件内容校验通过；997Demo；既有大chunk和unbuild产物探测警告保留 |
| Registry/inventory/tooling/scoped Biome/diff | Registry19项与vue-native24 fixed/0 open、499行清单一致性、8条tooling、20文件Biome和diff检查通过；保留两份文档测试中既有5处非空断言警告；SFC由vue-tsc/实际消费和浏览器验证 |
| `node tests/visual/apollo.mjs --check --component pagination` / `list` / `table` | **未通过：分别缺30/33/24张已批准Apollo基线**；未复制参考图、接受候选或改阈值 |

F11 全库仍开放；清单499行，内容148/renderer75/内部77，12 verified /211 review /146 keep-data /130 skip。内部槽协议不升级为 public prop verified；业务 void 回调不计 renderer。未声明新的全组件视觉验收或执行全仓verify:full/覆盖率。
