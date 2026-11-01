# 2026-11-01 zIndex 修复、冻结验收与版本收口

当前状态：干净冻结提交 `9ea0518035acc46d7036d5f7ae9a3391fcee8ba2` 的本地统一九维验收全部通过，架构整改及本地验收收口。`v0.1.7` 已推送，文档站构建/部署及线上版本核对通过；标签 CI 超时取消，独立分支的后两次复验分别因主题测试超时和静态索引遗漏失败，修正后的复验进行中，远端验收尚未通过。72 个组件、13 个基础包均保留架构成果，25 项历史交付不改写为新的执行记录。

[本轮机器记录](evidence/z-index-closeout-2026-11-01.json) · [唯一台账](../../registry/vue-native-audit.json) · [当前支持限制和待核实项](../KNOWN-ISSUES.md)

## 范围与根因

本轮解决 KI01：Tooltip / Popover 的数值根样式覆盖实际 DOM 后，后代仍继承旧数值上下文。Popconfirm 使用同一组合链，一并回归；保留既有 72 个组件、13 个基础包的架构成果和 25 项历史完整交付，不重新审计。

Tooltip 将既有原生 `style` 明确为响应式 Vue `StyleValue`，最终归一化结果同时用于浮层样式与 `useZIndex`。覆盖 Provider、语义样式、别名和原生样式的实际优先级；数字字符串、`0`、动态替换、对象删键、条件撤除及多实例保持一致。空的条件层级释放样式覆盖，使显式 prop 或父层级继续生效。Popover / Popconfirm 保留现有组合职责。

`calc()` / `var()` 自动转换为后代数值层级仍是已文档化的支持限制。浏览器检查将支持场景和延期边界分开记录；保留显式子层级的可用对照。

## 定向验证与最终门禁

- 新增回归在旧实现上 6 项失败；修后 19 项关键回归通过。
- Tooltip / Popover / Popconfirm 的 unit、DOM、theme 共 26 文件、406 项通过，实际 exit 0。
- 同一冻结提交的真实产物浏览器 24 组及 Demo 动态切换通过：15 个支持场景、9 个表达式边界；正常时钟下核对实际层级、上下文与重叠位置命中，原生错误诊断为空。三张新产物截图已逐张审阅，子 Tooltip 位于父内容之上。
- `node scripts/verify-full.mjs --report ...` 从干净的 `9ea05180` 统一构建全部 15 包；L7 151 项、0 FAIL / 0 PENDING，B6 全部 73 入口通过。沿用已校准预算，没有再次调整阈值或声称体积优化。
- 根严格类型、2395 条公开类型、787 文件 / 17354 条运行时回归及原覆盖率门禁通过。覆盖率为语句 92.06%、分支 83.84%、函数 91.82%、行 93.03%；真实 13 包 tarball 的 Vite / Webpack 消费者通过。
- 完整视觉 1875 / 1875 通过，缺失基线 0，全部逐像素一致；没有接受新基线。文档类型、15 文件 / 161 项测试及六组原浏览器检查全部通过。

完整编排共 13 项检查，全部实际 exit 0 / signal null，2026-11-01 14:40:41–16:22:11（UTC+8），耗时 101.5 分钟。源码与工作区前后均冻结，产物 SHA-256 为 `c1ba25212290b661d3e932c55e5dec899b52f143d018883c60600d0b5da86c2d`，所有消费者读取同一份产物。

三张已审阅截图：[Tooltip](evidence/z-index-closeout-2026-11-01/Tooltip-semantic-number.png)、[Popover](evidence/z-index-closeout-2026-11-01/Popover-semantic-number.png)、[Popconfirm](evidence/z-index-closeout-2026-11-01/Popconfirm-semantic-number.png)。这是新回归的实际结果，不是替换已有视觉基线。

之前的验收与失败证据保留在 [已知问题与预算校准记录](2026-11-01-issues-budget-calibration.md)、[复核证据](evidence/known-issues-review-2026-11-01.json)和[修复前状态](https://github.com/apollocmh/apollo-design-ui/blob/604df23b4f9f9ee8e84d4185800490de6a3b1cc4/registry/vue-native-audit.json)。新运行不会将旧结果冒充本次重新执行。

## 发布验证的必要修正

沿用 `v0.1.x` 开发检查点的补丁递增，本轮目标为 `v0.1.7`，工作区版本同步为 `0.1.7`；不执行 npm 发布。消费者从实际包版本生成本轮 tarball 路径，不再写死 `0.0.0`。文档浏览器输出写入独立临时目录，读取同一源码和产物，保留失败证据并关闭 preview；不覆盖历史报告或放宽冻结检查。

两处均有真实失败到通过的定向回归。原始 F11 归档保持字节不变，沿用历史 JSON 的格式器例外；当前源码仍执行完整格式检查。静态索引仅更新当前源码位置。

完整视觉基线记录为 `darwin/x64/150.0.7871.125/系统 Chrome`，原最终 CI 却选择 Ubuntu。发布验收改用官方提供的 [`macos-15-intel`](https://github.com/actions/runner-images/blob/main/README.md)，下载并实际启动同版本的官方 Chrome for Testing；启动器显式传入可执行文件，真实 `browser.version()` 与既有环境守卫继续校验，未改写环境记录。无效显式路径直接报错，不退回其他浏览器。统一临时目录供 artifact 保存；PR 反馈及文档部署继续使用原 Linux 作业。

CI 预检的真实失败及修正保留：首轮 job 层使用 `runner.temp` 不合法，改为 step 环境；随后全新 checkout 的 CLI `--help` 发现 Empty / Result / Skeleton 提前依赖未构建 theme 产物，改为实际渲染时加载，未修改 Token 或断言。远端架构检查 [41283436016](https://github.com/apollocmh/apollo-design-ui/actions/runs/41283436016) 已成功。未固定浏览器版本的手动验收预检 `41283781841` 主动取消，不算通过；正式标签仍需触发独立验收。

CI 修正的定向验证为 58 项 tooling 和固定官方 Chrome 的 Empty / Result / Skeleton 共 123 项原视觉用例全部通过，123 项均为逐像素一致。该运行只读取冻结产物，没有重建包或更改任何 PNG 基线、比较器与阈值。

`9ea05180` 后的 CI 修正没有改变发布源码、包清单/依赖、编译或 Vitest 配置、CSS、矩阵和批准 PNG；真实启动路径与三个延迟导入由上述增量检查覆盖。其余范围沿用冻结运行，最终标签 CI 将在最终提交重新执行完整门禁。台账记录的本地验收来源仍为 `9ea05180`，不把跨提交复用写成整库重新执行。

首轮冻结 `a16259cd` 的构建及新产物浏览器通过，随后根严格类型因测试中的 `ref<StyleValue>` 递归解包而 exit 2；失败报告保留。仅把两个整值替换容器改为 `shallowRef`，保留独立 reactive 对象删键及全部 19 项断言；完整根严格类型已 exit 0，随后在新的干净冻结提交 `9ea05180` 重启统一门禁。

原 consumer-z-index / Cascader 两个严格源码浏览器场景各首次复测 exit 0，`window.error` 与 RO 诊断为空，无过滤、重试或节流兜底。该结果仅说明原场景当前未复现，不归结历史通知的永久消除；源码场景不冒充发布产物验证。

## 标签与远端结果

注解标签 [`v0.1.7`](https://github.com/apollocmh/apollo-design-ui/releases/tag/v0.1.7) 指向 `35b1ff589cfa8b8fccc50cb653a316ba1cefb035`，标签对象为 `e30ca7f921a5bc23cb3a1c3f91f31618cddd24a8`。推送前确认本地/远端均不存在此名；推送后确认原 7 个版本标签的 14 个 refs 全部保留，未覆盖标签、未发布 npm。

- [完整标签 CI 41288847372](https://github.com/apollocmh/apollo-design-ui/actions/runs/41288847372)：结论为 cancelled，平台注解为作业超过 `2h0m0s`。已执行至完整视觉阶段，但没有完整视觉结果，不算通过。
- [同发布源码复验 41300894803](https://github.com/apollocmh/apollo-design-ui/actions/runs/41300894803)：独立分支 `ci/v0.1.7-time-budget-20261101` 的 `9c1324370e26360a895245b3f6388843620d98c4` 仅将 CI 作业总时限从 120 分钟调整为 180 分钟；与标签的唯一差异为 `.github/workflows/ci.yml`，发布源码、依赖、测试、基线和断言不变。结论 failure：覆盖率执行中的 Popconfirm 一项及 Space compact-debug 四种主题均超过默认 5000ms，实测 6.395–6.958 秒，17349 项通过、5 项超时。本次尚未执行 tarball 和完整视觉，不算通过；正在定向排查，不移动标签或删减场景。
- [五项实测耗时修正后的复验 41307766529](https://github.com/apollocmh/apollo-design-ui/actions/runs/41307766529)：`27e50539` 仅再为上述五项设置 10 秒预算，其余用例仍为默认 5 秒，所有断言、四主题和连续迁移保留。定向覆盖率实跑也观察到 6.414 / 5.649 秒，支持此预算；局部命令仍因原整包覆盖率门槛 exit 1，不冒称覆盖率验收通过。共享测试工具 42 项回归通过。本次远端结论 failure：修改测试工具后遗漏刷新静态行数索引（2965→2967），Registry 检查拒绝，未执行后续验收。
- [静态索引修正后的复验 41313575629](https://github.com/apollocmh/apollo-design-ui/actions/runs/41313575629)：`fb2eaa2b` 补齐上述事实索引，本地 Registry 与格式检查退出 0，远端完整验收进行中；发布源码、依赖、CSS、PNG 与原标签一致。旧运行仍保留原失败结论。
- [Docs 41288847399](https://github.com/apollocmh/apollo-design-ui/actions/runs/41288847399)：同一标签提交的构建及 GitHub Pages 部署均成功。
- [线上进度页](https://apollocmh.github.io/apollo-design-ui/guide/audit-progress)：真实 Chrome 核对版本 `v0.1.7`、组件 72/72、基础包 13/13、历史交付 25 和冻结验收 passed；浏览器诊断为空。

后续 GitHub issue 按最新 master / 当前相关源码复核，旧报告仅作线索。已有修复沿用并补缺证，仍存在的缺陷独立整改。`640cde4b` 起的后续修复提交不移动本轮标签，也不冒称每个新提交都重新通过整库九维；关闭 issue 依据对应代码、类型、核心行为与必要浏览器证据。

## 后续 issue 定向交付

以下是推送至 `cdc9e2a4` 时已经验证并关闭的问题；每项的 GitHub 评论保留具体检查结果。既有修复没有重写或冒充新实现。

| Issue | 当前确认与交付提交 | 验证范围 |
| --- | --- | --- |
| [#71](https://github.com/apollocmh/apollo-design-ui/issues/71) | `640cde4b`：Trigger 使用实际翻转 points | 旧代码失败回归、定位核心、Tour 真实浏览器 |
| [#72](https://github.com/apollocmh/apollo-design-ui/issues/72) | `b9c24de4`：Affix 跟踪外层滚动并释放监听 | Affix / Anchor 核心、真实滚动与重绑定 |
| [#67](https://github.com/apollocmh/apollo-design-ui/issues/67)、[#69](https://github.com/apollocmh/apollo-design-ui/issues/69) | `125a6d5d`：保留零高度，补全合并单元格 Demo | 核心、公开类型、实际构建产物几何与滚动 |
| [#77](https://github.com/apollocmh/apollo-design-ui/issues/77) | 沿用 `505c94f63`；`df7ba4c2` 补 Form→AutoComplete 回归 | 显式覆盖、撤除继承、在线明暗主题键盘交互 |
| [#63](https://github.com/apollocmh/apollo-design-ui/issues/63)、[#75](https://github.com/apollocmh/apollo-design-ui/issues/75) | 沿用 `a34c8d4b`、`b61eadd5` | Mentions 清除按钮/SVG 和 Progress 0%/50% 的明暗切换 |
| [#65](https://github.com/apollocmh/apollo-design-ui/issues/65) | 沿用 `8b262e5a` | 日期/时间选择器核心、在线实际 SVG 与明暗主题 |
| [#62](https://github.com/apollocmh/apollo-design-ui/issues/62)、[#74](https://github.com/apollocmh/apollo-design-ui/issues/74) | 沿用 `55cd46b6`、`88850e41`；`e1af1941` 补 Modal 回归 | Dropdown / Modal 浏览器、根样式与事件唯一归属 |
| [#68](https://github.com/apollocmh/apollo-design-ui/issues/68) | `e7360eb4`：Masonry Demo 的有效 CSS 长度 | 核心、SFC 类型、明暗几何与容器边界 |
| [#60](https://github.com/apollocmh/apollo-design-ui/issues/60)、[#61](https://github.com/apollocmh/apollo-design-ui/issues/61) | `aa0907af`：Demo 配色和 Tag 分组间距 | 相关核心、30 个 SFC 类型、实际动态主题/窄屏/交互 |
| [#66](https://github.com/apollocmh/apollo-design-ui/issues/66) | `9821c870`：跨日期色条的专用溢出层及周边界 | 核心、三种周首日与 RTL、连续命中、保留普通列表滚动 |
| [#70](https://github.com/apollocmh/apollo-design-ui/issues/70)、[#73](https://github.com/apollocmh/apollo-design-ui/issues/73) | `97e0d1ca`、`17da40cd`：原子初始滚动、独立预览视口 | 实际 DocsPreview→Frame、独立页面、内容构建和元数据 |
| [#78](https://github.com/apollocmh/apollo-design-ui/issues/78) | `cdc9e2a4`：可验证的 Drawer 表单与资料 | 核心、类型、明暗主题、375px、反复开关 |

集成后的 `vue-tsc --noEmit -p tsconfig.json` 实际 exit 0；变更文件与子任务冻结的证据哈希相符。已审阅各项最终实际截图，不修改视觉基线。此次只运行相关范围，未宣称这些后续提交重新通过完整九维。

#58 / #59 已补验评论新增的整控件禁用 Select、Cascader underlined、原始 ModalForm 及 Provider 内 useModal confirm；真实构建产物 light→dark→light、交互及尺寸检查通过，原生/console 错误为空，暗色截图已审阅。两项现已验证关闭，没有重复改写已修好的实现。

#79 Resolver、#80 主题预设及文档站联动已验证并关闭，核心提交 `80d1d174`、`04d6c063`、`9b038818`，详见 [独立交付及验证范围](2026-11-01-theme-and-imports.md)。本批 21 个 issue 均已关闭，随后查询开放 issue 为 0。后续开发版本为 `0.1.8`，未创建新标签，不冒称其重新通过整库九维或已部署。

标签 CI 复验单独跟进。旧取消运行的实际截图已查看并按原比较阈值复核，确认有约 15px 的经典滚动槽差额及部分文字/Canvas 差异；批准机器使用自动叠加滚动条和中文区域设置。云端具体字体及原生偏好仍需实测，尚不能把所有差异归因于字体。当前不接受新截图、不降低视觉标准，用少量代表案例做原生环境对照。

短对照运行 [41322884353](https://github.com/apollocmh/apollo-design-ui/actions/runs/41322884353) 对应独立临时分支 `ci/v017-visual-environment` 的 `1c2b726a`，实际耗时 8 分 41 秒，结论 failure。六个既有用例依次核对原生配置、叠加滚动条、中文语言/区域，分别 0/6、4/6、4/6 通过；各阶段只读同一构建产物。`WhenScrolling` 确实消除 15px 尺寸差，已将该原生设置纳入后续完整 CI。仍失败的 Affix 与 Watermark 保留 FAIL；区域设置不能消除全部文字差异，不能将其冒称为六例全通过。原始截图、差异和探针保存在该 run artifact，紧凑结果见[环境对照证据](evidence/visual-environment-2026-11-01.json)。没有改组件 CSS、字体、基线或阈值，也没有重跑已知仍会失败的完整流程。
