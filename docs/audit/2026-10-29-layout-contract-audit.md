# Layout / Header / Footer / Content / Sider 契约整改

日期：2026-10-29。盘点基准 HEAD：`2f47f423a8c229a4f763593c4cda0f401ed06731`。规范来源为当前 AGENTS、ARCHITECTURE、COMPONENT-RULES、COMPATIBILITY、TESTING、WORKFLOW 六份文件；已接受 ADR0006/0007 适用于 Vue 内容、状态、原生事件与可访问 DOM。旧 PLAN、README 中的上游同构要求及 Registry completed 不作为免检依据。

## 范围与文件所有权

本轮完整单元是 Layout 及 Header/Footer/Content/Sider、内部 context/has-sider、19 个已有 Layout Token、两个公开静态 CSS 入口和全部 11 个 Demo。允许编辑 layout/**、本审计记录、独立 Layout browser/consumer/visual case/helper、所属迁移说明。共享导出、Registry、visual matrix/runner 和 dist 由主线程统一整合；本轮不包构建、不提交、不推送，不修改 Input/Space 或其他作者文件。

实施前先完成下表盘点与验收定义，再建立分组可失败复现，同步实现/类型/测试/Demo/双语 API/迁移。下表记录整改前链路，实际结果见执行记录；源码通过不等同于发布验收。

## 完整清单与分类

| 单元 / 全部公开面 | 声明 → 传递 → 消费现状 | 本轮分类与验收 |
| --- | --- | --- |
| Layout props：prefixCls、hasSider | getPrefixCls；显式 boolean → 注册 Sider 数 → 直接 VNode 检测；注册有注销 | 原有显式优先、多实例/移除链保留验证；Fragment/数组/条件内容和 SSR 首帧检测需补复现；不穿透嵌套 Layout 误计 |
| Header/Footer/Content | 同一 layoutProps（含未消费 hasSider）；原生 header/footer/main；prefixCls 为完整前缀；default slot；nativeElement | 保留原生语义、完整内容/0、前缀/ref；核对独立使用、动态前缀、Provider、卸载；不新增无意义状态 |
| Layout attrs / Provider | 原生 attrs 根转发；layout.className/style；style 用对象展开；direction/getPrefixCls 在 setup 解构 | 字符串/数组 style 与动态 direction 必修复现；当前 prefix/Provider 配置替换/移除逐项验收，原生 style 最后生效 |
| Sider props：collapsible、collapsed、defaultCollapsed | useControlledValue；点击/响应式请求调用 attrs.onCollapse | 保留受控拒绝、非受控初值与默认值仅初始化；补齐 Vue typed collapse/breakpoint/update:collapsed，修正 attrs 回调穿透原生 DOM；检查受控解除及重复切换 |
| Sider width、collapsedWidth | 数字/数字字符串补 px，其余 CSS 字符串保留；flex/max/min/width 内部最后覆盖 | 原有宽度行为保留；字符串/数组原生 style 必修，明确宽度 prop 与原生/语义优先级；0/百分比/calc 与动态切换验证 |
| Sider reverseArrow、theme、prefixCls | 主题类与图标方向；direction 快照 | 当前方向/前缀/主题切换和图标必修；light/dark 原有配色不夹带改版 |
| trigger prop / trigger slot / zeroWidthTriggerStyle | prop 优先；slots 在 computed 中求值；默认 div、零宽 span 只有 click | 默认与零宽触发器原生键盘/焦点/可访问名称/aria-expanded/controls 必修；slot 在 render 读取且存在即优先（含空）；null 抑制、0/数组/Fragment/条件新增移除、反复展开与受控拒绝均验收 |
| breakpoint / media 生命周期 / onBreakpoint | setup 直接 attach；breakpoint watch；仅现代 EventListener；移除断点不清 below | 挂载时开始、SSR 不订阅/不业务通知；切换/移除/重挂清理、现代及兼容监听、初始命中与更新复现；回调替换/移除有效且不泄漏 |
| Sider default slot、body、collapse context | default 每次 render；computed collapsed provide 给 Menu；zero-width 仅 overflow:hidden | 保留完整内容与业务节点身份；零宽后不可见内容的键盘/ARIA 与焦点归属复现，不能卸载清草稿；真实 Menu 联动及多实例必须回归 |
| Sider classNames/styles：root/body，对象/函数 | 当前 collapsed 参与语义计算；Provider 仅现有 layout.className；attrs.style 对象展开 | 保留当前合并 props 与两个语义槽、原生 style 优先；Provider 所属范围在文档明确；配置替换/移除不残留 |
| Expose / 安装 / 公共类型 | Layout/Header/Footer/Content/Sider nativeElement；ALayout 等安装名、静态别名；Sider slot/emits 未类型化 | 保留所有现有导出/安装/ref，补所属 Slot/Emits 类型与模板消费者；共享 Root 导出变动交主线程 |
| 当前 Theme / 19 Token | prepare 有 19 字段；静态 Layout/Sider 默认声明；运行时未消费 useTheme/components.Layout；三个 deprecated alias 没有真实消费 | 19 字段含旧别名全部核对、部分/0/合法长度和动态清除必须生效；当前 Alias/ThemeProvider/nesting/SSR；原生与 stylesheet 私有变量保持优先；不引入运行时 CSS-in-JS |
| 独立 CSS / Header / Sider | layout/style.css、layout-sider/style.css 分开；Header/Footer 的私有变量仅父 Layout 提供；Sider 自己默认声明可能覆盖外层变量 | 独立家族节点和按需/full CSS 实际几何/paint 验证；内部触发器 CSS 自足；不会因 Menu 类型/插槽内容增加错误 CSS 依赖 |
| Demo：basic、side、top、top-side、top-side-2、fixed、fixed-sider、custom-trigger、responsive、component-token、collapsible-overlay | 11 成对 .vue/.md；9 导航仍为原生 ul/li、多个 Breadcrumb 文本替身；旧未落地注释失真；token Demo 用根变量冒充 theme.components.Layout；basic 多处数值 style 缺 px | 全部盘点并保持真实场景；真实 Menu/Breadcrumb/原生按钮可访问名称、当前主题 Token Demo、四主题与响应式交互同步整改；保留明确设计演示用颜色，默认表面改用当前 Alias |

分类：上表标为必修的已有字段/交互缺陷均在本轮，不转为未来优化。现有受控/非受控点击、Menu collapsed 引用、数字/百分比宽度、显式 hasSider、安装名和语义槽的原有覆盖保留；需通过新增复现与完整回归确认，不能仅凭实现推定正常。当前无需要用户阻塞的设计裁决。任意自定义前缀自动 CSS 属共享 D04，继续按预生成静态 CSS 边界处理。

## 统一验收标准

1. 先运行分组红灯，记录失败数量、错误链及正常负控。运行时、类型、DOM、a11y、theme、Demo 均覆盖本完整单元；旧机械基线保留，通过明确 migration/difference 精确解释原生触发器和 ARIA 等契约修正，禁止批量放宽断言。
2. collapsed：非受控/默认值/受控接受与拒绝、v-model 更新、外部替换与解除、点击/Enter/Space、零宽/非零宽、动态宽度/主题/方向/触发器；保持正文输入节点、草稿、焦点与选择；多实例独立。
3. media：初始小/大屏、所有断点、动态切换/移除、回调替换、卸载/重挂、无 matchMedia、现代/兼容 API、SSR 不访问浏览器；监听数量和注销实际断言。Layout 条件槽、Fragment、嵌套 Layout 与多 Sider 注册统一验收。
4. 样式：ConfigProvider/ThemeProvider/嵌套四主题、19 字段当前值及动态移除、原生对象/字符串/数组/变量与 semantic root/body 层级、两个独立入口和全量对照；真实 property/geometry/paint 而非只查变量存在；零注入运行时样式。
5. 全 11 Demo strict vue-tsc + browser 四主题/必要响应式与交互；独立类型消费者根/子路径、槽/ref/native styles/emits 正负例。browser/visual case 与 helper 独立就绪；正式发布/视觉/Docs/最终同提交全量门禁由主线程统一。

## 执行记录

- 已读六份规范、现行 ADR0007，完整核对 layout 源码/公开文档/现有 7 个测试文件、11 个 Demo 与对应 Markdown、两个 CSS exports 及 Menu context 消费者。
- 未提交工作树基于 HEAD `5c5272976db8edecdec248229b5fd83bab6c4196` 完成最终源码读验证；其中主线程提供共享 ThemeContext.sourceActive 与 ConfigProvider 最近有效主题来源。主线程另行修复 BorderBeam 准确泛型并整合根导出，本单元没有跨目录修改这些实现。

### 可失败复现及修正依据

1. 初始完整契约组 33 项中 32 失败、1 正常负控，日志 `/tmp/apollo-layout-contract-red-final.log`。同一组覆盖 native style、当前 Provider、原生按钮/键盘、slot 条件存在、typed emits、受控解除、零宽正文、SSR Fragment、media 生命周期和 19 字段消费。按当前 Vue 契约修复，未把旧实现或参考 DOM 当正确判据。
2. 后续局部完整前缀组 38 项中 5 失败、33 通过，日志 `/tmp/apollo-layout-prefix-red.log`；修复五个家族组件的当前字段命名空间后 38/38，日志 `/tmp/apollo-layout-prefix-green.log`。任意 prefix 的静态 CSS 仍由调用方预生成，不声称自动运行时支持。
3. 真实浏览器终轮 35 项中 32 通过、3 失败，证据 `/tmp/apollo-layout-scope-rtl-red.json`：父 Layout 的原生 Alias 被子节点重写；无 theme 的 ConfigProvider 覆盖 CSS-only Alias；reverseArrow/light 的零宽边框方向错误。同组空 ThemeProvider → 无配置 ConfigProvider 隔离远层主题已经正常，保留为负控。三处修复后终轮 35/35。
4. DOM 参考保留原 32 用例及 keepStyle，不改原 JSON。依据 ADR0007 与所属 migration，仅在 `contract-differences.json` 为 8 个精确用例登记原生 button、装饰图标 ARIA、展开/关联状态、零宽 body 隐藏差异；其余 24 用例不豁免，额外差异仍失败。原始差异采集 `/tmp/apollo-layout-dom-differences-final.json` 保留。
5. 真实 Menu 替换 Demo 导航替身后，修正了实际暴露的 Demo 表面/选中色配对、嵌套菜单作用域、custom-trigger 真实点击和 basic 多个 main 地标。没有关闭 axe 规则或移除选中状态。Menu 默认样式的独立消费问题已告知主线程，需在完整 Menu 单元评估，本轮只改本 Demo 的主题组合。

### 完整清单收口

| 清单 | 已实现及已验证 |
| --- | --- |
| 全部 Props/Slots/Emits/v-model/Expose/安装 | 原公开状态、宽度、外观、语义槽、安装名/静态别名和五个 nativeElement 保留；新增所属 typed Slots/Emits 与 update:collapsed；受控接受/拒绝/解除、非受控初值/重复切换、监听器替换移除、0/数组/Fragment/条件空槽均覆盖。结构组件仅声明 prefixCls，无效 hasSider 泄漏按 migration 清除 |
| attrs / 当前 Provider / 生命周期 | mergeProps 保留对象/字符串/数组样式及原生 attrs；Layout style 和 Sider root/body/宽度优先级有实际断言；方向/前缀/Provider 配置更新与移除不残留，业务输入节点和焦点保持 |
| hasSider / SSR / 多实例 / Menu | 显式值优先、直接 Sider/数组/Fragment、运行时登记、嵌套 Layout 边界、添加/卸载及多 Sider；SSR 不建立媒体监听或发业务事件。真实 Menu 继承当前 collapsed，原有显式覆盖用例保留 |
| Sider 键盘及零宽 | 原生 type=button，Enter/Space、ARIA、可见焦点、不提交表单；零宽正文 inert/aria-hidden 且草稿节点保留，正文焦点交给按钮、外部焦点保留；CSS 表达式宽度经测量识别零/非零；LTR/RTL × reverseArrow 四组合的圆角/边框实际计算样式通过 |
| 响应式 | 七断点实际浏览器视口命中/退出；现代及兼容 listener、动态切换/移除、卸载/重挂和无 matchMedia；移除清 below 保留 collapsed，不合成通知 |
| 19 既有字段 / 样式继承 | 所有现代/旧别名真实 property/geometry/paint，现代优先、数字 0/合法长度、动态清除；同主题家族继承父原生 Alias、不重复重置数据；显式新/空主题隔离远层数据；sourceActive=false 保持 CSS-only；不同局部 prefix 使用当前 source 命名空间。19 项单测在作用域根检查数据，后代检查不覆盖继承，并由浏览器验证后代实际消费 |
| 静态 CSS / 独立家族节点 | 静态 property fallback 保留原生/stylesheet --apollo-layout-*；内部 source 仅隔离已有字段，不新增公共 Token或运行时 CSS-in-JS。独立 Header/Footer/Content 与 Sider 的四主题实际默认值通过；layout + layout-sider 两入口和全量入口四主题几何/paint 完全相同；默认 Header/Sider 文字对比真实 axe 通过 |
| 全 11 Demo / API / migration | 11 成对文件全部核对并保留名称；真实 Menu/Breadcrumb/Button、当前组件字段、四主题、响应式/键盘/交互、strict 模板消费者同步；中英文 API、README、migration 说明当前 Vue 行为与破坏性修正 |

### 终轮源码命令与结果

执行时 PATH 指向 Node 22.22.2 与既有 pnpm shim。全部 fixture 构建只写临时目录，没有包构建、dist 写入、提交或推送。

| 命令 | 结果与证据 |
| --- | --- |
| `pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/layout --maxWorkers=1 --reporter=json --outputFile=/tmp/apollo-layout-four-projects-boundaries-freeze.json` | 7 文件 198/198，通过：contracts 41、index 21、s32 6、Demo 13、DOM 32、a11y 12、theme 73；日志同名 .log。最终清单补测 defaultCollapsed 仅初始化/重挂、缺失 matchMedia、现代/兼容带监听卸载重挂、原生样式更新保持输入选区。保留每条 theme 测试原时间预算，11 Demo 分别覆盖全部四主题，没有提高超时 |
| `LAYOUT_SOURCE=1 LAYOUT_EVIDENCE=/tmp/apollo-layout-contracts-freeze.json node tests/browser/layout-contracts.mjs` | 35/35，Chrome 150.0.7871.125；包括实际 CSS 双入口/全量等价、所有新增边界与真实 axe；0 pageerror/console error/Vue warning |
| `LAYOUT_SOURCE=1 LAYOUT_DEMOS_EVIDENCE=/tmp/apollo-layout-demos-freeze.json node tests/browser/layout-demos.mjs` | 47/47：11×4 主题真实 Demo 与每个主题相应交互/axe，另 375/991/1200 响应式实测；0 运行时错误 |
| `LAYOUT_SOURCE=1 LAYOUT_VISUAL_EVIDENCE=/tmp/apollo-layout-visual-freeze.json node tests/browser/layout-visual-states.mjs` | 51/51：17 个 Apollo 原生 case × 375/768/1440，helper 验证状态、身份、焦点、几何、按钮完整可见及真实 axe；0 运行时错误。这是状态准备器验证，不是正式截图审阅/基线接受 |
| `LAYOUT_SOURCE=1 LAYOUT_TYPES_EVIDENCE=/tmp/apollo-layout-types-root-exports-freeze.json node tests/consumer/layout-types.mjs` | 严格 vue-tsc 根/子路径与全部 11 Demo 正负例通过；明确消费主线程新增的三个根导出类型别名；不依赖旧 dist 声明，不设置 ignoreSourceErrors |
| `pnpm exec vitest run --project types packages/ui/src/layout/__tests__/type.test-d.ts --maxWorkers=1 --reporter=default` | 20/20（10 个类型断言与 10 个运行时断言），exit 0、Type Errors no errors，268.54s；`/tmp/apollo-layout-vitest-types-readable.log`。此前 JSON reporter 运行虽显示 20/20 但 exit 1，保留 `/tmp/apollo-layout-vitest-types-freeze.json/.log`，不计为通过。已告知主线程共享类型临时文件存在并行风险，最终全量类型门禁须串行重验 |
| 所属 Biome check --write | 终轮退出 0，`/tmp/apollo-layout-biome-final.log`；仅格式/安全修复，保留 useTemplate 等 info 提示，无 error/warning |

三个真实 browser reader 均正常退出，证据中 readersExited=true、UI 四个发布 JS/CSS 指纹 before=after；这些局部指纹不代表全仓包产物验收。jsdom 的 canvas 未实现提示未视为真实浏览器验证，真实 axe 规则保持启用。

### 冻结与剩余边界

所属源码、测试、11 Demo、API、migration 与独立 harness 共 53 个变更文件冻结，完整清单和逐文件 SHA-256 交付在 `/tmp/apollo-layout-source-freeze.json`，范围清单为 `/tmp/apollo-layout-owned-files.json`。所有 Layout 专属读取进程均已正常退出。Root 负责根类型导出整合、Registry 状态/证据、visual matrix 与 runner 注册、新鲜发布 JS/声明/双独立 CSS、正式截图及基线审阅、Docs 和最终同一提交全量门禁，未执行前不宣称这些已通过。

新 visual case 是 `tests/visual/render/cases/apollo/layout.js`，没有修改 Vue/React 原参考 case；helper 为 `tests/visual/layout-state.mjs` 的 prepareLayoutVisual。17 variants：basic、side、side-light、collapsible、collapsed、zero-width、standalone、responsive、rtl、current-provider、conditional-trigger、keyboard-trigger、native-focus、native-styles、theme-dark、theme-compact、theme-dark-compact。正式 runner 应导入该 helper，移除 Layout 旧 side/collapsible 的重复截图豁免，完整捕获固定在视口底部的内置按钮。

需共享根导出的类型是 LayoutSlots、SiderSlots as LayoutSiderSlots、SiderEmits as LayoutSiderEmits。任意自定义前缀的 CSS、opaque SSR 包装自动穿透、独立 Menu 整改均不在本轮新增能力内；文档给出预生成样式、显式 hasSider 及外部按钮组合方式。没有尚待用户裁决的阻塞项。

## 共享 fallback 来源补充复核

据主线程报告，前阶段 1966 项共享回归通过后，复核发现同一来源判定遗漏，现单独重开此项；前述冻结与绿色结果保留为前阶段证据。范围仅为 useLayoutTheme 对已存在共享 sourceActive 语义的消费，不增加公共 API，也不修改 producer、共享导出、Registry、视觉矩阵或 dist。

补充清单与验收：Layout/Header/Footer/Content/Sider 在无 Provider 时使用同一 fallback；空配置保持 inactive 且不覆盖 CSS-only，写入非空配置后 active 并消费 Alias/既有 Layout 字段，清空后移除投影恢复继承。当前存在性截断会阻断中间 active 状态，先为五个家族组件建立可失败复现，再仅移除该截断；保留 parentScope 继承和 sourceActive=false 的既有路径。随后执行所属单元回归、严格消费者/类型编译诊断与完整 35 项真实浏览器契约，更新独立补充 freeze；新鲜发布及最终同提交全量门禁仍交主线程。

补充执行结果：

- 红灯：五个家族组件在 sourceActive=true 时均未投影 Alias，5/5 失败，`/tmp/apollo-layout-fallback-red.log`；按名称筛选仅用于这次红灯复现，后续完整回归没有跳过用例。
- 修复：移除 ThemeContextKey 存在性判断及 if(!provided) 截断。sourceActive=false 返回空数据、显式来源元数据缺省的兼容语义、WeakMap 当前数据与 parentScope 继承原样保留；没有引入新字段或全局样式注入。
- `pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/layout --maxWorkers=1 --reporter=json --outputFile=/tmp/apollo-layout-fallback-four-projects.json`：7 文件 203/203，contracts 46 项，新增五项均覆盖空 → 非空 → 清空，并恢复原共享配置；其他 157 项及原时间预算保留。进程 exit 0，日志同名 .log。
- `LAYOUT_SOURCE=1 LAYOUT_EVIDENCE=/tmp/apollo-layout-fallback-browser.json node tests/browser/layout-contracts.mjs`：35/35，包含 CSS-only、父 Layout Alias 继承、空 ThemeProvider 经无配置 ConfigProvider 隔离等原边界；0 运行时错误，readersExited=true，四个发布产物指纹不变，exit 0。
- `LAYOUT_SOURCE=1 LAYOUT_TYPES_EVIDENCE=/tmp/apollo-layout-fallback-consumer.json node tests/consumer/layout-types.mjs`：根/子路径公共正负例与全部 11 Demo 严格编译通过，exit 0。
- `pnpm exec vue-tsc --project /tmp/apollo-layout-fallback-types/tsconfig.json --noEmit`：exit 0、0 诊断；独立临时配置 extends 当前根 tsconfig，保留 strict/noUncheckedIndexedAccess，入口仅为完整 contracts.test.ts 与原 type.test-d.ts，编译其实际导入源码。没有并发占用 Vitest 共享临时配置、忽略源错误或放宽选项。配置及空诊断日志 `/tmp/apollo-layout-fallback-types.log` 保留。
- 所属两源码/测试文件 Biome check --write exit 0，`/tmp/apollo-layout-fallback-biome.log`；后续只读 check 和 git diff --check 同样通过。

补充冻结四个变更文件：use-layout-theme.ts、contracts.test.ts、本审计与所属 migration。新清单及全部 53 文件的当前 SHA-256 为 `/tmp/apollo-layout-fallback-source-freeze.json`；旧 `/tmp/apollo-layout-source-freeze.json` 原样保留，49 个文件无变化。所有本次 reader 已正常退出；没有包构建、dist 写入、提交或推送。Demo/视觉状态准备器的前阶段 47/47、51/51 未在此窄修复重复运行，也未冒充本次发布验证；主线程应在新鲜 Theme → UI 构建后统一发布和最终同提交门禁。

## 正式审图后的浮动按钮演示布局复核

主线程尚未批准旧 51 张 Layout 候选图；正式审图发现 zero-width mobile 的按钮覆盖 Content 标题。旧 helper 只验证了控件可见、容器几何和 axe，漏掉控件与正文文字行的相交关系。本轮范围仅为原生 case、所属 Demo 的空间预留及相应真实浏览器断言，不修改 Layout/Sider 实现、库 CSS/API、旧 Vue/React 参考、Registry、共享 runner/matrix 或 dist，不包构建。

### 修复前完整只读盘点

基准 HEAD `ad70dd7ce368f6a1449c5a6480ae20499ec354df`。完整读取 17 个原生 case 与全部 11 个 Demo；用已冻结的新鲜发布 JS/CSS（3f68 build、b9e5 验证树）执行 363 次实际几何快照，证据 `/tmp/apollo-layout-occlusion-readonly.json`，脚本 `/tmp/apollo-layout-occlusion-audit.mjs`。覆盖正式 mobile 375×667、tablet 768×1024、desktop 1440×900；11 Demo 的四主题 × LTR/RTL；存在浮动按钮时再请求键盘切换。固定受控 zero-width case 的切换请求保持原状态，未冒充已展开；RTL/响应式及两个 Demo 实际切换。0 运行时错误、0 实现源码导入，reader 已退出。

| 必修场景 | 快照 / 相交 | 实际根因与所需调整 |
| --- | --- | --- |
| native zero-width | 6 / 6 | 固定收起布局的浮动按钮覆盖 Content 标题和首段；Content 预留操作行 |
| native responsive | 5 / 4 | mobile/tablet 初始及展开时都有浮动按钮并覆盖标题/首段；跟随实际 breakpoint 状态预留，desktop 无按钮时保留原布局 |
| native rtl | 6 / 6 | RTL 浮动按钮从相反侧进入 Content，覆盖同一标题/首段；使用与方向无关的 block 空间预留，保持控件位置 |
| Demo responsive | 40 / 32 | 四主题、两个方向、小屏收起/展开时按钮覆盖 Home 面包屑；仅 broken 状态预留操作行 |
| Demo collapsible-overlay | 48 / 36 | 绝对定位 Sider 的按钮覆盖 Details/Home；展开和收起均预留操作行，保留该示例的覆盖式面板结构 |

正常原生 case 全量清单（各 3 个正式视口、共 42 次无相交）：basic、side、side-light、collapsible、collapsed、standalone、current-provider、conditional-trigger、keyboard-trigger、native-focus、native-styles、theme-dark、theme-compact、theme-dark-compact。正常 Demo 全量清单（各 24 次、共 216 次无相交）：basic、top、side、top-side、top-side-2、fixed、fixed-sider、custom-trigger、component-token。共 84 次相交，只涉及上述五个落点；没有把无浮动按钮的正常场景一律加空白。

### 修改清单与验收

先为 helper 增加 Range.getClientRects 真实可见文字行与原生触发器 getBoundingClientRect 的严格不相交断言，并保留宽高、完整视口可见性；通过未改布局的原生/Demo 浏览器红灯确认覆盖。随后统一调整原生 case 的三个适用分支及两个 Demo，在 Content 顶部按当前 Alias 按钮尺寸和既有间距预留操作空间；同步两份 Demo 说明。Demo fixture 支持真实方向，持续门禁覆盖两个 Demo 的四主题 × 两方向 × 三视口初始/键盘切换/恢复；原生 harness 使用正式三视口的真实高度。

本轮验收要求全部 17 case、全部 11 Demo 原有检查保留，新旧几何断言通过；新增断言不可通过隐藏/缩小控件、关闭规则或豁免相交实现。需要严格消费者和受影响四项目回归；最后核对库实现/CSS/API、旧参考与 dist 无改动。正式新 bundle、228 候选复捕及审阅由主线程统一，旧图仍未批准。

### 本轮执行与交付

- 先加断言后改布局：`LAYOUT_SOURCE=1 LAYOUT_VISUAL_EVIDENCE=/tmp/apollo-layout-occlusion-native-red.json node tests/browser/layout-visual-states.mjs` 为 43/51、8 个目标失败；`LAYOUT_SOURCE=1 LAYOUT_DEMOS_EVIDENCE=/tmp/apollo-layout-occlusion-demos-red.json node tests/browser/layout-demos.mjs` 为 49/95、46 个目标失败，均 0 运行时错误。失败具体记录按钮与 Content/Current layout content、Home/Details 的实际交叠矩形，没有修改既有断言或参考。
- 布局调整只落在五个已盘点位置：native zero-width/rtl 和 below 时的 responsive，Demo overlay 和 broken 时的 responsive。沿 block 方向预留当前 controlHeightLG 与原有 12px/20px 内容间距，覆盖当前四主题与 RTL；responsive 无浮动按钮时恢复原间距。按钮及库 CSS 的位置/尺寸/语义保持不变。
- 新 helper 使用可见文字行 Range.getClientRects 与表单控件的真实 bbox，逐个和内置按钮 bbox 严格判断不相交；同时验证按钮可见、正尺寸和完整视口内位置。17 原生 case 全部使用该断言，browser harness 采用与正式截图一致的 375×667、768×1024、1440×900。
- Demo 门禁保留原 47 项，并增加两 Demo × 四主题 × LTR/RTL × 三正式视口，共 48 项，初始、Enter 切换、Space 恢复均校验真实状态及 bbox；desktop responsive 无浮动按钮时仍校验正文，不伪造按钮或跳过整个场景。
- `LAYOUT_SOURCE=1 LAYOUT_VISUAL_EVIDENCE=/tmp/apollo-layout-occlusion-native-green.json node tests/browser/layout-visual-states.mjs`：51/51、0 运行时错误、reader 退出、入口指纹不变。
- `LAYOUT_SOURCE=1 LAYOUT_DEMOS_EVIDENCE=/tmp/apollo-layout-occlusion-demos-green.json node tests/browser/layout-demos.mjs`：95/95，保留全部 11 Demo 四主题 axe/原交互，新增 48 项空间与双向键盘场景通过；0 运行时错误、reader 退出、入口指纹不变。
- `LAYOUT_SOURCE=1 LAYOUT_TYPES_EVIDENCE=/tmp/apollo-layout-occlusion-types.json node tests/consumer/layout-types.mjs`：严格根/子路径正负例及 11 Demo 通过，exit 0。
- `pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/layout --maxWorkers=1 --reporter=json --outputFile=/tmp/apollo-layout-occlusion-four-projects.json`：7 文件 203/203，未修改测试预算、DOM 参考或差异豁免；日志同名 .log，exit 0。
- 完整复核脚本再次执行，`/tmp/apollo-layout-occlusion-complete-green.json` 的 363 次快照均无文字交叠，0 运行时错误、0 实现源码导入、reader 退出。与修复前逐键对照，全部按钮坐标、尺寸、展开状态一致；其余 14 原生 case、9 Demo 的正文几何逐项不变。这一补充复核使用冻结发布 JS/CSS与当前演示临时 bundle，不等同于正式新候选图验收。
- 已逐张目视查看 `/tmp/apollo-layout-occlusion-green-images/` 下 7 张 mobile 诊断图：三个原生 case、两个 Demo 的 LTR/RTL。native 标题/正文和 responsive 面包屑避开按钮；overlay 保留绝对面板本身覆盖页面的演示目的，浮动按钮已避开文字行。没有批准或覆盖正式基线。
- 所属 Biome check 与 git diff --check 通过。相对本轮 HEAD，Layout/Sider 实现、公开类型/导出、库 style、旧 Vue/React Layout case 无改动；全部改动是 10 个演示/测试/本审计文件。完整 53 文件的新指纹在 `/tmp/apollo-layout-occlusion-source-freeze.json`，前阶段 manifest 保留。

当前属于源码/演示与定向浏览器验证完成，正式 228 张新 bundle 候选复捕、审阅、Registry/Docs 和最终同提交全量门禁仍归主线程执行。没有包构建、提交、推送或 dist 写入。

## 2026-10-29 · 本轮最终验收

上文保留各阶段红绿及当时的待验收边界；本节记录统一收口。Layout完整清单已验收：发布95/95 Demo、51/51原生状态及严格11个Demo；35/35普通契约按实现未变继承；正式Apollo 51张已审阅批准，批准后严格rawRGBA精确。

[本批最终验收](evidence/space-flex-alert-layout-final-acceptance.json)汇总1978/118关联专项、[本单元发布门禁](evidence/layout-published-verification-final.json)、[正式视觉审阅](evidence/space-flex-alert-layout-native-review.json)、[批准后回执](evidence/space-flex-alert-layout-postapproval.json)及[Docs161+56](evidence/space-flex-alert-layout-docs-local.json)。原759视觉记录和PNG保留，当前完整交付21/72；Input完整API、其他51组件、13基础包逐包审计与全库最终同提交门禁仍开放。Docs为本地真实构建验收，最终部署/线上回执由主线程另记。
