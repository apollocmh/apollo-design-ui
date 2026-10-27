# Typography / Text / Title / Paragraph / Link 完整整改单元

盘点基线f10574fb（生产Avatar9af2a24f/共享ef832304）。本文件先记录当前源码和验收范围，尚未修改生产实现。已读取五个公开SFC、InternalTypography、Base/BaseContent、CopyBtn/Editable/Ellipsis/EllipsisTooltip、全部hooks和节点/复制工具、样式和两个Token、两级导出、双语API、14个原Demo及既有测试。历史报告只作证据，不替代当前链路。

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
