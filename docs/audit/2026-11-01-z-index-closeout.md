# 2026-11-01 zIndex 修复、冻结验收与版本收口

当前状态：干净冻结提交 `9ea0518035acc46d7036d5f7ae9a3391fcee8ba2` 的统一九维验收全部通过，本轮审计结束。`v0.1.7` 已推送，文档站构建/部署及线上版本核对通过，标签完整 CI 仍在执行。72 个组件、13 个基础包均保留架构成果，25 项历史交付不改写为新的执行记录。

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

- [完整标签 CI 41288847372](https://github.com/apollocmh/apollo-design-ui/actions/runs/41288847372)：已实际触发，精确版本 Chrome 安装通过，完整冻结门禁执行中；未提前记为通过。
- [Docs 41288847399](https://github.com/apollocmh/apollo-design-ui/actions/runs/41288847399)：同一标签提交的构建及 GitHub Pages 部署均成功。
- [线上进度页](https://apollocmh.github.io/apollo-design-ui/guide/audit-progress)：真实 Chrome 核对版本 `v0.1.7`、组件 72/72、基础包 13/13、历史交付 25 和冻结验收 passed；浏览器诊断为空。

后续 GitHub issue 按最新 master / 当前相关源码复核，旧报告仅作线索。已有修复沿用并补缺证，仍存在的缺陷独立整改。`640cde4b` 起的后续修复提交不移动本轮标签，也不冒称每个新提交都重新通过整库九维；关闭 issue 依据对应代码、类型、核心行为与必要浏览器证据。
