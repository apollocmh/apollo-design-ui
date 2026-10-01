# Anchor · G1 分析产物

> 契约来源：antd 6.6.4 `/tmp/antd-repo/ant-design-master/components/anchor/`（源码）
> 与 `/tmp/antd-src/package/es/anchor/`（构建产物）。
> 规模 **803 行源码 / 526 行产物 / 10 文件**：
> `Anchor.tsx` 453 + `AnchorLink.tsx` 122 + `index.tsx` 17 + `context.ts` 7 + `style/index.ts` 204。
> Component Token **2 个**（`linkPaddingBlock` / `linkPaddingInlineStart`）+ **4 个 `mergeToken` 派生**。
> **先于实现存在**（`AGENTS.md` §2 步骤 3）。

## 0. 依赖面核查（**结论：无缺口，全部可复用**）

| antd 用的 | 本仓对应物 | 备注 |
|---|---|---|
| `scroll-into-view-if-needed`（npm） | **同名依赖已在 `packages/ui/package.json`** | `form/hooks/use-form.ts` 已用（`scrollToField`）⇒ 零新增依赖 |
| `@rc-component/util` 的 `useEvent` | **不需要** | Vue 的 `setup` 只跑一次 ⇒ 函数身份天然稳定 |
| `_util/getScroll` | `@apollo-design/utils` 的 `getScroll` | `back-top` 已用 |
| `_util/scrollTo`（含 `easeInOutCubic`） | `ui/src/_internal/scroll-to.ts` | `back-top` 抽出来的；签名 `scrollTo(y, options) => () => void`（返回取消函数，与上游一致） |
| `_util/warning` 的 `devUseWarning` | `@apollo-design/utils` 的 `useDevWarning` | |
| `_util/is` 的 `isFunction` / `isNumber` / `isPlainObject` | 同名，均在 `@apollo-design/utils` | |
| `Affix` | `ui/src/affix` | **已 completed**；`Anchor` 是它的第一个消费者 |
| `config-provider/context` 的 `useComponentConfig('anchor')` | ✓ | |
| `ConfigContext` 的 **`getTargetContainer`** | ✓（`ConfigContextValue` 里有） | `getContainer ?? getTargetContainer ?? window` 的三级兜底 |
| `useCSSVarCls(prefixCls)` | **无对应 hook** —— 直接拼 `${prefixCls}-css-var` | `rate` / `masonry` 先例 |
| `useMergeSemantic` / `useSemanticRootStyle` | `_internal/use-merge-semantic.ts`（后者叫 `semanticRootStyle`） | 四个语义槽：`root` / `item` / `itemTitle` / `indicator` |
| `genStyleHooks` + `mergeToken` | `genAnchorStyle` + `prepareComponentToken` + `COMPONENT_STYLES` 一行 | 派生值手写（本仓无 `mergeToken`） |

## 1. 组件面

`Anchor`（注册名 `AAnchor`）+ **复合子组件 `Anchor.Link`**（`AnchorLink`）。
`index.tsx` 的 `Object.assign` 形态：`Anchor.Link = AnchorLink`。

> ⚠️ 本仓已有同类先例：`Splitter.Panel`（`withInstall` + 静态成员）。实现时照它写。

### `AnchorProps`

| prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| `items` | `AnchorLinkItemProps[]` | — | 数据源（推荐）。每项 = `AnchorLinkBaseProps` + `key` + 可选 `children`（**嵌套**） |
| `children` | `VNodeChild` | — | **@deprecated 用 `items`**（照发告警） |
| `direction` | `'vertical' \| 'horizontal'` | `'vertical'` | |
| `offsetTop` | `number` | — | 容器顶部偏移；同时喂给 `Affix` 与 `wrapperStyle.maxHeight` |
| `bounds` | `number` | `5` | 命中判据的容差 |
| `targetOffset` | `number` | — | 滚动落点偏移（优先于 `offsetTop`） |
| `affix` | `boolean \| Omit<AffixProps,'offsetTop'\|'target'\|'children'>` | **`true`** | ⚠️ 默认**开** |
| `showInkInFixed` | `boolean` | `false` | 非 affix 时是否仍显示 ink |
| `getContainer` | `() => HTMLElement \| Window` | — | 滚动容器（回落到 `getTargetContainer` → `window`） |
| `getCurrentAnchor` | `(activeLink: string) => string` | — | 改写高亮（**只改高亮，不改 `onChange` 的载荷**） |
| `onChange` | `(currentActiveLink: string) => void` | — | 滚动/点击导致的当前锚点变化 |
| `onClick` | `(e, link: {title, href}) => void` | — | 点击链接（在滚动**之前**调用） |
| `replace` | `boolean` | — | 用 `replaceState` 而不是 `pushState` |
| `classNames` / `styles` | 语义化（`root` / `item` / `itemTitle` / `indicator`） | — | 支持函数形态 |

### `AnchorLinkBaseProps` / `AnchorLinkItemProps`

| 字段 | 类型 | 说明 |
|---|---|---|
| `href` | `string` | 必填。内部锚点形如 `#section-1` |
| `title` | `VNodeChild` | 显示的文本 |
| `target` | `string` | `<a target>` |
| `className` | `string` | 落在 `.{p}-link` 上 |
| `replace` | `boolean` | 单条覆盖（`Anchor` 的 `replace` 会先铺、单条的覆盖它） |
| `targetOffset` | `number` | **单条**的滚动偏移（也参与滚动侦测） |
| `prefixCls` | `string` | 一般不用 |
| `key` | `string \| number` | 仅 `AnchorLinkItemProps` |
| `children` | `AnchorLinkItemProps[]` | 仅 `AnchorLinkItemProps`，**嵌套**（水平方向不支持） |

### `Anchor.Link`（= `AnchorLink`）

DOM：`div.{p}-link`（`+ -link-active`）> `a.{p}-link-title`（`+ -link-title-active`）+ `children`（**仅垂直**）。

## 2. 行为契约（逐条）

1. **链接注册**：`AnchorLink` 在 `useEffect([href, targetOffset])` 里
   `registerLink(href, targetOffset)`，卸载时 `unregisterLink(href)`。
   `registerLink` 同时把**单条** `targetOffset` 存进 `linkTargetOffsetRef`（供滚动侦测用）。
   🚨 `links` 数组的顺序 = **注册顺序**（DOM 顺序），`getInternalCurrentAnchor` 依赖它。
2. **当前锚点**（`getInternalCurrentAnchor`）：逐 link 用 `/#([^\t\r\n\f\v]+)$/` 抓 id
   ⇒ `document.getElementById(id)`；`getOffsetTop(target, container)`；
   **保留 `top <= linkOffsetTop + bounds` 的**（`linkOffsetTop = 单条 targetOffset ?? 全局 offsetTop`）；
   ⇒ 取其中 **`top` 最大**的那个。一个都没有 ⇒ `''`。
3. **`getOffsetTop(element, container)`**：
   - `getClientRects().length === 0` ⇒ **0**（元素不可见）；
   - `rect.width || rect.height` 为真时：`container === window` ⇒ `rect.top - documentElement.clientTop`；
     否则 `rect.top - container.getBoundingClientRect().top`；
   - 否则（宽高都是 0）⇒ 直接 `rect.top`。
4. **滚动侦测**：`useEffect([JSON.stringify(links)])` 里
   `handleScroll()` 一次 + `container.addEventListener('scroll', handleScroll)`；卸载时移除。
   🚨 依赖是 **`JSON.stringify(links)`**（数组内容），不是 `links` 身份。
   🚨 **容器变了不会重挂**（依赖里没有 `getContainer`）—— 上游如此。
5. **`handleScroll`**：`animatingRef` 为真时**直接 return**（动画期间不抢高亮）。
6. **`setCurrentActiveLink(link, forceTriggerChange = false)`**：
   `rawActiveLinkRef = link`；`newLink = getCurrentAnchor ? getCurrentAnchor(link) : link`；
   **`newLink === activeLinkRef && !forceTriggerChange` ⇒ 直接 return**；
   `newLink !== activeLinkRef` 时才 `setActiveLink(newLink)`；
   🚨 **`onChange` 收到的是原始 `link`**（不是 `getCurrentAnchor` 改写后的），
   且**即使 `isSameLink` 为真也会调**（只要 `forceTriggerChange`）。
7. **`getCurrentAnchor` 变化**：`useEffect([getCurrentAnchor])` ⇒ 用
   `rawActiveLinkRef.current || ''` 重新跑一次 `setCurrentActiveLink`。
8. **点击**（`AnchorLink.handleClick`）：
   ① `onClick?.(e, {title, href})`；② `scrollTo?.(href, targetOffset)`；
   ③ **`e.defaultPrevented` ⇒ 直接 return**（用户 `preventDefault` 后不接管历史）；
   ④ 外链（`http://` / `https://` 开头）：`replace` 时 `preventDefault` + `location.replace(href)`，否则**什么都不做**；
   ⑤ 内链：`preventDefault` + `history[replace ? 'replaceState' : 'pushState'](null, '', href)`。
9. **`handleScrollTo(link, targetOffsetParams?)`**：
   `setCurrentActiveLink(link, previousRawActiveLink !== link)`；
   抓 id ⇒ `document.getElementById`（取不到 ⇒ return）；
   🚨 动画中：`previousRawActiveLink === link` ⇒ return，否则 `scrollRequestIdRef.current?.()` **取消上一次**；
   `y = getScroll(container) + getOffsetTop(target, container) - (targetOffsetParams ?? targetOffset ?? offsetTop ?? 0)`；
   `animatingRef = true`；`scrollRequestIdRef = scrollTo(y, {getContainer, callback: () => animatingRef = false})`。
10. **ink（指示条）**（`updateInk`）：找 `.{p}-link-title-active`；
    垂直 ⇒ `top = linkNode.offsetTop + clientHeight/2`、`height = clientHeight`、`left/width = ''`；
    水平 ⇒ `left = offsetLeft`、`width = clientWidth`、`top/height = ''` + **`scrollIntoView(linkNode, {scrollMode:'if-needed', block:'nearest'})`**。
    触发：`useEffect([anchorDirection, getCurrentAnchor, JSON.stringify(links), activeLink])`。
    ⚠️ 用**内联样式**直接写 `spanLinkNodeRef.current.style.*`（不是响应式）。
11. **DOM 结构**：
    ```
    [Affix(offsetTop, target=getCurrentContainer, ...affixProps)]   ← affix 为真时包一层
      div.{p}-wrapper  [+ -wrapper-horizontal] [+ {p}-rtl]          ← ref=wrapperRef；style=maxHeight
        div.{p}  [+ -fixed（!affix && !showInkInFixed）]
          span.{p}-ink  [+ -ink-visible（activeLink 真值）]          ← ref=spanLinkNodeRef；style=styles.indicator
          links…
    ```
    🚨 **`-fixed` 的判据是 `!affix && !showInkInFixed`**（两个都假才加）。
    🚨 `-rtl` 落在 **wrapper** 上（不是 `.{p}`）。
12. **`wrapperStyle`**：`maxHeight: offsetTop ? \`calc(100vh - ${offsetTop}px)\` : '100vh'`，
    然后铺 `mergedStyles.root`（**用户可覆盖**）。
13. **`'items' in props` 判据**：`items` 分支 vs `children` 分支。
    🚨 React 判的是**键是否存在**（`<Anchor items={undefined}>` 仍走 items 分支）；
    Vue 的 `props` 上键**恒存在** ⇒ 本仓只能按**值**判（`props.items !== undefined`）。
    差异只在「显式传 `items={undefined}`」这一个不可达场景 ⇒ 登记 PLATFORM。
14. **告警三条**：`children` 废弃；水平 + `items` 带 `children`；`AnchorLink` 的 children + 水平。

## 3. 样式契约（`style/index.ts` 204 行）

两段：`genSharedAnchorStyle`（垂直/共用）+ `genSharedAnchorHorizontalStyle`（水平）。

```
.{p}-wrapper                      marginBlockStart: -holderOffsetBlock; paddingBlockStart: holderOffsetBlock
  .{p}                            resetComponent + position:relative + paddingInlineStart: lineWidthBold
    .{p}-link                     paddingBlock: linkPaddingBlock; paddingInline: <linkPaddingInlineStart> 0
      &-title                     textEllipsis + position:relative + display:block
                                  + marginBlockEnd: anchorTitleBlock + color:colorText + transition:all slow
        &:only-child              marginBlockEnd: 0
      &-active > .{p}-link-title  color: colorPrimary
    .{p}-link (嵌套层)             paddingBlock: anchorPaddingBlockSecondary
  &:not(.-wrapper-horizontal)     ← 垂直专属
    .{p}::before                  absolute + insetInlineStart:0 + top:0 + height:100%
                                  + borderInlineStart: <lineWidthBold> <lineType> <colorSplit> + content:' '
    .{p}-ink                      absolute + insetInlineStart:0 + display:none + translateY(-50%)
                                  + transition:top slow ease-in-out + width:lineWidthBold
                                  + backgroundColor: colorPrimary
      &.{p}-ink-visible           display: inline-block
  .{p}-fixed .{p}-ink .{p}-ink    display: none
```

水平段（`genSharedAnchorHorizontalStyle`）：
```
.{p}-wrapper-horizontal           position: relative
  &::before                       absolute + left:0 + right:0 + bottom:0
                                  + borderBottom: <lineWidth> <lineType> <colorSplit> + content:' '
  .{p}                            overflowX:scroll + position:relative + display:flex + scrollbarWidth:none
    &::-webkit-scrollbar          display:none
    .{p}-link:first-of-type       paddingInline: 0
    .{p}-ink                      absolute + bottom:0 + transition:left,width slow ease-in-out
                                  + height:lineWidthBold + backgroundColor:colorPrimary
```

⚠️ 两条 `_skip_check_: true`（cssinjs 的 RTL 跳过标记）⇒ 本仓直接写 `insetInlineStart` / `left`+`right`
（上游水平段用的是**物理** `left`/`right`，不是逻辑属性 —— 照抄）。
⚠️ `textEllipsis` 是 antd 的 `style/index` 工具（三件套 `overflow:hidden` + `text-overflow:ellipsis` + `white-space:nowrap`）。
⚠️ `unit(x)` 是 cssinjs 的「数字补 px」工具 ⇒ 本仓用 `toCssSize()` 等价物（构建期直接拼字符串）。

## 4. Vue 对应（平台差异）

| React | Vue |
|---|---|
| `React.createContext` + `Provider` | `provide` / `inject`（`AnchorContext` 等价物） |
| `Anchor.Link = AnchorLink`（`Object.assign`） | 同 `Splitter.Panel`：`Anchor` 上挂静态 `Link` + 具名导出 `AnchorLink` |
| `useEvent(handler)` | **不需要**（`setup` 只跑一次） |
| `useCallback` 的依赖数组 | `computed` / `watch` 的显式依赖 |
| `useEffect([JSON.stringify(links)])` | `watch(() => JSON.stringify(links.value), …)`（保持同一判据） |
| `React.useRef` 的多个可变槽 | `ref` / 普通 `let`（不参与渲染的用 `let`） |
| `'items' in props` | `props.items !== undefined`（见 §2.13） |
| `useCSSVarCls` / `genCssVar` | 手写类名与变量名 |
| `devUseWarning` | `useDevWarning`（本仓在 `setup` 期发一次） |

## 5. 预判差异

| # | 差异 | 分类 |
|---|---|---|
| D1 | 前缀 `apollo-anchor`（antd `ant-anchor`） | INTENDED |
| D2 | 无 cssinjs 的 hash 类 | INTENDED |
| D3 | `useCSSVarCls` 无对应 hook ⇒ 手写 `-css-var` | PLATFORM |
| D4 | `'items' in props` ⇒ 按值判（`items !== undefined`） | PLATFORM |
| D5 | `useEvent` / `useCallback` ⇒ 不需要 | PLATFORM |
| D6 | `getTargetContainer` 的响应式读取（Vue 的 `inject` 是快照） | PLATFORM（D27 家族） |
| D7 | 上游 `useEffect([JSON.stringify(links)])` 不含 `getContainer` ⇒ 容器变更不重挂；本仓**照抄** | UPSTREAM |

## 6. 本分析没有证明什么

- **真实滚动**：jsdom **不实现布局与滚动** ⇒ `getBoundingClientRect()` 全 0、
  `getClientRects()` 空 ⇒ `getOffsetTop` 恒 0 ⇒ **`getInternalCurrentAnchor` 的判定在 L1/L2 里
  必须靠 mock rect + 手动派发 `scroll` 事件**；真实滚动行为归 **L6**（真浏览器）。
- **`scroll-into-view-if-needed` 的实际滚动效果**（它依赖布局）。
- **`history.pushState` 的副作用**（jsdom 支持调用，但不改 URL 的可见形态）。
- **`Affix` 与 `Anchor` 的组合行为**（固钉需要真实滚动 ⇒ L6）。
