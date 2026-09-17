# @apollo-design/picker

> **层**：L2 ｜ **风险**：high ｜ **Phase 2 实施顺序**：13
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

日期/时间面板引擎。替代 @rc-component/picker。

## 替代的 Ant Design 依赖

- `@rc-component/picker`

## 公开 API

- Picker 基础组件（面板渲染 + 选择状态机）
- 面板：DatePanel / WeekPanel / MonthPanel / QuarterPanel / YearPanel / TimePanel
- RangePicker 状态机
- locale 适配层（与 @apollo-design/ui/locale 对接）

## 明确不做（边界）

- ❌ 不实现输入框（那是 ui 的 DatePicker 与 Input）
- ❌ 不重新实现日期数学（复用 dayjs）

## 必须遵守的契约

- 面板切换（日/周/月/季/年）的交互与 antd 一致
- 区间选择的边界行为（起止互换、hover 预览、二次点击）与 antd 一致
- 键盘导航（方向键 / PageUp / PageDown / Home / End）与 antd 一致
- disabledDate / disabledTime / showTime 的语义与 antd 一致

## 依赖

### 运行时依赖

| `@apollo-design/utils` | `workspace:*` |

### peer 依赖

| `vue` | `catalog:` |
| `dayjs` | `catalog:` |

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

Phase 2 只需确定接口契约，实现可延后到 DatePicker 开发前

## 测试

```bash
pnpm --filter @apollo-design/picker test
pnpm --filter @apollo-design/picker lint
```

测试要求见 [`TESTING.md`](../../TESTING.md)。
覆盖率下限为 语句 95% / 分支 90% / 函数 95%（L2 档位，见 `vitest.config.ts` 的 `coverage.thresholds`）。
