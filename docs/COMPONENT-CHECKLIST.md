# COMPONENT-CHECKLIST.md — 组件开工/收口快速清单

> 目的：**提速**。2026-09-21 的数据：一个组件平均一天，其中大量时间耗在
> 「重新踩一个已经踩过的坑」和「手搓样板文件」上。本清单把已付过学费的坑
> 压缩成开工前 3 分钟可过完的形式；完整条目见 `.workbuddy-ai/memory/PITFALLS.md`。
>
> 配套工具（本次新增）：
> - `pnpm gen:component <name>` —— 一键生成 17 个交付物骨架（含逐 Gate 的 PLAN.md）
> - `pnpm verify:component <name>` —— 单组件 scoped 取证（开发期；收口仍以 verify:full 为准）

---

## 一、开工前（G0–G1）

- [ ] 任务来自 `node registry/tools/next-task.mjs`，**不自选**组件
- [ ] 依赖 DAG 全部 completed（`ask.mjs progress` 核对）
- [ ] 凡是要断言「某决策/约定/优先级是这样」→ **先跑 `ask`**，不凭记忆
      （2026-09-21 一天三次凭记忆翻车，三次都写进了仓库文档）
- [ ] 读 PLAN.md 的「开工避坑清单」（脚手架已生成）
- [ ] antd 产物在位：`/tmp/antd-src/package/es/<name>/`；缺则 `pnpm antd:extract`

## 二、实现中（G2–G4）—— 每条都真实翻过车

| # | 坑 | 后果 | 对策 |
|---|---|---|---|
| 1 | **内联 style 的数字必须转 px 字符串** —— Vue `patchStyle` 不做数字→px 转换（React 的 `dangerousStyleValue` 才有） | 值被 jsdom/浏览器**静默丢弃**，L6 全红且极难定位（affix L6 耗时一天的主因） | 样式输出统一走 `px()` / Token 的 `var()`，绝不裸数字 |
| 2 | **cssinjs 嵌套语义**：`&` 是复合选择器、普通键是后代 | 样式作用到所有形态（divider 的 dashed 教训） | 选择器结构从 antd `extractStyle` 真实产物提取，不推演 |
| 3 | **Boolean prop 未传 ≠ false** | 布尔语义静默失效（divider 的 `vertical`） | `withDefaults` 中显式给 `undefined`，判据用 `typeof x === 'boolean'` |
| 4 | **`var(--apollo-*)` 必须在 theme tokens.css 有声明** | 写错不报错、静默失效 | 靠 `test:build` 的 B7 兜底；变量名用 `token2CSSVar()` 生成，不手写 |
| 5 | 字面量 Component Token 与别名派生 Token 的双轨 | 用户主题覆盖失效 | 范本照抄 `divider/style/token.ts` 的注释块 |
| 6 | 漏声明依赖 → `unbuild` 报 `Potential implicit dependencies` | L7 红 | 新 import 即同步 package.json |

## 三、测试中（G5–G8）

- [ ] **vitest 必须从仓库根跑**（`node_modules/.bin/vitest run --project <p>`）；
      在 `packages/<x>/` 下跑不应用根 config，会大面积假失败
- [ ] `*.test-d.ts` 会被 vitest **真执行**：L3 负例必须包在永不调用的闭包里
- [ ] `--coverage` 在沙箱要先 `CODEBUDDY_SAFE_DELETE_ENABLED=0`，否则 9 秒静默失败假成功
- [ ] L5 a11y：axe 扫**全部** demo + 显式 role/键盘断言；
      「架构上不适用」必须写进 layerNotes——**警惕降级运行给的假绿灯**（2026-09-21 实锤过）
- [ ] 单组件快速取证用 `pnpm verify:component <name>`，别为每层跑全仓

## 四、视觉（G9）—— 最贵的环节，先看清单再动手

- [ ] **先建基线，再 compare**；基线建立失败时 compare 的红灯不可信（affix 曾被 3/15 假 compare 误导）
- [ ] demo **显式指定字体** —— 继承字体差异是平台差异，会让 L6 全红（affix 教训）
- [ ] 差异率异常时，排查顺序：实现（尤其坑 #1）→ Token → 平台差异 → 工具；
      不要在实现侧做「碰运气」的实验性修改（affix 曾回退「改量占位层」实验：0.013% → 3.68%）
- [ ] React 参考页的继承字体来自 antd cssinjs 注入的 token 栈——不要在 Vue 侧复刻

## 五、收口（G12–G14）

- [ ] 11 个维度逐个置 done + `layerNotes`（n/a 也要写依据）；**registry 是唯一被承认的进度**
- [ ] 收口跑全仓：`pnpm verify:full`；跑重型门禁前**关 IDE**（实测 16 分钟 → 7'49"）
- [ ] 开发期 typecheck 用 `pnpm typecheck:build`（改 ui：7'49" → 5'10"；无改动 20s）
- [ ] `pnpm build` 会挂起的话，用 `node_modules/.bin/unbuild` 逐包构建（PITFALLS #7）
- [ ] commit message 带 `[COMP:<name>]`，一次提交只做一件事
- [ ] 收口后跑 `node registry/tools/next-task.mjs` 看解锁了谁，**立即生成下一个骨架**：
      `pnpm gen:component <next>`

## 六、经典错误沉淀（持续追加 —— 每 Gate 收口时回顾；最近在顶部）

### 2026-10-06（根别名迁移收口：`className`/`rootClassName`/`style` → 原生 `class`/`style`，72/72）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 132 | **`{ class: X, ...attrs }` 里末尾的 `...attrs` 会整段覆盖 `class`**（对象展开后者胜）——迁移前 `className` 是 prop、attrs 里没有 `class`，所以顺序无所谓；一旦 `class` 走 attrs 就变成正确性问题。同族三种形态：`{...attrs, class:X}` ⇒ 残留的 `class` 键与 `className` 并存**双份**；`{className:X, ...restAttrs}` ⇒ 调用方 class 进两次 | **L4（dom-contract）**：Card 的 `tabs*` 用例（Vue 只剩 `apollo-head-tabs`，`apollo-tabs*` 全丢）；mentions 是 `extra extra rootx rootx` | 展开前把 `class`/`style` **摘掉**再 spread；判据：扫 `^\s*(class\|style):` 后 14 行内有无 `^\s*\.\.\.(attrs\|restAttrs)`。⚠️ 影响 `Tabs` / `Cascader` / `Mentions` / `Drawer` 四处 |
| 133 | **「内部消费者」扫描只扫 `h(<Tag>, { className })` 会漏一大半** —— ① 模板写法 `:class-name=` / `:root-class-name=`（Card / ColorPicker ×4）；② 返回对象的 helper（`CalendarHeader.selectBase()`）；③ **同目录内部件**（`ConfirmDialog`→`Modal`、`Group`→`Checkbox`、`DirectoryTree`→`Tree`、`FormItemInput`→`ErrorList`、`transfer/{ListItem,Section}`→`Checkbox`） | **全量 L4 回归**（一次 36 处失败；逐组件跑完全看不到） | 迁移后**必须跑全量** `unit + dom-contract`；扫描要同时覆盖 `h()+className:` 与 `:class-name=`/`:root-class-name=`，并把**被迁组件自己**也放进列表 |
| 134 | **`inheritAttrs: false` + 从不读 `attrs` = 调用方传的 `class`/`style` 静默丢弃**——`date-picker/{DatePicker,RangePicker}.vue` 两个文件都既无 `useAttrs()` 也无 `$attrs`；`checkbox/Checkbox.ts` 是变体：解构进 `attrClass`/`attrStyle` 后**从未使用**。同族「声明了 prop 却从不消费」：`checkbox` 的 `style`（走老 `mergeStyles`）、`Form.vue` 的 `rootClassName` | L4（date-picker 的 class/style 用例）+ 读源码 | 迁移前先 `grep -n "useAttrs\|\\\$attrs"`，没有就**补上**；「有 prop」≠「接上了」 |
| 135 | **挑活的判据是「扫代码」不是「看 `auditStatus`」**——只筛 `todo` 会把 `analyzing` 档里的活当成已完成（本次漏 6 个组件：checkbox / collapse / drawer / cascader / color-picker / date-picker，并**两次**对外宣称「迁移完成」） | **收口全量扫描**（不是测试抓到的，是主动扫出来的） | 收口前全目录扫 `props.className\|props.rootClassName\|props.style`；状态是人的记账，**代码才是事实** |
| 136 | **L6 全量跑有「抖动」用例 ⇒ 报红先孤立重跑，别急着改代码**——全量 1125 张报 6 处失败（menu/vertical ×3、upload/basic ×3，0.10–0.37%）；`--component X --no-build --mode compare` 孤立重跑**全部 0.000% exact**，再跑全量 **1125/1125 全过** | **L6** + 孤立重跑对照 | 根因是运行期**测出来**的几何被截到动画中间态。判据：**L6 红但 L4 绿 ⇒ 大概率不是类名字符串问题**；`run.mjs --component … --no-build` 只要 ~19 s。⚠️ **别把测量噪声登记成平台差异** |
| 137 | **`attrs.class` 是 Vue 的 `ClassValue`（可能是数组）、`attrs.style` 是 `StyleValue`** —— `computed<string[]>(() => [attrs.class, …])` 过不了 `vue-tsc`；传给引擎的 `className` 槽位也不是 `string \| undefined` | **L3（`test:types`）** | 数组用 `Array.isArray(x) ? x.join(' ') : (x ?? '')` 归一；标量槽位 `as string \| undefined` / `as CSSProperties \| undefined` |

### 2026-10-04（CI 落地会话：`X:ci-pipeline` / `X:visual-infra`）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 128 | **`lint:types`（vue-tsc）绿 ≠ 类型没问题**——`slider/Slider.vue` 调 `useMergeSemantic` 时**没传三个泛型**，TS 从 6 个混合形态的 source 反推 `CN`/`ST`、退化成带索引签名约束的默认类型 ⇒ `SliderSemanticStyles`（具体接口，无索引签名）不可赋值。`vue-tsc --noEmit -p tsconfig.json` **完全看不到**（exit 0），只有 vitest 的 typecheck project 以 `Unhandled Source Error` 报出来 ⇒ `pnpm run test:types` 恒 `exit=1` | **L3（`test:types`），不是 `lint:types`** | 调 `useMergeSemantic` **一律显式传 `<Props, ClassNames, Styles>`**（先例 `empty/Empty.vue`）；⚠️ `verify:full` **不含** `test:types` ⇒ 它必须进 CI，否则这类错误永远没人抓 |
| 129 | **多 project 挤进一个 vitest 进程会让测试「假慢到超时」**——四个运行时 project 合并成一个进程（尤其带 `--coverage`）后 worker 互相争抢：`theme` 的 888 个用例从 **84s 劣化到 9min**、24 条撞 5s 默认超时（对照：单跑 `test:theme` = 888 passed / 84s，单跑 `test:a11y` = 1147 passed / 189s）。同坑 `foundation-status.mjs --verify` 在 2026-09-16 已记录（并发还会让覆盖率**静默失真**：只采集到 43 个文件） | CI（本地「单跑 vs 合跑」对照） | 多 project 合跑**必须** `--maxWorkers=1 --no-file-parallelism`（`test:coverage` 已固化）；排查「测试莫名超时」先做单跑对照 |
| 130 | **E11（产物无 React 痕迹）在干净 checkout 上是静默跳过的**——`validate-registry.mjs` 扫不到 dist/es 时把它降级为一条 warn ⇒ `registry:check` 照样绿，而 H1/H5/H6 那条硬禁令**根本没执行** | 读源码（`validate-registry.mjs:533`） | CI 里「**先构建、再 validate**」（`build` job 的第二步就是为它存在）；排查同类问题时先问「这个检查项是不是因为没输入而跳过了」 |
| 131 | **「本地跑得动」≠「CI 跑得动」：整仓 `vue-tsc` 撞 runner 的 V8 默认堆上限**——首次真实运行（run `37194464203`）里 `lint` 与 `test` 的**类型层**双双 OOM：`FATAL ERROR: Ineffective mark-compacts near heap limit ... JavaScript heap out of memory`（`lint` exit **134**=SIGABRT、类型层 exit 1）。**看退出码容易误判成 lint/类型报错**，其实是内存 | GitHub Actions 真实运行（本机 16 GB 复现不出来） | 两个**类型检查**步骤加 `NODE_OPTIONS=--max-old-space-size=4096`（本机实测 vue-tsc 峰值 RSS ≈ 2.39 GB；runner 7 GB ⇒ 4 GB 堆 + ~1 GB 非堆 ≈ 5 GB 安全）。⚠️ **不要提到 job / 全局 env**：vitest 的 worker 会继承 `NODE_OPTIONS`，多 worker 各自放宽到 4 GB 反而可能触发 runner 的 OOM killer（137）。📌 **`exit 134` 先怀疑内存**，不是先怀疑代码 |

### 2026-10-04 续（缺口清账会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 126 | **临时解包目录被部分清理比「不存在」更毒**——`/tmp/antd-src/package/es/locale` 目录在但空，`existsSync` 判据仍真 ⇒ gen-locale 语言清单解析为 0 ⇒ `--check` 把 73 个语言包全判「多余产物」（unit 直接红了） | L1（gen-locale 幂等用例） | 解析候选加仓库根真实 antd 且排最前；判据从 `existsSync(locale)` 升级为「readdir 含 .js」；import 工具脚本会执行 main() —— **探测第三方脚本一律不要 import** |
| 127 | **「缺口登记」不等于「仍开放」**——badge 的 spaceChildren（v4 逻辑）与 transfer rtl 在 antd 6.6.4 / 当前代码里早已不是缺口；动手前先对拍上游源码定现状，再决定修/证伪 | 源码 grep（antd 6.6.4 badge 无 spaceChildren） | 清账第一动作 = `grep antd/es/<c>` 核对登记是否过期；关闭方式区分「已修」与「已证伪」 |

### 2026-10-04（transfer 收口会话，全量 72/72）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 123 | **`useDisabled(props.disabled)` 传值丢响应性**——props.disabled 在 setup 期解包成原始值，computed 闭包冻结首帧值 ⇒ Button 的 disabled 一旦 true 永不解锁（Actions 可用态不随勾选更新，且静默） | L2（moveToRight 0 次调用）+ render 期 console 探针 | useDisabled 入参改 `MaybeRefOrGetter`（toValue）；传 props 的调用点一律 getter `() => props.disabled`（Button/TreeSelect/Form/Cascader 已修） |
| 124 | **jsdom30 的 IDL getter 拒绝派生事件对象**——`Object.create(event, {...})` 克隆上读 `e.type` 抛 `TypeError: 'get type' is not a valid instance of Event`，消费方（Transfer.Search 的 `e.type==='click'`）整条 onChange 链静默炸断 | L2（onSearch 0 次调用）+ 逐层埋点二分 | cloneEvent 时从**真事件**读 type 落成自有属性；凡克隆 Web API 对象后要读 IDL 属性的都同判 |
| 125 | **复合组件给内嵌 Checkbox/Input 传类名必须走 `className` prop**——传 `class` 会经 attrs 落到内层 input / 被 Checkbox 的 attrClass 拦截，根元素类名链静默断裂；Dropdown 恰好相反（`classNames.root` 落浮层，触发器是 `${prefixCls}-trigger`） | L4 dom-contract（类名逐字对拍全红）+ L5（axe label 违规） | 组合他人组件前先读其 attrs 分配策略；基线里跨组件前缀用 ConfigProvider 统一对齐（tree-select 同判） |

### 2026-10-03（table T2-T5 会话，功能分期）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 118 | **React style 数字自动加 px，Vue 不加**——`{ width: 1200 }` 在 Vue 渲染成 `width:1200`（无单位），jsdom 的 cssstyle 与真实浏览器都判无效**静默丢弃** ⇒ 表格总宽/colgroup 列宽/固定列 inset 全部失效（最毒：DOM 里键直接消失，看不出曾经传过） | L6（size-mismatch 成块差异）+ L2 最小复现 | 引擎里所有数字尺寸显式 `${n}px`（scrollTableStyle/ColGroup/Cell inset）；新样式码评审时 grep `style.*width:` 检查数字直传 |
| 119 | **antd 的累计对象在 render 期回填最新 states**（InternalTable.js:297-298 `changeEventInfo.filterStates = filterStates`），setup 一次性的 Vue 版必须用 getter 实时取，否则 onChange 的 currentDataSource 永远未过滤/未排序 | L2（filter 全流程断言） | 「React 每 render 重算」的代码搬到 Vue computed/setup 时，凡跨次 render 可变的都要 getter/ComputedRef |
| 120 | **未声明的 prop 落 attrs 静默变 undefined**（engine Table 漏声明 `scroll`）——渲染不报错，全链 Boolean(props.scroll?.x)=false | L2 探针（setup 顶部打印 props） | 引擎 props 与 antd 层传参清单 diff（建议进 registry 检查：h(Engine) 的 props ⊆ 引擎声明） |
| 121 | **antd 静态挂载引用未导入的哨兵**（Object.assign 里 SELECTION_ALL 是 undefined）——TS 对 `Object.assign(组件, {X})` 的 X 不做存在性检查（若值是 import 缺失会报错，但本例是 import 清单漏改） | L2（selections 菜单用例：菜单项渲染但 onSelect undefined） | 静态挂载块与 import 块相邻放置、一起 review；type 测试断言 `Table.SELECTION_ALL === SELECTION_ALL` |
| 122 | **selections 下拉默认 hover 触发**（antd useSelection 未传 trigger ⇒ rc 默认 ['hover']）+ 150ms mouseEnterDelay ⇒ click 触发永远无效 | L2 | 交互测试前先 grep antd 源码确认 trigger 实参；hover 类用 vi.waitFor 轮询而非 nextTick |


### 2026-10-03（table T1 会话，XL 组件骨架期）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 112 | **provide 的 getter 已解包 `.value`，消费处不能再 `.value`**——engine context 用 `get expandableType() { return expandableType.value; }` 注入，BodyRow 里写 `ctx.expandableType.value` 得 `undefined` ⇒ 展开行静默消失（图标状态正常、行不渲染，L2 靠「展开行文本」断言抓到） | L2（展开行渲染断言） | context 的消费纪律二选一并全文件统一：getter 解包（字面量类型）或裸 ComputedRef（消费处 `.value`）；类型层 `ComputedRef` vs 字面量的 TS2367 对比警告是信号，不要用 `as never` 压掉 |
| 113 | **CSS 变量机械替换必须先处理 `var(--ant-x)` 再处理裸 `--ant-x`**——顺序反了产出 `var(var(--apollo-x))`（无效 CSS），line-height/color/background 整条声明静默失效 ⇒ 行高差 8px 级的像素偏差，难排查 | L6（行高系统性偏差） | 样式生成器脚本先 `var(--ant-x)` → `v('x')`、再裸 decl；生成后 `grep -c 'var(var(' 必须为 0` 作为脚本自检 |
| 114 | **test-utils 的 teleport stub 副本不挂事件监听器**——Portal 内 DOM 的 `dispatchEvent/click()` 全部无效（`_vei` 为空、事件冒泡正常但不触发 Vue 处理器），L2 假绿/假红都可能出现 | L2（过滤下拉交互用例） | Portal 内交互的 mount 必须 `global: { stubs: { teleport: false } }`（真实 Teleport 到 document.body 再查） |
| 115 | **React 布尔守卫迁移到 Vue 受控组件时不能顺手加内部 setOpen**——antd `onMenuClick` 只调 `props.onOpenChange(false, {source:'menu'})`，本仓多写的 `setOpen(false)` 绕过了消费者的 source 过滤 ⇒ 过滤多选菜单一点就消失 | L2（多选过滤流程） | 受控组件的事件回调**只发通知**，内部 state 变更由消费方决定；diff antd 时看到「内部 setState 缺失」先确认不是受控语义 |
| 116 | **Menu 的 override 合并方向是 props 优先**（antd menu.js:85 `selectable ?? overrideObj.selectable`）——反转会导致 Dropdown 内的过滤菜单永远不可选；props 需允许 undefined（Boolean prop 的 `default: true` 会吞掉显式 false/undefined 区分） | L2（Menu 隔离用例） | 合并语义逐字对 antd 源码行号；Boolean prop 想表达「三态」必须 `default: undefined` |
| 117 | **列定义可能被深层 reactive 代理，哨兵引用相等必须 toRaw**——`SELECTION_COLUMN`/`EXPAND_COLUMN` 是模块单例，经 ctx/props 链后变代理副本 ⇒ `includes/indexOf` 全 miss（选择列重复插入/用户哨兵不被替换） | L2（哨兵列位置用例） | 哨兵比较统一 `toRaw(col) === SENTINEL`；这是 React→Vue 迁移的通用坑（React 无深层代理） |


### 2026-09-29（tour 会话，G4–G14）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 106 | **rc 解构默认值必须逐个对源码核实，不能凭 G1 分析文档的默认值列**——tour 三个解构默认（`mask=true`/`arrow=true`/`open ?? true`）漏了两个：mask 缺失 ⇒ 蒙层 SVG 不渲染；arrow 缺失 ⇒ 面板无箭头（L1 冒烟抓到 mask、L6 像素 diff 抓到 arrow） | L1 冒烟 + L6 视觉 | G4 实现前把 rc 组件函数的**解构参数行**原文抄进分析文档（§9 的 V 清单从此固定为开工前步骤）；「默认值」列必须注明出处（解构默认 vs 文档默认） |
| 107 | **CSSMotion 的「支持动画」是两条判据**：rc-motion `isSupportTransition = !!(motionName && transitionSupport)`——只看环境探测，motionName 缺失（Trigger 不传 motion 的组件如 tour）时离场等一个永不来的 animationend ⇒ `autoDestroy` 卸载被无限推迟、浮层 DOM 残留 | L1（basic 用例：Finish 后 popup 应卸载） | motion 包 `use-motion-status` 的 effectiveSupport = envSupport && !!motionName；任何「Trigger 不传 motion」的新组件都会踩，修复在 motion 层而非组件层 |
| 108 | **PurePanel 的壳结构必须与 antd 产物对拍**，不能按组件自己的 PurePanel 推演——tour 复用 popover 的 RawPurePanel：`-placement-top`（默认值）+ `-pure` 出现**两次**（tour 层与 RawPurePanel 层各一次）+ 内部 `-arrow` + `{p}-container role="tooltip"` 三层包裹 | L4（DOM 契约基线） | PurePanel 落地前先跑基线脚本看 React 真实 HTML，再写 Vue 壳 |
| 109 | **cloneVNode 的 class 是合并语义**：closeIconRender 里把旧 class 塞进 extraProps 会翻倍（`custom-close custom-close`）；React cloneElement 是覆盖（antd 因此显式拼旧 className） | L4（DOM 契约） | Vue 侧 cloneVNode 只传**新增** class；React→Vue 迁移 cloneElement 时删掉「显式带旧值」的参数 |
| 110 | **React 19 SSR 会给 `<img src>` 前置 `<link rel="preload">` 伪影**——基线里多出一个根节点（`根节点数不同 2 vs 1`） | L4（DOM 契约） | 基线脚本生成时剥除 preload link（与 cssinjs hash 同判：产物伪影非契约），并注释登记 |
| 111 | **Vue 里调用 React case 的 hooks 会炸**：visual case 函数在渲染树之外执行，`useRef` 报 `Cannot read properties of null`——case 文件不是组件 | L6（渲染页 timeout） | 需要 hooks 的 React case 定义**内嵌真实组件**再返回 `<App />`；Vue 的 `ref()` 无此限制 |

### 2026-09-28（cascader 会话，S1–S5）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 101 | **provide 的 context 在 setup 期解构 = 冻结初值**：Proxy 桥/computed 的值解构后不再更新 ⇒ options 变化后 OptionList 渲染旧数据（React Context 每帧取值，Vue 无此语义） | L1（loadData 用例：loadData 收到旧 options） | context 读取一律走 `getC()` 每次渲染/事件期重新解构；绝不缓存字段引用 |
| 102 | **watch 依赖某 ref 又在回调里改它 = 递归自触发**（Maximum recursive updates）——rc 的 `useEffect([options, loadingKeys])` 里 setState 同值会 bail out，Vue 没有 | L1（loadData 用例栈溢出） | 迁移 React effect 时，依赖里与「被修改目标」相同的项必须删除（保留语义等价的最小依赖集） |
| 103 | **豁免必须恰好命中**：a11y allow 的规则在没有对应元素的 demo 上成为「未被命中的豁免」→ 红（panel demo 无 combobox input） | L5（a11y） | 带 allow 的 a11yDemoTest 拆成两组：有豁免场景 / 无豁免场景分别扫 |
| 104 | **BaseSelect 的点击开合从未实现**（select 测试全用受控 open，交互链路漏测）——cascader 需要 时才发现 | L1（薄壳冒烟） | 加 `openOnTriggerClick`（默认 false 保持 select 行为）+ Selector 显式 onClick prop（inheritAttrs:false 下 attrs 不落根）；下轮 select 补交互时翻默认 |
| 105 | **h() 模板串里嵌 `{p}` 占位再 .replace 的写法容易挂错元素**（replace 链只作用最后一个字符串字面量）——产物类名悄悄缺失 | L7（theme 断言） | 模板占位一律用 `` `${var}` `` 插值，不用占位符 replace |

### 2026-09-28（popconfirm 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 96 | **回调包装写成 `{ fn(e); }` 吞掉返回值**：ActionButton 靠返回值判「Promise ⇒ 等 resolve 才关」，吞掉后表现为「点 OK 立刻关闭」 | L1（Promise 用例） | 上游单行箭头 `(e) => props.onXxx?.call(this, e)` 是**隐式返回**；本仓包装回调必须同样返回，或明确注释「返回值有意义」 |
| 97 | **`useLocale` 返回普通对象不是 ref**：写 `locale.value?.okText` 恒 undefined ⇒ 按钮文案空白 | L1（按钮文案断言） | `const [locale] = useLocale('Xxx')` 直接用 `locale.okText`（empty 同判） |
| 98 | **VTU 的 teleport-stub 会把浮层渲染在原地** ⇒ 根节点数与 SSR 基线不符（`$: 根节点数不同 1 vs 2`） | L4（DOM 契约） | 浮层类组件测试一律 `global.stubs.teleport = false`（popover 期既有判据） |
| 99 | **`Popover.PurePanel` 的 `content` prop 按 C8-R2 收窄为 String**：传 VNode 触发 prop 校验告警（L7 demo/theme 红） | L7（demo/theme 告警） | 富内容走同名 **slot**（`{ content: () => vnode }`），不要去放宽已收口组件的 prop 类型 |
| 100 | **共享件第二次消费即提升**：`ActionButton` 只有 modal 在用，popconfirm 需要它 ⇒ 直接依赖会造成 `popconfirm → modal` 的组件间横向依赖 | 架构（H11） | 实现搬到 `_internal/`，原位置留 re-export 垫片（与 `useOrientation` 提升同一套做法） |

### 2026-09-28（segmented 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 91 | **闭包捕获变量而非值**：`node = h(Tooltip, …, { default: () => node })` —— slot 求值时 node 已被重新赋值为 Tooltip vnode 本身 ⇒ 无限递归挂载（Maximum call stack） | L1（mount 栈溢出） | 渲染包装元素必须用**不变的局部 const** 承载被包装的 vnode，再在闭包里引用它 |
| 92 | **resetComponent 漏 `fontSize: token.fontSize`**：根元素继承 body 的 16px（antd 显式 14px），文字逐字累积偏移 —— L6 差异 0.16~3%、重影集中在**每个词内部且越长的词偏移越大** | L6（视觉回归） | resetComponent 是完整 reset（含 fontSize）；「逐词递增偏移」的 block-diff 先查字号继承 |
| 93 | **jsdom 下 Vue 的 mousedown/mouseup listener 不被派发调用**（裸 `h('div', {onMouseDown})` 复现；click/keydown/mouseenter 正常，原生 addEventListener 能收到） | L2（焦点态断言红） | 依赖 mouse 类 listener 的行为断言降级到 L6 真浏览器；jsdom 里别浪费轮次调「为什么 handler 不执行」 |
| 94 | **visual run.mjs 会用 packages/ui/dist 的旧产物**：改了 src 的样式不重建 dist，重跑截图数字纹丝不动 —— 误判「修复无效」 | L6 | 改样式后重跑 visual 前先 `rm -rf packages/ui/dist`（或重建），再跑 run.mjs |
| 95 | **rc/antd 薄壳+内核的类会重复**：antd 薄壳加一次 `-vertical`、rc 内核再判一次 ⇒ 上游产物该类出现**两次** | L4（DOM 契约 diff） | 迁移「薄壳+内核」组件时类名逐字对基线，别把重复类当自己的 bug「顺手修掉」 |

### 2026-09-28（progress 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 86 | **macOS 文件系统大小写不敏感：`engine/circle.ts` 与 `engine/Circle.ts` 是同一个文件**——内核被组件覆盖、import 幽灵解析，错误极难读（`getCircleStyle is not a function` 实为文件互踩） | L1（收集期 TypeError） | 同目录下大小写仅差的单复数/驼峰文件名是禁区；内核文件改用独立名（`kernel.ts`） |
| 87 | **Vue 没有 React 的「数字 style 自动加 px」**：`el.style.height = 8` 静默失败 ⇒ track/rail 全透明（L6 差异 7%） | L6（视觉回归） | antd CSSProperties 数字值必须 `px()` helper 转字符串再进 style |
| 88 | **Vue 对 camelCase SVG 键不自动转 kebab**：`strokeWidth` 属性不落 ⇒ 圆环描边细线（L6 block-diff 形状一致仅粗细异） | L6 | SVG 属性统一写 kebab-case（`'stroke-width'`/`'stroke-linecap'`） |
| 89 | **h() 的 children 不能是 null**（TS 接受 VNodeChild 但运行时/类型报错）——`cond ? vnode : null` 一律 `?? undefined` | 构建（vue-tsc TS2769） | 三元 children 统一 `?? undefined` |
| 90 | **Vue 不把 `aria-*` 键识别为组件 prop**：声明了也没用，且显式 `undefined` 会覆盖 attrs 透传 ⇒ aria-label 丢失（L4 aria 用例红） | L4 | aria-* 走 attrs 透传（inheritAttrs:false + spread），不声明 prop、不显式置 undefined |

**顺手沉淀（L6 DECLS）**：全局样式的 DECLS 必须是**纯声明体**（无选择器壳）——`genXxxStyle` 里包壳；DECLS 自带壳会双层嵌套成 CSS Nesting（`.a{.a{…}}` ⇒ `.a .a`）不匹配单根。E10（rgb 字面量）在 antd 产物为字面量的位置改归因 token（`var(--apollo-color-text-description)`）。

**遗留提醒**：lint:format 的 error 级 `noNonNullAssertion` 散布在 carousel/collapse/image/listy 等历史文件（基线遗留，非本轮引入），下轮统一清理。

### 2026-09-27（auto-complete 会话，补）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 84 | **语义合并的浅层实现在嵌套对象上静默丢数据**：`mergeClassNames` 用简化版 clsx 拼接，对象值（`classNames.popup.{root,list,listItem}`）被过滤掉 ⇒ Select 的 popup 语义 classNames 全线失效（L4 前一直无人消费嵌套键） | L4（popupClassName 合并用例） | mergeClassNames 对嵌套 plain object **递归合并**（叶子仍 clsx 拼接）；凡是「对象/字符串混合」的合并函数都要先想嵌套形态 |
| 85 | **被包装组件的既有缺陷会在薄包装的 L4 基线里现形**：className 丢失、root 类双拼、config 通道回调未接线、combobox 回填类缺失——4 个都是 Select 期「测试全绿但通道未接」的同族 | L4（DOM 契约机械基线，9/14 用例红） | 薄包装组件的 L4 基线是上层组件缺陷的最高性价比探测器；发现「投影类名/子节点数」差异先怀疑通道未接，而不是急着改包装层 |

### 2026-09-27（rate 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 79 | **`getPrefixCls(name, custom)` 传「裸根前缀」丢组件后缀**：divider 的 L4 基线传 `prefixCls='apollo'` 能对齐（它的类链只有 `${prefixCls}`）；rate 的类链是 `${prefixCls}-star`，传 `'apollo'` 会让 antd 侧类名变成 `.apollo-star`，与我们的 `.apollo-rate-star` 全线错位 | L4（DOM 契约 14 条全红，diff 全是前缀类名） | 做 L4 基线前先看组件**类链形态**：类链含 `-组件名` 后缀的必须传**完整前缀**（如 `'apollo-rate'`）；在基线脚本与 consumer 双向写注释 |
| 80 | **React children 不映射 props**：`h(Rate, props, 'A')` 的 children 在 antd 侧被忽略（character 仍是默认 StarFilled），Vue 侧却读成了插槽内容 ⇒ 两侧 DOM 结构性错位 | L4（character:text 用例子节点数 1 vs 0） | antd 的内容类 prop（character/title 等）必须走 **prop/插槽对应通道**，不能借 children；基线用例用 prop 传，consumer 用插槽传 |
| 81 | **Vue 函数 ref 传入 h() 的 vue-tsc 误报**：`h('li', { ref: fn })` 报 `not assignable to type 'string'`（ref 联合 + vue-tsc 重载解析缺陷） | G13 构建（vue-tsc dts 产出失败） | 元素注册改走 `onMounted/onBeforeUnmount` 生命周期回调（等价、类型诚实）；不要 `as never` 硬压 |
| 82 | **jsdom 三连击（半星/几何判定）**：`clientWidth=0`、`MouseEventInit` 不认 `pageX`、`getBoundingClientRect` 全 0 —— rc 的 getStarValue 三要素全废 | L1（半星 hover 得 4 而非 3.5） | `Object.defineProperty(el,'clientWidth')` + `defineProperty(evt,'pageX')` + `vi.spyOn(el,'getBoundingClientRect')` 三件套；**mock 目标必须是 starRef 注册的那个元素（li）**，mock 内层 div 无效 |
| 83 | **内部组件函数 prop 的参数形状漂移**：Star 的 `characterRender(node, { index })` 第二参是对象，Rate 侧闭包却按 `index: number` 解构 ⇒ tooltips 取值恒 undefined、Tooltip 根本没挂载（findAllComponents = 0） | L1（tooltips 三条全红）+ 探针（`console.log` 入参形状） | 内部组件的回调 prop 签名在**两侧文件头都写明参数形状**；怀疑「包装函数没执行」时先探针入参形状再查渲染 |

### 2026-09-24（upload 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 78 | **`onXxx` 同时声明为 prop 与 emit ⇒ 回调被触发两次**：Vue 的 `emits` 只影响 attrs 剥离、**不影响 prop 解析**，同一个 `onDrop` 既进 `props.onDrop` 又注册成 emit 监听器 ⇒ `emit('drop') + props.onDrop()` 双触发。其余组件没暴露是因为 antd 回调 prop 走的是 **attrs**（PITFALLS 35）或只走 emit（如 `change`） | L1（`onDrop` 被调 2 次；第一版测试还把 `props.onDrop` 与 `attrs.onDrop` 传成同一个 fn 掩盖了它） | antd 的 `onXxx` prop 在 Vue 侧只保留**一条**通道：要么 emit（`change`/`drop`），要么 attrs；绝不「prop + emit 同名双写」 |
| 79 | **`.anticon` 是死选择器**：antd 的 `iconCls` 是字面量 `anticon`，运行时把 `iconStyles` **全局 replace** 成 `prefixCls`（D15）；本库零运行时、图标类名恒为 `apollo-icon` ⇒ 抄自 antd 的 `.anticon` 规则**匹配不到任何元素且不报错**，症状是列表图标色/尺寸静默回落继承值（upload 有 61 处） | L6（icon 计算色 `rgb(0,0,0)` vs antd `rgba(0,0,0,.45)`）+ computed-style 探针 | 提取 antd CSS 后一律把 `.anticon*` 改写成 `.apollo-icon*`（button/result/tag 的 `ICON_CLS` 写法）；收口时 `grep -c '\.anticon' style/index.ts` 必须为 0 |
| 80 | **cssinjs 的 common/reset 规则会被「只留涉及的属性」式提取丢掉**：每个组件第一段都有一条 `.{cls}{box-sizing;margin:0;padding:0;color:var(--*-color-text);font-size;line-height;list-style:none;font-family}`（`genCommonStyle`）。漏掉 `color`/`line-height` ⇒ 文本色从 `colorText`(88% 黑) 掉回继承纯黑、行高回落 ⇒ **整套文字逐像素不同**（basic/drag 6 张 0.36%~1.35%） | L6（basic/drag 9 张全 block-diff，散点占比 25%~51%） | 每段开头补回整条 common 规则；自检 `grep -c 'list-style:none' style/index.ts` 不为 0 |
| 81 | **`@supports` 块在提取时被整块丢弃**：antd 把 picture-card/circle 列表的 `gap:8px` 放在 `@supports (gap:1px)` 里（另一条 `@supports not (gap:1px)` 给 `> *` 加 margin）⇒ 丢掉后相邻磁贴间距 0，探针显示 `-select` 的 x 从 142 变 134 | L6（pictureCard 三张 0.13%~0.49%，diff 图里 8px 位移） | 提取后 `grep -c '@supports'` 与 antd 产物条数对拍（upload = 2）；条件块必须原样保留，不能展开成无条件规则 |
| 82 | **默认插槽没传给引擎子组件 = 触发区整体为空**：antd 把触发区内容当 `RcUpload` 的 `props.children` 传（`{...props}` 里带着 children），Vue 侧必须显式 `{ default: () => children }`。漏了 ⇒ select / picture-card 形态的按钮、`+ Upload` 全不见 | L6（basic/pictureCard 明显缺块）⚠️ **L4 抓不到**：`dom-contract.ts` 的投影只吞元素节点，baseline 的 children 全是**文本**（`'upload'`/`'x'`）⇒ 契约里看不见文本节点 | 凡「antd 通过 children/ReactNode prop 传递」的内容，Vue 侧逐个确认落在 slot 上；L1 补 element-child 用例（文本子节点进不了契约） |
| 83 | **视觉侧吃的是 `packages/ui/dist`，不是 src**：`tests/visual/build.mjs` 明确用已构建产物 ⇒ dist 陈旧时 L6 比的是旧实现（实测 `isImageUrl` 已修好但 dist 里还是旧版，症状是缩略图 `<img>` 变 FileOutlined）。jsdom 侧（L1/L4/L5/L7）走 src，两边**不一致** | L6 与 L1 结论冲突（jsdom 渲染 `<img>`、浏览器渲染图标） | 跑 L6 前先 `pnpm --filter @apollo-design/ui run build`（或直接 `run.mjs` 不带 `--noBuild`）；两侧结论冲突时先怀疑产物陈旧 |

### 2026-09-24（input 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 77 | **组件变量声明块必须覆盖每个「根形态」**：antd 用 useCSSVarCls 给裸 input / affix-wrapper / group-wrapper 都挂 -css-var 类再挂声明块；本仓只挂 .{p}-input ⇒ wrapper 为根时 token 变量不可见，`padding:var(...)` **整体失效回退 0**、font-size 回落继承 16px（不是报错，是静默回退） | L6（states 尺寸失配 + computed 探针：wrapPad [0px,0px]） | 声明块等价展开到全部根形态；凡 token 消费点在非根元素上，先确认变量在其祖先链可达 |

### 2026-09-24（input-number 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 74 | **h() 的事件键名必须「on+全小写」**：Vue 把 on 后的首个大写 hyphenate 成事件名 —— `onMouseDown` 注册成非标准的 `mouse-down` 事件，监听器**静默失效**（原生 addEventListener 的对照实验会误导：手动 dispatchEvent 走原生通道照常触发） | L1（onStep mousedown 0 调用）+ CSSOM/VEI 探针 | 组件内联事件一律 `onMousedown`/`onMouseup`/`onMouseleave`/`onFocusin`；用户事件经 attrs 原样转发（模板产物本就是 onMousedown） |
| 75 | **模板串里的 `.${cls}` 展开成双点号**（cls 已含前导点 ⇒ `..apollo-input-number-x`）—— 选择器非法，浏览器**整条静默丢弃**，86 条规则不生效；jsdom 的 L1/L4/L7 全绿（它们不断言 CSS 应用），只有 L6 像素比对暴露 | L6（states 9.6% 散点；CSSOM 列规则一眼定位） | 拼选择器时统一 `${cls}`（含点），复查产物 grep `..apollo`；双点号是「字符串模板拼 CSS」的专属陷阱 |
| 76 | **子组件自渲染的 ContextProvider 对自身 setup 不可见**：legacy addon 分支在组件内部渲染 Space.Compact 包自己 ⇒ useCompactItemContext 的 setup 期 inject 先于 provide，紧凑类名恒空（React 同构代码没问题，context 是渲染期求值） | L4（addon 用例 -compact-item 缺失） | 按上游结构拆两层组件（wrapper + Internal），Internal 作为 Compact 的**子组件**渲染；antd 源码本就是 forwardRef ×2 |

### 2026-09-23（collapse 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 71 | **antd 的嵌套样式规则展平后是「后代选择器」不是「直接子代」**：`${componentCls}-arrow` 嵌套在 `> ${componentCls}-header` 里 ⇒ 展平为 `.ant-collapse-header .ant-collapse-arrow`（箭头 span 在 expand-icon div 里，不是 header 直接子代）。写成 `>` 会让箭头的 font-size:12px 不生效（14px 默认）⇒ 图标盒宽 2px、文字右移 | L6（文字/图标整体 1-2px 位移，pixelmatch 0.2-5%） | 移植 cssinjs 嵌套时逐条判断父子关系：`&-xxx` 是后代；只有 `> ${x}` 明确写了的才是直接子代 |
| 72 | **genFocusStyle 的 `&:focus-visible` 不能内联进基础规则**：内联 ⇒ outline 恒渲染（colorPrimary 蓝框画满全部面板，L6 多出 6000+ 蓝色像素） | L6（像素颜色分布扫描：vue 多出 22,119,255 × 6176） | 嵌套伪类必须拆成独立选择器 `.x:focus-visible{...}`；L6 挂了先做**颜色直方图对比**（哪个颜色多了多少），一眼定位是哪条规则泄漏 |
| 73 | **disabled 的「吞点击」必须包住全局 toggle**：护栏放在 Panel 的 onItemClick 里而 Collapse 层直接调 toggle ⇒ disabled 面板照常展开 | L1（onChange 被意外调用 ×2） | rc 的 handleItemClick 结构：`if (disabled) return; onItemTrigger(); item.onItemClick?.()` —— 全局回调在护栏**之内** |

### 2026-09-23（qr-code 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 68 | **`emits` 声明会把 `onXxx` 从 props 剥离**：`emits: ['refresh']` ⇒ `props.onRefresh` 恒 undefined（即使同时声明了该 prop）⇒ 「是否给了刷新回调」的渲染分支永远走 false（刷新按钮消失） | L4（expired 覆盖层子节点数 2 vs 1） | 渲染层的监听器存在性用 `getCurrentInstance()?.vnode.props?.onRefresh` 探测（vnode 原始 props 不受 emits 剥离）；注意 splitter 的 `onResizeStart`「能用」是 emit 兜底，不是 props 可读 |
| 69 | **a11y 豁免是按次调用全局匹配的**：不同 demo 触发的 axe 规则不同（canvas ⇒ role-img-alt，svg ⇒ svg-img-alt），混在一组 `a11yDemoTest` 里会互相判「未被命中的豁免」 | L5（4 demo 混跑 4 挂） | 按规则族拆成多个 `a11yDemoTest` 调用（canvas 组 / svg 组），各组带各的 allow |
| 70 | **vendored 第三方 JS 进 `.ts` 会爆 implicit-any**（qrcodegen 139 个 TS7006） | lint:types | 第三方库保持 `.js` + 手写 `.d.ts` API 面（只声明本仓消费的成员） |

### 2026-09-23（splitter 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 65 | **mergeClassNames 的逐键 clsx 会把对象值折叠成键名字符串**：`dragger: {default:'x'}` 经 clsx 变成 `'default'` —— 语义槽里嵌套对象（antd 的 `_default` 展平形态）不能进通用合并 | L4（semantic 用例：dragger 类名缺 cls-dragger） | 嵌套槽位手动合并（joinCls 逐子键）；mergeStyles 的逐键浅合对对象值安全，无需特判 |
| 66 | **Vue 的 CSSOM 不会给数字补 px**（React 会）：`flexBasis: 100` 输出被静默丢弃 ⇒ 受控 px 尺寸的面板失去宽度 | L4（size-px 用例：flex-basis 缺失） | 组件里数字样式的收口函数统一补 px（与 #52/#53 同族：字符串/数字样式的单位处理必须在组件层完成） |
| 67 | **`h(Comp, props, () => …)` 的 vnode.children 是槽函数而非数组**：照 React 习惯读 `children` 数组得到函数本体，渲染成 `[object Object]` | L4（面板内容变字符串） | children 归一化助手：function ⇒ 调用；{default: fn} ⇒ 调用；数组 ⇒ 原样（`renderPanelChildren`） |

### 2026-09-23（listy 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 62 | **antd 的公开 props 会 Omit 掉内部 prop**：`ListyProps` Omit 了 `direction`（方向只来自 ConfigProvider）——按 rc 源码照搬「支持 direction prop」就错了 | L4（rtl 用例：Vue 侧多出 `-rtl` 类，React 基线没有） | 读 `index.d.ts` 的 **Omit 清单**再定 props 面；SSR 探针钉 DOM 时用 ConfigProvider 注入方向 |
| 63 | **jsdom 没有 `scrollIntoView`**，`vi.spyOn(el, 'scrollIntoView')` 直接抛「属性不存在」 | L1（spy 建立即挂） | 用 `Object.defineProperty(el, 'scrollIntoView', { value: vi.fn(), configurable: true })` 桩（spyOn 只能 spy 已有属性） |
| 64 | **虚拟列表在 jsdom 里需要双桩**：`holder.clientHeight`（`computeScrollTarget` 早退）+ 项的 `offsetParent`/`offsetHeight`（高度测量），否则 scrollTo 迭代不动、窗口恒为 0 | L1（virtual scrollTo 断言落空） | 复用 virtual-list 测试的 `makeItemsMeasurable` 范式；项内容必须是**元素**（string 内容在虚拟分支被 dev 告警跳过） |

### 2026-09-23（descriptions 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 58 | **缓存 es 源码 ≠ 实际渲染产物**：`/tmp/antd-src` 的 `descriptions/style` 写 `labelColor`（=colorTextTertiary 0.45），但 antd 实际渲染的 bordered label 是 `colorTextSecondary`（0.65）——tarball 与安装版本核对一致，属上游自身的源码/产物漂移 | L6（bordered 三张的 label 文字被像素比对揪红）+ 浏览器 computed style 定位（读 cssinjs 实际规则） | **产物 > 源码**（§5 优先级：`registry/*.json` 与「固定版本产物」高于读源码的印象）；凡样式对拍出颜色/数值分歧，先抓两侧 computed style 再改；判据修正登记 COMPATIBILITY（UPSTREAM） |
| 59 | **VTU 不接受 `{ default: undefined }` 槽位**（`Invalid slot received`） | L1（首批 15 例全挂） | mount 的 slots 只在有内容时传：`slots ? { props, slots } : { props }` |
| 60 | **通用 dev 告警走 console.error，deprecated 告警走 console.warn**（utils 的 warning/note 两通道） | L1（exceed 告警断言落空） | 断言前先查 `packages/utils/src/warning.ts` 的输出通道；`@rc-component/util` 的 `isReactRenderable` 等 shims 在 utils 里有对应物 |
| 61 | **`keyof (A \| B)` = 交集**：语义槽 prop 类型含函数式变体后，`keyof Props['classNames']` 是 never | L3（expectTypeOf actual never） | 对 keyof 断言用语义接口本体（`DescriptionsSemanticClassNames`），不要用 Props 的联合字段 |

### 2026-09-23（carousel 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 52 | **CSS 字符串里的键必须 kebab-case**：`zIndex:999` 拼进 style 字符串后 CSSOM 解析静默丢弃（`z-index` 才合法）⇒ 箭头/淡入淡出层级消失 | L4（z-index 在契约里） | styleToString 统一 `.replace(/[A-Z]/g,…)` kebab 化；trackStyle 的 `webkitTransform` / `msTransform` 特判 `-webkit-` / `-ms-` |
| 53 | **Vue 的字符串 style 是整段 cssText，不是「值」**：`style: px(listHeight)` 产出 `"168px"` 是无效声明，被静默丢弃 ⇒ vertical 的 list 高度约束失效（L6 size-mismatch 905 vs 272） | L6（尺寸不一致，人工分类） | 字符串 style 必须写完整声明：`` style: `height:${px(v)}` ``；值形态只属于对象 style（React 语义不同） |
| 54 | **px() 双重后缀**：`` `top:${px(x)}px` `` → `2.34pxpx` 非法 ⇒ `::after` 几何整块消失（箭头不可见） | L6（diff 集中在箭头）+ 产物 grep（`pxpx` 一眼定位） | px() 返回值不再拼 px；写完样式立刻 grep 产物验证 |
| 55 | **双精度 1 ulp**：`16 * (1/Math.SQRT2)` 与 `16 / Math.SQRT2` 可能不同 —— antd 用 `.div(Math.SQRT2)` | L7（断言字符串可能失配） | 对齐 antd 的算术形态：一律**除法**；`arrowLength` 常量注释写明 |
| 56 | **L4 管线在 jsdom 挂载，样式过 CSSOM**：hex 颜色 → `rgb()`、`left:0` → `0px`（React SSR 是原始字符串）⇒ 颜色差异是管线噪声不是实现差异 | L4（19 例首轮全挂） | fixture 的用户内容样式**只留几何属性**；组件自有内联定位的 `left:0` 走 allow（reason + COMPATIBILITY 登记），断言 `toEqual([...allowed])` 恰好匹配 |
| 57 | **默认值判据是 antd 的解构，不是 slick 的 defaultProps**：dots（slick false → antd **true**）、arrows（slick true → antd **false**）、waitForAnimate（slick true → antd **false**）—— 三处全反 | L1（dots 默认缺失 / arrows 多渲染） | 写默认值前先读 `es/carousel/index.js` 的解构行，slick defaults 只作透传面判据 |

### 2026-09-23（switch 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 46 | **`useSize(props.size)` 非响应式**（同一会话在 radio 与 switch 各犯一次）：`customSize` 只在 setup 期读一次 ⇒ 受控切换 `size` 静默失效 | L1（一条「受控切换 size」用例；静态用例永远发现不了） | 一律用**函数形态** `useSize((ctx) => props.size ?? ctx)`（skeleton 的 Avatar/Button/Input 是本仓范式）；radio 已补回归用例 |
| 47 | **biome 把「脚本里只出现在类型位置」的图标导入改成 `type` 导入**，而模板里当值用 ⇒ `Property "X" … is not defined on instance` | demo 冒烟 | 类型注解别引用值：用 `import { type Component, h } from 'vue'` |
| 48 | **`a,b::before` 陷阱**（PITFALLS 141 姊妹）：`genNoMotionStyle()` 的 `&` 指代整个选择器列表，伪元素必须**逐个展开**；且 `handle::before` 走 **raw** 变体（不展开，否则出现 `::before::before`） | 与 extractStyle 产物对拍（唯一一处差异） | 写 reduced-motion 段时先与产物对拍选择器集合 |
| 49 | **`SwitchProps` 不含 `onKeyDown`**（它是 rc-switch 的 props）⇒ `Pick<SwitchProps, 'onKeyDown'>` 报 TS2344 并让 `callbacks` 退化成 `{}` | dts 构建（`pnpm build:ui`） | attrs 显式写内联类型，别用 `Pick<Props, …>` 抄近路 |
| 50 | **`pnpm build:ui` 的 dts 步骤要 12 分钟以上**（全仓 vue-tsc，无增量） | — | 挂**后台**跑，期间并行写文档/fixtures/PITFALLS；别用 `head` 截断（退出码会掩盖失败） |
| 51 | **ui 根 `index.ts` 的 re-export 别名坑重犯**（PITFALLS 158）：`style/index.ts` 导出通用名 `genTokenDecls`、`token.ts` 是 `prepareComponentToken` ⇒ 必须 `as genXTokenDecls` / `as prepareXComponentToken`；**测试文件里的 import 同样要别名** | `pnpm build:ui` + dts | 新增导出后立刻跑一次 `pnpm build:ui` |

### 2026-09-23（radio 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 38 | **写入的 import 里 `/` 会被吞**：`@apollo-design/ui` 落盘成 `@apollo-design-ui`（14 个 demo 里 2 个中招） | demo 冒烟（vite: `Failed to resolve import "@apollo-design-ui"`） | 批量写文件后**逐文件回读**；本次用一次全仓正则扫（`/@apollo-design-[a-z]/`）兜住。⚠️ 本机 BSD `grep` 对多模式会静默 0 匹配，排查优先用 node 脚本（同 PITFALLS 138/154） |
| 39 | **E10 的「硬编码圆角」启发式按源码文本判断** ⇒ 参数化的圆角（`border-radius:${radius}`，radius 已是 `var(...)`）被误报 | registry validate E10 | 处方是**改写法**而不是加豁免：helper 收 **token 名**，模板写 `border-radius:${v(radiusToken)};`（源码文本命中 `${v(` 放行分支）。重构后验证产物**逐字节不变**（dump + diff） |
| 40 | **antd 的 `-wrapper-checked` 不含非受控内部态**：`<Radio defaultChecked />` 时 span 有 `-checked`、wrapper **没有** | L4 机械基线（`radio:default-checked`） | 实现里**分成两个 computed**（`mergedChecked` = checked prop/Group 值；`effectiveChecked` = 内部态），别「顺手统一」。L1 若只断言 span 会漏 |
| 41 | **`RadioGroup` 的 `name` 默认值是 `useId` 生成的**（`toNamePathStr(undefined) === ''` ⇒ `useId('')` 走生成分支），不是 undefined | 实现期回读上游源码 | 凡是「某 prop 的默认值是什么」读上游实现，别推（分析初稿凭直觉写成「恒 undefined」） |
| 42 | **`packages/ui/src/index.ts` 的 re-export 必须用别名**（`genTokenDecls as genRadioTokenDecls`）：写错时 **vitest 全绿**，只有 `unbuild` 报 `"X" is not exported by …` | `pnpm build:ui`（L7） | 新增导出后先跑一次 `pnpm build:ui`（约 20 秒），比等到 G13 便宜得多 |
| 43 | **`tests/visual` 从 `packages/ui/dist/index.mjs` import（不是源码）** ⇒ dist 过期时报 `[MISSING_EXPORT]` | L6 首跑 | baseline 与 compare 两种模式**都要先 `pnpm build:ui`** |
| 44 | **同族组件的「同名字段」落点不能互相照抄**：`title` 在 checkbox 落 span、在 radio 落 **label**（issue 46739） | L4 | checkbox → radio 是最容易「照上一版改」的一对，必须逐个回读上游 |
| 45 | **全仓 `update:*` 缺口**：规则 C11 要求 v-model 与语义事件同时发出，但只有 radio 实现了 ⇒ 其余 21 个组件上 `v-model:xxx` 不生效 | 实现期核对 | 后续组件照 C11 做；建议某次整合期统一补齐（纯增量、不改 DOM） |

### 2026-09-22（layout 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 31 | **复合组件的「子组件」没从 index.ts 具名导出**：`import { Header } from './layout'` 得到 `undefined`，`h(undefined)` 只发一条 warn，L4 表现为「子节点数 0」而非「导入失败」 | L4（26 例一起红） | 复合组件除静态属性外，也要 `export const Header = LayoutHeader` 等具名别名 |
| 32 | **漏了 `resetComponent`**（`font-family` / `font-size` / `box-sizing`）：antd 的 genStyleHooks 自动带这一段，手写 CSS 时最容易漏 | L6（12 张 block-diff，文字渲染差 0.04%~0.16%） | 手写样式表时先抄提取产物**第一段**（reset），再看组件自己的规则 |
| 33 | **`useMergeSemantic` 的第三参是值不是 getter**：传 `semanticProps.value` 会让函数式语义化永远拿到首帧 props | L1（语义化函数用例） | 函数形态要随 props 变化时，直接用 `mergeClassNames` + `resolveSemantic` 包 computed |
| 34 | **L4 基线里的 `#F96` 会被 jsdom 重序列化成 `rgb(…)`**：React SSR 原样输出、Vue 侧走 jsdom style 解析 ⇒ 必然不等 | L4 | 固件颜色统一写 `rgb(1, 2, 3)` 这种「两种引擎输出一致」的形态 |
| 35 | **Vue 里 `onXxx` 回调 prop 不能声明 emits**：声明后 Vue 会把它从 attrs 摘掉，组件内 `attrs.onCollapse` 恒 undefined | L1（折叠用例静默不触发） | antd 的「props 形态回调」在 Vue 侧一律走 attrs，不写 emits |
| 36 | **类型负例不能用「函数参数类型不符」**（TS 函数参数双变，宽类型会被接受）→ `@ts-expect-error` 报「未使用的指令」 | L3 | 直接钉联合类型本身（`const bad: CollapseType = 'hover'`） |
| 37 | **E10 会遇到「antd 逐字的 alpha 白色遮罩」**（`rgba(255,255,255,0.2)`）：本仓没有带 alpha 的白色 token，换 token 会与上游分叉 | registry validate | 给 HARDCODED_PATTERNS 加 `skip` 字段（逐字豁免 + 理由），与 border-beam 的 `#fff 0 0)` 豁免同理 |

### 2026-09-22（watermark 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 24 | **jsdom 里 `MutationObserver` 是 `MockMutationObserver`**（vitest.setup.ts 主动替换，TESTING.md T5/T6）：防篡改用例"真的改 DOM"永远不触发回调，单跑还绿、全跑才红 | L1 | 用 `utils` 的 `observeMutation`（元素→回调集合的全局单例），测试从 `globalThis.MutationObserver.instances` 取实例显式 `trigger(records)` 驱动 |
| 25 | **水印元素本身不是观察目标**（它在 container 的 `subtree` 里被看到） | L1（`observerOf(target)` 抛"未找到"） | 用 container 的 observer，`record.target` 才是水印元素（`reRendering` 认 `mutation.target`） |
| 26 | **`mount(() => h(Comp))` 函数式包装下 `getCurrentComponent().exposed` 恒 undefined** | L1（ref 用例） | 断言 exposed 时必须 `mount(Comp, { props })`；只有需要 `setProps` 时才用包装（那就要放弃 exposed 断言） |
| 27 | **jsdom 的 CSS 序列化给 `url()` 加单引号** | L1（`url(data:…)` 匹配失败） | 断言写 `url('data:…')`，别按源码字符串硬比 |
| 28 | **`{...font, ...line.font}` 里 `fontSize: undefined` 会覆盖默认值 ⇒ `NaNpx`** | L1（手写第三行 font 用例才发现） | 这是 antd 同判（不是 bug）—— 不做"修复"，而是在测试里显式钉住 NaN，避免后人"顺手修好"造成与上游分叉 |
| 29 | **canvas 组件的 L4 基线只有 SSR DOM 可比**（水印 div 运行时 append） | 设计期判断 | 基线只钉根 div 的 class/style 合成；绘制参数交 L1（canvas stub）、像素交 L6（真实浏览器） |
| 30 | **视觉用例里的外链图片必然漂移**（两侧加载时序不同） | L6（设计期规避） | 图片用内联 SVG data URL（`encodeURIComponent`），与 statistic 的 Timer 同思路 |

### 2026-09-22（statistic 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 19 | **`h(子组件, { class: … })` 对 `inheritAttrs:false` 的子组件静默丢失**：class 走 attrs，被子组件的 pickAttrs({aria,data}) 过滤掉 → content-value 类名整段消失 | L4（类名不同 []） | 传目标组件**声明的 prop**（`className`）；跨组件 h() 前先查对方 prop 表，attrs 不会自动变成 props |
| 20 | **语义化 `classNames`/`styles` 的 Vue prop 必须声明 `[Object, Function]`**：只写 `Object` 时函数形态触发 Invalid prop 告警，themeTest 的「0 未豁免告警」直接红 | L7（themeTest） | 两态 prop 一律 `type: [Object, Function] as PropType<X>`；Timer 这类转发组件也要同步改 |
| 21 | **`h()` 的 children 传 `VNodeChild`（含 null）不匹配重载**：RawChildren 不收 null，vue-tsc 报 TS2769 | lint:types（构建期 dts） | 条件子节点包一层数组 `[x as VNodeChild]`（null 在 VNodeArrayChildren 里合法） |
| 22 | **fake timers 下 `1000/60` 间隔的末 tick 落在 advance 边界之内**：advance(1000) 后末次渲染仍是 00:30:00（React 的 act flush 语义与 Vue 调度不同） | L1（countup 差 1s） | 计时断言留余量：advance 到「越过整秒」再断言同一契约，不逐帧较劲 |
| 23 | **视觉层的 Timer 截图两侧秒级必然漂移**（React/Vue 截图时刻不同） | L6（设计期规避） | 视觉用例 format 取最粗稳定粒度（`D 天`）；秒/分行为由 L1 fake timers 钉 |

### 2026-09-22（tag 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 16 | **cloneVNode 注入的 `tabindex` 键对组件 vnode 无效**：icons 的 createIcon 对「有 onClick 且无 tabIndex prop」兜底 `tabIndex=-1`，我们传全小写 `tabindex` 只进了 attrs → 禁用态覆盖失效（close-icon 恒 -1） | L1（tabindex 断言） | 键名按 vnode 类型区分：`isComponentVNode(origin) ? 'tabIndex' : 'tabindex'`；cloneVNode 注入组件 props 前先查目标组件的 prop 命名 |
| 17 | **antd 的 closeIcon 定制是「克隆用户元素本身」而非「包 wrapper」**：replacement span 方案会多一层 DOM（L4 逐字节比对直接红） | L4（标签/子节点数不同） | closeIconRender 用 cloneVNode(origin, {...注入})——role/tabIndex/aria-label/类/事件全部注入原元素，DOM 与 antd 逐字同构 |
| 18 | **E10 硬编码校验要区分「变量声明行」与「消费行」**：Component Token 的 seed 实色（tag default-bg:#f5f5f5）在声明行是契约（antd cssVar 产物同为实色） | registry validate | validate 按行扫描：跳过注释行与 `--token:<hex>` 声明行，只抓「消费处」的硬编码 |

### 2026-09-22（back-top 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 13 | **`@media` 的 media feature 里不能用 CSS 变量**（`max-width: var(--screen-md)` 非法，浏览器整条忽略）→ 响应式断点静默失效，375px 视口没走到 screenXS 档 | L6（按钮水平错位 24px） | 断点用字面量（theme 默认值 768/480），注释登记「不随主题缩放」边界 |
| 14 | **resetComponent 是完整 reset 而非 genCommonStyle 的子集**：只补 font-family/font-size 会漏 margin/padding/color/line-height/list-style —— back-top 按钮行高 16.1 vs 22 | L6（btn lh 差异，探针量出） | 组件根对齐 antd 的 resetComponent 全套；「组件根必须有 font-family/font-size」的老口诀要升级成「对齐 resetComponent 全套」 |
| 15 | **React 基线页的 body 继承字体取决于该页组件是否带 cssinjs 的 body 注入**：BackTop 不带 → `<p>` 继承 sans-serif；badge/typography 页带 → token 栈。同一 BASE_CSS 对不同页匹配不同 | L6（个别字符字形 diff 0.155%） | 视觉用例内显式钉正文字体（不动全局 BASE_CSS）；全局裁决等更多页面证据 |

### 2026-09-22（result 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 9 | **`.apollo-icon` 基线（getIconStyle）没进 ui 全局样式层**：icon 高 86.8 vs 72（`line-height:0` 等缺失）——button 期在按钮范围内自保过一次，result 期确认是集成缺口 | L6（icon size-mismatch） | 第三次法则收口：`getIconStyle()` 接进 `BASE_CSS`（每份组件 CSS 自带）。后续组件不再各自补图标基线 |
| 10 | **ReactNode 类 prop 被写成插槽**：antd 的 `extra` 是 prop，demo 初版写成 `#extra` 插槽 → L6 里 extra 整块消失 | L6（extra 缺失）+ demo 冒烟 | 规则 C19 只把 `children` 映射为插槽；demo 评审时先查 prop 清单 |
| 11 | **antd 的 `anticon` 前缀不受组件 `prefixCls` 控制**（由 IconContext/ConfigProvider 决定）：L4 基线逐条出 `anticon vs apollo-icon` 噪音 | L4（15 条基线全是同一 diff） | 基线侧用 `ConfigProvider { prefixCls, iconPrefixCls }` 包裹对齐，把 D6 收敛到组件自身一条 |
| 12 | **机械转换 React 插画时 `createElement` 的变长子节点**：Vue `h` 只收 3 参，直接替换会 TS2554 | L1 构建期（TS2554） | 转换器必须做括号平衡解析，把第 3+ 参数折成数组（camelCase SVG 属性同步转 kebab） |

### 2026-09-22（badge 会话 —— 全量视觉回归暴露的 5 个跨组件缺陷）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 1 | **motion 包首帧 `mergedVisible:false`**：CSSMotion 首帧（含 SSR）渲染 null，到 onMounted 才补渲染 → SSR 空屏。React 的 rc-motion 首帧同步渲染 | L4（badge SSR 契约）+ B8 | 初始快照 `mergedVisible = props.visible()`；appear 动画场景走 styleReady='NONE' 首帧 null（与 rc-motion 一致）。改 motion 包必须同步更新其自测时序断言 |
| 2 | **ConfigProvider 从未 provide ThemeContext**：`useToken()` 恒返回默认浅色 token —— 纯 CSS 消费的组件看不出问题，首个「从 token 对象计算」的组件（Empty 插画色）直接暴露 | L6（theme-dark 变体） | ConfigProvider 补 `provide(ThemeContextKey, { config, token })`；新组件凡是从 token 对象算颜色/尺寸的，先写一条 dark 主题断言 |
| 3 | **「主题切换不影响插画色」的旧结论是错的**（antd empty.js 运行时 getDesignToken → getAsSolidColor，dark 下 fill=#3e3e3e）：build 期钉 hex 的 trade-off 对 6.6.4 不成立 | L6 theme-dark | 生成器改为输出 `ctx.colors.<role>` 引用，组件运行时从 useToken 合成；生成器的 ROLE_TOKENS 反查表+自检继续兜底 |
| 4 | **antd 6 的两字中文插空格是真实空格**（spaceChildren），不是 CSS letter-spacing 技巧 —— 6.6.4 同时保留 `-two-chinese-chars` 类与 first-letter CSS，但对字符串子节点类恒不出现（检测读的是变换后的 textContent，自否定） | L6（button/type 的「确定」ghost） | 实现以运行时探针（React 实测 textContent/className）为准，不猜源码语义 |
| 5 | **`v-if=false` 的插槽内容是注释 vnode（truthy）**：ScrollNumber 的「children 即 count VNode」分支被空注释劫持，整数拆位整个消失且无报错 | L1（.find 为空） | clone/取首个子节点前必须 `filter(v => v.type !== Comment)`；h(vnode) 不能当 cloneVNode 用（type 位传 VNode 会静默炸子树） |
| 6 | **genStyleHooks 会给组件根注入 genCommonStyle（font-family/font-size）**——零运行时样式漏掉它，继承字号差异在 inline 文本上变成 1-2px 的 block-diff | L6 全量回归（grid） | 每个组件的 genXxxStyle 根规则都要有 `font-family/font-size: var(--apollo-*)`（对照 antd extractStyle 产物核对） |
| 7 | **BASE_CSS 的 body font-size:14px 是平台差异源**：antd/dist/reset.css 不设 body 字号（浏览器 16px），但**必须**补 `html{line-height:1.15}`（reset.css 里有） | L6（badge 全局回归） | BASE_CSS 以「与 antd/dist/reset.css 逐条对齐」为唯一判据，历史注释里的「有意省略」要用全量回归复核 |
| 8 | **demo 文件名双写 `.vue.vue`**（生成脚本 name 已含扩展名又拼接） | demo 冒烟找不到文件 | 批量生成后 `ls` 核对文件清单再跑测试 |

### 2026-09-21/22（flex · grid · badge 会话）

| # | 坑 | 抓到它的层 | 对策 |
|---|---|---|---|
| 1 | **样式生成器把选择器段写成属性名**（flex：`-flex-wrap-wrap` ≠ `-wrap-wrap`、`-align-items-*` ≠ `-align-*`） | **L6**（首跑 9/15，wrap 52% 差异）—— L4 只比 DOM，永远比不到 CSS 选择器 | 样式生成器的每条选择器**对照 antd 真实产物**抽查；改完先跑 L6 再收口 |
| 2 | **组件 `style` prop 没合并进根样式**（grid Row：`{...gutterStyle}` 漏了 `...props.style`） | **L6**（视觉探针量出 Row 高度丢失） | antd 的合并顺序 `offset → contextStyle → style`（style 最后覆盖）；L1 补一条「style prop 覆盖生成样式」断言 |
| 3 | **setup 期触碰 `window`**（grid useBreakpoint 在 setup 里订阅 matchMedia）→ SSR 直接崩 | **B8**（test:build 的 SSR 冒烟） | 任何浏览器 API 订阅放 `onMounted`（对齐 React `useLayoutEffect` 语义：SSR 不执行）；新增 hook 必过 B8 |
| 4 | **多导出组件 SSR 冒烟查不到导出**（grid 目录导出 Row+Col，没有 Grid） | B8 | `tests/build/run.mjs` 的 `SSR_EXPORT_ALIASES` 加别名表 |
| 5 | **CSSOM 序列化伪差异**：`calc(1rem / -2)`→`calc(-0.5rem)`、`min-width:0`→`0px`、flex 数字 unitless | L4（allow 豁免） | 先判断是不是 PLATFORM 类差异再动手——**别把伪差异当 BUG 修** |
| 6 | **响应式 prop 的 SSR 语义差**：React SSR `screens=null`（useGutter 兜底全命中）vs 我们 jsdom 真实挂载 `screens=全 false` | L4 基线设计时 | 响应式场景**不进 L4 基线**，由 L1 的 matchMedia mock 驱动覆盖；基线脚本文件头写明取舍 |
| 7 | L3 类型断言语义写反（`toMatchTypeOf` ≠ 「类型相同」） | L3 | 精确断言用 `toEqualTypeOf`；宽用例才用 `toMatchTypeOf` |
| 8 | `noUncheckedIndexedAccess`：Record 索引访问返回 `T \| undefined` | typecheck | for..of 替代索引循环；`val()` 取值函数带运行时守卫 |
| 9 | `useAttrs()` 在 computed 里调用 → biome 报错/响应式丢失 | biome | setup **顶层**解构一次 |
| 10 | `push origin master` 假同步（worktree 分支名 ≠ master） | git ls-remote 核对 | 恒用 `git push origin HEAD:master`（WORKFLOW.md §0.2） |
| 11 | cssinjs 2.x 的 `extractStyle(cache)` 需要树内 cache 实例（v1 的无参签名已废） | 提取脚本调试 30 分钟 | 树内 `React.useContext(StyleContext).cache` 再调 extractStyle；脚本存 /tmp 会丢，用完把关键产物落到 docs/analysis |
| 12 | demo 里模板占位符（`${COL_STYLE}`）忘了替换 | demo 冒烟 | 批量生成 demo 后必须复跑 demo.test |
| 13 | Vue props 恒含全部声明键：`'x' in props` 恒 true → deprecated 告警永不触发 | L1 | 判据改 `props.x !== undefined`（PLATFORM，Empty 已有范本） |
| 14 | Component Token 走 CSS 变量时：声明可放组件自身 CSS（`.apollo-badge{--apollo-badge-*:…}`），B7 认 | grid 扩展 B7 后 | 9 token 的 badge 即用此形态；派生乘除算成常量（indicatorHeight=20）登记主题覆盖失效 |

---

## 提速的真正杠杆（按收益排序）
16. **TreeSelect 期（2026-09-29）—— 视觉 size-mismatch 的两层根因**
   - 坑 1：样式拼接顺序。select 壳规则与 tree 规则同前缀（`.apollo-tree-select`）时，tree 的 reset（`padding:0`）若拼在壳的根块（padding-block/inline）**之后**，同特异性后者被覆盖 ⇒ 触发器塌成内容高度（96 vs 88）。
   - 坑 2：antd 的树压平规则（`[treeCls]{borderRadius:0}`）**嵌套在 `-dropdown` 作用域内**；写成顶层会命中触发器根把圆角清零（diff 图四角红点）。
   - 抓到的层：L6 视觉对比（size-mismatch → block-diff）；CSS 层面测试全绿。
   - 对策：①拼接顺序 tree → shell → dropdown；②dropdown 专属规则一律带 `-dropdown` 前缀；③ theme.test 加「not.toMatch 顶层 border-radius:0」反向断言。配套判据：BaseSelect `onDisplayValuesChange` 的 clear 分支用**第一参数**（新值=[]），`info.values` 是被移除的值——用反会把原值发回去（unit 层抓到）。

1. **并行泳道**：`next-task.mjs --parallel` 已能给出当前全部可开工批次（15 条泳道、
   每条 2–3 并发、41 个组件可执行），但实际一直是单人串行。串行时一天 1 个组件；
   每多一条并行泳道，吞吐近似线性增加。小复杂度（S）组件适合填满并行空隙。
2. **脚手架**：省掉每组件 25–30 个样板文件的手搓与改名（估 0.5–1h/组件）。
3. **本清单 + scoped 取证**：省掉「重新踩坑」的数小时级调试与全仓门禁等待。
4. **open decisions 尽快裁决**：7 条开放决策中任何一条被 hardBlock 的组件，
   都会做到最后一步才发现「收不了口」——开工前用 `ask.mjs decisions --open` 过一遍。
