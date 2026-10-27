# Empty完整契约与共享空状态整改单元

盘点基线为2bad0f31。已读取当前Empty实现/类型/样式、两个插画及其生成数据、ImageNode、共享语义合并、全部六原Demo、双语API、现有四层/类型测试、实际DefaultRenderEmpty分发和消费者。盘点当时尚未修改生产源码；以下修前分类与阶段证据保留，最终验收见末节，源码缺陷先复现，不把旧报告或类型定义当运行结果。

## 本轮范围与完整清单

| 声明→传递→消费 | 分类与验收标准 |
|---|---|
| prefixCls；direction/attrs | 原生根div及当前前缀链保留。必修：setup解构direction和全局配置造成当前Provider快照；原生attrs当前实际复现正常，不能只按旧注释判为缺陷；当前前缀、原生dir覆盖、字符串/数组/对象style与移除恢复、事件一次、root身份/焦点、SSR一致 |
| image | 已有URL/VNode/组件及内置默认/简洁路径保留。必修：公开VNodeChild中的0/布尔/数组落入h(Component)断言，完整内容丢失或发Vue警告；只undefined回退，null/false/空内容明确为空，数组/Fragment/完整业务子级有效，自定义响应式组件去代理。内置组件已markRaw，不冒称它们目前也有代理缺陷 |
| 原生image内容 | 当前没有#image，实际customize Demo依赖运行时template组件，生产runtime-only Vue无法编译。按原生Vue内容规则补完整#image，存在即优先且空槽不回退；保留URL与组件数据接口，不加旧内容函数兼容层、运行时编译器或新image回调 |
| description/#description/default | 字符串、false/空串、数字0和locale默认有效路径保留；现有#description模板槽保留。必修：default槽可见性缓存/二次求值，空数组会创建有间距的空footer；两槽与image槽统一当前render各一次，条件/有意为空/移除、完整节点、业务编辑器/点击/焦点及卸载重挂覆盖 |
| imageStyle | 既有CSSProperties字段与既有弃用状态保留，本轮不添加兼容通道或新弃用期；与styles.image逐属性合并，后者优先，当前更新/删除恢复有效。它没有阻碍原生Vue用法，不为清理名义额外删除 |
| classNames/styles；四语义 | root/image/description/footer均有效，局部对象及已接受的{props}工厂保留。Provider配置按当前导出类型保持对象式。全局语义→全局根style→局部语义→原生根style现有优先级核对；当前Getter不冻结，样式只落对应宿主，不克隆或修改业务子节点凑旧树 |
| Provider EmptyConfig | className/style/classNames/styles/image逐项追踪。当前setup解构造成快照，必须集中修复替换/删除/最近作用域/相邻多实例。style现有类型只有CSSProperties；原生attrs的string/array/object不被误扩成Provider新能力。真实命名EmptyConfig的SFC赋值先验证，仅在实际失败时修类型 |
| Locale及两个插画 | 根description已用useLocaleReactive，继续验证。插画title仍用useLocale快照，必修当前语言/替换/移除；复杂description的URL替代文字按当前locale统一核对，字符串含空串仍按显式值。保留image-only的有名插画及调用者自己的ARIA，不盲目把description=false的唯一反馈隐藏 |
| 插画源主题/透明色 | 几何、来源/许可、两个静态对象与根/深入口身份保留；生成文件未发现跨实例固定id引用。颜色实际从useToken在render派生，并非文档所称纯CSS变量。必修：onBackground双透明时a=0产生NaN颜色，先复现；当前源主题、两个实例、透明合成及SSR/水合验证，不添加Empty Component Token |
| 样式/布局/无障碍 | 当前0个Component Token，八类既有Alias负责尺寸/间距/文字/图像opacity。必修默认说明文字colorTextDescription对比度，以及custom内容被固定图像高度/SVG选择器/opacity牵连、宽URL溢出；媒体规则限于拥有的图像，完整业务内容自然布局，长说明/窄屏/RTL/暗色/紧凑验证 |
| Emits/v-model/Expose | 无组件业务事件或模型，不新增；原生事件到实际根。只nativeElement:HTMLDivElement|null，真实InstanceType、根/深入口/静态属性/安装名保持，反复开关和卸载状态有证据 |
| 六原Demo与文档 | 全部保留。config-provider仍宣称组件未实现并直接provide，customize使用runtime template，description的节点示例误放footer，style-class固定浅背景且只展示三语义。统一改真实公开Provider、原生内容、四语义/当前配置及成对主题；替换示例外链图片时保留URL输入场景，用自有确定素材，不改夹具颜色绕过axe |
| 发布样式/参考/Registry | genComponentCss已为合法根导出，不新增不必要生成器；纠正文档无效theme/dist路径、prefix语义和已不存在的ant静态CSS声明。原机械JSON、投影与参考图保留；必要形态差异逐项登记、有反向守卫；自有图清洁提交采集/逐张审阅，不以历史completed代替本轮验收 |

本轮没有待用户裁决的新能力。只接受以上既有契约和原生内容必需修复；不加size/loading/业务事件、Component Token、图片错误重试或新全局渲染服务。D04任意前缀自动CSS仍另案；已有genComponentCss能力须可消费。

## 关联链路与统一方案

实际七个运行导入点为DefaultRenderEmpty、List、Table、Table过滤器、Select、Transfer和Mentions；另有静态CSS聚合。DefaultRenderEmpty自身有componentName一个Props，Table/List用简洁图，Select等命名分支用small，Table.filter返回空；分支名称不证明实际消费者。TreeSelect/Cascader源码无全局renderer时用Not Found文字，AutoComplete经Select间接消费，按实际路径检查。

共享RenderEmptyHandler已在List审计接受为全局按组件分发的VNodeChild扩展，本轮保持其公开API；不因名称像React就再次迁移。修复归为两组根因：当前配置/attrs/locale/源主题，以及完整Vue内容/合法image数据/所属样式。先建立整组红灯，再统一实现和迁移，最后核对完整清单并统一验收后切换。

## 验收标准与边界

必需证据包括六Props/三个完整槽/四语义、当前Provider及locale、所有有效image形态、原生attrs/ref/方向/事件、业务子级身份/草稿/焦点/多实例与卸载、透明合成和媒体布局。执行Empty四层及公开类型、真实SFC和发布消费、Node SSR/水合、实际生产浏览器、六原Demo四算法与实际Docs交互、DefaultRenderEmpty和真实消费者回归；共享List既有视觉按影响验证。

自有视觉覆盖默认/简洁、URL与完整内容、空槽、语义/当前配置、RTL、暗色/紧凑组合和焦点等适用状态，必须真实采集并审阅。发布产物/L7、Docs/Registry/格式/来源核对后记录提交与未验证边界；局部通过不代表全库完成，全部整改结束后仍需最终同一提交全量门禁。


## 动手前复现与当前判据校正

生产八文件哈希保持盘点基线不变。实际Native Teleport下39项根因复现 **11通过/28失败**，失败涵盖合法image/新原生内容槽、空包装/单次槽求值、五Provider字段、当前方向、插画locale与双透明NaN；原生attrs/style/事件更新已通过，已有Fragment与DefaultRenderEmpty分发场景继续保留。

初始夹具有两类错误，已按当前源码纠正后再计数：it.each把数组作为参数元组而非单个VNodeChild，改对象记录保留全部数组场景；VTU teleport-stub会重挂Provider子树，导致五配置值和locale看似更新，加入真实Teleport/根身份后暴露实际快照缺陷。Vue当前生产/开发attrs代理均会track，不能把旧“useAttrs不追踪”注释当证据。透明合成用公开Color解析器支持的rgba零Alpha数据，避免在Empty之前被不支持的transparent关键字打断；共享颜色格式扩展不在本轮加入。

## 核心实现里程碑（整单继续验收）

六Props、三个完整原生槽、四语义/current Provider、当前方向/语言、合法image形态、双透明合成及所属媒体样式已成组修复。六个原Demo全部保留并更新，双语API及迁移同步。原32机械场景保留原JSON/投影，只精确登记自定义内容类及空footer两处新增差异；旧固定alt断言按当前语言契约更正并补切换覆盖。

已验证：相关九组件组四层 **1151/1151**（其中Empty143）；公开类型 **20/20** 无来源错误；根严格类型、真实SFC类型及UI声明/69份CSS构建通过。实际生产浏览器 **50/50**，包括全部八Alias当前消费/移除；六原Demo×四算法 **24/24**；普通Node发布SSR **8/8**、实际水合 **6组**（预输入、根/编辑器、焦点/选区、相邻作用域、配置/主题/语言/方向及卸载重挂）通过。

Demo初次浏览器扫描保留了真实链接对比度失败：默认蓝链接在浅色4.1/暗色3.55；描述Demo中链接采用继承当前说明文字颜色及下划线，保留链接本身和全部axe规则，四算法重新通过。这是实际示例样式变更，没有向测试宿主补颜色。公共类型消费夹具也保持数据与VNode槽类型的区别：组件定义作为image数据时合法，插槽返回需要真实VNodeChild；不以断言或拓宽槽类型回避。

未验证/本轮继续项：实际构建Docs页面及交互、自有视觉清洁提交采集与审阅、相关List视觉、UI严格L7及最终同一生产实现清单核对、线上站点更新。当前仅核心实现里程碑，不宣称整单或全库完成。

关联浏览器验收新增实际复现：List/Table更新到紧凑主题时正常，Select实际body弹层中的Empty仍为35px而非30.625px。源码链路为ConfigProvider只向其display:contents宿主应用Alias变量，Trigger的Portal移出该宿主且没有传递当前主题变量；Vue注入仍有效，故Empty语言/配置更新通过而CSS布局失效。该既有主题接口在本轮关联链路中无效，纳入当前必修，先验证共享Trigger主题桥接与其实际消费者，再统一收口。其余consumer浏览器分支尚未完成，不据局部通过报告全链路正常。


## 共享Trigger主题边界整改

进一步核对Trigger现有29 Props、default槽/popup数据、forceAlign/nativeElement/popupElement三个Expose、当前overlay/Portal/motion与popupStyle链：Portal保留Vue注入但不保留DOM变量祖先，实际popup根没有当前Alias变量。修复仅在现有popup style最低优先级写入当前source Alias；显式popupStyle仍优先。无主题时不写默认内联变量，主题替换/移除及最近作用域保持响应性，无新增Props/Emits/model/兼容层。

四个修前回归全部失败；修后4/4通过，含首帧、替换/删除、原生草稿/焦点、显式覆盖移除及相邻嵌套作用域。实际八类公共popup（Tooltip/Popover/Popconfirm/Dropdown/Menu/DatePicker/RangePicker/Tour）共40项初始/当前/暗紧凑/移除/重开检查通过；六类实际Empty消费者共18组通过，包括表格筛选面板，原根与当前配置/方向/Empty语言及紧凑尺寸有实际断言。

表格筛选最初axe取样发生在有限入场动画中间，颜色对比1.69；等待真实动画结束后通过，未修改Table或测试颜色。Table筛选描述由Table自己的locale prop提供，消费者报告只声明Empty对显式文案的消费，未把它伪称全Table语言契约验收。

实际构建文档的六Demo亮暗及四组交互、主文档六卡片共17项通过。当前共享层所有实际reader及间接消费者的统一四层门禁仍运行；视觉只完成候选布局/axe，尚未批准。核心提交193cc3bb已推送，整单继续验收。


## 最终逐项验收（生产实现冻结12cf9fee）

| 完整清单 | 状态与证据 |
|---|---|
| 六Props、原生attrs、三完整槽、四语义与优先级 | 已验证；Empty143四层、54项生产浏览器，含各槽单次/完整/空/移除、current工厂、attrs四style形态及事件/ref |
| Provider、direction、locale及两静态插画 | 已验证；真实Teleport、五配置替换/删除、相邻最近作用域、原生dir覆盖、两SVG当前title与URL alt；根/深入口静态身份相同 |
| 合法image数据、自然布局与所属媒体CSS | 已验证；数字0、布尔/空、数组/Fragment/VNode/raw组件，业务草稿/焦点/身份，宽URL窄屏及内置default/simple模式 |
| 源主题、透明色、八Alias与当前前缀 | 已验证；四算法、双透明有限fill、八Alias实际测量/移除；动态完整prefix两次替换通过真正发布genComponentCss消费，移除恢复且root不变 |
| 生命周期、Expose、SSR/水合 | 已验证；无业务Emits/v-model，仅nativeElement；8 Node发布SSR、6组真实水合，根/预输入编辑器/焦点/选区、相邻作用域及卸载重挂 |
| DefaultRenderEmpty、实际消费者与共享Trigger | 已验证；保留8个分发分支，实际六消费者18组；29既有TriggerProps与3Expose保持，4条红绿回归与八类popup40项通过 |
| 类型与发布产物 | 已验证；22相关组2856四层无失败/跳过，46文件434类型无错误，根/SFC严格检查、六真实Demo发布SFC正负例、69 CSS与UI严格L7 11项0失败/0待定 |
| 六原Demo、双语API、迁移及实际站点 | 已验证；24 Demo×主题，17实际Docs页面/交互与六卡片；Docs15文件161测试/严格检查/85 SSG页面通过，状态更新后的最终Docs门禁另附回执 |
| 自有视觉与原参考完整性 | 已验证；清洁12cf9fee的45 Empty图逐张检查（默认/简洁/无说明/完整描述/URL/footer/四语义/业务内容/空槽/当前Provider/RTL/三主题/焦点×三视口），与List57张同次共102张diffPixels=0；原315批准记录及PNG完全不变，原JSON/全局投影/参考图和生成几何不变 |

核心193cc3bb及共享修复12cf9fee均已推送。完成内容以上述冻结生产实现和列明范围为准；所有适用验收项已核对。剩余交付是最终报告/Registry/格式/Docs门禁与授权线上发布回执，不再改生产实现。未验证的其他浏览器/实际设备不冒称通过。全库矩阵1332项、已批准360、其余972项待后续单元；元数据subset检查通过不代表全库视觉通过。全库全部整改后仍需最终同一提交全量门禁。


最终报告/Registry/站点内容更新后，已重新执行Registry19项（0警告）、全仓格式（0错误/既有37警告5信息、规则未改）、Docs严格类型/15文件161测试/85路由SSG构建、86物理HTML及关键产物探针；再次打开真实文档六Demo/交互/主卡片，17/17通过，进展页包含本轮新证据。最终UI严格L7仍为11项0失败0待定，生产九文件哈希与12cf9fee冻结实现一致。当前唯一剩余交付为授权线上部署及实际访问回执。


## 授权发布与线上回执

验收提交230fe3cf已推送并上线。Deploy Docs工作流40448643538的build122005862855、deploy122006911823均成功；Pages部署7350216642于2026-10-27T04:18:16Z成功。该流水线完成Docs门禁、拓扑构建全部发布包及L7检查、关键产物探针与Pages发布。

实际线上再次执行tests/browser/empty-docs.mjs：17/17通过，无Vue/页面错误；六个原Demo亮暗、四组交互及主页面六懒加载卡片通过。12条Demo深链接按现有Pages404 SPA兜底返回404，实际内容已加载并验证；Empty物理主文档与整改进展页返回200。线上进展页核对本轮2856/434及视觉360/1332/972，未把404描述成200。完整回执入empty-contract.json。当前整改单元实现、统一验收与授权发布均已完成；全库其他整改继续。
