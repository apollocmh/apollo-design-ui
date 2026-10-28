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
