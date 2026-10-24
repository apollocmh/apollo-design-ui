# Apollo Design · 发布前最终审计与整改台账

> **审计日期：2026-10-23 · 目标：`master` · 基线 SHA：`dcecc4d512582b65a28e69e25c004df0ecada815`**  
> 审计范围：72 个 UI 组件及子组件、13 个基础包、`ui/_internal`、文档站、Demo、Registry、规范与验收门禁。  
> **这是一份可执行的整改规格，不是“72/72 已完成”的重复声明。**  
> 证据分级：**A = 在 master 代码中直接确认；B = 历史有复现且最新代码仍存在对应结构，必须在当前提交复现；C = 基于静态模式确认的架构/体验风险；D = 来源为带日期的既有审计数据，须在当前 HEAD 重算。**  
> **初始远程审计的限制（不含下方本地整改证据）**：原审计以 GitHub 连接直接读取 master 源码、Registry 和证据报告；未在本地克隆仓库、未执行 pnpm/Playwright、未真实操作页面。因此“源代码已确认”不等于“本轮已运行验证”。不得把 B/C/D 升级成已经通过或失败的运行时结果。

## 2026-10-23 独立化衔接

本台账的缺陷、证据等级与既有验收继续有效。条目中要求上游固定版对拍的文字保留为历史调查路径；最终修复依据当前 Apollo 公开契约、输入语义与用户场景，不再要求上游同构。D01–D05 未因项目独立化自动裁决。

F03 本轮已建立 `packages/ui/src/form/__tests__/prefix-reactivity.test.ts`：修复前动态切换前缀失败；ItemHolder 改为 computed 派生后验证 f1→f2→f1、状态类、row 与节点身份。完整验证结果见本次独立化报告。其余事项保持未完成状态，不以治理变更关闭。

## 2026-10-23 本地整改进展

- **F01：功能修复已验证**。DatePicker / RangePicker / TimePicker / TimeRangePicker 的 `id`、Tab 顺序、输入 ARIA、name/required/autoComplete 接入实际 input；class/style/data 与鼠标事件留根。7 条初始回归修前全红，补充 autofocus 后 8 条通过；相关四层回归 27 文件 / 534 条通过，生产 dist 的真实 Chrome 四入口交互通过。SSR 水合、范围对象 id、禁用/只读、掩码/多选均有覆盖。完整发布验收仍需 Apollo 视觉基线，见本轮报告。
- **D03：用户已明确裁决**。组件库尚在开发阶段且无现有用户，内容渲染函数 prop **直接改为 Vue 插槽，不保留函数兼容层或弃用期**。见 [ADR 0006](adr/0006-development-template-slots.md)；此授权不自动改变 D02 的点击事件载荷。
- **F06：按 D03 直接迁移**。Transfer 采用 `#item/#footer/#list/#selectAllLabel`，旧函数 prop 与专用返回值类型移除；调用示例、公开类型、文档和历史 DOM 对照同步迁移。5 条插槽复现修前全红；运行时四层与超时单独复验通过；相关三个组件的 154 条类型测试、严格类型、L7 UI、tarball 消费端、文档 84 路由构建通过，证据在本轮报告汇总。其他组件按同一裁决逐项推进，未宣称全仓函数渲染接口已清零。

证据与未完成验证见 [F01 / F06 本地整改报告](audit/2026-10-23-picker-transfer-remediation.md)。原审计源码描述保留为修前证据，不再作为这些修复后路径的实时描述。

## 2026-10-23 持续整改进展（二）

- **F02：功能修复已验证**。Select 的条件默认插槽、Fragment/Comment、分组与循环选项通过 render → 普通 Vue props 更新值、筛选和缓存链；AutoComplete 同步移除插槽分类 computed。7 条新回归通过；Select/AutoComplete/TreeSelect/Cascader 四层 30 文件 / 475 条通过。新增真实条件选项 Demo，验证不重挂载、最新 label/disabled、缓存、搜索、虚拟化和键盘。
- **F04：已接入模板插槽**。InputNumber 外层/内部件均支持 typed #prefix/#suffix，空 slot 不回退，反馈图标与 Compact/addon/数字引擎保留；5 条修前失败、修后通过。示例改为真实可切换模板并带输入可访问名。
- **F08：已消除渲染期状态写入**。Descriptions 的子项直接在当前 render 形成 rows，items 分支独立缓存，并跳过被覆盖的默认 slot；该未跳过路径已红灯复现。动态行/合并单元格/无关 attrs 单次更新/SSR 水合通过，**未复现死循环或额外更新**。InputNumber/Descriptions 四层合计 15 文件 / 216 条通过。
- **H01：过期历史记录已清账**。Table 的双语 API 与文档管线实际存在，VNA-RECHECK-04 改 fixed；从实际 24 条历史 issue 重算汇总，修复旧 fixed=17/open=1 的陈旧计数。新增 registry:vue-native:check 与两条失败门禁测试，防文件/API 正文丢失和汇总漂移。历史审计零 open 不表示本台账全部关闭。

严格类型、六组件 66 条类型测试、L7 UI 11 项和生产包 Chrome 三组交互通过，零页面错误。完整命令、Docs/消费端与视觉缺口见 [本批报告](audit/2026-10-23-vue-reactivity-remediation.md)。原组件 completed 与 legacy-reference 视觉标记未冒充新验收。

## 2026-10-24 持续整改进展（三）

- **F05：已补齐 Badge 模板内容**。新增 typed #count/#text，支持同传、空内容、条件出现/移除及更新；富内容走静态 indicator，数字 count 的 overflow、showZero 与 ScrollNumber 缓存继续保留。首批 6 条修前全红；扩展空计数/独立文本、SSR 水合与默认插槽切换后 9 条通过，完整四层 94 条通过。新增可操作 Demo，未以富内容替代数字 prop。
- **F07：已统一内容 slot 优先**。Alert 的 title/description、CollapsePanel 的 header 以 slot 存在为准，包括空 slot；移除条件 slot 才恢复 prop。旧文档确有 prop-first 承诺，本次按未发布开发版直接变更并单独写 [迁移记录](migrations/content-slot-precedence.md)，不留兼容层。Collapse 每轮 render 仅收集一次当前面板子树，标题刷新保留输入状态。6 条修前全红；真实 Chrome 模板交互通过。
- **F09：语义 change 已声明**。Switch 和 InputNumber 通过 typed emits 单次发送，onChange 注册同一事件；移除手调 attrs 通道，原生 DOM change 不混入语义事件。覆盖鼠标/键盘、监听器替换、禁用、v-model、stringMode/null 与类型负例。Switch click 已按 ADR 0007 直接改为原生 MouseEvent；修饰符、单次发送、键盘激活与迁移见 [D02 报告](audit/2026-10-24-switch-native-events-remediation.md)。
- **F10：DOM 目标归一与原生事件已验证**。pickAttrs 保留 className 数据输出，接受已知 Vue 原生事件键与 Once/Passive/Capture 后缀；DOM 目标使用 toVueDomAttrs/mergeDomAttrs。修复 ColorPicker @mousedown 被过滤、Rate @keydown 丢失及字符串 style 的 SSR 无效 CSS，监听器数组按函数身份单次合并，Tree 正确的 fallthrough 保持。utils/Badge/Rate/ColorPicker/Tree 四层 59 文件 / 1168 条通过，Chrome 真实模板通过，见 [F10 报告](audit/2026-10-24-dom-attrs-remediation.md)。
- **F11：当前来源清单已建立**。类型别名、继承及数据/配置/内部/deprecated 分流保留证据，十二个字段引用具体运行报告，其余继续逐项复审；[清单与限制](audit/2026-10-24-slot-inventory.md)。
- **H03：刷新数量并补实际能力场景**。新 Table 行/列原生拖放 Demo 提供等效键盘操作，96 条 Demo/axe 与真实浏览器通过；当前文件统计 990/1060，文档总量 994，不宣称能力矩阵已完成。
- **H04：已消除无效动态导入并记录真实负载**。搜索代码导入统一；按需索引、单次下载/缓存、焦点返回与英文/暗色水合通过，首屏脚本原始/gzip 字节已留证。进一步改为视口附近加载示例并保留实例，Table 初始脚本 55→12、gzip 字节约减 4.35%；文档最终 157 条测试及真实滚动/iframe 截图准备通过。大 chunk 和元数据维护继续开放。
- **H02：规范过期描述已清账**。核对现行规范与 ADR 0005/0006，use-id-test-env 的已裁决记录实际存在；更新台账陈旧描述，未重复立 ADR 或修改 AGENTS。

F07/F09 的运行时、类型迁移、生产浏览器与文档证据见 [整改报告](audit/2026-10-24-content-events-remediation.md)；Badge 的数字缓存与富内容离场证据见 [F05 报告](audit/2026-10-24-badge-slots-remediation.md)。严格类型与 252 条类型测试、两包 L7 和 tarball Vite/Webpack 消费端均通过。视觉基线仍缺失，不以功能测试替代 L6。

## 0. 先给结论：删除旧 `docs/KNOWN-ISSUES.md` 前应该如何收口

**不建议现在直接删掉旧文件而不迁移内容。** 先把本台账的 `FIX`、`VERIFY`、`DECIDE` 项分别迁入可追踪 Issue / `docs/audit/FINAL-GAP-AUDIT.md` / ADR，确保以后即使删旧文档，也不会丢失待办与裁决。旧文件的大部分 §2、§3 是历史记录；已修、已证伪事项不继续开单。

- **FIX（编号以 §1 为准）**：F01 DatePicker 输入属性（本轮已修）、F02 Select 条件插槽（已修）、F03 FormItem 前缀响应性（此前已修）、F04 InputNumber 内容插槽（已修）、F05 Badge 富内容插槽（已补）、F06 Transfer 模板接口（本轮已迁移）、F07 Alert / Collapse 插槽优先级（已改）。
- **VERIFY（先写可失败的用例，不许凭推测改）**：F08 Descriptions render 写 ref（已移除，未复现循环）、F09 Vue 语义事件/React 回调冲突、F10 `pickAttrs` 的 DOM prop/原生事件（已验证修复）、F11 其它 VNodeChild 插槽及动态响应性的完整复算。
- **DECIDE**：D01 不兼容变更边界；D02 原生 click 已按 ADR 0007 裁决实施、D03 已裁决（ADR 0006）；仍开放的包括 D04 非默认 `prefixCls` 的 CSS 策略、D05 上游调试/依赖第三方服务的 Demo 是否纳入完成标准。
- **HOUSEKEEPING**：H01 Table 陈旧文档状态与汇总（已修）、H02 规范/台账陈旧矛盾（已清账）、H03 Demo 覆盖矩阵更新与例外清单、H04 文档构建警告分类处理。

**本轮排除项**：Message / Notification 的进出场动画已由用户自主验收，不再以其动画为开放问题；Menu 的 Trigger 弹层整改、Icon 独立检索目录、文档站 V3 等已有实现及浏览器证据，不重复报“未做”。可保留 CI 回归，不重复返工。

### 严重性与执行原则

P1 = 破坏用户常见行为/可访问性；P2 = Vue API/生命周期/响应式问题；P3 = 示例/工程治理。**证据等级和优先级是两回事**。有“来源文件”但无最新运行复现时，修复 PR 必须先提交红灯复现用例。

---

## 1. 可落地问题与解决方案（逐条）

### F01 · P1 · B → 本地功能修复已验证｜DatePicker / RangePicker / TimePicker：`id` 与 `tabindex` 没有落到实际输入框

**源码**：[DatePicker.vue](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/date-picker/DatePicker.vue#L1480-L1513)；[RangePicker.vue](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/date-picker/RangePicker.vue#L1336-L1366)；[Selector.ts](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/date-picker/components/Selector.ts#L668-L701)；[现有测试](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/date-picker/__tests__/index.test.ts#L528-L575)。

**证据**：旧文档 §1.3 记录实际测试：单值 `id` 丢失、`tabindex` 落根；新源码中 `selectorBindings()` 把调用方 attrs 传给 `Selector`，`Selector` 又把 `passthroughAttrs` 铺到外层 `div`，而 `h('input', …)` 不包含 `id`、`tabindex`。某些属性可能在 Trigger 链中进一步丢失，最终 DOM 必须用真实挂载测试确认。

**修法（不复制 React 实现）**：
1. 在 DatePicker / RangePicker 的 *入口* 显式分流根属性与**输入属性**：`class/style/data-*` 保持现有根语义；`id/tabindex/autoFocus` 和对应输入标签关联的 ARIA 属性要按上游固定版对拍后路由到输入。**不要**直接把所有 `$attrs` 无差别铺到 input，否则会破坏根 `class` / `data-*` / 鼠标事件。
2. 在 `Selector.ts` 新增有明确类型的 `inputAttrs`（单值）或 `inputAttrsByIndex`（范围），渲染 `<input>` 时有序 `mergeProps`，内部受控 `value/onInput/onFocus` 不允许被任意 attrs 覆盖；避免把实际 input `ref`、事件、`value` 散落在不受控的对象扩展里。
3. Range 的 `id` 是一个还是两个，需要先用同版本 React 对拍确定（不要凭直觉生成 `${id}-start`）。TimePicker 薄壳继续传递同一契约。
4. 把旧的负向空转断言改成正向断言：**实际 `input.id === 'sample-id'`、`input.tabIndex === 5`、`label[for]` 焦点可达、`aria-labelledby` 能连接；根不出现错误的 tabindex**。

**验收**：普通与范围 Picker、TimePicker；受控属性更新、disabled、readonly、键盘、SSR 水合、弹层开关、表单 `label for`。先验证原测试在修前真红；组件回归 + a11y + L4 DOM + L6 视觉。

### F02 · P1 · B → 本地功能修复已验证｜Select：条件默认插槽在首次无内容后无法补出选项

**源码**：[Select.ts#L300-L320](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/select/Select.ts#L300-L320)。

**根因**：`parsed = computed(() => parseOptions(... convertChildrenToData(slots.default?.()) ...))` 把当前插槽视为可跟踪的响应式依赖。但父组件动态增删 slot 函数本身不是 `computed` 的 reactive 依赖；旧文档 §1.4 已实测“首次无 slot，后来出现 slot，选项数仍为 0”。master 仍保留这条结构。

**当前实现**：公开 render 边界读取并归一化当前 slot，使用普通 Vue props 交给私有值引擎；由真实数据 props 驱动 parse/filter/cache/display 的 computed 正常失效。没有 render 写 reactive ref、bump version 或更换 key。显式 options（包括 []）保持优先且不执行默认插槽；AutoComplete 的分类也在 render 完成。下面方案文字保留为修前调查路径，当前证据见本批报告。

**推荐方案 A（首选、Vue 原生）**：**把 slot VNode 的读取和归一化放到组件 render 阶段**，props.options 数据通道继续 computed 缓存。不要在 `computed` getter 里依赖插槽引用是否变化，也不要靠 render 中递增 `ref` 版本号来强制 computed 失效。为了避免全链路重构，可抽 `resolveParsedOptions(options, children, fieldNames, filterProp, optionLabelProp)` 纯函数，在 render 开始获取 `slots.default?.()`，把结果经只读的 render-local 上下文给本轮 BaseSelect / OptionList / 过滤与缓存链消费；**不得**在 render 中写 reactive ref 造成更新自激。

**实现顺序**：先写动态 slot 回归 → 梳理所有 `parsed.value` 消费点与 `useCache` 依赖 → 将“props options”与“children VNode”明确两路 → 一次性更新依赖并复验 Select、AutoComplete、TreeSelect、Cascader。若选优化版缓存，只缓存纯数据 props 分支，不缓存不能被追踪的 slot 函数结果。

**最小可失败样例**：

```vue
<Select open>
  <template v-if="show" #default>
    <SelectOption value="a">A</SelectOption>
  </template>
</Select>
```

初始 `show=false` → `true` → `false` → `true`：选项数 0→1→0→1；更新 `value/label/disabled` 与替换整棵 slot 均必须生效。另测异步 options、options 与 slot 同时存在的优先级、筛选与虚拟滚动，不允许通过给整个 Select 加 `:key` 重挂载规避。

### F03 · P2 · 已修并验证真实控件/测量/SSR｜FormItem：动态 `prefixCls`

**源码**：[ItemHolder.ts#L59](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/form/FormItem/ItemHolder.ts#L59)；[StatusProvider.ts#L79-L106](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/form/FormItem/StatusProvider.ts#L79-L106)。

`ItemHolder` 原在 setup 中固定 `itemPrefixCls`。修复已由提交 `6867166a`（2026-10-23）完成，当前为：

```ts
const itemPrefixCls = computed(() => `${props.prefixCls}-item`);
// 在模板/渲染函数中使用 itemPrefixCls.value，拼接子类名时同理
```

2026-10-24 第一阶段只复跑基础 1 条，见 [复核记录](audit/2026-10-24-form-prefix-recheck.md)。后续扩展使用真实 Input，新增 6 条先红后绿，发现 ErrorList 的前缀上下文缺失/快照冻结与 prefix/layout 切换后 margin 占位未重测两条遗漏，均已修复；另补 SSR hydration 并单独修复 F12 基础层问题。

当前 prefix 回归共 8 条，覆盖三布局 f1→f2→f1、直接 Item prefix、真实反馈图标四状态、帮助/错误、独立及 Form.List ErrorList、margin-offset/additional min-height 与 SSR hydration。生产 Chrome 的对应矩阵、help 移除/恢复、用户输入值及 DOM 身份通过；相关 7 组组件的运行/DOM/axe/theme 共 48 文件 722 条通过。范围及所有命令见 [F03 整改报告](audit/2026-10-24-form-prefix-remediation.md)。

**边界**：`StatusProvider.ts` 的局部变量仍位于 `feedbackIcon` computed 内，保持原实现。前缀对应 CSS 需预生成/加载（D04），本批不引入运行时 CSS。Form 视觉检查缺 21 张已批准基线，动态 Form.List/异步校验等其他能力不由 F03 关闭。


### F04 · P2 · A → 已接入模板插槽｜InputNumber：Vue 具名 `#prefix` / `#suffix` 缺失

**源码**：[InputNumber.ts#L142-L152](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/input-number/InputNumber.ts#L142-L152)、[L716-L765](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/input-number/InputNumber.ts#L716-L765)。

`InputNumberInternalComponent` 只有 `setup(props, { attrs, emit, expose })`，渲染前后缀直接读取 `props.prefix/suffix`，没有消费 `slots`；外层包装同样没有 slots 转发。用户需要构造 VNode prop，而不能在 `<InputNumber><template #prefix>…</template></InputNumber>` 中自然写模板。

**推荐**：
1. 给外层和内部件都增加明确的 `prefix/suffix` slots 类型，并通过**slot 函数转发**（不要在 setup 期执行并缓存 slot VNode）。
2. 内容采用 `hasSlot('prefix') ? slots.prefix?.() : props.prefix`，有意允许空 slot 覆盖 prop；`hasSlot` 判断优先于 `??`，避免“明确提供空 slot 却回退旧 prop”。保持原有前后缀 wrapper、语义 class、`hasFeedback` 与动作按钮顺序。
3. 简单内容值仍可使用 `prefix/suffix` prop，同时存在时**slot 优先**；这不是保留旧函数渲染接口；新增 `v-if` 出现/消失与动态内容测试、SSR/类型测试；必要时更新 InputNumber 文档的优先用法。

### F05 · P2 · 已补模板插槽｜Badge：`count/text` 富内容缺少具名插槽通道

**修前源码**：[Badge.vue](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/badge/Badge.vue#L92-L204)、[模板](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/badge/Badge.vue#L255-L290)。

组件只使用 `slots.default`，`count/text` 均是 VNodeChild prop。**不能**按 InputNumber 的办法直接把 count 改为 slot 结果：这里 `livingCount/displayCount/isDotCache` 缓存保证计数关闭时仍保持上一帧以播放 ScrollNumber 动画，普通 slot VNode 和数字计数的 overflow/滚动逻辑不同。

**当前处理**：公开边界已在 render 消费并归一 #count/#text，私有指示器通过普通 props 跟踪当前内容；新增富内容分支不拆数字位，并保留离场最后可见内容。数字 prop 原有滚动状态不变，空 slot 不回退。以下方案保留为修前调查路径。

**推荐**：先补 `#text`，提供 `#count` 的静态富内容分支（VNode 直接呈现，保留 indicator 语义/offset，但**不启动数字位滚动**），数字 `count` prop 原有滚动状态机保持不变。为 slot 动态显隐、`0`、`showZero`、`overflowCount`、status、离场、窄屏的结果分别建断言。确定是否完全替代 `count` 数字 prop 应单独裁决；默认**不替代**。

### F06 · P2 · A → 按用户裁决直接迁移｜Transfer：函数 render API 缺少 Vue scoped slots

**源码**：[Transfer.ts#L45-L75](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/transfer/Transfer.ts#L45-L75)、[L430-L453](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/transfer/Transfer.ts#L430-L453)、[interface.ts](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/transfer/interface.ts#L90-L125)。

`render`, `footer`, `renderList` 全通过函数 props 传递，主件 setup 不读取 `slots`；从 Vue 用户视角，列表项、底栏、自定义列表这些模板扩展点缺少作用域插槽。

**当前处理**：用户已否决保留函数兼容的方案。组件内容扩展直接使用 typed scoped slots：`#item`、`#footer`、`#list`、`#selectAllLabel`；旧 `render/footer/renderList/children` 以及选择计数函数接口移除。作用域只提供可保障字段，使用插槽存在性判定，空 slot 不回退；自定义列表与内嵌分页的限制保留。默认条目显示数据 title/key，搜索使用数据文本与 filterOption。完整契约、调用迁移和类型移除见 [迁移记录](migrations/transfer-slots.md)。

### F07 · P2 · 已迁移开发版内容优先级｜Alert / Collapse：内容 prop 优先于具名 slot，与 Vue 契约不一致

**修前源码**：[Alert.ts#L253-L262](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/alert/Alert.ts#L253-L262)：`props.title ?? props.message ?? slots.title?.()`；`props.description ?? slots.description?.()`。 [Collapse.ts#L274-L290](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/collapse/Collapse.ts#L274-L290)：子面板 `header: cProps.header ?? headerSlot`。

**修前问题**：源代码确实把 prop 放在 slot 之前；但仓库 `COMPATIBILITY.md` §2 将“插槽优先”写成默认映射。模板同时传 `title` 与 `#title` 时，开发者提供的 slot 被忽略；这不是 Vue 推荐的内容分发心智。尤其 Vue 模板中的可切换富文本不能被静态字符串 prop 阻挡。

**当前处理**：已按 [独立行为迁移](migrations/content-slot-precedence.md) 在开发版直接统一内容 slot 优先，并纠正旧 prop-first 文档/断言；空描述状态、prop-only 和面板输入身份均验证。以下文字保留为修前调查路径，不再作为待批准操作。

**推荐**：内部统一 `resolveNode(slot, prop)`，先以**slot 是否存在**为准，再读 prop，**明确空 slot 不再回退**；`Alert` deprecated `message` 仅最后兜底，`Collapse.Panel` 也是同样顺序。先查已有 L4/测试是否刻意锁定 prop 优先、并向用户说明这是行为调整；若已被公共文档明确承诺 prop 优先，则先标 `DECIDE` 而非无声破坏。覆盖同传、空 slot、动态 slot 与旧 prop-only 兼容，避免改变样式层级。

### F08 · P2 · 反模式已移除，未复现死循环｜Descriptions：render 期间写 `shallowRef`

**源码**：[Descriptions.ts#L182-L232](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/descriptions/Descriptions.ts#L182-L232)、[L462-L470](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/descriptions/Descriptions.ts#L462-L470)。

`return () => { currentChildren.value = collectChildren(slots.default?.() ?? []); ... rows.value ... }`：render effect 在构建 VNode 时修改了被 `rows` computed 消费的响应式 ref，这是 Vue 值得避免的“渲染期副作用”，可能造成额外排队更新；**不据此臆断已经发生无限循环**。

**本地复验结果**：渲染期 ref 已移除；props.items（包括 []）优先且不调用被覆盖的默认 slot，该调用路径修前失败、修后通过。其余行切分、单次更新与水合回归通过，未把静态模式推断成实际发生的死循环。

**首选改法**：把 `normalizeItems` / `getCalcRows` 的纯计算改成接收当前 render 中的 children（`render-local`）并当轮直接返回 rows；`props.items` 存在时可以安全走独立 computed，不依赖 slot；完全删掉 render 阶段对 `currentChildren.value` 的写入。不要改为 `watchEffect` 读取 slots，也不要在 render 里 bump version。添加反向门禁：只改父级无关状态不应造成无故二次更新；动态新增/删除 Descriptions.Item 要当帧出现，SSR 无 hydration warning，复杂响应式 items 表/合并单元仍通过。

### F09 · P2 · 语义 change 已声明，原生 click 已裁决待迁移｜语义事件仍靠 React 回调式 `$attrs` 模拟

**源码**：[Switch.ts#L91-L104](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/switch/Switch.ts#L91-L104)、[L158-L204](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/switch/Switch.ts#L158-L204)；[InputNumber.ts#L142-L154](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/input-number/InputNumber.ts#L142-L154)、[L345-L358](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/ui/src/input-number/InputNumber.ts#L345-L358)。

**修前事实**：`Switch` 只声明 `update:checked` / `update:value`，把 `onChange/onClick` 留在 attrs 里并手动调用；`InputNumber` 同样只声明 `update:value`，手调 `attrs.onChange`。**Vue 模板的 `@change` 仍可能按同一个 `onChange` 键正常调用，因此不是“@change 整体失效”**；真实问题是“组件没有把语义事件声明为 emits，开发体验/类型契约不够 Vue 原生”，而 `Switch` 的 `@click` 会收到布尔结果而不是通常的原生 `MouseEvent`。

**当前处理**：两组件已声明 typed change emits，所有发送都经 emit，InputNumber 包装层单次转发；移除手动 attrs.onChange 调用。原生 change 不混入语义事件。Switch 的 click 已按 ADR 0007 直接改为 typed 原生 MouseEvent，移除手调 attrs 与旧布尔首参；Vue 修饰符、监听器数组/once、标准方向键和原生 Space/Enter 激活已有回归。另修复原生字符串/数组 style 的错误展开。详见 [D02 报告](audit/2026-10-24-switch-native-events-remediation.md) 与 [迁移记录](migrations/switch-native-events.md)。

**解决方向（修前）**：将**语义 change** 明确声明为 emits 并只通过 `emit('change', payload...)` 发送；回调仍能通过 Vue `onChange` 注册语法自动接收 emit，无需再双调手工回调。⚠️ 真正危险的是 `click`：Vue `@click` 与 legacy React `onClick(result,event)` 使用同一监听键，不能在不破坏兼容的情况下承诺两套不同 payload。该段为修前调查；**D02 现已由 ADR 0007 裁决直接改为原生事件，无兼容层/弃用期**；不能简单同时 `emit('click')` + 手调 `attrs.onClick`，否则双触发。迁移时补负例断言“事件仅一次”，包括禁用、click、keyboard、v-model 和 TS 事件参数推断。

### F10 · P3 · 已验证 DOM 目标与事件修复｜`pickAttrs` 的 `className` 处理依赖 DOM 特例

**源码**：[pick-attrs.ts#L80-L104](https://github.com/apollocmh/apollo-design-ui/blob/master/packages/utils/src/pick-attrs.ts#L80-L104)；[vue-native-audit](https://github.com/apollocmh/apollo-design-ui/blob/master/registry/vue-native-audit.json) `OBS-PICKATTRS-01`。

修前只归一旧事件拼写，未接受 Vue 模板事件键；`className` 保留。Vue 在部分原生 DOM 上恰好能借 `el.className` 生效，但不代表可以视作原生 Vue class 合并策略。**不能直接把底层 utils 的 `className` 改为 `class`**，因为它是 rc 契约级函数，且下游消费点另有 attrs 合并逻辑。

**当前处理**：已新增独立 DOM 目标 helper，并保留 pickAttrs 的 className 数据契约。复现并修复 ColorPicker 的 @mousedown、Rate 的 @keydown 与字符串 style SSR；SSR class、Tree 唯一/动态 class 与 ColorPicker attrs-only 更新通过，未臆造这些路径的故障。原生事件选项及两种键同时注册的单次发送也有覆盖。List 根 id、字符串 style 与 attrs-only 更新已在 [F11 List 批次](audit/2026-10-24-list-slots-remediation.md) 追加复现和修复。以下为原调查方案。

**修法（修前）**：为真正的 Vue DOM 目标增加独立 `toVueDomAttrs` / `mergeDomAttrs` 适配层，归一 `className→class` 并以 `mergeProps` 保留内部类、外部 class、事件函数链；`pickAttrs` 的既有兼容路径继续保持。按 ColorPicker / Rate / Tree 现有消费点逐个迁移，验证不重复 class、无事件双调、SSR DOM 与已有 L4 一致。是否全局替换见 D01。

### F11 · P2 · 已重算来源清单，逐项复审中｜其余 `VNodeChild` 顶层 props 缺 slot：必须重算而非套用旧“154”

**当前清单**：`pnpm run audit:content-slots` / `audit:content-slots:check` 已建立 73 个 interface.ts、499 行 owner/field 清单。内容候选 148、渲染候选 75、数据/配置 146、内部/废弃 130；只将十二个有具体运行报告的字段标 verified，其余候选继续 review，不冒充缺失 slot 数。别名、继承与只读漂移有 tooling 覆盖。详见 [F11 清单报告](audit/2026-10-24-slot-inventory.md)。

**旧文档 §1.2**：190 个 VNodeChild 属性、36 个有同名插槽、154 个缺失，这是 **2026-10-08** 数据；之后组件已改动，**不能当作 master 的实时数字**。尤其此口径把数据字段、deprecated 属性、真正的组件展示属性混杂，不能一次性“补 154 个 slot”。

**推荐四类规则**：
1. **组件顶层展示内容**（prefix/suffix/title/extra/icon/text/empty 等）：优先具名 slot，兼容 primitive prop；F04/F05 为可确认样本。
2. **数据面配置**（items[].label、columns[].render、Menu items、Tree 节点等）：保留纯数据 + 可选作用域 item slot，不因字段类型是 VNodeChild 就机械增加同名 slot。
3. **回调式渲染**（renderItem/footer 等）：直接使用作用域 slot，移除旧顶层内容函数 prop，不留兼容层或弃用期（D03、ADR 0006）；F06 为首批样本。
4. **内部与废弃字段**：注明 `SKIP` 原因，绝不为了统计好看新增公共 API。

**重算脚本要求**：从 `packages/ui/src/**/interface.ts` 收集字段定义，排除数据项/内部/deprecated；对应到实际组件运行时判断 `slots.xxx` / `<slot name>` / `defineSlots`，**类型声明和 Demo 出现不足以证明运行时支持**。输出每行 `{component, prop, category, slotRuntime, slotType, slotDemo, slotTest, decision, reason}`。优先检查 Badge、InputNumber、Transfer、Image、Typography、Pagination、Timeline、Tabs、Descriptions、Breadcrumb、List、Mentions、Drawer；**Steps/Switch/Alert/Collapse 等已存在部分 slot 消费路径，不要统一报“完全没有 slot”**。

**门禁**：能区分 slot“不传”、slot“传了但为空”、slot“异步出现”，能保证 `#foo` 优先级，所有 slot props 可通过 `vue-tsc` 推断类型，Vue SFC 消费 Demo 真正可运行。

**2026-10-24 List 增量**：`renderItem` 已直接移除，12 个示例与单元/DOM/axe/视觉调用迁为泛型 `#item`；接通原先被忽略的 `header` / `footer` / `loadMore`，按 slot 存在性优先，空 slot 不回退。删除照搬上游的整组件废弃警告及 Demo 告警豁免；修复根 id 未透传、字符串 style 展开与 attrs-only 更新缓存。List 运行回归、SSR 与实际 Vue 模板类型推断等证据见 [List 报告](audit/2026-10-24-list-slots-remediation.md)；Item/Meta 的 extra/actions/avatar/title/description 已在后续 [子组件批次](audit/2026-10-24-list-item-slots-remediation.md) 接通，包含空/动态插槽、keyed actions、SSR hydration 与类型回归。根 `extra` 无渲染落点和 List 拖拽示例继续开放，未宣称全库 F11 完成。

**2026-10-24 Drawer 增量**：四个具名内容槽已存在，未误报为新补齐。复现并修复标题重复求值、显式 `aria-labelledby` 被忽略、空头尾切换重建正文，以及 PurePanel 原生 attrs/style 被旧形态截获；导出 DrawerSlots 并对齐 Portal 容器类型。真实浏览器保留正文 DOM/输入值，详见 [Drawer 报告](audit/2026-10-24-drawer-vue-remediation.md)。未宣称 F11 或 Drawer 新视觉验收完成。

**2026-10-24 Tabs 增量**：移除 more.popupRender 函数入口，`#popupRender` 改为单个 `{ originNode, restTabs, onClose }` 参数；Tabs/TabNavList/OperationNode/Dropdown 全链路按原生 slot 转发。复现并修复 extra computed 与 Dropdown setup 的槽存在性快照，新增实际窄容器 Demo。详见 [Tabs 报告](audit/2026-10-24-tabs-popup-remediation.md)，全库 F11 继续开放。

**2026-10-24 Breadcrumb 增量**：移除四参数 itemRender 函数prop，直接提供含逐项paths/href的具名对象槽；修复默认插槽终身缓存和cloneVNode覆盖调用方key，原生子组件组合不再沿用整组件弃用警告。见 [Breadcrumb 报告](audit/2026-10-24-breadcrumb-slots-remediation.md)。

**2026-10-24 Pagination 增量**：直接移除三个渲染函数prop，页码/总数使用单对象槽，尺寸切换走原生槽。List/Table新增当前分页内容转发，修复动态槽缓存、根id/事件/string style丢失，补既有业务回调类型。详见 [Pagination 报告](audit/2026-10-24-pagination-slots-remediation.md)，全库F11仍开放。

**2026-10-24 Masonry 原生底层增量**：复现并修复根 attrs 丢弃、string style 挂载异常和 attrs-only 缓存；原生 load/error 捕获能在 fresh=false 时重测量图片并去重布局通知。见 [Masonry 媒体报告](audit/2026-10-24-masonry-native-media-remediation.md)。itemRender/泛型槽和SSR首帧尚未在本批关闭。

---

### F12 · P1 · hydration 首帧已修，实际检查见报告｜CSSMotion SSR 节点在客户端被替换

F03 扩展测试发现：SSR 输出可见错误节点，客户端支持 appear 时首帧却按新挂载返回 null，造成 hydration mismatch 与 DOM 替换；forceRender 的隐藏分支也有复现。新增基础层 4 条回归，修前 3 失败 / 1 已通过。只在 Vue 已绑定服务端节点的 hydration setup 边界让初始快照匹配 SSR，onMounted 仍运行正常 appear；普通新挂载的 NONE/null、驱动和帧队列未变。

基础单元、普通首帧矩阵、生产 SSR → Chromium 的原节点与预输入值、appear/leave/enter 及单次通知证据见 [F12 报告](audit/2026-10-24-motion-hydration-remediation.md)。不修改动画时长、图片阈值或既有 Message/Notification 验收结论。

---

## 2. Registry、文档与基础包的清账

### H01 · P2 · 已修（历史清账）｜Vue-native 审计 Registry 的 Table open 已过期

原 `VNA-RECHECK-04` 报缺 Table 双语 API，已在本地确认文件、主要 API/导出、内容管线与 SSG 页面实际存在。条目现为 fixed，保留原观察并补充真实文件、日期、路由及报告。

汇总由 `registry/tools/vue-native-status.mjs` 重算；旧 fixed=17/open=1 与实际 24 条 issue 不符，当前历史记录为 fixed=24/open=0。`pnpm run registry:vue-native:check` 已并入 registry:check，汇总漂移、已解决文档的文件/API 正文缺失均非零失败；覆盖 CLI 正反门禁。具体证据见 [本批报告](audit/2026-10-23-vue-reactivity-remediation.md)，不宣称完整 Table 重新验收。

### H02 · P2 · 已清账｜规范冲突和过期阶段声明

原审计所引 `C3`、AGENTS 的“antd 是答案”、ARCHITECTURE 的“逐字对照”和兼容规范 §9.3 的未决项均来自已被替代的规范。当前 AGENTS、ARCHITECTURE、COMPONENT-RULES、COMPATIBILITY 与 [ADR 0005](adr/0005-independent-apollo-contracts.md) 已明确职责、Apollo 独立契约及上游参考边界；历史差异表独立存入 docs/history，不再作为当前规范。

开发阶段模板 API 的直接迁移另由 [ADR 0006](adr/0006-development-template-slots.md) 覆盖，无函数兼容层或弃用期。2026-10-24 再核实 Registry：`use-id-test-env` 已于 2026-10-07 裁决为仅在断言侧归一 id 并保留引用关系，生产实现不固定编号；生成后的决策列表无 open。未新增重复 ADR，未改 AGENTS，也未把本台账 D01/D02/D04/D05 自动视作已裁决。Registry 生成/检查的本批结果见整改报告。

### H03 · P2 · 已刷新快照并补行列重排，能力矩阵继续开放｜Demo 不能以文件数量代表完成

**2026-10-24 当前刷新**：71 可比较组件 990/1060 个文件，93.4%，30 个较少；名称重合 83.8%。文档含 4 个不可直接比较的 QRCode Demo，共 994。历史 stage2 快照保留；本批 Table 行/列原生拖放、单元格对应关系、重置与键盘替代通过真实浏览器，Demo/axe 96 条通过。能力分流与未测项见 [H03 报告](audit/2026-10-24-demo-capabilities.md)，不是数量达标即验收。

**原最后一次全量矩阵的证据**：[demo-coverage-stage2.json](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/evidence/demo-coverage-stage2.json) 生成于 **2026-10-21**：71 个可比较组件，985 个本地 demo 对比 1060 个上游 demo；**文件数量覆盖 92.9%**；场景名重合 **83.8%**；31 个组件数量低于上游。2026-10-23 文档报告又确认文档构建处理 **989 个 demo（含 4 个不可直接对照项）**。

**解决方案**：对缺口建立“能力场景”表，不以凑同名 `.vue` 文件为目标；先区分 `supported+missing-demo`、`unsupported+requires-design`、`external-dependency`、`debug-only`、`intentionally-different`。必须给每个重要能力提供：可交互 Vue 示例、中文/英文说明、单元或浏览器断言。**高价值优先**：Table 拖拽/列重排（前提是能力已实现；否则不要做空 demo）、Form.List 动态交互和多表单、List 拖拽、Badge 富内容、DatePicker 不同输入/格式、Splitter 状态重置、Collapse 自定义 icon。OSS/外部裁剪服务、上游 `debug-*` 不强制迁移；本地 mock 可展示真实行为时优先本地 mock。

### H04 · P3 · 无效动态导入与 order 元数据已修，主包继续开放｜文档构建 warning 需要分级，而非放行也非清零数字

2026-10-24 已定位并修复 search.ts 的静态/动态混用（TopBar 原先的动态导入并不拆包），保留索引按需、并发/重试；生产浏览器验证首次零请求、打开一次、重开复用、焦点返回、英文/暗色与 SSR 水合，零页面错误。DemoRenderer 的 mounted 全量加载也已改为视口附近单次激活，保留滚动状态并清理卸载资源；Table 初始模块请求 55→12，gzip 字节 687345→657437。157 条文档测试、真实滚动和 inline/iframe 截图准备通过。大 app chunk（约 2.2MB 原始 / 510kB gzip）的优化仍开放，首批交付记录见 [H04 报告](audit/2026-10-24-docs-warnings.md)。后续已补齐 21 个组件的 303 个 Demo order，72 组件 / 994 Demo 顺序哈希完全一致，同生成条件下除 order 外全部页面数据及搜索索引相等，元数据提示为 0；见 [order 整改](audit/2026-10-24-demo-order-remediation.md)。未提高阈值或屏蔽日志。另记录跨初始化状态的代码高亮 token 标签差异线索，本批未改高亮器，未宣称高亮确定性已经解决。

原 [文档站报告](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-23-docs-catalog-visual.md) 记录已有大 chunk、静态/动态 import 混用及 Demo frontmatter 提示。**不是本轮证明的构建失败**。建议：采集完整 warning、定位来源和首次出现提交；分为实际影响 chunk 的优化项、仅开发时诊断项、内容元数据缺失；对真实影响首屏的警告按包分析、路由懒加载和图标动态导入优化，**不得**一律调高 chunkSizeWarningLimit 或删日志。测 gzip 产物、首屏请求链、路由按需加载、SSG 84 routes、暗色/语言 hydration。

### 13 个基础包：逐一关口

Registry `registry/foundation.json` 当前全部标记 `completed`，各 6 维度均 `done`；这是历史完成**状态**，不是本轮逐行复检的结论。以下为最终抽检的**明确验收动作**（未发现源码缺陷的项目不要凭空造 Issue）。

| 包 | 本轮处理 | 发布前专项检查 |
|---|---|---|
| `utils` | F10 | `pickAttrs` 事件/原生 attrs；`mergeProps` 不双调，事件大小写 |
| `theme` | D04 | 单 CSS 路径、暗/紧凑主题、SSR CSS 变量与范围覆盖 |
| `icons` | 已实现目录 | 848 个图标清单和动态加载、tree-shaking、无运行时 SVG 数据包依赖 |
| `motion` | 保持已验收行为 | 真实 `transitionend` / deadline、首帧、卸载取消、SSR、reduced-motion |
| `portal` | 验收门禁 | Teleport 容器销毁、嵌套弹层、SSR、跨窗口容器 |
| `position` | 验收门禁 | 翻转、RTL、滚动、浏览器缩放/边界、与 Trigger 接线 |
| `a11y` | F01/F09 关联 | 语义角色、焦点陷阱、键盘、读屏、可访问名 |
| `virtual-list` | 验收门禁 | 变高行、动态过滤、滚动定位、键盘导航、卸载监听 |
| `overlay` | 验收门禁 | stacking/zIndex、外部点击、冒泡、嵌套 overlay |
| `locale` | 验收门禁 | 语言覆盖、动态语言、locale chunk/导出正确性 |
| `form-core` | F03 关联 | prefix 动态变化、校验状态、异步竞态、reset/unmount |
| `picker` | F01 关联 | 真实 input 绑定、范围焦点、键盘、时间时区边界 |
| `test-utils` | H03/H04 关联 | 门禁不能空跑；保证失败时非零退出、对拍基线/实际构建版本相同 |

**内核 `ui/_internal`**：单独对 Trigger / NodeRenderer / semantic merge / Overflow / useAllowClear 做共享层回归。特别核对类型隔离、原生 `$attrs` 合并、不重复 `class` 和事件，以及子组件卸载时取消 RAF/监听；之前已修项只保留哨兵用例。

---

## 3. 72 个组件逐项清点：剩余行动与 Demo 基线

以下 **72 项均来自 master 的 `registry/components.json`（完成状态）**，Demo 统计使用 **2026-10-21 的最后一份全量矩阵**。`本地/上游` 只表示文件数，**不是运行质量结论**；`—` 表示当前没有新确认的源码缺陷，不表示在本轮逐页实测零缺陷。所有组件在发布前均需通过统一的“API/slots/emits/expose/attrs、动态更新、disabled、RTL/a11y、SSR、类型、真实 Demo”冒烟。

| 组件 | Demo 本地/上游 | 最终关注点 / 行动 |
|---|---:|---|
| Empty | 6/6 | —；检查 `description` 插槽已有实现不回归 |
| ConfigProvider | 8/10 | Phase2 props / 全局 class/style / 动态上下文；缺 `holderRender` 类场景时先核功能 |
| Button | 20/22 | —；不要重报已裁决并修复的 children wrapper |
| Space | 15/15 | —；紧凑模式与响应式 |
| Flex | 6/6 | —；gap/RTL |
| Grid | 13/13 | —；断点/SSR |
| Divider | 9/9 | —；语义 attrs |
| Typography | 14/14 | F11：富内容 slot 与复制/省略交互专项 |
| Layout | 11/12 | 固定布局；`custom-trigger-debug` 非强制 |
| Tag | 12/12 | —；close emit 与动画 |
| Badge | 12/17 | **F05**；富内容、数字滚动、status、Demo |
| Alert | 14/15 | **F07**；title / description slot 顺序 |
| Skeleton | 8/8 | —；loading 变换与 Token |
| Spin | 9/10 | —；`tip` 场景按现有能力补演示或说明 |
| Result | 10/10 | —；extra slot |
| Watermark | 5/6 | —；portal/观察器/调试例不强求 |
| BorderBeam | 8/10 | —；非均匀圆角/Token 变体 |
| Statistic | 7/7 | —；精度/locale |
| Affix | 5/4 | —；监听销毁/视口 |
| BackTop | 1/1 | —；嵌入预览 viewport 已实现 |
| Checkbox | 8/11 | —；Group / v-model / disabled 表单事件 |
| Radio | 14/16 | —；Group / 键盘交互 |
| Switch | 7/7 | **F09、D02** 已专项修复；原生 click 与语义 change 分离，15 张 Apollo 已批准图仍缺失 |
| Input | 24/27 | —；Search/OTP 已实现，不重复报缺 |
| InputNumber | 20/22 | **F04、F09**；前后缀 Vue slot、更新事件 |
| Listy | 8/8 | 虚拟无限/拖拽类功能按支持范围决定 |
| QRCode | 4/不适用 | —；独立命名差异，不纳入上游数量对拍 |
| Upload | 23/24 | 浏览器文件操作、拖拽排序、文件本地 mock |
| Splitter | 10/14 | 受控/重置/嵌套 Tabs 与 resize 手势 Demo |
| Carousel | 9/7 | —；自动切换计时器、键盘/触控 |
| Collapse | 9/13 | **F07**；header slot 优先、动态图标/混合模式 |
| Descriptions | 13/13 | **F08**；render 期间写 ref；复杂 slot 子项 |
| Tooltip | 15/15 | —；Trigger 共用回归 |
| Popover | 12/12 | —；位置与嵌套交互 |
| Menu | 14/18 | 已整改 Trigger；`custom-popup-render` 能力按真实 API 核实 |
| Dropdown | 19/21 | —；菜单容器滚动和键盘 |
| Modal | 23/23 | —；focus/关闭/SSR motion 门禁 |
| Drawer | 18/18 | F11：四个现有内容槽已验证动态/空内容、ARIA 和正文身份；9 张 Apollo 基线仍缺失 |
| Message | 11/11 | **用户已验收动画**；保持回归即可 |
| Notification | 14/14 | **用户已验收动画**；保持回归即可 |
| App | 2/2 | —；上下文 API、静态方法隔离 |
| Image | 15/17 | F11；toolbarRender / mask 模板适配专项 |
| Select | 35/35 | **F02**；动态 slot、options、虚拟列表 |
| AutoComplete | 14/17 | F02 消费者；条件 default slot / 自定义 clear |
| Cascader | 23/23 | F02 消费者；异步加载/slot |
| Tree | 19/19 | —；虚拟/拖拽/键盘 |
| TreeSelect | 19/15 | F02 消费者；`checkable` / renderPanel 类型与 Demo |
| Popconfirm | 10/11 | —；异步确认/键盘 |
| Tour | 9/9 | —；定位/焦点/清理 |
| FloatButton | 14/16 | 自定义浮层/拖动能力先定支持范围 |
| Form | 35/44 | **F03 前缀/占位已验证**；动态 Form.List、验证竞态与 Demo 能力继续审查 |
| Slider | 15/15 | —；键盘/范围 |
| Rate | 9/9 | F10 消费 `pickAttrs`；class 和键盘 |
| Segmented | 16/16 | —；受控 / 响应式选项 |
| Steps | 20/20 | 部分 scoped slots 已实现，不重报全无；F11 数据/模板边界 |
| Progress | 17/17 | —；aria 值/动画 |
| Pagination | 15/16 | F11/F10：原生item/total/size槽及List/Table转发已专项修复；Apollo基线仍待验收 |
| Breadcrumb | 10/10 | F11：itemRender 单对象槽和默认子组件更新/key已修复；24张Apollo基线缺失 |
| Tabs | 20/20 | F11：popupRender 单对象槽、动态 extra / Dropdown 链已整改，Apollo 基线仍待验收 |
| Card | 12/14 | 已有 header/extra slots；旧调试项非必补 |
| Timeline | 14/14 | F11；富内容模板项 |
| Masonry | 6/6 | F10原生attrs/图片事件测量本批修复；F11泛型item槽与SSR首帧继续处理 |
| Anchor | 12/12 | —；滚动观察器/动态路由 |
| List | 12/16 | F11；泛型 item 与 header/footer/loadMore 本批接通，Item/Meta 内容插槽随后补齐，根 extra 和拖拽示例继续审查 |
| Table | 43/53 | **H01 已清账**；拖拽/虚拟/编辑 Demo 能力 |
| Transfer | 14/13 | **F06**；函数 render → Vue slot，左右列表稳定性 |
| Mentions | 16/16 | F11；dropdown item scoped slot |
| ColorPicker | 16/16 | F10 消费 `pickAttrs`；颜色与 alpha/键盘 |
| DatePicker | 28/32 | **F01**；实际 input 属性与可访问性 |
| TimePicker | 16/17 | **F01** 消费者；`render-panel` 场景按 API 决定 |
| Calendar | 9/10 | —；农历 `lunar` 依赖明确注明，不强求 |
| Avatar | 9/10 | —；图像加载、group 溢出 |

**对账要求**：本表不能独自证明“逐个组件最终验收通过”。逐项复审必须产生可机读 `docs/audit/evidence/final-component-gates.json`，每个组件至少记录 `api,vueNative,slots,emits,attrs,reactivity,a11y,ssr,demo,unit,l4,l6,status,reason`；无证据的状态必须是 `not-run` 而非 `pass`。不得把 `completed` 当作新一轮门禁结果。

---

## 4. 用户裁决与待裁决事项

| 决策 | 选项 | 推荐及理由 |
|---|---|---|
| **D01：已公开 prop/slot 优先级的变更边界** | 逐组件核实旧契约、当前使用和行为影响 | F07 在当前未发布开发版直接统一内容 slot 优先，独立记录迁移与回归；不据此宣布所有未审查组件均已迁移 |
| **D02：Switch @click 事件载荷** | **已裁决并实施：直接使用原生 DOM 事件** | 用户 2026-10-24 要求不得为 React 回调/DOM 形态牺牲 Vue 公共用法，见 ADR 0007；状态由 change/update 表达，修饰符、单次发送与键盘激活已专项验证；无旧载荷兼容，见 D02 报告 |
| **D03：内容渲染函数 prop 的处理** | **已裁决：直接改为 Vue 插槽** | 用户 2026-10-23 明确要求当前开发阶段直接修改，不保留旧函数兼容层或弃用期；2026-10-24 再扩展到妨碍 Vue 用法的 React 回调/DOM 形态，见 ADR 0006 / 0007。业务/算法函数按职责保留，数据项渲染逐项评估 |
| **D04：动态 `prefixCls` 与零运行时 CSS** | A 不支持动态前缀；B 允许 DOM 前缀变更但 CSS 需预生成/预加载；C 恢复运行时样式注入 | **B**：遵循已裁决零运行时原则；不得因为 F03 重新引入运行时 CSS-in-JS |
| **D05：补齐上游 Demo 的口径** | A 逐个文件 100%；B 核心能力全覆盖、debug/外部依赖例外；C 停止补 Demo | **B**：把“支持 API 能否用 Vue 示例真实操作”作为验收判据，不做文件数量游戏 |

裁决完成后：写 ADR；更新 `COMPATIBILITY.md` / Registry 决策源；同步类型和文档；需破坏 API 时明确版本/迁移说明。不得直接在 Registry 生成文件中手改决策状态。

---

## 5. 执行顺序、测试命令与删除旧文件条件

### 建议分批（减少相互污染）

1. **第一批 · 真实故障（P1）**：F01 → F02，各自先复现、单组件 PR、测试和构建门禁，再合并。
2. **第二批 · 小型响应式/Vue 增量（P2）**：F03 → F04 → F05 → F07；F08 先写防自激门禁再调整。
3. **第三批 · 公共 API 整理**：F06、F09/F10/F11；D03 已裁决直接迁移，D01/D02 按具体影响处理，再按组件分批，**不要全仓同一 PR 换掉所有回调与渲染器**。
4. **第四批 · 交付清账**：H01/H02 → H03/H04 → 72/13 证据矩阵 → 全量门禁 → 删除旧文件。

### 必须复验的门禁（**下面是要执行的命令，不是本轮运行结果**）

```bash
# 源码修复之后，先构建 UI——L6 读取的是 dist
pnpm run build:ui

# 组件测试 + DOM/a11y/theme（具体项目名以 repo 的 vitest 配置为准）
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme

# TS / 类型测试 / Registry / 构建产物
pnpm run lint:types
pnpm run test:types
pnpm run registry:check
pnpm run test:build

# Docs 真浏览器/构建（项目报告中的可复现入口）
pnpm --filter @apollo-design/docs run build
node packages/docs/tests/smoke-browser.mjs
node packages/docs/tests/catalog-browser.mjs

# 视觉——对本次涉及的组件先单组件，最终全量
node tests/visual/run.mjs --mode compare --component date-picker
node tests/visual/run.mjs --mode compare --component select
node tests/visual/run.mjs --mode compare
```

如果视觉环境与 canonical 基线平台不一致（原报告提及 macOS / Windows 滚动条宽度差），不得“重生基线让它变绿”；应在指定平台跑真门禁，保留差异证据。`--component` 参数实际支持需由本地脚本验证。

### 完成定义（Definition of Done）

- 每个 FIX 有“红灯复现 → 修复 → 绿灯”的证据，附源码链接、commit、至少一个 Vue template 消费示例。
- 每个 VERIFY 有结果（确认 bug / 证伪关闭 / 仍待核实），**不可以无证据直接划 completed**。
- 每个 DECIDE 有用户明确裁决、可读 ADR 和更新后的 Registry；旧已裁决问题不重新抛给用户。
- Demo 差异按 API 场景闭环，外部依赖 / debug-only 有不补理由。72 个组件/13 包的检验表逐行都有“实测/不适用/未测+原因”，不使用笼统的“全部通过”。
- `VNA-RECHECK-04` 陈旧 open 状态已校正；文档构建与 Registry 检查不再靠旧台账文字作为硬编码输入。
- **满足以上条件后**，可以删除原来的 `docs/KNOWN-ISSUES.md`，或者将此文件作为新 `docs/audit/FINAL-GAP-AUDIT.md` 永久归档，再保留最短的链接索引。

---

## 6. 证据来源与不应重复开的事项

- [旧 KNOWN-ISSUES.md](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/KNOWN-ISSUES.md)：§1.2–§1.5 的历史复现、§2 已证伪、§3 已修留痕。
- [Vue native Registry](https://github.com/apollocmh/apollo-design-ui/blob/master/registry/vue-native-audit.json)：72 个组件/共享层的历史审计，最后 open Table 条目已过期。
- [Foundation Registry](https://github.com/apollocmh/apollo-design-ui/blob/master/registry/foundation.json)：13/13 completed、6 维 done；不是本轮新运行证据。
- [组件 Registry](https://github.com/apollocmh/apollo-design-ui/blob/master/registry/components.json)：72/72 completed。
- [Demo 覆盖数据（2026-10-21）](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/evidence/demo-coverage-stage2.json)：985/1060、92.9%、83.8%。
- [2026-10-22 Menu/Notification 动画整改](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-22-menu-notification-motion-remediation.md)、[Motion 逐帧复审](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-22-motion-review-002.md)：已有浏览器验证与 CI 门禁；用户已验收效果。
- [2026-10-23 Docs/Icon 页面证据](https://github.com/apollocmh/apollo-design-ui/blob/master/docs/audit/2026-10-23-docs-catalog-visual.md)：72 组件总览、848 个 Icon、989 Demo、84 路由及浏览器检查。

**核心原则**：最后一次审计不是重新模仿 Ant Design，而是确保 `@apollo-design/ui` 作为自己的 Vue 3.5+ 组件库，能用 `<template #slot>`、`v-model`、`@event`、原生 `class/style`、真实响应式、SSR 与可访问语义自然使用。顶层内容渲染函数按已裁决 D03 直接迁移，不留兼容层或弃用期；业务/算法函数按职责保留。已公开行为的调整单独留迁移记录，未裁决边界继续明确跟踪。
