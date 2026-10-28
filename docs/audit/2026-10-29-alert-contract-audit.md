# Alert 整改单元：当前契约盘点与统一验收

状态：先完成下列完整盘点，再建立红例并成组修复；包含终审四种 Provider icon=null 边界在内的源码修复与验证已完成，所属文件已统一冻结。发布产物、正式视觉、文档站和全库同一最终提交验收仍由主线程执行，本记录不宣称 Alert 或全库已完成发布验收。盘点起点为 `2f47f423a8c229a4f763593c4cda0f401ed06731`，工作区已有 Input 和主线程改动，均不属于本单元所有权。

## 范围与规范

已读当前 `AGENTS.md`、`ARCHITECTURE.md`、`COMPONENT-RULES.md`、`COMPATIBILITY.md`、`TESTING.md`、`WORKFLOW.md`，并核对已接受 ADR0006/0007 与 Alert/Collapse 内容插槽迁移。范围为 `alert/**`、Alert/ErrorBoundary 当前公开契约、四 Token、15 对真实 Demo，以及独立 Alert 单元/类型/浏览器/消费端/视觉 fixture 与 helper、双语 API 和迁移证据。共享实现、根导出、Registry、视觉 matrix/runner 和发布构建由主线程整合；本执行者不改 Input/Space，不 build 包、不提交或推送。

## 完整契约链路清单（修复前记录）

| 项目 | 当前声明 → 传递 → 消费与分类 |
| --- | --- |
| type / banner | 四类 type；未传时 banner→warning，否则 info；render 类名、颜色、默认图标消费。已有单元/参考覆盖，先跑基线；保留默认视觉与合法值。 |
| variant | prop→setup 捕获的 Provider variant→outlined；Provider 替换/删除无法到达消费端，静态已确认本轮必修，需失败复现。 |
| title / message | string 数据，message 为既有废弃别名；render 每次读取 #title，slot 存在优先且空 slot 抑制；0 富内容走 slot。已有 F07 覆盖，补完整 Fragment、条件切换、编辑器身份与类型。 |
| description | string 数据或完整 #description；当前 render 按存在优先，空槽移除 with-description。保留 F07，补动态内容、空宿主与多实例。 |
| showIcon | banner 未显式设置时 true；否则 prop；图标区域消费当前类型。补显式 false、动态 banner/type 与四种 Provider 图标替换/删除。 |
| #icon / #action | 当前渲染调用完整 slot；icon 的 undefined 结果仍回退默认图标，action 的空数组仍可能留下空宿主。按原生 slot 存在/空内容契约复现并修复；不恢复已删除 icon/action prop。默认 slot 未公开且不消费，不新增 default→title 隐式通道。 |
| #closeIcon | 实现存在但双语 Slots 表及公开 Slots 类型遗漏；computed 调 slot 并把空结果归一回退，会冻结条件 slot/内容更新。本轮补完整类型、每轮 render 读取、空槽优先与 fallback 链复现。 |
| closable | boolean 或配置对象；对象恒可关，closeText 真值保留既有优先级；显式 boolean、遗留 closeIcon null/false、slot 隐式关闭、Provider 默认之间必须分别验证，不以 truthy 代替字段存在。 |
| closeIcon / closeText | 既有遗留标量通道保留；closeIcon 运行时含 Number 而类型不含，先用公开合法值核对；closable.closeIcon 与 Provider 对象 closeIcon 当前按真值取值，0/false/空内容不能到达消费，需失败复现。本轮不新增顶层 VNode/function 内容 prop。 |
| close / onClose | 当前不是 emits；props.closable.onClose 抢占模板 @close，Provider closable.onClose 不消费；关闭开始直接置 closed 且无反复点击保护。本轮按 ADR0007提供实际 MouseEvent 的 Vue close 通知并保留配置业务通知，明确去重与优先级；不添加取消/受控开关新能力。 |
| afterClose | 仅 onLeaveEnd 回调；模板 @after-close 没有通道，Provider afterClose 不消费；禁动效或减少动画下没有 transitionend 时可能不收口。本轮复现真实完成后通知，覆盖原生动效、禁动效、卸载前后和一次性；保留旧配置回调与 plain afterClose 的迁移说明。 |
| 状态 / v-model | 当前只有实例内部 closed，没有公开 visible/open/model 或 update 事件。关闭为一次性内部状态；父级通过 v-if/key 控制挂载与重新显示。验证拒绝把 closable 变更伪装为重新打开，以及两实例、反复挂卸、关闭中卸载。 |
| attrs / id / role / 原生事件 | id 与三个鼠标函数显式消费；其余 attrs 被 pickAttrs 限成 aria/data/class/style，tabindex/title/keydown/focus/事件修饰符被丢弃。保留 native MouseEvent，补原生 attrs/once/string-array-object style、role 默认/覆盖及根元素所有权；根内部关闭状态不被 attrs 覆盖。 |
| nativeElement | getter 指向 motion 根 div；补首次空值、更新、关闭完成/卸载 null、键盘关闭时实际元素，不能以组件代理当 DOM。 |
| classNames / styles | 七区域：root/icon/section/title/description/actions/close；Provider 五字段在 setup 快照，普通 semanticProps 对象 watchEffect 不提供可靠的函数依赖。本轮验证当前实参/替换删除/优先级与同一原生节点；去除掩盖 style 类型的 never 断言。 |
| Provider | className/style/classNames/styles/variant/closable/closeIcon 与四类型图标、direction/getPrefixCls；逐字段替换、删除、局部覆盖、嵌套最近 Provider、多实例、attrs-only 更新。本轮成组修复失去当前性的链路，不修改共享 Provider。 |
| Theme / 四 Token | prepareComponentToken 声明 borderRadius/withDescriptionIconSize/defaultPadding/withDescriptionPadding；根 CSS 只有默认变量，组件没有 theme.components.Alert 投射，padding 还固定默认实串。已有接口未消费属必修；覆盖动态 override/移除、源 Alias、dark/compact/组合、原生变量优先、SSR/水合。 |
| 样式 / a11y / 键盘 | 原生 button 已有 Enter/Space 基础能力和 focus-visible；必须真实浏览器验证 Tab 与关闭时序。空/自定义关闭图标缺少独立默认名称，默认类型图标为装饰；补当前可访问名称、减少动画、文本换行和空宿主，不用 axe 代替键盘。 |
| ErrorBoundary props | title/message/description 为 VNode 数据、id 仅错误回退；当前渲染错误→Alert type=error，并阻断上抛。保留 VNode 数据及 message 别名；字符串化错误和 Vue info 不伪称 React stack。 |
| ErrorBoundary default / attrs | 只有完整默认 slot；无错误时不制造包装节点。当前错误回退会丢 class/style/ARIA/原生事件，且以 error 真值判断，0/false/null/undefined 抛错不显示错误 UI。本轮复现并补 fallback attrs 路由、任意抛出值、动态 fallback 内容、真实后代 render/setup/lifecycle/event 适用捕获；健康 Fragment 不擅自加 div。 |
| ErrorBoundary exports / model / expose | 无 model/业务 emits/expose；Alert.ErrorBoundary 运行时 Object.assign 未反映在导出类型，需消费端失败复现并修复所属 index，具名 AlertErrorBoundary 保留；根新类型导出交主线程。 |

## 全部 Demo 盘点

已逐文件读取全部15个 `.vue` 及配对说明；不以 demo 冒烟等同真实交互。

| Demo | 保留场景与本轮核对 |
| --- | --- |
| basic | success 单行标题，默认视觉。 |
| description | 四类型描述与长文换行。 |
| closable | 四类型配置对象、真实关闭事件与名称；改用明确 Vue 事件演示，保留业务配置能力测试。 |
| icon | 四类有/无描述默认图标与关闭。 |
| custom-icon | showIcon=false 抑制，完整自定义图标及两种内容密度。 |
| banner | 默认 warning/图标、显式 false、长文及 error。 |
| action | 多种原生操作按钮和动作布局，不改动作业务语义。 |
| filled | 保留 filled 合理视觉。 |
| smooth-closed | 当前配置 afterClose 控制 v-if；补 Vue after-close 实际完成及重新挂载。 |
| style-class | 对象/函数语义样式与当前 type，保留原生 class/style 优先级。 |
| custom-title-alignment | 多行首行对齐、360px 宽在移动视口的适用边界。 |
| loop-banner | 自定义内容动画；补 prefers-reduced-motion，删除把上游同构当规格的文案。 |
| error-boundary | 当前文案错误描述事件捕获平台差异；改用明确后代渲染失败与 key 重挂 Demo，并实际点击验证。 |
| component-token | 当前直接 CSS 变量并声称 Provider 不生效；四 Token 原有接口修复后改为真实动态主题/移除演示，原生变量优先仍有覆盖。 |
| content-slots | 当前 Alert/Collapse 联合 F07 场景保留，验证 Alert 真实更新/空槽/移除，不修改 Collapse 实现。 |

外部直接调用已查：Calendar select Demo 与多份 Form Demo 使用 Alert 标题/类型/显隐，不调用旧关闭回调；保留其合法 prop-only 行为。ErrorBoundary 内部消费 Alert，须随本单元验证。

## 分类与实施顺序

1. 先运行现有 unit/DOM/a11y/theme 基线；已有断言不删除，现有正常路径只有实跑后才记“已验证正常”。
2. 本轮必修组：当前配置和语义、完整动态 slots 与原生 attrs、Vue 关闭/完成事件与名称/动效、四 Token 及源主题、ErrorBoundary 任意错误和类型/attrs、Demo 与文档。
3. 原有字段失效和关键原生交互均纳入本轮。实现前增加可失败的独立 contract 测试与真实浏览器断言；先保存红灯，随后成组修复。
4. 无需新增产品裁决：按既有文档、当前规范及 ADR0006/0007 直接修正上述错误路径。关闭取消、公开 visible/reset API、任意前缀自动 CSS、新 ErrorBoundary恢复 API 为另案新能力，本轮不添加。

## 统一验收标准

- 逐项核对上述完整清单；单位/交互、原机械 DOM28场景、主题与全部15 Demo/a11y真实执行。任何必需的机械差异按具体路径登记，旧参考不改，不降低门禁。
- 真实源浏览器验证 Tab/Enter/Space、一次 close/after-close、普通/禁用动效与减少动画、动态 Provider/attrs/slots、焦点/编辑器身份、多实例、关闭中卸载、ErrorBoundary及当前主题几何/颜色；独立消费端正反类型与 SSR/水合适用覆盖。
- 公开 props、五个具名 slots、ErrorBoundary default、原生事件和静态子组件类型与双语 API、Demo、迁移记录同步；新的根导出整合需求单列给主线程。
- 提供完整源码指纹、红/绿命令与结果、未运行边界，交付后冻结所属源码。发布 build/L7、正式视觉与全库最终同提交门禁由主线程继续，未执行不得声称全单元验收完成。

## 成组修复与逐项收口

| 分类 | 实施与现有正常路径的验证 |
| --- | --- |
| 数据、完整内容与布局 | 保留 type/banner/variant、title/message/description 合法数据与默认视觉；五个内容 slot 在 render 读取完整 Fragment/0。空 title/description/icon/action 不留下空宿主，空 closeIcon 不回退；条件槽新增、更新、移除和多实例已覆盖。 |
| 当前 Provider / 语义 | 配置字段逐项替换、删除，最近 Provider/局部优先和四种类型图标替换/移除均有行为测试。语义函数同步当前解析的 prefixCls/role/type/variant/showIcon/closable；role 按原公开接口作为 runtime prop 消费。 |
| 原生根与类型 | 普通 attrs、原生事件、once、class/style 数组和字符串合并到真实 div；内部 ref/data-show 保留所有权。动态更新保留业务输入节点、值、焦点及选区。所属入口和根入口公开五 named Slots、Boundary default 类型及有类型的静态子组件；根导出由主线程接入。 |
| 关闭生命周期 | close 发真实 MouseEvent；Vue emits 与当前业务配置分别通知，同一函数去重。closed/完成保护阻止重复请求；after-close 在实际内部移除后一次通知，普通 transition、motion=false、减少动画、关闭中卸载和多次重挂实测；没有新增受控 open/reset/model。 |
| 样式与来源 | 四 Token 与所需 Alias 投射到自身根，原生变量优先；padding 消费当前 Alias。消费共享 ThemeContext.sourceActive：只有明确 false 才保留页面 CSS，显式空 TP 经无 theme CP 恢复默认值，无标识自定义 context 按显式来源消费。源码浏览器以当前 theme 源码验证该 producer，未 build 包。 |
| 关联 ErrorBoundary | 捕获标志独立于错误值，setup/render/lifecycle/后代 event 及0/false/null/undefined均覆盖。健康 Fragment 不包装，错误回退接 attrs；完整 VNode 数据可动态替换/有意为空。默认详情具名且可聚焦，窄屏 Tab/方向键横向滚动实测。 |
| 15个 Demo / 文档 | 全部真实原始 SFC保留；关闭/完成用 Vue 事件、四 Token 使用真实主题切换、Boundary 使用真实后代故障和 key 恢复；移动宽度、条件空 Collapse标题的业务名称及减少动画修复仅限所属 Demo。双语 API、README、迁移同步。 |

错误旧断言只修改一处业务优先级：原 `closable.onClose` 抢占 Vue @close 改为二者分别通知，依据 ADR0007，替代覆盖包含相同函数去重和原生 MouseEvent。其余原行为测试与28个机械参考场景保留；10个场景仅登记13条精确 ARIA 新增，反向核对全部 specs/reference IDs、有限路径及字段，未修改参考 HTML/PNG、共享归一化、规则或阈值。两条旧 padding 实串断言改为其实际 Alias 变量消费，并补真实 padding 几何与四 Token 动态覆盖。

## 红灯与证据校准

原始证据统一存放 `/tmp/apollo-alert-audit-20261029/`。初始基线102/102通过，随后修复前的独立27例中23失败、4通过（`red.json`），包括当前 Provider/attrs/空槽/close事件/完成/四 Token/Boundary。最早的错误 Provider prop、VTU Teleport stub、祖先查询和受控 input 假设已纠正并保留原报告，未把 fixture 错误算作组件缺陷。

- 追加合并 prefixCls/role 红例2/2失败（`semantic-red.json`）；修复后两个字段均与实际 DOM一致。
- 终审将合法 Provider icon=null 纳入原四图标用例，四例均失败（`null-icon-red.json`）：默认回退本身保留，但默认装饰判断只认undefined。仅将装饰判断与已有nullish回退保持一致；新增一项真实浏览器null→自定义恢复检查，契约浏览器总数由28增为29，未扩展其它场景或公共API。
- 共享来源语义补盘：显式空 TP 和无 metadata context 两例失败，CSS-only 正控通过（`theme-source-red-corrected.json`）。第一次新增 fixture 的语法错误另存，不算有效红灯。浏览器亦实际复现空 TP 继承外层20px而非默认14px（`theme-browser-red.json`）；同轮一次关闭瞬态高度采样超时，最终 observer 在点击前记录真实正像素高度和原生 transitionend，避免点击返回后错过瞬态。
- 真实15 Demo首轮175/180，移动 content-slots 控制区溢出及空 Collapse业务标题未命名；所属 Demo 修复后180/180，无修改 Collapse实现（`demos-first.json`、`demos-third.json`）。
- 独立原生视觉首轮59/60，真实错误详情移动端触发 scrollable-region-focusable；修复默认 pre 焦点/名称后60/60，并新增真实 Tab/方向键验证（`native-first.json`、`native-third.json`）。
- 类型诊断真实修正：测试配置只做整对象替换，改用 shallowRef避免含VNode的深层 UnwrapRef递归；向公开 components 的索引型配置传递真实展开对象。SFC用公开 ConfigProviderProps.components 类型逐字段构建，消除空分支带 undefined及接口缺少索引的错误；未用 any、断言或忽略隐藏诊断，场景及断言保留。

## 已执行局部门禁与当前边界

| 命令 / 证据 | 当前结果与适用边界 |
| --- | --- |
| `pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/alert --maxWorkers=2 --reporter=json --outputFile=/tmp/apollo-alert-audit-20261029/regression-closure.json` | 142/142、exit0，含原28机械场景、全部15 Demo单元/axe、39个新增行为场景和完整差异范围保护；四图标用例追加null回退断言，不改变用例总数；不是全库执行。 |
| `pnpm exec vitest run --project types packages/ui/src/alert --maxWorkers=1 --reporter=verbose` | 收口18/18、Type Errors no errors、exit0（`type-tests-closure.log`）。首轮JSON虽给18/18 success=true但进程exit1，保留历史，未把其局部绿当作门禁通过。 |
| `ALERT_SOURCE=1 node tests/consumer/alert-types.mjs` | 源码严格消费端exit0（`consumer-source-closure.log`），直接编译全部15个原始.vue、实际AlertContracts.vue和公共根/alert子入口SFC及正负例；未改写为替代模板，未缩小库 API。 |
| `pnpm exec vue-tsc --noEmit -p tsconfig.json` | 收口exit0、0诊断（`types-closure.log`）。第四轮原仅其他单元 Layout/contracts.test.ts:106 诊断，只报告未跨界修改；他处收口后最终同工作树检查通过，仍不是最终提交全量门禁。 |
| `ALERT_EVIDENCE=…/browser-closure.json node tests/browser/alert-contracts.mjs` | 源码29/29、exit0，真实 Chromium150、SSR/水合身份、当前来源、键盘/焦点、关闭、Boundary、实际主题几何/颜色和真实axe；错误与Vue/水合告警为0。普通关闭实际观察到103.141px高度与原生transitionend。 |
| `ALERT_DEMOS_EVIDENCE=…/demos-closure.json node tests/browser/alert-demos.mjs` | 15原始SFC × default/dark/compact/组合 × 375/768/1440 =180/180、exit0；业务交互/几何/axe，构建校验15原始Demo均真实加载，0浏览器错误。 |
| `ALERT_VISUAL_EVIDENCE=…/native-closure.json node tests/browser/alert-visual.mjs` | 20个独立Apollo状态 × 3视口 =60/60、exit0，真实内容/paint/键盘/焦点/axe后截图；人工查看第三轮7张代表图，收口60张与第三轮逐字节一致，不能替代主线程正式视觉审批。 |
| 定向 `biome check` | 所属TS/JS/MJS文件执行格式和lint；未忽略诊断，未格式化其他单元文件。 |

三个浏览器脚本只在临时目录构建 fixture，支持 `ALERT_SOURCE=0` 的发布分支，禁用 source fallback并验证真实发布 CSS。Demo发布分支仅允许上述15个原始Demo SFC作为测试输入，其他 package/src 模块均拒绝；不把真实Demo源码误判为库实现fallback，也不允许任意源码放行。契约与Demo使用真实时钟，保留普通 transition和业务事件；原生视觉使用共享稳定截图流程，内部测试状态使用motion=false明确收口。

未执行：包 build、发布声明消费、发布模式29/180/60、全量覆盖率、正式共享视觉matrix/runner基线审批、文档站生成/构建、Registry收口和最终同一提交全量门禁。主线程已接入20个原生视觉variants计划，正式审批未执行。共享sourceActive producer整体及其他组件迁移由主线程验收。不存在等待用户裁决的本轮缺陷；新受控关闭、取消钩子、任意前缀自动 CSS和新Boundary恢复方法仍为另案能力。

完整冻结文件、实现与证据SHA256、命令及真实退出码见 `docs/audit/evidence/alert-contract-source-freeze.json`。冻结仅涵盖本单元所属文件；根导出、共享来源实现及其他并行单元仅记录为依赖观察，不由本执行者冻结或提交。所有独立浏览器/fixture server已退出，包产物、旧机械基线和PNG均未修改。

## 2026-10-29 · 本轮最终验收

上文保留各阶段红绿及当时的待验收边界；本节记录统一收口。Alert完整清单已验收：发布29/29、15个Demo共180/180、60/60原生状态及严格消费；正式Apollo 60张已审阅批准，批准后严格rawRGBA精确。

[本批最终验收](evidence/space-flex-alert-layout-final-acceptance.json)汇总1978/118关联专项、[本单元发布门禁](evidence/alert-published-verification.json)、[正式视觉审阅](evidence/space-flex-alert-layout-native-review.json)、[批准后回执](evidence/space-flex-alert-layout-postapproval.json)及[Docs161+56](evidence/space-flex-alert-layout-docs-local.json)。原759视觉记录和PNG保留，当前完整交付21/72；Input完整API、其他51组件、13基础包逐包审计与全库最终同提交门禁仍开放。Docs为本地真实构建验收，最终部署/线上回执由主线程另记。
