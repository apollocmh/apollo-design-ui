# @apollo-design/overlay

> **层**：L2 ｜ **风险**：high ｜ **Phase 2 实施顺序**：11
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

锚定浮层的生命周期编排。替代 @rc-component/trigger 的触发时机与生命周期部分。**定位几何在 @apollo-design/position，挂载在 @apollo-design/portal** —— 本包只编排「何时开、何时关、谁在上层」。

## 替代的 Ant Design 依赖

- `@rc-component/trigger（生命周期部分）`

## 公开 API

- useOverlay —— 开合状态机（受控 / 非受控双模式）
- 触发动作：hover / click / focus / contextMenu（与 antd 的 action 语义一致）
- 延迟：mouseEnterDelay / mouseLeaveDelay / focusDelay / blurDelay
- 关闭：外部点击（clickToHide，含 contextMenu）/ Esc / 失焦，及各自的关闭钩子
- 层级：只做 Esc 栈（按开启顺序的 LIFO，仅栈顶响应）；z-index 数值归 portal

> ⚠️ 2026-09-18 修正：此处原写「堆叠：与 portal 的 z-index 协调，后开的浮层在上层」，
> **两处都错**。① z-index 数值由 `portal` 的 `computeZIndex` 负责，本包不做；
> ② antd 的 z-index 是「组件类型偏移 + 嵌套上下文累加」，**不是** LIFO 栈，
> 且最外层浮层根本不设 z-index（靠同一容器内的 DOM 顺序决定层叠）。
> 本包唯一的「栈」是 Esc 栈。依据见
> [`docs/foundation/overlay-contract.md`](../../docs/foundation/overlay-contract.md) §3.13
> 与 [`portal-contract.md`](../../docs/foundation/portal-contract.md) §3.4。
> 模板源已同步修正（`registry/tools/scaffold-packages.mjs` 的 `publicApi`）；
> README 默认不被 scaffold 覆盖，所以这里需要手工保持同步。

## 明确不做（边界）

- ❌ 不实现定位几何（那是 @apollo-design/position）
- ❌ 不实现挂载与容器（那是 @apollo-design/portal）
- ❌ 不实现焦点陷阱本体（@apollo-design/a11y 再导出自 @apollo-design/utils）
- ❌ 不产出任何视觉样式 —— 浮层长什么样是组件层的事

## 必须遵守的契约

- 四种触发动作的开启/关闭时机必须与 antd 逐项一致（含边界：hover 到浮层上时不清空计时）
- 受控（open）与非受控（defaultOpen）语义与 antd 一致
- Esc 关闭必须冒泡到最上层一个浮层，且只关闭它
- 外部点击判定必须排除浮层自身与其 portal 容器内的节点

## 依赖

### 运行时依赖

| `@apollo-design/utils` | `workspace:*` |
| `@apollo-design/portal` | `workspace:*` |
| `@apollo-design/position` | `workspace:*` |
| `@apollo-design/a11y` | `workspace:*` |

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
pnpm --filter @apollo-design/overlay test
pnpm --filter @apollo-design/overlay lint
```

测试要求见 [`TESTING.md`](../../TESTING.md)。
覆盖率下限为 语句 95% / 分支 90% / 函数 95%（L2 档位，见 `vitest.config.ts` 的 `coverage.thresholds`）。
