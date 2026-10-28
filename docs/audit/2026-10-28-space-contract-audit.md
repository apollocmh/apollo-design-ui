# Space / Compact / Addon 当前契约审计 · 2026-10-28

状态（2026-10-29）：源码/fixture/自有视觉模块与 helper 全部冻结。Space 生产与 fixture 由主线程提交为 `e0062edd`，关联 Select 窄修正为 `356161b4`。起点为 `1b361487`；本任务没有构建 UI/root/package dist、修改共享 Registry/导出或提交推送。源码验证不构成发布产物、正式视觉或全库验收。

## 2026-10-29 交叉审图重新确认的必修边界

正式75张候选经逐图查看，紧凑/暗色紧凑主题的Input与Button实际高度不齐；独立Input复现，根因为当前Alias与默认私有字号/padding混用。Addon underlined底边为0，逐项paint与borderless相同；原160矩阵将二者合并要求none，不能循环证明underlined有效。现明确underlined应仅画当前主题底线、保留状态/禁用优先级，borderless仍无边框。两项均本轮必修，分别在Input关联链和Addon完整变体矩阵成组修正。

本报告下方“收口”“正常”是相应源码阶段的既有测试结论，不覆盖此次已复现的尺寸和底线缺口。整单元继续testing，75张未批准；当前四主题/三size/多视口与逐项paint证据见 `/tmp/apollo-space-addon-review/report.md`，修复/最终重验另记。

## 范围与验收标准（先于实现）

整改单元包括 `packages/ui/src/space/**`、所属源码/消费类型/SSR/浏览器测试、十五个 Demo、双语 API、迁移说明及独立 Apollo 视觉模块。共享紧凑消费者只读取和测试，缺陷交主线程协调。保留现有有效公开 Props、别名、VNode 数据、原生 attrs / 事件、样式入口及参考证据；不增加 React 内容函数通道、不为数量新增 ComponentToken。

验收：动态默认/分隔插槽新增、替换、移除、故意留空均即时响应；Provider 配置替换/移除恢复当前值；外观/主题切换、合法 key（含 Symbol）重排保留业务实例、输入草稿及焦点；separator/split 类型、实现、文档一致；全部紧凑消费者接收实时 size / direction / first / last 与隔离；Addon 四变体×状态×禁用的实际颜色及横纵连接正确；default/dark/compact/组合/嵌套主题 Alias 实际消费；十五个真实 Demo、SSR/水合/重复挂卸/多实例及可访问名称适用覆盖。源码通过与待发布构建/正式视觉分列记录。

## 修前完整清单与声明 → 传递 → 消费

| 项目 | 当前链路与分类 | 验收路径 |
| --- | --- | --- |
| Space prefixCls | prop → ConfigProvider getPrefixCls → 根/item/separator 类名；setup 解构 getPrefixCls 待动态核对。本轮必修外观驱动 item key | 动态全局/局部前缀、classNames、焦点 |
| Space size | prop ?? 当前 space.size ?? small → 预设类/数字双向 gap；0、NaN、middle/medium、元组保留。静态链正常，待运行验证 | 原用例＋动态配置/真实 CSS |
| orientation / vertical / direction | 共享 useOrientation，orientation > 显式 boolean > legacy direction；Space、Compact 同用，弃用告警保留 | 原方向矩阵、动态切换 |
| align / wrap | 水平默认 center，垂直默认不对齐；wrap 目前无方向限制，文档称只水平有效。需复现并统一有效行为 | 横纵布局、wrap 动态 |
| separator / split | 公开双语 VNodeChild，导出类型 string；computed 调槽与真值过滤丢失 0；空槽优先级待复现。本轮必修 | 完整 VNode/数字/空槽、动态槽、类型正反例 |
| default slot / Item / SpaceContext | computed 调用并缓存 slot → toArray keepEmpty → Item → normalizeNode；latestIndex computed 提供给 Item。条件槽/重排/实例身份本轮必修 | 原假值/片段回归＋SFC 条件槽、可编辑子组件 |
| semantic classNames/styles | useMergeSemantic 接对象/函数，合并后的 size/orientation/align 传 callback；Provider className/style/classNames/styles setup 快照。本轮必修 | Provider 整对象替换、移除、props/attrs 优先级 |
| native attrs / expose | 三根 div 显式 attrs 路由；原生 class/style/listener/ARIA，nativeElement 可空；无业务 emits / model。静态链正常，待运行验证 | attrs 单独改变、原生点击一次、ref 空/恢复 |
| Compact props / slot | prefix、size、三方向、block；render 调槽 → toArray → 无 DOM CompactItem；context 转发首尾合取。键丢 Symbol/耦合 prefix 本轮必修 | 嵌套、空值、显隐、size/rtl、草稿/焦点 |
| CompactItem / NoCompactStyle | typed ComputedRef 注入；size、direction、isFirstItem、isLastItem；隔离值 null 盖过外层，纯 provider 无宿主。静态链正常，待运行验证 | 多实例、嵌套、隔离、卸载重挂 |
| Addon props / slot / ref | prefix、variant、disabled、status → 根类；完整默认槽，当前 compactSize 消费；样式无 vertical 选择器。本轮必修纵向连接与 Alias 作用域 | 变体/状态/禁用矩阵、首中尾/独项/rtl、真实 CSS |
| styles / tokens | 静态 CSS＋Alias；ComponentToken 为空，prepare 返回 {}，保持。根缺少当前局部 Alias 写入，本轮复现并修复 | 预设 gap、Addon paint、嵌套主题/卸除、SSR |
| exports / aliases | Space 默认/具名及 .Compact/.Addon，ASpace/ASpaceCompact/ASpaceAddon；上下文/工具/类型导出，space CSS 已在 package exports | 源码类型和安装别名；发布由主线程统一 |
| Demos / API / README | 十五个 Demo 大量使用尚未实现组件的旧替身说明、固定颜色、旧 CSS export 结论。当前组件已存在，本轮替换真实用法并同步文档 | Demo mount/axe/源码类型/浏览器主题及交互 |

## 所有真实紧凑消费组（源码实查）

1. Button：compactSize 与 classnames → 当前 size / 根按钮，已静态核对。
2. Input / TextArea：compactSize 与 classnames → 实际输入/textarea 宿主；Search 消费 size 并组合真实 SpaceCompact；InputGroup 以 SpaceCompact 组合。
3. InputNumber：内部消费者读 size/classnames；legacy addons 使用 SpaceAddon＋SpaceCompact，保持单独注入边界。
4. Select：目前只读 classnames，mergedSize 仅 props ?? Provider，疑似遗漏 compactSize，须复现后协调共享修复。
5. Cascader / TreeSelect：compactSize 与 classnames → mergedSize / selector 宿主。
6. DatePicker / RangePicker（TimePicker 复用）：compactSize 与 classnames → mergedSize / picker 宿主。
7. ColorPicker：compactSize 与 classnames → 当前触发器。
8. SpaceAddon：compactSize / classnames → 根 div / 静态 CSS，纵向缺规则待复现。
9. FloatButtonGroup：紧凑布局由 SpaceCompact 组合，协议/DOM 需关联回归；不扩成本轮完整 FloatButton 审计。
10. NoCompactStyle 为公开隔离工具；现有文件无实装的 ContextIsolator 消费者（早期说明待核实），测试必须实际使用隔离工具。

不适用：Space 系列无受控/非受控业务值、无选择行为、无定时器/观察器，无需添加 model 或事件层。原生交互仍需保留 DOM 事件和焦点。另案：任意自定义前缀的自动 CSS（D04），不在本轮新增运行时 CSS。待裁决项：当前无新增公共能力提案。

## 实施与验证记录

### 分组红灯与修复

| 编号 | 复现与根因 | 本轮结果 |
| --- | --- | --- |
| SPACE-01 | 条件默认/分隔槽缓存于 computed；separator/split 的 string 类型违背原 VNodeChild API，0 被真值过滤 | render 读取当前槽；故意空槽优先；保留完整 VNode 数据、0 和数组，不接受函数 prop；原始 React 基线不动，精确登记仅 separator:zero 多一个语义宿主 |
| SPACE-02 | Provider class/style/semantic 解构快照与配置移除边界 | 通过当前 getter/computed 合并；真实 Teleport 下配置替换/移除保持输入实例、草稿和焦点；原生 attrs 最后合并 |
| SPACE-03 | item key 与外观耦合、丢 Symbol、展平丢 keyed Fragment 的作用域、Compact 空文本占边；真实 DOM move 使聚焦输入退回 body | 当前身份树保留 keyed 作用域/无 key 位置身份，移除项不留历史缓存；不修改 shared utils；忽略空文本；原生生命周期仅恢复仍所属且退到 body 的焦点 |
| SPACE-04 | ThemeProvider 不注入 CSS 时三组件无法消费当前 Alias；Addon 纵向无规则、独项丢角、重复边框删除；状态文字实际对比度不足 | 三根桥接当前 Alias，不新增组件 Token；首尾依据上下文、横纵/RTL/独项正常；statusText 与当前 colorText 等量混合得到可读状态文字，边框/背景/disabled 优先级保留 |
| SPACE-05 | Select 丢 compactSize；固定白色 selector 背景与暗色 chip 白字形成 1.12 对比度 | 主线程授权的三个共享文件窄修正已单独提交；本地 size > 当前 Compact > Provider，CSS selector 背景用现有 colorBgContainer，原生变量仍优先；不宣称完整 Select 审计 |
| SPACE-06 | 十五 Demo 大量旧替身与固定默认颜色，文档旧 CSS export/内容说明 | 全部使用实际 Apollo 控件和公开包入口，配对 Markdown 与双语 API/迁移同步；旧 helper 引用归零后移除 |

初次 24 回归 12 红/12 绿，其中两条 Cascader/TreeSelect 根前缀预期写错，已明确作为测试错误修正；不能算产品缺陷。全局 Teleport stub 重挂内容不是产品身份依据，Provider 回归使用真实 Teleport。补充 keyed Fragment/空文本三条修前全红；真实浏览器再复现 Compact 移动焦点失败，修后保留草稿、选择和焦点。原始红灯及这些边界说明保存在 [space-red.json](evidence/space-red.json)。

### 完整清单复核

- Space：全部 11 个 Props、默认/分隔槽、三语义区域、所有方向别名/布尔优先级、预设/数字/0/元组、wrap、当前 Provider、attrs、可空 nativeElement、空内容/片段/键/反复显隐已收口。wrap 保留既有 flex-wrap 行为，纠正文档的“只水平有效”；纵向需要有界高度。
- Compact：全部六个 Props、无 DOM 子项包装、当前 size/direction/首尾、嵌套合取、NoCompactStyle、多实例与空文本/数字 0、ref、稳定键/焦点已收口。原生安装名和静态别名有实际安装断言。
- Addon：全部四个 Props、完整默认槽、原生 attrs/ref、当前 compactSize、四变体×五状态×禁用、横纵/RTL 首中尾及独项、可读状态文字已收口。布局单元格不自动禁用槽中的控制器、不增加表单语义。
- 消费者：12 个真实控件入口有 current small→large 和实例保持回归；InputGroup、legacy-addon InputNumber、FloatButtonGroup 的组合链已实查，并运行 Input/InputNumber/FloatButton 与其他受影响组件的既有回归。没有改消费者完整 API。
- 静态 CSS / Alias：默认、dark、compact、组合、局部 Alias、原生变量优先级、当前配置移除、SSR/水合均有实际消费证据。ComponentToken/prepare 空对象保持，三个 gap Alias 不新增不改名。
- 不适用项：无 model/业务 emits/开放关闭状态、无观察器/定时器；未新增这些 API。任意前缀自动 CSS（D04）仍属既有另案，无新待裁决公开能力。

### 实际验证与对应边界

| 命令/证据 | 结果 | 含义 |
| --- | --- | --- |
| 关联四 project 源码检查，maxWorkers=1 | 834/834，通过 | Space、Select 与 Button/Input/InputNumber/Cascader/TreeSelect/ColorPicker/DatePicker/FloatButton 关联链；详见 [runtime](evidence/space-runtime-source.json)。最终 CSS 文字混合后另补 Space 定向复查，不能将不同源码点拼成全库结论 |
| Space 公开类型 project | 44/44，exit0 | 完整 VNode 正例/函数负例、Props/Ref/别名/语义类型；[types](evidence/space-types-source.json) |
| `SPACE_SOURCE=1 node tests/consumer/space-types.mjs` | exit0 | 公开根入口、Vue SFC 正反例及十五个真实 Demo 的严格源码类型；不是发布 d.ts |
| `SPACE_SOURCE=1 node tests/browser/space-contracts.mjs` | 82/82，零 page/Vue 错误 | 四主题当前 Alias/原生变量、160 Addon 绘制组合、横纵/RTL/独项、焦点/键作用域、60 Demo 主题 axe、输入/选择/尺寸交互、四态 SSR/水合；[browser](evidence/space-browser-source.json) |
| 自有视觉模块临时源码 harness + prepareSpaceVisual | 75/75，零 page/Vue 错误 | 25 状态×320/768/1280，验证实际内容、几何、焦点和 axe；没有生成/批准 PNG，不是正式视觉；[visual smoke](evidence/space-visual-source-smoke.json) |
| Scoped Biome check | 42 files，exit0 | 生产、测试、browser/consumer/visual 模块无新增格式或 lint 错误 |

首次关联检查为 745/749，四红全是旧 theme helper 把十五个真实 Demo 连续放在一个 5s it 超时。改为每 Demo 独立四态测试，保留十五数量、全部 warning 断言和原 5s 阈值；没有删除场景或提高阈值。保留 [第一次结果](evidence/space-runtime-first-sweep.json)。

原始 DOM/React PNG 全部保留。Addon 状态文字新对比度与 native-focus 自检有实际红灯；focus helper 起先错误要求 Input 必须有阴影，实测本例使用变色边框，现按真实焦点和边框前后差异验证，不修改 Input。

### 正式视觉集成与交接

正式模块：`tests/visual/render/cases/apollo/space.js`；状态 helper：`tests/visual/space-state.mjs`。运行时有 25 键，其中四个 align 状态由 Object.fromEntries 生成（静态字面 parser 只看到 21 键）；完整 keys 在 visual smoke 的 variants。主线程已获知补入四种 align。共享 matrix/manifest/runner/基线未由本任务修改。

无根 index type/value 导出新增要求。源码摘要位于 [freeze](evidence/space-source-freeze.json)。生产和所有 fixture、visual 模块/helper 已停止编辑；只记录本报告与验证 JSON。关联 Select 的生产与窄证据由主线程独立提交。

未验证：统一发布构建/L7、发布 JS+CSS 浏览器、发布 d.ts、正式 Apollo 候选逐张审阅/批准/复比、Docs 构建/线上回执、最终同提交全库门禁。等待主线程明确 dist-ready 后才能执行发布读者，当前没有读取旧 dist 或注入源码 CSS 冒充发布证据。此阶段不是全库或 Space 全维完成标记。

## 主线程集成保存点

生产实现已提交e0062edd，Select关联356161b4。冻结生产源码的UI/Overlay构建通过；UI严格L7在登记Descriptions两个真实运行时几何变量、按当前Alias作用域与稳定身份/焦点的31.5KB功能成本仅调整Space预算25→33KB后，11项零失败/零待定。其余72条预算、历史13.1KB测量和全量占比门禁保留。源码/发布行为与正式视觉、Docs、全库最终门禁分开记录，不将构建通过当作整改单元完成。
