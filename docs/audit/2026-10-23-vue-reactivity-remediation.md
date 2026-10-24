# F02 / F04 / F08 / H01 连续整改 · 2026-10-23

基线为 `143fecdd` 及上一批 F01/F06 的未提交工作区；本批只推进下列事项。环境：macOS x64、Node 22.22.2、pnpm 12.4.2、系统 Chrome 150.0.7871.125。既有修改保留，未推送或发布。

## F02：Select / AutoComplete 条件选项

修前条件 default slot 首次缺省后不能恢复；Vue Fragment/Comment 被错误归为选项；AutoComplete 的选项分类也缓存了 slot 身份。新增 7 条回归修前 5 条失败，覆盖 0→1→0→1、value/label/disabled、已选标签缓存、分组/v-for、options 优先级、搜索、虚拟化、键盘和 SSR。

Select 公开 render 边界读取并归一化 VNode，把当前选项通过普通 Vue props 交给私有值引擎。解析、筛选、显示标签与 useCache 的 computed 因真实 props 更新而正常失效，不在 render 中写 reactive ref、不 bump version、不依赖更换 key 或重挂载。显式 options（包括 []）不执行默认插槽，空的内部子项数组保持实例内稳定。内部 optionChildren 不进入公开 props。

AutoComplete 也在 render 中分类，只读取这一轮子项；分组与 Comment/Fragment 规范化共享纯函数。废弃 dataSource、命名插槽、数据通道优先级保留现有行为。清理了内部 useOptions helper 对 VNode getter 的潜在 computed 缓存入口，改接收已归一化数据；无公开 API 迁移。

调用样例：`select/demo/conditional-options.vue`，同时展示 Select 与 AutoComplete 的条件分组/循环选项。公开输入节点、expose、v-model、change/select payload 保持。

## F04：InputNumber 的模板前后缀

新增 5 条回归修前全部失败。两个组件层均声明 InputNumberSlots，按函数转发并只在 render 消费 prefix/suffix。slot 存在则优先，包括显式空结果；不传时回退内容 prop。这些是内容 prop，并非要保留的旧函数渲染通道。

保留语义 wrapper、反馈图标、输入节点、Compact/addon 路径及数字引擎。更新 presuffix 真实 Demo、双语文档及根类型出口；新增动态切换、输入/v-model/change 单次发送、SSR 顺序和类型推断回归。

## F08：Descriptions 的当前渲染行

确认 render 中写 currentChildren shallowRef 的反模式。新测试同时核实动态合并单元格与更新次数：**未复现无限循环或额外更新**，不把静态模式升级为已发生的死循环。

另有实际红灯：items 覆盖子项时仍执行被忽略的默认 slot；修复后包括 items=[] 在内均不执行。slot 数据直接在当前 render 归一化成 rows，props.items 分支可独立 computed 缓存，无渲染期响应式赋值。4 条回归覆盖数据/插槽切换、增删、无关 attrs 单次更新、filled/列数/布局与 SSR 水合。

测试曾按 horizontal bordered 的公式误写 vertical colSpan，已按现有公开 FAQ 和渲染语义修正为 span；保留 horizontal bordered 的 span*2-1 断言，另在浏览器分别核对 vertical 的 th/td。没有改变组件单元格算法来迎合错误测试。

## H01：历史 Table 文档记录与派生汇总

VNA-RECHECK-04 所称缺失的中英文 API 文档均已存在。核对主要字段 columns/dataSource/rowKey/rowSelection/expandable/pagination 与导出类型、内容管线和 SSG 正文后，只关闭这条历史文档缺失记录。保留原审计观察，补充真实文件、日期、路由和证据，不宣称重新验收完整 Table。

旧 summary 只统计 fixed=17/open=1，实际有 24 个 issue、23 fixed/1 open；关闭过期条目后应是 24 fixed/0 open。新增 `registry/tools/vue-native-status.mjs` 从 issue 记录复算 total/bySeverity/byStatus，`--check` 只读且漂移非零退出；已解决文档记录的文件或 API 正文缺失也失败。接入 registry:check，2 条 CLI 正反门禁测试通过。历史审计 0 open 不代表 KNOWN-ISSUES 当前整改已全部完成。

## 已运行验证

| 命令 | 结果 |
| --- | --- |
| F02 修前新回归 | 7 条中 5 条失败；修后 7/7 通过 |
| F04 修前新回归 | 5/5 失败；修后 5/5 通过 |
| F08 修前新回归 | 忽略 slot 用例失败，其余 3 条通过；修后 4/4 通过 |
| `vitest run --maxWorkers=1 --project unit --project dom-contract --project a11y --project theme` 路径筛选 Select/AutoComplete/TreeSelect/Cascader | 30 文件 / 475 条通过 |
| 同上路径筛选 InputNumber/Descriptions | 15 文件 / 216 条通过 |
| `vitest run --maxWorkers=1 --project unit packages/ui/src/select/__tests__/demo.test.ts` | 新增条件选项 Demo 后 38/38 通过 |
| `pnpm run lint:types` | 通过；未忽略诊断或增加类型断言遮掩错误 |
| `vitest run --maxWorkers=1 --project types` 路径筛选上述六组件 | 10 文件 / 66 条通过，Type Errors: no errors |
| `node tests/build/run.mjs --package ui` | 重建 UI，L7 11 项通过，FAIL 0 / PENDING 0 |
| `node tests/browser/vue-reactivity.mjs` | 生产 dist + 真实 SFC Demo，F02/F04/F08 全部通过，零页面错误 |
| `pnpm run test:tooling` | 6/6 通过；包含 H01 漂移/缺文档/API 正文的真实非零退出测试 |

| `pnpm run registry:check` | 19 项原门禁与新 vue-native 门禁通过；实际 24 条历史 issue 的汇总一致，文档证据存在 |
| `pnpm --filter @apollo-design/docs run content:build` / `content:check` | 72 组件 / 991 Demo / 7 指南，校验通过 |
| `pnpm --filter @apollo-design/docs run test` | 14 文件 / 154 条通过；新增 Select Demo 的准确数量与 id 哨兵已同步 |
| `pnpm --filter @apollo-design/docs run typecheck` | 通过 |
| `pnpm --filter @apollo-design/docs run build` | client/server 构建与 SSG 84 路由通过；四个相关组件及 Table 静态正文非空 |
| `node tests/browser/table-documentation.mjs` | Table 文档路由 HTTP 200，服务端 API 正文、客户端水合和英文切换通过；零页面错误 |
| `pnpm run verify:consumer` | tarball + Vite / Webpack 两种真实消费端通过，无 React/rc/antd 运行时引用 |
| 改动目录 `biome check` / `git diff --check` | 通过；未放宽 lint 或诊断 |

Table 管线的中英文 `ColumnsType`、columns/dataSource/rowSelection/rowKey/expandable/pagination 均实际存在；英文文档的 API 在 introHtml，中文在 restHtml，验证合并后的正文，未错误依赖某一渲染字段。H01 的 sourceFiles/API gate 不要求先存在本地 dist，适合先 registry:check 后 build 的现有流程；生产页面验证独立执行。

## 仍未完成的验收

对 Select / AutoComplete / TreeSelect / Cascader / InputNumber / Descriptions 分别执行 `node tests/visual/apollo.mjs --component <name> --check`，六次均以非零退出：前五个各缺 9 张、Descriptions 缺 12 张已审阅 Apollo 基线，合计 57 张。没有复制 React 图、降低像素阈值或把浏览器交互当作 L6。视觉状态继续保留来源含义，不宣称重新验收全部组件。

Docs 构建仍有既有大 chunk、静态/动态 import 混用和其他 Demo frontmatter order 提示；没有提高告警阈值或删日志，H04 继续开放。未运行全仓 verify:full、覆盖率、全量视觉和 72/13 完整验收矩阵；F05/F07/F09/F10/F11、H02/H03/H04 及尚未裁决的事项继续按台账推进。
