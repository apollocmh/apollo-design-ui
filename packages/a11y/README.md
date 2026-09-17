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

> ⚠️ **焦点陷阱实现在 `@apollo-design/utils`（L0）**，本包只再导出 —— 见
> [`docs/foundation/a11y-contract.md`](../../docs/foundation/a11y-contract.md) §1.1。
> 不要为了「名实相符」把 `utils/src/dom/focus.ts` 搬过来：那会让 L0 反向依赖 L1。

### 焦点（陷阱再导出 + 恢复自研）

- `lockFocus` / `useLockFocus` / `getFocusNodeList` / `triggerFocus` / `resetFocusLock` —— 焦点陷阱（**再导出自 utils**）
- `useFocusRestore` —— 关闭后焦点恢复（Modal / Drawer / Image.Preview）

### roving tabindex（Menu / Tabs / Radio.Group / Toolbar）

- `useRovingFocus` —— 组合式：状态 + 方向键 + 真实移动焦点
- `nextRovingIndex` / `moveRovingIndex` / `getRovingTabIndex` / `getRovingOffset` / `resolveRovingHome` / `resolveRovingEnd` —— 纯算术

### combobox（Select / TreeSelect / AutoComplete）

- `useActiveDescendant` + `getListboxId` / `getOptionId` —— `aria-activedescendant` 的 id 方案
- `useTypeahead` + `pushTypeaheadChar` / `findTypeaheadIndex` / `isTypeaheadKey` —— 键盘字符快速定位

### live region（message / notification / upload / transfer）

- `useLiveRegion` —— 组件内播报（挂载时建、卸载时销毁）
- `announce` / `announceValues` —— 模块级单例播报（**复用同一节点**，命令式 API 用）
- `formatLiveRegionText` / `VISUALLY_HIDDEN_STYLE` / `LIVE_REGION_MAX_COUNT` —— 纯格式化与常量

## 明确不做（边界）

- ❌ 不做视觉样式（本包零 CSS；唯一例外是隐藏 live region 的内联样式 —— 它是可达性语义的一部分）
- ❌ 不做 axe 扫描（那是 @apollo-design/test-utils 的 a11yDemoTest）
- ❌ 不重复实现 useId（在 utils）
- ❌ **不重写焦点陷阱**（已在 utils，本包只再导出）
- ❌ 不渲染组件（列表 / 菜单 / 浮层的 DOM 结构属 ui 层）

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
