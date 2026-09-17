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

> ⚠️ 上游（`@rc-component/virtual-list@1.5.1`）把这个组件叫 `List`。
> 改名 `VirtualList` 是为了不与 **antd 的 List 组件**（数据列表，另一个东西）混淆。

### 组件

- `VirtualList` —— 虚拟列表。默认插槽收 `{ item, index, style, offsetX }`，`extra` 插槽收 `ExtraRenderInfo`。
  实例成员：`nativeElement` / `scrollTo` / `getScrollInfo`。

### 纯算法（可在无 DOM 环境下穷举）

- `computeRange` / `shouldUseVirtual` / `isInVirtual` / `sumHeights`
- `keepInRange` / `keepInHorizontalRange`
- `computeScrollTarget` / `normalizeScrollArg` / `resolveScrollOffset`
- `createSizeGetter` / `createCacheMap` / `findListDiffIndex`

### 组合式

- `useHeights()` —— 动态高度收集（微任务合并 + 可作废）

### 模式

- 定高模式与动态高度模式（缺 `itemHeight` 即退化为真实滚动）

## 明确不做（边界）

- ❌ 不含任何视觉语义（行高/间距由消费方传入）
- ❌ **不做自绘滚动条** —— 上游 `ScrollBar` 里写死了 `borderRadius: 99` 与 `rgba(0, 0, 0, 0.5)`，属视觉语义；改用原生滚动
- ❌ **不做滚轮 / 触摸拦截** —— 上游拦截是因为 `overflowY: hidden` 让原生滚动失效，原生滚动不需要
- ❌ 不做 `useScrollTo` / `useVirtualList` 组合式 —— `scrollTo` 的迭代被抽成纯函数 `computeScrollTarget`，Vue 侧循环在组件内

## 必须遵守的契约

- 支持定高与动态高度两种模式
- 支持横向虚拟滚动
- ⚠️ `scrollTo` 的 `align` 只有 **`'top'` / `'bottom'`**（缺省 = auto：只在目标不在视口内时才滚）——
  上游 1.5.1 如此，**没有** `start` / `center` / `end`（`List.d.ts` 的 `ScrollAlign` 只有两个取值）
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
