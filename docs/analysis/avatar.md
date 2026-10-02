# Avatar · G1 分析产物

> 契约来源：antd 6.6.4 `/tmp/antd-repo/ant-design-master/components/avatar/`（源码）
> 与 `/tmp/antd-src/package/es/avatar/`（构建产物）。
> 规模 **420 行产物 / 10 文件**：`Avatar.tsx` 242 + `AvatarGroup.tsx` 137 + `AvatarContext.ts` 17
> + `style/index.ts` 237 + `index.tsx` 23。
> Component Token **12 个** + **2 个 `mergeToken` 派生**（`avatarBg` / `avatarColor`）。
> 用户可见 demo **10 个**（其中 3 个标了 `debug`）。
> **先于实现存在**（`AGENTS.md` §2 步骤 3）。

## 0. 依赖面核查（**结论：无 foundation 缺口；3 处需登记**）

| antd 用的 | 本仓对应物 | 备注 |
|---|---|---|
| `@rc-component/resize-observer` 的 `<ResizeObserver onResize>` **包装组件** | `@apollo-design/utils` 的 **`useResizeObserver({ target, onResize, disabled })`** | ⚠️ **形态不同**：上游是**组件**（`SingleObserver` = `cloneElement(children, {ref})`，**不产 DOM**），本仓是 **hook**（对象参数、响应式）。utils 的文件头已把 avatar 列为消费者（「5 个消费者 → 够格进 L0」）。⇒ 挂在同一个 `-string` span 上，DOM 相同 |
| `_util/is` 的 `isNumber` / `isPlainObject` | `@apollo-design/utils` 的 `isNumber` / `isPlainObject` | ✅ |
| `_util/reactNode` 的 `cloneElement` | `cloneVNode`（vue） | 只用于给 children 补 `key` |
| `_util/responsiveObserver` 的 `responsiveArray` / `Breakpoint` | `ui/src/_internal/responsive-observer.ts` | ✅ 同名同义（**从大到小**） |
| `grid/hooks/useBreakpoint` | `ui/src/grid/hooks/use-breakpoint.ts` | ✅ 已落地（grid 消费者） |
| `config-provider/hooks/useSize` | `config-provider/size-context.ts` 的 `useSize` | ✅ |
| `config-provider/hooks/useCSSVarCls` | **无对应 hook** —— 直接拼 `${prefixCls}-css-var` | `card` / `rate` / `masonry` 先例 |
| `_util/warning` 的 `devUseWarning` | `@apollo-design/utils` 的 `devUseWarning` | ⚠️ 上游用 **三参** `warning(valid, 'breaking', msg)`，本仓签名是 **两参** `(valid, message)`（`slider/hooks/use-range.ts` 已记过）⇒ 调用点要改写 |
| `Popover`（`Avatar.Group` 的 `max.popover`） | `ui/src/popover`（**已 completed**） | `Avatar.Group` 的 `max` 分支要用它 |
| `AvatarContext` | 本仓 `provide` / `inject`（`context.ts`） | ⚠️ **本仓把外层 Provider 挪进组件** ⇒ 外层 `provide` 不生效，hack 面走 **props**（PITFALLS 256） |
| `genStyleHooks` + `mergeToken` | `genAvatarStyle` + `prepareComponentToken` + `COMPONENT_STYLES` 一行 | 2 个派生值 |
| `resetComponent` | **手写展开**（`badge` 范式） | 见 §3 |

## 1. 组件面

`Avatar`（注册名 `AAvatar`）+ **一个复合子组件** `Avatar.Group`（`AvatarGroup`）。

```
AvatarProps
  prefixCls? shape?: 'circle' | 'square'
  size?: AvatarSize            // SizeType | 'default'(deprecated) | number | ScreenSizeMap
  gap?: number                 // 默认 4
  src?: React.ReactNode        // 字符串 ⇒ <img>；ReactElement ⇒ 原样渲染
  srcSet?: string  draggable?: boolean | 'true' | 'false'
  icon?: React.ReactNode
  style? className? rootClassName? children? alt?
  crossOrigin?: '' | 'anonymous' | 'use-credentials'
  onClick?: (e?: React.MouseEvent<HTMLElement>) => void
  onError?: () => boolean      // ⚠️ 返回 false ⇒ **阻止**内置回退
```

```
AvatarGroupProps
  prefixCls? className? rootClassName? style? children?
  maxCount?(deprecated) maxStyle?(deprecated)
  maxPopoverPlacement?(deprecated) maxPopoverTrigger?(deprecated)
  max?: { count?: number; style?: CSSProperties; popover?: PopoverProps }
  size?: AvatarSize  shape?: 'circle' | 'square'
```

### 🚨 三种 ref 形状（与 card 同形）

| 组件 | 上游 | 形状 |
|---|---|---|
| `Avatar` | `forwardRef<HTMLSpanElement>` | **ref 就是 DOM 元素本身**（`<span>`） |
| `Avatar.Group` | `forwardRef` + `useImperativeHandle` | `{ nativeElement: HTMLDivElement }` |

⇒ Vue 侧统一成 `{ nativeElement }`（与 card / badge 的既有约定一致），README 记一处形状差异。

### 其余类型

- `AvatarSize = SizeType | 'default' | number | ScreenSizeMap`（`'default'` **已废弃**）
- `ScreenSizeMap` = `Partial<Record<Breakpoint, number>>`（**响应式尺寸**）

## 2. 行为契约（逐条，给上游行号）

### 2.1 渲染骨架（`Avatar.tsx:225-233`）

```html
<span style={...sizeStyle, ...responsiveSizeStyle, ...contextStyle, ...style} class={classString}>
  {childrenToRender}
</span>
```

⚠️ **style 的合并顺序即契约**：内联 size → 响应式 size → **context style** → **自己的 style**
（`style` 最后 ⇒ 覆盖前三者）。

### 2.2 `childrenToRender` 的**五路互斥分支**（`:186-223`）

| 优先级 | 条件 | 渲染 |
|---|---|---|
| 1 | `typeof src === 'string' && isImgExist` | `<img src draggable srcSet onError alt crossOrigin>` |
| 2 | `hasImageElement`（`src` 是 ReactElement） | **原样渲染 `src`** |
| 3 | `icon` 真值 | `icon` |
| 4 | `mounted \|\| scale !== 1` | `<ResizeObserver onResize><span class="-string" style={{ms/Webkit/transform: scale(n)}}>{children}</span></ResizeObserver>` |
| 5 | 其余（首帧、scale 仍是 1） | `<span class="-string" style={{opacity:0}}>{children}</span>` |

⚠️ **第 5 支是 SSR / 首帧的形态**：`opacity:0` + 无 transform（避免用未测量的 scale 闪一下）。
⚠️ 第 4/5 支的 `<span class="-string">` 是**同一个元素**（只是 `ref` 与 style 不同）⇒
Vue 侧不要拆成两个分支渲染（会重建节点、丢掉 `ref`）。

### 2.3 `scale` 的测量（`:83-95`）

```js
childrenWidth = avatarChildrenRef.offsetWidth
nodeWidth     = avatarNodeRef.offsetWidth
if (childrenWidth !== 0 && nodeWidth !== 0) {
  if (gap * 2 < nodeWidth) {
    setScale(nodeWidth - gap*2 < childrenWidth ? (nodeWidth - gap*2) / childrenWidth : 1)
  }
}
```

- 两个宽度**任一为 0 就整体跳过**（⇒ jsdom 里永远不动，`scale` 恒 1）。
- 触发点：① `useEffect(setScaleParam, [gap])`（**只在 `gap` 变时跑**）；
  ② `ResizeObserver.onResize`。
- ⚠️ `offsetWidth` 是**取整**的（不是 `getBoundingClientRect`）—— 断言要按整数。

### 2.4 三个 effect（`:97-106`）

| effect | 依赖 | 作用 |
|---|---|---|
| `setMounted(true)` | `[]` | 挂载后走「第 4 支」（带 ResizeObserver 的形态） |
| `setIsImgExist(true); setScale(1)` | `[src]` | **`src` 一变就重置**「图片失败」与缩放 |
| `setScaleParam` | `[gap]` | ⚠️ **不是 `[]`** —— 首帧不跑，只随 `gap` 变 |

### 2.5 `handleImgLoadError`（`:108-113`）

```js
const errorFlag = onError?.();
if (errorFlag !== false) setIsImgExist(false);
```

⚠️ 判据是 **`!== false`**（不是真值）⇒ `onError` 返回 `undefined` / `0` / `''` **都会**走内置回退。

### 2.6 size 的解析链（`:115`）

```js
useSize((ctxSize) => customSize ?? avatarCtx?.size ?? ctxSize ?? 'medium')
```

⇒ `props.size` > **AvatarContext.size**（`Avatar.Group` 注入）> `ConfigProvider.componentSize` > `'medium'`。

### 2.7 响应式尺寸（`:117-137`）

```js
needResponsive = Object.keys(isPlainObject(size) ? size||{} : {}).some(k => responsiveArray.includes(k))
screens = useBreakpoint(needResponsive)
currentBreakpoint = responsiveArray.find(s => screens[s])   // ⚠️ 非空断言
currentSize = size[currentBreakpoint]
→ currentSize ? { width, height, fontSize: (icon||children) ? currentSize/2 : 18 } : {}
```

⚠️ **`useBreakpoint(needResponsive)` 是「按需订阅」**：不需要响应式时不注册 matchMedia。
⚠️ 响应式分支里 `fontSize` 的判据是 **`icon || children`**（数字尺寸分支里只有 `icon`）。

### 2.8 类名（`:162-176`）

```
{prefixCls}
{prefixCls}-lg | -sm          ← size === 'large' | 'small'（数字尺寸**不落**类名）
contextClassName
{prefixCls}-{mergedShape}     ← shape ?? avatarCtx?.shape ?? 'circle'
{prefixCls}-image             ← hasImageElement || (src && isImgExist)
{prefixCls}-icon              ← !!icon
cssVarCls
rootCls                       ← `${prefixCls}-css-var`
className
rootClassName
hashId
```

⚠️ `-image` 的判据是 `hasImageElement || (src && isImgExist)` —— 用的是 **`src` 的真值**
（`src=''` ⇒ 假），且**不管 `src` 是不是字符串**。

### 2.9 内联尺寸样式（`:178-184`）

```js
isNumber(size) ? { width: size, height: size, fontSize: icon ? size/2 : 18 } : {}
```

⚠️ 数字尺寸时 `fontSize` 只在**有 icon** 时给（否则不给，走 CSS 的 `textFontSize`）；
而 §2.7 的响应式分支给的是 `(icon||children) ? size/2 : 18` —— **两条判据不同**，别合并。

### 2.10 `Avatar.Group`（`AvatarGroup.tsx`）

- 前缀：`groupPrefixCls = `${getPrefixCls('avatar', customizePrefixCls)}-group``。
- **`-rtl` 在 group 上**（`direction === 'rtl'`），`Avatar` **自己不带** `-rtl`。
- children 逐个 `cloneElement(child, { key: `avatar-key-${index}` })`（**只补 key**）。
- `mergeCount = max?.count || maxCount`；`mergeCount && mergeCount < numOfChildren` 时：
  - `childrenShow = 前 mergeCount 个`，`childrenHidden = 其余`；
  - `mergeStyle = max?.style || maxStyle`；`mergePopoverTrigger = max?.popover?.trigger || maxPopoverTrigger || 'hover'`；
    `mergePopoverPlacement = max?.popover?.placement || maxPopoverPlacement || 'top'`；
  - `popoverProps = { content: childrenHidden, ...max?.popover, placement, trigger, rootClassName: clsx(`${groupPrefixCls}-popover`, max?.popover?.rootClassName) }`
    ⚠️ **`max.popover` 展开在 `content` 之后、`placement` / `trigger` / `rootClassName` 之前**
    ⇒ 后三者**覆盖** `max.popover` 里的同名键（但 `max.popover.content` 会**覆盖** `childrenHidden`）；
  - 追加 `<Popover key="avatar-popover-key" destroyOnHidden {...popoverProps}><Avatar style={mergeStyle}>+N</Avatar></Popover>`。
- ⚠️ `mergeCount === 0` 时**不进**该分支（`0 && ...` 为假）⇒ 全量渲染。
- ⚠️ `AvatarContextProvider` 的合并是 `size: props.size || size`（**`||` 不是 `??`**）
  ⇒ `size={0}` 会被下级的 `size` 顶掉。

### 2.11 告警（`Avatar.tsx:139-147`、`AvatarGroup.tsx:84-94`）

- `Avatar`：`icon` 是**长度 > 2 的字符串** ⇒ `'breaking'` 告警（v4 字符串命名）。
  ⚠️ 本仓 `devUseWarning` 是**两参** ⇒ 上游的三参要合并成一条消息。
- `Avatar.Group`：`maxCount` / `maxStyle` / `maxPopoverPlacement` / `maxPopoverTrigger`
  四条 `deprecated` 告警，判据是 **`deprecatedName in props`**（与 card 同，本仓用 `!== undefined`）。

## 3. 样式契约（`style/index.ts` 237 行）

**12 个 Component Token**（`prepareComponentToken`）：

| token | 默认值 | 解析值 |
|---|---|---|
| `containerSize` | `controlHeight` | 32 |
| `containerSizeLG` | `controlHeightLG` | 40 |
| `containerSizeSM` | `controlHeightSM` | 24 |
| `textFontSize` | `fontSize` | 14 |
| `textFontSizeLG` | `fontSize` | 14 |
| `textFontSizeSM` | `fontSize` | 14 |
| `iconFontSize` | `Math.round((fontSizeLG + fontSizeXL) / 2)` | 18 |
| `iconFontSizeLG` | `fontSizeHeading3` | 24 |
| `iconFontSizeSM` | `fontSize` | 14 |
| `groupSpace` | `marginXXS` | 4 |
| `groupOverlapping` | `-marginXS` | -8 |
| `groupBorderColor` | `colorBorderBg` | #ffffff |

**2 个 `mergeToken` 派生**（用户**不可**覆盖）：`avatarBg` = `colorTextPlaceholder`、
`avatarColor` = `colorTextLightSolid`。
⚠️ `AvatarToken` 里还声明了 **`avatarBgColor`，但 `mergeToken` 里从没赋过值**
⇒ 死键（与 card 的 `bodyPadding` 同类）。本仓**不引入**。

**产物交叉验证**（可复现）：

```sh
node tests/visual/debug/extract-avatar-css.mjs > /tmp/avatar-antd.css   # 24 条 ant-avatar 规则
```

**19 条**组件规则（差掉的 5 条 = `resetComponent` 的 4 条 `box-sizing` 块，`BASE_CSS` 已覆盖；
+ 1 个 `.css-var-*` 声明块）：

| # | 选择器 | 关键声明 |
|---|---|---|
| 1 | `.{p}`（reset + base 合并） | `position/display:inline-flex/justify-content:center/align-items:center/overflow:hidden/color:avatarColor/white-space:nowrap/text-align:center/vertical-align:middle/background:avatarBg/border:lineWidth lineType transparent/width:containerSize/height:containerSize/border-radius:50%` |
| 2 | `.{p}-image` | `background:transparent` |
| 3 | `.{p} .{pRoot}-image-img` | `display:block`（⚠️ 用的是 **antCls**：`.ant-image-img`） |
| 4 | `.{p}.{p}-square` | `border-radius:borderRadius` |
| 5 | `.{p}.{p}-icon` | `font-size:iconFontSize` |
| 6 | `.{p}.{p}-icon > .{pRoot}-icon` | `margin:0`（⚠️ **iconCls**，`.apollo-icon`） |
| 7-10 | `.{p}-lg` + 三条同形（`-square` / `-icon` / `-icon > icon`） | `containerSizeLG / borderRadiusLG / textFontSizeLG / iconFontSizeLG` |
| 11-14 | `.{p}-sm` + 三条同形 | `containerSizeSM / borderRadiusSM / textFontSizeSM / iconFontSizeSM` |
| 15 | `.{p} > img` | `display:block/width:100%/height:100%/object-fit:cover` |
| 16 | `.{p}-group` | `display:inline-flex` |
| 17 | `.{p}-group .{p}` | `border-color:groupBorderColor` |
| 18 | `.{p}-group > *:not(:first-child)` | `margin-inline-start:groupOverlapping` |
| 19 | `.{p}-group-popover .{p} + .{p}` | `margin-inline-start:groupSpace` |

⚠️ 三条**非显然**结构：
1. `avatarSizeStyle` 是**一个工厂**，三处复用（base / `-lg` / `-sm`）⇒ 规则是
   `.{p}.{p}-square` 这种**复合选择器**（不是后代）。
2. 规则 3 与 6 用的是 **`antCls` / `iconCls`**（`.ant-image-img` / `.anticon`），
   **不是** `componentCls` ⇒ 本仓落 `.apollo-image-img` / `.apollo-icon`（D15 家族）。
3. `-group` 的 `> *:not(:first-child)` 是**子选择器 + `:not()`**。

⚠️ `resetComponent` 在产物里被 scoped 到 **`.ant-avatar-css-var`**（cssVar 模式的产物形态），
非 cssVar 时是 `.ant-avatar`。本仓按 `card` / `breadcrumb` 的既有范式**合并进根规则**。

## 4. Vue 对应（平台差异）

| 上游 | 本仓 |
|---|---|
| `React.forwardRef`（`Avatar` 的 ref 是 DOM） | `expose({ nativeElement })`（统一形状，**记差异**） |
| `<ResizeObserver onResize>` 包装组件 | `useResizeObserver({ target, onResize })`（**hook**，挂在 `-string` span 上，DOM 相同） |
| `useImperativeHandle` | 同上 |
| `React.useState` × 3（`scale` / `mounted` / `isImgExist`） | `ref` × 3 |
| `useEffect(fn, [])` | `onMounted` |
| `useEffect(fn, [src])` / `useEffect(fn, [gap])` | `watch(() => props.src, fn)` / `watch(() => props.gap, fn)` |
| `useMemo(responsiveSizeStyle, [...])` | `computed` |
| `cloneElement(child, { key })` | `cloneVNode(child, { key })` |
| `AvatarContext` | `provide` / `inject`（`context.ts`）—— ⚠️ 本仓把 Provider 挪进 `Avatar.Group`，**组件内**消费 ⇒ 不受 PITFALLS 256 影响 |
| `onError?: () => boolean` | **prop**（不是 emits —— 上游是回调 prop，且**有返回值语义**） |
| `onClick` | **prop**（`(e?: MouseEvent) => void`，与 anchor 同判） |
| `direction` | **必须** `useDirection()`（D27），只在 `Avatar.Group` 上用 |
| `_util/warning` 三参 | 本仓两参 ⇒ 合并消息 |
| `{...others}` 落根 `<span>` | `inheritAttrs` + `mergeProps`（⚠️ `class` / `style` 必须声明成 props） |

**文件形态**：`Avatar.vue`（默认 `.vue`）+ `AvatarGroup.vue` + `context.ts`
+ `interface.ts` + `style/`。

## 5. 预判差异

1. **D1**：默认根前缀 `apollo` vs `ant`。
2. **D15**：`.anticon` → `.apollo-icon`；`.ant-image-img` → `.apollo-image-img`。
3. **`resetComponent` 展开**：box-sizing 块不产出（`BASE_CSS` 已覆盖）。
4. **`avatarBgColor` 死键不落地**（见 §3）。
5. **`Avatar` 的 ref 形状**：上游是 DOM 本身，本仓是 `{ nativeElement }`（PLATFORM）。
6. **`avatar` 组件配置键未提升**进 `ConfigProvider` 的 (A) 通道（与 anchor / masonry / card 一致）。
7. **`ResizeObserver` 从组件变 hook**（DOM 相同，但 `onResize` 的**触发时机**可能有差 ——
   上游的 `SingleObserver` 在 `componentDidMount` 里 `observe`，本仓在 `onMounted` 后）。
8. **`warning(valid, 'breaking', msg)` 三参 → 两参**。

## 6. 本分析没有证明什么

1. **没跑过任何 oracle**：`scale` 的测量、`-image` 的类名组合、`Avatar.Group` 的
   `max` 截断与 Popover 结构、响应式尺寸的 `useBreakpoint` 订阅，都要由 G10 实测。
2. **没数 `style/index.ts` 的规则条数** —— 已用产物交叉验证为 **19 条**（§3），
   但**没逐条对拍声明顺序**（G4 写完再对）。
3. ✅ **`useBreakpoint(needResponsive)` 的「按需订阅」语义已核实一致**：本仓签名是
   `useBreakpoint(refreshOnChange = true, defaultScreens = {})` —— 第一参就是「要不要订阅」，
   与上游 `needResponsive` 同义（`use-breakpoint.ts:20`）。
4. **没评估 10 个 demo 的语义等价性**：`component-token` 预计不移植（零运行时，与 card 同判）；
   `toggle-debug` / `fallback` 上游标了 `debug` 但**演示真实行为**（测量路径 / src 回退）
   ⇒ 倾向移植（`breadcrumb` 的 `debug-routes` 先例）。
5. **没确认 `Avatar.Group` 的 `max.popover.content` 会不会与 `childrenHidden` 冲突**
   （读码是 `max.popover` 覆盖 `content`，但要 G10 实测）。
6. **没确认 `onError` 的返回值语义在 Vue 里怎么表达**：上游是「返回 `false` ⇒ 阻止内置回退」，
   本仓保持 prop 形态即可，但要确认**异步/非函数**时的行为。
