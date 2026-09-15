# @apollo-design/motion

> **层**：L1 ｜ **风险**：high ｜ **Phase 2 实施顺序**：6
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

CSSMotion 等价物：声明式 CSS 过渡/动画控制。替代 @rc-component/motion。

## 替代的 Ant Design 依赖

- `@rc-component/motion`

## 公开 API

- CSSMotion 组件
- MotionProvider / motion 全局开关
- 语义预设：collapseMotion / fadeMotion / slideMotion / zoomMotion / moveMotion
- composable：useMotion()

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

## 依赖约束（ARCHITECTURE.md §3.1）

- **R1 单向**：只能依赖同层或更低层
- **R2 无环**：不得与其他包循环依赖
- **R3 地基纯净**（仅 L0）：不得包含任何组件视觉语义
- **R4 引擎无视觉**（仅 L2）：不得定义颜色/圆角/阴影，不得产出 CSS
- **R6 显式声明**：跨包导入必须在本文件的 `dependencies` 中声明（`.npmrc` 已设 `hoist=false`）

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
L0 包的覆盖率下限为 语句 95% / 分支 90% / 函数 95%。
