# Grid / Row / Col 当前契约审计 · 2026-10-28

起点：`master` / `1b361487`。本轮是完整 Grid 单元审计；旧 completed、参考快照和旧分析仅为历史证据。源码验证和发布产物验收分开记录。

## 范围、边界和验收

所属范围：`packages/ui/src/grid/**`、`tests/browser/grid-*.mjs`、`tests/browser/fixtures/Grid*`、`tests/consumer/grid-*.mjs`、本报告、`evidence/grid-*.json`、`docs/migrations/grid-contracts.md`，以及独立 Apollo Grid 视觉模块/状态 helper。不编辑共享导出、Registry、KNOWN-ISSUES、视觉 runner/matrix/manifest/baseline，不提交或构建 dist。`grid/hooks`、`_internal/responsive-observer` 有共同消费者，先报告最小故障，不自行改共享实现。

验收：完整声明→传递→消费→实际行为逐项收口；修前红灯、修后回归；真实浏览器断点几何、样式和内容身份；13 个实际 Demo 的类型/主题/交互；SSR/水合与卸载清理；严格类型正反例；发布 JS + 发布 CSS、Docs 和正式视觉交由主线程冻结构建后统一验收。源码通过不等于发布通过。

## 完整盘点（实施前）

| 入口/链路 | 当前实现与调用者 | 分类/验收路径 |
| --- | --- | --- |
| Row `prefixCls` | `getPrefixCls('row', props.prefixCls)`→根类；Provider 根前缀 getter 有响应性 | 待验证正常：prop/Provider 更新、移除；自定义前缀仍需自带静态 CSS |
| Row `gutter` | prop 默认 0→useGutter→Row 负半 margin / rowGap→computed provide→Col 正半 padding | 必测：0、分数、CSS 长度/calc、二轴独立响应式、替换/移除、嵌套、多实例；当前 Gutter 第二轴不能声明响应式，递归数组却可通过类型 |
| Row `justify` | 字符串/响应式对象→降序断点选择→类→静态 justify-content | 待验证正常：六种值、当前视口、替换/移除、最大命中 |
| Row `align` | 字符串/响应式对象→类→三种静态 align-items；stretch 没有显式规则 | 本轮必修：公共 stretch 应能覆盖外部继承/基础样式；真实交叉轴几何 |
| Row `wrap` | undefined/true 默认换行；false 类→nowrap、computed provide→Col flex minWidth | 待验证正常：false/true/undefined 动态往返，flex=0 与响应式 flex；Firefox 收缩边界 |
| Col `span` | 类→24 栏 CSS，0 隐藏；响应式类覆盖基础类 | 待验证正常：0/1…24、动态恢复、真实宽度与换行 |
| Col `order/offset/push/pull` | 基础真值类、响应式对象含 0→逻辑方向 CSS | 待验证正常：所有字段、响应式 0 复位、RTL 逻辑偏移；保留现有基础 0 无类 |
| Col `flex` | auto/数字/长度/原样→inline flex；响应式→每断点变量/类 | 必测：0/分数/长度，基础与响应式组合、动态变量移除；nowrap 对响应式 flex 的 minWidth 缺口待红灯 |
| Col `xs/sm/md/lg/xl/xxl/xxxl` | 数字或 ColSize；所有类 SSR 输出，CSS 固定 576/768/992/1200/1600/1920 | 必测：每断点边界，xs 为基础样式、较大断点继承最近定义，不是仅 <576；数字/对象切换、0 与完整六字段 |
| 默认 slots | 两个单根 div 的原生 `<slot>`，无具名槽或作用域 | 待验证正常：文本/0/数组/Fragment/多根子组件、条件空槽、子节点身份和焦点；补精确默认槽声明 |
| Emits / v-model | 无业务事件、无模型；DOM 原生监听器经 attrs | 不新增模型：验证点击/键盘原生监听器一次与动态替换/移除 |
| Expose | `nativeElement` ref→实际 div | 待验证正常：挂载、配置更新同节点、卸载置空、重挂新节点 |
| attrs/class/style | inheritAttrs false→computed rootAttrs；style 强制视为 CSSProperties 后展开 | 本轮必修候选：字符串/数组 style、仅 attrs 更新、所有 attrs/监听器替换移除与优先级；不得断言掩盖 |
| Provider RowConfig/ColConfig | 导出 className/style；组件只解构 getPrefixCls/direction，未消费配置 | 本轮必修：当前 className/style 的出现、替换、移除及本地 style 优先 |
| direction | setup 一次性解构 direction→rtl 类；CSS 没有方向声明；Provider 本身不设 dir | 本轮必修：当前方向、嵌套/独立实例、原生 dir/style 覆盖；真实视觉顺序与逻辑偏移 |
| RowContext | typed symbol+computed gutter/wrap；无父 Row 时为空 fallback | 待验证正常：最近 Row 隔离；包装子组件也可注入（文档“只能直接子元素”过严） |
| useBreakpoint | SSR 默认值→onMounted 订阅→Ref；getter暂停/恢复、scope disposal | 保留已提交 breakpoint-reactivity 证据；本轮补 Grid/真实视口/多实例/水合。共享 observer 的首订阅 token、动态断点和退订路径待独立最小复现后报告 |
| useGutter/getMergedPropByScreen/parseFlex | 纯函数；gutter SSR 无 screens 时最大已定义断点，justify/align 无命中 | 不凭上游注释改首帧；保留可水合的确定性，文档说明挂载后实际断点校正；补零/分数/双轴 |
| 静态 CSS / Token | 24 栏、逻辑偏移、Form `--apollo-grid-display`、七档 flex 变量；font-family/font-size 全局 token；无组件 token | 必测：当前全局字体 token、三主题及嵌套、Form display 覆盖；screen 覆盖不改静态 media query 为已有明确边界，不假称支持动态媒体查询 |
| 13 Demo | basic/gutter/offset/sort/flex/flex-align/flex-order/flex-stretch/responsive/responsive-flex/responsive-more/playground/useBreakpoint | 必测全部；多个原生字符串 style 会触发根合并故障，playground range 三控件应实际更新；对比度待浏览器 axe，修复实际 Demo 后同步成对 md |

真实关联调用链已读：Form ItemHolder→Row、FormItemLabel/Input→Col（`--apollo-grid-display` 控制 flex）；List→Row / Item→Col（flex、colStyle、ref）；Masonry 共用 Gutter/useGutter/useBreakpoint；Avatar、Descriptions、Steps、Pagination 共用 useBreakpoint。实际应用 Demo 包括 Card、Checkbox、Statistic、Form、Tour。共享改动由主线程统筹这些消费者回归。

无新增能力需求；无业务受控/非受控模型，适用的是现有响应式输入、原生子控件状态和 attrs。自定义静态前缀、运行时覆盖 CSS media query 是已有公开限制，不能与真实配置无效混为一谈。

## 复现、实施与验证

主线程已将 `_internal/responsive-observer.ts` 和必要 grid/hooks 的最小共享修复授权给本任务（2026-10-28），其他共享文件限制不变。实际仅修改 observer，两个 hooks 保留原实现。

修前证据：

- [原生根/布局红灯](evidence/grid-native-red.json)：8 条中 6 红，分别覆盖两个字符串 style 崩溃、当前 Provider、响应式 flex 的 nowrap 收缩、显式 stretch 与 SSR 字符索引样式。
- [类型红灯](evidence/grid-types-red.json)：双轴响应式正例失败、递归数组负例无法报错。
- [初始 observer 记录](evidence/grid-observer-red.json)：2 红/1 绿。进一步核对发现 VTU teleport-stub 将 Probe 重挂，动态替换因此假绿；切换原生 Teleport 并断言节点身份后，[三条真实红灯](evidence/grid-native-observer-red.json) 均成立。原记录保留且不当作正常结论。
- [13 个实际 Demo 修前](evidence/grid-demo-red.json)：四主题×三视口全部出现 color-contrast（11 个 Demo）；playground 验证新增零/分数选项前也会失败，不能将该测试设定误称既有组件 API 缺陷。

实现成组处理：Vue normalizeStyle + render 读取 attrs；消费当前 Row/Col Provider 配置及默认原生 dir；显式 stretch；responsive flex 参与 nowrap 收缩；精确 Gutter/默认槽类型；共享 observer 按查询集合隔离、动态重连、幂等 owner 清理；真实 Demo 主题配色与双轴/原生 range 示例。迁移见 [grid-contracts](../migrations/grid-contracts.md)。

共享层源码回归已执行：37 文件 / 717 unit 全绿（Grid、Descriptions、Steps、Avatar、List、Pagination、Masonry），包含两种卸载顺序、同图多订阅/重复退订、配置变化身份保留、普通颜色更新不重订阅。共享 observer 已单独通知主线程停止编辑。

## 源码统一验收与冻结

生产代码、fixtures、测试与独立视觉模块已停止编辑，主线程可以冻结构建。根 `packages/ui/src/index.ts` **不需要新增导出**，现有 GridSlot/GridRef/Gutter/RowConfig/ColConfig 已覆盖。完整源码摘要与 SHA256 见 [grid-source-validation.json](evidence/grid-source-validation.json)。这仍是起点 `1b361487` 上的并行工作树验证，不能当作最终发布提交的全库门禁。

| 检查 | 实际结果 | 证据 |
| --- | --- | --- |
| Grid unit / DOM / a11y / theme，maxWorkers=1 | 8 文件 104/104，exit 0 | [source-four-layers](evidence/grid-source-four-layers.json) |
| 共享观察器影响消费者 source unit，maxWorkers=1 | 37 文件 717/717，exit 0；与 Grid 四层有交集，不相加为全库数字 | [shared-consumers](evidence/grid-shared-consumers.json) |
| Form / List / Listy 实际 Row/Col 消费者 unit + DOM，maxWorkers=1 | 15 文件 256/256，exit 0；包含 Form display/布局、List grid/原生内容，路径过滤也命中 Listy | [form-list](evidence/grid-form-list.json) |
| Grid 公开类型正反例，vue-tsc checker | 5 个契约的运行/类型两条路径共 10/10，真实 exit 0，无源诊断 | source-validation |
| 源码公开消费 fixture + 13 个真实 Demo 严格类型 | GridTypes.tsconfig，exit 0 / 0 诊断 | source-validation |
| Biome 所属源码/脚本/fixtures + 授权共享 observer | 44 文件，exit 0 / 0 错误；未放宽规则 | source-validation |
| Node SSR→真实 Chrome 水合 / 当前 API / 几何 / 焦点 / 多实例 | 41/41，0 页面/水合错误 | [source-browser](evidence/grid-source-browser.json) |
| 13 实际 Demo × 4 主题 × 3 视口 + 原生 range | 12 个完整组合 + 原生交互/错误检查共 14/14；0 axe / overflow / 页面错误 | [source-demos](evidence/grid-source-demos.json) |
| 独立 Apollo 视觉状态 helper 源码预检 | 14 变体 × 3 视口 = 42/42；0 axe/overflow/页面错误；**没有生成或接受基线** | [source-visual-states](evidence/grid-source-visual-states.json) |

浏览器 41 项进一步覆盖：十三个断点边界（400 / 575 / 576 / 767 / 768 / 991 / 992 / 1199 / 1200 / 1599 / 1600 / 1919 / 1920）、两轴当前断点 gutter、六种 justify、四种 align、基础逻辑偏移/排序的 LTR/RTL 几何、全部响应式对象字段及显式 0 复位、完整内容/条件槽、原生 style 三种形态、当前 Provider 出现/移除、实际 refs、编辑身份/选择/焦点、重复挂卸与独立实例。span=0 隐藏内容正常移焦，恢复后核对身份/值再由测试主动聚焦，未伪称浏览器在隐藏节点上保持焦点。

收口还保留 [empty-flex 红灯](evidence/grid-empty-flex-red.json)：响应式 flex 改成空串时应同时清除变量和 min-width，修复已被最终 104 条包含。类型检查曾出现 JSON 10/10 但进程 exit 1；verbose 揭示新增测试深层 ref<StyleValue> 的 TS2589，改为 shallowRef 后真实退出 0，未屏蔽 source errors。

完整清单最终分类：Row/Col 所有现有 props、默认槽、原生 attrs/监听器、expose、最近 RowContext、Provider、字体变量与几何规则已在源码层统一验证；本轮必修已实现并验证。无需新增业务受控模型或额外公开能力。保留的明确边界是自定义前缀静态 CSS、Col 固定媒体查询及响应式 SSR 挂载校正。原 React fixture/快照/图片全部未改。

## 交接给主线程

共享 observer 可单独提交的实现/测试为 `_internal/responsive-observer.ts` 和 `grid/__tests__/responsive-observer-contracts.test.ts`。后者直接导入已存在的 `grid/hooks/use-breakpoint`，不依赖新 Row/Col 实现或新增 fixture；原生三红的独立提取见 [observer-native-red](evidence/grid-observer-native-red.json)，原始混合及 stub 证据仍保留。observer 冻结 SHA256 为 `a421465f147e806060c452f4162882c7b9c7e6a7219e573e541d94f2bb4932e0`。

正式发布、Docs 和 Apollo 视觉验收均未执行，等待主线程 dist-ready；不得将以上源码统计记作发布通过。发布消费者与真实浏览器入口已准备：`tests/consumer/grid-types.mjs`、`grid-ssr.mjs`、`GRID_SOURCE=0 node tests/browser/grid-contracts.mjs`、`grid-demos.mjs`、`grid-visual.mjs`，发布分支同时使用发布 JS 与发布 Grid CSS，且断言没有 source style 注入。

独立视觉模块为 `tests/visual/render/cases/apollo/grid.js`，helper 为 `prepareGridVisual`（`tests/visual/grid-state.mjs`）。14 变体：basic、gutter、responsive、offset-sort、flex、justify-align、responsive-fields、nested-rtl、complete-content、current-provider、native-focus、theme-dark、theme-compact、theme-dark-compact。主线程负责整合共享 matrix/runner/manifest、清洁提交候选、逐张审阅、批准/复比、完整 Docs、Registry/KNOWN-ISSUES/COMPATIBILITY 入口及最终同一提交全量门禁。本任务未构建/修改 dist，未提交或推送。

## 正式原生视觉阶段

清洁冻结 `a47d96ec` 的42张正式候选已完成实际逐图审阅并批准；Descriptions/Timeline/Grid通过逐张尺寸与rawRGBA完全相同继承此前已实际看过的审图，Breadcrumb新51张逐张查看。相应当前生产源码自e0062edd未变，最新发布声明/实际Demo模板消费和公共CSS对照另有记录。原1692份PNG与537条已有批准记录全部保留；全局现759/1602批准。逐图观察、SHA、继承关系及边界见[四单元视觉证据](evidence/four-unit-native-visual-acceptance.json)。批准完整性检查通过；Docs与最终全库门禁仍独立记录，不将视觉绿灯视为全库完成。

## 当前整改单元统一验收

实现 `04be6282`；四组件生产源码在e0062edd到a47d96ec之间未变。既有源码/发布行为清单、当前发布声明与52 Demo模板（四组总量）、公共CSS依赖/链接对照已核对；本组件42张正式视觉已逐图审阅批准，批准后从清洁ad850a47重新渲染全部PASS且rawRGBA一致。关联源运行时104项为本组件/依赖集合，不累计成全库数量。

冻结2f47f423的UI真实构建、严格L7 11项、Docs严格类型/161测试/完整构建及32条真实页面和交互通过。当前四组件整改单元验收完成；代码和原API示例已可访问，新进展页部署回执随后补记。逐项提交与证据见[四单元最终验收](evidence/four-unit-final-acceptance.json)。全库交付17/72，Space与其他单元继续；D04等明确另案及最终同提交全库门禁不被局部验收替代。
