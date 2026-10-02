# List 实现说明

> 规则 R1：本文件记录「仓库文档里没有的」—— 差异、选型理由、Token 落点、已知缺口。

## 1. 对应 antd 组件

- antd 6.6.4 · `es/list/`（只读参照，H2）
- 规模 **678 行产物 / 8 文件**；Component Token **11 个** + **2 个 `mergeToken` 派生**
- 分析产物：`docs/analysis/list.md`（G1，先于实现存在）

| 上游文件 | 本仓 | 形态 |
|---|---|---|
| `index.tsx`（349） | `List.vue` | `.vue` SFC |
| `Item.tsx`（180） | `Item.vue` + `ItemMeta.vue` | `.vue` SFC ×2 |
| `context.ts`（12） | `context.ts` | `InjectionKey` + `provide` / `inject` |
| `style/index.ts`（460） | `style/index.ts` | `genListStyle` + `genTokenDecls`（**57 条**规则） |

**产物交叉验证**（可复现）：

```sh
node tests/visual/debug/extract-list-css.mjs > /tmp/list-antd.css   # 62 条 ant-list 规则
```

本仓产出 **57 条** = 产物 56 条 + 1 条 `-container` 声明块；差掉的 5 条是
`resetComponent` 的 4 条 `box-sizing` 块（`BASE_CSS` 已覆盖）+ 1 条
`.data-ant-cssinjs-cache-path`（cssinjs 的缓存标记，**不是 CSS**）。

## 2. 与 antd 的行为差异清单

<!-- 同步到 COMPATIBILITY.md §9；分类只能是 BUG / INTENDED / PLATFORM / UPSTREAM（AGENTS.md §4.3） -->

| # | 差异 | 分类 |
|---|---|---|
| 1 | `List` / `List.Item` / `Item.Meta` 的 `ref` 统一成 `{ nativeElement }`（可空）。上游 `List` 是 `forwardRef<HTMLDivElement>`（ref 就是 DOM）。 | PLATFORM |
| 2 | 🚨 **`List` 在 antd 6.6.4 里整体 deprecated**（上游发 `console.error`，指向 `Listy`）⇒ 本仓保留同款告警（先例：dropdown 的 `DropdownButton`，D91）。⚠️ 上游写在渲染体里 ⇒ **每次渲染都发**；本仓按 D91 先例放在 `setup` ⇒ **每个实例一次**（dev-only 的提示频率差异，不影响 DOM / 行为）。 | UPSTREAM |
| 3 | `useStyle(prefixCls, rootCls)` 的 `useCSSVarCls` 产物 ⇒ 本仓直接拼 `${prefixCls}-css-var`（无对应 hook，与 card / rate / avatar 同判）。 | PLATFORM |
| 4 | 🚨 **css-var 声明块覆盖两个根**：`.{p}-list` **与** `.{p}-list-container`（上游 `extraCssVarPrefixCls`）⇒ D95 家族（image 两根 / input 三根同判）。⚠️ 今天 `-container` **总是** `.apollo-list` 的后代，变量靠继承已可达 —— 这条规则是**逐字对齐产物** + 防未来形态变化。 | PLATFORM |
| 5 | 🚨 **`-item-no-flex` 的判据换成了 vnode 层判定**：上游是 `toArray(children).some(isString)`，但 Vue 侧**拿不到原始字符串**（模板编译成 `createTextVNode`；本仓 `toArray` 也把原始值归一成 Text vnode）⇒ 本仓用 **`isTextVNode`**。⚠️ 唯一可观测分歧：**数字**子节点（`{{ 0 }}` 被 `toDisplayString` 变成 `'0'`；上游 `isString(0)` 判假、本仓判真）。 | PLATFORM |
| 6 | `devUseWarning` 上游是**三参** `(valid, 'deprecated', msg)`，本仓是**两参** `(valid, message)` ⇒ 把 `'deprecated'` 并进消息（slider / avatar 已踩过同一条）。 | PLATFORM |
| 7 | 🚨 **两条死选择器逐字保留**（UPSTREAM quirk，radio U7/U8 同类）：① `.apollo-list .apollo-list-item .apollo-list-action`（源码写 `${componentCls}-action`，真类名是 `-item-action`）；② `.apollo-list-loading .apollo-list-spin-nested-loading`（真类名是 `.apollo-spin-nested-loading`）。改掉会凭空多出上游没有的视觉差异。 | UPSTREAM |
| 8 | **内容类 prop 保持 `VNodeChild`**（`header` / `footer` / `loadMore` / `extra` / `title` / `description` / `avatar` / `emptyText`），数组类保持 `VNodeChild[]`（`actions`）—— 与 `card`（同组、最接近的先例）一致。⚠️ `COMPATIBILITY.md` **D111** 的字面是「全部改为 slot」，与 card 的落地**不一致**；本组件取「与最近先例一致」这一侧。**这条不一致待统一**。 | PLATFORM |
| 9 | 本仓无 `hashId`（D2）；`-css-var` 与上游 `useCSSVarCls` 同名（D5）。 | PLATFORM |
| 10 | **`ListConfig` 比 card / empty 多一层 `item`**（`list.item.classNames` / `.styles` 是 `Item` 语义化槽的**底座**）—— 与上游一致，**不是**差异。 | — |

## 3. `.vue` / `.tsx` 选择

**`List.vue` / `Item.vue` / `ItemMeta.vue` 都是 `.vue` SFC。**

理由：三者的渲染树形状是静态的（`div` / `ul` / `li` / `h4` 的组合），动态的只是
「渲哪一支」与「类名 / 内联样式」—— 那是 `v-if` / `v-else` 能直接表达的，
不属于 `COMPONENT-RULES.md` §2 的任何一条例外条件。

⚠️ `Item` 的根标签在 **`div`（grid）** 与 **`li`（非 grid）** 之间切换 ⇒ 用
`<Col v-if="grid">` / `<li v-else>` 双分支（`v-if` + `v-else` 在根上是**单根**，
不会退化成 fragment，PITFALLS 302）。

## 4. Component Token 清单

<!-- registry 数据：token 数 = 11 -->

**11 个**，顺序与产物的 css-var 声明块**逐条一致**（`theme.test.ts` 逐键断言）：

| token | 默认值来源 | 解析值 |
|---|---|---|
| `contentWidth` | 字面量 `220` | 220px |
| `itemPadding` | `${paddingContentVertical} 0` | `12px 0` |
| `itemPaddingSM` | `${paddingContentVerticalSM} ${paddingContentHorizontal}` | `8px 16px` |
| `itemPaddingLG` | `${paddingContentVerticalLG} ${paddingContentHorizontalLG}` | `16px 24px` |
| `headerBg` | 字面量 | `transparent` |
| `footerBg` | 字面量 | `transparent` |
| `emptyTextPadding` | `padding` | 16px |
| `metaMarginBottom` | `padding` | 16px |
| `avatarMarginRight` | `padding` | 16px |
| `titleMarginBottom` | `paddingSM` | 12px |
| `descriptionFontSize` | `fontSize` | 14px |

**2 个 `mergeToken` 派生**（用户**不可**覆盖）：
`listBorderedCls` = `${componentCls}-bordered`（**类名字符串**）、
`minHeight` = `controlHeightLG`。

⚠️ **两个必须保留 `calc()` 的派生量**（预计算成字面量会与产物分叉）：
`innerCornerBorderRadius` = `borderRadiusLG - lineWidth`；
`-item-action-split` 的 `height` = `fontHeight - marginXXS * 2`。

## 5. 已知缺口

<!-- 未支持的能力 + 落点（范本见 divider/README.md §7） -->

1. **8 个 antd demo 未移植**（`demo.test.ts` 的 `expectCount: 8` 钉住的是**已落地**的那批）：
   - `component-token`（`theme.components.List` 调试）—— 零运行时架构下 token 是构建期产物，
     已由 `theme.test.ts` 覆盖。**全仓 10+ 组件同判**。
   - `drag-sorting` / `drag-sorting-handler` / `grid-drag-sorting` /
     `grid-drag-sorting-handler`（4 个）—— 依赖 **`dnd-kit`**（非 antd 自带依赖，
     `package.json` 里没有）⇒ 未移植。
   - `infinite-load` —— 依赖 `IntersectionObserver` + 真实网络请求；本仓的滚动/观察类能力
     由 `virtual-list` foundation 覆盖，未单独移植。
   - `virtual-list` —— antd 的这个 demo 用的是 **`Listy`**（`virtual` 模式），
     而 `Listy` 在本仓已作为**独立组件**完成（`listy/`），不重复。
   - `grid-test` —— 上游的内部调试 demo（不在用户文档侧栏）。
2. **`ConfigProvider` 的 `ListConfig` 类型未提升**：上游走 (B) 通道
   （`components?: Record<string, ComponentConfigLike>`）—— **运行时可用，只是类型宽**。
   ⚠️ 与 anchor / masonry / card / avatar 一致。
3. **响应式断点是字面量**（`768px` / `576px`）：CSS 变量在 `@media` 的 media feature 里**非法**
   ⇒ 主题覆盖 alias token 不改变断点（与 back-top / badge 同一条已知边界）。
4. **`COMPATIBILITY.md` §9.2 的双轨漂移**：最近收口的 6 个组件
   （card / masonry / anchor / breadcrumb / date-picker / avatar）的差异都只写在各自的
   `README §2`，未登记进 §9.2（最后一号停在 **D118**）。本组件沿用同一先例；
   若要让 C24 名副其实，需要一次**统一补登记**（跨组件的独立工作）。
5. **`COMPATIBILITY.md` D111 与 card 的落地不一致**（见 §2 第 8 条）。
6. **`NodeRenderer` 的落点**：目前住在 `empty/components/NodeRenderer.ts`（card / button /
   result / avatar / **list** 都这样 import）。它是**平台原语**，应上移到 `ui/src/_internal/`。
   本仓未做这次搬迁（会牵动多个组件的门禁）。

## 6. 本轮实测结果（G4–G10）

| 层 | 命令 | 结果 |
|---|---|---|
| L1/L2 | `vitest run --project unit …/list/__tests__/index.test.ts` | **33/33**（0 Vue 告警） |
| L3 | `--project types …/type.test-d.ts` | **34/34**，`Type Errors no errors` |
| L4 | `--project dom-contract …/semantic.test.ts` | **35/35**（1 类已登记豁免） |
| L5 | `--project a11y …/a11y.test.ts` | **16/16**（axe 9 组 0 violation） |
| L6 | `run.mjs --mode compare --component list` | **33/33 `exact`（0.000%）** |
| L7 | `--project theme …/theme.test.ts` | **16/16** |
| demo | `--project unit …/demo.test.ts` | **10/10**（8 demo + 计数 + 告警豁免自证） |

**本轮抓到的真 bug（4 个）**：

1. 🚨 **`childrenContent` 的赋值顺序错了**（L4 契约抓出，L1 曾放过）：上游是
   `let childrenContent = isLoading && <div style={{minHeight:53}} />`，**随后**被
   `if (splitDataSource.length > 0)` **覆盖** ⇒ **有数据 + `loading` 时渲染的是列表本身**，
   53px 占位块只在「`isLoading` 且数据为空」时才可见。写成「先判 `isLoading` 就 return」
   会让 `loading` + `dataSource` 的形态整个跑偏。已补 L1 回归哨兵。
2. 🚨 **`toArray` 把原始值归一成 Text vnode** ⇒ 上游的 `isString(childNodes[i])` 判据在
   Vue 侧**恒假** ⇒ `-item-no-flex` 永不出现。改用 `isTextVNode`（PITFALLS 306）。
3. ⚠️ **`split` 默认 `true` 必须 `withDefaults`** —— 漏了默认渲染就没有 `-split` 类；
   且 `withDefaults` 是**编译器宏、`import` 会报 TS2440**（PITFALLS 307）。
4. ⚠️ **`h(组件, props, 数组)`** 被 Vue 判成「Non-function value encountered for default slot」
   ⇒ 组件 children 必须写成**显式插槽函数**（PITFALLS 308）。

**一处流程教训**：有两次提交是在 `lint:types` **红的**时候打的（隐式 `any` 与
`renderItem` 的参数逆变）—— 说明「先跑 lint 再 commit」这一步在本轮被执行得不够严。
后续收口统一改为**四道门禁全绿再提交**。
