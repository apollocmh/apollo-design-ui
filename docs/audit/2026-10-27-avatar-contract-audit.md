# Avatar / AvatarGroup 完整整改单元

盘点基线db24a00c（Tag发布回执5e3cf508不改变组件源码）。当前实现为9af2a24f，关联共享修复为ef832304；原始盘点、红灯与阶段证据按下文保留。完整单元正在最终统一验收，不能把旧四层112/112或任一阶段绿灯当作当前整库结论。

已读取Avatar/Group两实现、interface/context/两级导出、全部12 Token及CSS、9对原Demo、双语API、现有七测试文件和31机械场景；继续追踪到当前Provider视图、size注入、主题源、断点订阅、ResizeObserver、toArray、Popover→Tooltip→Trigger、Upload/List/Listy四处真实Demo消费。旧README/PLAN只作历史证据。

## 范围与完整清单

| 链路 | 当前事实与分类 | 本轮验收标准 |
|---|---|---|
| Avatar 12字段 | prefixCls/shape/size/gap/src/srcSet/draggable/icon/alt/crossOrigin/onClick/onError逐项追踪；回调形态与动态链路待红灯 | Props/默认值/类型/实际原生宿主一致；原生事件支持合并、once和实际载荷，取消回退有明确同步契约 |
| 内容 | 默认槽有缩放宿主；src/icon的VNode数据通道存在，模板缺少对应具名槽，src声明完整VNodeChild却只消费单VNode | 完整/空/条件内容，合法0/数组节点、事件、状态与焦点；不得取首个节点或用React内容函数 |
| 图片状态 | src变化重试；srcSet变化不重试；旧onError无原始事件且返回值取消；漏alt有旧axe违规断言 | 加载失败/取消/重试、动态图片配置、装饰默认alt和调用者明确alt；原生监听不得双发 |
| 尺寸 | 字符尺寸继承正常；数字/响应式样式只读props.size，绕过Group；稀疏断点只选第一活动断点 | 组件→Group→Provider优先级、数字0、稀疏表、数值/响应式切换、嵌套组和多实例实际尺寸 |
| 字符测量 | 仅监听内容，未监听根尺寸；SSR文字opacity0；过大gap可能保留旧scale | 根/内容变化、隐藏后显示、字体/主题/尺寸变化、反复重挂、真实浏览器拟合且SSR文字可见 |
| attrs/ref | Avatar render读attrs；Group computed缓存attrs；两ref已有nativeElement | 动态class/style/attrs/listeners，字符串/数组/对象样式，根身份和公开ref正反类型 |
| Group字段/子项 | prefix/max/size/shape及四旧别名；重写所有key；max.count用||与旧别名合并；0明确为不限量 | 计数边界/动态子项/Fragment/条件槽、调用者key/输入状态/焦点、max显式0优先；迁移集中评估 |
| 溢出浮层 | Popover配置content可覆盖隐藏项，classNames对象/函数及rootClassName合并已有Issue29；默认hover头像span无键盘入口 | 保留配置和语义合并，原生键盘入口、Enter/Space/Escape、受控/非受控开关、内容实际可达、重复开关/卸载和多实例 |
| Provider/样式/Token | 头像解构冻结class/style；12Token仅构建默认，无当前主题源；组重叠/浮层间距需实测 | 当前源替换/移除、全部12既有Token真实消费、4算法、RTL/局部前缀/Teleport、原生CSS变量和样式优先级 |
| 无障碍 | 默认白字占位背景；alt缺失上游违规被固定为正确；静态头像本不需Tab | 实际颜色对比、默认图像装饰、明确名称、溢出原生按钮焦点可见性与axe；保留静态非交互语义 |
| Demo/文档/消费 | 9原Demo保留；max-count把所有头像包为一个组件；responsive空白；Token Demo以错误架构理由缺失 | 修正真实原交互和说明，补既有Token的可操作演示；原9例+Token例在4算法与实际Docs通过；核对4真实消费Demo |
| 机械/视觉 | 31原JSON和36参考PNG保留；旧L6是参考证据 | 精确差异及Apollo替代断言；清洁提交生成、逐张审阅自有视觉并复验，不修改已有批准图/阈值 |
| Emits/model/expose边界 | Avatar/Group无可绑定业务状态；Group开关通过max.popover；ref只有元素 | 不新增无关model或实例方法；明确本轮既有状态适用的受控/非受控验收 |

## 集中决策与边界

本轮直接修正Vue事件和内容能力、当前尺寸/Provider/主题、子项身份和键盘缺陷，迁移独立记录，不建兼容层。VNode数据本身是合法接口，不因名称来自其他生态删除。max.count=0沿用公开“不截断”；不新造条目数据模型、分组item模板、动画或额外Token。四旧Group别名与配置rootClassName集中评估后记录，不能零散反复迁移。基础包只在复现证明共享缺陷时修改并回归相关消费者。

## 统一验收

先保存红灯结果，再修实现/类型/测试/Demo/双语文档。最终核对上表全部项，执行相关四层、公开类型、根严格检查、UI声明/CSS与严格L7、真实浏览器/SSR水合/消费端、原Demo四算法、Docs类型/测试/构建/线上与Apollo视觉。阶段提交只表明对应阶段；全部清单验收前不宣称Avatar完成，更不代表全库最终门禁。


## 成组实现与功能验证（完整验收尚未完成）

初始19契约1通过/18失败；正确当前算法与稀疏表/原生样式夹具的26浏览器4通过/22失败。补充完整链路的31项在阶段实现上又复现4条失败：无主题溢出按钮重叠、原生Group变量、真实RTL和局部前缀；已集中修复。声明AvatarConfig不能传入Provider有真实SFC类型红灯，现以闭合映射保留准确两字段，未放宽断言或增加任意键。Group原生attrs原验证正常，未宣称发现不存在的缺陷。

当前143/143四层、12项Avatar类型检查、源与真实发布SFC（根/深入口/静态子组件/ref负例及全部10Demo）通过；UI声明/69CSS及全包拓扑严格L7 151项0失败/0待定通过。生产浏览器31/31；10个实际Demo四算法40项加6组真实交互共46/46；8组Node SSR和9项水合/交互共17项通过。默认浅色文字对比从1.84修正；12 Token均实际消费，数字文字也消费文字Token，原生Group变量在所属宿主解析，Teleport继续遵循当前源。

四个真实消费Demo四算法16组通过；其中List两处、Listy一处固定蓝背景在暗色的实测3.39已补黑色前景，四算法均达到要求。Upload原始头像入口保留；仅外部图片响应做本地SVG固定，不改变组件或断言。

143与L7仍不是全库最终门禁。关联运行整批、最终严格/格式/内容/Registry、实际Docs及清洁Apollo视觉尚待统一验收，暂不标记本单元完成。完整机器结果见avatar-contract.json。


## 末段完整动态传递补查（仍在统一验收）

在48张视觉与27项实际Docs通过后继续核对max.popover动态链路，发现Popover/Tooltip前缀固定初值、换容器失焦；源浏览器36项33通过/3失败。修正前缀与所属DOM搬迁后又补齐当前destroyOnHidden和关闭焦点，42项39通过/3失败：初始销毁策略仍被Portal缓存、实际关闭时未归还所属触发元素。

根因集中在现有共享链：Popover/Tooltip前缀改为当前computed；Portal以首个已挂载子节点识别真实Teleport范围，动态读取autoDestroy；Overlay只在实际接受关闭且浮层拥有焦点时归还触发元素。补足普通主动blur、受控拒绝、焦点型触发器防重开、同源文档与不抢外部/非活动frame焦点。目标代码已经冻结，19条专项通过；42条源浏览器通过，发布包和全部受影响组件整批回归待完成。

这段是原完整单元的关联缺陷，未归为未来优化，也未标记整个Portal/Overlay/Popover/Tooltip完成。架构职责与基础包契约同步说明，既有根接口和事件载荷不增加兼容通道。Avatar自身32份实现/Demo/公开文档哈希仍与9af2a24f一致；48张审批记录来自清洁4e2d9d04，最终共享实现将重新执行像素门禁。

共享修复阶段：Portal→Overlay→UI按依赖顺序重建成功，源与真实发布浏览器均42/42，根严格类型0错误、构建结束后全仓格式0错误（37既有警告/5提示）。构建中的临时声明曾被格式扫描纳入，已在清理后重跑；没有忽略源码诊断。最终关联整批、公开类型/L7、SSR/Demo/消费者、Docs和视觉仍待完成。

L7补充：新共享焦点实现使Image按需产物实测78.9KB，超过原78KB，其他72条预算通过。按用户此前“小幅超预算接受，不再纠结”的明确裁决，仅Image预算更新为80KB，并保留原始失败和历史measuredKb；未压缩必要交互、未取消B6/占比检查，重跑结果随后登记。


## 冻结实现的清单核对

| 原完整清单 | 当前证据与结论 |
|---|---|
| 公开字段、图片状态与事件 | 已实现/已验证：click/error原生事件、同步beforeFallback、srcSet等配置重试、默认装饰alt；自有string img负责错误，调用者VNode/slot自管原生错误 |
| 内容、尺寸与文字测量 | 已实现/已验证：完整/空/动态image/icon/default、合法VNode数组/0、尺寸继承与稀疏响应表、根/文字观察、SSR首帧可见；42发布浏览器、46原Demo交互与17 SSR/水合通过 |
| attrs、ref、Provider与样式 | 已实现/已验证：原生样式合并、根身份、当前Provider/方向/前缀、12既有Token、原生组变量及Teleport主题；源/发布SFC及6文件72类型检查通过 |
| Group计数、子项身份及关联浮层 | 已实现/已验证：max单一配置、0不限量、稳定业务key/编辑器；原生溢出按钮、Enter/Space/Escape、动态prefix/container/destroy、受控接受/拒绝与反复重挂 |
| 焦点与共享影响 | 19专项、42源/发布浏览器、Portal所属文档10项、Image交互26项及叠层焦点脚本通过；当前关联组件四层整批仍在运行，尚未以阶段结果代替 |
| 类型、声明和构建 | 根严格0错误，Portal→Overlay→UI重建成功/69CSS，三个包严格L7均0失败/0pending；Image单项80KB预算按用户明确裁决，原78KB失败保留 |
| Demo、文档和实际消费 | 9原Demo保留并补既有Token例，10例×4算法+6交互共46通过，4真实消费×4算法16通过；Docs72组件/1006 Demo、类型、15文件161测试、85页SSG及实际27浏览器通过；线上发布待执行 |
| 机械和视觉 | 42原机械/fixture/36参考PNG/渲染器文件与db24a00c一致；清洁4e2d9d04的48张自有图逐张审查，ef832304重建后原始RGBA48一致，Avatar/List105项既有门禁0差异；List三处SVG原始AA边界保留 |
| 派生状态和全仓边界 | 内容清单546行/199候选/22已验证，工具链12通过，453批准图哈希通过；最终Registry及文案后的格式仍待验。927缺图和其他整改单元保持开放，不宣称全库通过 |

本表全部适用行为已经实现；“最终关联整批”和“最终派生检查”尚未取得结果，因此此时仍不标记单元完成。完整视觉及保留证据见[avatar-visual-browser.json](evidence/avatar-visual-browser.json)。当前实测为Chrome150/darwin-x64；其他浏览器、触摸设备及未列出的跨文档组合未验证。没有需要用户裁决的未决公共API，也未新增无关能力。

验证执行更正：单worker关联整批在进度诊断后被代理的清理命令打断，ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING来自inspector求值，不是产品断言。该次无最终报告、不能计为通过；原日志指纹保存于avatar-contract.json，完整同范围以双worker和default+JSON实时报告重跑，无附加诊断。其余已结束的独立门禁不受影响。
