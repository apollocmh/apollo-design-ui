# Breadcrumb / Item / Separator 契约审计（2026-10-28）

范围为 `packages/ui/src/breadcrumb/**`、该单元的浏览器/消费端用例及迁移记录。审计起点 `d0bf2cef`；共享工作树中的 Badge 视觉变更不属于本单元。不运行 UI/根构建、不改发布产物；最终发布入口、全库门禁、Docs 和 Apollo 图像验收由主线程在集成提交统一执行。

## 实施前完整清单与验收标准

下表在修改实现前根据当前源码、双语 API、Demo、调用者和测试盘点。原始可失败复现写入 `__tests__/contract-audit.test.ts`，红灯及最终命令另附证据。

| 链路 | 初始分类 | 当前事实与本轮验收 |
| --- | --- | --- |
| Breadcrumb `items` / `routes` / 默认槽 | 必修 | `useItems` 优先 items，但 render 用 length 判定，`items=[]` 意外消费默认槽。显式空数据仍优先；未提供数据才消费原生槽；保留 routes 废弃通道与正常警告。 |
| `params` → `path` / `title` → `href` / itemRender scope | 必修 | path 仅替换首次/前缀，title 正则未转义，0/空值被丢；只替换完整、存在的参数，重复和重叠名称稳定，缺失值保留；保持逐项路径累计和 path 优先 href。 |
| `title: VNodeChild` → 默认链接内容 | 已验证正常并保留回归 | 初始静态推断已被首轮B01推翻：数组/Fragment原实现即正常，未宣称修复String化；数字、VNode和完整数组继续回归，仅字符串参数替换的其他缺陷整改。 |
| `#itemRender` 对象槽、空/条件槽、默认子组件 key | 已有正常覆盖，需回归 | 保留单对象 `{ route, params, routes, paths, href }`、每项独立 paths、插槽优先（空槽亦然）、动态读槽和调用方 key；无旧函数兼容通道。 |
| `separator` / `dropdownIcon` 内容与优先级 | 必修 | 数据 prop/Provider 有链路，模板具名内容槽缺失。具名槽存在则优先（含有意为空），否则 prop → 当前 Provider → 默认；原生 Item 同样支持相应内容槽。末项不自动追加分隔符。 |
| Item `href` / `menu` / `dropdownProps` / 图标 | 必修 | native 子组件未继承父 dropdownIcon；前缀/内容的归属须明确且动态。 |
| 数据项 `className` / `style` / `data-*` / `aria-*` / `onClick` | 必修 | className/ARIA/点击落默认链接，style 被明确丢弃；style 必须有效，数据 className 保留为数据字段；自定义 itemRender 由调用者拥有内容 attrs。 |
| 原生 Item attrs / 点击 | 必修 | 多根自动透传丢 class/id/ARIA/监听器，声明 style 但不消费。原生 attrs 归所属 item li；class/style 使用 Vue 原生形态，点击接收原生 MouseEvent 且仅一次。 |
| Separator 默认槽/attrs/隐藏语义 | 必修 | 空槽回退 slash 且隐含继承可覆盖 aria-hidden。存在的空槽压住默认字符；原生 attrs 归 separator li，装饰 aria-hidden 保持 true。 |
| `prefixCls` / Provider 前缀 → 三组件 | 必修 | Separator 仅取 ConfigProvider，忽略所属 Breadcrumb 自定义 prefix，原生 Item 亦不继承父前缀；所有所属节点随父当前前缀更新。任意前缀的静态 CSS 仍按既有 D04 边界。 |
| `classNames` / `styles` 函数与对象、Provider 当前配置 | 必修 | 函数 info.props 是非响应快照；改 params/separator/items 后函数结果可能不变。用 getter 读取当前解析 props，语义来源按既有顺序合并，原生 style 最后覆盖。 |
| Breadcrumb expose | 已有正常覆盖，需回归 | 仅 `nativeElement: HTMLElement \| null`；挂载/卸载不泄露内部实例。Item/Separator 不新增 imperative API。 |
| emits / v-model | 不适用/核对 | 根没有组件状态事件/v-model；原生监听器落 nav。Item 点击为 DOM MouseEvent；菜单开合沿现有 dropdownProps.open/onOpenChange，不发造出的业务事件。 |
| menu.items `path` / `href` / `label` / `title` / key / disabled | 必修 | path 拼成 `undefined/c`，href 未消费，菜单项类型丢 disabled 等真实 Menu 支持字段。直给 href 优先，否则相对当前 href，未提供 base 时不出现 undefined；禁用项和 Menu 事件仍传递。 |
| 下拉按钮 / 链接 / 键盘 / 焦点 / 多实例 | 必修 | span 不可聚焦，链接与菜单触发器重叠；所属原生按钮独立于导航链接，键盘打开/关闭、焦点进入菜单和接受关闭后返回；受控拒绝关闭不得抢焦点。无菜单/图标切换应保持已有内容节点。 |
| 7 Component Token → 静态 CSS → 当前主题 | 必修 | 默认 token 声明可用，但固定构建值不消费当前 Provider components.Breadcrumb；默认/暗色/紧凑/嵌套/动态/SSR 应使用当前来源，原生 style 可覆盖；7 Token 每项有实际消费证据。 |
| 关联 Dropdown / Menu / Trigger | 局部核对，整包另案 | 只验证 Breadcrumb 使用的配置、开合、菜单项与焦点链路；确认共享缺陷提供最小复现给主线程，不修改共享实现。 |
| Demo / 中英文 API / 类型 / 历史说明 | 必修 | API demo 数量失真、重复 style 行，仍宣称无效 style 正常/组件废弃/分隔符忽略父前缀。同步当前契约与成对 Demo；保留 PLAN 中日期化历史证据。 |
| 历史 DOM / React 视觉 | 需精确解释差异 | 保留原始参考快照与场景；新的所属结构/按钮/前缀/有效 style 等差异逐场景精确记录，额外差异继续失败；以当前 Apollo 场景覆盖替代错误旧形态。 |
| 发布构建 / 消费端 / Docs / Apollo 视觉 | 集成后验收 | 该执行者不写 dist、共享 matrix/manifest/图片；准备源码浏览器和消费端脚本，由主线程构建后执行发布入口/最终视觉验证。 |

不新增 Router 适配、折叠面包屑、任意前缀 CSS 运行时生成或 Dropdown 全包能力。除已接受 ADR0006/0007 的直接 Vue 修正外，不另加兼容通道。当前没有必须用户裁决才能推进的事项。

## 复现、实现与验证记录

首轮13场景1通过/12失败，正常项是title数组/Fragment。集中实现原生attrs/所属宿主、当前配置与七Token、参数替换、原生内容槽、菜单按钮及数据字段，并同步11对Demo/双语API/迁移。四层7文件110条通过；五project曾9文件151条断言通过但因当时TimelineConfig源码诊断退出1，明确不当作整体通过。

新增菜单空标题回归3条修前全红，修后相关41条通过；源码root vue-tsc/consumer与F11浏览器通过。Overlay接受受控值变化同步清延迟后，同一真实浏览器的菜单选择不再延迟重开。主浏览器14组13通过/1失败，零页面/Vue错误；唯一失败为共享Menu Enter未激活href链接，保留断言并列本轮必修。

主线程已修TimelineConfig类型来源，冻结源码合并验收73文件964运行时、10文件122类型、根严格与Descriptions源码消费类型均exit0；格式零错误（37既有warning、9info）。详见parallel-source-checkpoint.json。最终发布构建/声明消费、完整Demo主题矩阵、Docs、自有视觉尚未执行，本单元不标完成。

## 重启续验范围与清单（修改前）

从 `adec7ade` 已提交实现与完整清单续验，当前工作树起点 `1b361487`。重新追踪当前三个组件、useItems/useItemRender、context、theme/style、双语 API、11 个原 Demo、契约测试与浏览器入口；没有把原本正常的 title 数组/Fragment 记作修复。

| 续验项 | 分类 | 验收要求 |
| --- | --- | --- |
| 既有 Props/Slots/attrs/Provider/七 Token 与 SSR 链路 | 已有证据，需当前回归 | 保留已提交红绿证据；同一源码的单元/类型与真实浏览器回放，不能替代发布检查。 |
| 14 组原契约浏览器中的 Menu Enter href | 本轮必修，共享实现由主线程负责 | 保留真实按键→URL 导航→关闭断言，不改点击替代或移除导航；共享修复后重放。 |
| 发布模式样式来源 | 本轮必修的验证缺口 | 既有入口无论 source 开关都注入 gen*Style 结果；改为发布 JS + 发布 tokens.css/ui style.css，不再混入源码生成样式，并记录构建模块来源。 |
| 11 个原 Demo 的四主题及关键交互 | 必须补齐 | 原 Demo 逐个挂载，default/dark/compact/both 共44种渲染；检查 axe、有效CSS、完整内容与菜单/条件槽/参数/输入身份交互。 |
| Apollo 原生视觉 fixture/helper | 必须准备，由主线程接入与正式审图 | 保留8个历史参考场景；另覆盖完整内容、无标题菜单、条件内容、当前Provider、键盘菜单/焦点与三种主题。不得改参考图或共享matrix/runner/manifest。 |
| 声明/产物/Docs/视觉最终结果 | 等待集成后验收 | 不建 dist；主线程明确 dist-ready 后才运行发布读取。正式视觉捕获、批准和最终同一提交全量门禁由主线程统一完成。 |

目前无新增公共 API 决策项；不扩大到 Router 或 Dropdown/Menu 全包能力。

### 续验实现与源码冻结结果

- 发布入口校正：`breadcrumb-style-mode.mjs` 只在源码模式加载 `BreadcrumbSourceStyles.ts`；发布模式使用真实 `@apollo-design/theme/tokens.css` 与 `@apollo-design/ui/style.css`，构建模块检查要求两条 CSS 入口、已输出 CSS、零包运行时源码模块及零 source-style 入口。浏览器另检查有效 flex 样式和 source-only 标记。没有将源码样式混入产物结论。
- 原 11 Demo × 4 主题新增完整浏览器矩阵，共44项渲染/axe与16项真实交互。首次54/60绿，2项红灯复现 `component-token` 固定前景对比度，另4项为共享 Menu Enter 导航。示例改用当前可读语义颜色后44项渲染全部通过，总56/60绿，剩余4项导航断言未删改；零页面/Vue错误。相关对比度、参数、条件/空/恢复槽、3次切换、输入身份、受控菜单、Escape与legacy路径均在同一脚本验收。
- `tests/consumer/breadcrumb-types.mjs` 现在检查全部11个原 Demo，同时保留槽作用域、原生 attrs 和事件负例；source模式不读dist。
- 四层当前 `unit/dom-contract/a11y/theme` 为7文件114项通过（`--maxWorkers=1`）；source消费11Demo及负例通过。
- `types` 为2文件40项断言通过但命令exit1，根 `vue-tsc` exit2：同一工作树其他并行整改单元有5条源码诊断，Grid contracts:18的深实例化，Space contracts:65/70/73/85的内容/配置类型。Breadcrumb本单元无诊断，仍不把这次类型命令报成通过；由所属执行者修正后集成重放。
- 原主契约14组当前13/14绿，唯一仍为 Menu Enter 未跟随 href；SSR水合、全部七Token、attrs/Provider/条件内容等13组保留通过。Menu实现由主线程修复后必须同断言重放。
- Apollo原生17状态 × mobile/tablet/desktop =51项源码烟测通过（含axe、自然宽度、菜单无裁切、完整内容、当前Provider七Token/RTL、输入/按钮身份、无标题展开菜单及键盘焦点）。这是fixture行为检查，**不是正式截图批准或发布产物证据**。

命令与结构化红绿结果见 [breadcrumb-restart-source.json](evidence/breadcrumb-restart-source.json)。源码状态在 `1b361487` 基础的共享工作树验收，主线程另记录冻结后的实际提交；没有运行构建或修改dist/共享矩阵/参考图。

### 主线程正式视觉接入

`tests/visual/render/cases/apollo/breadcrumb.js` 导出17个场景：basic、with-icon、separator、separator-item、with-params、overlay、semantic、rtl、complete-content、no-title-menu、conditional-content、current-provider、keyboard-menu、native-focus、theme-dark、theme-compact、theme-dark-compact。在共享matrix只新增Breadcrumb的`apolloVariants`，保留原8个参考`variants`。Vue renderer通过已有apollo模块glob自动发现文件。

共享`apollo.mjs`导入并分派 `prepareBreadcrumbVisual(page, item.variant)`；Breadcrumb的原生焦点、键盘菜单、空标题菜单、条件内容及当前Provider场景需保留focus outline（建议Breadcrumb统一 `preserveFocus: true`）。helper在正式截图前直接验证当前状态/axe/边界，菜单通过`getPopupContainer`进入本场景340px高frame，`#stage`截图包含已打开的菜单。未改共享runner/manifest/baseline；正式捕获、逐图审阅和同提交复比仍由主线程完成。

发布浏览器待主线程dist-ready后执行 `node tests/browser/breadcrumb-contracts.mjs`、`node tests/browser/breadcrumb-demo-themes.mjs`、`node tests/browser/breadcrumb-visual-states.mjs`，声明另跑`node tests/consumer/breadcrumb-types.mjs`。默认均发布模式；源码模式显式设`BREADCRUMB_SOURCE=1`。F11历史脚本保留，完整槽/输入场景也在当前真实CSS Demo矩阵中独立覆盖。

### 共享 Menu 修复集成后的续验

主线程完成 Menu 所属原生操作的集中修复并通知源码可重放后，先保留旧 URL 匹配式实际执行。Enter 已到达 `http://127.0.0.1:57996/BreadcrumbContracts.html#/42/42/child`，Demo 四主题均到达 `http://127.0.0.1:57997/BreadcrumbDemos.html#guide`。原 `**/#/42/42/child` / `**/#guide` 错误要求 hash 前存在 `/`，因 `.html#...` 而假红。此 fixture 问题与主线程独立建立并修复的 Menu15条原生操作红绿分开记录，不把有误匹配式当成最终导航判据。

匹配式改为完整 `${origin}BreadcrumbContracts.html#/42/42/child` / `${origin}BreadcrumbDemos.html#guide`，并额外精确比较当前URL。每个原 Demo 开始时清理 hash，原生菜单交互另断言从空 hash 开始，保证每种主题都独立证明新导航；菜单关闭、焦点返回、禁用项与原有14组检查全部保留。SSR Vite仅扫描本单元HTML，避免扫描同目录其他组件的virtual入口。

同一共享工作树重放 `BREADCRUMB_SOURCE=1 node tests/browser/breadcrumb-contracts.mjs` 为14/14通过，`BREADCRUMB_SOURCE=1 node tests/browser/breadcrumb-demo-themes.mjs` 为60/60通过；均正常exit0、零页面/Vue错误。之前原glob诊断两次运行保留结果后在清理阶段停留，已定向结束其进程；最终修正后的两次正式源码重放正常结束，不以诊断运行替代最终结果。证据见 [breadcrumb-menu-ready-source.json](evidence/breadcrumb-menu-ready-source.json)。F11原脚本亦已通过，Chrome150.0.7871.125，零页面/Vue错误。

本单元源码及fixture再次冻结，全部编辑停止；发布JS+CSS、正式Apollo图像批准、Docs和最终同一提交全量门禁仍等主线程统一验收，未把源码浏览器通过宣称为单元完整交付。

## 正式原生视觉阶段

清洁冻结 `a47d96ec` 的51张正式候选已完成实际逐图审阅并批准；Descriptions/Timeline/Grid通过逐张尺寸与rawRGBA完全相同继承此前已实际看过的审图，Breadcrumb新51张逐张查看。相应当前生产源码自e0062edd未变，最新发布声明/实际Demo模板消费和公共CSS对照另有记录。原1692份PNG与537条已有批准记录全部保留；全局现759/1602批准。逐图观察、SHA、继承关系及边界见[四单元视觉证据](evidence/four-unit-native-visual-acceptance.json)。批准完整性检查通过；Docs与最终全库门禁仍独立记录，不将视觉绿灯视为全库完成。

## 当前整改单元统一验收

实现 `40ec3962`；四组件生产源码在e0062edd到a47d96ec之间未变。既有源码/发布行为清单、当前发布声明与52 Demo模板（四组总量）、公共CSS依赖/链接对照已核对；本组件51张正式视觉已逐图审阅批准，批准后从清洁ad850a47重新渲染全部PASS且rawRGBA一致。关联源运行时114项为本组件/依赖集合，不累计成全库数量。

冻结2f47f423的UI真实构建、严格L7 11项、Docs严格类型/161测试/完整构建及32条真实页面和交互通过。当前四组件整改单元验收完成；代码和原API示例已可访问，新进展页部署回执随后补记。逐项提交与证据见[四单元最终验收](evidence/four-unit-final-acceptance.json)。全库交付17/72，Space与其他单元继续；D04等明确另案及最终同提交全库门禁不被局部验收替代。
