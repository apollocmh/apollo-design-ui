# Badge / Ribbon 当前契约盘点与整改单元

基线：`b20af70a`。当前源码逐文件核对，历史 PLAN、上游快照和 Registry completed 不作为外部规格。Typography 已统一验收并发布，本单元不重开其范围。

## 范围与验收

范围是 Badge、Ribbon、私有 BadgeIndicator / ScrollNumber / SingleNumber、现有九 Token、十三原 Demo、双语 API、公开导出与实际消费链路。没有业务 emits / v-model / 内部可编辑状态；输入、链接和按钮由业务内容拥有，必须保留其身份、焦点、草稿及原生事件。受控面是 props 和条件插槽随父级变化，不制造内部镜像模型。

先建立成组红灯，再修改实现。统一验收需要相关 unit / DOM / theme / a11y、公开类型和根严格检查、发布声明与 CSS / L7、真实浏览器的动画/内容/样式/主题/可访问性、SSR / 水合、十三原 Demo 和实际消费者。自有视觉候选必须清洁提交捕获、逐张审阅及复比；原参考 HTML / PNG 不改，必要原生差异逐项精确登记。文档发布与线上验证附回执。局部绿灯不代表全库门禁通过。

## 完整源码清单

| 声明面 | 声明 → 传递 → 消费 / 实际行为 | 分类与验收路径 |
| --- | --- | --- |
| Badge prefixCls / scrollNumberPrefixCls | Badge 全量转交 Indicator；两 computed 分别供根/状态/动效及数字子组件 | 验证本地/Provider 更新、移除、相关前缀；任意前缀完整静态 CSS 仍属 D04 |
| count / overflowCount | prop 或 #count → numberedDisplayCount → 三组离场缓存 → ScrollNumber → SingleNumber；只 number 封顶 | 原封顶/0/字符串保留；必验负号、完整 VNodeChild、反复变化、动画完成和缓存 |
| dot / showZero | isZero 同时读取 count 与 text；showAsDot 还被 isZero 限制 | 必复现独立 text=0 是否误藏有效 count，以及 dot 对零 count 的文档优先级 |
| status / color | ignoreCount → hasStatus → 独立状态分支或包装分支；预设类或内联颜色 | 原五状态/十三色保留；验证模式切换、当前主题、文字对比度、装饰状态点 |
| text | prop 或 #text → NodeRenderer；text=0 按已有 showZero 契约 | 完整内容/空插槽/移除恢复；不得用 text 的零值隐藏独立 count |
| size | medium / small / 既有 default 别名；small 供 count 类与字号/高度 | 保留现有值和告警；核对 small 数字轨道实际高度 |
| title | null / false 禁用；未传回落原 count；仅传 ScrollNumber / 富内容 sup | 必复现独立 status 分支显式 title 的消费；保持 VNode 不产生对象字符串标题 |
| offset | [x,y] → parseInt(x) 取负 px、y 保留长度 → 指示器/独立状态根 | 必修已声明小数与 CSS 长度被截断；浏览器核对逻辑方向及负值 |
| Badge style | 声明为对象 prop；根据状态把同一 style 路由到不同区域；根 attrs 又可能被语义对象覆盖 | 与 Vue 根 style 冲突，开发版直接迁移到原生根 attrs，内部用 styles.indicator；独立迁移说明，无兼容层 |
| Badge classNames / styles | useMergeSemantic 合并 Provider 与本地对象/函数 | 本地 getter 已存在；Provider 解构为快照，必成组复现对象/函数替换、删除和优先级 |
| Badge default / count / text slots | 公开渲染边界读取并普通 prop 转发；仅归一空内容；default 按存在性转发 | 保留 F05 全部用例，验证完整数组/Fragment/0、条件切换与业务身份；不新增函数通道 |
| BadgeRef.nativeElement | interface 声明，但公开 Badge 和私有 Indicator 都未 expose | 必修；实际根、模式切换、卸载与重挂均可观察 |
| 原生 attrs / 事件 / 根身份 | attrs → BadgeIndicator；根两 v-if 分支，style 以对象展开覆盖 | 必验 string / array / object style、class、id/ARIA/tabindex、原生事件、纯 attrs 替换/删除、模式切换焦点 |
| Ribbon prefixCls / placement | wrapper / indicator / content / corner 类与逻辑挂角 | 本地 props 响应性核对；Provider 快照、动态方向、当前 CSS 作用域纳入本轮 |
| Ribbon color | 预设类；自定义 background 与 corner color | 保留挂角几何；验证当前颜色、可读文字及显式 content 样式优先级 |
| Ribbon text | VNodeChild 声明；对象经 component :is，其他插值 | 必复现合法数组/Fragment；原生 #text 纳入同一内容边界，空槽优先、条件移除恢复 prop |
| Ribbon className / style | 两者指向 indicator；className 是独立目标，无根 class 冲突；style 抢占 Vue 原生根 style | 保留 className 的独立目标并明确文档；移除 style prop，内部 styles.indicator，根原生 style，集中迁移 |
| Ribbon classNames / styles | root / indicator / content，对象或函数；Provider 解构快照 | 三语义的配置替换、删除、本地覆盖与当前 props scope 统一验收 |
| Ribbon default / ref | 默认槽直接渲染，rootRef expose wrapper；插槽未显式类型 | 验证完整内容/业务身份，补齐现有默认槽与 text 槽类型；只读 ref、卸载重挂 |
| Provider | useComponentConfig 已是惰性视图；两个消费者 setup 解构 direction / className / style / semantics | 根因在消费者；保持当前视图，不改共享 Provider 引擎；嵌套配置/替换/移除与多实例验证 |
| 九 Component Token | prepareComponentToken 忽略当前 AliasToken；CSS 根局部声明固定默认值，组件无当前 component override 消费 | 已有公开 Token 无效必须解决：九值、0/替换/移除、当前派生、四算法、原生变量覆盖，默认值不凭整改任意变更 |
| 静态样式 | Badge/数字/Ribbon 同一生成器；预设十三色、逻辑属性与 CSSMotion；only-unit 选择器仍指 p，实际 span | 核对真实轨道高度/裁切、small、动画、reduced-motion、暗/紧凑、原生覆盖和文字对比度 |
| ScrollNumber / SingleNumber | VNode clone 或数字拆位；动画序列所有数字均暴露文本；1000ms 兜底与卸载清理 | 必复现负号和重复朗读；保留视觉动画、数字位 key、定时器清理，完整内容不得被单节点克隆假设截断 |
| 导出/类型/安装 | Badge / Ribbon 独立导出，Badge.Ribbon 复合；BadgeSlots 已导出，Ribbon slots 尚未声明 | 实际模板和发布包验证，移除现有测试中的 as never 遮盖，不扩大公开私有引擎 |
| Demo / 文档 | 十三对 vue/md；全部已用公开包；硬编码浅色容器和示例前景、过时“上游即契约”说明 | 保留原十三例；按实测修真实问题，同步动态 Token/Provider/富内容和迁移说明，不为凑数量新增能力 |

## 实际依赖与边界

AST 扫描 `git ls-files packages` 得 2995 个非测试 TS/Vue 源文件，以 Badge basic Demo 的真实 import 为正控。源码消费者为 FloatButton；实际外部 Demo 为 Avatar/badge、Calendar/notice-calendar、Radio/badge。FloatButton 的 badge 数据配置转交公开 Badge，class 保留其定位类；Radio / Space 的静态 CSS 也关联 Badge 类。验收覆盖这些真实链路，不据其渲染通过声称完整验收各关联组件。扫描原始清单另存证据。

已经由原用例验证的封顶、字符串、富内容槽/空槽、缓存、基本状态、挂角、安装导出等仍运行，不能凭盘点重复改动。需要本轮裁定的行为按当前文档、原生 Vue 规则和红灯证据集中记录；本轮不新增自动播报、业务事件或模型。D04 任意 prefix 静态样式、其他组件完整 API 与全库最终同提交门禁另案，不影响修复当前接口无效的问题。

## 当前状态

清单和成组复现已完成；核心实现已提交，当前样式集中修复通过，清洁视觉与最终 Docs 仍待统一验收。


## 功能阶段统一复核

原95项运行时保留通过，新增32项成组复现8通过/24失败；真实生产浏览器修前146项42通过/104失败。Provider初始替身造成的身份变化已先更正为真实Teleport，实际红灯是旧配置字段；浏览器原业务身份本来正常。详见baseline证据，未改共享Provider引擎。

已成组实现原生根attrs/style与实际readonly引用、稳定根、完整Ribbon text/#text、当前Provider、九有效Token/当前Alias、零值独立性/dot优先、负号/额外轨道隐藏、小尺寸轨道、CSS长度偏移、状态title和reduced-motion。实际类型消费又复现Badge.Ribbon丢失精确类型，现通过类型化组合导出修复；非法placement负例与全部十三真实Demo仍编译。

相关61文件1250四层、10文件104类型、根严格、157发布浏览器、52 Demo四算法axe+12实际交互、12 SSR/水合、四实际消费×四算法16渲染、13Demo发布声明及严格UI L7 11/0失败/0待定通过。阴影旧用例改用既有styles.indicator并保留原断言，原26机械规格与HTML/18参考PNG不改；两个自定义色差异逐项精确记录。CSSOM折叠calc和真实CSS过渡等待按平台事实核验，不放宽值、身份或焦点断言。

普通实色前景通过144组实际颜色检查，保留背景色与显式作者前景；额外加入接近亮度分界的sRGB颜色，使用离散round避免阈值附近中间灰。作者透明/渐变/完整颜色覆盖单列边界。产物45.4KB按已接受实际功能成本的裁决仅更新Badge预算37→47KB，其他预算与总量约束保留。

当前仅功能阶段完成；自有视觉、Docs门禁/发布/线上回执和最终整单元清单待收口。生产、测试修正、命令和源码摘要见badge-functional-stage-2026-10-28.json，全库其他单元继续。


## 指示器宿主与可见性集中验收

同一完整内容清单补齐原生VNode、数组、Fragment、文本节点、多根组件和九种空计数形态，15条复现2通过/13失败；发布包156浏览器检查154通过/2失败。根因是单节点克隆不具备实际DOM宿主、语义类/title丢失，以及通用isRenderable并不表达Vue空内容。现统一用既有原生sup/NodeRenderer处理所有非标量count，原始业务节点不克隆；原VNode测试的内容/class/style断言保留，语义marker断言按ADR0007移到宿主。

计数与文字可见性按Vue空内容独立判定；状态title读取当前值。条件组件为空时通过静态:empty隐藏指示器，反复显隐仍是同一宿主与一次业务挂载。没有新兼容通道。新增真实VNode数据Demo和发布模板，最终Badge142、相关1250、类型104、根严格、157发布浏览器、64 Demo、12 SSR水合、16消费与严格UI L7全部通过。证据见badge-indicator-ownership-reproduction.json及更新后的functional-stage；自有视觉和最终Docs仍在统一验收，不先写整单元完成。


## 本轮未收口的验收矩阵

核心内容/配置阶段可独立提交，不代表全部功能与样式完成。统一验收继续检查包裹态status的实际点/位置及statusSize/z-index、富内容paddingInline与字形裁切、borderColor同时存在时显式boxShadow的优先级、原生dir覆盖及继承方向。这些都属于当前公开契约/同一单元，复现为缺陷即本轮修复；未改称后续优化。自有视觉与最终Docs仍待收口。


## 指示器样式阶段验收

基线 d3794769，7 条样式复现 1 通过/6 失败，真实浏览器 172 项 158 通过/14 失败。统一修正包裹状态点、当前 statusSize/z-index、完整内容 paddingInline、原生 boxShadow 优先级、dir 覆盖/继承和独立圆点定位；FloatButton 在真实调用者维持自己的角点变换。消费构建会把裸 :dir 改写成语言猜测，现以静态 @scope 前导保留原生方向选择，嵌套 LTR 与 dir=auto 的实际几何验证通过，未改构建目标。

相关 62 文件 1257 运行时、104 类型、根严格、172 发布浏览器、64 Demo、12 SSR/水合、16 消费渲染、13 Demo 发布模板和 UI L7 11/0 失败/0 待定全部通过。水合测量等待实际有限入场动画结束，尺寸、身份、草稿、焦点和选择区断言完整保留。证据见 badge-indicator-style-stage.json。

核心提交 d3794769 已发布文档站，工作流 40684613745 成功，CI Docs 161 与拓扑 L7 151/0 失败/0 待定；线上 32 项通过、零控制台错误，26 次 Demo 文档导航沿用现有 404 SPA 回退。此回执不替代当前样式的最终发布。接下来冻结 14 类状态 × 3 视口共 42 张 Apollo 图片，并复核受实际前景色影响的既有 Avatar/badge 三图；原参考证据不动。


## 当前完整清单统一验收（最终发布已验证）

实现 d3794769 / df5e0436，视觉画布 d0bf2cef；生产源码 11 个摘要与样式验收时完全一致。完整清单逐项复核后，当前公开行为、类型和相关调用者均已通过本地验收。

| 完整检查面 | 当前结论与证据 |
| --- | --- |
| Props、Slots、完整内容与优先级 | 原封顶/字符串/大小/十三色等保留；原生数据/Fragment/数组/多根组件、空槽、条件移除与恢复全部通过 |
| Emits / v-model | 不适用：无业务事件/模型；业务输入、链接和按钮保持原生事件与所有权 |
| Expose / attrs / 业务实例 | readonly 实际根、style 字符串/数组/对象、替换/移除、模式切换及卸载重挂通过；草稿/焦点/选择区保留 |
| Provider / 九 Token / 当前 Alias | 当前值、零、替换、删除、本地优先、四算法和多实例通过；未改共享 Provider |
| 状态 / 数字 / 宿主 / 偏移 | 负号、当前可访问数字、小轨道、状态点、完整内容间距、精确 CSS 长度与显式样式优先级通过 |
| 方向 / 几何 / motion | 原生 dir、继承 auto、嵌套 LTR 与调用者 FloatButton 位置、有限动画和 reduced-motion 通过 |
| 相关基础层 / 消费链路 | Badge/Avatar/FloatButton/Calendar/Radio/Space/Provider/内部渲染/motion 相关1257；四实际示例×四算法16次通过 |
| 公开类型 / 发布产物 | 104类型、根严格、13原Demo发布模板、三个准确入口、readonly refs、UI构建与严格L7通过 |
| 真实浏览器 / SSR | 172发布浏览器、64实际Demo主题/交互、12SSR/水合全部通过，零相关页面错误 |
| Apollo自有视觉 | 42清洁候选逐张审阅批准，原始RGBA42/42 exact；Avatar48/48 exact |
| 历史证据 | 原495项中492记录/PNG完全不变；Avatar/badge三图逐张对照后各仅26像素的可读数字前景更新；原参考HTML/PNG保留 |
| 本地Docs / 交付 | 内容、类型、15文件161测试、SSG构建、32真实页面/交互通过；最终发布与线上回执随后附入同一单元证据 |

首批 df5e0436 42 图因画布未给 Ribbon 留业务内容空间而拒收，未批准。新清洁 d0bf2cef 的21图与已审首批完全一致，21张修正图重新逐张审阅；新增几何断言防止测试画布再次遮挡业务文字。原14类场景完整保留。

全库视觉当前537/1422批准、885待验收，不能折算成全库整改完成百分比。Chrome150/macOS已验证；Firefox/Safari未独立验证。作者透明/渐变/完整颜色覆盖、D04任意前缀CSS、关联组件完整审计和最终全库同提交门禁仍是明确边界。结构化结果见badge-final-acceptance.json与badge-visual-review.json。


## 最终发布回执

验收提交47b98296已由工作流40701370080完成构建与GitHub Pages部署，两个job成功。CI Docs15文件161测试、拓扑L7 151检查/0失败/0待定/n-a67通过；线上32页面/交互检查零错误，26次Demo导航沿用已有404 SPA回退，组件API与进度物理文档正常。本单元完整收口，实际边界保持上述记录；不宣称全库完成。见badge-docs-publication.json和badge-final-acceptance.json。
