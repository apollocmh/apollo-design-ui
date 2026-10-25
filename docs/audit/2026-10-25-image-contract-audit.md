# Image 整改单元：完整契约盘点与统一验收

盘点基线：`4e3e8f67`。该提交是在完整盘点规则生效前已实施的关闭控件增量；`b7a722e1` 将当前工作纪律写入规范。本文件是后续 Image 整改单元的统一清单，修复和验收持续更新在这里，不再为每个字段建立完成报告。

## 范围与状态

本轮覆盖 Image、ImagePreviewGroup（含 Image.PreviewGroup）、内部 Preview/Progress、注册上下文、useStatus/useImageTransform、公开导出/类型、18 个 Demo、双语 API、静态 CSS/Token，以及实际调用的 ConfigProvider、theme、portal、motion、utils/a11y 链路。共享层如需修改，补查其其他消费者。基础包自身其他能力及其余 71 个组件另设整改单元，不能用 Image 结果替代。

分类为“已验证正常 / 本轮必修 / 需要裁决 / 另案处理”；证据状态另外记录“已实现 / 已验证 / 未验证 / 受阻”。“待复现”表示已纳入本轮核实，复现成立即为必修，不能借此把无效接口移出本轮。下表中的既有测试已在基线前真实执行，但不是最终同一提交的统一验收；源码链路核对与行为证据分别记录。

当前整改单元未完成。不得依据 Registry completed、历史上游快照或 405 条局部运行测试宣称完整契约验收。

## 公开 Props 与数据链路

声明统一来自 `packages/ui/src/image/interface.ts`；Image 与 Group 的运行时声明分别在 Image.ts / PreviewGroup.ts。下表逐项列出传递与消费，公共监听器在事件表单列。

| 对象/字段 | 当前传递 → 消费 | 分类与证据状态 |
|---|---|---|
| Image.src | useStatus → 缩略图 srcAndOnload；previewSrc → Preview/注册表 | 本轮核实：真实 Node SSR 已失败；fallback、换源及实际 DOM 事件需成组验证 |
| Image.alt | commonProps → 缩略图；Preview.alt → 大图和 dialog 名称；注册表 → Group | 本轮核实：显式 alt 已验证；省略/空 alt 的可访问名称未验证 |
| crossOrigin | commonProps → img；注册 data → Group COMMON_KEYS → Preview.imgCommonProps | 已实现；动态值/移除的专项行为待统一补验 |
| decoding | 同上 | 已实现；待统一补验 |
| loading | 同上 | 已实现；待统一补验 |
| referrerPolicy | 同上 | 已实现；待统一补验 |
| sizes | 同上 | 已实现；与 srcSet/fallback 合用待补验 |
| srcSet | 同上 | 已实现；实际候选资源失败后 fallback 是否被绕过待补验 |
| useMap | 同上 | 已实现；待统一补验 |
| draggable | 同上；另有 Preview 鼠标拖拽逻辑 | 已实现；原生图像拖拽与自有拖拽的关系待补验 |
| width | toCssSize → 根 style；img width；单图 imageInfo；Progress width | 已验证正常（native-style/slots）；Group 注册数据未含尺寸，需明确预览尺寸边界 |
| height | 同上，另用于 img style.height | 同上 |
| fallback | useStatus → 缩略图和单图 Preview；Group 注册 data 未含 fallback | 本轮核实：真实失败事件、分组及 srcSet 链路待补验 |
| placeholder | 分类函数 → 普通 loading overlay 或提前返回 Progress | 本轮核实：VNode 数组、0、null/false 与配置对象的归一化及当前切换 |
| placeholder.progress | progressConfig → Progress；boolean/配置对象 | 已实现；反复切换/移除、与 src 合用待补验 |
| progress.percent | Progress percentValue → rail/indicator/ARIA | 已实现且基础用例通过；有限值/越界/移除待清单统一复核 |
| progress.render | Image 转发 → Progress 在 render 中调用（progressBar, percent） | 已实现的嵌套配置 renderer；需验证当前替换/空返回/惰性，不因函数名称机械迁移 |
| Image.preview | computed null/对象 → canPreview、封面、单图 Preview 或 Group.onPreview | 本轮核实：反复 true/false/对象切换、打开时禁用及组级禁用的子触发器语义 |
| Image.open | computed 受控值 → Preview.open，watch 同步移除控制后的内态 | 已验证正常（preview-state）；反复开关与其他选项组合待统一复验 |
| Image.defaultOpen | 初始化 innerOpen；后续不重新初始化 | 已验证正常（preview-state）；真实 Node SSR 仍必修 |
| Image.prefixCls | computed 当前 prop/Provider → 全部节点及 Preview 前缀 | 已验证正常（prefix-reactivity）；自定义 CSS 预生成约定保留 |
| Image.wrapperStyle | semantic source → root style，原生 style 在后 | 已实现的旧数据别名；既有原生样式回归通过，不新增兼容通道 |
| classNames | Provider + 局部 schema → root/image/cover/progress/popup | 已验证正常（provider/popup-provider）；别名重复拼接需核实 |
| styles | 同上，字段浅合并；根 attrs.style 最后 | 已验证正常；theme 变量跨 Teleport 与组件 Token 覆盖另列必查 |
| Group.items | 显式 items 优先 → COMMON_KEYS/src → mergedItems | 已实现；对象字段消费边界、换列表/删当前项/清空及打开时切换待补验 |
| Group.preview | computed → Preview，关闭时仅返回 children | 本轮核实：与 Image 共用 PreviewConfig 声明是否超出可消费字段 |
| Group.open/defaultOpen | 同 Image 开合内态与受控请求 | 已验证正常（preview-state）；空 items、移除注册项组合未验证 |
| Group.current | 受控值或 innerCurrent → currentItem；setCurrent 约束请求范围 | 已验证正常：受控拒绝/事件；移除控制是否保留最后同步值待核实 |
| Group.defaultCurrent | 初始化 innerCurrent | 已实现；后续 default 变化、删项/空组组合待核实 |
| Group.previewPrefixCls | 当前 prop/Provider → Preview 及 mask-hidden 名称 | 已验证正常（prefix-reactivity） |
| Group.classNames/styles | 当前 Provider/局部 schema → Preview；根 attrs 自然透传 | 已验证正常（popup-provider）；仅有 root 配置如何落 Group 根待核实 |

## PreviewConfig 全字段链路

GroupPreviewConfig 当前是 PreviewConfig 的完整别名。Image 专属字段在 Group 是否有定义，必须集中评估，不能逐次添补含义或反复迁移。

| 字段 | Image → Preview / Group 当前链路 | 分类与证据状态 |
|---|---|---|
| src | Image.previewSrc；Group 不读取该字段 | 本轮必查的声明/消费不一致；集中确定 Group 的精确类型边界 |
| afterOpenChange | 两入口 → Preview 回调，CSSMotion.onVisibleChanged → 调用 | 已实现且焦点专项已有行为证据；保留/迁移在集中 API 评估中一次决定，不先拆事件改造 |
| cover | Image.normalizeCover → 缩略图 hover 层；Group 不读取 | 本轮核实：null、无 coverNode 的配置、0/数组；Group 类型边界同 src |
| mask | 两入口仅消费 false → mask-hidden 类；对象其他字段未传递 | 本轮必修：兑现已声明 blur/style/className；VNode 与遮罩配置混用需集中评估 |
| maskClosable | 两入口 → Preview → onMaskClick | 已实现且 preview-state 有关闭证据；动态拒绝/移除需统一复验 |
| closable | 两入口 → Preview → 是否创建按钮 | 已验证正常（4e3e8f67）；隐藏已聚焦按钮、Esc 均有真实浏览器证据 |
| closeIcon | 两入口 → Preview 原生 children；槽优先，显式 null/false/0 保留 | 已验证正常（4e3e8f67）；不据此关闭整个配置审计 |
| rootClassName | 两入口 popupClassNames.root 和 Preview.rootClassName 同时传递 | 本轮核实：重复 class、文档推荐目标 root/popup.root 一致性 |
| maskClassName | Group 拼进 popup mask；Image 未消费，文档却推荐 cover | 本轮必查的别名语义矛盾；不以历史对照自动裁决 |
| forceRender | 声明保留，文档明确“已移除/忽略”，运行时未消费 | 集中 API 评估：清理死声明或明确边界；不得伪称已实现 |
| destroyOnClose | 同上；内部 Portal.autoDestroy 固定 false | 同上，并核实开关/缓存/卸载的实际契约 |
| movable | 两入口 → Preview.onMousedown 门控 | 本轮核实：拖动期间改 false、关闭/卸载没有显式停止逻辑 |
| minScale | 当前 getter → transform clamp；zoomOut disabled | 已验证正常（ec7ea3d0）；无效数值边界仍待核实 |
| maxScale | 当前 getter → transform clamp；zoomIn >= disabled | 已验证正常（ec7ea3d0）；同上 |
| scaleStep | 两入口 → Preview，仅双击使用；工具栏和 wheel 固定 0.1 | 本轮必查：文档“步长”与实际消费不一致；先复现和确定同一行为契约 |
| zIndex | 两入口 → useZIndex → Preview 根 style | 已实现；主题基数、嵌套及动态值待核实 |
| getContainer | 公开声明/文档支持，两入口均未传到 Portal | 本轮必修；复现后统一接入，验证动态容器、关闭缓存、焦点与卸载 |
| icons | 当前对象合并默认；Group 根据当前 direction 镜像导航图标 | 已验证正常（provider-direction）；显式 undefined/null/false 与映射一致性待补验 |

## Slots、Emits、模型和公开导出

| 项目 | 声明 → 消费 → 当前证据 |
|---|---|
| Image.imageRender | ImageSlots → 正常图片 render 当前函数；originNode/src/alt/width/height/title/classNames.image；image-slot/类型/生产浏览器已有证据 |
| Image/Group.previewImage | 各层 render 函数转发 → Preview body；单对象 originNode/src/alt/transform/current/total；preview-slots 已验证当前/空/移除与编辑器 |
| Image/Group.previewActions | 各层当前函数 → Preview footer；originNode、9 个 icons、8 个 actions、transform/image/current/total/disabled；当前/空/移除与动作已验证 |
| Image/Group.previewCloseIcon | 当前无参数内容函数 → 条件关闭按钮；18 个专项及实际 Demo/64 条类型已验证 |
| Group.default | 当前 default 槽 → children → Image 注册；源码已核对，条件挂载/重排/多组需统一复核 |
| Group.previewCount | 当前函数 → Preview 默认计数替换；单对象 originNode/current/total，空与移除已验证 |
| Image.click | 原 MouseEvent，内部请求后 emit；Progress 路径只通知；native-events 已验证数组/once/修饰符 |
| Image.error | 原 img Event → typed emit；与 useStatus 的原生错误消费、fallback 全链路待核实 |
| Image.keydown | 原 KeyboardEvent → emit 后内置 Enter/Space；preventDefault 优先；原生事件专项已验证 |
| Image/Group.openChange | (next, previous)，写内态前捕获 previous，随后 update:open；preview-state 已验证 |
| Image/Group.update:open | boolean；受控拒绝/非受控/外部驱动不回声；preview-state 已验证 |
| Group.change/update:current | setCurrent 范围内请求 → 先 change 后 update；受控拒绝、数组/once 已验证；模型移除/列表缩减待核实 |
| Image/Group.transform | 每个实际动作后的六字段快照，关闭复位通知，拒绝关闭不复位；preview-transform 已验证；拖动结束/卸载残留需补验 |
| TransformInfo | rotate/scale/flipX/flipY/x/y 均为值快照；原始图状态由共享 actions 更新，不能让监听器篡改内部对象 |
| v-model | open 两入口，current 仅 Group；没有 modelValue 别名，保留已公布命名 |
| Expose | 两入口均未声明公开 expose 方法；本轮不凭习惯添加 imperative API |
| named/default/install | Image、ImagePreviewGroup、默认 Image、AImage/AImagePreviewGroup；安装链路待实际验证。发布声明 TypeScript 检查器已确认 Image.PreviewGroup 为 any，而具名 Group 非 any；本轮必修，日志 `/tmp/apollo-image-contract-static-types-baseline.log` |
| 工具/类型导出 | genImageStyle/genImageTokenDecls/prepareImageComponentToken、ImageComponentToken 及 interface.ts 已导出类型；源码、生成声明与消费端已列入最终门禁 |

## 响应式、attrs、Provider、样式、关联子组件

| 链路 | 已查事实与本轮验收边界 |
|---|---|
| Image 根 attrs | 正常 div 显式 attrs + class/style 数组合并，保留原生 id/data/ARIA；可预览时 role/button tabindex 内置；preview=false 保留调用者 role。Progress 复用 attrs 自然透传且保护状态 ARIA；已有回归通过，动态禁用组级行为需补验 |
| Preview attrs | 私有 inheritAttrs=false，实际 imgCommonProps 与受控节点字段分别组装；不能把根 attrs/style 复制到弹层 |
| Group 根 attrs | 单根自然透传；preview=false 时返回无组件类的 div。公共 root 语义配置消费是否完整，列入核实 |
| 注册与数据更新 | 稳定 id、Map 同 id upsert、卸载注销；src/alt 更新顺序已验证。多个 Group 隔离、嵌套 Group、当前项删除、items/注册模式切换未验证 |
| ConfigProvider | Image/Group 使用当前 useComponentConfig；classNames/styles 合并、前缀与 RTL 图标已有真实证据。通用 getPopupContainer 是否应作为全屏预览默认容器需据公开规范确认，不能擅自套 Tooltip 行为 |
| theme | ConfigProvider 只在作用域元素写 alias 变量，body Portal 无继承路径；Image DECLS 默认值固定；component-token Demo 仍是 PENDING 占位。属于本轮必查且不能以默认主题代替主题覆盖 |
| CSS | 静态 CSS + 变量，默认/apollo 与预生成自定义前缀；进度、遮罩、按钮、默认计数；计数 AA 生产矩阵已有证据。其他 Token（含 imagePreviewSwitchSize）的真实消费、暗/紧凑与局部覆盖待逐项复核 |
| Motion | CSSMotion 真实 Portal，默认前缀名与 500ms 兜底已有证据；关闭完成、快速反向、重复请求、ref 重挂与多层焦点需要最终组合验证 |
| 焦点与 a11y | useLockFocus 来自 utils，由 a11y 再导出；focusRestore 来自 a11y。既有打开入焦/Tab/外部锁/关闭与嵌套卸载归还有证据；容器搬迁/无 alt/多实例及无可聚焦子节点需统一覆盖 |
| 拖动生命周期 | Preview 只在 mouseup 移除 window mousemove/mouseup；关闭、禁用 movable、scope dispose 没有对应清理。属于本轮核实，需真实行为与真实 listener 配对证据 |
| 状态机/SSR | useStatus immediate watch 对非空 src 调用 new Image；纯 Node 发布包 SSR 已确认退出 1，见 `/tmp/apollo-image-full-audit-node-ssr-baseline.log`；不得以 jsdom renderToString 冒充无 DOM SSR |
| Demo/文档 | 当前 18 个真实 Demo；preview-mask.blur 和 component-token.PENDING 尚无对应能力证据，必须随本轮实现/文档处理；README 历史 emits P4 等已过期，应以当前实现清账 |

组件 Token 的每个声明也列入消费核对，不能只比较生成字符串：

| Token | 当前消费与待验证项 |
|---|---|
| zIndexPopup | DECLS 定义变量；Preview 又以 imageTokenValues 和 useZIndex 写根内联 zIndex。默认值、偏移是否重复及覆盖优先级待浏览器核实 |
| previewOperationColor | DECLS → footer，动作继承；全局/局部主题及组件覆盖待补验 |
| previewOperationHoverColor | DECLS → 可用动作 hover；组件覆盖待补验 |
| previewOperationColorDisabled | DECLS → 禁用导航/动作；组件覆盖及状态待补验 |
| previewOperationSize | DECLS → 关闭/导航/工具栏字号；主题尺寸覆盖待补验 |
| progressAnimationDuration | DECLS → ink/rail 动画；主题覆盖与 reduced-motion 待补验 |
| imagePreviewSwitchSize | prepareComponentToken 返回派生数值；未见对应 CSS/DOM 消费，需确认公开类型/文档究竟承诺什么并集中修正 |

## 根因分组与动手前的集中评估

1. **声明与消费不一致**：mask 全形态、getContainer、scaleStep、Group 支持字段、别名推荐目标和重复转发、Token 实际落点。先用同一组公开入口矩阵复现，再集中确定类型与数据边界；不为遗漏字段引入无关能力。
2. **状态与生命周期**：真实 Node SSR、真实 img load/error/fallback/source 更新、校验清理、拖动关闭/卸载/禁用、Group current 移除控制和 items/注册切换。按根因决定实现，覆盖重复开关、重挂及多实例。
3. **Vue 公共用法和归一化**：静态子组件精确类型；合法 VNode/null/0/数组、条件插槽和可访问名称。已有有效的配置数据与业务回调不按字符串批量迁移；确需 API 修正时在本轮集中记录旧/新写法。
4. **Provider/样式共享链路**：局部主题跨 Portal、组件 Token、主题 z-index/尺寸/颜色、容器与焦点。先确认共享层契约和其他消费者，再确定修复所在层，不能只让 Image 默认主题变绿。
5. **文档与证据收口**：移除当前范围的 PENDING 假示例/过期完成声明，保留历史来源；每项关联源码、复现、提交与最终验证日志。9 张已批准 Apollo 基线缺失单独记录为受阻，不能复制 React 快照或降低阈值。

## 验收标准与证据账

- 每个公开字段与关联子路径有上述清单映射；待核实项均有真实复现结果。已声明接口无效或关键交互缺失，复现后必须本轮修复，不移为优化项。
- 统一覆盖两入口、受控/非受控、动态替换/移除、条件/空槽、重复开关、卸载重挂、焦点与多实例；组级数据还覆盖当前项删除、items/注册切换及空组。
- 运行、严格类型、真实模板/发布包消费端、无 DOM Node SSR、真实 Chrome（无 Vue/页面错误、完整 axe）、适用主题/视觉、文档内容与 Registry 必须有实际命令/结果；共享层补充受影响组件检查。
- 独立根因可分提交并及时推送，但切换到其他整改单元前核对本表；阻塞明确记录。Image 的局部统一验收不替代全库最终同一提交的全量门禁。
- 需要裁决的真实语义矛盾先记录证据与方案；既有有效且无冲突的能力不改名、不额外迁移。触摸双指手势等未声明新能力为另案，不能用它们扩张本轮；也不能把现有 mask/getContainer/SSR 等缺陷放入该类。

| 证据 | 当前结论 |
|---|---|
| 基线 Image/ConfigProvider 运行回归 | 27 文件、405 条通过；不含本清单新复现，不代表完整验收 |
| 新增公开入口盘点矩阵（首批） | 33 条中 15 失败/18 通过；18 条为两入口全部原生图像属性的初值/更新/移除及节点保持。失败涵盖 mask、container、关闭/禁用期间拖动、cover、placeholder、Group 模型移除/空数据/禁用触发器。日志 `/tmp/apollo-image-contract-audit-runtime-baseline.log`；还将补齐清单其余边界后集中设计 |
| 基线严格/类型/发布包 | 严格通过，14 类型文件、64 条通过；UI 构建/消费端和 11 项 L7 通过 |
| 真实 Node 发布包 SSR | 已验证失败：无 window/document/Image，渲染后触发 ReferenceError，退出 1；本轮必修 |
| 静态子组件发布类型 | 已验证失败：Image.PreviewGroup 为 any，具名导出正常；本轮必修 |
| 其他待核实矩阵 | 未执行，禁止标已验证 |
| Apollo 视觉批准基线 | 已验证缺失 9 张；受阻，不算通过 |

下次代码修复前，补齐以上待核实项的复现与集中 API 决定；实施后在本表更新修复提交和统一验收结果。
