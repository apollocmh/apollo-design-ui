# Anchor 实现说明

> 规则 R1：本文件必须记录（G11 前补齐）。

## 1. 对应 antd 组件

- antd 6.6.4 · `es/anchor/`（只读参照，H2）
- 契约全文：`docs/analysis/anchor.md`（G1 产物）；Gate 清单：`PLAN.md`
- **依赖面：无缺口**（13 处外部依赖全部可复用，对照表见分析文档 §0）

## 2. 与 antd 的行为差异清单

<!-- 同步到 COMPATIBILITY.md §9；G11 补齐。分类只能是 BUG / INTENDED / PLATFORM / UPSTREAM（AGENTS.md §4.3） -->

| # | 差异 | 分类 |
|---|---|---|
| D1 | 默认前缀 `apollo-anchor`（antd `ant-anchor`） | INTENDED |
| D2 | 无 cssinjs 的 hash 类 | INTENDED |
| D3 | `useCSSVarCls` 无对应 hook ⇒ 手写 `-css-var` | PLATFORM |
| D4 | 上游 `'items' in props` ⇒ 本仓按**值**判（`props.items !== undefined`） | PLATFORM |
| D5 | `useEvent` / `useCallback` ⇒ 不需要（`setup` 只跑一次） | PLATFORM |
| D6 | `getTargetContainer` 的响应式读取（Vue 的 `inject` 是快照） | PLATFORM |
| D7 | 上游 `useEffect([JSON.stringify(links)])` 不含 `getContainer` ⇒ 容器变更不重挂；本仓**照抄** | UPSTREAM |
| D8 | `children` 在 Vue 侧是**默认插槽**（规则 C19），不是 prop | PLATFORM |
| D9 | 同一容器**不重复**挂 scroll 监听（上游每次 remove+add，监听器同一个函数 ⇒ 净效果一致） | PLATFORM |

## 3. `.vue` / `.ts` 选择

**本组件两个文件都用 `.ts` 渲染函数**（`Anchor.ts` / `AnchorLink.ts`）——
依据 `COMPONENT-RULES.md` §2 的**条件 2**（「渲染树深度动态、由数据驱动的分支远超模板表达能力」）
与**条件 1**（纯渲染函数型内部件）：

1. **`Anchor.ts`**：
   - `items` 是**递归**的（`createNestedLink` 逐层展开成 `AnchorLink` 的 children）；
   - **同一份 `anchorContent` 要在 affix / 非 affix 两个分支里复用** ——
     模板里只能靠 `<component :is="vnode">`（不可靠）或复制一份（会漂移）；
   - 类名是**多来源定序合并**（`clsx` 的实参顺序即契约，共 4 个来源）。
2. **`AnchorLink.ts`**：它要渲染一个 **`VNodeChild` prop**（`title`）——
   模板里渲染 vnode 只能写 `<component :is="() => vnode" />`
   （`tour/demo/actions-render.vue` 就是这么写的），但那会**每次渲染换一个组件类型**
   ⇒ Vue 走「卸载 + 重挂」⇒ 焦点与 DOM 状态丢失。加上「children 只在垂直方向渲染」
   这个条件分支，渲染函数更直接。

⚠️ 先例：`splitter/Splitter.ts`（同为 `.ts` 渲染函数组件）。

## 4. Component Token 清单

**2 个**（都是别名派生，落 `var(--apollo-*)`）：

| token | 默认值来源 | 消费点 |
|---|---|---|
| `linkPaddingBlock` | `paddingXXS` | `.{p}-link` 的 `padding-block` |
| `linkPaddingInlineStart` | `padding` | `.{p}-link` 的 `padding-inline-start` |

另有 **4 个 `mergeToken` 派生值**（用户**不可**通过 `theme.components.Anchor` 覆盖）：
`holderOffsetBlock`(=`paddingXXS`) · `anchorPaddingBlockSecondary`(=`paddingXXS/2`) ·
`anchorTitleBlock`(=`fontSize/14*3`) · `anchorBallSize`(=`fontSizeLG/2`，**本仓样式里没有消费者**，上游也没有)。

## 5. 已知缺口

<!-- G11 补齐 -->
