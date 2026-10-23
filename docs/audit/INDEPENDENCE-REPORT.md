# Apollo 独立化与规范重构交付报告

日期：2026-10-23。基于 `master` 的 `52cf2a68`，本地分阶段提交；未推送远端。

## 结果与边界

项目规范、README、文档站、Registry 和质量工具现在以 Apollo 自有契约为准。Ant Design 保留为来源和可选参考，不绑定组件范围、版本或发布验收。Vue Native、TypeScript、静态 CSS + CSS 变量、组件一致性、无障碍与既有质量阈值保留。

这次没有批量删除、重命名公共 API，也没有宣称 KNOWN-ISSUES 全部已解决。视觉基线采用渐进迁移：1 个 Apollo 场景已审阅并重拍通过，余下 1,142 个场景明确待验收；不能把本次结果称为全量 Apollo 视觉通过。

## 实施与规范变更

| 范围 | 结果 |
|---|---|
| 首页与使用指南 | README 改为能力、源码安装、快速开始、主题、文档与开发入口；保留 0.0.0 尚无稳定发布承诺的真实状态 |
| Source of Truth | AGENTS 规定工作纪律；架构、组件、兼容、测试、流程各自单一职责；CLAUDE 只作入口；ADR 0005 说明旧 ADR 的保留/取代边界 |
| 历史阶段和选任务 | 移除根规范的 Phase/固定波次/唯一任务授权；next-task/workstreams 为建议，completed 不禁止维护；取消个人代理和自动 push master 规则 |
| Registry | components.json 为自有清单；不再从 antd raw facts 覆盖组件、依赖或 Token；生成器只刷新本库派生图/汇总，check 只读 |
| 完成维度 | 保留九个质量维度；上游版本、分析、compat 和规模迁入 referenceEvidence；旧视觉记录标明 legacy-reference，不虚构新验收 |
| 可执行门禁 | 取消 upstream 数量/版本一致、强制 compat fixture 和 priority 必须跟随依赖排序；保留真实依赖引用、无环、交付物、类型、令牌、产物隔离和空壳检测 |
| 视觉工具 | 默认入口为 Apollo，候选/接受/比较分开；记录提交、环境、哈希和审阅结论；缺失、篡改、未审阅、渲染失败或环境不一致不报通过 |
| CI | 上游视觉对照改为手动可选；保留其分片/渲染完整性诊断；增加治理测试、Apollo 已接受基线完整性和文档验证，文档变更不再被忽略 |

还修复了 Registry 原生成器会把 Token 状态重置为 todo 的设计，并纠正 alias.own 将 effective 清单重复存入的记录错误；没有修改实际主题值或公共类型。

## 实际代码与测试调整

- **F03 FormItem**：前缀由 setup 字符串快照改为 computed。新增回归在修复前失败；修复后验证 f1→f2→f1、row/布局/校验状态类及 input 节点保持身份。StatusProvider 未被无意义改写。
- **Portal**：内联模式不再向 body 挂载无用途空 div；未就绪状态也不 append 默认容器。原测试只断言复制上游副作用，现用更具体的内联→默认容器→内联场景断言内容位置与清理，修复前真实失败。公开参数和可见内容不变。
- **Vue 提示与说明**：SSR 提示使用 onMounted；useUpdateEffect 说明为 Vue post-flush watch；事件名转换、已有工具导出和清理语义保持兼容，删除无用的 React 心智类比。
- **文档站**：移除兼容版本徽章和首页同构承诺；组件页不再默认导向上游裁判；图标素材来源保留。注入根规范时修复仓库相对链接，回归测试验证真实源内容和迁移/历史链接。

## 清理与保留

保留原 COMPATIBILITY 全文到 `docs/history/compatibility-2026-10.md`，包括 D 编号和历史回归证据。旧分析、foundation 契约、组件 README/PLAN 和协作记录明确历史规范范围，防止旧 Gate 再次生效；有价值的场景、算法与错误分析未删除。

保留 React/antd/rc 开发依赖、Oracle、参考渲染器、PNG、locale/icons 生成器及来源头：引用分析确认它们仍被测试或显式维护工具使用。发布包及 Vite/Webpack 消费端没有这些运行时依赖。锁文件没有变更，没有为了“零字符串”清洗来源。

静态审查覆盖 **5,927 个受版本控制的文本文件**；另用 TypeScript AST 检查 **1,906 个生产源码文件**的静态 import/export，未发现 React、antd、@ant-design 或 rc 导入。该扫描不等于逐文件人工语义验收，运行时边界另由产物和消费端验证覆盖。可复现：

```bash
node docs/audit/tools/audit-independence.cjs
```

分类结果见 [INDEPENDENCE-SCAN.json](INDEPENDENCE-SCAN.json)。正常 Registry 生成不再消费旧 components.meta/rc-map/raw facts；它们保留为有日期上下文的调研资料。

## 验证结果

以下为实际执行结果；运行时完整回归中的两个中间失败均已修复并在最终整套运行通过。无新增 skip、无降低覆盖率阈值或像素阈值。

| 命令 | 实际结果 |
|---|---|
| `pnpm install --frozen-lockfile` | 安装成功；Node 22.21.0 / 本机 pnpm 11.25.0；仓库声明 packageManager 仍为 pnpm 12.4.2，未改锁文件 |
| `pnpm registry:check` | 19 checks passed，0 warnings；构建后 E11/E19 实际扫描产物 |
| `pnpm lint:types` | vue-tsc exit 0 |
| `pnpm lint:format` | exit 0；原有 37 warnings / 4 infos 保留，未用自动全仓重写掩盖 |
| `node --test tests/tooling/*.test.mjs` | 4 tests passed；覆盖独立组件、状态/Token 保留、只读漂移、循环、基线审阅/篡改/重复和 CLI 参数 |
| `pnpm exec vitest run --maxWorkers=2 --project unit --project dom-contract --project a11y --project theme` | **580 files passed；11,287 tests passed，3 skipped** |
| `pnpm test:types` | **170 files；2,213 tests passed；no type errors** |
| `pnpm test:build` | **151 检查，FAIL 0，PENDING 0，n/a 67** |
| `pnpm verify:docs` | 内容校验 72 组件；文档 typecheck 通过；**14 files / 154 tests passed**；SSG **84 pages** build finished |
| `pnpm verify:consumer` | 独立 tarball + **Vite/Webpack PASS**；入口/CSS 可用；无 React、antd、rc 运行时引用 |
| `node tests/visual/apollo.mjs --component button --variant type --viewport desktop` | **PASS / exact**，与已审阅的 Apollo 图比较 |
| `pnpm test:visual:check -- --approved-only` | selected=1143，pending review=1142，running=1；1 个审阅记录和图像哈希通过 |
| 缺基线负向验证 | 接受前同场景返回非零 `missing-approved-baseline`，未回退 React |
| CI YAML / `git diff --check` | 解析与空白检查通过 |

3 个跳过项来自原 locale 生成器对照测试的缺失本地上游源条件，本次未添加跳过。jsdom 的 canvas/pseudo-element/scroll 提示、Vite 配置加载警告、unbuild 的潜在 package.json 提示，以及 Demo 缺数字 order 的文档警告继续保留；不把它们伪称为本次新增缺陷或已消除。没有重新统计全量覆盖率，现有 CI ratchet 阈值保持不变。

本次分别执行了 verify:full 的适用子命令以避免重复构建，未宣称执行了一个整体 verify:full 进程。第一次本地浏览器监听及消费端网络安装受沙箱限制，取得执行权限后重跑成功。

## 兼容边界与后续工作

1. `docs/KNOWN-ISSUES.md` 仍是整改入口；F03 衔接本次修复，其余 FIX/VERIFY/DECIDE 不自动关闭。继续复现 F01/F02、内容 slots 和事件/attrs 风险，不依据上游是否相同拒绝修复。
2. `[classNames/styles]` 的非根别名、现有 VNode/render props、事件 payload、v-model 名称、工具导出、默认视觉和样式入口保留。未来破坏性 API 变更按 [迁移记录](../migrations/independence.md) 单独评估，含旧/新写法、弃用期与回归。
3. 将 Apollo 视觉迁移到固定 CI 平台/字体/浏览器，逐步审阅剩余 1,142 场景并补充暗色、紧凑、键盘焦点与交互状态。当前 CI 只验已接受图的完整性；真实像素比较已在本机验证，但尚不是全平台发布门禁。
4. Registry 的依赖和 Token 清单从历史记录承接后归 Apollo 所有，后续修改时继续与实际源码/主题公开类型核对；本次没有宣称对所有旧图边做完整语义重建。
5. 仓库包声明 MIT，但没有顶层 LICENSE/NOTICE 文件；生成素材与算法来源仍在。正式分发前核对并补齐应随包保留的许可文本，不凭项目独立化删除来源或假定声明已足够。

## 分阶段提交

- `99fcf0f8` — 项目定位与领域规范、ADR 0005、历史兼容归档。
- `1ddbecca` — Registry、文档站、工具链与独立质量入口。
- `6867166a` — FormItem、Portal 修复与 Vue 说明清理。
- `910281fb` — 包与组件历史说明/计划的规范范围。
- 最后一次提交包含 Apollo 试点基线、验收报告与扫描工具；可用 `git log --oneline 52cf2a68..HEAD` 查看完整提交号。

## 完整修改文件清单

共 304 个路径（含本报告与验收证据）；大量历史文件仅增加规范范围提示，未改动其原始证据。

- [.github/workflows/ci.yml](../../.github/workflows/ci.yml)
- [.gitignore](../../.gitignore)
- [.workbuddy-ai/README.md](../../.workbuddy-ai/README.md)
- [AGENTS.md](../../AGENTS.md)
- [ARCHITECTURE.md](../../ARCHITECTURE.md)
- [CLAUDE.md](../../CLAUDE.md)
- [COMPATIBILITY.md](../../COMPATIBILITY.md)
- [COMPONENT-RULES.md](../../COMPONENT-RULES.md)
- [README.md](../../README.md)
- [ROADMAP.md](../../ROADMAP.md)
- [TESTING.md](../../TESTING.md)
- [WORKFLOW.md](../../WORKFLOW.md)
- [docs/COMPONENT-CHECKLIST.md](../COMPONENT-CHECKLIST.md)
- [docs/KNOWN-ISSUES.md](../KNOWN-ISSUES.md)
- [docs/PHASE-1-REPORT.md](../PHASE-1-REPORT.md)
- [docs/adr/0001-zero-runtime-css-variables.md](../adr/0001-zero-runtime-css-variables.md)
- [docs/adr/0002-package-boundary-criterion.md](../adr/0002-package-boundary-criterion.md)
- [docs/adr/0003-dependency-replacement-strategy.md](../adr/0003-dependency-replacement-strategy.md)
- [docs/adr/0004-zero-antd-runtime-dependency.md](../adr/0004-zero-antd-runtime-dependency.md)
- [docs/adr/0005-independent-apollo-contracts.md](../adr/0005-independent-apollo-contracts.md)
- [docs/analysis/affix.md](../analysis/affix.md)
- [docs/analysis/alert.md](../analysis/alert.md)
- [docs/analysis/anchor.md](../analysis/anchor.md)
- [docs/analysis/auto-complete.md](../analysis/auto-complete.md)
- [docs/analysis/avatar.md](../analysis/avatar.md)
- [docs/analysis/back-top.md](../analysis/back-top.md)
- [docs/analysis/badge.md](../analysis/badge.md)
- [docs/analysis/border-beam.md](../analysis/border-beam.md)
- [docs/analysis/breadcrumb.md](../analysis/breadcrumb.md)
- [docs/analysis/button.md](../analysis/button.md)
- [docs/analysis/calendar.md](../analysis/calendar.md)
- [docs/analysis/card.md](../analysis/card.md)
- [docs/analysis/carousel.md](../analysis/carousel.md)
- [docs/analysis/cascader.md](../analysis/cascader.md)
- [docs/analysis/checkbox.md](../analysis/checkbox.md)
- [docs/analysis/ci-performance.md](../analysis/ci-performance.md)
- [docs/analysis/collapse.md](../analysis/collapse.md)
- [docs/analysis/color-picker.md](../analysis/color-picker.md)
- [docs/analysis/config-provider.md](../analysis/config-provider.md)
- [docs/analysis/date-picker.md](../analysis/date-picker.md)
- [docs/analysis/descriptions.md](../analysis/descriptions.md)
- [docs/analysis/docs-antd-visual-2026-10-23.md](../analysis/docs-antd-visual-2026-10-23.md)
- [docs/analysis/drawer.md](../analysis/drawer.md)
- [docs/analysis/dropdown.md](../analysis/dropdown.md)
- [docs/analysis/empty.md](../analysis/empty.md)
- [docs/analysis/flex.md](../analysis/flex.md)
- [docs/analysis/float-button.md](../analysis/float-button.md)
- [docs/analysis/form.md](../analysis/form.md)
- [docs/analysis/grid.md](../analysis/grid.md)
- [docs/analysis/image.md](../analysis/image.md)
- [docs/analysis/input-number.md](../analysis/input-number.md)
- [docs/analysis/input.md](../analysis/input.md)
- [docs/analysis/layout.md](../analysis/layout.md)
- [docs/analysis/list.md](../analysis/list.md)
- [docs/analysis/listy.md](../analysis/listy.md)
- [docs/analysis/masonry.md](../analysis/masonry.md)
- [docs/analysis/mentions.md](../analysis/mentions.md)
- [docs/analysis/menu.md](../analysis/menu.md)
- [docs/analysis/message.md](../analysis/message.md)
- [docs/analysis/modal.md](../analysis/modal.md)
- [docs/analysis/motion-review-002.md](../analysis/motion-review-002.md)
- [docs/analysis/notification.md](../analysis/notification.md)
- [docs/analysis/pagination.md](../analysis/pagination.md)
- [docs/analysis/popover.md](../analysis/popover.md)
- [docs/analysis/progress.md](../analysis/progress.md)
- [docs/analysis/qr-code.md](../analysis/qr-code.md)
- [docs/analysis/radio.md](../analysis/radio.md)
- [docs/analysis/rate.md](../analysis/rate.md)
- [docs/analysis/result.md](../analysis/result.md)
- [docs/analysis/select.md](../analysis/select.md)
- [docs/analysis/skeleton.md](../analysis/skeleton.md)
- [docs/analysis/slider.md](../analysis/slider.md)
- [docs/analysis/space.md](../analysis/space.md)
- [docs/analysis/splitter.md](../analysis/splitter.md)
- [docs/analysis/statistic.md](../analysis/statistic.md)
- [docs/analysis/steps.md](../analysis/steps.md)
- [docs/analysis/switch.md](../analysis/switch.md)
- [docs/analysis/table-virtual.md](../analysis/table-virtual.md)
- [docs/analysis/table.md](../analysis/table.md)
- [docs/analysis/tabs.md](../analysis/tabs.md)
- [docs/analysis/tag.md](../analysis/tag.md)
- [docs/analysis/time-picker.md](../analysis/time-picker.md)
- [docs/analysis/timeline.md](../analysis/timeline.md)
- [docs/analysis/tooltip.md](../analysis/tooltip.md)
- [docs/analysis/tour.md](../analysis/tour.md)
- [docs/analysis/tree-select.md](../analysis/tree-select.md)
- [docs/analysis/tree.md](../analysis/tree.md)
- [docs/analysis/typography.md](../analysis/typography.md)
- [docs/analysis/upload.md](../analysis/upload.md)
- [docs/analysis/watermark.md](../analysis/watermark.md)
- [docs/audit/INDEPENDENCE-REPORT.md](INDEPENDENCE-REPORT.md)
- [docs/audit/INDEPENDENCE-SCAN.json](INDEPENDENCE-SCAN.json)
- [docs/audit/tools/audit-independence.cjs](tools/audit-independence.cjs)
- [docs/foundation/a11y-contract.md](../foundation/a11y-contract.md)
- [docs/foundation/form-core-contract.md](../foundation/form-core-contract.md)
- [docs/foundation/icons-contract.md](../foundation/icons-contract.md)
- [docs/foundation/locale-contract.md](../foundation/locale-contract.md)
- [docs/foundation/motion-contract.md](../foundation/motion-contract.md)
- [docs/foundation/overlay-contract.md](../foundation/overlay-contract.md)
- [docs/foundation/picker-contract.md](../foundation/picker-contract.md)
- [docs/foundation/portal-contract.md](../foundation/portal-contract.md)
- [docs/foundation/position-contract.md](../foundation/position-contract.md)
- [docs/foundation/rc-util-contract.md](../foundation/rc-util-contract.md)
- [docs/foundation/test-utils-contract.md](../foundation/test-utils-contract.md)
- [docs/foundation/virtual-list-contract.md](../foundation/virtual-list-contract.md)
- [docs/history/compatibility-2026-10.md](../history/compatibility-2026-10.md)
- [docs/migrations/independence.md](../migrations/independence.md)
- [docs/templates/component-analysis-template.md](../templates/component-analysis-template.md)
- [docs/templates/component-doc-template.md](../templates/component-doc-template.md)
- [package.json](../../package.json)
- [packages/a11y/README.md](../../packages/a11y/README.md)
- [packages/docs/content/guide/getting-started.md](../../packages/docs/content/guide/getting-started.md)
- [packages/docs/content/guide/i18n.md](../../packages/docs/content/guide/i18n.md)
- [packages/docs/content/guide/theming.md](../../packages/docs/content/guide/theming.md)
- [packages/docs/index.html](../../packages/docs/index.html)
- [packages/docs/src/components/site/SiteFooter.vue](../../packages/docs/src/components/site/SiteFooter.vue)
- [packages/docs/src/composables/locale.ts](../../packages/docs/src/composables/locale.ts)
- [packages/docs/src/pages/ComponentPage.vue](../../packages/docs/src/pages/ComponentPage.vue)
- [packages/docs/src/pages/HomePage.vue](../../packages/docs/src/pages/HomePage.vue)
- [packages/docs/src/pages/IconPage.vue](../../packages/docs/src/pages/IconPage.vue)
- [packages/docs/src/types/manifest.ts](../../packages/docs/src/types/manifest.ts)
- [packages/docs/tests/manifest.test.ts](../../packages/docs/tests/manifest.test.ts)
- [packages/docs/tooling/content/build-manifest.d.mts](../../packages/docs/tooling/content/build-manifest.d.mts)
- [packages/docs/tooling/content/build-manifest.mjs](../../packages/docs/tooling/content/build-manifest.mjs)
- [packages/form-core/README.md](../../packages/form-core/README.md)
- [packages/icons/README.md](../../packages/icons/README.md)
- [packages/locale/README.md](../../packages/locale/README.md)
- [packages/motion/README.md](../../packages/motion/README.md)
- [packages/motion/src/driver.ts](../../packages/motion/src/driver.ts)
- [packages/overlay/README.md](../../packages/overlay/README.md)
- [packages/overlay/src/delay.ts](../../packages/overlay/src/delay.ts)
- [packages/picker/README.md](../../packages/picker/README.md)
- [packages/picker/oracle/README.md](../../packages/picker/oracle/README.md)
- [packages/portal/README.md](../../packages/portal/README.md)
- [packages/portal/src/__tests__/portal.test.ts](../../packages/portal/src/__tests__/portal.test.ts)
- [packages/portal/src/portal.ts](../../packages/portal/src/portal.ts)
- [packages/portal/src/use-portal.ts](../../packages/portal/src/use-portal.ts)
- [packages/position/README.md](../../packages/position/README.md)
- [packages/test-utils/README.md](../../packages/test-utils/README.md)
- [packages/theme/README.md](../../packages/theme/README.md)
- [packages/ui/README.md](../../packages/ui/README.md)
- [packages/ui/src/affix/README.md](../../packages/ui/src/affix/README.md)
- [packages/ui/src/alert/PLAN.md](../../packages/ui/src/alert/PLAN.md)
- [packages/ui/src/alert/README.md](../../packages/ui/src/alert/README.md)
- [packages/ui/src/anchor/PLAN.md](../../packages/ui/src/anchor/PLAN.md)
- [packages/ui/src/anchor/README.md](../../packages/ui/src/anchor/README.md)
- [packages/ui/src/app/PLAN.md](../../packages/ui/src/app/PLAN.md)
- [packages/ui/src/app/README.md](../../packages/ui/src/app/README.md)
- [packages/ui/src/auto-complete/PLAN.md](../../packages/ui/src/auto-complete/PLAN.md)
- [packages/ui/src/auto-complete/README.md](../../packages/ui/src/auto-complete/README.md)
- [packages/ui/src/avatar/PLAN.md](../../packages/ui/src/avatar/PLAN.md)
- [packages/ui/src/avatar/README.md](../../packages/ui/src/avatar/README.md)
- [packages/ui/src/back-top/PLAN.md](../../packages/ui/src/back-top/PLAN.md)
- [packages/ui/src/back-top/README.md](../../packages/ui/src/back-top/README.md)
- [packages/ui/src/badge/PLAN.md](../../packages/ui/src/badge/PLAN.md)
- [packages/ui/src/badge/README.md](../../packages/ui/src/badge/README.md)
- [packages/ui/src/border-beam/PLAN.md](../../packages/ui/src/border-beam/PLAN.md)
- [packages/ui/src/border-beam/README.md](../../packages/ui/src/border-beam/README.md)
- [packages/ui/src/breadcrumb/PLAN.md](../../packages/ui/src/breadcrumb/PLAN.md)
- [packages/ui/src/breadcrumb/README.md](../../packages/ui/src/breadcrumb/README.md)
- [packages/ui/src/button/README.md](../../packages/ui/src/button/README.md)
- [packages/ui/src/calendar/PLAN.md](../../packages/ui/src/calendar/PLAN.md)
- [packages/ui/src/calendar/README.md](../../packages/ui/src/calendar/README.md)
- [packages/ui/src/card/PLAN.md](../../packages/ui/src/card/PLAN.md)
- [packages/ui/src/card/README.md](../../packages/ui/src/card/README.md)
- [packages/ui/src/carousel/README.md](../../packages/ui/src/carousel/README.md)
- [packages/ui/src/cascader/README.md](../../packages/ui/src/cascader/README.md)
- [packages/ui/src/checkbox/PLAN.md](../../packages/ui/src/checkbox/PLAN.md)
- [packages/ui/src/checkbox/README.md](../../packages/ui/src/checkbox/README.md)
- [packages/ui/src/collapse/PLAN.md](../../packages/ui/src/collapse/PLAN.md)
- [packages/ui/src/collapse/README.md](../../packages/ui/src/collapse/README.md)
- [packages/ui/src/color-picker/PLAN.md](../../packages/ui/src/color-picker/PLAN.md)
- [packages/ui/src/color-picker/README.md](../../packages/ui/src/color-picker/README.md)
- [packages/ui/src/config-provider/README.md](../../packages/ui/src/config-provider/README.md)
- [packages/ui/src/date-picker/PLAN.md](../../packages/ui/src/date-picker/PLAN.md)
- [packages/ui/src/date-picker/README.md](../../packages/ui/src/date-picker/README.md)
- [packages/ui/src/descriptions/PLAN.md](../../packages/ui/src/descriptions/PLAN.md)
- [packages/ui/src/descriptions/README.md](../../packages/ui/src/descriptions/README.md)
- [packages/ui/src/divider/README.md](../../packages/ui/src/divider/README.md)
- [packages/ui/src/drawer/PLAN.md](../../packages/ui/src/drawer/PLAN.md)
- [packages/ui/src/drawer/README.md](../../packages/ui/src/drawer/README.md)
- [packages/ui/src/dropdown/PLAN.md](../../packages/ui/src/dropdown/PLAN.md)
- [packages/ui/src/dropdown/README.md](../../packages/ui/src/dropdown/README.md)
- [packages/ui/src/empty/README.md](../../packages/ui/src/empty/README.md)
- [packages/ui/src/flex/PLAN.md](../../packages/ui/src/flex/PLAN.md)
- [packages/ui/src/flex/README.md](../../packages/ui/src/flex/README.md)
- [packages/ui/src/float-button/PLAN.md](../../packages/ui/src/float-button/PLAN.md)
- [packages/ui/src/float-button/README.md](../../packages/ui/src/float-button/README.md)
- [packages/ui/src/form/FormItem/ItemHolder.ts](../../packages/ui/src/form/FormItem/ItemHolder.ts)
- [packages/ui/src/form/README.md](../../packages/ui/src/form/README.md)
- [packages/ui/src/form/__tests__/prefix-reactivity.test.ts](../../packages/ui/src/form/__tests__/prefix-reactivity.test.ts)
- [packages/ui/src/grid/PLAN.md](../../packages/ui/src/grid/PLAN.md)
- [packages/ui/src/grid/README.md](../../packages/ui/src/grid/README.md)
- [packages/ui/src/grid/Row.vue](../../packages/ui/src/grid/Row.vue)
- [packages/ui/src/image/PLAN.md](../../packages/ui/src/image/PLAN.md)
- [packages/ui/src/image/README.md](../../packages/ui/src/image/README.md)
- [packages/ui/src/input-number/InputNumber.ts](../../packages/ui/src/input-number/InputNumber.ts)
- [packages/ui/src/input-number/PLAN.md](../../packages/ui/src/input-number/PLAN.md)
- [packages/ui/src/input-number/README.md](../../packages/ui/src/input-number/README.md)
- [packages/ui/src/input/PLAN.md](../../packages/ui/src/input/PLAN.md)
- [packages/ui/src/input/README.md](../../packages/ui/src/input/README.md)
- [packages/ui/src/layout/PLAN.md](../../packages/ui/src/layout/PLAN.md)
- [packages/ui/src/layout/README.md](../../packages/ui/src/layout/README.md)
- [packages/ui/src/list/PLAN.md](../../packages/ui/src/list/PLAN.md)
- [packages/ui/src/list/README.md](../../packages/ui/src/list/README.md)
- [packages/ui/src/listy/PLAN.md](../../packages/ui/src/listy/PLAN.md)
- [packages/ui/src/listy/README.md](../../packages/ui/src/listy/README.md)
- [packages/ui/src/masonry/PLAN.md](../../packages/ui/src/masonry/PLAN.md)
- [packages/ui/src/masonry/README.md](../../packages/ui/src/masonry/README.md)
- [packages/ui/src/masonry/index.en-US.md](../../packages/ui/src/masonry/index.en-US.md)
- [packages/ui/src/masonry/index.zh-CN.md](../../packages/ui/src/masonry/index.zh-CN.md)
- [packages/ui/src/mentions/README.md](../../packages/ui/src/mentions/README.md)
- [packages/ui/src/menu/PLAN.md](../../packages/ui/src/menu/PLAN.md)
- [packages/ui/src/menu/README.md](../../packages/ui/src/menu/README.md)
- [packages/ui/src/message/PLAN.md](../../packages/ui/src/message/PLAN.md)
- [packages/ui/src/message/README.md](../../packages/ui/src/message/README.md)
- [packages/ui/src/modal/PLAN.md](../../packages/ui/src/modal/PLAN.md)
- [packages/ui/src/modal/README.md](../../packages/ui/src/modal/README.md)
- [packages/ui/src/notification/PLAN.md](../../packages/ui/src/notification/PLAN.md)
- [packages/ui/src/notification/README.md](../../packages/ui/src/notification/README.md)
- [packages/ui/src/pagination/PLAN.md](../../packages/ui/src/pagination/PLAN.md)
- [packages/ui/src/pagination/README.md](../../packages/ui/src/pagination/README.md)
- [packages/ui/src/popconfirm/README.md](../../packages/ui/src/popconfirm/README.md)
- [packages/ui/src/popover/PLAN.md](../../packages/ui/src/popover/PLAN.md)
- [packages/ui/src/popover/README.md](../../packages/ui/src/popover/README.md)
- [packages/ui/src/progress/PLAN.md](../../packages/ui/src/progress/PLAN.md)
- [packages/ui/src/progress/README.md](../../packages/ui/src/progress/README.md)
- [packages/ui/src/qr-code/PLAN.md](../../packages/ui/src/qr-code/PLAN.md)
- [packages/ui/src/qr-code/README.md](../../packages/ui/src/qr-code/README.md)
- [packages/ui/src/radio/PLAN.md](../../packages/ui/src/radio/PLAN.md)
- [packages/ui/src/radio/README.md](../../packages/ui/src/radio/README.md)
- [packages/ui/src/rate/PLAN.md](../../packages/ui/src/rate/PLAN.md)
- [packages/ui/src/rate/README.md](../../packages/ui/src/rate/README.md)
- [packages/ui/src/result/PLAN.md](../../packages/ui/src/result/PLAN.md)
- [packages/ui/src/result/README.md](../../packages/ui/src/result/README.md)
- [packages/ui/src/segmented/README.md](../../packages/ui/src/segmented/README.md)
- [packages/ui/src/select/PLAN.md](../../packages/ui/src/select/PLAN.md)
- [packages/ui/src/select/README.md](../../packages/ui/src/select/README.md)
- [packages/ui/src/skeleton/README.md](../../packages/ui/src/skeleton/README.md)
- [packages/ui/src/slider/PLAN.md](../../packages/ui/src/slider/PLAN.md)
- [packages/ui/src/slider/README.md](../../packages/ui/src/slider/README.md)
- [packages/ui/src/space/README.md](../../packages/ui/src/space/README.md)
- [packages/ui/src/spin/README.md](../../packages/ui/src/spin/README.md)
- [packages/ui/src/splitter/PLAN.md](../../packages/ui/src/splitter/PLAN.md)
- [packages/ui/src/splitter/README.md](../../packages/ui/src/splitter/README.md)
- [packages/ui/src/statistic/PLAN.md](../../packages/ui/src/statistic/PLAN.md)
- [packages/ui/src/statistic/README.md](../../packages/ui/src/statistic/README.md)
- [packages/ui/src/steps/PLAN.md](../../packages/ui/src/steps/PLAN.md)
- [packages/ui/src/steps/README.md](../../packages/ui/src/steps/README.md)
- [packages/ui/src/switch/PLAN.md](../../packages/ui/src/switch/PLAN.md)
- [packages/ui/src/switch/README.md](../../packages/ui/src/switch/README.md)
- [packages/ui/src/table/README.md](../../packages/ui/src/table/README.md)
- [packages/ui/src/tabs/PLAN.md](../../packages/ui/src/tabs/PLAN.md)
- [packages/ui/src/tabs/README.md](../../packages/ui/src/tabs/README.md)
- [packages/ui/src/tag/PLAN.md](../../packages/ui/src/tag/PLAN.md)
- [packages/ui/src/tag/README.md](../../packages/ui/src/tag/README.md)
- [packages/ui/src/time-picker/PLAN.md](../../packages/ui/src/time-picker/PLAN.md)
- [packages/ui/src/time-picker/README.md](../../packages/ui/src/time-picker/README.md)
- [packages/ui/src/timeline/PLAN.md](../../packages/ui/src/timeline/PLAN.md)
- [packages/ui/src/timeline/README.md](../../packages/ui/src/timeline/README.md)
- [packages/ui/src/tooltip/PLAN.md](../../packages/ui/src/tooltip/PLAN.md)
- [packages/ui/src/tooltip/README.md](../../packages/ui/src/tooltip/README.md)
- [packages/ui/src/tour/PLAN.md](../../packages/ui/src/tour/PLAN.md)
- [packages/ui/src/tour/README.md](../../packages/ui/src/tour/README.md)
- [packages/ui/src/transfer/README.md](../../packages/ui/src/transfer/README.md)
- [packages/ui/src/tree-select/README.md](../../packages/ui/src/tree-select/README.md)
- [packages/ui/src/tree/PLAN.md](../../packages/ui/src/tree/PLAN.md)
- [packages/ui/src/tree/README.md](../../packages/ui/src/tree/README.md)
- [packages/ui/src/typography/README.md](../../packages/ui/src/typography/README.md)
- [packages/ui/src/upload/PLAN.md](../../packages/ui/src/upload/PLAN.md)
- [packages/ui/src/upload/README.md](../../packages/ui/src/upload/README.md)
- [packages/ui/src/watermark/PLAN.md](../../packages/ui/src/watermark/PLAN.md)
- [packages/ui/src/watermark/README.md](../../packages/ui/src/watermark/README.md)
- [packages/utils/README.md](../../packages/utils/README.md)
- [packages/utils/src/event-name.ts](../../packages/utils/src/event-name.ts)
- [packages/utils/src/hooks/use-update-effect.ts](../../packages/utils/src/hooks/use-update-effect.ts)
- [packages/virtual-list/README.md](../../packages/virtual-list/README.md)
- [pnpm-workspace.yaml](../../pnpm-workspace.yaml)
- [registry/README.md](../../registry/README.md)
- [registry/components.json](../../registry/components.json)
- [registry/dependencies.json](../../registry/dependencies.json)
- [registry/foundation.json](../../registry/foundation.json)
- [registry/schema.json](../../registry/schema.json)
- [registry/source/components.meta.mjs](../../registry/source/components.meta.mjs)
- [registry/source/rc-map.mjs](../../registry/source/rc-map.mjs)
- [registry/tokens.json](../../registry/tokens.json)
- [registry/tools/ask.mjs](../../registry/tools/ask.mjs)
- [registry/tools/foundation-status.mjs](../../registry/tools/foundation-status.mjs)
- [registry/tools/gen-component.mjs](../../registry/tools/gen-component.mjs)
- [registry/tools/gen-registry.mjs](../../registry/tools/gen-registry.mjs)
- [registry/tools/gen-workstreams.mjs](../../registry/tools/gen-workstreams.mjs)
- [registry/tools/next-task.mjs](../../registry/tools/next-task.mjs)
- [registry/tools/validate-registry.mjs](../../registry/tools/validate-registry.mjs)
- [registry/workstreams.json](../../registry/workstreams.json)
- [tests/compat/README.md](../../tests/compat/README.md)
- [tests/tooling/independence.test.mjs](../../tests/tooling/independence.test.mjs)
- [tests/visual/README.md](../../tests/visual/README.md)
- [tests/visual/REFERENCE.md](../../tests/visual/REFERENCE.md)
- [tests/visual/apollo.mjs](../../tests/visual/apollo.mjs)
- [tests/visual/baseline-store.mjs](../../tests/visual/baseline-store.mjs)
- [tests/visual/baselines/apollo/button/type__light__desktop.png](../../tests/visual/baselines/apollo/button/type__light__desktop.png)
- [tests/visual/baselines/apollo/manifest.json](../../tests/visual/baselines/apollo/manifest.json)
- [tests/visual/matrix.mjs](../../tests/visual/matrix.mjs)
- [tests/visual/run.mjs](../../tests/visual/run.mjs)
