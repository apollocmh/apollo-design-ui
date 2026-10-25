# F11 · 浮层内容与 Vue 业务绑定（2026-10-25）

Tooltip 的标题槽被 computed 缓存，空槽回退 title prop；Popover / Popconfirm 的标题、正文或描述以 prop 为先，按钮槽也固定在 computed 中。首批九条回归修前八失败、一条已有通过（TooltipPurePanel 当前槽）；证据为 `/tmp/apollo-overlay-red.log`。当前六个公开入口均在 render 读取现有内容槽，槽存在即优先，显式空槽不回退，条件移除后恢复数据 prop / locale。

按 ADR 0006 / 0007 移除 TooltipContent 中的函数分支、相关 Function 构造器与 getRenderPropValue，不留兼容层。保留 VNodeChild 数据；修正 Tooltip / TooltipPurePanel / PopoverPurePanel 的 String-only 声明与公开 VNode/0 契约冲突。三个 Slots 类型导出并接入六入口。Tooltip 事件守卫只消费最近 render 的非响应式内容判定，不在事件中执行槽，不写 render 响应式状态；受控 open 和非受控空内容抑制保留。Popover 内容分区使用稳定 key，标题增删保持正文输入与焦点。公开 Props 绑定揭示 autoAdjustOverflow 声明过窄，按既有接口修正，不改变定位算法。

生产 Chrome 首轮在点击确认时失败：模板 `:on-confirm` 的回调完全未执行。补真实 `.vue` 回归再次独立复现（`/tmp/apollo-overlay-kebab-red.log`），原因是四个业务回调未声明、留在 attrs 中，kebab-case 键未归一。现显式声明业务 props，移除 attrs 强转，直接读取当前 props；onConfirm 返回 unknown，Promise 等待与防重复执行保留。回归包括当前处理器替换、事件对象、弹层点击单发、取消及关闭通知。没有把业务回调转成丢失返回值的事件。浏览器复验的防重复断言最初以固定可访问名查找loading按钮而超时；改为稳定按钮定位、保留提交前名称断言，并用弹层内按钮显式解决Promise，去除计时依赖。业务断言未删除或放宽。

新增十三条功能回归，覆盖六入口 current/empty/removed 内容、无内容通知守卫、VNode/0、SSR 优先级、正文输入/焦点身份与 SSR hydration 预输入值、真实 kebab-case 业务绑定。历史 DOM 用例名称保留，Vue 函数 prop 调用改为槽，原内容断言与参考基线不变。三个既有 render-panel 示例补可交互原生模板，Demo 总数保持999；双语 API、说明与 [迁移记录](../migrations/overlay-content-slots.md) 同步。

## 检查结果

下表记录本批实际执行结果；局部回归不代表全仓验收。

| 检查 | 实际结果 |
| --- | --- |
| 首批 / 业务绑定复现 | 8失败/1通过；业务绑定单条失败；修后独立13条通过 |
| Tooltip/Popover/Popconfirm/Steps 四层 | 27文件368条通过；保留jsdom canvas提示 |
| 类型项目 / 全仓 source types | 8文件24条通过、0 source errors；全仓严格vue-tsc通过，含真实Vue正负例模板 |
| UI / L7 / 实际声明消费端 | UI声明与69份CSS生成；UI L7 11项、0 FAIL/PENDING；实际发布消费者六组件及三原生模板通过，无source alias / 测试声明发布 |
| 生产 Chrome | Chrome150.0.7871.125通过六入口 current/empty/removed、正文输入身份和值、Promise等待与防重复提交；零browser/Vue错误 |
| docs build/test/typecheck/content:check | 最终四项通过：84路由/999Demo、14文件157条、72组件内容校验；保留既有chunk警告 |
| Registry / inventory / tooling / Biome / diff | Registry19项及vue-native24 fixed/0 open、516行清单只读校验、8条tooling、Biome23文件与diff通过；review210不是缺陷数 |
| Apollo visual | **未通过：Tooltip 9、Popover 6、Popconfirm 9 张 missing-approved-baseline**；未接受候选或改阈值 |

未运行全仓 verify:full / 覆盖率；全库 F11、浮层原生 attrs / 图标槽与最终视觉验收继续开放。历史 completed / 视觉维度保留原含义。无推送或打标签。

```sh
pnpm exec vitest run --project unit --project dom-contract --project a11y --project theme packages/ui/src/tooltip packages/ui/src/popover packages/ui/src/popconfirm packages/ui/src/steps --maxWorkers=1
pnpm exec vitest run --project types packages/ui/src/tooltip packages/ui/src/popover packages/ui/src/popconfirm --maxWorkers=1
pnpm run lint:types
pnpm run build:ui
node tests/build/run.mjs --package ui --no-build
node tests/consumer/overlay-content-types.mjs
node tests/browser/overlay-content.mjs
pnpm --filter @apollo-design/docs run build
pnpm --filter @apollo-design/docs run test
pnpm --filter @apollo-design/docs run typecheck
pnpm --filter @apollo-design/docs run content:check
pnpm run registry:check
pnpm run audit:content-slots:check
pnpm run test:tooling
node tests/visual/apollo.mjs --check --component tooltip
node tests/visual/apollo.mjs --check --component popover
node tests/visual/apollo.mjs --check --component popconfirm
```
