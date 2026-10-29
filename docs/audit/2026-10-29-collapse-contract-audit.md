# Collapse / CollapsePanel 当前契约整改单元

状态：42 个组件文件的实现与行为验收已收口，源组冻结供主线程整合。Collapse 101 项、联合 ColorPicker/Alert 387 项与真实浏览器 134 项通过；原 9 PNG 逐像素一致。严格根消费类型被外部 Watermark.ts:367 阻塞，后续读到共享 ConfigProvider 写入中间态，已停止 reader，未标记全部完成。共享层、根导出、Registry、旧基线、包构建和正式视觉审批由主线程整合。

## 范围与清单

盘点起点 `3d05710f3b1954c320c05a01f58cce994ca2176c`，当前六规范及ADR0006/0007、F07迁移均已读取。完整34文件清单/源码SHA、逐字段声明→传递→消费记录、9对Demo与生产消费者盘点见 `/tmp/apollo-collapse-audit-20261029/{before.json,inventory.md}`。不以旧completed、PLAN、React快照或F07三条局部覆盖免检。

本轮包括 Collapse、公开Panel、内部Panel、engine、style/10 Token、Props/Slots/emits/v-model/Expose、当前Provider/attrs、类型与全部9个实际Demo、双语API、独立浏览器/消费端及迁移证据。ColorPresets为直接生产消费者；Alert content-slots为联合消费者，需保留其已冻结实现与既有F07覆盖。任何消费者修改先通知主线程。本轮不改共享theme/ConfigProvider/motion/helper、根exports、Registry、共享视觉矩阵、参考HTML/PNG或dist。

## 实际基线与红灯

- 原unit/DOM/a11y/theme **64/64通过，exit0**（`/tmp/apollo-collapse-audit-20261029/baseline.json`）。原保留测试只检查一个tick，原onChange只检查载荷，原Space负例使用非真实key字符串，原类型标题没有验证静态Panel或任何负例。
- 19个只读源码VTU/JSDOM检查中 **16有效失败、3正控通过，exit1，无fixture执行错误**（`probes.json`）：一次请求change为2次/update为1次；真实Space key不切换；extra的Enter直接折叠；默认完整离场后input卸载、草稿回Initial；Panel.disabled/原生attrs/item语义字段失效；原生root role被删；global componentSize未到达；motion停在旧prefix；default数组与拒绝控制请求进入内部状态；0图标丢控制；空extra宿主；Panel vnode生命周期与itemClick.once未运行。
- 三个正控：显式destroyOnHidden=false保留DOM；当前Provider对象语义替换/移除且根身份保持；forceRender=true即使配置destroy也保留内容。当前Provider对象链正常，不误报setup快照；共享useMergeSemantic为computed，不把旧watchEffect猜测算缺陷。
- 独立公开子入口严格类型复现 **2条有效诊断，exit2**（`type-probe.log`）：named Collapse.Panel与update:activeKey载荷都退化为不受约束类型，不能用现有六条正例宣称强类型完成。
- icon-only+showArrow=false实际无控制也无禁用状态；Panel声明label与runtime prefixCls均未生效。作为明确组合/接口职责决策处理，不凭旧实现自动判正确。
- 第一次Node工具导入早于JSDOM造成document=null，已保存为probes-invalid-dom，**不计为组件红灯**；修正工具后才计上述结果。

## 集中决策与迁移

1. **真实Panel与provide/inject**：去掉手工解析/转换Panel vnode的descriptor路径。items数组渲染同一个真实Panel；默认slot保持Vue树与组件生命周期、attrs、监听修饰符及完整slot。保留items（含空数组）优先级、key字符串归一与已存在的header/extra/default内容通道。Panel只属于Collapse，不新增独立控制模式或Expose方法。
2. **原生disclosure**：accordion仅改变单开状态，不继续伪装tablist/tab/tabpanel。保留header容器及root/header/title/body/icon语义区域，heading内为真实button，extra置于heading/按钮之外。一次原生激活只发一次update/change及一次itemClick；click仍为DOM事件，itemClick保留业务key。普通attrs落Root/Panel实际根，内部aria-expanded/disabled/controls/id由组件拥有。补Space、Tab、焦点可见、已关闭内容inert及仅在拥有焦点的正文关闭时处理焦点，不抢外部焦点。
3. **heading上下文**：随原生heading迁移增加可选headingLevel（1–6，默认3，嵌套Collapse默认递增至6），使宿主能选择正确文档层级；这是语义修复的配套配置，不新增model/reset或动画事件。默认字体/间距重置，避免h3浏览器样式改变合理视觉。
4. **状态与销毁**：defaultActiveKey初始化时复制并归一；受控请求仅通知，不改未被接受的内部状态；实际收到的受控值作为解除受控时的最后接受值。默认保留已经渲染的正文；destroyOnHidden只在完成关闭且forceRender=false时销毁正文。forceRender意味着持续渲染，优先于destroy，保留上述正控行为并明确文档。稳定的隐藏结构负责控件/正文ID关系，正文内容仍懒挂载。
5. **图标与交互组合**：顶层expandIcon渲染prop按ADR0006直接迁移为#expandIcon具名对象scope，无旧prop兼容/弃用期。scope包括key、isActive、prefixCls、collapsible与direction，完整Fragment/0/空结果均消费；slot存在优先。Provider配置工厂按程序化默认配置职责保留并独立类型化。icon-only却showArrow=false归为明确不可折叠并开发告警，不擅自把点击区域扩大为header；showArrow=true的空自定义图标仍保留具名button。extra空内容不留宿主，0保留。
6. **Panel现有字段**：保留有意item目标className/style，补原生class/style/ARIA/data/事件；全局与逐item语义分别合并，item.root落item根而非重复Root样式。Panel.disabled映射为旧禁用输入并告警，明确collapsible优先。Panel.label作为既有VNode数据标题补齐消费，优先级#header存在→header文本→label数据；items仍保持label→header。Panel.prefixCls保留并实际控制该Panel命名，不增加运行时CSS生成；Panel静态样式改为组件自身可匹配的规则，命名不同的Panel通过变量别名继承所属Collapse的10 Token与派生radius。自定义前缀仍需预载对应静态CSS，D04任意前缀自动CSS不在本轮。
7. **主题/样式与类型**：十个Token逐一从当前theme.components.Collapse到CSS生效；补borderlessContentBg的真实变量消费；默认padding/radius沿当前Alias（固定横向16px保留为设计常数）。只在明确sourceActive=false时保留CSS-only作用域，显式空TP恢复默认，native根变量优先。Root拥有本Collapse的Provider/Token作用域，Panel作为所属部件共享；嵌套Collapse按最近Provider独立消费。普通/禁动效/系统减少动画与动态prefix均读当前值。Object.assign结果保留named/default静态Panel类型，emits与slots正反类型完整；不以断言、any或忽略补洞。

旧组件级CollapseProps.children并不消费，按已接受内容迁移从类型中移除，默认slot与items.children的合法VNode数据不删。旧destroyInactivePanel/expandIconPosition的合理别名继续支持。声明式Panel为Vue组合通道，不沿用错误的“deprecated且告警”文案。

## 验收与边界

实现前后保留以上有效复现；同步实现、类型、全部9对Demo、双语API和独立迁移。一次统一核对所有Props、五语义区域、Root/default/Panel slots、emits/model/Expose与所有item字段；覆盖控制接受/拒绝/解除、数组初始化、列表增删/重排、条件slot/Fragment/0、反复开关/卸载、多实例、草稿/焦点/选区、四主题与全部十字段、显式空TP/CSS-only、快速反向及常规/禁动效/减少动画、SSR水合和真实ColorPicker消费者。

9原Demo以真实SFC运行四主题三视口（108场景）；补custom展开icon与真正extra动作，不用外置Button冒充extra能力。类型包含Root/子入口静态Panel、slots/v-model/事件正反例。旧12 DOM与9参考PNG保留，必要结构差异按具体路径登记并有原生覆盖，不能改归一化/阈值。源组统一验收后再冻结；发布L7、正式视觉/Docs、Registry及最终同提交全量门禁由主线程继续，不以局部绿灯代替。

## 最终逐链收口

| 清单 | 实现与替代覆盖 |
|---|---|
| Props、model、emits、Expose | 受控接受/拒绝/解除、一次默认数组快照、accordion、数值 key、全部旧别名、一次 update/change、原生 root attrs/role 与实际 nativeElement；index/contract/type suites |
| items 与真实 Panel | 所有数据字段、局部覆盖、className/style/headerClass/id、五语义区、原生 attrs/DOM 事件、itemClick.once、生命周期、Fragment 包裹、增删重排、懒挂载/retain/destroy/force；同一实际 Panel renderer |
| Slots 与 renderer | 根 default/items（含 []）优先级、具名 expandIcon scope、当前 Provider 工厂、Panel header/extra/default、条件空插槽、0/Fragment、extra 无空壳且独立原生交互；10 条原因明确的类型负例 |
| Provider、前缀与样式 | 当前 components 对象替换/移除、componentSize/direction、根/Panel 独立前缀、五语义区合并、native style 优先、无运行时 CSS 生成；已有静态 CSS 可消费本 Panel 的变量别名 |
| 主题与动效 | 十个组件 Token 全部声明→当前来源→变量→真实几何/背景，派生 radius 当前 Alias；显式空 TP、CSS-only、四主题、正常/禁用/减少动画、动态 motion 前缀、完整离场与快速反向 |
| 无障碍与状态 | 原生 heading/button/region、ID/ARIA 归属、Tab/Enter/Space、focus-visible、closed hidden/inert、真实编辑器草稿/DOM/选区、正文焦点关闭、外部焦点保留、卸载重挂与多实例 |
| Demo / API / 消费者 | 9 对 Demo 已完整复核；修正旧 tablist、无效模式说明与强转；custom 为真实 extra + 图标 slot + 草稿，Token Demo 经当前 Provider 配置全部十字段；双语 API/README 与独立迁移同步。实际 ColorPicker 能折叠与选色，冻结 Alert 条件插槽/编辑器链保留 |

最后两条同类组合复现纳入同一单元：`mixed-keys-red.json` 中显式 key=0 与第二个省略 key 意外共用 0，已改为所有初次挂载 Panel 都占据默认序号；动态面板明确要求稳定 key。`disabled-focus-red.json` 中标题已禁用再外部关闭正文时焦点留在隐藏 input，改为焦点回退到所属 Root；临时 tabindex=-1 在 blur 时清理并尊重原生 attrs。初版过早移除 tabindex 的问题由真实 Chrome 捕获并修正，未以 JSDOM 通过代替浏览器结论。

## 命令、结果与证据

以下均为工作树源码检查；基准 HEAD 与逐文件 SHA 见 `docs/audit/evidence/collapse-contract-source-freeze.json`，尚未提交，不声称最终提交全库门禁。

- `pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/collapse packages/ui/src/color-picker packages/ui/src/alert --maxWorkers=2 --reporter=json --outputFile=/tmp/apollo-collapse-audit-20261029/final-runtime.json`：**387/387，exit0**；其中 Collapse **101**。原 12 个 DOM 参考用例全部保留，67 条原生树/ARIA/局部 variant 差异逐路径固定，另有每个用例完整替代子树及反向覆盖守卫，不改共享投影。
- `COLLAPSE_BROWSER_EVIDENCE=/tmp/apollo-collapse-audit-20261029/browser-final node packages/ui/src/collapse/__tests__/browser.mjs`：**134/134，exit0，0 页面/控制台错误**。17 个原生/SSR/消费者检查、9 个原 PNG 与 108 个实际 Demo 场景；原 PNG **9/9 exact、diffPixels=0**，旧 SHA 均不变。SSR/浏览器/fixture readers 已由 finally 关闭，临时 bundle 已清理；仅证据截图与 receipt 留在 /tmp。
- `pnpm exec biome check packages/ui/src/collapse`、`git diff --check -- packages/ui/src/collapse docs/audit/2026-10-29-collapse-contract-audit.md docs/migrations/collapse-contracts.md`：通过。
- `node node_modules/vue-tsc/bin/vue-tsc.js -p /tmp/apollo-collapse-audit-20261029/type-probe.json`：原 named Panel / model 不受约束类型红灯已转为 **exit0**。4 个永久类型用例包括静态根/子入口、slots、事件与 10 条有原因的 @ts-expect-error 负例；Vitest 实际/类型双路径 8 项通过，但类型 project 命令仍因共享来源错误 exit1，不能宣称整条类型门禁已过。
- `node node_modules/vue-tsc/bin/vue-tsc.js -p /tmp/apollo-collapse-audit-20261029/source-tsconfig.json`：组件 runtime、9 Demo、全部 tests/types 无自身诊断；最后一次执行 **exit2**，仅外部 `packages/ui/src/watermark/Watermark.ts:367` TS7053。Input/Tabs/Transfer 的先前外部诊断已由对应 owner 修复。
- `node packages/ui/src/collapse/__tests__/consumer.mjs`：真实根/子入口 SFC 正例也被同一 Watermark 诊断阻塞；后续已尝试负例，但读到 ConfigProvider.ts:306–312 的共享写入中间态（TS1128），4 个实际 SFC 负例尚未获得有效验收。已停止全部类型/browser reader，未绕过根入口或屏蔽共享诊断。脚本保留 source/published 两模式供主线程冻结生产者后复跑，发布模式检查 14 包 dist 不变且无 src 回退。

工具修正与产品红灯分开保存：初期 JSDOM 导入顺序、浏览器动态自导入 top-level-await、SSR 过早打开 Portal、测试假设 motionDurationMid=0.3s、空 TP 误认为重置全局 size、消费者 fixture 缺 vite/client，均已修正工具后才纳入有效验收。最后 browser-final 为有效完整结果；debug6 也是有效 134 项结果，最终默认 key 修复后已按同一最终 runtime 再跑 browser-final。

## 交给主线程的剩余边界

1. 冻结共享 ConfigProvider/theme 来源并修复外部 Watermark 类型诊断后复跑严格 source-tsconfig、types project 与 consumer.mjs，补齐实际 SFC 负例结果；当前不把该项标为完成。当前行为证据属于已编译的 source 快照，不代表后来共享来源写入后的最终工作树。
2. 根入口同步新类型 CollapseConfig、CollapseExpandIconScope、CollapseHeadingLevel、CollapsePanelSlots、CollapseSlots、CollapseSize；原 CollapsePanelProps 等导出保留，并更新根入口旧注释。组件子入口已完整导出。
3. 合入 ColorPresets 所属 owner 的 label span 变更（实际源码已由其应用并通过本次消费者验证）；Alert 实现保持冻结。旧共享 vue-reactivity runner 的空标题断言需理解 sr-only Toggle panel 的可访问名称，不能回退 Demo。
4. 主线程处理 Registry、共享 native 视觉矩阵与正式 Docs/视觉审批、发布产物 L7、最终同一提交全量门禁。未构建任何包、未写 dist、未批准或更新旧 PNG、未提交/推送/合并/发布。
