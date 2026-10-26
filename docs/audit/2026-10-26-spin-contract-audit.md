# Spin整改单元：当前契约盘点与统一验收

盘点基线：`c5c92e1b`。本单元覆盖Spin及Indicator、Looper、Progress、usePercent、全局默认指示器、静态CSS和4个Component Token；9个当前Demo、双语API、导出声明与实际Provider调用一起核对。List关联修复与57张List视觉验收已完成，不能当成Spin整单元完成证据。

## 实施前完整清单

以下结论来自当前源码的“声明→传递→消费”，不是历史README或旧参考的正确性背书。“待复现”须先执行失败场景，确认正常则保留证据，确认缺陷则本轮必修。

| 公开项 | 当前实际链路、分类与验收 |
|---|---|
| prefixCls | prop→当前Provider getPrefixCls→根/子件/样式类；已有切换代码，补动态替换/移除与多实例，D04预生成CSS要求保持 |
| spinning | boolean默认true→内部ref→watchEffect/debounce→ARIA/指示器/正文遮罩；正delay取消已有证据，delay=0仍因照搬React effect多等宏任务，待复现后按Vue更新修正 |
| delay | prop更新会取消旧定时器并重新排；核查正值、移除/0、非法数值、反复开关、卸载重挂及显示后更新，不能以同步prop断言替代真实计时 |
| size | 当前useSize getter→small/large根类；medium/middle/default为中号，既有别名与告警本轮按有效现契约核对；CSS祖先尺寸选择器会穿透内层，待嵌套行为复现 |
| description / tip | 当前computed description??tip→文案与语义工厂；prop 0已在List关联阶段修复；description槽存在优先、条件为空/移除、0/布尔/Fragment及当前性仍需复核，空容器不应伪装有内容 |
| wrapperClassName | 仅有默认槽或全屏时落根，已有告警；核对动态默认槽切换时落点。不新增旧indicator prop或函数兼容通道 |
| percent | usePercent返回当前数字/auto估值→Indicator→Looper/Progress；Progress人为flush:post让SSR缺环、0与undefined混同、非有限数字会形成非法ARIA；先复现再统一修正数值、SSR、水合与可访问名称 |
| fullscreen | root仍在文档流，实际mask独立fixed、关闭inert，List97项与真实Demo有证据；保留root/ref/正文值/焦点，补与插槽、进度、主题和多实例组合，不回退旧root固定布局 |
| classNames / styles | Provider→useMergeSemantic→当前浅响应式合并props；root/section/indicator/description/container/tip/mask均须实际落点。默认进度环是Looper holder的兄弟，indicator样式未覆盖可见圆环，待复现 |
| default槽 | useSlots→computed hasChildren/isNested→container；槽对象不是普通响应式props，槽存在性可能缓存挂载值。补条件新增/移除、同一函数内容更新、模式切换与编辑器身份；在render读取 |
| indicator槽 | computed调用槽→只取数组第一个节点→Indicator cloneVNode注入class/style/percent；首项为空、Fragment、多节点、动态slot、空槽抑制与作用域进度均未兑现Vue公共语义。本轮集中改为完整原生内容、显式单对象scope与统一语义容器，不保留隐式克隆注入 |
| description槽 | 模板有调用，但hasDescription缓存存在性且存在空包装；与上述内容组统一修正，空槽不能回退到prop |
| Slots导出类型 | SFC内联声明3槽但没有公开SpinSlots/indicator scope，包根/深入口须同步真实模板与正负消费测试 |
| Emits / v-model | 现有组件没有业务emits或模型，spinning由调用者提供状态；原生事件由attrs落根，不新增未约定模型或通知 |
| attrs / nativeElement | 当前mergeDomAttrs在render合并，原生class/style/事件优先；nullable div ref。补string/array/object style、attrs-only更新、事件.once、ARIA覆盖、卸载及模式切换；不把根样式复制到mask |
| Provider五字段 | spin.className/style/classNames/styles/indicator通过当前Proxy读取；当前主题/尺寸/方向取各自上下文。验证替换/删除/最近Provider/多实例及函数合并上下文，不更改通用components schema |
| set/getDefaultIndicator | 模块单例当前是非响应式；setter类型VNodeChild但Indicator只接受VNode，字符串/0等被忽略；computed还阻断已挂载实例下次render读取。保留现有命令式默认配置职责，渲染读取当前值，验证重置及实例/Provider优先级 |
| 导出/安装 | named/default/ASpin安装、静态与具名setter/getter、SpinRef/Props/Config/语义类型、token类型/prepare函数/CONTENT_HEIGHT/genSpinStyle；补真实SFC、发布声明及生产SSR消费 |
| 4个Component Token | contentHeight/dotSize/dotSizeSM/dotSizeLG均有类型、prepare与文档表，但运行时不读theme.components.Spin。CSS只展开Alias尺寸，contentHeight完全未消费，属于既有接口失效，必须同组补齐，prepare返回完整精确类型 |
| 静态CSS / 主题 | 读Alias变量但没有局部主题投射与组件Token；尺寸与busy容器祖先选择器会影响嵌套实例。核对正常/暗/紧凑/组合、显式CSS变量优先、动态移除/恢复、RTL、默认文字对比度与实际几何 |
| 动画 / 生命周期 | 默认动画使用1/1.2s字面值；theme.motion=false及prefers-reduced-motion需实际浏览器复核。auto interval与delay timer均须取消并验证卸载不残留；自定义内容的动画仍由调用者拥有 |
| 9个Demo与双语文档 | basic/size/nested/description/delay-and-debounce/custom-indicator/percent/style-class/fullscreen均已读；custom-indicator仍传已移除indicator prop，实际不展示示例自定义图；双语API也仍宣称该prop。必须同步修复并实际浏览器验证，不能以Demo冒烟通过代替 |
| 直接消费者 | List、Table、QRCode、Mentions实际导入并消费Spin；按共享影响复验四组件，不把它们的整单元一并升级 |

## 集中设计与验收标准

内容/语义组统一在Vue render读取3个槽，完整渲染VNodeChild；indicator以一个稳定容器承接语义class/style，作用域为单对象percent，不再注入到用户首个VNode。section始终为独立且稳定的加载层，普通/嵌套/全屏通过CSS定位切换，避免为了旧DOM分支而重挂用户指示器内容；root/section语义落点随本轮迁移集中说明。存在但有意为空的槽抑制Provider/默认内容。已移除的indicator prop不恢复。既有有效别名不因本轮清理反复迁移。

状态/SSR组去掉只为模拟React effect产生的首帧空白与零delay宏任务。未提供percent为不定进度，显式数字（含0）和auto有可访问圆环，非有限数回到不定进度；SSR直接输出当前确定状态，客户水合不换原节点。保留正delay的防闪烁、立即关闭及timer清理，auto仍按当前估算算法推进。所有旧参考场景保留，合理契约更正登记逐用例精确差异，不改共享归一化、旧基线或阈值。

样式/Token组让4个已有字段真实落CSS变量并响应当前主题；contentHeight明确为嵌套加载层的最大高度，默认400，不限制正文自身高度或全屏覆盖层，避免把所有正文强行扩成400px。尺寸、busy及动画配置按最近Spin拥有，原生CSS变量与消费者显式样式优先。动态主题/紧凑、motion与减少动画偏好有真实浏览器证据。

先建立覆盖上述根因的失败复现，再同步实现、类型、9个Demo、双语API、迁移与Registry。统一执行Spin四层/类型、真实SFC与发布声明/Node SSR、UI构建/L7、四直接消费者、实际浏览器与自有视觉矩阵；修改共享工具时检查其他消费者。逐项关闭本清单后再切换，存在本轮缺陷不得降为后续优化。

新加载请求管理、取消业务、弹层容器API或自动焦点圈是另案；本组件不新增这些能力。全库最终同一提交门禁仍在全部整改单元结束后执行。本单元当前仅完成源码盘点，复现、修复与统一验收尚未完成。

## 集中修复前的实际复现

15条行为复现中14失败/1已正常（正delay取消、立即关闭和卸载清理）；生产Chrome29项中21失败/8已正常；真实模板类型2条诊断均指向indicator槽缺少percent scope。浏览器已确认4个Token失效、嵌套尺寸穿透、motion=false与减少动画偏好无效、动态默认/具名槽和声明为VNodeChild的全局内容未兑现。生产源码仍与c5c92e1b相同，逐文件哈希、全部用例名、失败诊断及实际值保存在 [统一结构化证据](evidence/spin-contract.json)。这些是待修缺陷，尚未宣称验收。

## 集中实现里程碑（整单元仍开放）

已成组修正完整原生内容与显式percent scope、稳定root/section/indicator、确定进度首帧与SSR、当前4个Token和尺寸拥有关系、busy样式隔离及默认动画配置。验收中另复现空正文加载层零高度，用同一原生grid区域承载正文与加载内容，正文保留自身高度且为空时也有真实占位。没有新增旧indicator prop、首节点克隆或React首帧模拟层。

当前15条行为复现全部通过；生产浏览器32项全部通过。主题移除测试使用真实Teleport，并比较nativeElement及实际DOM；默认VTU Teleport桩会重挂，重复获取vm也会产生新代理，二者均不作为生产节点身份判断依据。

相同冻结生产源码检查Spin/ConfigProvider及List/Table/QRCode/Mentions四直接消费者：55文件899条首轮863通过，36个机械参考预期失败；逐项核对仅涉及Spin结构变化后，更新List35场景及QRCode loading的精确差异，3文件50条复验通过。以文件+完整用例名核对，原899条断言均取得通过记录；这是分批覆盖，不声称一次全量运行。Spin自身47条原参考场景保留，每条精确差异均审阅；共享归一化和旧基线不变。

根严格检查、18文件160条类型、真实SFC、发布List/Spin声明、无window/document的生产ESM九条SSR、UI含dts/69CSS、L7 strict11项通过。新Spin源码指纹覆盖12文件，SHA256为`b2fe21bdf22aa81f1fccd7a888681ae84cd35d5d67be9615c87f0258b52d825e`。既有List生产浏览器97项和12个List实际Demo+Spin全屏Demo13页复验通过。

9个原Demo及其说明同步，新Token Demo演示既有4个字段，总数为10；移除说明里的重复失效代码块，代码面板继续展示真实Vue源码。Docs因此精确1002→1003，两个数量哨兵保留并新增具体spin-demo-component-token断言。双语API、迁移、内容校验、157条Docs测试、严格类型和SSG通过。

体积记录：源主题解析/变量投射与完整内容链路使当前Spin单独引入为32.9KB，旧22KB上限不足。按用户接受合理开发期增长的授权，单条预算改34KB并记录技术原因；确立预算时10.9KB历史值、其他72条预算及全量占比限制保留。不为该旧预算开展无关压缩重构。

尚未完成：Spin自有默认/暗/紧凑/组合视觉矩阵与清洁提交批准、独立源主题SSR水合、原完整清单最终逐项收口，以及共享List57张批准图的像素回归。这些继续在本单元完成后再切换组件，不能把本实现里程碑标为整单元完成。
