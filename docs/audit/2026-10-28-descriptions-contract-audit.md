# Descriptions / DescriptionsItem 当前契约整改

日期：2026-10-28。起点：`d0bf2cef`；本单元不单独提交，最终集成提交由主线程记录。历史 F08 / #31 是继续保留的回归证据，不代表本次验收已完成。

## 范围、清单与验收标准（实施前）

范围为 Descriptions、DescriptionsItem、行切分、10 个组件 Token、13 对 Demo、双语 API、导出类型及适用测试。共享 Provider / 断点基础设施只检查调用链；共享导出、Registry、兼容政策及最终构建由主线程整合。

| 链路 | 当前核对结果与分类 | 本轮验收 |
| --- | --- | --- |
| `items` → normalizeItems → rows → 内容 | 数据分支优先，包括 `[]`，跳过默认槽；F08 已有运行证据，复验 | 数据和默认槽切换、动态增删/字段/跨度变化；不写 render 状态、不双更新 |
| 默认槽 → Item props / slots → rows | 默认内容、Fragment、注释已有回归；本轮必修：`#label` 没有通道，原生 attrs 与 item.classNames 丢失 | 完整多节点/注释/条件/空标签槽，class/style/id/ARIA/监听器有唯一落点，非 Item 不误消费 |
| `title` / `#title` / `#extra` | 本轮必修：空字符串、布尔内容判空不一致；extra Demo 仍使用移除的 prop | 槽存在优先、刻意空槽抑制后备、0 可见，条件槽反复增加/移除无空壳 |
| column / span / filled / layout / bordered | 现有正数、filled 与尾部补齐已覆盖；本轮必修：按行索引/渲染分支重建跨行内容 | 保留正数分组及补齐；稳定业务 key 在换列、跨度、重排、布局/边框切换时保留实例、草稿和焦点 |
| size / colon / prefixCls / id | 现有组件级路径基本正常，复验；Item prefixCls 声明未消费，本轮必修 | 当前 props/Provider 尺寸与方向响应；前缀只改 DOM 命名，不承诺动态生成 CSS；colon 适用状态明确 |
| classNames / styles 函数 | 本轮必修：类型声称参数是 props，运行时传 `{ props }`；强制断言掩盖；Provider 优先级反转 | 类型和运行时统一 `{ props }`，读取当前有效 column/size；Provider < 组件 < Item；class 拼接 |
| labelStyle / contentStyle | 保留已文档化 deprecated alias，组件级已有告警；Item 覆盖核对 | 旧值 < 新 styles；对应单元明确覆盖次序，不删除原回归 |
| root attrs / nativeElement | 根 class/style/id/data/ARIA/listener/ref 基本正常；Provider 根 style 未消费，本轮必修 | Vue 字符串/对象/数组 style，原生事件一次，ref 指向实际 div 并在卸载清空 |
| Provider / 嵌套 / 多实例 | 全局 size/direction/前缀已接；本轮必修组件配置样式、当前主题未完整接通 | 动态替换/移除 Provider 与主题，嵌套/多实例相互独立 |
| 10 个 Token → CSS → 真实样式 | 本轮必修：当前组件 Token 未连接，bordered padding/color 绕过 Token；标题间距固定为构建期值 | 每个 Token 实际生效，默认/暗色/紧凑/局部覆盖可读；静态 CSS + CSS vars，嵌套选择器不串色 |
| HTML / 无障碍 / 键盘与焦点 | 原 table 三形态按参考快照分支；需用真实浏览器复现 identity/默认颜色 | 成对字段原生描述语义，槽内原生操作可聚焦/事件正常，axe 与实际焦点/值断言并用 |
| SSR / 水合 / 清理 | F08 已覆盖基础 rows；响应式断点在挂载后订阅 | SSR 不访问 DOM、同树水合无警告；挂载后响应式重排不丢业务节点；卸载/重挂与多实例清理 |
| emits / v-model / expose | 描述展示无业务 emits/model；只公开 `nativeElement` | 不引入虚构状态通道；原生事件透传、公开类型正反例 |
| 发布/视觉/Docs | 由主线程统一执行；本轮源码浏览器可先验证 | 不写 dist、不修改参考图片；保留全部参考用例，记录有依据的精确 DOM 差异及原生替代覆盖 |

本轮必修按“Vue 内容/身份及 attrs”“配置/主题全链路”“类型/文档与消费覆盖”成组处理。无需新产品裁决；不新增业务交互或额外字段能力。自定义前缀的任意 CSS 生成策略属于已有共享 D04，另案处理。

## 证据与最终状态

以下记录源码功能保存点；最终发布产物、视觉、Docs 与全库门禁另行集成。

## 已实现的成组修复

1. **Vue 内容与身份**：Item 是实际 Vue 实例，统一使用 `dl > div > dt/dd`；支持完整 #label/default/title/extra，槽存在优先，空内容无后备泄漏、0 保留。items/[] 跳过默认槽；Fragment、条件槽及 F08/#31 分组规则保留。稳定 key 在换列、span、排序、layout/bordered 更新时保留实例和原生节点；真实浏览器保留草稿、焦点及选区，移除/重挂正常清理。
2. **attrs 与语义**：Item 原生 class/style/id/ARIA/listener 有实际所属根，局部 classNames 已消费。根原生 style 字符串/数组/对象、事件一次、nativeElement 卸载清空；每个布局都固定在 dt/dd 上消费区域样式。Provider → 组件旧样式 → 组件 styles → Item 旧样式 → Item styles，修正此前反向覆盖和未消费的 Provider 根 style。
3. **当前配置与全部 Token**：当前 size/direction/prefix、函数式 `{ props }` 和嵌套语义保持响应。10 个 Token 全部连接到当前主题/覆盖/移除，边框内边距和标签色不再绕过 Token；默认标签使用 colorTextSecondary，标题间距跟随当前字体。静态直接所属选择器防止外层区域改写嵌套标签。
4. **类型、Demo、文档**：精确 DescriptionsConfig 对象 type alias 可直接传入现有 Provider 配置类型，没有增加索引签名或断言；补齐五个公共类型、类型正反例、源码/发布消费 fixture。13 对 Demo 保留，修正无效 extra prop、filled/旧 table 文案及默认尺寸，加入真实 #label/草稿身份与全部 10 Token。双语 API、README、独立迁移记录同步。

数据项 `children` 和 `className` 仍是其正式数据字段；仅移除从未有组件运行时消费的 DescriptionsProps.children 及 extra 的残留 never 占位。旧样式 alias 和 Item.className 保留。语义函数不保留错误裸 props 参数类型；旧 table DOM 不增加兼容分支。详见迁移记录。

## 已验证、未验证与接续

源码功能里程碑，**不宣称整改单元最终验收或全库完成**。本分支没有构建/写入 dist、提交、推送、打标签或发布。主线程统一提交后应补记集成 commit 并执行最终同一提交门禁。

| 检查 | 实际状态 | 证据 |
| --- | --- | --- |
| 修复前新增分组复现 | 7/7 红灯；先于实现 | `/tmp/apollo-descriptions-red.log`；`evidence/descriptions-regressions.json` |
| 源码 unit + DOM + a11y + theme | 8 文件 / 119 条通过（最终复验 exit 0）；所有 18 个参考用例保留，另有对应 18 个原生语义用例 | `/tmp/apollo-descriptions-layers.log`；`evidence/descriptions-source-checks.json` |
| 公开类型、全部源码测试类型正反例、13 Demo、原生消费 fixture | `vue-tsc --noEmit -p tests/browser/fixtures/DescriptionsSourceTypes.json` exit 0 | `/tmp/apollo-descriptions-focused-types-final.log` |
| Vitest types | Descriptions 自身 16 个运行/类型断言通过、Type Errors no errors；该次命令 exit 1，因为并行 TimelineSlots.vue 的 TimelineConfig/ComponentConfigLike 诊断，交主线程整合后复验 | `/tmp/apollo-descriptions-type-tests.log`；不将局部断言通过记为项目类型门禁通过 |
| 源码真实 Chrome | 62/62，零 Vue/页面错误；6 组几何变化保留节点/草稿/焦点/选区、key 排序、10 Token computed style、12 组 light/dark/compact × 两布局/两边框 axe、420px 断点/嵌套/多实例/卸载重挂 | `evidence/descriptions-browser.json`；`node tests/browser/descriptions-contracts.mjs` |
| 无浏览器全局的源码 Node SSR + 真实 Chrome 水合 | 10/10；SSR 原 dl/input 保留，合并换列/方向/边框后保留同一编辑组件/草稿/焦点/选区、当前 Token、axe、卸载、无水合警告 | `evidence/descriptions-hydration.json`；`node tests/browser/descriptions-hydration.mjs` |
| 格式与脚本语法 | 所属文件 Biome；四个独立脚本 node --check | `/tmp/apollo-descriptions-format.log`；源码检查证据 JSON |
| 发布产物类型/SSR、全量 build/consumer/coverage | **未执行**，按共享 dist 冻结约定交主线程 | 脚本已备：`node tests/consumer/descriptions-types.mjs`、`node tests/consumer/descriptions-ssr.mjs`；必须在集成 UI build 后运行 |
| Docs 内容/type/test/build、Apollo 正式视觉候选/审阅/基线 | **未执行**，交主线程统一验收；不修改原始参考图片或共享 matrix/manifest | 浏览器状态图 `/tmp/apollo-descriptions-{light,dark,compact}.png` 只作功能审阅，已查看，不作为正式基线 |

水合 fixture 的一次红灯来自每次 `h(input, { value: 'Server draft' })` 对控件声明受控值，更新时合法写回；最终 fixture 改为独立 NativeEditor 组件拥有输入。节点/草稿/焦点/选区断言原样保留，验证的是父布局不重挂实际子组件。动态 Provider 身份测试使用真实 Teleport；VTU 的 teleport stub 会重建子树，不能作身份判据。

没有未裁决的新产品能力。剩余明确边界为：最终发布/视觉/Docs 与全库门禁未执行；现代 Grid/Subgrid 浏览器要求；任意自定义前缀 CSS 仍按共享 D04；共享断点基础设施后续修改须回归本单元。Registry、KNOWN-ISSUES、COMPATIBILITY 和审计进展由主线程串行整合，不因本报告文案把状态标记为重新完成。

## 主线程集成保存点

五个根类型出口已同步；当时Vitest类型被TimelineConfig源码诊断阻断的记录保留。该共享诊断修正后，合并73文件964运行时、10文件122类型、根严格和DescriptionsSourceTypes源码消费均exit0，详见parallel-source-checkpoint.json。最终产物/正式视觉/Docs门禁继续开放。

## 统一验收接续：原 Demo、产物来源与原生视觉

从 `cabc97c8` 和 `1b361487` 保存点继续；重新按本报告完整清单核对当前 Props、Slots、无业务 Emits/model、nativeElement、Item 与行计算、attrs、Provider、十 Token 和全部 13 对 Demo。既有实现与原 119/62/10、18 个参考场景、13 个 Demo 不删减。本轮新增验收范围和分类：

| 当前链路 | 分类与结果 | 验收标准 |
| --- | --- | --- |
| Descriptions / Item 内容、身份、配置、类型与样式 | 当前实现继续保留，119 四层、62 Chrome、10 SSR/水合重新通过；未发现需改动组件实现的新缺陷 | 保留旧断言，当前 source 模式也不读取 dist |
| 真实 Demo → 实际控件 → 可见行为 | 必修：custom-label 问号只有不可聚焦图标，键盘用户不能获得说明；四主题真实失败后修为有名称原生 button，Tooltip 同时接受 hover/focus | 13 Demo × default/dark/compact/dark+compact 的真实 DOM、几何、axe；每主题原 Demo 的八组实际交互 |
| 源码/发布 JS 与 CSS 来源 | 必修验收夹具：此前无条件注入源码 Descriptions CSS，且 source 模式读取 theme/dist CSS | 统一 `descriptions-assets.mjs`；source 模式只用源码与源码样式生成器；`DESCRIPTIONS_SOURCE=0` 同时使用 packages/*/dist JS、公开 tokens.css 与 ui/style.css，并拒绝组件/样式源码模块和源码 CSS 注入 |
| 原生 Apollo 视觉 | 本轮必备：独立 17 状态模块与状态准备助手；不修改共享 matrix、manifest、基线或原参考图 | 375/768/1280 三宽度的 51 状态先验证实际内容、dt/dd、焦点/草稿/选区、Token、溢出、主题和 axe；正式候选/逐张审阅/批准由主线程清洁提交执行 |
| 发布声明、Node SSR、真实水合与 Docs | 仍待主线程明确 dist-ready 后执行；不将 source 通过记为产物通过 | 两个原消费脚本保留；contracts/hydration/demo-themes/visual 均支持 source 与纯发布模式。Docs 与全量门禁由主线程负责 |

真实 Demo 的八组交互是：列数 Select 的 Space/ArrowDown/Enter、padding Select 的应用/移除、自定义 Item 四次布局切换保留原生输入和草稿、extra-button 原生 Enter/click 每次计数一次、vertical-border 四次开关保留 dt、custom-label Tab 可达并打开真实 Tooltip、十个组件变量的 computed style、420/700/1100px 真实响应式。合计 **84/84**，Chrome **150.0.7871.125**，零 Vue/页面错误。第一次选择控件夹具误假设 Home/End 支持，已按 Select 当前明确的 Space/ArrowDown/Enter 链路修正，保留选择首末选项和实际几何断言；bordered padding 预期按公开双轴 padding 区分，不放宽阈值。

17 个视觉状态：basic、bordered、vertical、vertical-bordered、sizes、filled、complete-content、empty-slots、current-geometry、current-provider、semantic-tokens、nested、native-focus、rtl、theme-dark、theme-compact、theme-dark-compact。`current-geometry` 真正跨列、跨 span、布局/边框与 key 排序更新；`current-provider` 真正替换当前配置，二者都断言相同原生节点、草稿、焦点、选区和公开 ref。视觉预检只提供功能证据，不等于正式基线验收。

本次命令与状态：

- `node tests/browser/descriptions-contracts.mjs`：62/62 通过；来源记录为全 source，1903 个 packages 模块中 0 个 dist。
- `node tests/browser/descriptions-hydration.mjs`：10/10 通过；Node SSR 无浏览器全局、真实水合与更新保留节点。
- `node tests/browser/descriptions-demo-themes.mjs`：84/84 通过，52 主题/Demo 组合及 32 交互组。
- `pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/descriptions --maxWorkers=1`：8 文件、原 119 条通过。jsdom 的既有 canvas getContext 提示保留；真实 Chrome axe 单独通过。
- `node tests/browser/descriptions-visual.mjs`：51/51，17 状态 × 375/768/1280px，零页面/Vue/axe 错误。已查看 current-geometry、empty-slots、theme-dark、semantic-tokens 的 768px 图，仅作功能审阅。首次夹具 nested 使用低对比度 primary 文本的三红已修为 colorText；一次重跑恰遇并行 Space 尚未写齐 SpaceItems 导出，等待共享源恢复后按原命令通过，不绕过该导出或放宽断言。
- `pnpm exec vue-tsc --noEmit -p tests/browser/fixtures/DescriptionsSourceTypes.json`：最终 exit 0，包括全部源码、13 Demo 和消费 fixture；初次接续被并行 Grid 的临时 Row/Col 样式参数诊断阻断的记录保留。
- 所属 JS/MJS 文件 `node --check`、Biome、`git diff --check` 通过。

源码模块/夹具、当前结果、红绿边界与 hash 汇总见 `evidence/descriptions-acceptance-source.json`。未构建或改动任何 dist，未提交、推送或发布；未修改共享文件。最终集成 commit、产物结果、正式视觉与 Docs 后续单列，不覆盖本报告原始保存点证据。
