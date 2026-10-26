> 规范范围：本文件保留实现说明与历史对照证据；上游同构、旧阶段与历史 Gate 要求不再生效。现行规则见 [项目规范](../../AGENTS.md)，公共行为以 Apollo 组件 API 文档与测试契约为准。

# @apollo-design/motion

> **层**：L1 ｜ **风险**：high
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

CSSMotion 等价物：声明式 CSS 过渡/动画控制。替代 @rc-component/motion。

## 替代的 Ant Design 依赖

- `@rc-component/motion`

## 公开 API

- CSSMotion、MotionList组件

CSSMotion/useMotionStatus的当前supportMotion和motionName参与状态更新：禁用时取消旧帧、监听、deadline及临时样式，按当前visible完成；关闭后重新启用不会重新创建退场节点。MotionDriverOptions.supportMotion可为boolean或getter，框架无关驱动在操作时读取；Vue层负责响应式监听。Image负责将系统reduced-motion、主题motion=false和零时长接入此已有能力；本次不声明通用MotionProvider已实现。
- useMotionStatus、useNextFrame，以及框架无关createMotionDriver和状态/差异函数
- 折叠几何预设initCollapseMotion及高度计算；fade/zoom等视觉参数由UI消费者提供

旧规划中的MotionProvider、通用全局偏好订阅与useMotion()未导出，不能当成已实现API。本次只验收Image当前配置链路与受影响消费者，不冒充完整motion基础包重新验收。

## 明确不做（边界）

- ❌ 不依赖 portal / trigger
- ❌ 不定义具体组件的动效参数（那是 ui 的职责）

## 必须遵守的契约

- 必须支持 motionAppear / motionEnter / motionLeave / motionDeadline / motionLeaveImmediately
- 必须支持多元素 stagger（如 Collapse 的逐项展开）
- 必须在 prefers-reduced-motion 下自动禁用动画
- 卸载时必须清理所有 timer 与事件监听（有测试断言不泄漏）

## 依赖

### 运行时依赖

| `@apollo-design/utils` | `workspace:*` |

### peer 依赖

| `vue` | `catalog:` |

### 构建期 / 测试依赖（devDependencies，**不会**进入用户的依赖树）

（无）

## 依赖约束（ARCHITECTURE.md §3.1）

- **R1 单向**：只能依赖同层或更低层
- **R2 无环**：不得与其他包循环依赖
- **R3 地基纯净**（仅 L0）：不得包含任何组件视觉语义
- **R4 引擎无视觉**（仅 L2）：不得定义颜色/圆角/阴影，不得产出 CSS
- **R6 显式声明**：跨包导入必须在本文件的 `dependencies` 中声明（`.npmrc` 已设 `hoist=false`）
- **R7 零 Ant Design 运行时依赖**：发布包的 `dependencies` 不得出现任何 `@ant-design/*`。
  Ant Design 生态包只允许出现在三处 —— ① 构建期数据源（`registry/tools/gen-*.mjs`）
  ② 测试 Oracle（`*.oracle.test.ts`）③ `devDependencies`。由 `registry:validate` 的 **E19** 强制。

本包的依赖已通过 `registry/tools/scaffold-packages.mjs` 的分层校验。

## ⚠️ 必须先做 PoC

AR2 —— 必须先做 PoC 验证 collapse/slide/zoom/fade/move 五类语义

在 PoC 通过之前，不得开始依赖本包的组件开发。

## 测试

```bash
pnpm --filter @apollo-design/motion test
pnpm --filter @apollo-design/motion lint
```

测试要求见 [`TESTING.md`](../../TESTING.md)。
覆盖率下限为 语句 95% / 分支 90% / 函数 95%（L1 档位，见 `vitest.config.ts` 的 `coverage.thresholds`）。


SSR hydration 的首次客户端快照复用服务器 DOM；挂载后仍运行 appear。普通新挂载的初始 NONE/null 规则保持不变。覆盖可见、不可见、forceRender 与后续 enter/leave，见 [2026-10-24 验证](../../../docs/audit/2026-10-24-motion-hydration-remediation.md)。
