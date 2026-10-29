# Divider 契约整改（2026-10-29）

范围基准：`ea36bd643a94c2fe64c429b99cc26ce328132ccc`。首次只读盘点与红灯取自 `957759fb`；Divider 的 32 个文件 SHA 在两提交间未变。本轮已获整组实现授权；以下清单先于实现记录，不以 Registry completed 或历史对照代替验收。

## 范围与规范

已读 AGENTS、ARCHITECTURE、COMPONENT-RULES、COMPATIBILITY、TESTING、WORKFLOW，以及已接受 ADR 0005、0007。修改范围仅 Divider 运行时、样式、类型、六个现有测试文件与必要新增测试、九对 Demo、双语 API、本文和独立迁移记录。不改根导出、Registry、矩阵、共享 theme/ConfigProvider、旧 DOM/PNG 基线；不构建、不写 dist、不批准截图。

盘点覆盖主组件、组件入口/公开子路径、类型、样式与 Token、全部测试和九对 Demo，共 32 文件；生产消费者为 ColorPickerPanel（`presets` 为数组时，包括空数组）；另有 21 个其它组件 Demo、Space 分隔符测试/原生视觉及保留的参考输入。MenuDivider 是另一实现，不计作本组件子件。

## 完整接口清单

| 项目 | 声明 → 传递 → 消费 | 分类与边界 |
|---|---|---|
| prefixCls | 可选完整组件前缀 → 当前 getPrefixCls → 根、rail、content 类名 | 基本用例正常；保留响应性；仅静态 CSS 前缀生成，D04 全局策略另案 |
| orientation | 方向优先于 vertical/type；运行时另接受旧标题位置 | 方向表已有通过；文档旧位置与类型拒绝矛盾需集中对齐，保留旧运行时通道 |
| vertical | 默认 undefined → 明确布尔判据 → 方向 | 已验证未传与 false 分支；API 默认值表不得误写成会压过 type 的 false |
| type | deprecated 方向 → orientation/vertical 之后 → 实际方向/告警 | 保留并回归；不删旧值 |
| titlePlacement | start/end/center/left/right → 有效方向折算 → 标题/rail | 本地静态正常；Provider 当前值、初始 RTL 实际方向必修；双语表遗漏 left/right |
| orientationMargin | 数字/字符串 → start/end 长度归一 → content margin 与 rail 变体 | 数字、整数数字串、单位串和 0 已验证；center 无效是现有明文边界；有符号/小数字符串边界须明确 |
| dashed | 布尔 → 根类 → 线型 | 单独与同名 variant 正常；与 dotted 同时设置的有/无标题结果不同，需明确优先级 |
| variant | solid 默认/dashed/dotted → 根类 → 根或子 rail | 单独形态正常；保留默认外观，不凭上游限定实现 |
| size | prop ?? 响应式 SizeContext → sm/md 类 → 水平 margin | 静态正常；medium/middle 均保留；vertical 不适用；全部当前来源与更新待最终验收 |
| plain | 布尔 → plain 类 → 标题正文样式 | 基本通过；无标题不适用 |
| classNames | 对象/函数 → Provider 与本地拼接 → root/rail/content | 初始与本地更新通过；Provider 整体替换/移除必修 |
| styles | 对象/函数 → Provider、本地合并 → root/rail/content | 初始优先级与本地函数更新通过；Provider 当前值必修；原生 style 始终最后 |
| default slot | `() => VNodeChild` → 读当前槽 → 水平标题宿主 | 必修：computed 缓存槽存在性，使增删失效；完整标量、Fragment、控件和本地更新身份已有正控制 |
| emits / v-model | 无业务事件/模型；原生监听由 attrs 到根 | 不新增事件；原生 listener 替换已验证单发 |
| attrs | class/style/id/ARIA/listener → mergeProps → 单一 div | 当前原生 class/样式字符串/attrs/listener 更新正控制通过，不把 computed 形式本身当缺陷 |
| expose / install | nativeElement → 实际 div/null；withInstall → ADivider | 基本 ref、入口、安装存在；卸载/多实例/SSR/水合须补适用实测 |
| Provider | prefix/direction、divider.className/style/classNames/styles、componentSize | getPrefixCls/useSize 有活来源；setup 解构导致 direction 与组件配置快照冻结，必修 |
| Theme source | 最近有效 ThemeContext / 默认来源 → 别名 → 11 个 CSS 消费项 | 必修：当前未读取来源，TP 不注入无效、显式空 TP 不复位；CSS-only/no-theme CP 必须保持 |
| 三个 Component Token | prepare 默认值/ThemeConfig.components.Divider → 实际 CSS | 必修：三个配置均未消费，并非只缺两个；本组件可用局部变量实现，无需基础包反向依赖 UI |
| RTL / a11y | 当前方向/轴 → 实际 CSS、物理标题、separator 语义 | 必修：初始 RTL 仍是 LTR；垂直 separator 缺 aria-orientation；不保留上游错误作为约束 |

11 个 CSS 别名：colorSplit、colorText、colorTextHeading、fontFamily、fontSize、fontSizeLG、lineHeight、lineWidth、margin、marginLG、marginXS。三个组件 Token：textPaddingInline、orientationMargin、verticalMarginInline。默认值与已有合理几何保留，按当前有效来源和局部原生变量覆盖。

## 复现、分类与同根因

临时只读证据位于 `/tmp/apollo-divider-readonly-audit/`，未写仓库实现。五个现有运行时测试文件共 153 条断言通过；首次合并临时探针命令 exit 1 来自临时路径收集错误，不能写成整条命令通过。独立探针最终 13 条：5 通过、8 失败；其中 3 个完整 CP 的 VTU 身份失败在真实浏览器不复现，不作为共享 CP 缺陷。剩余探针与真实浏览器交叉证明本组件问题。

真实 Chrome 使用 Vite dev server（无 build/dist）：11 项中 3 个正控制通过、8 项失败，控制台错误 0，读者已退出。正控制为 CP 别名 CSS、CSS-only + no-theme CP、当前 CP 下输入 DOM/草稿/焦点/选择保持。

| 缺陷 | 可失败证据 | 本轮必修 |
|---|---|---|
| DIV-01 | 条件槽无→有仍无标题；有→无仍保留标题结构 | 槽存在性在 render 中读取；根 rail/内容路由、告警同步更新 |
| DIV-02 | 同一原生输入保留，但 Provider 更新后 class/rtl/titlePlacement 全旧；直接 reactive provide 也失败 | 保留 config 视图，在消费点读取当前值；验证替换、移除、嵌套与函数语义 |
| DIV-03 | 初始 RTL 实际 computed direction=ltr，left 标题在右 | 有效方向落到真实根；物理/逻辑位置与当前方向一致 |
| DIV-04 | Token padding 31→16px、比例 .25→.05、vertical margin 31→8px | 三 Token 成组接通、验证边界和原生覆盖，不借文档改名规避 |
| DIV-05 | 无 CSS 注入 TP 的 22/31/3 仍 14/8/1；TP{} 继承 23/37 而非复位 14/8 | 有效源写所属别名与私有变量；无源不遮蔽 CSS-only；动态 reset/active/default fallback/多实例 |
| DIV-06 | 垂直 separator 的 aria-orientation 为 null | 正确轴语义及动态切换；保留有价值旧 DOM 参考并精确记录新差异 |
| DIV-09 | 真实浏览器 vertical Demo 两个链接对比度仅 4.1；jsdom 冒烟未覆盖真实颜色 | 本 Demo 继承正文颜色并保持下划线；不改共享主色，不忽略 contrast 规则 |
| DIV-08 | 新增真实标题输入使 axe 报 nested-interactive：root separator 包了原生控件 | 水平标题根改为 group；空 start rail 保留分隔语义，end rail 装饰隐藏；不重建根/标题/控件，不删 Demo 控件或关规则 |
| DIV-07 | API、README、Demo、测试注释仍称 CP 不存在、只有两个 Token 无效、需全局改 theme、静态带 ant、L2 全不适用 | 同步真实契约、九对 Demo 与回归证据；正式自有视觉不能冒充已有通过 |

集中说明后采用的修正规则：`Orientation` 仍仅指 horizontal/vertical，`DividerProps.orientation` 补齐文档已经描述的旧标题值，保留告警，并用真正非法的 diagonal 替代旧 center 类型负例；dashed + dotted 保留现有类名但明确 dotted 控制实际线型，不再因有无标题而改变优先级；无单位数字串明确为含符号/小数的十进制数字，兑现文档的 px 转换，其它 CSS 长度通道与 0 保留。这些不删除既有运行时接口。保留 medium/middle、物理 left/right、两个 deprecated props、垂直不渲染标题的现有契约。不夹带 Resizable Divider、拖拽/新模型、自动运行时生成任意 prefix CSS、共享 Theme 写契约或默认 context 隔离。

同根因检查：此处 slots.default 的 computed 存在性缓存为当前精确匹配；其它组件的 useComponentConfig 解构命中只是审计线索，不凭字符串判为缺陷，不扩大本组件所有权。shared useComponentConfig 已是活 Proxy，B7 已接受组件本地 CSS 变量声明；无需为本组件重写共享层。ColorPicker 的已开面板、Space 的垂直 separator 是本轮关联回归。

## 九对 Demo 盘点

| Demo | 当前场景与验收关注 |
|---|---|
| horizontal | 两种水平线；保留真实正文、线型、实际间距 |
| with-text | center/start/end 与 content margin；补当前内容/配置时不丢业务输入 |
| size | small/medium/large；medium/middle 的公开等价均须测试，文案不外包给上游弃用节奏 |
| plain | 标题正文样式；按实际字体、颜色比较 |
| vertical | 两个方向入口和链接；补轴语义/焦点无回归 |
| customize-style | 横/竖原生边框及受限容器；检查真实布局、attrs 与裁切 |
| component-token | 当前绕过真实组件 Token；改用真正当前配置展示三个有效值及复位 |
| variant | solid/dotted/dashed；冲突规则明确并有真实 rail 样式断言 |
| style-class | 三语义槽对象/函数；当前 Provider 与本地函数、原生优先级可观察 |

## 验收标准与交付边界

1. 先保存可失败红灯，再成组修复运行时、CSS/Token、类型、测试、Demo/API 和迁移记录；不覆盖旧 DOM JSON/React PNG。
2. 保留原生默认内容：0、空串、数组/Fragment、交互元素；条件槽反复插拔、本地变化与当前 Provider 更新保持仍应存在的 DOM、草稿、焦点、选择、ref；卸载重挂和多实例隔离。
3. 十二 props/优先级/default、全部 classNames/styles/attrs、两个 deprecated 通道、有效 axis/direction/三 Token/11 别名均追踪至实际消费；覆盖受控更新、配置替换/清除、近源、显式默认、CSS-only 与无 Provider fallback。
4. 保留原 153 条运行时回归与 53 个 DOM 参考场景；24 个带标题场景精确记录 group/start separator/end decoration 的三项语义差异，五个垂直场景精确记录 axis 属性；调整错误断言须写契约与替代覆盖。16 个类型用例/13 条有原因负例需检查；后续类型改动使用真实错误负例，不能只删旧断言。
5. 实际浏览器验证布局、三 Token、默认/暗色/紧凑/组合/嵌套、RTL、轴语义、原生焦点与九个真实 Demo；Node SSR/水合无 DOM 全局访问、无不解释告警或身份丢失。源码检查不能冒充产物检查。
6. 根统一执行发布入口/声明/CSS/体积、正式视觉与 Docs 验收。本次盘点读取 Apollo 批准图中 Divider=0、保留 React 参考 PNG=24；未生成或接受任何图，不能沿用旧 visualStatus 当本轮通过。
7. 提交前提交所有权文件 SHA、逐命令真实 exit/JSON、红绿证据、未验证边界；生产/测试文件冻结后交根统一 published + visual + Docs。不构建、不写 dist、不更新 Registry/矩阵/共享层。

## 实施与验证

源码整改已实现并完成本单元验收，当前工作树 HEAD 为 `d87f84c7ab3b6728f0a98b06fad3ec08852b4eea`；本单元修改尚未单独提交。上述接口表保留动手前的分类，以下记录收口状态。最终文件 SHA、依赖输入 SHA 与证据 SHA 分别保存在 `/tmp/apollo-divider-source-freeze.json` 和 `/tmp/apollo-divider-source-receipt.json`，集成提交由根任务记录。

- DIV-01/02：默认槽键在 render 读取；保留当前 Provider 视图，语义回调读取有效 props。反复条件插拔、配置替换/移除、原生 attrs/listener 替换、根 ref、完整 Fragment/标量和输入草稿/焦点/选择均有回归。有效轴、位置和尺寸的优先级保持。
- DIV-03/06/08：当前 Provider direction 与原生 ltr/rtl dir 到达真实根，物理 left/right 的布局已经浏览器核验。垂直根声明实际轴；水平标题使用 group、空 start rail 使用 separator、end rail 隐藏装饰。原 div/span/rail 与业务输入身份保持。53 个历史 DOM 场景全部执行，24 个标题场景只允许精确三项语义差异，五个垂直场景只允许新增轴属性；既有前缀和零长度序列化差异保持精确断言，没有重录基线。
- DIV-04/05：新增本组件 `use-divider-theme.ts`，按有效 ThemeContext 投影所消费的 11 个别名和三个组件 Token；私有变量随所属完整前缀更新。无源不读 token、不遮蔽 CSS 继承；有效来源无 metadata、inactive→active、显式空 ThemeProvider、空 ConfigProvider theme 继承、清除、默认 fallback、暗色/紧凑/组合和多实例均覆盖。无运行时 CSS 生成或 DOM 写入，静态 CSS 保留原默认几何和标题字重 500。
- 边界集中修正：十进制数字串兑现 px 转换，非有限数不写非法长度；三 Token 的默认、零、有限比例范围和表达式按文档消费；dashed+dotted 的真实根/标题 rail 均由 dotted 决定。legacy orientation 类型通道补齐，Orientation 轴类型、两条 deprecated 通道、medium/middle、left/right 保留。
- DIV-07/09：双语 API、README、类型说明和九对 Demo 同步当前契约。Token Demo 通过三个原生 range 控件、启用开关和复位消费真实配置；标题 Demo 保留原生输入并反复更新槽；语义 Demo 的尺寸选择器实际触发函数；垂直链接使用正文色与下划线，真实 contrast 红灯得到修复。九个 Markdown 代码段与对应 Vue 逐字一致，仅包导入改为公开名称。

本组件十二 props、slot、无业务 emits/v-model、attrs、ref/install、Provider、三语义区、三 Token、11 别名、RTL/a11y、九对 Demo 的适用清单均已核对。ColorPickerPanel 的 `Array.isArray(presets)` 链路已逐源码确认，包括空数组分支；实际关联回归选择已有的已打开非空 presets 用例和 Space 的垂直 Divider 插槽用例。其它组件和共享层不据此宣称整单元通过。

### 实际命令与结果

以下命令在仓库根执行，使用 Node 22.22.2（`PATH=/tmp/apollo-f01-bin:/Users/nanren/.nvm/versions/node/v22.22.2/bin:$PATH`）。临时 config 只规定范围、源码 alias、根 setup 与输出位置；没有降低超时/断言或忽略诊断。没有执行 build，也没有读写 dist。

| 检查 | 命令 | 结果与原始证据 |
|---|---|---|
| 全部本组件运行时 | `node node_modules/vitest/vitest.mjs run --config /tmp/apollo-divider-readonly-audit/source.config.mjs` | exit 0；7 文件 180/180（含原 153 个场景，a11y 新增 1、contracts 12、source-theme 14）。`/tmp/apollo-divider-readonly-audit/source-unit.json`、`source-unit-verified.log` |
| 严格源码类型 | `pnpm exec vue-tsc --noEmit -p /tmp/apollo-divider-source-types/tsconfig.json` | exit 0；真实运行时/样式、全部测试 TS、18 个类型用例及 14 条带原因负例、九套 Demo 逻辑。`/tmp/apollo-divider-source-types/result-frozen.log`；原始 Demo SHA 与完整严格配置见同目录 metadata/config |
| 真实浏览器及水合 | `DIVIDER_BROWSER_EVIDENCE=/tmp/apollo-divider-source-browser-frozen.json node packages/ui/src/divider/__tests__/browser.mjs` | exit 0；67/67，errors=0，readersExited=true。相邻 `.log`、`.exit.json` 与 JSON 保留实际退出码、几何/颜色/内容；九套真实 Demo 均在 375/1024 检查交互、横向溢出与全部 axe 规则，另验证实际 Node SSR→hydrate 及后续配置更新的原生身份/草稿/焦点/选择 |
| 真实 Node SSR | `DIVIDER_SSR_EVIDENCE=/tmp/apollo-divider-source-ssr-verified.json node packages/ui/src/divider/__tests__/ssr.mjs` | exit 0；22/22，warnings=0，browserGlobals=false，readersExited=true。相邻 `.log` 与 JSON |
| 关联消费回归 | `node node_modules/vitest/vitest.mjs run --config /tmp/apollo-divider-readonly-audit/related.config.mjs` | exit 0；定向 2/2，未选择的 46 个其它场景不计通过。`related-consumers.json` 与 `.log` |
| 静态与文档一致性 | `pnpm exec biome check packages/ui/src/divider`；对五个 `.mjs` 执行 `node --check`；逐字比较九对 Demo | 检查结果记录于 receipt；没有覆盖其它作者文件 |

严格类型和浏览器的源码路径使用最小真实 UI barrel（Divider + ConfigProvider），其它依赖仍使用实际源码，没有 stub。它们不验证整个根导出或发布入口；隔离方式与九套原 Demo SHA 已记录在 metadata/浏览器 JSON，不能当作完整 UI 根类型或产物检查。

### 失败与纠正记录

原 11 项只读浏览器红灯见 `/tmp/apollo-divider-readonly-audit/browser-red.json`；owned 回归初始 4 项中 3 项失败，见 `owned-red.json`。修复后的第一次旧回归有五个垂直轴差异与一条旧字面 CSS 断言失败，随后按明确契约保留精确差异，并以真实 CSS 消费替代过时的字面值假设。新增完整标题输入触发真实 axe nested-interactive 后修正语义（DIV-08），没有删除输入或关闭规则。

九套 Demo 首轮浏览器 63 项中两个 vertical 对比度失败（375/1024），见 `/tmp/apollo-divider-source-browser-contrast-red.json`；只修本 Demo 的链接颜色后 65/65 通过。新增水合后首次被 Vite 临时路径 `/var` 与 `/private/var` 的 403 拦住（`/tmp/apollo-divider-source-browser-complete.log`），尚未到组件行为；临时目录改用 realpath 后最终 67/67 通过。浏览器控制台错误和所有读者退出均有最终断言。

jsdom 运行时日志仍有 axe 尝试 Canvas `getContext` 时的既有环境提示；未安装 canvas，jsdom 不承担实际颜色对比度结论。真实浏览器执行未禁用 axe 规则并且 errors=0。

一次同时运行多项检查时旧 componentSize 用例触发原 5 秒超时（`/tmp/apollo-divider-readonly-audit/source-unit-complete.log`；该次 JSON 使用相同 outputFile，已被最终重跑覆盖，保留日志不能独立还原超时断言明细）；保留原超时、原两 worker 和全部断言，单独重跑 180/180 通过。早先隔离类型还暴露了共享 ConfigProvider 的 ValidateMessages 不兼容，已交共享层作者修复后原严格命令通过；本轮没有改共享层或屏蔽该诊断。

### 剩余边界

已验证的是上述源码和实际浏览器/Node 行为。发布声明/入口、冻结产物与公开 CSS、正式 Apollo 视觉批准、Docs 成品验收和最终同提交全库门禁仍由根任务统一执行，本记录不宣称这些已通过。源码浏览器虽检查两种宽度、溢出与实际 paint，不能代替正式截图审阅；首次盘点没有已批准的 Divider Apollo 图。Registry/矩阵未由本单元更新，等待根按真实最终证据处理。没有提交、推送、合并、标签或发布。
