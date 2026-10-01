# Breadcrumb 实现说明

> 规则 R1：本文件必须记录（G11 前补齐）。

## 1. 对应 antd 组件

- antd 6.6.4 · `es/breadcrumb/`（只读参照，H2）
- 规模 **805 行源码 / 518 行产物 / 16 文件**；上游测试 **667 行 / 5 文件**
- 复合组件：`Breadcrumb.Item`（`BreadcrumbItem`）/ `Breadcrumb.Separator`（`BreadcrumbSeparator`），
  **两个都已废弃**（上游用 `devUseWarning().deprecated` 告警）

| 上游文件 | 本仓 | 形态 |
|---|---|---|
| `Breadcrumb.tsx`（327） | `Breadcrumb.ts` | `.ts` 渲染函数（见 §3） |
| `BreadcrumbItem.tsx`（122） | `BreadcrumbItem.ts` | `.ts` 渲染函数（见 §3） |
| `BreadcrumbSeparator.tsx`（31） | `BreadcrumbSeparator.ts` | `.ts` 渲染函数（见 §3） |
| `BreadcrumbContext.ts`（12） | `context.ts` | `InjectionKey` + `reactive` 对象 |
| `useItemRender.tsx`（72） | `useItemRender.ts` | `renderItem` + `useItemRender` |
| `useItems.ts`（44） | `useItems.ts` | `computed`（上游是 `useMemo`） |
| `style/index.ts`（177） | `style/index.ts` | `genBreadcrumbStyle` + `genTokenDecls` |

## 2. 与 antd 的行为差异清单

<!-- 同步到 COMPATIBILITY.md §9；分类只能是 BUG / INTENDED / PLATFORM / UPSTREAM（AGENTS.md §4.3） -->

| # | 差异 | 分类 |
|---|---|---|
| 1 | `menu.items` 的 `key` 在本仓被 `String()` 归一（上游是 `React.Key`，本仓 `MenuItemType.key` 是 `string`）。**DOM 等价** —— React 本来就会把数字 key 串化。 | PLATFORM |
| 2 | 上游把 `className` / `style` / `onClick` / `pickAttrs(item)` 一并传给 `InternalBreadcrumbItem`（它**全部忽略**）；本仓**不传** —— 传了会落进 `attrs`，而该组件是**多根**（`li` + 分隔符）⇒ Vue 报 `Extraneous non-props attributes` 并整批丢弃。**有效 DOM 完全相同**。 | PLATFORM |
| 3 | `BreadcrumbSeparator` 的插槽内容归一：Vue 会把 `null` 包成 `[Comment]`、`''` 包成 `[Text('')]`，上游的 `children` 是**原始值** ⇒ 本仓显式还原（只认 `Comment` 为空）。 | PLATFORM |
| 4 | 三条 deprecated / usage 告警在 **render 期**跑（上游是函数组件体，天然等于渲染期）；Vue 的插槽函数不允许在 render 之外调用。 | PLATFORM |
| 5 | 上游的 `hashId` 本仓没有（D2）；`-css-var` 与上游 `useCSSVarCls` 同名（D5）。 | PLATFORM |

## 3. .vue / .tsx 选择

**`Breadcrumb` / `BreadcrumbItem` / `BreadcrumbSeparator` 三个都是 `.ts` 渲染函数**
（`COMPONENT-RULES.md` §2 **条件 2**：「渲染树深度动态、由数据驱动的分支远超模板表达能力」）：

1. **根的孩子是异构的**：`BreadcrumbItem` / `BreadcrumbSeparator` 由 `items` 里的
   `type === 'separator'` 混排，而每一项的**内容**是 `itemRender` 的返回值（`VNodeChild`）。
   模板里渲染一个 `VNodeChild` 只能靠 `<component :is="() => vnode" />` ——
   那会**每次换一个组件类型** ⇒ Vue 走「卸载 + 重挂」（`tour/demo/actions-render.vue`
   的既有陷阱，`anchor/AnchorLink.ts` 的文件头也记了同一条）。
2. **两条互斥的数据通道**（`items` / `children`）要复用同一份 `crumbs`，而 `children`
   分支必须 `cloneVNode` 逐个注入 `separator`。
3. **根可能不渲染 `<li>`**（`link` 为 null 时整项返回 `null`）—— 模板写不出「根是 null」。
4. `BreadcrumbSeparator` 的内容规则里有一条**值判定**（`children === '' ? children : …`），
   模板的 `v-if` 会把 `''` 当 falsy，表达不出「空串原样保留」。

同类先例：`anchor/Anchor.ts` / `anchor/AnchorLink.ts` / `splitter/Splitter.ts`。

## 4. Component Token 清单

<!-- registry 数据：token 数 = 7 -->

**7 个**，**全部是别名派生** ⇒ 落 `var(--apollo-breadcrumb-*)`，随主题自适应、B7 可校验。
另有 **0 个 `mergeToken` 派生**（上游是 `mergeToken(token, {})`，空的 —— 与 anchor 的 4 个形成对比）。

| token | 默认值来源 | 消费点 |
|---|---|---|
| `itemColor` | `colorTextDescription` | `.{p}` 的 `color` |
| `lastItemColor` | `colorText` | `.{p}-item:last-child` |
| `iconFontSize` | `fontSize` | `.{p} .apollo-icon` |
| `linkColor` | `colorTextDescription` | `.{p}-item a` |
| `linkHoverColor` | `colorText` | `.{p}-item a:hover` / `.{p}-overlay-link:hover` |
| `separatorColor` | `colorTextDescription` | `.{p}-separator` |
| `separatorMargin` | `marginXS` | `.{p}-separator` 的 `margin-inline` |

⚠️ 变量名与顺序见 `style/index.ts` 的 `genTokenDecls`；颜色是**构建期解析值**
（如 `rgba(0,0,0,0.45)`），不是 `var(--apollo-color-*)` —— 与 antd 的产物逐字一致。

## 5. 已知缺口

<!-- 未支持的能力 + 落点（范本见 divider/README.md §7） -->

1. **`ConfigProvider` 的 `BreadcrumbConfig` 类型未提升**：上游有
   `BreadcrumbConfig = ComponentStyleConfig & Pick<BreadcrumbProps, 'classNames' | 'styles' |
   'separator' | 'dropdownIcon'>`，本仓走 (B) 通道（`components?: Record<string, ComponentConfigLike>`）
   —— **运行时可用，只是类型宽**。⚠️ `anchor` / `masonry` 也没提升（与最近几轮一致）。
2. **`item.style` 落不到 DOM**（疑似上游 quirk，读码结论，待 G10 的机械 oracle 定论）。
