# F10：Vue DOM 属性与原生监听器 · 2026-10-24

接续 F05/F07/F09 工作区；未提交、推送或发布。环境为 macOS x64、Node 22.22.2、pnpm 12.4.2。

## 已确认问题与边界

针对三个调用者建立 5 条专项检查，修前 2 条失败：ColorPicker 的 @mousedown 经 pickAttrs 被过滤，Rate 的 @keydown 被摘走却仅调用 onKeyDown。新增 utils 用例同时证明已知 Vue 模板事件键及 Once/Capture 后缀被过滤。

收尾另建失败用例确认 Rate 把原生字符串 style 展开为字符下标属性，SSR 输出 `0:c;1:o…` 无效 CSS。移除旧对象展开和对应强制类型转换，原始 style 交由 DOM helper 与 context style 合并；修后该条与六文件 79 条专项通过。

原生 class 的 SSR 输出、Tree 的 Vue fallthrough/唯一 class、ColorPicker 仅 attrs 更新均通过；没有把这些风险升级为已发生缺陷，也没有为未复现的 attrs 缓存重构组件。

## 实现

pickAttrs 保持原有配置口径、className 数据输出、普通属性值与 rawEventNames 行为。已知事件既接受原拼写，也接受 Vue 规范拼写及 Once/Passive/Capture 后缀；未知业务事件继续过滤。两个拼写合并监听器时保留不同函数，并按身份去重。

新增 utils 的 toVueDomAttrs/mergeDomAttrs，仅在真实 DOM 目标归一 className→class 与已知事件键，通过 Vue mergeProps 合并 class/style/监听器，监听器数组再按函数身份去重；不改输入记录，不改造业务载荷。测试覆盖客户端与 SSR 的 class 一致性、无 classname 属性、数组监听器顺序和单次发送、once/capture 真实行为。

Rate 的 keydown/mouseleave 直接走 DOM 合并：内部更新先执行，再调用外部原生监听器；移除原手调回调，disabled 的键盘处理与通知仍抑制。ColorTrigger 在 DOM 目标使用归一 helper。Tree 的 aria/data 通道与 Vue 自动 fallthrough 已验证正确，保留现状。不是按字符串全局替换所有 pickAttrs 调用者。

公开 utils API 文档、Rate/ColorPicker 双语文档与 Rate basic 真实键盘 Demo 同步。已有 onKeyDown/onMouseLeave 拼写仍在同一原生事件通道工作；没有增加渲染函数兼容层或弃用期。

## 已运行验证

- utils/组件专项修前失败，修后 3 文件 / 29 条通过；后续补充 Rate 两种事件键同时注册及 disabled 负例。
- 以 utils、Badge、Rate、ColorPicker、tree 路径筛选（亦匹配 TreeSelect）的 unit/dom-contract/a11y/theme 合跑：59 文件 / 1168 条通过。保留所有断言、视觉差异阈值与告警门禁。
- utils L7 11 项，FAIL 0 / PENDING 0，5 项按无 CSS/组件职责 n/a。UI 最终 L7 同样 11 项通过、无 fail/pending。

## 共享交付门禁

以下为 F05/F07/F09/F10 与后续 F11/H03/H04 的实际收尾结果，未把此前失败、过期豁免或类型构造错误计入通过。

| 命令 | 结果 |
| --- | --- |
| `pnpm run lint:types` | 最终全部源码通过；Table 新 Demo 按公开 Record 数据契约编写，使用 satisfies 保留 key 类型，未用断言压制泛型不匹配 |
| `pnpm exec vitest run --maxWorkers=1 --project types` 筛选 utils、Badge、Alert、Collapse、Switch、InputNumber、Rate、ColorPicker、tree | 20 文件 / 252 条通过，Type Errors: no errors，无未处理 source error |
| `node tests/build/run.mjs --package utils` / `--package ui` | 各 11 项，FAIL 0 / PENDING 0；utils 的无 CSS/组件职责项为 5 个 n/a，UI 无 n/a |
| `pnpm run verify:consumer` | tarball + Vite/Webpack 两种真实消费端通过；无 React/rc/antd 运行时引用 |
| `node tests/browser/picker-input-attrs.mjs` | 新 dist 上 F01 的 Date/Range/Time/TimeRange 四入口均通过 |
| `node tests/browser/transfer-slots.mjs` | 新 dist 上 F06 item/footer 与 Table/Tree scoped list 均通过 |
| `node tests/browser/vue-reactivity.mjs` | 新 dist + 真实 SFC：F02/F04/F05/F07/F08/F09/F10/H03 全通过；含原生拖放与键盘，零页面错误 |
| `vitest ... --project unit --project dom-contract --project a11y --project theme` 筛选 Rate 与 ColorPicker dom-attrs | Demo 更新及最终事件负例补充后 6 文件 / 79 条通过 |
| `vitest ... --project unit --project a11y` 筛选 Table demo/a11y | 2 文件 / 96 条通过；准确数量 44，无新增豁免 |
| `pnpm --filter @apollo-design/docs run build` | client/server 与 SSG 84 路由通过，994 Demo；无 search.ts 混合导入警告，大 chunk/order 提示保留 |
| Docs `content:check` / `typecheck` / `test` | 全通过；14 文件 / 157 条测试，994 个 Demo 与新示例 id 哨兵准确 |
| `node tests/browser/table-documentation.mjs` | Table SSR API、英文水合、视口按需加载/滚动保留状态、搜索索引单次/缓存、焦点返回、暗色状态与 inline/iframe 截图准备通过；错误模块负例拒绝；零页面错误，资产字节记录到 evidence |
| `pnpm run registry:check` | 19 项与 vue-native 记录检查通过；新增 utils 文件后按 foundation→workstreams 顺序刷新派生事实，保留真实状态含义 |
| `pnpm run test:tooling` | 8/8 通过，包含 F11 的别名/继承/数据分流与只读漂移正反门禁 |
| `pnpm run audit:content-slots:check` | 当前 73 interface.ts / 486 行清单一致；不将候选当成缺失数或运行验收 |
| 改动目录 Biome / `git diff --check` | 无 error；选入 Docs 旧测试时仍有非空断言 warning（manifest/demo-audit 5 条，demo-preview 11 条），未新加忽略或阈值配置；最终相关变更格式通过 |

## 未完成的验收

本批对 Alert/Collapse/Switch/InputNumber/Badge/Rate/ColorPicker 的 Apollo 基线检查均非零，分别缺 18/9/15/9/18/9/27 张已审阅图片，合计 105。相关 Apollo 基线仍需审阅；不能因历史 completed、legacy-reference 或功能浏览器通过而宣称新一轮视觉验收完成。全仓 verify:full、覆盖率及完整 72/13 复审矩阵未运行。
