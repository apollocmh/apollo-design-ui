# SpaceAddon underlined 本轮整改单元计划

日期：2026-10-29。盘点起点：`2ef3206961be6511048a7bddec34d8b724adebf2`。

## 范围与裁决

主线程已裁决：`underlined` 应绘制单独底线；`borderless` 继续不绘任何边框。现有 variant 无效属于本轮必修。Breadcrumb helper 已验收并冻结，不再修改。

当前阶段只读生产源码、在 `/tmp` 写计划和红灯夹具；主线程正在构建公共层，不读取/写入 dist，不执行 UI/包构建。收到 `source-edit-ready` 后才修改 Space 所属实现、测试、Demo、API 文档及迁移说明。Input、共享 Registry、共享样式入口和发布产物均归主线程。

## 当前链路完整盘点

| 项目 | 声明 → 传递 → 消费 → 当前行为 | 分类 |
| --- | --- | --- |
| variant | `interface.ts:SpaceAddonProps` → `Addon.vue` 默认 outlined / computed rootClass → `style/index.ts` 四 variant 选择器 | underlined 与 borderless 均为 `border:none;background:transparent`，底线缺失，本轮必修 |
| status | `InputStatus` → getStatusClassNames → error/warning 文字混色、outlined 状态边框、filled 状态背景 | 原边框状态链未包含 underlined；新增底线必须消费相应状态色，本轮必修 |
| disabled | Addon 自身 prop → disabled 类；样式特异性覆盖状态文字，filled+disabled 位于状态规则之后 | 装饰禁用不禁用插槽内真实控件；现有优先级须保留 |
| size | Compact 自身 size → useSize / 当前 Provider 尺寸 → CompactItem provide → Addon compactSize → small/large 类；middle 走基础值 | Addon 没有独立 size prop；须覆盖三尺寸和动态上下文，不能凭新增 prop 解决 |
| 横/纵、RTL、首/中/尾/独项 | Compact render 当前 children / 嵌套 first/last 合取 → useCompactItemContext → Addon 所属 compact 类 → 逻辑圆角与负 margin | 通用连接负 margin 当前对各 variant 都生效；逐边检查底线不丢失、侧边不复活，outlined/filled 原边界保留 |
| 四主题 | ConfigProvider / ThemeProvider 当前 token → Addon useTheme / transformToken inline vars → 静态 CSS Alias | 使用 lineWidth、lineType、colorBorder/error/warning，不硬编码颜色或新增 Token |
| root attrs / default slot / expose | Addon getRootAttrs 渲染期 mergeProps；完整默认槽；nativeElement 根 div | 本轮不改 DOM、槽、事件或 ref；原生 style 变量仍最高优先级，内容/焦点身份须保留 |
| Emits / v-model / Provider 禁用 | Addon 无组件 emits / v-model；disabled 为自身装饰 prop | 不新增受控状态或表单语义，不将状态传递成 aria-invalid/disabled |
| 测试 | `theme.test.ts` 将 underlined 记作不消费边框状态；`tests/browser/space-contracts.mjs` 将 underlined 与 borderless 合并断言 borderStyle=none | 错误预期需按本轮明确裁决修正，并以四边 computed 样式与状态覆盖替代，不能只删断言 |
| Demo / API / 迁移 | 公开双语 API 声明四 variant；debug Demo 未实际展示 underlined；旧迁移称四 variant 绘制保留 | 必须同步展示与说明实际底线；注明旧错误外观的替代写法 borderless |

源码证据：`packages/ui/src/space/Addon.vue`、`Compact.vue`、`Compact.ts`、`interface.ts`、`statusUtils.ts`、`style/index.ts`；相关消费为 SpaceAddon 自身、Compact 子项及现有真实控件组合。Input 仅作只读关联观察，不改它的实现。

## 预定行为与最小修正

1. underlined 清除顶边/两侧边，仅底边使用当前 lineWidth / lineType；底线为直线，圆角为 0；背景透明。RTL 和纵向 Compact 不将底线旋转到侧边。
2. normal 底线消费 colorBorder，error / warning 消费 colorError / colorWarning；success / validating 继续使用基础底线、保留状态类。
3. disabled 继续覆盖文字色，不移除底线；error/warning + disabled 的底线沿用现有 outlined 的状态边框优先级。filled 的禁用背景还原不变。
4. borderless 全部状态保持四边不可见和透明背景；outlined/filled 的边框、背景、文字、尺寸和圆角作为对照逐项核对。
5. 优先在 Space 静态 CSS 修复 underlined 基座及既有 status 选择器的消费范围；不改 Addon prop/内容结构，不新增共享 Token，不改 Input。
6. 通用 Compact margin 是否影响底线，以实际几何和截图为准；不凭字符串批量改所有 variant 的连接规则。有根因证据时只修 Addon 自身必要边界。

## 验收矩阵与红灯

完整交叉矩阵：4 主题（default / dark / compact / dark-compact）× 3 size（small / middle / large）× 3 status（normal / error / warning）× 2 disabled × 2 Compact 方向 × 2 文本方向 × 2 组型（独项 / 三项链）× 4 variant = **2,304 组、4,608 个 Addon 单元格**。链中分别检查 first / middle / last，独项检查 first+last。对 underlined、borderless 的需求断言分别计数，outlined/filled 保留回归对照。

每项读实际 Vue 组件产生的 class、四边 style/width/color、底线、背景、文字、圆角、尺寸、共享边界和 CSS 变量；期望值取当前 Alias 并在浏览器规范化颜色，不复制实现字符串作判据。

补充边界：success/validating；原生根 style 的 lineWidth/color 覆盖；variant/status/disabled/size/theme/方向动态切换与移除；嵌套 Compact/NoCompactStyle；Addon 中原生编辑器保持 DOM/焦点/值，装饰禁用不禁用子控件；重复挂载/卸载的原覆盖继续执行。

红灯使用 `/tmp` 中的源代码浏览器夹具：直接导入 SpaceAddon/Compact 和主题源文件，仅注入源码 genSpaceStyle 及当前主题变量，拒绝读取本仓库 packages/*/dist。缓存、报告、截图全部位于 `/tmp`。不会把该夹具当作发布产物验证。先记录现有 underlined 底边为 none/0 的失败，再进入修复。

红灯命令、实际计数和日志路径在复现结束后追加本文件；若尚未执行，不记为已验证。

## 修复阶段文件与验收顺序

- 生产仅 `packages/ui/src/space/style/index.ts`；若源码运行链路正常，不改 Addon.vue/Compact。
- 所属测试：Space theme / contracts 测试、Space browser 夹具与脚本；精确修正旧的 underlined=borderless 预期，补上四边/状态/动态链路。
- Demo：现有 Space Demo 的 Vue + 配对 Markdown，展示 normal/error/warning/disabled underlined 与 borderless 对照，保留真实业务控件。
- 文档：Space README、双语 API、`docs/migrations/space-contracts.md`；记录 underlined 错误实现修复以及需要旧无边框外观时使用 borderless，不新增兼容开关。
- 源码红→绿后执行 Space 适用 unit/dom/a11y/theme/type、源码浏览器与 Demo/消费检查；跨公共层改动和发布重建由主线程统一处理。
- 等主线程 dist-ready 再跑发布 JS/CSS 的浏览器/类型消费；正式视觉候选与逐图审阅、最终同提交门禁单列。本计划和局部绿灯均不代表已完成全库验收。

## 当前分类

- 已核对正常（源码链路）：variant/status/disabled 类名、Compact 尺寸和方向/边界 provide/inject、默认槽/attrs/ref、当前主题变量消费。
- 本轮必修：underlined 底线缺失及状态边框消费；错误测试预期；Demo/API/迁移说明。
- 需要裁决：底线存在性已由主线程明确裁决，无待决阻断项；实现按现有状态/禁用优先级。
- 另案边界：Input 自身样式与交互、任意 prefixCls 自动 CSS（共享 D04）、全局 Registry/构建入口。不以这些事项缩小本轮已授权修复。
- 尚未验证：完整浏览器矩阵红灯、修复后源码/发布/正式视觉；当前禁止提前写生产源码。

## 已执行红灯与 source-edit-ready

主线程已发出 `source-edit-ready`：L7 严格 11 项通过，现有发布产物独立冻结，允许仅 Space 所属源码整改；不需要再次申请许可，仍不改 Input/Registry/dist、不执行构建。

- 源码浏览器红灯：`node /tmp/apollo-addon-underline/matrix.mjs > /tmp/apollo-addon-underline/red-matrix.log 2>&1`，exit 1。
- 实际完成 2,304 组 / 4,608 cells；underlined 1,152 / 1,152 失败，outlined、filled、borderless 各 1,152 / 1,152 通过。错误聚焦底边 none/0、缺少状态线与未清除圆角；page/console 错误 0、仓库 dist 读取 0。182 个解析模块均来自源码。
- `/tmp/apollo-addon-underline/red-matrix.json` 保存全部四边/token/状态与首中尾/独项数据，`red-summary.json` 为摘要，四主题三 size 截图为 `red-<theme>-<size>.png`。
- 首次临时 HTML 缺 favicon 产生 404，原始日志/report 保留为 `red-initial-*`；补临时 HTML 的 data favicon 后完整重跑，上述正式红灯为零环境错误，未修改组件源码。
- 所属回归测试红灯：`pnpm exec vitest run --project theme packages/ui/src/space/__tests__/theme.test.ts --maxWorkers=1 -t 'SpaceAddon underlined contract' > /tmp/apollo-addon-underline/red-unit.log 2>&1`，exit 1；底线、error、warning 三例失败，borderless 对照通过。-t 之外的现有用例本次未执行，完整回归将在修复后运行。
- 红灯样式源码 SHA256：`040017e083aaeb9e0644769dee0a6ed454df79a44bbc7386dd5ec8ebb9f16f93`；红灯记录时主线程 HEAD 已进至 `a47d96ec00506fae67c3b8c6b0c77b2f2b054217`，Space 生产文件哈希与盘点起点一致。

## 修复与当前验证进展

- 已仅在 Space 静态样式增加底线/零圆角，将现有两个状态边框规则的选择器组扩至 underlined；规则数仍为 31。Addon/Compact 的组件实现、props、DOM、槽、expose 未改。
- 临时完整矩阵和仓库新增 `tests/browser/space-addon-underline.mjs` 均为 4,608 / 4,608 通过。后者额外断言实际首尾类、RTL 类的当前更新和相邻几何，零 dist 读取 / 零页面或控制台错误。
- Space unit/dom/a11y/theme：6 文件 / 445 tests 全通过（旧 441 + 新的 4 个底线/状态/对照测试）。
- 源码类型消费最初因临时 node_modules 没有 source 模式的 node/vite 类型链接而报 TS2688；仅修所属 `tests/consumer/space-types.mjs` 的 source 分支链接后，公开类型与全部 15 Demo 通过，未将额外开发依赖加入 published 分支。
- `tests/browser/space-contracts.mjs`：83 项实际执行，79 通过；新增动态编辑器、底线四边/状态/禁用和原来的 SSR/水合均通过。仅新增 Demo 的纯文本 disabled Addon 在四主题触发真实 color-contrast 失败，日志/report 保留；没有删 axe 断言、放宽阈值或改变禁用文字 Alias。
- 已向主线程报告 disabled Demo 的语义选择：库 disabled 按现有契约仅装饰，不自动给布局 div 添加 inactive 语义或禁用后代；新增 Demo 不能靠忽略对比度通过。等待其对调用者明确声明 inactive 内容或展示真实禁用控件的裁决，其他验证继续。
- 发布 dist 仍由主线程冻结，当前不是发布产物/正式视觉/全库验收结论。

## disabled Demo 裁决及落实

主线程明确裁决使用真实 disabled 的公开控件内容；不得对纯静态布局文字添加 aria-disabled 来豁免对比度，不改 Addon disabled 语义或 Token。Demo 的 underlined 三尺寸与 borderless disabled 格现在包含显式 `<Button type="text" disabled>`，配对 Markdown 说明 Addon 装饰态与真正禁用操作分别设置。原四 variant、全部 status/disabled 矩阵和 axe 断言均保留。

消费者隔离类型链接修正后，源码公开类型和全部 15 Demo 已通过；独立 Space type project 为 44/44，通过且未放宽类型配置。最终 Demo 调整后补跑源码消费、整单元 runtime 和完整浏览器验收。

## 本轮源码验收与冻结

最终 Demo 使用真实禁用 Button 后完整重跑：Space runtime 6 文件 / 445 tests 通过；源码浏览器 83/83 通过（包含 15 Demo × 四主题的原始 axe 检查、SSR/水合、原生编辑器、当前 Alias 及新增 variant 动态链路），页面/控制台错误 0；源码消费端公开类型与全部 15 Demo 通过。Space type project 44/44、无类型诊断；所有修改的 JS/TS Biome 与 diff whitespace 检查通过。配对 Markdown 的 Vue 代码与实际 Demo 逐字相同。

最终可重跑矩阵为 `SPACE_ADDON_EVIDENCE_DIR=/tmp/apollo-addon-underline/persistent-green node tests/browser/space-addon-underline.mjs`，4,608/4,608 通过，四 variant 各 1,152 项，覆盖全部方向/边界和实际相邻几何；0 dist 读取、0浏览器错误。

源码验收证据、12 个所属文件的最终 SHA256、全部命令日志和剩余边界见 `/tmp/apollo-addon-underline/handoff.json`。样式 SHA256：`84a52abb820eb409ef1862bb54cd10af5fb1ce75aff8001e397c37a614137ce9`。冻结时主线程工作树 HEAD 为 `e2084ff6d1ef10128ef85b1e37837ce4f15eb8d8`，本轮尚未自行提交；各修改文件以记录的哈希为准。

所有夹具服务器、浏览器、类型/测试进程均已退出。12 个所属文件现已冻结；没有修改 Input/共享 Registry/dist，没有执行 UI/包构建。发布 Space CSS 的只读对照仍为旧 `border:none`（SHA256 `d6cd31a6ee11df42a3bad854a87cfc7fee9bcbd8e39e3f1f806b13d383bcbed9`），不能把源码绿灯报告为新发布产物已通过。

剩余由主线程统一推进：提交/发布重建、新发布 JS+CSS 的 browser/consumer 验收、Space 正式视觉重新捕获及逐图审阅、最终同一提交的全量门禁。本轮源码单元统一验收已完成，不代表全库或正式视觉已完成。

## 主线程保存点

上述12个所属文件已逐项与冻结SHA一致后集成，生产仅Space静态样式。源码矩阵4608/4608、相关runtime445、真实browser83（15 Demo×四主题axe）、公开类型44与15 Demo源码消费分别通过，日志和范围见[结构化源码证据](evidence/space-addon-underline-source.json)。没有修改Input、共享上下文/Registry或dist；此保存点不冒称发布产物和Space整单元完成。下一阶段实际UI构建与发布消费后另记。

## 实际发布产物验收

保存点 `2f47f423` 的独立工作树实际unbuild退出0，严格UI L7 11项零失败/待定。公开发布JS/d.ts/space与汇总CSS来自同一新dist；原83条浏览器（含四主题160绘制组合、动态/原生变量/编辑器身份和SSR水合）及全部15真实Demo的发布声明消费通过，零浏览器/Vue错误。7个关键产物正式before/after指纹一致，所有读者已退出，未改主350f4cb2 dist。来源、命令和SHA见[发布验收证据](evidence/space-addon-underline-published.json)。

Addon已有variant的底线窄修正已实现并分别通过源码/发布验收；Space仍需Input当前主题尺寸链修复后重拍75张，不以本窄单元通过宣称Space全部完成。
