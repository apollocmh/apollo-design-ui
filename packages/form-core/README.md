# @apollo-design/form-core

> **层**：L2 ｜ **风险**：high ｜ **Phase 2 实施顺序**：12
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

表单状态机 + 字段校验引擎。替代 @rc-component/form 与 @rc-component/async-validator。

## 替代的 Ant Design 依赖

- `@rc-component/form`
- `@rc-component/async-validator`

## 公开 API

- useForm() → [form]
- FormStore：字段注册/注销、依赖联动、异步校验、错误状态管理
- FieldContext / FormContext（供被 Form 包裹的输入组件消费）
- 校验器：内置 rules（required / type / pattern / min / max / len / whitespace / enum / ...）
- 自定义 validator / transform / validateMessages

## 明确不做（边界）

- ❌ 不产出任何 UI（不含 Form.Item 的布局与样式）

## 必须遵守的契约

- validateFields 的 Promise resolve/reject 内容与 antd 一致
- 异步校验必须处理竞态：旧结果不得覆盖新结果
- 字段依赖联动（dependencies / shouldUpdate）语义与 antd 一致
- validateMessages 模板的占位符（${label} / ${min} 等）与 antd 一致
- Form.List 的增删移语义与 antd 一致

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

## Phase 2 范围说明

Phase 2 只需确定接口契约，实现可延后到 Form 开发前

## 测试

```bash
pnpm --filter @apollo-design/form-core test
pnpm --filter @apollo-design/form-core lint
```

测试要求见 [`TESTING.md`](../../TESTING.md)。
覆盖率下限为 语句 95% / 分支 90% / 函数 95%（L2 档位，见 `vitest.config.ts` 的 `coverage.thresholds`）。
