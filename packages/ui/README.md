# @apollo-design/ui

> **层**：L3 ｜ **风险**：high ｜ **Phase 2 实施顺序**：14
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

组件库本体：72 个组件 + locale + 全局样式 + ConfigProvider。

## 替代的 Ant Design 依赖

- `antd（除上述 foundation 包承接的部分）`

## 公开 API

- 72 个组件（见 registry/components.json）
- ConfigProvider —— Token / 主题 / locale / size / disabled / prefixCls 的统一入口
- locale —— 75 个语言包
- 静态方法：message / notification / Modal.confirm
- composable：useApp / useMessage / useNotification / useModal / useForm / useToken / useBreakpoint
- 样式产物：css/base.css / css/components/*.css / css/full.css

## 明确不做（边界）

- ❌ 不重复实现 foundation 包已覆盖的能力（ARCHITECTURE.md R5）
- ❌ 不含任何 React 代码
- ❌ 不含 CSS-in-JS 运行时

## 必须遵守的契约

- 组件间不得互相 import 组件目录；共享 context 与工具必须放在 src/_internal/（见 ARCHITECTURE.md §8.4）
- 组件样式不得硬编码视觉值（validate-registry E10）
- 构建产物不得含 React 痕迹（validate-registry E11）

## 依赖

### 运行时依赖

| `@apollo-design/utils` | `workspace:*` |
| `@apollo-design/theme` | `workspace:*` |
| `@apollo-design/icons` | `workspace:*` |
| `@apollo-design/motion` | `workspace:*` |
| `@apollo-design/portal` | `workspace:*` |
| `@apollo-design/position` | `workspace:*` |
| `@apollo-design/overlay` | `workspace:*` |
| `@apollo-design/a11y` | `workspace:*` |
| `@apollo-design/virtual-list` | `workspace:*` |
| `@apollo-design/form-core` | `workspace:*` |
| `@apollo-design/picker` | `workspace:*` |
| `@apollo-design/locale` | `workspace:*` |
| `dayjs` | `catalog:` |
| `scroll-into-view-if-needed` | `catalog:` |

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
pnpm --filter @apollo-design/ui test
pnpm --filter @apollo-design/ui lint
```

测试要求见 [`TESTING.md`](../../TESTING.md)。
覆盖率下限为 语句 95% / 分支 90% / 函数 95%（L3 档位，见 `vitest.config.ts` 的 `coverage.thresholds`）。
