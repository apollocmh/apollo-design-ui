# Apollo Design · 已知问题与支持限制

核对日期：2026-11-01。以下结论基于 `31a1eece` 源码、同一份已发布形态产物及本次定向复核；不把历史阶段状态、静态候选或构建警告当作当前功能缺陷。

[当前验收与预算校准](audit/2026-11-01-issues-budget-calibration.md) · [唯一状态来源](../registry/vue-native-audit.json) · [本次复核证据](audit/evidence/known-issues-review-2026-11-01.json) · [清理前全文归档](history/known-issues-2026-11-01.md)

## 已确认的问题

### KI01 · 数值根样式层级未同步到嵌套浮层上下文

- **现象**：Tooltip / Popover 的 `styles.root.zIndex = 2500` 已作用于父浮层 DOM，但提供给后代的数值上下文仍为 1170 / 1130；子 Tooltip 为 1270 / 1230，被父内容遮挡，实际命中测试也落到父层。这不只是 `calc()` / `var()` 的支持限制。
- **影响**：通过语义根样式设置较高层级时，嵌套 Tooltip 可能不可见。专用数值 `zIndex` prop、数值组件 Token 及显式子层级对照正常，不是所有浮层或主题层级均失效。
- **源码**：[Tooltip.ts](../packages/ui/src/tooltip/Tooltip.ts#L273) 只以专用 prop 计算上下文；[Popover.ts](../packages/ui/src/popover/Popover.ts#L267) 分别传递数值层级与根样式；[trigger.ts](../packages/ui/src/_internal/trigger.ts#L731) 再由根样式覆盖实际 DOM。
- **证据与状态**：[14 组真实浏览器矩阵](audit/evidence/known-issues-review-2026-11-01.json)及实际截图、`elementFromPoint` 对照确认。诊断程序 exit 0 代表复核执行完毕，**不代表这个场景通过**。本轮未修改组件，缺陷仍开放，不能宣称整库验收完成。

## 支持限制

| 项目 | 当前边界、影响与证据 |
| --- | --- |
| CSS 表达式层级 | `calc()` / `var()` 可保留在根样式中并由浏览器计算，但不自动转成后代数值层级上下文；嵌套 Tooltip 仍可能被父层盖住。已明确延期于 [Portal 契约](foundation/portal-contract.md)，本次表达式与专用数值通道对照重现；不标记已修。与 KI01 的纯数字样式缺陷分开。 |
| BackTop 自定义断点 | 右侧偏移固定使用 480 / 768px，修改 Provider 断点不会重定这两个 CSS 阈值；不是 `visibilityHeight` 或共享响应式观察器失效。[样式](../packages/ui/src/back-top/style/index.ts#L90)、[现行 API](../packages/ui/src/back-top/index.zh-CN.md)。20 组真实边界/动态测量及同 Provider 的 Row 正对照确认。 |
| Popover `wireframe` | 当前仍采用已文档化的非线框派生，无独立 `wireframe` 样式分支；不等于现有 Token 无效。[Token 派生](../packages/ui/src/popover/style/token.ts#L43)、[API](../packages/ui/src/popover/index.zh-CN.md)。live / PurePanel 的开关、四个组件 Token、颜色及撤除对照已验证。 |
| 额外源模板检查：Badge | 额外 `strictTemplates: true` 下，[BadgeIndicator.vue](../packages/ui/src/badge/BadgeIndicator.vue#L276) 的 `data-show` 仍有 TS2353。无 Apollo 依赖的原生 `<sup>` 探针同样报错，涉及当前语言工具对 `data-*` 的识别边界；未添加豁免。不能据默认严格 TS / 发布类型通过，声称此额外配置也已通过。 |
| 额外源模板检查：Tag | 同一额外配置下，[CheckableTagGroup.vue](../packages/ui/src/tag/CheckableTagGroup.vue#L87) 的 `aria-label` 仍有 TS2353；[CheckableTag.ts](../packages/ui/src/tag/CheckableTag.ts#L73) 实际将 attrs 合入原生 span，当前证据是组件边界类型诊断，不是已复现的 DOM 标签丢失。四个真实入口及 21 个传递 SFC 检查 exit 2，仅剩这两条诊断；ColorHexInput / PanelPicker 独立额外检查已通过。详见[类型复核](audit/evidence/known-issues-review-2026-11-01.json)。 |
| 自定义前缀 CSS | `prefixCls` 的 DOM 更新不自动生成任意前缀 CSS。消费者须预生成/加载配套静态 CSS；`cssVarPrefix` 同样需要配套样式。[架构约定](../ARCHITECTURE.md)、[配置文档与真实示例](../packages/ui/src/config-provider/index.zh-CN.md)。这不是待裁决的运行时 CSS-in-JS 方案。 |
| F11 静态来源索引 | [当前来源 JSON](audit/evidence/content-slot-inventory.json)已重新生成；[旧快照](history/content-slot-inventory-before-2026-11-01.json)保留。工具只覆盖特定 interface / 同名线索，不能充分覆盖 Slots 类型别名、内联 props 和动态消费；`review` 是候选，`implemented-verified` 是历史字段报告索引，均不是当前缺陷数或剩余任务数。 |
| Docs 资产与示例范围 | 现有构建成功，但仍有大 chunk：app 2,403,943 B、cascader 3,849,741 B，构建显示 gzip 573.90 / 321.76 kB；这不是完整首屏网络、CPU 或 LCP 测量。`menu/demo/component-token.md` 缺可选 `order`，当前按名称排序并给出内容警告，非运行失败。debug / 外部服务示例不按上游文件数量判缺陷；详情及原记录见[复核证据](audit/evidence/known-issues-review-2026-11-01.json)。 |

## 待核实

| 线索 | 当前证据与尚缺验证 |
| --- | --- |
| ResizeObserver 历史诊断 | 历史 `consumer-z-index-browser.mjs` 功能断言通过，但因 7 条 RO 诊断整体 exit 1；该失败保留。后续 Utils、VirtualList 和 Docs 场景通过不证明原场景已无诊断，本轮未重跑同一严格 `window.error` 场景。[原探针](../packages/ui/src/_internal/__tests__/consumer-z-index-browser.mjs#L61)、[证据](audit/evidence/known-issues-review-2026-11-01.json)。需按原场景定位实际 observer / target / 循环，再决定是否为当前问题；不先加节流或吞错。 |
| 代码高亮跨初始化差异 | [旧实验](audit/2026-10-24-demo-order-remediation.md)只有跨初始化状态的 token 分段线索；同初始化输出已相等。[当前高亮器](../packages/docs/tooling/content/markdown.mjs#L39)与构建/冒烟通过，均不等于已验证跨进程确定性。尚无当前用户可见错误复现，不先更换高亮器或归为功能缺陷。 |
| List 拖拽示例能力覆盖 | [当前文档](../packages/ui/src/list/index.zh-CN.md#L32)仍明确该示例待审；未承诺 List 内建拖拽排序能力。本轮未做完整示例能力矩阵，不能把历史文件差额或示例待审等同于缺少组件功能。 |

## 历史追溯与验收

已修复、重复及过期的逐组件阶段记录、旧计数、旧执行顺序和验收等待均迁入[清理前归档](history/known-issues-2026-11-01.md)，原审计报告和验收证据继续保留。F11 的来源文件漂移已刷新；额外模板检查中 ColorHexInput / PanelPicker 的旧诊断已由当前检查证伪，不保留为开放问题。

最新运行结果、来源提交、跨提交复用依据及 B6 校准前后数据统一见[本轮验收记录](audit/2026-11-01-issues-budget-calibration.md)和 [Registry](../registry/vue-native-audit.json)。预算校准不是体积优化；也不能代替 KI01 修复或把待核实项写成通过。
