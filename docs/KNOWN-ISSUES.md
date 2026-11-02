# Apollo Design · 已知问题与支持限制

核对日期：2026-11-03。`v0.1.8` 的冻结源码 `479e5f69` 已通过同一SHA、同一SDK的全部14项九维验收：17449条运行时测试、2409条类型、1875项正式视觉、零待补基线，Docs六组浏览器全部通过（Motion60项、采样无效及未执行均0）。[当前云端证据](audit/evidence/v0.1.8-final-acceptance.json)保留摘要与执行链接；未受后续改动影响的支持边界仍沿用 `31a1eece` 定向证据，不冒充本轮重新验证。以下保留8项支持限制和2项待核实线索。

[v0.1.8 当前收口](audit/2026-11-02-v0.1.8-release.md) · [原冻结收口](audit/2026-11-01-z-index-closeout.md) · [预算校准](audit/2026-11-01-issues-budget-calibration.md) · [唯一状态来源](../registry/vue-native-audit.json) · [原定向复核证据](audit/evidence/known-issues-review-2026-11-01.json) · [清理前全文归档](history/known-issues-2026-11-01.md)

## 支持限制

| 项目 | 当前边界、影响与证据 |
| --- | --- |
| CSS 表达式层级 | `calc()` / `var()` 可保留在根样式中并由浏览器计算，但不自动转成后代数值层级上下文；嵌套 Tooltip 仍可能被父层盖住。已明确延期于 [Portal 契约](foundation/portal-contract.md)。本轮 Tooltip / Popover / Popconfirm 的 9 个表达式边界及显式子层级对照已复核；数值样式修复不扩大这一支持范围。 |
| BackTop 自定义断点 | 右侧偏移固定使用 480 / 768px，修改 Provider 断点不会重定这两个 CSS 阈值；不是 `visibilityHeight` 或共享响应式观察器失效。[样式](../packages/ui/src/back-top/style/index.ts#L90)、[现行 API](../packages/ui/src/back-top/index.zh-CN.md)。20 组真实边界/动态测量及同 Provider 的 Row 正对照确认。 |
| Popover `wireframe` | 当前仍采用已文档化的非线框派生，无独立 `wireframe` 样式分支；不等于现有 Token 无效。[Token 派生](../packages/ui/src/popover/style/token.ts#L43)、[API](../packages/ui/src/popover/index.zh-CN.md)。live / PurePanel 的开关、四个组件 Token、颜色及撤除对照已验证。 |
| 额外源模板检查：Badge | 额外 `strictTemplates: true` 下，[BadgeIndicator.vue](../packages/ui/src/badge/BadgeIndicator.vue#L276) 的 `data-show` 仍有 TS2353。无 Apollo 依赖的原生 `<sup>` 探针同样报错，涉及当前语言工具对 `data-*` 的识别边界；未添加豁免。不能据默认严格 TS / 发布类型通过，声称此额外配置也已通过。 |
| 额外源模板检查：Tag | 同一额外配置下，[CheckableTagGroup.vue](../packages/ui/src/tag/CheckableTagGroup.vue#L87) 的 `aria-label` 仍有 TS2353；[CheckableTag.ts](../packages/ui/src/tag/CheckableTag.ts#L73) 实际将 attrs 合入原生 span，当前证据是组件边界类型诊断，不是已复现的 DOM 标签丢失。四个真实入口及 21 个传递 SFC 检查 exit 2，仅剩这两条诊断；ColorHexInput / PanelPicker 独立额外检查已通过。详见[类型复核](audit/evidence/known-issues-review-2026-11-01.json)。 |
| 自定义前缀 CSS | `prefixCls` 的 DOM 更新不自动生成任意前缀 CSS。消费者须预生成/加载配套静态 CSS；`cssVarPrefix` 同样需要配套样式。[架构约定](../ARCHITECTURE.md)、[配置文档与真实示例](../packages/ui/src/config-provider/index.zh-CN.md)。这不是待裁决的运行时 CSS-in-JS 方案。 |
| F11 静态来源索引 | [当前来源 JSON](audit/evidence/content-slot-inventory.json)已重新生成；[旧快照](history/content-slot-inventory-before-2026-11-01.json)保留。工具只覆盖特定 interface / 同名线索，不能充分覆盖 Slots 类型别名、内联 props 和动态消费；`review` 是候选，`implemented-verified` 是历史字段报告索引，均不是当前缺陷数或剩余任务数。 |
| Docs 资产与示例范围 | 旧冻结 `9ea05180` 构建成功；当时 app 最大 JS chunk 2,404,376 B、cascader 3,849,741 B，仅属构建体积观察，尚无完整首屏网络、CPU 或 LCP 测量。`menu/demo/component-token.md` 缺可选 `order`，当前按名称排序并给出内容警告，非运行失败。debug / 外部服务示例按声明场景判断；详情及原记录见[复核证据](audit/evidence/known-issues-review-2026-11-01.json)。 |

## 待核实

| 线索 | 当前证据与尚缺验证 |
| --- | --- |
| 代码高亮跨初始化差异 | [旧实验](audit/2026-10-24-demo-order-remediation.md)只有跨初始化状态的 token 分段线索；同初始化输出已相等。[当前高亮器](../packages/docs/tooling/content/markdown.mjs#L39)与构建/冒烟通过，均不等于已验证跨进程确定性。尚无当前用户可见错误复现，不先更换高亮器或归为功能缺陷。 |
| List 拖拽示例能力覆盖 | [当前文档](../packages/ui/src/list/index.zh-CN.md#L32)仍明确该示例待审；未承诺 List 内建拖拽排序能力。本轮未做完整示例能力矩阵，不能把历史文件差额或示例待审等同于缺少组件功能。 |

## 历史追溯与验收

macOS15固定原生环境的1875项正式比较已在[当前完整验收41477925031 / attempt 2](https://github.com/apollocmh/apollo-design-ui/actions/runs/41477925031/attempts/2)通过；245张差异图逐项审阅、1630张原基线保留，未降低阈值。旧环境失败事实移入[环境归档](history/known-issues-visual-environment-2026-11-02.md)。此前Motion54/60的阻塞已由统一浏览器入口、有效采样判据及同代码环境对照修复；[#81](https://github.com/apollocmh/apollo-design-ui/issues/81)已验证关闭，原失败与无效试验保留在[v0.1.8收口记录](audit/2026-11-02-v0.1.8-release.md)。[#82](https://github.com/apollocmh/apollo-design-ui/issues/82)的分层执行及定向预检已落地，计时采样另行收尾，不将其写作组件运行时缺陷。

已修复、重复及过期的逐组件阶段记录、旧计数、旧执行顺序和验收等待均迁入[清理前归档](history/known-issues-2026-11-01.md)，原审计报告和验收证据继续保留。F11 的来源文件漂移已刷新；额外模板检查中 ColorHexInput / PanelPicker 的旧诊断已由当前检查证伪，不保留为开放问题。

KI01 数值根样式问题已修复于 `4f5944c2`，包括 Popconfirm 的同根组合链；新产物实际层级、重叠命中、动态撤除及三张真实截图均已核对。[修复前 14 组诊断](audit/evidence/known-issues-review-2026-11-01.json)保留原失败事实，修后证据及冻结整库验收结果见[本轮收口记录](audit/2026-11-01-z-index-closeout.md)。

原两个 ResizeObserver 严格场景本轮各首次复测 exit 0，原生错误和 RO 诊断为空；结果限定于源码浏览器场景，未过滤或重试。历史通知的因果归结仍未知，原失败记录保留在[定向复核证据](audit/evidence/known-issues-review-2026-11-01.json)。

当前验收以 [Registry](../registry/vue-native-audit.json) 与[v0.1.8收口记录](audit/2026-11-02-v0.1.8-release.md)为准；原 `9ea05180` 的验收事实保留在[zIndex历史收口](audit/2026-11-01-z-index-closeout.md)。B6 的旧/新预算及调整依据见[基线校准](audit/2026-11-01-issues-budget-calibration.md)，当前冻结构建已重新通过，未再压缩实现或放宽预算。原批21个GitHub issue的关闭证据及后续主题、按需引入的[独立交付](audit/2026-11-01-theme-and-imports.md)均保留原版本含义。
