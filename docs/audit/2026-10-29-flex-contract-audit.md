# Flex 当前契约整改（2026-10-29）

## 范围、规范与交付边界

本单元为 `packages/ui/src/flex/**`、全部六个成对 Demo、独立 Flex unit/type/DOM/a11y/theme、browser/hydration、consumer 与 Apollo visual case/helper。已读取当前 `AGENTS.md`、`ARCHITECTURE.md`、`COMPONENT-RULES.md`、`COMPATIBILITY.md`、`TESTING.md`、`WORKFLOW.md`。现行公开文档、类型与可复现业务行为决定契约，历史 antd 对拍只作回归证据。

共享 barrel、Registry、matrix、runner 和 dist 由主线程整合。本线程不运行包 build，不提交或推送，不改正在整改的 Input。代码检查使用源码入口；发布、同一提交全量门禁、Docs 集成和正式视觉基线验收待主线程统一执行。

以下为动手前完整清单。初始分类来自源码逐项核对，不等于已通过运行验收；先建立失败复现，再成组修正并回填实际命令与结果。

## 声明 → 传递 → 消费 → 实际行为清单

| 面 | 当前声明/传递/消费 | 初始分类及验收 |
|---|---|---|
| `prefixCls` | `FlexProps` → runtime props → `getPrefixCls` → 根/全部语义类 | 本地 props 动态路径存在；Provider getter 被解构，须覆盖当前 getter/前缀替换。任意自定义前缀只改变 DOM 命名，消费者提供对应静态 CSS，保留现行政策 |
| `vertical` / `orientation` | 布尔默认 undefined → `useOrientation` → 合并方向和默认 align | 保留 `orientation > 显式 vertical > 当前 flex.vertical > horizontal`。Provider vertical 快照属于本轮必修；真/假/移除与反复切换均验 |
| `wrap` | boolean/三个 CSS 值 → 语义类 → flex-wrap | 源码链完整，须逐值、false/移除和实际换行几何验证 |
| `justify` | 十二值 → 类 → justify-content | 源码链完整，须逐值并验证实际主轴空间；不得只看类名 |
| `align` | 十值 → `genClsAlign` → align-items | 必修：显式 stretch 的 true 被末行默认判据覆盖为 false。公开文档承诺横向顶部、纵向拉伸，但横向 CSS 未设 flex-start；先复现，再保持公开契约修正默认样式 |
| `flex` | string/number → unitless inline flex | 链路存在，覆盖 0/数值/字符串、替换/移除和真实分配；保留已文档化派生 prop 优先级 |
| `gap` | 四个预设（含 middle）、number/string → class 或 inline | 保留 small=paddingXS、medium/middle=padding、large=paddingLG；覆盖零/分数/CSS 长度/预设切换、实际两轴距离 |
| `component` | `Component | string` → 动态根 → 原生 attrs/default slot | 必修：Vue 组件实例被作为 HTMLElement 暴露。验原生标签、单根 Vue 组件、动态切换、无单一 HTMLElement 的 null 边界、卸载后清空；自定义组件须转发 attrs/slot |
| 默认插槽 / `FlexSlot` | 仅 default，无 scope → 原生 `<slot/>`，不包每项 | 保留完整 0/文本/多 VNode/Fragment/条件槽；补显式 slot 类型，校验原生内容身份、焦点/选区及卸载重挂 |
| Emits / v-model | 无业务 emits，无模型 | 保持无虚构模型；根 onClick/onKeydown 等原生 attrs 当前传递、替换/移除、只触发一次并保持原生 Event |
| Expose | `FlexRef.nativeElement: HTMLElement | null` | 只暴露稳定实际 HTML 宿主或 null，不暴露整个内部实例；SSR 首帧 null、安全访问、当前根和卸载均验 |
| 根 attrs | inheritAttrs:false → `useAttrs` → computed rootAttrs → mergeProps | 本轮必修：attrs 缓存可能漏 attrs-only 更新；渲染时现读。验 class/style 三形态、id/ARIA/data/tabindex/listeners 动态增加/替换/删除，native dir 显式值优先 |
| Provider | `FlexConfig` 的 className/style/vertical，顶层 direction/getPrefixCls | 本轮必修快照；验整配置替换、嵌套/多实例隔离、移除回落。本地 native style 覆盖 Provider；已声明 flex/gap prop 继续高于同名 native style |
| 根/子项样式 | 静态 CSS，无 React/CSS-in-JS，直接 flex 子项 | 必修：无条件 `:empty{display:none}` 隐藏空的具名原生宿主/自定义组件。按 Vue 原生根所有权保留空根布局；不以内容真假决定是否保留业务宿主 |
| Theme / Token | ComponentToken 为零，三 gap 档直接引用 alias CSS vars | 保持零组件 Token，不造无效字段；补当前 ThemeContext 到三个 gap alias 的根作用域，含 ThemeProvider 默认不全局注入、嵌套复位、SSR 和动态主题，不污染文档全局 |
| 静态导出/注册 | 默认/named Flex、AFlex、已有公开类型及 style 工具 | 保留；根/子路径导出与构建交主线程，独立 consumer 预备严格类型和 SSR 脚本 |
| 关联链路 | config-provider context、theme context、共享 useOrientation、space isPresetSize | 已逐项阅读，仅消费既有共享能力，不改共享实现；源码 CSS 生成和 gap 变量需真实浏览器验 |

## 全部 Demo 清单

| Demo | 展示能力 | 本轮处理/验收 |
|---|---|---|
| basic | 原生 radio 切横/纵，四个块直接作为子项 | 每个 radio 独立可访问名称与业务分组，键盘真实切换、块方向改变 |
| align | select 控制 justify/align | 保留两个已具名 select，验证可选值实际几何；去除过时上游占位说明 |
| gap | 预设/自定义 range | 必修多 radio 共用单一 label、条件 range 无名称；完整展开后 axe/键盘与 0/分数/预设距离验 |
| wrap | 24 个原生按钮多行 | 三宽度实际换行、无意外横溢、Tab 保持原生顺序 |
| combination | 嵌套方向/对齐与业务卡片 | 必修固定 620px 溢出、外部图片网络依赖及上游推广内容；本地原生展示、响应式业务卡片，保留 Flex 组合目的 |
| debug | 横/纵的原生空块 | 三宽度、当前主题、无空值过滤/额外子项包裹；保留纯几何示例 |

所有 `.md` 与 `.vue` 同步真实能力；不保留“其他组件尚未落地”等失效说明。六例保留，不以删例换绿。

## 分类与验收标准

- 源码链完整、运行待验：普通 prop 方向/换行/主轴对齐、数字长度、完整 default slot、原生无自带 role 的布局语义、现有静态导出。历史 39 DOM 参考场景和 15 参考视觉输入保留。
- 本轮必修：当前 Provider/attrs；全部 align 值与文档承诺的默认；动态原生宿主 ref；空宿主布局；三档 gap 的当前主题作用域；六 Demo 的真实交互、标签、移动布局与本地资源。
- 需要裁决：初始无。若红灯揭示公开规格冲突，记录证据与所采用的现行规范，不将实现或历史快照自动当正确答案。
- 另案/非本单元：其他组件 API、共享导出/Registry/runner 集成、发布产物构建、正式 Apollo 基线接受、最终全仓/Docs 同提交门禁。不得因本线程局部绿灯宣称全库验收。

验收需要：先保存分组红灯；修复后独立运行 Flex unit/type/DOM/a11y/theme；源码真实浏览器布局/原生事件/焦点/多实例/动态根/主题；SSR→真实 hydration 的稳定宿主；全部六 Demo 四主题及三宽度、条件控件展开后的 axe；预备 root/subpath 与六 Demo consumer 类型/Node SSR；新增 Apollo 原生 visual case/helper 并在三宽度执行状态 preflight，保留原有参考用例，基线只生成候选不接受。记录失败、命令、实际计数和未执行项；结束时冻结本线程文件清单给主线程。

## 执行记录

尚未执行新回归；以下由后续阶段回填。

## 本轮实现与已验证结果

已成组修正当前配置读取、全部 align 分支、具名原生 dir 的所有权、动态根实际 ref、空宿主、三个 gap alias 的主题作用域，并显式声明完整 `FlexSlot`。默认行顶部对齐采用原双语 API 已明确的契约；默认纵向拉伸保持。空根不再由 `:empty` 隐藏，使具名空原生按钮的尺寸、焦点与键盘行为有效。迁移影响逐项见 [Flex 契约迁移](../migrations/flex-contracts.md)。

纯 attrs 替换在初始 unit 与 browser 中已通过，未将其虚构成独立缺陷；本轮改为 render 现读，将其与当前 config/dir 的合并集中处理，原有替换/移除覆盖保留。default slot 仍为原生插槽，不抽取假生命周期，不为完整零/Fragment 内容增加逐项 wrapper。

六例均保留。basic/gap 改为具名且实例隔离的原生单选组，gap 条件滑块有独立 label；组合示例改为响应式本地项目摘要且详情按钮实际展开内容。配对 Markdown 的 Vue 示例与真实源码同步，原始五个参考视觉 case / 15 张参考 PNG 及 39 个 DOM fixture 均未改。

### 红灯及探针纠正

- 新 `contracts.test.ts` 原始红灯：14 通过、8 失败，原始 JSON `/tmp/apollo-flex-unit-red.json`；最终新增契约组为 23/23。原始 ThemeProvider 一项读取的是测试 wrapper 而非 `.apollo-flex`，已纠正宿主选择；主题缺陷同时由 nested scoped unit 和四个真实浏览器主题红灯独立证明。原始八条失败不等于八个独立产品缺陷。
- 源码浏览器初轮 34 通过、26 失败，`/tmp/apollo-flex-browser-red.json` 保留。Provider fixture 初用未声明的直接 `flex`，改为真实公开通道 `components.flex`；wrap-reverse 的宽度从测试直接 DOM mutation 改成 fixture 的响应式 `probeWidth`，避免后续 Vue patch 恢复宽度。这两类测试工具问题不计产品缺陷，也没有放宽实际布局断言。
- 首个 visual preflight 因新独立 runner 残留 `GRID_SOURCE` 环境名，实际读了旧发布产物，结果为 33/42，九个失败恰在新默认/空宿主/当前 Provider 组；旧结果 `/tmp/apollo-flex-visual-states.json` 保留为旧产物证据。runner 改为显式 `FLEX_SOURCE` 后，源码 42/42。
- 全部补充均保留实际原生事件、焦点、完整内容、几何、axe 与收集完整性检查；未删除场景、跳过断言或降低容差。

### 实际执行命令与结果

命令均在仓库根执行，使用 Node 22.22.2；没有包 build、commit、push 或基线接受。

| 命令/范围 | 实际结果 | 证据 |
|---|---|---|
| `pnpm exec vitest run packages/ui/src/flex --project unit --project dom-contract --project a11y --project theme --reporter=json ...` | **120/120**：unit 64、DOM 39、a11y 9、theme 8 | `/tmp/apollo-flex-runtime-final.json`，进程退出 0 |
| `FLEX_SOURCE=1 FLEX_EVIDENCE=/tmp/apollo-flex-browser-final2.json node tests/browser/flex-contracts.mjs` | **60/60**；SSR 实际水合、当前 config/attrs、十 align/十二 justify、零/分数/CSS gap、flex 0/分配/basis、原生事件/键盘/ref/卸载、四主题、6 Demo×4主题×3宽度共72观察、条件滑块展开后 axe；组件错误/警告/水合警告 0 | JSON 同路径；读者全部退出 |
| `FLEX_SOURCE=1 FLEX_VISUAL_EVIDENCE=/tmp/apollo-flex-visual-final.json FLEX_VISUAL_SCREENSHOTS=/tmp/apollo-flex-source-candidates node tests/browser/flex-visual.mjs` | **42/42**：14 Apollo 原生 case × 400/800/1200；每个 helper 校验实际状态、axe、非空/非 NaN/无意外横溢。候选 PNG 42，不接受基线 | JSON 同路径；source=true |
| `FLEX_SOURCE=1 FLEX_TYPES_EVIDENCE=/tmp/apollo-flex-source-consumer-types.json node tests/consumer/flex-types.mjs` | 独立 Flex 源码入口、严格公共 SFC、全部6 Demo、完整槽/ref/native style及两个类型负例通过；此模式明确不冒充发布 root/subpath 验收 | JSON 同路径，sourceAliases=true、rootAndSubpath=false |
| `pnpm exec vitest run packages/ui/src/flex --project types --reporter=json ...` | 6 个 Flex 类型场景在 runtime/typecheck 汇总12通过，但**整体进程退出1**，不得标全通过 | `/tmp/apollo-flex-types.json` 与诊断下一行 |
| `pnpm exec vue-tsc --noEmit -p tsconfig.json` | 退出2，当前12条源诊断在并行 Alert/Layout（含它们的测试），Flex无源诊断；已通知主线程，没有改他人文件 | `/tmp/apollo-flex-lint-types.log` |
| `pnpm exec biome check` 限 Flex目录及独立新增脚本 | 退出0，28个支持的代码文件通过 | `/tmp/apollo-flex-format-check.log` |

source consumer 初试误将整个源码 UI barrel 带入一个缺少仓库环境声明的临时 consumer 配置，报 process/ImportMeta/DOM.Iterable 及其他组件诊断；保留 `/tmp/apollo-flex-source-consumer-types.log`。源码 preflight 现明确只解析 Flex 自有入口，使用严格类型、正确 Node/Vite/DOM.Iterable 环境，不检查发布 root barrel。默认发布模式仍保留真正包 exports 和 `paths:{}`，待集成 dist 就绪后执行。

### 实际查看与剩余验收

已实际查看七张源码候选原图：`default-and-stretch-400`、`empty-host-400`、`current-provider-400`、`custom-component-400`、`complete-content-400`、`theme-dark-400`、`native-focus-1200`。默认与显式拉伸差异可见；空按钮保留可见焦点并执行一次 Enter；RTL 当前 Provider 保持输入及选区；完整零/Fragment、自定义 article、暗色间距和原生焦点均显示正常。没有声称其余35张已逐图查看，没有接受正式基线。

待主线程集成：

1. 同步共享 `COMPATIBILITY.md` 的迁移索引、barrel/Registry 与 visual matrix/runner；Apollo Flex 14个 variant，截图前调用 `prepareFlexVisual`，原参考5个/15图保持。
2. 包构建后默认模式执行 `tests/consumer/flex-types.mjs`、`tests/consumer/flex-ssr.mjs`（root/subpath×原生/custom 共4个 Node SSR 场景）和 `tests/browser/flex-contracts.mjs`，确认真正发布 JS+按需CSS，零源码 alias/注入。
3. 在正式 375/768/1440 视口生成并逐图审阅42张 Apollo候选，接受另行执行；本轮400/800/1200源码 preflight不是正式基线验收。
4. Alert/Layout 并行修复整合后重跑共享类型、Docs与最终同一提交全量门禁。本轮不声明 Flex 全层统一验收，也不将全库未通过改写成环境通过。

源码完成后以独立证据与文件 SHA 冻结交付；后续若有新实际缺陷再解冻，不继续扩展其他组件 API。

完整机器证据见 [flex-source-contracts.json](evidence/flex-source-contracts.json)。此证据区分原始红灯、探针纠正、已通过的 Flex 独立验证和当前未通过的共享类型门禁；本单元源码冻结清单与 SHA 写入 `/tmp/apollo-flex-source-freeze.json` 供主线程整合核对。

## 2026-10-29 · 本轮最终验收

上文保留各阶段红绿及当时的待验收边界；本节记录统一收口。Flex完整清单已验收：发布60/60、Node SSR4/4、严格6个真实Demo；medium/middle与实际布局均保留；正式Apollo 42张已审阅批准，批准后严格rawRGBA精确。

[本批最终验收](evidence/space-flex-alert-layout-final-acceptance.json)汇总1978/118关联专项、[本单元发布门禁](evidence/theme-source-flex-published.json)、[正式视觉审阅](evidence/space-flex-alert-layout-native-review.json)、[批准后回执](evidence/space-flex-alert-layout-postapproval.json)及[Docs161+56](evidence/space-flex-alert-layout-docs-local.json)。原759视觉记录和PNG保留，当前完整交付21/72；Input完整API、其他51组件、13基础包逐包审计与全库最终同提交门禁仍开放。Docs为本地真实构建验收，最终部署/线上回执由主线程另记。
