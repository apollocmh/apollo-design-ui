# Typography / Text / Title / Paragraph / Link 完整整改单元

盘点基线f10574fb（生产Avatar9af2a24f/共享ef832304）。先盘点当前源码和验收范围，后按以下阶段记录实施及验证；盘点表保留修前事实，不代表当前实现。已读取五个公开SFC、InternalTypography、Base/BaseContent、CopyBtn/Editable/Ellipsis/EllipsisTooltip、全部hooks和节点/复制工具、样式和两个Token、两级导出、双语API、14个原Demo及既有测试。历史报告只作证据，不替代当前链路。

## 范围与完整清单

| 链路与全部当前公开项 | 当前事实/分类 | 本轮验收标准 |
|---|---|---|
| 基础与五入口 | prefixCls/classNames/styles/direction/component；Text/Paragraph固定标签、Title.level、Link.rel/target/boolean ellipsis。子入口继承component却强制忽略，需集中评估直接移除无效公开声明；容器component有效保留 | 默认标签/动态level、合法标签、原生attrs/ref和静态/具名注册一致；类型正反例与迁移同步，不保留无效兼容字段 |
| Block全部字段 | actions/title/editable/copyable/type/disabled/ellipsis/code/mark/underline/delete/strong/keyboard/italic；逐项进入BaseContent、包装顺序和实际宿主 | 保留装饰顺序、语义色、title及合理disabled语义；验证Link所属操作与原生事件，避免嵌套交互/attrs覆盖关键处理 |
| 内容和节点 | 仅default业务槽；Base在render读取toNodeList，私有内容组件消费。省略会克隆/包装节点，测量期间业务身份/焦点需显式补验 | 完整/空/条件/Fragment/0/多节点、动态正文及CSS/JS/展开状态；已显示业务节点的状态、key和焦点保持；不调用业务slot求隐藏副本 |
| CopyConfig全部字段 | text/onCopy/icon/tooltips/format/tabIndex进入useCopyClick/CopyBtn。复制工具返回boolean却被忽略，false仍报成功；VNode fallback直接join可能产生对象串，需复现；异步重复操作/卸载/失败补验 | 成功才反馈及onCopy；原生事件一次；空字符串不误回退；当前正文/格式/图标/提示/语言和异步busy状态；保留配置型文本工厂，不新增无关服务 |
| EditConfig全部字段 | text/editing/icon/tooltip/onStart/onChange/onCancel/onEnd/maxLength/autoSize/triggerType/enterIcon/tabIndex全部追踪。autoSize声明传入Editable但未消费，原Demo已承诺撑高，必修 | 受控接受/拒绝、默认值/空值、重复开关/卸载、当前配置、Enter/Escape/IME/修饰键、blur只保存一次、真实高度/动态配置；没有声明顶层v-model，不凭偏好新增 |
| 编辑宿主与焦点 | 编辑支路未给公开ref接入当前Editable根；仅明确aria-label转发textarea，其余root attrs与文本触发onClick合并补验。输入强制剥换行与原多行Demo/autoSize契约矛盾需集中裁定 | 当前实际根ref、稳定编辑草稿/selection、正确标签/描述落点、默认可访问名与确认图形语义、退出焦点；有编辑能力的正文键盘可达；原生业务监听不覆盖内部逻辑 |
| EllipsisConfig全部字段 | rows/expandable/suffix/symbol/defaultExpanded/expanded/onExpand/onEllipsis/tooltip逐项追踪；CSS与JS两路径、二分测量及异步任务。symbol为既有配置函数，不等同顶层render prop；tooltip公开只承诺title | 受控/无控、有限行数/宽度/隐藏显示、动态内容/配置/主题/展开、收敛和旧测量不覆盖新请求；native回调真实载荷/变化才通知；Tooltip真实显示与身份保持 |
| Provider与locale | 当前配置getter已在computed读取；真实生产Chrome五入口/编辑器/实际Demo均通过。32条jsdom9通过/23失败在db24a00c/4e2d9d04一致，且全局默认Teleport替身，测试环境与产品事实冲突待核对；Text locale仍用setup快照，必修当前语言 | 不按旧报告或现有桩断言自动改产品；保留原23身份断言，用真实Teleport复验；整体/原地/函数/移除及当前语言、方向、prefix、嵌套Provider均有效 |
| attrs与语义合并 | 四子入口mergedProps和InternalTypography.rootAttrs在computed读非响应式attrs；纯attrs变化需红灯。四语义键root/actions/action/textarea，native style覆盖顺序已声明 | 字符串/数组/对象class/style、纯attrs/事件动态更新与移除；优先级/函数props当前值不变；根与编辑器不重挂 |
| 主题和样式 | 两既有Token titleMarginTop/titleMarginBottom仅常量内联，无当前源消费，必修。别名/装饰色、暗/紧凑、RTL、prefix和Teleport关联检查；不新增Token | 两Token真正可配置/替换/移除，原生CSS变量和嵌套源优先级；四算法真实布局/对比度/编辑控件颜色。任意前缀全库CSS策略D04另案，不伪称已解决 |
| Slots/Emits/model/expose/类型 | 当前无业务emits或顶层v-model；配置回调和DOM监听职责分开。仅nativeElement公开ref；slots未完整声明类型；TypographyConfig为交叉类型，实际Provider传入类型需验证 | 原生监听/配置通知一次且无回声；稳定准确ref和完整槽类型；真实源/发布模板、负例、静态子组件/安装和全部14Demo强类型通过；必要破坏变化单独迁移 |
| Demo与文档 | 14原Demo保留；component-token只演示别名，未演示两既有Token；editable-custom声称autoSize却无效。双语API/README仍有Tooltip/样式导出尚未实现等旧说法，部分已被源码证伪 | 同步真实实现、API、类型、原Demo和迁移，原14例四算法及真实交互/Docs验收；消费候选23文件先核对import，避免字符串命中误判 |
| 机械、无障碍和视觉 | 76原机械场景、历史参考图保留；当前无Apollo已批准Typography图。原生可访问名、操作所属、真实AX/键盘、复制/编辑/省略状态需要一起验收 | 保留有价值断言；必要差异有限登记并补等价原生测试。清洁源码捕获/逐张审阅/批准后复比；已有453批准图/记录不变 |

## 集中范围和边界

本轮必须解决已复现的既有接口无效、当前配置/attrs/locale、编辑/复制/省略关键交互与原生可访问性问题，按根因分组，不按字段碎片修补。优先区分Teleport桩与真实产品：生产Provider已通过，不能据23条桩环境红灯直接重写Provider。受控配置回调、VNode数据和既有symbol配置函数按职责保留；不新增顶层model、工具服务、更广Tooltip配置或新Token。Tooltip对象目前只公开title，其余新字段另案，不将已声明无效接口转为未来优化。

动手前先补可失败复现；如果已有测试假设与明确本库契约矛盾，说明依据、保留场景并补真实浏览器替代覆盖。全单元验收包括相关运行/公开类型/根严格/声明CSS/L7、真实浏览器/SSR水合、全部14Demo四算法和实际消费、Docs/Registry/内容/格式、清洁Apollo视觉与发布回执。只有该清单统一验收后再切换；不会把局部32通过标作整个Typography完成。

## 先行事实裁定：Provider生产链已验证正常

生产`typography-provider.mjs`复跑通过，覆盖五入口、编辑器/富内容、对象/函数/移除、原Demo与焦点。32条单测只改8处mount选项为`global.stubs.teleport=false`，未改产品/断言，32/32通过，确认默认替身引发重挂载假失败。原23失败及基线对照保留；本轮不重写Provider或semantic getter。后续用真实Teleport验证所有身份场景。

## 集中复现结果与明确不改项

27条新契约20通过/7失败：五入口纯id/class/style/onClick更新与移除、同一业务输入草稿/焦点共20项原实现正常，疑似computed缓存已被运行证伪，不重写四包装器/attrs。7条确认失败为文本编辑点击合并、编辑根ref/attrs、当前语言、复制失败误报、明确空字符串、原生富文本复制和重复异步复制。真实Chrome初11项均失败，覆盖两Token四算法、autoSize、编辑根/多行、Link自有操作嵌套、文本键盘入口及JS量测输入身份；其中disabled点击被已有CSS拦截，不把超时当缺陷，改用真实键盘验证后再裁定。没有Vue/page错误。

成组方案：保持已正常的Provider/四入口原生attrs；统一整理所属内容/操作与编辑宿主，接通当前locale/两Token；复制按真实结果/空值/原生内容处理，编辑接通既有autoSize和多行，JS量测不重挂已显示业务子树。原始剪裁/装饰/受控算法与参考场景保留，必要结构/键盘语义变更单独迁移；不靠宽断言让测量或旧DOM对拍通过。


## 原断言调整的契约依据（不是验收完成）

复制成功场景原先在没有任何写入成功桩时仍期待成功，源注释明确写“忽略false是为避免测试红”。现将该组成功fixture设为真实返回成功的clipboard Promise，保留反馈/回调/计时断言，并新增拒绝+fallback失败不得成功、空串、富内容和并发覆盖。编辑保留原生换行，普通Enter在keydown阻止插入并于keyup保存；旧剥换行断言改为保留原生规范化换行，IME/修饰键等场景原样保留。明确aria-label移除后回退当前语言Edit，不让编辑器无名称，草稿/焦点/身份断言保留。

Link现由span根拥有样式/ref与a原生动作，复制/编辑按钮是a的兄弟；href/rel/target/原生链接事件在实际a验证，disabled同时阻止键盘导航并暴露aria-disabled。文本触发模式补仅键盘焦点时可见的原生编辑按钮。参考DOM76场景保持，精确原生差异待实现冻结后统一登记；不反复按中间结构更新基线。两标题Token断言改为实际声明/引用，四算法浏览器复现保留，不再把“用户无法配置”固化为正确。


## 关联 Table 派生变量整改单元（实施前范围）

56个实际Demo四算法检查32组失败，零Vue/page错误。Typography语义文字/链接/展开文字默认对比不足、静态disabled文字不是可豁免的禁用控件；标题示例从外层h1跳到h3/h4，需保持标题内容并调整层级。semantic Demo自己给低对比文字色，应显式使用可读的当前文本别名。

Table示例另复现暗色表头1.03：当前style/index.ts在模块加载期计算T和三个实色fill、图标alpha及展开几何；40条变量中直接v()引用可跟当前别名，而这些派生值被冻结。链路已核对到Table外壳→engine.Table.props.style→实际table根，以及use-filter的FilterWrapper→Teleport实际css-var根。关联修复范围仅这组40条变量（包含原37及3规则派生项）的当前别名派生、既有Table配置覆盖/移除、原生变量优先级与两宿主；不扩成Table全部Props/Slots/model/交互验收。先保存原40条默认产物不变，再集中参数化默认推导并在两个实际宿主绑定当前CSS变量，不在示例上覆盖来隐藏缺陷。Table其他公开契约仍需后续完整单元。


## 2026-10-28 功能阶段（整单元尚未完成）

已成组实现：固定标签公开类型与默认槽类型、Link 的根/原生锚点/所属操作、编辑根 attrs/ref/原生点击与焦点所有权、当前语言、实际剪贴板成功/空串/富文本/并发/卸载、完整配置节点与零值、原生多行及当前 autoSize、保留可见业务身份的 DOM 测量投影和过期取消、两个有效标题 Token、可读文字与默认链接标识。关联 Table 只修复原四十变量的当前主题推导、既有覆盖和两个实际宿主，原浅色四十声明逐项一致。

集中补验发现并已解决同类边界：ellipsis.tooltip 数组不能展开成 DOM 属性，0 不能当空值；Link 次要色须保持语义，焦点装饰须读取实际 a 的焦点；展开/收起的自定义文案需出现在可访问名称中。实际 Demo 四算法失败复现保留，未改成查询隐藏的英文名称。五个 Demo 改用公开包入口；外部声明消费按真实依赖编译全部十四例。

当前证据：相关四层61文件1178项通过；最后展开名称改动后 Typography 7文件305项通过，原76机械场景保留，仅19场景有限差异逐项登记。相关8文件110类型通过、根严格检查通过、五入口与14实际Demo发布声明通过。生产浏览器15项契约、56组实际Demo主题+20组实际交互、12项SSR/水合均通过；包括实际 clipboard、多行高度、受控拒绝、IME、焦点与多实例。UI声明/CSS构建通过，复用同一产物的严格L7为11项0失败0待定。详细命令、用例和源码摘要见 typography-functional-stage-2026-10-28.json。

测试调整只涉及明确契约：成功复制 fixture 提供实际成功的 clipboard；内部换行保留；编辑名称移除后回退当前语言；Link href/rel/事件验证实际 a；旧参考差异逐项有限登记。为修复 Demo 对比而改变的颜色别名，同步更新实际 Provider Demo 的精确样式预期，保留配置替换、草稿、焦点及身份断言。CSS 颜色有父/子两层过渡，稳定颜色断言等待实际目标值，未放宽色值。

未验证/未收口：Apollo自有视觉候选、逐张审阅及复比、Docs全量门禁/实际页面/发布回执、最终清单和Registry统一验收。全库其余单元及最终同一提交全量门禁仍开放，不据本阶段声称全库完成。上轮临时原始日志已被宿主清理；本阶段新复现、验证摘要和源码哈希已入仓，不把未保留的日志伪称为新产物。


## 冻结前四入口编辑所有权复核

功能里程碑 `230892d9`（Table）与 `c4883402`（Typography）已提交推送。四个可编辑入口统一补验实际编辑根、名称/描述和原生监听；修前3通过/1失败，真实生产浏览器也确认 Link textarea 点击误触发原生锚点的业务监听。现编辑支路仅保留 Link 根 attrs 及编辑器名称引用，导航属性/监听留在显示态的原生 a；其余三个入口保持根监听。没有增加兼容层或新公共 API。

最后源码相关61文件1182项四层、16项生产浏览器、12项SSR/水合、根严格、14Demo发布声明消费与严格UI L7通过。原15组契约扩为16组，增加实际Link编辑点击负例；失败后的fixture清理用finally，避免把后续场景的残留状态误报为产品缺陷。

Docs内容/类型、15文件161测试及85页构建通过，本地35项实际页面/交互全部通过。`c4883402`已部署：workflow40657341285，构建122711482088和Pages122713595884均成功；CI全包拓扑L7为151项0失败0待定/n-a67。线上35项通过、零页面/Vue错误；28个Demo深链沿用已有404 SPA回退，API/进展物理页为200。此发布尚不含随后发现的Link编辑所有权修正，最终收口还会再发布。

接下来冻结14类自有视觉状态×3视口共42张；原76机械场景、24参考PNG、参考渲染器与fixture不改，原453自有批准记录/PNG不得更改。当前试捕仅用于校验场景，不算批准。详见 typography-acceptance-freeze-2026-10-28.json；最终视觉/Registry/发布回执仍待收口。
