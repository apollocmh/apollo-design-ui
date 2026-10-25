# Image 整改单元：完整契约盘点与统一验收

盘点基线：`4e3e8f67`。该提交是在完整盘点规则生效前已实施的关闭控件增量；`b7a722e1` 将当前工作纪律写入规范。本文件是后续 Image 整改单元的统一清单，修复和验收持续更新在这里，不再为每个字段建立完成报告。

## 范围与状态

本轮覆盖 Image、ImagePreviewGroup（含 Image.PreviewGroup）、内部 Preview/Progress、注册上下文、useStatus/useImageTransform、公开导出/类型、18 个 Demo、双语 API、静态 CSS/Token，以及实际调用的 ConfigProvider、theme、portal、motion、utils/a11y 链路。共享层如需修改，补查其其他消费者。基础包自身其他能力及其余 71 个组件另设整改单元，不能用 Image 结果替代。

分类为“已验证正常 / 本轮必修 / 需要裁决 / 另案处理”；证据状态另外记录“已实现 / 已验证 / 未验证 / 受阻”。“待复现”表示已纳入本轮核实，复现成立即为必修，不能借此把无效接口移出本轮。下表中的既有测试已在基线前真实执行，但不是最终同一提交的统一验收；源码链路核对与行为证据分别记录。

当前整改单元未完成。不得依据 Registry completed、历史上游快照或 405 条局部运行测试宣称完整契约验收。

## 盘点基线：公开 Props 与数据链路

声明统一来自 `packages/ui/src/image/interface.ts`；Image 与 Group 的运行时声明分别在 Image.ts / PreviewGroup.ts。以下盘点表保留动手前基线事实（不是修复后状态），当前修复与证据统一记录在文末；公共监听器在事件表单列。

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

公开入口盘点已扩展至真实 Chrome 20 个场景（含独立 Portal/useLockFocus 跨文档场景）：17 失败/3 已有通过，零 Vue/控制台/页面错误。默认 z-index=1080 和单图普通 fallback 正常；mask/container/scaleStep/Provider、srcSet fallback、Group fallback/root 语义、缺省可访问名称及跨文档链路的失败均纳入本轮。日志 `/tmp/apollo-image-contract-audit-browser-full-baseline.log`。跨文档焦点失败来自 utils 的全局 document/window 状态，已用实际 iframe 独立复现，不能仅在 Image 层掩盖。

1. **声明与消费不一致**：mask 全形态、getContainer、scaleStep、Group 支持字段、别名推荐目标和重复转发、Token 实际落点。先用同一组公开入口矩阵复现，再集中确定类型与数据边界；不为遗漏字段引入无关能力。
2. **状态与生命周期**：真实 Node SSR、真实 img load/error/fallback/source 更新、校验清理、拖动关闭/卸载/禁用、Group current 移除控制和 items/注册切换。按根因决定实现，覆盖重复开关、重挂及多实例。
3. **Vue 公共用法和归一化**：静态子组件精确类型；合法 VNode/null/0/数组、条件插槽和可访问名称。已有有效的配置数据与业务回调不按字符串批量迁移；确需 API 修正时在本轮集中记录旧/新写法。
4. **Provider/样式共享链路**：局部主题跨 Portal、组件 Token、主题 z-index/尺寸/颜色、容器与焦点。先确认共享层契约和其他消费者，再确定修复所在层，不能只让 Image 默认主题变绿。
5. **文档与证据收口**：移除当前范围的 PENDING 假示例/过期完成声明，保留历史来源；每项关联源码、复现、提交与最终验证日志。9 张已批准 Apollo 基线缺失单独记录为受阻，不能复制 React 快照或降低阈值。

### 集中方案与 API 边界（实施前记录）

- 状态/资源：使用真实 img 的 load/error 和 Vue ref/响应式驱动状态，消除渲染前无条件 new Image 对 SSR 和生命周期的依赖；fallback 激活时关闭原 srcSet/sizes，换源恢复；注册数据完整携带 fallback 与尺寸，避免单图/分组链路分叉。原生 error 仍按公开归属通知，不另添重复事件。
- 生命周期/模型：拖动监听绑定实际所属窗口，在 mouseup、关闭、movable 禁用和 scope dispose 成对释放；Group current 移除控制保留最近同步值，无控态列表缩减安全归一，不回声外部数据赋值；空数据不打开空预览，禁用 Group 的子触发器保持真实语义，默认索引待注册完成后处理，避免首个子项覆盖 defaultCurrent。
- 数据归一化：统一区分合法 VNode/数组/0/空值与配置对象；cover 位置对象不作为文本渲染，null 不抛错；Progress renderer 是已实现的嵌套数据配置，保留并验证当前函数/空内容/百分比，不额外加同义新槽。afterOpenChange 同样保留已有效的业务回调，不重复迁移已裁决接口。
- 配置契约：一次修正 MaskType（布尔/遮罩配置）与封面 VNode 的职责，接入全部遮罩字段和显式容器；GroupPreviewConfig 去除只适用于单图的 src/cover，Group 语义类型只描述实际根与 popup，根配置落实在根上，Provider 的图片根样式不误复制到 Group 包装层。旧别名的有效数据行为保留并纠正文档落点/重复 class；已明示删除却仍留在类型的 forceRender/destroyOnClose 一次移除。
- 缩放：兑现现有 scaleStep 默认 0.5 的公开承诺，统一当前 zoom-in/wheel/double-click 因子为 1+step，zoom-out 使用逆因子，避免硬编码 0.1 及双击额外 0.1；旧比例行为是未消费步长的实现错误，集中迁移记录影响，保留原来的锚点/边界/编辑器场景并对正确输入和期望补覆盖，不删场景。
- 导出：用真实静态子组件交集类型替换 as never 赋值，保留导出/安装名和运行时身份，同时让 Image.PreviewGroup 的 props/slots/emits 获得与具名 Group 相同的约束。
- 主题/共享链路：主题上下文继承不能丢失外层 ThemeProvider；Image 源根与 Portal 预览使用同一响应式 alias/component Token，原生 style 优先级保留，用户样式不写入全局。组件 Token/默认/暗/紧凑与多实例都须实际验证，不能只把默认数值写入 CSS 变量。跨文档焦点修复归属 utils，补查其使用者及 a11y/Portal，而不模拟 DOM 事件或添加 Image 专用全局补丁。
- 全部 API 修正集中写入一份迁移说明；新增独立能力（例如触摸双指缩放、为每个图标增加同义槽）不纳入本轮。以上方案不是验收结论，实现后仍需按整份清单统一验证。

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

## 2026-10-26 成组实施与当前证据

本节是当前状态；上面的盘点基线不自动升级为通过。集中API边界见 [迁移记录](../migrations/image-contracts.md)。整个Image单元仍开放。

已实现资源状态、配置消费和分组模型三组修复：去除离屏Image校验；fallback抑制失败候选；分组透传尺寸/fallback；完整消费mask和当前容器；统一当前scaleStep和数值约束；修正合法VNode/0/数组/空配置；移除无效声明、精确Group语义及静态导出；默认可访问名称；拖动全生命周期清理。注册表仅在实际数据变化时发布，避免Group插槽中新对象触发循环更新。

| 已执行证据 | 结果与边界 |
|---|---|
| Image运行/DOM/a11y/theme（`vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/image --maxWorkers=2`） | 最终21文件/351条通过，含57条公开入口回归（含默认索引、列表缩减/清空/恢复）。日志 `/tmp/apollo-image-core-runtime-commit.log` |
| Image类型（`vitest run --project types packages/ui/src/image`） | 14文件/34条通过，无类型错误；新增正/负例覆盖Group精确类型和已移除配置。日志 `/tmp/apollo-image-core-types-accepted.log` |
| 无DOM Node生产SSR（`node tests/consumer/image-ssr.mjs`） | 通过；两入口开/关状态、空alt、原生候选资源、占位数据及预览槽惰性。日志 `/tmp/apollo-image-core-node-ssr.log` |
| Chrome生产包完整盘点与新增实际Demo（`node tests/browser/image-contract-audit.mjs`） | Chrome150.0.7871.125，最终21场景16通过/5仍失败，零Vue/控制台/页面错误。实际遮罩Demo三阶段的当前mask/step、本地容器、节点保持及完整axe通过（等待实际动画稳定后取证）。余项为双入口局部主题、双入口跨文档焦点、独立utils跨文档焦点；没有跳过失败。日志 `/tmp/apollo-image-core-browser-audit-demo-final.log` |
| 原有生产浏览器（`node tests/browser/image-scale-bounds.mjs`、`image-preview-slots.mjs`、`image-transform.mjs`） | 三组全部通过；保留锚点、当前边界、原生手势、编辑器/选择区/焦点/节点身份、模型拒绝与实际Demo及完整axe。边界专项目标显式step=0.1，实际Demo使用公开默认0.5，未删除场景 |
| 根严格（`pnpm exec vue-tsc --noEmit -p tsconfig.json`） | 通过，退出0；`/tmp/apollo-image-core-strict-final.log` |
| UI构建/发布包消费（`pnpm --filter @apollo-design/ui run build`、`node tests/consumer/image-slot-types.mjs`、`node tests/build/run.mjs --package ui --no-build`） | 全部退出0；真实SFC声明+69份CSS；消费端无源码别名、静态Group非any及正/负例通过；L7 11检查/0FAIL/0PENDING。保留unbuild既有产物预检查告警，声明与CSS在afterBuild真实生成 |
| 文档（build → test → typecheck → content:check） | Demo/API构建完成，14文件/157测试通过、类型与内容检查通过；1002个Demo。日志 `/tmp/apollo-image-core-docs-*-final.log` |
| Registry与内容盘点 | 19检查/0warning；内容清单519条，keep-data137/review202/skip161/implemented-verified19，未把类型修正当新增完整验收 |
| 上游DOM参考差异 | 保留全部9个用例，5个缺省alt场景精确断言新增通用aria-label。依据COMPATIBILITY.md的image-optional-alt-accessible-name，未改参考快照或忽略全部ARIA |

尚未统一验收：共享主题及全部7个组件Token、跨文档焦点、模态滚动锁、富缩略图内交互控件、完整SSR水合/快速重开/多实例组合与最终视觉。滚动锁及富内容交互是本单元新增核实项，先建立复现再修复，不归入无关新能力。其余组件与基础包独立范围、触摸双指等未声明新能力另案。

### 共享焦点与容器结果（2026-10-26）

资源/预览契约组对应提交 `0bee259d`，已推送。此后按同一清单整改实际调用的utils焦点与Portal容器链路；整个Image仍未统一验收。

- 初始所属文档专项5条中3失败/2已有通过；静态生产浏览器3个焦点失败消除后，继续按原验收范围检查当前容器、同节点搬迁和作用域结束。稳定resolver只在React式更新后读取导致浏览器超时；同文档搬迁丢编辑焦点在Image/Group各复现1例；原生iframe末尾Tab离开文档、已停止作用域的重试重新挂锁均有失败证据。
- 实现按ownerDocument管理锁栈、活动焦点、所属窗口监听器；每个活动文档一个原生MutationObserver跟踪真实DOM搬迁，保留编辑焦点并迁移锁，最后释放即清理；无Tab子项回到可编程聚焦容器。Tab在冒泡阶段同步循环，保留子控件preventDefault优先。作用域结束取消后续重试和忽略节点引用。isVisible支持所属其他窗口的真实Element。
- Portal补watch读取resolver响应式结果，保持稳定函数及已有Teleport节点，不要求父级通过无关字段重渲染；现有挂载/更新后的DOM引用解析仍保留。没有新增公共API或兼容分支。

| 本组验收命令/证据 | 实际结果 |
|---|---|
| `vitest run --project unit --project dom-contract --project a11y packages/utils/src packages/a11y/src packages/portal/src packages/ui/src/modal packages/ui/src/drawer packages/ui/src/image --maxWorkers=2` | 最终69文件/1348条通过，含新增10条文档归属/生命周期专项及稳定resolver回归；`/tmp/apollo-focus-final-runtime.log` |
| `vue-tsc --noEmit -p tsconfig.json`；显式修改文件Biome | 全部退出0；`/tmp/apollo-focus-final-strict.log`、`/tmp/apollo-focus-format-final.log`。Portal新用例直接使用声明支持的函数返回值，内联false通过prop切换，没有强制断言或扩大接口 |
| utils/portal真实build；各自L7 `--no-build` | 全部退出0；各11检查/0FAIL/0PENDING，5项有说明的n/a；未改变产物分层或发布依赖 |
| 完整生产浏览器盘点 | 21场景19通过/2主题失败，命令仍退出1；`/tmp/apollo-focus-final-browser.log`。两入口稳定/替换resolver、iframe→本地→body→iframe，均保留同一编辑器、值、选择区及焦点；所属文档外焦点被约束。独立基础包真实外文档input及原生Tab循环通过，零Vue/控制台/页面错误 |
| `node tests/browser/image-preview-focus.mjs` | 退出0；原有Image/Group受控拒绝、键盘/鼠标关闭、Tab/ShiftTab、整树卸载、堆叠和父先卸载归还全部保留；`/tmp/apollo-focus-original-browser.log` |
| `node tests/browser/drawer-slots.mjs` | 退出0；实际Drawer富内容/输入/ARIA保留、零Vue/页面错误；`/tmp/apollo-focus-drawer-browser.log` |

基础包已核对实际消费者为Image、Modal、Drawer和a11y再导出；本组不宣称其他基础包能力全量通过。共享主题/全部组件Token、模态滚动锁、富缩略图交互、完整水合与最终视觉仍继续本单元处理。

### 源主题、组件Token及Provider状态结果（2026-10-26）

共享焦点组对应 `ee9c2e10`，已推送。本组仍属于同一Image单元，集中处理源主题读取、全部7个Token、实际CSS消费和Provider结构状态；不把23个浏览器场景通过当作Image完整验收。

首批主题专项5条全部失败；接通上下文后3条通过，2条暴露theme移除会卸载整棵子树。进一步以真实Teleport验证Provider反复出现/移除的子组件计数、编辑器、值、选择区及焦点；旧虚拟TeleportStub在2份身份专项中制造重挂，改为真实Teleport后完整保留29条原断言。popup根zIndex被undefined覆盖的2条，以及当前cssVarPrefix未替换的1条，均有失败复现后纳入同组修复。

已实现：Image/Progress/Group/Preview从同一Vue上下文读取当前alias和Image组件变量；继承外层ThemeProvider，支持inherit=false、暗/紧凑算法、字段修改/对象替换/移除和多实例隔离；没有配置时保留静态CSS默认值和原生style优先级。全部7个Token实际消费，包括原先未使用的分组切换尺寸（默认40px）。颜色派生复用已有框架无关Color算法，命名色/变量保留原生CSS合成。zIndex优先级和默认尺寸变化已写入集中迁移。

ConfigProvider的可选display:contents作用域通过同一份原生Teleport内容子树切换，不再重挂插槽；未配置theme时无包装元素，保留Vue锚点。SSR初始内联（有效body目标），客户端水合后移动已有节点；主题变量前缀改变时清理旧前缀。未扩展公开Props/Slots/Emits或添加兼容接口。

| 本组验收命令/证据 | 实际结果 |
|---|---|
| `vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/image packages/ui/src/config-provider packages/ui/src/empty packages/ui/src/button packages/ui/src/modal packages/ui/src/drawer --maxWorkers=1 --no-file-parallelism` | 最终56文件/1059条通过，`/tmp/apollo-image-theme-runtime-serial.log`。并发构建/类型检查与双worker时曾有2个主题用例撞5秒；空闲独立17条及整组串行均通过，未改超时、断言、主题或Demo范围 |
| 根严格；UI build；发布包模板消费；UI L7 | 全部退出0。真实声明+69份CSS；实际Token Demo加入无源码别名消费端；L7 11检查/0FAIL/0PENDING。日志 `/tmp/apollo-image-theme-strict-final.log`、`-build-final.log`、`-consumer-types.log`、`-l7.log` |
| `node tests/consumer/image-ssr.mjs` | 无DOM Node通过；补ConfigProvider下两入口开/关、主题变量及真实插槽内容，预览仍惰性。`/tmp/apollo-image-theme-node-ssr.log` |
| `node tests/browser/image-theme-hydration.mjs` | Chrome150.0.7871.125通过；保留服务端原输入、预输入值/焦点/选择区；两入口预览在移除/恢复主题后保留编辑器与身份，零Vue/页面错误。`/tmp/apollo-image-theme-hydration-final.log` |
| `node tests/browser/image-contract-audit.mjs` | 23场景全部通过，零Vue/控制台/页面错误。真实Token Demo覆盖3阶段、7个Token实际字号/宽高/层级/动画时长/普通、hover和disabled颜色、稳定编辑器和完整axe。待CSS过渡结束后读取最终计算值。持久化 [浏览器证据](evidence/image-contract-browser.json) 含测试命令、生产源码指纹与全部测量 |
| 原有 `image-prefix.mjs` / `image-provider.mjs` / `image-popup-provider.mjs` | 全部退出0；真实前缀、Provider字段/对象/Map/晚出现/移除、原生/局部优先级、Progress及弹层6节点、身份/焦点/选择区/旋转与原有Demo均保留 |
| Docs build → test → typecheck → content:check | 全部退出0；14文件/157测试、72组件/1002 Demo。component-token不再为PENDING假例，双语API/Provider说明/集中迁移同步；`/tmp/apollo-image-theme-docs-*.log` |

当前仍未统一验收：模态滚动锁、富缩略图交互控件、motion偏好/零时长、Provider合法ShadowRoot容器下的焦点/副作用链路、最终组合回归与Apollo视觉。ShadowRoot是Provider已声明容器类型，须在本单元补实测，不把它当新能力延后。局部主题的本组证据不替代其他组件的主题审计，也不代表ConfigProvider、theme基础包全部入口重新验收；后续完整单元按实际范围继续盘点。

### 剩余交互链路的实施前清单

以a41aeec3源码为准：Image富内容由imageRender与cover数据传入实际根，根无条件button角色并接管所有冒泡click/Enter/Space；空cover绝对定位覆盖输入。Progress的render允许任意VNode，需核验进度语义与交互控件。Preview的Portal未传autoLock；CSSMotion固定500ms deadline，未消费motion=false/reduced-motion；私有Escape绕过Portal的IME保护，分组方向键未检查修饰键。Portal的容器支持Element/ShadowRoot/inline，但滚动锁与Escape副作用使用全局document/window。utils焦点锁及Preview读取document.activeElement，ShadowRoot返回host；document观察器不跨ShadowRoot。以上均为现有公开链路的必修/待复现项，无新增公共能力。

验收范围：两入口、富缩略图/封面/进度VNode、原生取消/IME/修饰键、所属文档/ShadowRoot、滚动锁关闭动画/重开/多实例/卸载、motion=false及动态reduced-motion，结合真实浏览器、axe与共享消费者回归。独立根因可分提交；Image清单仍整体开放，不切换其他组件。先运行新复现记录红灯，再集中修复；不以设置preview=false或要求调用者.stop作为修复。

### 容器副作用根因组（2026-10-26）

初始三个专项文件21条中11失败/10已有通过（`/tmp/apollo-image-interaction-baseline.log`）；motion复现最初误用嵌套wrapper.setProps，修为父级真实ref后7条Image交互仍全失败（`/tmp/apollo-image-interaction-baseline-corrected.log`），没有把测试工具错误当产品缺陷。Portal的两条所属文档/原生取消复现，以及Chrome中锁定body从284px扩至300px的复现均先失败再修复。其余Image与ShadowRoot焦点红灯继续同一单元，未用本组绿灯覆盖。

已实现：Portal滚动锁与Escape栈读取实际目标ownerDocument/defaultView，inline读取源锚点；仅活动副作用观察所属文档及全部已知祖先ShadowRoot，跟踪稳定resolver、同节点/祖先原生搬迁，并在关闭/卸载释放。每个窗口独立IME计时和层栈；子控件preventDefault优先；分发快照固定原始top，仍通知所有原始层。utils在目标文档测量滚动条，isBodyOverflowing新增可选Document/null参数，原composable签名与默认值保持。只有实测宽度>0才补偿body；原非零补偿测试提供明确20px探针并加强精确断言，新增零宽度断言，没有删除场景。

| 本组已执行证据 | 实际结果与边界 |
|---|---|
| `vitest run --project unit --project dom-contract --project a11y packages/portal/src packages/utils/src/__tests__/scrollbar-owner.test.ts packages/utils/src/dom/__tests__ packages/a11y/src packages/ui/src/modal packages/ui/src/drawer packages/ui/src/image/__tests__/preview-focus.test.ts --maxWorkers=1 --no-file-parallelism` | 最终30文件/437条通过；`/tmp/apollo-portal-owner-consumers-final.log`。含Portal全部运行回归、所属文档/窗口/取消/IME/当前回调、utils几何及CSS、a11y、Modal、Drawer和原Image焦点回归；不是Image全量验收 |
| 根严格；`vitest run --project types packages/portal/src packages/utils/src` | 根严格退出0，4文件/126类型条通过、0类型错误；`/tmp/apollo-portal-owner-strict-final.log`、`-types.log` |
| utils/portal build及各自L7 `--no-build` | 全部通过，各11检查/0FAIL/0PENDING（5项明确n/a）；`/tmp/apollo-portal-{utils-build-final,build-final}.log`、`/tmp/apollo-portal-owner-{utils-l7,l7}.log` |
| `node tests/consumer/portal-ssr.mjs` | 真实无DOM生产Node通过；滚动锁/Escape composable安全、关闭Portal不求值插槽、几何默认值安全；`/tmp/apollo-portal-owner-ssr.log` |
| `node tests/browser/portal-owner.mjs` | Chrome150.0.7871.125通过、零页面/控制台/Vue错误；实际滚轮、原节点/输入保持、iframe/inline/开闭及嵌套ShadowRoot、容器/源/封闭树中宿主原生搬迁、独立窗口层栈、原始top、取消、IME隔离、当前回调、重开/卸载。持久化[证据](evidence/portal-owner-browser.json)含源码指纹。原生验证为覆盖式滚动条，非零宽度由明确单元几何覆盖，未宣称实测其他平台原生滚动条 |
| 原生产浏览器 `image-preview-focus.mjs`、`drawer-slots.mjs` | 全部通过；原Image/Group堆叠、焦点/选择区、拒绝关闭、父先卸载及Drawer实际富内容/ARIA均保留；`/tmp/apollo-portal-owner-{image,drawer}-browser.log` |
| Registry、内容与格式 | Registry19检查/0warning；Docs内容检查及显式文件Biome、git diff --check通过。未因共享层修改提升历史verification或Image状态 |

此为同一Image单元内的共享根因里程碑。Image自身模态锁定接入、富内容、ShadowRoot焦点、motion及最终视觉仍未完成；下一步继续这些既有失败复现，不切换组件，不宣称Image或全库通过。
