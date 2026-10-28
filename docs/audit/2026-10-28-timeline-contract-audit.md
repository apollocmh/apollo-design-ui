# Timeline 当前契约整改（2026-10-28）

基点：`d0bf2cef`；本轮由 Timeline 执行单元核对当前源码，不把历史 completed、上游 DOM 或类型声明作为运行通过证据。最终同一提交的构建、发布消费端、Docs 与 Apollo 视觉由主线程统一验收。本文件随局部证据更新。

## 范围与验收

范围是 `Timeline`、`TimelineItemType` 数据转换、三个原生条目槽、与 Steps 的内部上下文、六个 Token、十五对 Demo 和中英文 API。旧 `Timeline.Item` / `TimelineItemComponent` 已在 10-25 移除，当前默认槽不注册条目；不恢复 React 元素解析或空壳组件。

验收：保留有价值的既有 DOM/axe/主题/类型测试；先为整组缺陷建立红灯，再修复当前数据、空内容、原生 attrs、当前 Provider 与主题。覆盖明确 key 的条目身份、正文输入和焦点、动态/条件槽、反转/pending、反复更新、SSR/水合、多实例与卸载重挂。不得重建 UI dist、写共享视觉基线或用局部结果代替全库结论。

## 动手前完整清单

“正常”指已追踪并有既有行为测试覆盖；所有项目在本轮最终统一重跑前仍不表示重新通过验收。“必修”须本轮解决；新能力和共享前缀策略另案。

| 公共入口 | 声明 → 传递 → 消费 → 实际行为 | 本轮分类 / 验收点 |
| --- | --- | --- |
| `items`、`key` | `TimelineProps` → `useItems` → Steps keyed Step → `li` | 正常；追加、替换、反转保持有 key 输入，重挂不复用旧实例状态 |
| `title / label` | nullish 别名回退 → `entry.title` → Step 标题宿主 | 正常；0、空字符串、Fragment、组件均须保留，别名只在新字段 nullish 时回退 |
| `content / children` | 同上 → Step 正文宿主 | 正常；完整内容、同 key 身份和事件回归 |
| `icon / dot / loading` | nullish 别名 → 真值判断 spinner → Steps/StepIcon | **必修**：显式 0/false/空字符串不得被 spinner 替换；空 icon 槽覆盖 loading 默认图标 |
| `placement / position` | position 被强制断言为 ItemPlacement → CSS placement 类 | **必修**：left/right 要归一 start/end；新 placement 优先，不生成无选择器的左右类 |
| `color` | 四预设类 / 任意色 CSS 变量 → Steps dot | 正常；当前值、清除、CSS 自定义色和 item.style 优先级 |
| 项 `className / style` | 转换保留 → Step root | 正常；动态、原生 CSS 属性、同 key 不重挂 |
| 项 `classNames / styles` | 转换保留 → Step/StepIcon/Rail | 正常；root/wrapper/header/title/section/content/icon/rail 全链；数据没有 subtitle，项类型不应虚报有效 subtitle |
| `mode` | left/right 归一；alternate 以源索引交替 → placement、根类 | 正常；当前 mode 与反转保持来源条目的既定排布侧 |
| `orientation` | Timeline 根类 + Steps 默认 responsive → 当前布局 | **必修**：xs 下 horizontal 不得与 Steps vertical 混用；SSR 和水合保持同一方向 |
| `variant` | outlined 默认 → Steps → 样式类 | 正常；filled/outlined 动态覆盖 |
| `titleSpan` | 数字/字符串 → 根 CSS 变量 | 正常；切换移除旧变量，alternate 忽略；原生 style 可覆盖 |
| `reverse` | 转换后反转 → 作用域显示索引 / 当前 rail status | 正常；源 item 正确，pending 合成条目无伪 item scope |
| `pending / pendingDot` | 真值判断追加 → 合成 process Step | **必修**：0 是内容，false/null/undefined 关闭，true 为仅指示器；更新、反转、开关保留真实条目 key，别名继续保留 |
| `#itemTitle / #itemContent / #itemIcon` | render 当前 slots → `{ item, index }` → 完整 VNodeChild | 正常；有意为空覆盖，移除恢复，条件槽、多根、Teleport、SSR/水合不丢内容 |
| 默认槽 / 子组件注册 | 无当前 SlotsType / 无运行消费；旧 Item 已移除 | 正常；API 明确只接受 items + 三条槽，禁止新增兼容通道 |
| `emits / v-model` | 无业务事件 / 无状态模型 | 不适用；展示组件，不新增可控业务状态 |
| 原生 `class / style` | 当前 attrs → Timeline 合并 → Steps root | 正常；字符串/数组/对象，语义与原生样式顺序保持 |
| 原生 id/ARIA/tabindex/listeners | attrs 展开为 Steps props → `onChange` 被吞并 | **必修**：所有原生 attrs 直接到 `ol`；change 为 DOM Event，不能把 `li` 变为 button；click/change 各一次 |
| `ref.nativeElement` | Steps ref → getElement → 当前根 `ol` | 正常；首次挂载、更新、卸载为空、重挂新根；不暴露内部状态 |
| `prefixCls` / Provider prefix/direction | computed 当前读取 → Timeline/Steps 类 | 正常；动态、嵌套与多实例隔离；任意前缀的配套静态 CSS 仍为共享 D04，另案 |
| Provider `components.timeline` | className/style/classNames/styles → useMergeSemantic → 根及语义区域 | 正常；当前对象、函数 props、合并与移除 |
| Provider `theme` / 六 Token | 静态默认四项 + 两项未声明回退；没有读取当前 ThemeContext | **必修**：当前 default/dark/compact/嵌套主题与六 Token 更新/零/删除，dotSize/dotBg 未设置继续回退 |
| CSS / 无障碍 | 主题变量、Steps 内部变量 → 原生 ol/li、装饰 icon、用户控件 | 正常结构；真实浏览器 CSS 几何、axe 与键盘/焦点；不以空 DOM/颜色矩阵绿灯代替行为 |
| 公开类型 / 安装 / exports | index.ts → withInstall `ATimeline`；数据与槽类型 | 正常；六组别名与公开 ref、scope 正负例、发布包 fixture 不入产物 |
| Demo / API / README | 十五对 .vue/.md；文档有“token demo 未移植”等过时叙述 | **必修**：同步当前主题/原生 attrs、别名和具体根语义，删除失实的未移植结论 |

无待用户裁决的新 API：保留合理数据别名与 props，按 ADR0007 修正错误原生事件和 DOM 交互；不增加新 TimelineItem、注册协议、内容函数兼容层或无关能力。

## 冻结交付（2026-10-28）

功能源码已冻结，主线程接手最后两条类型红灯及最终统一验收；不宣称 Timeline 整改单元全部完成。当前工作树 HEAD 为 `47b98296`，本执行单元未提交、推送、构建 UI 或写 dist。

已实现并经功能测试验证：位置别名归一；零/空图标与 spinner 分离，并以完整 Vue 内容进入 custom icon 分支；pending=0 与避让业务 key 的合成条目标识；原生 attrs/事件经 Steps 私有 rootAttrs 通道到 ol；显式方向在 xs 保持；nativeElement 直接解析 Steps.$el；当前六 Token、末项 dotSize、实际 dotBorderWidth 和全部纵向项间距；完整内容与状态保持；中英文 API、十五对 Demo、迁移与消费端脚本已同步。

普通无标题纵向列表原来沿用 Steps 的 12px padding 和最小高度，现使用已声明的默认 20px Token 及内容自然高度。这是现有 Token 无效的修复，必须在最终视觉审阅中评估；未修改历史参考图或自有基线。

| 检查 | 实际结果 | 证据 |
| --- | --- | --- |
| 初始 `vitest run --project unit .../contracts.test.ts --maxWorkers=1` | 9 红 / 1 绿，证明位置、零/空内容、原生 change 与当前主题缺陷 | `/tmp/apollo-timeline-contracts-red.log` |
| scalar custom icon 宿主回归 | 先 1 红 / 12 绿，修复后进入完整四层验收 | `/tmp/apollo-timeline-scalar-host-red.log` |
| ref 实际根回归 | 直接复现 nativeElement 为 null；已修复并在单元/浏览器验证 | `/tmp/apollo-timeline-contracts-progress.log` |
| 六 Token 实际 CSS | 复现 dotBorderWidth 仍为 2px、active dotSize 仍为 10px、无标题间距仍为 12px；修复后浏览器四态全部通过 | `/tmp/apollo-timeline-browser3.log`、`/tmp/apollo-timeline-browser4.log`、`/tmp/apollo-timeline-token-layout-red.log` |
| `pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/timeline packages/ui/src/steps --maxWorkers=1` | **16 文件 / 249 条通过**；含原 Steps 全部相关测试 | `/tmp/apollo-timeline-layers-final.log` |
| `node tests/browser/timeline-contracts.mjs` | **17/17 通过**；Chrome 150.0.7871.125，SSR 水合复用、Tab 顺序、真实 DOM Event/.once、focus/value/root/key、375px 横向、四态六 Token、零/非法值/恢复、嵌套多实例与真实 axe；零浏览器/Vue/水合错误 | [浏览器证据](evidence/timeline-contract-browser.json)、`/tmp/apollo-timeline-browser-accepted.log` |
| `pnpm exec vitest run --project types packages/ui/src/timeline packages/ui/src/steps --maxWorkers=1` | 当时 **34 条类型断言通过、无 source diagnostics**；之后新增公开模板消费复现，当前结论以下一行红灯为准 | `/tmp/apollo-timeline-types-final.log` |
| `pnpm exec vue-tsc --noEmit -p /tmp/apollo-timeline-source-types-check/tsconfig.json` | **当前两条类型红灯**，见下方；没有忽略或删除复现 | `/tmp/apollo-timeline-source-focused.log` |
| Biome / diff whitespace | 已执行局部 Biome，最后记录 40 文件通过；diff --check 当时通过 | `/tmp/apollo-timeline-format.log` |

当前**必修未完成**且已明确移交主线程：

1. `TimelineConfig` 类型变量传给 ConfigProvider.components.timeline 时，不满足 ComponentConfigLike 的索引签名。`__tests__/fixtures/TimelineSlots.vue` 保留真实模板红灯；普通对象字面量的运行时 Provider 链路已经通过，不能用它替代公开类型消费验收。
2. 新浏览器 fixture 的条件 Token 对象被 TypeScript 推断为含 optional undefined 的联合，不能直接赋值 Record<string, string | number>。`tests/browser/fixtures/TimelineContracts.vue` 需明确中间 Token 对象类型；不使用断言或忽略诊断。

未验证：最终同一提交的发布 dist、exports/产物消费端（含已更新的 `tests/consumer/timeline-types.mjs`）、Docs content/typecheck/test/build、自有视觉及全库门禁。`TIMELINE_SOURCE=0 node tests/browser/timeline-contracts.mjs` 已提供发布实现与发布 CSS 路径，须由主线程在重建后实际执行。本轮只运行 source 模式。`/tmp/apollo-timeline-browser.png` 是诊断截图，不是已接受视觉基线。

共享变更仅为主线程明确授权的 Steps.ts / context.ts：增加 rootAttrs 内部协议，在实际根用 mergeProps 合并；不改变公开 Steps.onChange(current)。共享 Registry、KNOWN-ISSUES、COMPATIBILITY 和进度页由主线程统一整合。

## 主线程集成保存点

17源码浏览器与249相关四层已通过；新模板暴露的TimelineConfig→ComponentConfigLike类型红灯，已用四个精确字段对象type修正，未添加索引签名或断言。fixture用明确Record中间值表达不同Token集合；原数字/非法值/零值断言保留。集成73文件964运行时、122类型、根严格及源码消费类型均通过，证据parallel-source-checkpoint.json。最终dist/声明消费/Docs及Apollo视觉仍待统一验收，不能宣称本单元完成。
