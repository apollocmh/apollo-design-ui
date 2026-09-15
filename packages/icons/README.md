# @apollo-design/icons

> **层**：L0 ｜ **风险**：low ｜ **Phase 2 实施顺序**：3
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

Vue 图标组件集。以 @ant-design/icons-svg 为数据源生成，保证与 antd 图标像素一致。

## 替代的 Ant Design 依赖

- `@ant-design/icons`

## 公开 API

- 全部图标组件（PascalCase 命名，与 @ant-design/icons 一致）
- 基础组件：Icon / createIcon
- 工具：setTwoToneColor / getTwoToneColor

## 明确不做（边界）

- ❌ 不手写 SVG path（必须从 @ant-design/icons-svg 生成）

## 必须遵守的契约

- 图标名与 @ant-design/icons 完全一致（Outlined / Filled / TwoTone 三种主题）
- 图标尺寸继承 font-size，颜色继承 currentColor
- TwoTone 图标支持双色定制

## 依赖

### 运行时依赖

| `@ant-design/icons-svg` | `catalog:` |

### peer 依赖

| `vue` | `catalog:` |

## 依赖约束（ARCHITECTURE.md §3.1）

- **R1 单向**：只能依赖同层或更低层
- **R2 无环**：不得与其他包循环依赖
- **R3 地基纯净**（仅 L0）：不得包含任何组件视觉语义
- **R4 引擎无视觉**（仅 L2）：不得定义颜色/圆角/阴影，不得产出 CSS
- **R6 显式声明**：跨包导入必须在本文件的 `dependencies` 中声明（`.npmrc` 已设 `hoist=false`）

本包的依赖已通过 `registry/tools/scaffold-packages.mjs` 的分层校验。

## 构建说明

需要 codegen 脚本：scripts/generate-icons.mjs（读 @ant-design/icons-svg → 输出 Vue 组件）

## 测试

```bash
pnpm --filter @apollo-design/icons test
pnpm --filter @apollo-design/icons lint
```

测试要求见 [`TESTING.md`](../../TESTING.md)。
L0 包的覆盖率下限为 语句 95% / 分支 90% / 函数 95%。
