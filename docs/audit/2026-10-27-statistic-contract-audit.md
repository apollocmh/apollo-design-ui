# Statistic / Timer / Countdown整改单元

盘点提交ac6f40e0。当前状态：**完整清单已统一验收，组件单元收口；最终文档已上线并核验**。实现111fa024，加载语义633c219b。原始盘点与分类保留如下，各阶段开放状态由末尾最终验收取代。范围为Statistic、内部Number、Timer、Countdown、格式化工具、根/深入口、7个语义落点、Provider与主题、原7Demo和双语文档。关联Skeleton只验证实际组合，共享实现未改。

## 实施前完整清单与分类

| 链路 | 当前源码与本轮分类/验收 |
|---|---|
| value / precision / separators | Statistic运行时默认0；Number正则保留数值字符串/负号/小数，非法文本原样。有效默认格式待本轮复验；非有限precision可进入padEnd，字符串替换会解释分组符中的美元转义。本轮复现后修正，保留正常格式/负precision/小数截取行为 |
| formatter / valueRender | formatter为顶层VNode回调，false/两个字符串枚举无行为；Statistic已删除valueRender prop但保留未类型化的#valueRender暴露VNode，Timer仍有valueRender函数prop并cloneVNode。必修：集中迁移为原生#value单对象scope，移除旧内容函数与VNode包装通道，不新增兼容层/弃用期；数字动画/格式化调用者用模板表达 |
| title / prefix / suffix / slots | 三文本prop与三个槽当前prop优先；空槽不压制prop。必修：存在槽优先（含有意空），完整多节点/注释/原生编辑器保留；Timer/Countdown必须透传全部当前槽 |
| loading / Skeleton | 当前loading替换content，关联Skeleton使用paragraph=false/active；本轮核对开关恢复、卸载和多实例；不承诺loading隐藏时保留已经卸载的业务编辑器 |
| valueStyle | 已公开且有效的deprecated样式别名，保留styles.content优先和既有告警契约；不新增别名或凭本轮内容迁移删除其他有效API |
| attrs / mouse events / Expose | Statistic过滤到aria/data，丢普通id/tabindex/原生事件；style按对象展开破坏字符串/数组。必修：原生attrs归根、样式三种Vue形态及正确事件合并；三个公开组件均提供真实nativeElement并在卸载后归null |
| prefixCls / direction / Provider | useComponentConfig返回当前Proxy，但实现setup解构class/style/classNames/styles/getPrefixCls快照，semanticProps另复制同步。必修：getter读当前配置、直接响应式props传语义工厂；替换/删除、最近Provider、相邻实例、前缀恢复/RTL均验收 |
| classNames / styles | root/header/title/content/value/prefix/suffix七落点，对象/函数；逐项追踪完整节点，类拼接/样式后者胜，native attrs优先，数值槽仍拥有稳定value语义落点 |
| Component Token / 主题 | titleFontSize、contentFontSize两CSS变量有效，但未消费theme.components.Statistic。必修：当前源主题、Alias、两Token动态移除/恢复与原生变量优先；默认/暗色/紧凑/组合矩阵 |
| Timer type / value / format | down在setup固定；watch表面监听value/down却不能响应方向，format每render读取；初始'-'用对象ref模拟forceUpdate。必修：真实当前时间ref/方向computed，值或方向变更重置周期，format变更只更新显示，不复制React生命周期 |
| Timer数值格式继承 | formatter声明后被内部formatter覆盖，precision/decimalSeparator/groupSeparator不作用计时文本。必修：Timer公开面只保留有效统计展示/计时字段；按format及原生#value扩展，不把无效字段保留为兼容 |
| change / finish / timer cleanup | 当前函数prop按16.67ms tick，结束change可能负数，finish仅timestamp<now；无效日期持续创建interval。必修：声明Vue emits，change给非负毫秒number，countdown到0每周期finish一次、准确停止；无效日期显示'-'/不计时不发事件，恢复有效后重启；反复重置/卸载/多实例验收 |
| SSR / hydration | immediate watch在setup访问window，SSR存在实际崩溃路径；必修：计时仅挂载后启动，服务器/客户端首帧保持'-'，水合不替换root/原生输入；只在挂载后发计时事件 |
| Countdown / 导出 | 现有具名导出和静态子组件名保留，不为上游名称新增废弃通道；Countdown固定countdown，但当前无声明props/槽/ref。必修：共享有效Timer props/类型、完整槽/事件/ref转发，不保留其错误克隆逻辑 |
| utils / Number / 许可 | 当前公开formatTimeStr/formatCounter与私有Number仅本组使用，追踪全部引用；有效时间格式/转义与数值算法保留；数字/时间非有限输入回退须文档化，不引入第三方计时/React依赖 |
| Demo / 文档 / 类型 | 原7Demo逐一已读；animated实际为toLocaleString格式化，timer只有静态回调日志，Token只有原生变量。必修：保留原场景、改原生值槽、可操作方向/目标/重复到期与主题移除恢复；API槽/事件/ref/计时边界/迁移和真实SFC/发布声明同步 |
| 实际调用者 / 共享影响 | 除本组及Demo外无UI业务组件直接消费；根style生成与导出是有效调用者。Skeleton/ConfigProvider/theme/DOM attrs工具只读复用；若后续必须改共享实现，再明确消费者回归范围 |

## 集中方案、验收和边界

本轮围绕原生值内容与计时生命周期、当前样式配置两组根因集中整改。数值槽只提供业务值及已格式化text；计时槽另提供当前非负duration或未就绪/无效时null、type，均不公开内部VNode。title/prefix/suffix槽使用完整Vue内容，空槽优先。Timer/Countdown转发相同外壳与当前槽，保留实际元素/焦点，事件通过Vue emits。

先建立会失败的行为/SSR复现及源哈希，再统一实现、类型、测试、原Demo和迁移。统一验收为本组四层、公开正反例/真实SFC/发布声明、生产SSR/水合、真实浏览器几何/事件/计时/焦点/多实例/axe、全部7实际Demo、适用自有视觉矩阵、UI构建/L7与Docs/Registry/格式。源码冻结后集中执行，失败只补相关检查；不拼接全库绿灯。

需要产品裁决项暂未发现；上述修正来自当前有效接口和Vue规范。另案：新增暂停/恢复/同步服务器时间/业务请求/新计时类型与任意动画引擎，不纳入本轮。原animated示例迁移保留格式化能力，不声称提供组件级动画API。浏览器后台节流依靠每帧实际Date.now避免累计误差，不能承诺后台回调频率；跨浏览器/实体环境与全库最终同一提交门禁不得冒称完成。


## 集中实现与阶段验收

12条修前行为复现全部失败，真实Node SSR有3条window未定义崩溃；另有默认准备字号30与实际Alias24不符的独立失败。实现直接改为#value业务scope、当前计时方向/非负事件、挂载/卸载效果、完整槽/attrs/ref与当前Provider/两Token，保留原7Demo和17个机械场景。三个公开组件现为14/13/12个运行时Props，Timer/Countdown声明change/finish emits；具名及静态子组件导出均有真实类型。

实现阶段7文件84条unit/dom-contract/a11y/theme通过，6文件94条相关类型通过；根严格类型、真实SFC和发布声明消费通过。生产Chrome42项、Node SSR5项、浏览器水合6组通过：当前源主题/别名、模板/原生输入、方向/目标反复更新、恰好一次finish、原生change与业务事件隔离、无效目标/卸载/重挂、值/焦点/选区和多实例已覆盖。全部7个实际Demo及两组交互9项本地浏览器通过，零错误。最近Provider/相邻局部样式和工具非有限/负值边界纳入完整清单验收。

浏览器修前14项中12项失败；其中缺失favicon的404是夹具问题，现提供显式data图标且保留零错误断言。默认标题实测3.36:1，已用colorTextSecondary修正并通过真实axe；没有降低对比度要求。冻结浏览器时钟时axe会等待自身计时器，夹具改为axe前保持运行/最后恢复，计时行为仍用受控真实浏览器时钟验收。Provider夹具修正为实际components.statistic API，旧源码副本重放失败后删除；VTU嵌套根使用分步选择，未放宽DOM身份断言。

UI完整构建含dts/69CSS、Docs严格类型/14文件157条及SSG、Registry和来源清单通过。来源清单528行、199候选，相较原524行/201候选新增8个类型化槽字段、移除4个旧格式字段；候选仅减少已确认的两个公开formatter接口，不把其余候选当成缺陷。

## 单项体积预算修订

UI L7首轮11项中仅B6失败：Statistic隔离import实测43578字节（42.6KB），原41KB上限。当前源主题解析/两个组件Token、原生内容、计时与SSR完整契约产生必要成本。依据用户接受开发期必要增长的授权及budget.json允许技术原因单项修订的规则，只将Statistic上限改为43KB；历史23.7KB measurement、其余72项预算与30%全量占比上限不变。当前全量2066.9KB，单项约2.1%，不是误引全库。修订技术原因同步写入提交说明，严格门禁复跑11项FAIL=0/PENDING=0。没有删除能力或更改测试断言以换体积。

36个自有状态/视口已定义，原15个历史参考保留；手机原生焦点/桌面暗紧凑两项预检通过，但预检是脏工作区候选，不能作为批准基线。接下来从清洁实现提交统一采集、逐张审阅、接受与比较，随后核对原始完整清单并发布。当前未声明整单元或全库最终验收完成；精确命令/数据见[统一证据](evidence/statistic-contract.json)。


## 视觉阶段发现的加载语义修正

清洁实现111fa024首次完整采集实际33项通过/3项加载态失败；manifest未完成、没有批准任何图。三个视口均由Skeleton的空h3触发真实axe empty-heading，属于本轮必修。修前新增生命周期断言失败，修后Statistic自有加载层aria-hidden、根aria-busy，结束恢复正文；不把不透传attrs的共享Skeleton误当作承接层，也不屏蔽规则。Skeleton共享实现未改；其独立公共契约仍需后续完整审计。

原17个机械场景全部保留；只对loading逐条核定7个结构/ARIA变化，实际骨架样式留在内部组件，间距由自有层承接。当前7文件86条四层、46项生产浏览器、6组水合/5项SSR、根严格类型、完整UI构建/发布声明与L7通过，94条相关类型的公开签名未改变；最终实际Demo/视觉复验继续执行。不能把首次33张候选或之前84条结果当作本次加载修正后的最终验收。

## 原完整清单最终核对

| 原清单范围 | 已实现、已验证的最终结论 |
|---|---|
| value / precision / separators / utils / Number | 默认格式、有效数值字符串、截取/补零/负precision和时间转义保留；美元分组符按字面、非有限精度/时长与无效目标明确回退，准备字号取实际Alias；许可未改 |
| formatter / valueRender / 四个槽 | 旧内容函数与内部VNode通道直接移除；四个类型化Vue槽完整渲染，槽优先且有意空槽不回退；value提供业务值/text，计时另有duration/type；动态内容/编辑器身份和焦点通过 |
| loading / Skeleton / valueStyle | 自有busy与隐藏装饰层解决真实空标题缺陷，反复开关恢复正文，卸载清理通过；保留既有有效valueStyle优先级和告警；共享Skeleton未修改 |
| attrs / 原生事件 / Expose | 三个导出的id/tabindex/原生监听、字符串/数组/对象样式与优先级、真实nativeElement及卸载归null通过；业务change不消费原生change |
| prefixCls / direction / Provider | 当前替换/删除/恢复、最近Provider、相邻多实例、RTL和前缀均通过；无setup配置快照或React生命周期模拟 |
| classNames / styles / Component Token | 七个语义落点、对象/函数配置及两字号Token当前源主题/Alias、删除/恢复和原生变量优先通过；默认/暗色/紧凑/组合真实axe与几何通过 |
| Timer type / value / format / 数值继承 | 当前方向与目标切换重置周期，format只改显示；移除不消费的数值格式字段；未就绪/无效显示'-'，未增加暂停或动画能力 |
| change / finish / 生命周期 / SSR / 水合 | 挂载后非负change，到0先change(0)再每周期finish一次并停止；无效目标不调度/不发事件，恢复、重复到期、多实例与卸载重挂通过；5项生产SSR与6组水合保留节点/值/焦点/选区 |
| Countdown / 导出 / 类型 | 有效历史别名告警保留；完整props/槽/事件/ref与固定countdown通过；具名及静态子组件类型、94条相关类型、真实SFC与发布声明消费一致 |
| 七Demo / 双语文档 / 迁移 | 原七场景保留；方向/重复到期和Token开关可操作，全部七实际页面含axe及两组交互通过；七Demo×四算法28组真实axe通过，修正三Demo的实际暗色/紧凑配色 |
| 实际调用者 / 共享影响 / 构建 | 共享UI实现未改，Skeleton/Provider实际组合由上述回归覆盖；UI dts/69CSS与严格L7通过；Docs宿主主题失配另按完整关联单元修复，见下述报告 |

最终四层7文件86条、相关类型6文件94条、Chrome46项、Node SSR5项、水合6组、七实际Demo及两组交互、28组Demo主题分别通过；数字对应各自范围，不合并成全库唯一用例数。严格类型、发布声明、UI构建/L7、Docs15文件161条及SSG、来源/Registry/格式检查结果统一保存在[证据](evidence/statistic-contract.json)。

## 自有视觉与关联Docs验收

清洁633c219bdd21857a562fb5758e1677915b11b87b采集12状态×3视口36图，逐张查看全部手机/平板/桌面的数值、单位、加载、业务槽、空槽、双向计时、Token、暗色、紧凑、组合与原生焦点。确认字号、对比度、忙碌语义、完整内容和焦点无裁切后批准；`node tests/visual/apollo.mjs --component statistic --no-build`实跑36/36 PASS、pending=0、每项diffPixels=0。原163条批准记录逐项保持相同，总批准记录199条；旧15个参考场景保留。环境为darwin/x64、系统Chrome150.0.7871.125。

最终生产12文件指纹仍为d4dbe264547d00bdf6a00798d4e119dccf405550482b0a98df777bdcce5917e6。后续Demo配色和Docs宿主变更未修改该生产实现。实际Docs暗色验证发现CSS已暗但Vue源主题仍浅，按[共享Demo主题完整清单](2026-10-27-docs-demo-theme-audit.md)修正；当前CSS/Provider共用解析状态，媒体偏好与临时query更新，水合首帧一致。命名的五个Token消费者亮/暗、内联输入身份/焦点和72组件代表页亮/暗验收分别记录，不冒称所有Demo完整交互通过。

## 验收边界与交付

本单元已实现、已验证，无未裁决或受阻的本轮缺陷。其他浏览器/实体设备、后台定时器频率、无限输入资源和未列出的组合未验证；iframe跨文档导航维持现有重载边界。暂停/服务端时钟同步/动画引擎未新增。Skeleton独立完整审计为下一单元；全库其他组件、基础包及最终同一提交全量门禁继续开放。

实现111fa024和633c219b已推送；本次提交交付最终清单、36图批准、实际Demo配色与证据。最终文档发布与线上源码/示例核验随后写入[发布记录](2026-10-26-docs-publication.md)，未将本地通过或推送当作已上线。


最终发布已完成：c6fff66e的[Deploy Docs 40382135401](https://github.com/apollocmh/apollo-design-ui/actions/runs/40382135401)及Pages7340908562成功。CI Docs15文件161条与全部包L7 151项通过，FAIL=0/PENDING=0、n/a=67。线上源码/日志c6fff66e、通用33检查、Statistic七实际Demo及两交互、共享主题13项、SSR指南八条结论分别通过；桌面/手机暗色截图已逐张查看。既有独立Demo的404.html导航回退明确记录，无额外资源/页面/Vue错误；144代表页渲染仅在本地验证，不宣称线上重跑。详情见[最终发布回执](evidence/docs-publication-statistic-closure.json)。上述待发布状态由本回执取代。
