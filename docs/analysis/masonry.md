# Masonry · G1 分析产物

> 契约来源：antd 6.6.4 `/tmp/antd-repo/ant-design-master/components/masonry/`（源码）
> 与 `/tmp/antd-src/package/es/masonry/`（构建产物）。
> 规模 **520 行源码 / 349 行产物 / 14 文件**：
> `Masonry.tsx` 311 + `MasonryItem.tsx` 53 + `index.tsx` 5 +
> `hooks/{useDelay 19, usePositions 53, useRefs 17}` + `style/index.ts` 62。
> Component Token **0 个**（`ComponentToken` 是**空接口**）—— 与 registry 的 `tokenCount: 0` 一致。
> **先于实现存在**（`AGENTS.md` §2 步骤 3）。

## 0. 依赖面核查（**结论：无 foundation 缺口，全部可复用**）

antd 侧的每一处外部依赖在本仓都已存在。**这是本组件最重要的 G1 结论** ——
它没有需要新造的 foundation 能力，纯 `ui` 层工作。

| antd 用的 | 本仓对应物 | 备注 |
|---|---|---|
| `CSSMotionList`（`@rc-component/motion`） | **`MotionList`**（`@apollo-design/motion`） | ⚠️ 插槽只回传 `itemKey` + `className`/`style`，**不回传 item** ⇒ 要自建 `key → item` 查表（`UploadList.ts:258` 先例） |
| `ResizeObserver`（`@rc-component/resize-observer`） | `observeResize`（`@apollo-design/utils`） | 返回 dispose 函数 |
| `isEqual` / `raf` / `composeRef` | 同名，均在 `@apollo-design/utils` | `composeRef` 在 `utils/ref.ts` |
| `isNumber`（`_util/is`） | `isNumber`（`@apollo-design/utils`） | |
| `responsiveArray` / `Breakpoint` / `Screens` | `ui/_internal/responsive-observer.ts` | ⚠️ `responsiveArray` 是**从大到小** |
| `grid/hooks/useBreakpoint` | `ui/grid/hooks/use-breakpoint.ts` | ⚠️ 返回 `Ref<Screens \| null>`（不是裸对象） |
| `grid/hooks/useGutter` | `ui/grid/hooks/use-gutter.ts` | 返回 `[h, v]` |
| `_util/hooks/useMergeSemantic` | `ui/_internal/use-merge-semantic.ts` 的 `useMergeSemantic` | |
| `useSemanticRootStyle` | 同文件的 **`semanticRootStyle`**（函数名不同） | |
| `useCSSVarCls(prefixCls)` | **无对应 hook** —— 本仓直接把 `${prefixCls}-css-var` 拼进根类名 | `rate/Rate.ts:322` 先例 |
| `genCssVar(root, 'masonry')` | **无对应物** —— 组件作用域 CSS 变量手写 | `splitter` 先例：`--{root}-splitter-*` |
| `genStyleHooks('Masonry', …)` | `genMasonryStyle` + `prepareComponentToken` + `COMPONENT_STYLES` 一行 | |
| `useLayoutEffect` | Vue 无对应 —— `onMounted` + `onUpdated` | `picker-focus-lock` 先例（PITFALLS 211） |

## 1. 组件面

单组件 `Masonry`（注册名 `AMasonry`）+ 内部 `MasonryItem`（**不导出**）。
`index.tsx` 只导出 `Masonry` / `MasonryProps` / `MasonryRef`。

| prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| `items` | `MasonryItemType<T>[]` | — | 每项 `{key, data, column?, height?, children?}` |
| `itemRender` | `(info: item & {index, column}) => VNodeChild` | — | 优先级**低于** `item.children` |
| `columns` | `number \| Partial<Record<Breakpoint, number>>` | `3` | 列数 |
| `gutter` | `Gutter`（= `RowProps['gutter']`） | `0` | 复用 grid 的 `useGutter` |
| `onLayoutChange` | `(sortInfo: {key, column}[]) => void` | — | 布局顺序变化时回调 |
| `fresh` | `boolean` | — | 每个 item 各自挂 `ResizeObserver`（否则只靠根上的那个） |
| `prefixCls` / `className` / `rootClassName` / `style` | — | — | 常规 |
| `classNames` / `styles` | 语义化（`root` / `item` 两个槽） | — | 支持**函数形态** |

`MasonryRef`：`{ nativeElement: HTMLDivElement }`。

⚠️ **`MasonryItemType.height` 从不被读** —— 高度一律**实测**（`getBoundingClientRect`）。
`column` 是「**指定**该 item 放第几列」的入口。

## 2. 行为契约（逐条）

1. **`mergedItems` 是 state，不是 prop 直读**（`Masonry.tsx:120-124`）：
   `useEffect(() => setMergedItems(items || []), [items])` —— 即 items 的更新**晚一拍**
   生效。Vue 侧若直接读 `props.items` 会改变时序（见 §4）。
2. **列数**（`:132-151`）：没给 ⇒ **3**；数字 ⇒ 直接用；
   对象 ⇒ `responsiveArray.find(bp => screens[bp] && columns[bp] !== undefined)`
   （**从大到小**取第一个命中的）⇒ 命中就用它；否则 `columns.xs ?? 1`。
3. **gutter**（`:128-129`）：`useGutter(gutter, screens)` ⇒ `[h, v]`，
   **`v` 缺省时 = `h`**（`const [horizontalGutter = 0, verticalGutter = horizontalGutter] = gutters`）。
4. **高度采集**（`:173-184`）：`useDelay`（raf 去抖）包住 —— 逐项
   `getItemRef(key)?.getBoundingClientRect().height`（**取不到就 0**），
   再用 `isEqual` 比较，**相同则不 setState**（防重排循环）。
   触发点有四个：`useEffect([mergedItems, columnCount])` · 根上的 `ResizeObserver` ·
   根 div 的 `onLoad` / `onError`（**监听图片加载**）· `fresh` 时每个 item 自己的 `ResizeObserver`。
5. **排布算法**（`usePositions`，53 行，本组件的核心）：
   ```
   columnHeights = new Array(columnCount).fill(0)
   for 每个 item（按 items 顺序）:
     target = item.column ?? columnHeights.indexOf(min(columnHeights))
     target = min(target, columnCount - 1)          // 显式列号要夹取
     top    = columnHeights[target]
     positions.set(key, { column: target, top })
     columnHeights[target] += height + verticalGutter
   totalHeight = max(0, max(columnHeights) - verticalGutter)
   ```
   🚨 三个易错点：① **`indexOf(min)` 取第一个最小列**（平局取最左）；
   ② 显式 `item.column` **不参与** `min` 计算，且必须 `Math.min(…, columnCount - 1)` 夹取；
   ③ `totalHeight` **减掉一个** `verticalGutter`，且 `Math.max(0, …)`。
   ⚠️ 算法是「按顺序稳定排布」，**不做后续 item 高度的动态调整**（上游注释明说）。
6. **`onLayoutChange` 两段 `useLayoutEffect`**（`:216-232`）：
   ① 全部 item 都有 `position` 时把 `{item, column}` 写进 `itemColumns`（`isEqual` 去重）；
   ② `itemColumns` 变化且 `items.length === itemColumns.length` 时回调
   `itemColumns.map(([item, column]) => ({...item, column}))`。
   🚨 **两段都先判 `onLayoutChange &&`** ⇒ 不传回调时这两段完全是空转。
   🚨 载荷是 **`{...item, column}`**（**展开 item 本体**，不是 `{key, column}`）。
7. **DOM 结构**：
   ```
   <ResizeObserver onResize={collectItemSize}>        ← 不产生 DOM
     div.{p}                                          ← 根；ref / style.height / onLoad / onError
       MotionList(component=false, motionName=`${p}-item-fade`, motionAppear, motionLeave)
         div.{p}-item                                 ← 每个 item；绝对定位
           item.children ?? itemRender({...item, index, column})
   ```
   ⚠️ `component={false}` ⇒ MotionList **不额外包元素**（本仓传 `component: null`）。
8. **item 的内联样式**（`:275-281`，四个值）：
   ```js
   [varName('item-width')]: `calc((100% + ${hGutter}px) / ${columnCount})`
   insetInlineStart:        `calc(${varRef('item-width')} * ${columnIndex})`
   width:                   `calc(${varRef('item-width')} - ${hGutter}px)`
   top:                     position.top     // ← 数字
   position: 'absolute'
   ```
   🚨 **`top` 是数字** —— React 会补 `px`，**Vue 的 `patchStyle` 不会**（PITFALLS 8 / D94）
   ⇒ 必须过 `toCssSize()`（`ui/_internal/to-css-size.ts`）。
   🚨 变量名是 **`--{rootPrefixCls}-masonry-item-width`**（`genCssVar` 的 `antCls` 是
   **`rootPrefixCls`**，不是组件 `prefixCls`）。
9. **item 的 `key`**：`item.key ?? index`。⚠️ MotionList 内部会把 key 转成字符串，
   上游特意在 `motionInfo` 里**另存一份 `itemKey`**（`Masonry.tsx:199-202` 的注释）。
10. **`MasonryItem` 的 `onResize`**：`fresh ? collectItemSize : null`；
    非 null 时用 `ResizeObserver` 包一层 —— ⚠️ **实测它不产生 DOM 节点**
    （`@rc-component/resize-observer` → `SingleObserver` 是 `cloneElement(children, {ref})`，
    `ResizeObserver` 本身只 `map` 出一个数组）⇒ `fresh` **不改变 DOM 结构**，
    只是多挂一个观察者。本仓用 `observeResize(el, cb)`（`@apollo-design/utils`）在
    item 挂载后直接观察即可，**不要**加包装元素。
11. **空 items 不崩**（上游有用例）：`columnHeights` 为空时 `Math.max(...[])` = `-Infinity`
    ⇒ `Math.max(0, -Infinity - 0)` = 0 ✓（`Math.max(0, …)` 就是为这个加的）。

## 3. 样式契约（`style/index.ts` 62 行，逐条）

```
.{p}                          position:relative; box-sizing:border-box;
                              display:flex; flex-direction:column; flex-wrap:wrap;
.{p}-rtl                      direction:rtl
.{p} > .{p}-item              box-sizing:border-box
  &-fade-appear               transition: opacity motionDurationSlow motionEaseOut; opacity:0
    &-active                  opacity:1
  &-fade-leave                transition: opacity motionDurationFast motionEaseOut; opacity:1
    &-active                  opacity:0
  &:not(.{p}-item-fade)       transition: left,right,top 各 motionDurationSlow motionEaseOut
```

- **Component Token 是空接口** ⇒ 本组件**没有**自己的 token 声明块（与 registry 一致）。
  用到的全是 alias：`motionDurationSlow` / `motionDurationFast` / `motionEaseOut`。
- ⚠️ 末条 `&:not(.{p}-item-fade)` —— **动画期间不叠位置过渡**（否则 transform 与 left/top 打架）。
- ⚠️ `box-sizing` 出现在**三处**（根 / item / `& > item`），`resetComponent` 的其余规则
  （margin/padding/color/font…）由本仓 `BASE_CSS` 承担 —— 见 `COMPONENT-RULES.md`。

## 4. Vue 对应（平台差异）

| React | Vue |
|---|---|
| `useState` + `useEffect([items])` 的 `mergedItems` | 直接读 `props.items`，或 `ref` + `watch(…, {flush:'post'})`（**待定，见 §5 D3**） |
| `useLayoutEffect`（两段） | `onMounted` + `onUpdated`（`document` 无响应式，不能用 `watch`，PITFALLS 211） |
| `useRef` / `useImperativeHandle` | `ref` + `expose({ nativeElement: () => el })`（**函数**，`setup` 期还是 null） |
| `useRefs()` 的 `Map<Key, Element>` | `Map` + 函数 ref（槽内 vnode 的 owner 是 `CSSMotion` ⇒ `ref:` 可用） |
| `CSSMotionList` 的 render-prop `(motionInfo, motionRef)` | `MotionList` 的**默认插槽**（只有 `itemKey` + `className`/`style`）⇒ **要自建 key→item 查表**；`motionRef` 没有对应物 ⇒ 用函数 ref |
| `composeRef(motionRef, itemRef)` | 不需要 —— 槽里直接用函数 ref |
| `genCssVar(root, 'masonry')` | 手写 `--apollo-masonry-item-width`（`splitter` 先例） |
| `useCSSVarCls` | 根类名里直接拼 `${prefixCls}-css-var`（`rate` 先例） |
| `onLoad` / `onError` 挂在根 div 上 | **同**（都是冒泡阶段的直接监听 ⇒ 对子元素图片同样无效，见 §6.1）。⚠️ Vue 侧写 `onLoad` 即可，**不要**顺手改成 `onLoadCapture` |

## 5. 预判差异

| # | 差异 | 分类 |
|---|---|---|
| D1 | 前缀 `apollo-masonry` | INTENDED |
| D2 | 无 hash 类（本仓静态 CSS，无 cssinjs hashId） | INTENDED |
| D3 | **`mergedItems` 的一拍延迟**：上游 `useEffect` 后才写入 state ⇒ 首帧渲染的是**空列表**，第二帧才有 item。**本仓用 `onMounted` + `watch(flush:'post')` 精确复刻**（见 §6.2） | PLATFORM |
| D4 | `useLayoutEffect` → `onMounted`/`onUpdated` | PLATFORM |
| D5 | `genCssVar` / `useCSSVarCls` 无对应 hook（手写等价物） | PLATFORM |
| D6 | `CSSMotionList` 的 render-prop → 插槽 + 查表 | PLATFORM |
| D7 | `Math.max(...columnHeights)` 空数组 = `-Infinity` 的兜底行为**照抄**（靠 `Math.max(0, …)`） | 一致 |
| D8 | 🚨 **根 div 的 `onLoad` / `onError` 是死监听**（上游同样无效，见 §6.1）—— 本仓**照抄同样的绑定**，不改捕获 | **UPSTREAM** |

## 6. 两处**已实测**的关键结论

### 6.1 🚨 上游根 div 上的 `onLoad` / `onError` 是**死监听**（对子元素图片无效）

`Masonry.tsx:250-252` 在根 `div` 上挂了 `onLoad={collectItemSize}` / `onError={collectItemSize}`，
注释写着 `// Listen for image events`。**这条路径实际不生效**，证据链：

1. React 19 的 `nonDelegatedEvents` 集合含 **`"load"`**（实测源码
   `react-dom-client.development.js`：`"beforetoggle cancel close invalid load scroll scrollend toggle"`）。
2. 非委托事件走 `listenToNonDelegatedEvent(domEventName, targetElement)` ——
   `addTraversedEventListener(targetElement, domEventName, 2, false)`：
   **直接绑在该元素上、冒泡阶段**（`2` = bubble，`false` = 非捕获）。
3. 而 DOM 的 `load` 事件 **`bubbles: false`** ⇒ 子 `<img>` 的 `load` **到不了**根 `div`。
4. 根 `div` 自身不会触发 `load`（它不是替换元素）⇒ **处理器永不执行**。

⇒ **本仓的处理：照抄同样的绑定方式**（根 div 的冒泡阶段监听），即**同样无效**。
理由：这是「上游的未文档化/无效行为」，按 `AGENTS.md` §4.3 归 **UPSTREAM**，
默认不跟随也不改进 —— 若我们改成捕获阶段让图片重排生效，会在 `image` 场景下
产生与 antd **不同**的布局（我们的更「对」，但那就不是兼容实现了）。
⚠️ 若将来用户要求 1:1 之外的改进，改 `onLoadCapture` / `onErrorCapture` 即可（Vue 支持 `Capture` 后缀）。

**为什么 `image` demo 仍然能看**：首帧 `useEffect` 已经量过一轮（那时图片高度未知），
之后**根 `ResizeObserver`** 会在根高度变化时再量 —— 但根高度由 `style.height = totalHeight`
决定，而 `totalHeight` 又来自「已量到的」高度 ⇒ 图片加载完成后**不会自动重排**
（这正是上游 `fresh` 与 `image` 两个 demo 并存的原因：需要响应内容尺寸变化时得用 `fresh`）。

### 6.2 `mergedItems` 的**一拍延迟**必须复刻

`Masonry.tsx:120-124`：

```js
const [mergedItems, setMergedItems] = React.useState([]);
React.useEffect(() => { setMergedItems(items || []); }, [items]);
```

`useEffect` **在首次 commit 之后**才跑 ⇒ 首帧渲染的是**空列表**，第二帧才有 item。

Vue 的对应物要卡在同一个时机，**不能**用 `immediate: true`（那会在 `setup` 期同步跑，
首帧就有 item ⇒ 少一拍），**也不能**只靠默认 `watch`（首次不触发）：

```ts
const mergedItems = ref<MasonryItemType[]>([]);
onMounted(() => { mergedItems.value = props.items ?? []; });      // ← 首帧之后
watch(() => props.items, (next) => { mergedItems.value = next ?? []; }, { flush: 'post' });
```

⚠️ 这条直接决定 `MotionList` 的**首次入场**（`motionAppear` 的起止）与
`collectItemSize` 的第一次执行时机 ⇒ L2 的时序断言要按这个来钉。

## 7. 本分析没有证明什么

- **真实布局**：jsdom 无布局引擎 ⇒ `getBoundingClientRect().height` 恒 0。
  L1 只能钉**纯函数**（`usePositions` 的排布结果 / 列数解析 / gutter 归一），
  端到端排布必须靠 **L6 真浏览器**（上游自己也是靠 `spyElementPrototypes` mock rect）。
- **`fresh` 的观察者数量**（每个 item 一个）在 jsdom 下的行为（`observeResize` 的真实实现）。
- **`MotionList` 的 leave 时序**与上游 `CSSMotionList` 是否逐帧一致（L6 只拍静态帧）。
- **`onLayoutChange` 的调用次数**：上游两段 `useLayoutEffect` 的组合在 React 下
  可能触发多次；Vue 侧的确切次数未验证（L2 只钉「载荷形状」与「长度不等时不回调」）。
