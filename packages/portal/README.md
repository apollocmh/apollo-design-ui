# @apollo-design/portal

> **层**：L1 ｜ **风险**：medium ｜ **Phase 2 实施顺序**：7
>
> 本文档声明本包的**职责边界**。边界之外的事情不做 —— 如果发现需要做，说明架构需要调整，
> 应当先修改 `ARCHITECTURE.md` 并记录 ADR。

---

## 职责

基于 Vue Teleport 的挂载与层级管理。替代 @rc-component/portal 及 rc-dialog 的挂载部分。

## 替代的 Ant Design 依赖

- `@rc-component/portal`
- `@rc-component/dialog（挂载部分）`

> 完整契约见 [`docs/foundation/portal-contract.md`](../../docs/foundation/portal-contract.md)。
> 本文件只列边界与入口。

## 公开 API

**纯数据侧**（可穷举测试，无副作用）
- `resolveContainer(getContainer, doc?)` —— 四态解析：`false` / 元素 / `null`（解析过但没有）/ `undefined`（未就绪）
- `computeZIndex({ componentType, customZIndex, parentZIndex, zIndexPopupBase })`
- `shouldWarnZIndex` / `isContainerType` / `enqueueAppend` / `flushAppendQueue`
- 常量：`CONTAINER_OFFSET` 等 4 个偏移常量、`DEFAULT_Z_INDEX_POPUP_BASE`、两张 offset 表

**Vue 层**
- `Portal` 组件 —— `<Teleport>` 封装，SSR 安全延迟挂载
- `usePortalContainer({ open, autoDestroy, getContainer, debug, doc })` —— 容器解析 + 默认容器创建/复用/卸载 + 嵌套入队
- `usePortalOrder()` —— 子孙取用祖先的 enqueue
- `useZIndex(componentType, customZIndex?, options?)`
- `portalInlineMock` / `resetPortalInlineMock` —— 测试用的全局内联开关

⚠️ `getContainer` 是**两层**形态（getter + spec 本体），原因见契约文档 §6.1。
⚠️ 本包**不依赖 `theme`** —— `zIndexPopupBase` 由调用方传入。

## 明确不做（边界）

- ❌ 不实现浮层定位（那是 `@apollo-design/position` 的职责）
- ❌ 不实现焦点陷阱 / 焦点恢复（那是 `@apollo-design/a11y` 的职责）
- ❌ 不实现触发时机与显隐延迟（那是 `@apollo-design/overlay` 的职责）
- ❌ 不实现滚动锁定与 Esc（rc-portal 有，但按 Modal 的 rationale 属 ui 交互语义）

## 必须遵守的契约

- SSR 下不建任何容器（`canUseDom()` 为假 ⇒ 一个 `div` 都不许有）
- `getPopupContainer` 的解析优先级与 antd 一致（四态，**不能**把 `undefined` 归一成 `null`）
- z-index 计算与 antd 一致：顶层浮层**不设** z-index（靠 DOM 顺序堆叠），只有嵌套才拿数值
- 嵌套 Portal 的容器顺序为「父先子后」；祖先已入 DOM 后出现的子孙立即 append

⚠️ 一处照抄 antd 的噪音行为：`innerContainer === false` 时仍会 append 一个**空**默认容器。
别顺手优化 —— 改掉就是与上游的可观察 DOM 差异（契约文档 §6.2）。

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
pnpm --filter @apollo-design/portal test
pnpm --filter @apollo-design/portal lint
```

测试要求见 [`TESTING.md`](../../TESTING.md)。
L0 包的覆盖率下限为 语句 95% / 分支 90% / 函数 95%。
