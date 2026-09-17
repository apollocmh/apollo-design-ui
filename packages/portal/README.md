# @apollo-design/portal

> **层**：L1 ｜ **风险**：medium ｜ **Phase 2 实施顺序**：7
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

基于 Vue Teleport 的挂载与层级管理。替代 @rc-component/portal 及 rc-dialog 的挂载部分。

## 替代的 Ant Design 依赖

- `@rc-component/portal`
- `@rc-component/dialog（挂载部分）`

## 公开 API

- Portal 组件（Teleport 封装，支持 SSR 安全延迟挂载）
- 容器管理：getContainer / createContainer / destroyContainer
- 层级：useZIndex / ZIndexContext / getNextZIndex
- ContextIsolator（切断 provider 传递）

## 明确不做（边界）

- ❌ 不实现浮层定位（那是 @apollo-design/position 的职责）
- ❌ 不实现焦点陷阱（实现在 @apollo-design/utils，由 @apollo-design/a11y 再导出）
- ❌ 不实现触发时机与显隐延迟（那是 @apollo-design/overlay 的职责）

## 必须遵守的契约

- SSR 下首屏不挂载，hydration 完成后挂载（避免 hydration mismatch）
- getPopupContainer 的解析优先级与 antd 一致
- z-index 递增规则与 antd 一致（弹窗类与浮层类分开计数）
- 同一容器内多个浮层的堆叠顺序与打开顺序一致

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


## 测试

```bash
pnpm --filter @apollo-design/portal test
pnpm --filter @apollo-design/portal lint
```

测试要求见 [`TESTING.md`](../../TESTING.md)。
覆盖率下限为 语句 95% / 分支 90% / 函数 95%（L1 档位，见 `vitest.config.ts` 的 `coverage.thresholds`）。
