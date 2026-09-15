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
- 关闭：外部点击（clickToHide）/ Esc / 失焦，及各自的关闭钩子
- 堆叠：与 portal 的 z-index 协调，后开的浮层在上层

## 明确不做（边界）

- ❌ 不实现定位几何（那是 @apollo-design/position）
- ❌ 不实现挂载与容器（那是 @apollo-design/portal）
- ❌ 不实现焦点陷阱本体（复用 @apollo-design/a11y）
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

## 依赖约束（ARCHITECTURE.md §3.1）

- **R1 单向**：只能依赖同层或更低层
- **R2 无环**：不得与其他包循环依赖
- **R3 地基纯净**（仅 L0）：不得包含任何组件视觉语义
- **R4 引擎无视觉**（仅 L2）：不得定义颜色/圆角/阴影，不得产出 CSS
- **R6 显式声明**：跨包导入必须在本文件的 `dependencies` 中声明（`.npmrc` 已设 `hoist=false`）

本包的依赖已通过 `registry/tools/scaffold-packages.mjs` 的分层校验。


## 测试

```bash
pnpm --filter @apollo-design/overlay test
pnpm --filter @apollo-design/overlay lint
```

测试要求见 [`TESTING.md`](../../TESTING.md)。
L0 包的覆盖率下限为 语句 95% / 分支 90% / 函数 95%。
