# `virtual-list` 契约文档

> G1/G2 的分析产物。**步骤 3 的产物必须先于步骤 5 存在**（`AGENTS.md` §2）。
> 事实来源：`@rc-component/virtual-list@1.5.1`（由 `@rc-component/select@1.10.1` 的
> `^1.2.0` 解析而来；antd 6.6.4 不直接依赖它）。

---

## 1. 这个包解决什么

虚拟滚动：只渲染视口内的项，用一个占位元素撑出真实滚动高度。

| 能力 | 上游实现 |
|---|---|
| 范围计算（定高 / 动态高度两套） | `List.js:115-181` |
| 占位撑高 + 平移 | `Filler.js` |
| 动态高度收集 | `hooks/useHeights.js` |
| 滚动到指定项（含未测量高度的迭代） | `hooks/useScrollTo.js` |
| 横向滚动 | `List.js:291-297`、`:371-380` |
| 项区间尺寸查询 | `hooks/useGetSize.js` |
| 单处数据变更定位 | `utils/algorithmUtil.js:39-80` |
| 高度缓存 | `utils/CacheMap.js` |

`risk: high`、`pocRequired: false`、`消费者 5 个组件`。

---

## 2. 事实来源与文件规模

本地副本 `/tmp/rc-vlist-ref/`：

| 文件 | 行数 | 用途 |
|---|---|---|
| `es/List.js` | 511 | 主组件 |
| `es/ScrollBar.js` | 285 | **自绘滚动条 —— 本包不做，见 §5** |
| `es/hooks/useScrollTo.js` | 152 | `scrollTo` 的迭代同步 |
| `es/hooks/useHeights.js` | 78 | 高度收集 |
| `es/utils/algorithmUtil.js` | 79 | `getIndexByStartLoc` / `findListDiffIndex` |
| `es/Filler.js` | 59 | 占位 |
| `es/utils/CacheMap.js` | 32 | 高度缓存 |
| `es/hooks/useFrameWheel.js` / `useMobileTouchMove.js` / `useOriginScroll.js` / `useScrollDrag.js` | — | **滚轮 / 触摸拦截 —— 本包不做，见 §5** |
| `es/hooks/useGetSize.js` / `useDiffItem.js` / `useChildren.js` / `Item.js` | — | 辅助 |

---

## 3. antd 的契约（逐条）

### 3.1 三个开关（`List.js:62-64`）

```js
const useVirtual = !!(virtual !== false && height && itemHeight);
const containerHeight = Object.values(heights.maps).reduce((t, c) => t + c, 0);
const inVirtual = useVirtual && data &&
  (Math.max(itemHeight * data.length, containerHeight) > height || !!scrollWidth);
```

- `useVirtual`：**`height` 与 `itemHeight` 都是必需的真值**。任一缺失 ⇒ 走真实滚动。
- `containerHeight`：**已测量高度的总和**（不是 `itemHeight * length`）。
- `inVirtual`：估算总高（`max(itemHeight * len, containerHeight)`）超过容器高，**或**设了
  `scrollWidth`（横向）。⇒ 「数据太少、撑不满容器」时**不虚拟化**，直接全渲染。

### 3.2 范围计算（`List.js:120-181`）—— 核心

```js
if (!useVirtual) return { scrollHeight: undefined, start: 0, end: len - 1, offset: undefined };
if (!inVirtual)  return { scrollHeight: fillerInnerRef.current?.offsetHeight || 0,
                          start: 0, end: len - 1, offset: undefined };

let itemTop = 0, startIndex, startOffset, endIndex;
for (let i = 0; i < len; i += 1) {
  const cacheHeight = heights.get(getKey(data[i]));
  const currentItemBottom = itemTop + (cacheHeight === undefined ? itemHeight : cacheHeight);

  if (currentItemBottom >= offsetTop && startIndex === undefined) { startIndex = i; startOffset = itemTop; }
  if (currentItemBottom > offsetTop + height && endIndex === undefined) { endIndex = i; }
  itemTop = currentItemBottom;
}
if (startIndex === undefined) { startIndex = 0; startOffset = 0; endIndex = Math.ceil(height / itemHeight); }
if (endIndex === undefined) { endIndex = len - 1; }
endIndex = Math.min(endIndex + 1, len - 1);     // 多渲染一项给动画用
return { scrollHeight: itemTop, start: startIndex, end: endIndex, offset: startOffset };
```

**四条必须逐字照抄的判据**：

1. `start` 用 **`>=`**（`currentItemBottom >= offsetTop`），`end` 用 **`>`**
   （`currentItemBottom > offsetTop + height`）。前者含「项底正好贴住视口顶」，
   后者不含「项底正好贴住视口底」。改任一个都会差一项。
2. **未测量的项用 `itemHeight` 兜底**（`cacheHeight === undefined ? itemHeight : cacheHeight`）——
   不是 0，也不是跳过。
3. **末尾多渲染一项**（`endIndex + 1`，再 `min(len - 1)`）—— 上游注释写的是
   "We will render additional one item for motion usage"。
4. **`startIndex === undefined` 的兜底**（`:164-168`）——「滚到底后数据被截短」会走到这里，
   `endIndex` 取 `Math.ceil(height / itemHeight)`，**不是 `len - 1`**。

`scrollHeight` 就是循环结束时的 `itemTop`（累计总高），**不是** `height` 或 `len * itemHeight`。

### 3.3 纵向钳制（`List.js:229-239`）

```js
const maxScrollHeight = scrollHeight - height;
function keepInRange(newScrollTop) {
  let newTop = newScrollTop;
  if (!Number.isNaN(maxScrollHeightRef.current)) newTop = Math.min(newTop, maxScrollHeightRef.current);
  newTop = Math.max(newTop, 0);
  return newTop;
}
```

⚠️ **只有上界受 `NaN` 保护，下界永远执行 `Math.max(newTop, 0)`** —— 所以
`keepInRange(NaN)` 得到 `NaN`（`Math.max(NaN, 0)` 是 `NaN`），而 `keepInRange(Infinity)`
在 `maxScrollHeight` 为 `NaN` 时得到 `Infinity`。照抄，别「顺手修」。

### 3.4 横向钳制（`List.js:291-297`）

```js
const max = !!scrollWidth ? scrollWidth - size.width : 0;
tmpOffsetLeft = Math.max(tmpOffsetLeft, 0);
tmpOffsetLeft = Math.min(tmpOffsetLeft, max);
```

⚠️ 与纵向**不同**：横向先 `max(...,0)` 再 `min(...,max)`，且 `max` 在没设 `scrollWidth`
时是 **0**（⇒ 横向偏移被压成 0）。

### 3.5 高度收集（`useHeights.js`）

```js
const doCollect = () => {
  let changed = false;
  instanceRef.current.forEach((element, key) => {
    if (element && element.offsetParent) {          // ← 只有「已挂载且未隐藏」的才算
      const { offsetHeight } = element;
      const { marginTop, marginBottom } = getComputedStyle(element);
      const totalHeight = offsetHeight + parseNumber(marginTop) + parseNumber(marginBottom);
      if (heightsRef.current.get(key) !== totalHeight) { heightsRef.current.set(key, totalHeight); changed = true; }
    }
  });
  if (changed) setUpdatedMark(c => c + 1);
};
```

- **`element.offsetParent` 为假就跳过** —— 这是「隐藏的项不测」的判据（`display:none` 时
  `offsetParent` 为 `null`）。jsdom 下 `offsetParent` **恒为 `null`**，见 §7.1。
- 高度 = **`offsetHeight` + 上下 margin**（`parseNumber` 把 `"16px"` → 16，`NaN` → 0）。
- **只有真的变了才 `setUpdatedMark`**（否则每次收集都触发重算，滚动会卡）。
- 非 `sync` 时用 **微任务**（`Promise.resolve().then`）+ 自增 `promiseIdRef` 做**合并与失效**：
  只有最后一次的 `id` 匹配才执行。`cancelRaf()` 就是 `promiseIdRef.current += 1`。

`setInstanceRef(item, instance)`（`:56-74`）：注册时 `collectHeight()`；
**用 `!origin !== !instance` 判断「有无」的翻转**再决定 `onItemAdd` / `onItemRemove`
（同有无则两个 `false` 相等，不回调）。

### 3.6 滚动同步修正（`List.js:188-208`）

```js
const changedRecord = heights.getRecord();
if (changedRecord.size === 1) {
  const recordKey = [...changedRecord.keys()][0];
  const prevCacheHeight = changedRecord.get(recordKey);
  const startItem = mergedData[start];
  if (startItem && prevCacheHeight === undefined) {          // ← 三条件缺一不可
    const startIndexKey = getKey(startItem);
    if (startIndexKey === recordKey) {
      const realStartHeight = heights.get(recordKey);
      syncScrollTop(ori => ori + (realStartHeight - itemHeight));
    }
  }
}
heights.resetRecord();
```

⭐ 这是「向上滚动时首项的真实高度 ≠ `itemHeight` 导致跳动」的修正：
**恰好一项**高度变化 **且** 它**首次**被测量 **且** 它就是当前 `start` 项 ⇒ 按差值补偿 `scrollTop`。
`heights.resetRecord()` **每次布局后都执行**（清空 `diffRecords`）。

### 3.7 `scrollTo`（`useScrollTo.js`）

三种入参：

- `undefined` / `null` ⇒ `triggerFlash()`（上游是「闪一下滚动条」）。**本包无自绘滚动条 ⇒ no-op**（§5）。
- `number` ⇒ 直接 `syncScrollTop(n)`。
- `{ index }` 或 `{ key, align?, offset? }` ⇒ 进入**迭代同步**（最多 `MAX_TIMES = 10` 次）。

迭代的一步（`:13-113`）可拆成纯函数，见 §5.1：

```
index = 'index' in arg ? arg.index : data.findIndex(i => getKey(i) === key)
mergedAlign = targetAlign || originAlign
offset = getOffset(rawOffset, { getSize, align: mergedAlign })     // 非有限数 ⇒ 0
height = container.clientHeight
needCollectHeight = index < 0
if (height && index >= 0) {
  maxLen = min(data.length - 1, index)
  // 1) 累加到目标项的 top/bottom
  for i in 0..maxLen: itemTop = stackTop; itemBottom = itemTop + (cache ?? itemHeight); stackTop = itemBottom
  // 2) 检查「可见范围内有没有未测量的项」
  leftHeight = mergedAlign === 'top' ? offset : height - offset
  for i = maxLen down to 0:
    if (heights.get(key) === undefined) { needCollectHeight = true; break }
    leftHeight -= cacheHeight
    if (leftHeight <= 0) break
  // 3) 算目标
  switch mergedAlign:
    'top':    targetTop = itemTop - offset
    'bottom': targetTop = itemBottom - height + offset
    default:  // 不指定 align ⇒ 只在「已经在视口内」时不动
      if (itemTop < scrollTop) newTargetAlign = 'top'
      else if (itemBottom > scrollBottom) newTargetAlign = 'bottom'
  if (targetTop !== null) syncScrollTop(targetTop)
  if (targetTop !== syncState.lastTop) needCollectHeight = true
}
if (needCollectHeight) 再迭代一次（times + 1，带上 newTargetAlign 与 lastTop）
```

⚠️ **`align` 缺省时 `targetTop` 保持 `null`** ⇒ 该轮**不滚**，只是把 `newTargetAlign`
算出来留给下一轮。这是「目标已在视口内就不动」的实现方式，不是 bug。

`times === MAX_TIMES` 时上游打一条 dev warning（`Seems 'scrollTo' with rc-virtual-list
reach the max limitation`）。本包保留同义告警。

### 3.8 项尺寸查询（`useGetSize.js`）

返回 `getSize(startKey, endKey = startKey) → { top, bottom }`：

- 内部缓存 `key2Index`（Map）与 `bottomList`（累计高度数组）；
- 从 `bottomList.length` 起**增量**填充，命中两个 key 就 `break`；
- `top = bottomList[startIndex - 1] || 0`（注意是 `|| 0`，所以 `bottomList[-1]` 的 `undefined` 变 0）；
- `bottom = bottomList[endIndex]`；
- 未测量的项用 `heights.get(key) ?? itemHeight`。

⚠️ **缓存的生命周期挂在 `[mergedData, heights.id, itemHeight]` 上**（`heights.id` 是
`CacheMap` 每次 `set` 都自增的计数器）⇒ 高度一变，缓存整个重建。

### 3.9 `findListDiffIndex`（`algorithmUtil.js:39-80`）

「两个列表只有一个项不同、其余保持顺序」时用二分找那个项。

```js
if (originLen === 0 && targetLen === 0) return null;
shortList / longList 按长度分配（注意：长度相等时 long = origin）
const notExistKey = { __EMPTY_ITEM__: true };
getItemKey(item) = item !== undefined ? getKey(item) : notExistKey
let multiple = Math.abs(originLen - targetLen) !== 1;
for (i = 0; i < longList.length; i++) {
  if (getItemKey(shortList[i]) !== getItemKey(longList[i])) {
    diffIndex = i;
    multiple = multiple || getItemKey(shortList[i]) !== getItemKey(longList[i + 1]);
    break;
  }
}
return diffIndex === null ? null : { index: diffIndex, multiple };
```

⚠️ `notExistKey` 是**同一个对象字面量**（模块级常量），所以「两个都缺」时 `===` 成立
—— 这是它能工作的前提，不能改成每次新建对象。

### 3.10 `CacheMap`（`utils/CacheMap.js`）

```
maps = Object.create(null)   // ← 不是 {}，避免原型链上的键（如 "constructor"）误命中
id = 0                       // 每次 set 自增；外部用它做 useMemo 的依赖
diffRecords = new Map()      // 记录每个 key 的**上一次**值
set(key, value) { diffRecords.set(key, maps[key]); maps[key] = value; id += 1; }
get(key) { return maps[key]; }
resetRecord() / getRecord()
```

⚠️ `Object.create(null)` 与 `id` 自增都是契约的一部分（§3.8 依赖 `id`）。

### 3.11 Filler 的 DOM 结构（`Filler.js`）

`offsetY === undefined` 时（非虚拟路径）：

```html
<div>                                    <!-- outerStyle = {} -->
  <div class="{prefixCls}-holder-inner" style="display:flex; flex-direction:column">…</div>
</div>
```

`offsetY` 有值时：

```html
<div style="height:{height}px; position:relative; overflow:hidden">
  <div class="{prefixCls}-holder-inner"
       style="display:flex; flex-direction:column; position:absolute; left:0; right:0; top:0;
              transform:translateY({offsetY}px); margin-left:{−offsetX}px">…</div>
</div>
```

- RTL 时把 `margin-left` 换成 **`margin-right`**。
- ⚠️ 上游注释：**「Not set `width` since this will break `sticky: right`」** ——
  外层的 `height` 只设高度、不设宽度。照抄。
- 内层挂 `ResizeObserver`，`offsetHeight` 为真时回调 `onInnerResize`（即 `collectHeight`）。

### 3.12 容器与 holder 的样式（`List.js:21-24,433-448`）

```js
const ScrollStyle = { overflowY: 'auto', overflowAnchor: 'none' };
componentStyle = {
  [fullHeight ? 'height' : 'maxHeight']: height,
  ...ScrollStyle,
};
if (useVirtual) {
  componentStyle.overflowY = 'hidden';
  if (scrollWidth) componentStyle.overflowX = 'hidden';
  if (scrollMoving) componentStyle.pointerEvents = 'none';
}
```

外层容器额外有 `position: relative`；RTL 时加 `dir="rtl"`。

`overflowAnchor: 'none'` 必须保留 —— 否则浏览器会在内容变化时自动调整 `scrollTop`
（scroll anchoring），与我们的虚拟滚动打架。

### 3.13 项渲染（`useChildren.js`）

`list.slice(start, end + 1).map((item, index) => render(item, start + index, { style: { width: scrollWidth }, offsetX }))`

⚠️ 第三个参数给渲染函数的是 **`{ style: { width: scrollWidth }, offsetX }`**，
`width` 未设时是 `undefined`（React 会忽略）。`index` 是**全局下标**，不是切片内下标。

### 3.14 `extraRender` 的入参（`interface.d.ts`）

`{ start, end, virtual: inVirtual, offsetX: offsetLeft, scrollTop: offsetTop, offsetY: fillerOffset, rtl, getSize }`

### 3.15 `onVirtualScroll` 的去重（`List.js:247-265`）

`x` / `y` **任一变化**才回调（`lastVirtualScrollInfoRef` 比对），且 `x` 在 RTL 时取
**`-offsetLeft`**。

---

## 4. 边界

| 做 | 不做（`notDo` + 本轮的判断） |
|---|---|
| 范围计算、钳制、占位、动态高度、横向、`scrollTo` | ❌ **自绘滚动条**（`ScrollBar.js`，285 行）—— 见 §5 |
| `getSize` / `findListDiffIndex` / `CacheMap` | ❌ **滚轮 / 触摸拦截**（`useFrameWheel` / `useMobileTouchMove` / `useOriginScroll` / `useScrollDrag`）—— 见 §5 |
| 原生滚动驱动 | ❌ 任何颜色 / 圆角 / 阴影（`notDo`：不含任何视觉语义） |
| | ❌ `getIndexByStartLoc` —— 上游已无调用者（死导出），不移植 |

依赖：`@apollo-design/utils`（`observeResize` / `useResizeObserver` / `raf` / `cancelRaf`
—— 全部已在 utils，T2 复用成立）。**不依赖 theme / position / motion / portal / a11y。**

---

## 5. ⭐ 与上游的三处**有意**差异（都要登记 `COMPATIBILITY.md`）

### 5.1 不做自绘滚动条 ⇒ 用原生滚动

上游在 `useVirtual` 时把 holder 设成 **`overflowY: 'hidden'`**（`List.js:440`）并渲染一个
**自绘滚动条**。这不是性能考虑，而是**视觉**考虑 —— `ScrollBar.js:221-256` 里写死了：

```js
containerStyle = { position: 'absolute', width: 8, top: 0, bottom: 0, right: 0 };
thumbStyle = { position: 'absolute', borderRadius: 99,
               background: 'var(--rc-virtual-list-scrollbar-bg, rgba(0, 0, 0, 0.5))', cursor: 'pointer' };
```

**`borderRadius: 99` 与 `rgba(0, 0, 0, 0.5)` 是明确的视觉语义**，与本包的 `notDo`
（「不含任何视觉语义」）以及 R4（L2 引擎不得定义颜色/圆角/阴影）直接冲突。

⇒ **本包保持 `overflow: auto`，用原生滚动条**，把「滚动条长什么样 / 要不要隐藏」
交给消费方的 CSS（`scrollbar-width` / `::-webkit-scrollbar`）。

**连带的三条后果**（都必须写进契约，不能只写「简化了」）：

1. **不做滚轮 / 触摸拦截**。上游拦截滚轮的原因正是 `overflowY: hidden` 让原生滚动失效
   （`List.js:344-369` 手动挂 `wheel` / `DOMMouseScroll` / `MozMousePixelScroll`，
   `useMobileTouchMove` 处理触摸）。改成 `auto` 之后浏览器自己做，**嵌套滚动（到达边界后
   交给外层容器）也由浏览器的 scroll chaining 原生处理** —— 上游要自己实现
   `useOriginScroll` 来模拟这件事。
2. **`showScrollBar` 被接受但不生效**。声明它只为「消费方传了不会漏到 DOM 上」；
   可见性属 CSS。
3. **`scrollTo()` 无参调用（`null` / `undefined`）变成 no-op**。上游是
   `triggerFlash()`（闪一下自绘滚动条）。

### 5.2 `scrollTo` 的迭代被拆成纯函数

上游把「算一轮目标」写在 `useLayoutEffect` 里，与 React 的状态更新耦合。
本包把它抽成纯函数 `computeScrollTarget(...)`（§5.1 的 API 表），Vue 侧只负责循环。
**行为等价**（同样的 `MAX_TIMES = 10`、同样的 `lastTop` 比较、同样的 dev 告警），
但可以在无 DOM 环境下穷举测试。

### 5.3 `createSizeGetter` 的 `bottom` 在「键不存在」时返回 0

上游 `useGetSize.js` 的返回类型声明是 `{ top: number; bottom: number }`，
但**运行时会给出 `undefined`**（`bottomList[endIndex]` 而 `endIndex` 是 `undefined`）——
声明是假的。

本包按声明返回 **0**。注意实现里**不能**写成 `bottomList[endIndex ?? 0]` ——
那会让「键不存在」误返回**第 0 项的底**（一个看起来很合理的错值），比 `undefined` 更难发现。

---

## 6. API 设计

### 6.1 纯数据侧（可穷举测试）

| 函数 | 出处 | 说明 |
|---|---|---|
| `shouldUseVirtual(virtual, height, itemHeight)` | `List.js:62` | 三条件 |
| `isInVirtual(useVirtual, dataLength, itemHeight, containerHeight, height, scrollWidth)` | `:64` | 估算总高 vs 容器高 |
| `computeRange(input)` | `:120-181` | 核心循环，返回 `{ scrollHeight, start, end, offset }` |
| `keepInRange(newTop, maxScrollHeight)` | `:232-239` | 纵向钳制（NaN 语义照抄） |
| `keepInHorizontalRange(next, scrollWidth, containerWidth)` | `:291-297` | 横向钳制 |
| `computeScrollTarget(input)` | `useScrollTo.js:13-113` | 一轮迭代的纯计算 |
| `resolveScrollOffset(rawOffset, info)` | `:4-7` | `getOffset`，非有限数 ⇒ 0 |
| `findListDiffIndex(origin, target, getKey)` | `algorithmUtil.js:39-80` | 机械移植 |
| `createCacheMap()` | `CacheMap.js` | 带 `id` 与 `diffRecords` |
| `createSizeGetter(input)` | `useGetSize.js` | 返回 `getSize(startKey, endKey)` |

常量：`MAX_SCROLL_TO_TIMES = 10`。

### 6.2 有副作用的一侧

| 导出 | 出处 | 说明 |
|---|---|---|
| `useHeights(getKey)` | `useHeights.js` | 返回 `{ setInstanceRef, collectHeight, heights, updatedMark }`；微任务合并 |
| `VirtualList` 组件 | `List.js` | 容器 + holder（原生滚动）+ Filler + 项 |
| `VirtualList` 的实例方法 | `List.d.ts` | `nativeElement` / `scrollTo` / `getScrollInfo` |

`VirtualList` 的 props 与 `ListProps` 对齐，**减去** `styles` / `showScrollBar`（视觉）
与 `component`（本包不换标签）……

⚠️ `component` 上游允许换根标签（默认 `'div'`）。本包**保留**它（它不产生视觉语义，
且消费方可能依赖），但只接受字符串标签。

### 6.3 不移植的两个上游导出

| 上游导出 | 为什么不移植 |
|---|---|
| `getIndexByStartLoc` | 1.5.1 里**没有任何调用者**（死导出）。移植死代码只会增加未被测试覆盖的面 |
| `getSpinSize` | 只服务于自绘滚动条（§5.1）。不渲染滚动条 ⇒ 无用 |
| `MockList`（`mock.js`） | 上游的测试替身；本包的测试直接用真实组件 |

---

## 7. 测试策略

| 层 | 内容 | 状态 |
|---|---|---|
| L1 | §6.1 全部纯函数逐项断言（`>=` / `>` 的边界、NaN 语义、`-1` 起头、`Object.create(null)` 的危险键、稀疏数组的洞） | ✅ done |
| L2 | jsdom：滚动驱动窗口、横向 `scrollLeft`、高度收集（微任务合并 + 失效）、`scrollTo` 的四形态、`ResizeObserver` 触发的重新收集、首项高度补偿 | ✅ done |
| L3 | `virtual-list.test-d.ts`（含 10 条负例） | ✅ done |
| L4 | DOM 契约：容器 / holder / `{prefixCls}-holder-inner` 的结构与关键内联样式（`translateY` / 不设 `width` / `overflow-anchor: none`） | ✅ done |
| L5 | n/a —— 项上的 `aria-*` 由消费方通过 `innerProps` 注入，本包**只透传不生成**，没有自己的 a11y 语义 | n/a |
| L6 | n/a —— 零视觉产物（这正是 §5.1 的由来） | n/a |
| L7 | `tests/build/run.mjs --package virtual-list` | ✅ done |

实测：**162** unit + **64** 类型断言；覆盖率 **99.49 / 92.01 / 100 / 99.46**（门槛 95/90/95）。

### 7.1 测试侧的坑（不写下来下次还会踩）

1. **jsdom 下 `offsetParent` 恒为 `null`** ⇒ `useHeights` 的收集循环**一个都不收**
   （§3.5 的第一条判据）。必须用 `Object.defineProperty(el, 'offsetParent', ...)` 桩替。
2. **jsdom 里 `offsetHeight` 恒 0**，且 inline `height` 不产生布局 ⇒ 高度必须桩替。
3. **jsdom 的 `scrollTop` / `scrollLeft` 可以赋值且不钳制**，但**赋值不会派发 `scroll` 事件**
   ⇒ 模拟滚动必须「先赋值、再手动 `dispatchEvent(new Event('scroll'))`」。
4. 高度收集走**微任务**（`Promise.resolve().then`）⇒ 必须 `await nextTick()` 才能看到效果。
5. ⭐ **`ResizeObserver` 的注册发生在挂载后的下一拍**（`useResizeObserver` 用
   `flush: 'post'` 的 watcher）⇒ 挂载后**立刻** `MockResizeObserver.trigger()` 是**空转**：
   `instances` 还是 0。必须先 `await nextTick()` 两次再触发。
   本包的「Filler 尺寸变化」与「首项高度补偿」两个用例都因此返工过一次。
6. ⭐ **jsdom 量不到高度 ⇒ `scrollTo({ index })` 会一路迭代到 10 次上限**并打 dev 告警
   （`computeScrollTarget` 的「可见范围内有未测量的项」永远为真）。这与上游行为一致
   （同一个 `MAX_TIMES` 守卫），但测试里要么先把项桩成可测量让循环收敛，要么静音 spy。
   ⚠️ 静音时**必须等满 12 拍再 `mockRestore()`** —— 循环在测试体结束后还在跑，
   提前还原会让告警漏到 stderr 上。
7. ⭐ **Vue 运行时的 `setStyle` 不做 px 补全**。它只是 `style[name] = val`
   （React 的 `dangerousStyleValue` 会补；Vue 只在**模板编译期**补）。
   用 `h()` 在 TS 里写样式时传裸数字，jsdom 的 cssstyle 与浏览器都会**静默丢掉**这个声明
   （`el.style.height = 100` → `''`）。**所有数值样式必须自己拼单位**。
   症状极隐蔽：DOM 结构全对，只有高度/宽度是空的。

### 7.2 变异验证（确认断言不是「永远绿」）

本轮实际跑了 **8 处**变异，全部被抓到：

| 变异 | 结果 |
|---|---|
| `computeRange` 的 `start` 判据 `>=` 改成 `>` | ✅ L1 失败 |
| `computeRange` 的 `end` 判据 `>` 改成 `>=` | ✅ L1 失败 |
| 去掉「末尾多渲染一项」的 `endIndex + 1` | ✅ L1 失败 |
| 未测量项的兜底从 `itemHeight` 改成 `0` | ✅ L1 失败 |
| `keepInRange` 的下界也加 NaN 保护 | ✅ L1 失败 |
| `CacheMap.maps` 从 `Object.create(null)` 改成 `{}` | ✅ L1 失败 |
| `findListDiffIndex` 的哨兵改成每次新建对象 | ✅ L1 失败 |
| `keepInHorizontalRange` 没设 `scrollWidth` 时不压成 0 | ✅ L1 失败 |

---

## 8. 待裁决

### P1 · 是否提供 `showScrollBar` 的等效能力

本包接受该 prop 但不生效（§5.1 第 2 条）。若将来发现消费方（Select / Table）
真的依赖「滚动条只在滚动时出现」，需要在 **ui 层**用 CSS 实现，而不是回到 JS 自绘。

### P2 · 横向滚动是否要保留 `scrollWidth` 语义

上游：设了 `scrollWidth` ⇒ 强制 `inVirtual`，且横向偏移被 `scrollWidth - size.width` 钳制。
本包照抄。若将来发现 `scrollWidth` 只是「内容宽度」而消费方期望原生横向滚动，
需要重新对齐。

---

## 9. 这个包**没有**证明什么

1. **没有证明真实浏览器下的滚动位置正确** —— jsdom 无布局引擎，`offsetHeight` 恒 0、
   `scrollTop` 赋值不回读。所有 jsdom 用例走的都是「桩替喂数字」的路径。
   真实滚动属 L6。
2. **没有证明原生滚动与上游自绘滚动条在视觉上等价** —— 这正是 §5.1 的差异。
   本包只保证「能滚、范围对」，不保证「滚动条长得一样」。
3. **没有证明嵌套滚动的边界交接与上游一致** —— 上游用 `useOriginScroll` 手工模拟，
   本包交给浏览器的 scroll chaining。**这是可观察差异**，需真实浏览器验证。
4. **没有证明动态高度在「向上滚动」时完全不跳** —— §3.6 的补偿逻辑依赖
   `heights.getRecord()` 的「恰好一项变化」前提。数据快速切换时该前提可能不成立，
   上游的 `startItem &&` 判断只是兜底。
5. **没有证明 `scrollTo` 的 10 次上限在所有场景下够用** —— 上游自己也只打了一条
   dev warning 而没有保证。
6. **没有证明 `CacheMap` 的 `Object.create(null)` 在极端 key 下的行为** ——
   我们只测了 `'constructor'` / `'__proto__'` 这类明显危险值。
7. **没有证明横向滚动（`scrollWidth`）在真实浏览器里可用** —— §5.1 把上游的
   `margin-left` 模拟换成了「给 Filler 内层显式宽度 + 外层 `overflow: visible`」，
   让溢出交给 holder 的原生横向滚动。**这条路径只有 jsdom 的样式断言，没有真实排版验证**
   （abspos 元素的溢出是否计入滚动容器的可滚动区域，属浏览器行为）。
8. **没有证明「不做滚轮拦截」在嵌套滚动下的体感与上游一致** —— 上游用
   `useOriginScroll` 手工判断边界并把事件交还给外层；本包依赖浏览器的 scroll chaining。
   两者在「到边界时是否把剩余 delta 交给外层」上**可能不同**。
