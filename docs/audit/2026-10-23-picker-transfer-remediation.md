# F01 / F06 本地整改 · 2026-10-23

基线：`143fecdd`，本报告对应其上的工作区变更。环境：macOS x64、Node 22.22.2、pnpm 12.4.2、系统 Chrome 150.0.7871.125。不是全仓重新验收；其余 KNOWN-ISSUES 继续保留。

## F01：Picker 的输入身份与无障碍属性

公开类型已声明输入 id，实际链路丢失；tabindex 与输入 ARIA 错落根。修复在入口渲染时分流：class/style/data 和原生鼠标事件留根，输入元数据走有类型的 inputAttrsByIndex。单值、范围、时间、掩码和多选共用此链路；值、ref、掩码事件、校验 aria-invalid 由内部控制。

范围字符串 id 只给起点，对象 id 分别绑定两端，不生成重复 id。name/required/autoComplete 既有文档契约也在同一链路补齐；autoFocus 聚焦第一个未禁用端。输入 ARIA 与 Tab 顺序落点变化已在双语文档明确。

初始 7 条回归修前全部失败（input id 均丢失），修后通过；随后添加 autofocus 边界，当前 8 条。旧 index.test.ts 空转的 `id != user-id` 改为 input.id 正向断言；原根 aria-describedby 测试按输入关联契约改验实际 input，保留动态 attrs 覆盖。

Vue 模板消费：`packages/ui/src/date-picker/demo/input-attrs.vue`；回归：`input-attrs.test.ts`、`s6-issue5.test.ts`；生产 dist 浏览器回归：`node tests/browser/picker-input-attrs.mjs`，覆盖四入口的原生 label 聚焦、Tab、范围禁用端、ARIA、只读、弹层和 autofocus。SSR 水合保留同一输入节点且无 hydration 警告。

## F06 / D03：直接采用 Vue 插槽

用户明确裁决开发阶段无需函数兼容层与弃用期，见 ADR 0006。Transfer 直接使用 #item/#footer/#list/#selectAllLabel；移除 render/footer/renderList/children 渲染接口、selectAllLabels 函数项和专用返回类型/别名。业务事件、filterOption、rowKey 等实际函数能力保留。

默认内容展示 title/key；搜索、行 title 和 checkbox 名称来自数据文本。slots 在 render 中读，以存在性判断，包括空 slot 和条件 slot。自定义列表不启用内部 pagination；选择与移除回调按当前数据和禁用状态防护。direction 保持数据方向，RTL 仅镜像视觉。详细作用域、旧/新写法见 `docs/migrations/transfer-slots.md`。

5 条新回归修前全部失败，覆盖作用域、动态内容与插槽增删、空插槽、受控选择/移动/搜索/滚动和 SSR。Table/Tree Demo 改为模板作用域插槽，去掉旧 Record→内部 Props 的类型断言及无效 v-model 写法。Tree 各侧只显示该侧数据，独立勾选，避免重复展示已转移节点。

保留历史 DOM 对照及原差异表。参考样例原先无 renderer 时内容为空，现用显式空 #item 表达同一场景；旧对象 renderer 用数据搜索文本与独立 slot 表达。新增 Apollo 行为测试覆盖默认 title/key 和真实插槽，不改基线或阈值。

## 验证

- 修前红灯：F01 7/7 失败；F06 5/5 失败，均为可见行为断言。
- F01 局部四层：27 文件 / 534 条通过。
- F01 生产 dist Chrome：四入口全部通过，零页面错误。
- F06 局部四层：7 文件 / 122 条通过。

| 命令 | 结果 |
| --- | --- |
| `pnpm run lint:types` | 通过；严格检查完整源码及 Vue Demo，无诊断 |
| `pnpm exec vitest run --maxWorkers=1 --project types packages/ui/src/date-picker packages/ui/src/time-picker packages/ui/src/transfer` | 6 文件 / 154 条通过；Type Errors: no errors |
| `pnpm exec vitest run --maxWorkers=2 --project unit --project dom-contract --project a11y --project theme packages/ui/src/date-picker packages/ui/src/time-picker packages/ui/src/transfer` | 34 文件；655 条通过，Transfer light 主题一条 5 秒超时，下面单独复验 |
| `pnpm exec vitest run --maxWorkers=1 --project theme packages/ui/src/transfer/__tests__/theme.test.ts` | 11/11 通过；包括上条超时用例，未改超时/断言/阈值 |
| `pnpm exec vitest run --maxWorkers=1 --project unit packages/ui/src/transfer/__tests__/slots.test.ts` | 最终动态 item/footer/list 增删路径 5/5 通过 |
| `node tests/browser/picker-input-attrs.mjs` | 四个生产 dist 入口通过，零页面错误 |
| `node tests/browser/transfer-slots.mjs` | #item/#footer、Table、Tree 三个真实 SFC Demo 通过；Table 额外验证全选只选择当前页、换页不误选；零页面错误 |
| `node tests/build/run.mjs --package ui` | L7 11 项通过，FAIL 0 / PENDING 0；包含本次 UI 重建、声明、exports、运行时依赖扫描、预算与 SSR |
| `pnpm run verify:consumer` | tarball + Vite / Webpack 两种消费端通过 |
| `pnpm run registry:check` | 19 项通过，0 warning；决策写入 seed 后生成 foundation/workstreams，保留历史状态与视觉来源 |
| `pnpm --filter @apollo-design/docs run content:build` / `content:check` | 72 组件 / 990 Demo / 7 指南；内容校验通过 |
| `pnpm --filter @apollo-design/docs run test` | 14 文件 / 154 条通过；新增示例使数量从 989 → 990，更新两处准确数量哨兵并验证新 demo id 入清单，保留唯一性与完整性断言 |
| `pnpm --filter @apollo-design/docs run typecheck` | 通过 |
| `pnpm --filter @apollo-design/docs run build` | 通过；client/server 构建及 SSG 84 路由完成，DatePicker/TimePicker/Transfer 正文和 Demo 入产物 |
| 对改动目录执行 `pnpm exec biome check`，及 `git diff --check` | 通过；Docs 两个既有测试文件有 5 条未新增的 non-null assertion warning，无 error |

组合运行曾与声明构建/体积分析争用资源：默认并发出现数条 5 秒超时；降低 workers 后剩一条主题超时，在重负载检查结束后单独复验通过。保留失败事实，不将组合命令写成单次全绿；没有修改门禁配置、禁用用例或删除断言。jsdom 的 canvas / pseudo-element getComputedStyle 提示为环境提示，真实 Chrome 检查零页面错误。

## 未完成验收与边界

`node tests/visual/apollo.mjs --component <name> --check` 对 date-picker/time-picker/transfer 均真实执行并以非零退出：分别有 27/15/9 张 `missing-approved-baseline`。未生成或接受新基线，未修改旧 React 参考图、像素差阈值、视觉状态或 `legacy-reference` 标记。L6 仍待 Apollo 自有基线审阅；本次浏览器交互和 L7 不能替代该验收。

文档构建仍有既有的大 chunk、静态/动态 import 混用与其他 Demo frontmatter order 提示；未提高告警阈值或屏蔽日志，H04 不因本次构建成功而关闭。

未执行全仓 `verify:full`、全量覆盖率、全量视觉、文档全站浏览器 smoke/catalog；本轮覆盖受影响三个组件及相关规范/交付工具。13 基础包没有源码变更，未重新宣称完成逐包专项抽检。KNOWN-ISSUES 其余 F/H/D 项及 72/13 最终证据矩阵继续开放。
