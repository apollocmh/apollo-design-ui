---
category: 导航
title: Anchor
subtitle: 锚点
---

用于跳转到页面指定位置。

## 何时使用

- 需要展示当前页面结构（目录），并支持点击跳转到对应位置。
- 需要**滚动时自动高亮**当前所在的锚点。

## 代码演示

见 [`demo/`](./demo)（**8 个**，与 antd 的用户可见 demo 对应）。

| demo | 内容 |
|---|---|
| `basic` | 最简单的用法 |
| `horizontal` | 横向 Anchor（ink 是底部横条） |
| `onChange` | 监听锚点链接改变 |
| `onClick` | 点击锚点不记录历史 |
| `replace` | 替换浏览器历史记录中的路径 |
| `targetOffset` | 滚动落点偏移（优先于 `offsetTop`） |
| `targetOffset-per-link` | 每条链接单独的偏移（优先级更高） |
| `customizeHighlight` | 自定义锚点高亮（`getCurrentAnchor`） |

⚠️ 与 antd 的 4 个 demo **未移植**（缺口见 `README.md` §5）：
`static`（差别只在滚动行为 ⇒ 归 L6）· `legacy-anchor`（已由 L4 的 `anchor:children` 覆盖）·
`style-class`（依赖 `antd-style`）· `component-token`（零运行时下 token 是构建期产物）。

## API

### Props

| 参数 | 说明 | 类型 | 默认值 | 全局配置 |
|---|---|---|---|---|
| items | 数据源（推荐）。每项 = 链接字段 + `key` + 可选 `children`（**嵌套**） | `AnchorLinkItemProps[]` | — | × |
| direction | 方向 | `'vertical' \| 'horizontal'` | `'vertical'` | × |
| offsetTop | 容器顶部偏移（同时喂给 `Affix` 与 `maxHeight` 计算） | `number` | — | × |
| bounds | 命中判据的容差 | `number` | `5` | × |
| targetOffset | 滚动落点偏移（**优先于** `offsetTop`） | `number` | — | × |
| affix | 是否固钉。⚠️ 默认**开** | `boolean \| Omit<AffixProps,'offsetTop'\|'target'>` | `true` | × |
| showInkInFixed | 非固钉时是否仍显示指示条 | `boolean` | `false` | × |
| getContainer | 滚动容器。回落到 ConfigProvider 的 `getTargetContainer`，再回落 `window` | `() => HTMLElement \| Window` | — | × |
| getCurrentAnchor | 改写**高亮**（不改 `onChange` 的载荷） | `(activeLink: string) => string` | — | × |
| onChange | 当前锚点变化（滚动或点击） | `(currentActiveLink: string) => void` | — | × |
| onClick | 点击链接。**在滚动之前**调用。⚠️ 这是**自定义签名**的 prop，**不是 DOM 事件** | `(e: MouseEvent, link: { title, href }) => void` | — | × |
| replace | 用 `replaceState` 而不是 `pushState` | `boolean` | — | × |
| classNames | 语义化类名（`root` / `item` / `itemTitle` / `indicator`），支持函数形态 | `AnchorSemanticClassNames \| ((info) => …)` | — | ✅（`anchor.classNames`） |
| styles | 语义化样式（四个槽），支持函数形态 | `AnchorSemanticStyles \| ((info) => …)` | — | ✅（`anchor.styles`） |
| prefixCls | 类名前缀 | `string` | 从 ConfigProvider 取，兜底 `apollo-anchor` | × |
| className | 根元素类名 | `string` | — | × |
| rootClassName | 也落在根元素上 | `string` | — | × |
| style | 根元素内联样式。**会覆盖算出来的 `max-height`** | `CSSProperties` | — | × |

#### AnchorLinkItemProps

| 字段 | 说明 | 类型 |
|---|---|---|
| href | **必填**。内部锚点形如 `#section-1` | `string` |
| title | 显示的文本 | `VNodeChild` |
| key | 唯一标识 | `string \| number` |
| target | `<a target>` | `string` |
| className | 落在 `.{prefixCls}-link` 上 | `string` |
| replace | 单条覆盖 `Anchor` 的 `replace` | `boolean` |
| targetOffset | 单条的滚动偏移（也参与滚动侦测） | `number` |
| children | **嵌套**子项。⚠️ 水平方向不支持 | `AnchorLinkItemProps[]` |

### Events

| 名称 | 说明 | 参数 |
|---|---|---|
| change | 当前锚点变化（与 `onChange` prop 是**同一条通路**） | `(currentActiveLink: string)` |

⚠️ **没有 `click` 事件** —— `onClick` 是自定义签名的 prop（见上表）。
把它声明成组件事件会让模板上的 `@click` **不再挂到根元素**。

### Slots

| 名称 | 说明 |
|---|---|
| default（默认） | 链接内容。对应 antd **已废弃**的 `children`（用 `items` 代替，传了会发废弃告警） |

### 子组件

| 名称 | 说明 |
|---|---|
| `Anchor.Link`（也导出为 `AnchorLink`） | 单条链接。字段同 `AnchorLinkItemProps` 去掉 `key` / `children`（后者的内容走默认插槽） |

## Theme

### Component Token

**2 个**（都是别名派生）：

| token | 默认值 | 用在哪 |
|---|---|---|
| `linkPaddingBlock` | `paddingXXS` | `.{p}-link` 的 `padding-block` |
| `linkPaddingInlineStart` | `padding` | `.{p}-link` 的 `padding-inline-start` |

另有 **4 个 `mergeToken` 派生值**（用户**不可**通过 `theme.components.Anchor` 覆盖）：

| 派生 token | 计算 | 用在哪 |
|---|---|---|
| `holderOffsetBlock` | `paddingXXS` | wrapper 的 `margin-block-start` / `padding-block-start` |
| `anchorPaddingBlockSecondary` | `paddingXXS / 2` | 嵌套层 `.{p}-link` 的 `padding-block` |
| `anchorTitleBlock` | `fontSize / 14 * 3` | `.{p}-link-title` 的 `margin-block-end` |
| `anchorBallSize` | `fontSizeLG / 2` | ⚠️ **本仓与上游都没有消费者**（保留计算只为逐条对齐） |

## 设计说明

- **当前锚点的判据**：逐链接用 `/#([^\t\r\n\f\v]+)$/` 抓 id ⇒ `document.getElementById` ⇒
  `getOffsetTop(target, container)` ⇒ 保留 `top <= (单条 targetOffset ?? 全局 offsetTop) + bounds` 的
  ⇒ 取其中 **`top` 最大**的那个。一个都没有 ⇒ 空串（无高亮）。
- **`getOffsetTop` 的三条分支**：`getClientRects()` 为空 ⇒ `0`；宽高非 0 时按容器基准；
  否则直接 `rect.top`。
- **滚动监听的依赖是 `JSON.stringify(links)`**，且**不含 `getContainer`** ——
  容器 prop 变了**不会重挂**（上游如此，本仓照抄）。
- **动画期间不抢高亮**：`handleScroll` 在滚动动画进行中直接 return；
  再次点击同一个链接时也不重复发 `onChange`。
- **`AnchorLink` 的类名前缀取自 ConfigProvider 的根前缀**，与 `Anchor` 的 `prefixCls` prop **无关**
  （上游如此）。
- **零 ARIA**：语义完全由**原生 `<a href>`** 承担，组件不叠 `role` / `aria-current`。
  这是上游的**有意**设计，已由 L5 钉住。
- **本组件没有 `ref` / `expose`**（上游是 `React.FC`，无 forwardRef）。
