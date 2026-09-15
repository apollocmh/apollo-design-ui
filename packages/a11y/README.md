# @apollo-design/a11y

> **层**：L1 ｜ **风险**：medium ｜ **Phase 2 实施顺序**：8
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

运行时无障碍原语。antd 把焦点管理、roving tabindex、live region 等散落在各组件与 rc 包里，本项目把它们收敛为可复用的原语。

## 替代的 Ant Design 依赖

- `antd 内联 a11y 逻辑（本项目新增能力：antd 没有对应的独立包）`

## 公开 API

- useFocusTrap / useFocusRestore —— 焦点陷阱与关闭后焦点恢复（Modal / Drawer / Image.Preview）
- useRovingFocus —— roving tabindex 与方向键导航（Menu / Tabs / Radio.Group / Toolbar）
- useActiveDescendant —— aria-activedescendant 管理（Select / Tree / Listbox 类）
- useLiveRegion / announce —— 屏幕阅读器播报（message / notification / upload / transfer）
- useTypeahead —— 键盘字符快速定位（Select / Tree / Menu）

## 明确不做（边界）

- ❌ 不做视觉样式（本包零 CSS）
- ❌ 不做 axe 扫描（那是 @apollo-design/test-utils 的 a11yDemoTest）
- ❌ 不重复实现 useId（在 utils）

## 必须遵守的契约

- 所有原语必须可在 jsdom 中用键盘事件断言（不需要真实浏览器）
- 焦点恢复必须回到触发元素（Modal/Drawer 关闭后）
- live region 必须复用同一个 DOM 节点，避免播报丢失

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


## 测试

```bash
pnpm --filter @apollo-design/a11y test
pnpm --filter @apollo-design/a11y lint
```

测试要求见 [`TESTING.md`](../../TESTING.md)。
L0 包的覆盖率下限为 语句 95% / 分支 90% / 函数 95%。
