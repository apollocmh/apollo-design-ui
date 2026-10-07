# @apollo-design/test-utils

> **层**：测试 ｜ **风险**：medium ｜ **Phase 2 实施顺序**：4
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

共享测试契约。复刻 antd 的 tests/shared/ 并新增本项目特有的契约。

## 替代的 Ant Design 依赖

- `antd 的 tests/shared/*`

## 公开 API

- mountTest —— 渲染/更新/卸载不报错，无内存泄漏警告
- demoTest —— 遍历组件全部 demo，渲染无报错无 warning
- a11yDemoTest —— 遍历全部 demo 跑 axe，要求 0 violation
- focusTest —— 焦点获取/丢失/归还
- rtlTest —— 镜像布局无异常
- rootPropsTest —— 根 class / style / prefixCls 契约（注入原生 attrs）
- domContractTest —— 与 React 基线比对结构化 DOM 契约（本项目新增）
- themeTest —— light/dark/compact/token-override 四态渲染（本项目新增）
- resetWarned / waitFrames / flushAll

## 明确不做（边界）

- ❌ 不包含任何具体组件的测试用例

## 必须遵守的契约

- domContractTest 的归一化必须对称（见 tests/compat/README.md §4）
- a11yDemoTest 不允许 disableRules 来通过
- 所有等待必须是确定性的（禁止真实 sleep）

## 依赖

### 运行时依赖

| `@apollo-design/theme` | `workspace:*` |
| `@apollo-design/utils` | `workspace:*` |
| `@vue/test-utils` | `catalog:` |
| `axe-core` | `catalog:` |
| `vitest` | `catalog:` |

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
pnpm --filter @apollo-design/test-utils test
pnpm --filter @apollo-design/test-utils lint
```

测试要求见 [`TESTING.md`](../../TESTING.md)。
覆盖率下限为 语句 95% / 分支 90% / 函数 95%（测试 档位，见 `vitest.config.ts` 的 `coverage.thresholds`）。
