# @apollo-design/virtual-list

> **层**：L1 ｜ **风险**：high ｜ **Phase 2 实施顺序**：8
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

虚拟滚动。替代 @rc-component/virtual-list。

## 替代的 Ant Design 依赖

- `@rc-component/virtual-list`

## 公开 API

- List 组件（虚拟列表）
- composable：useVirtualList() / useHeights() / useScrollTo()
- 定高模式与动态高度模式

## 明确不做（边界）

- ❌ 不含任何视觉语义（行高/间距由消费方传入）

## 必须遵守的契约

- 支持定高与动态高度两种模式
- 支持横向虚拟滚动
- scrollTo(index, align) 的 align 语义（auto/start/center/end）与 antd 一致
- 必须能同时服务 Select（下拉选项）/ Tree（树节点）/ Table（虚拟表格）三种形态

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

## Phase 2 范围说明

Phase 2 只需确定接口契约，实现可延后到 Select 开发前

## 测试

```bash
pnpm --filter @apollo-design/virtual-list test
pnpm --filter @apollo-design/virtual-list lint
```

测试要求见 [`TESTING.md`](../../TESTING.md)。
L0 包的覆盖率下限为 语句 95% / 分支 90% / 函数 95%。
