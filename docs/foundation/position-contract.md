# `position` 契约文档

> **适用范围**：DOM 测量层（`position` 的剩余工作）。
> 几何内核（对齐点 / 翻转 / 平移 / 箭头）已在 AR1 PoC 中完成并由 `oracle.js` 差分证明，
> 结论见 `ARCHITECTURE.md` §9.1。本文档只处理**它之外的那一半**。

---

## 1. 这个包解决什么

antd 的 `@rc-component/trigger` 把两件性质完全不同的事揉在一个 hook 里：

| 性质 | 内容 | 可测性 |
|---|---|---|
| **纯几何** | 对齐点、翻转、平移、箭头位置、可见区裁剪 | 纯函数，生成式用例可穷举 |
| **DOM 测量** | `getBoundingClientRect` 采集、滚动容器逐级裁剪、CSS `scale`、`getPopupContainer` 坐标系 | 依赖真实布局，jsdom 下退化 |
| **生命周期** | 触发时机、延迟、关闭、层级栈、portal 挂载 | 与 Vue 组件生命周期强耦合 |

本项目把它们拆成三个包：`position`（几何 **+ 测量**）、`overlay`（生命周期）、`portal`（挂载与 z-index）。

⚠️ **「测量」归 `position`，不归 `overlay`。** 这条边界在 `dependencies.json` 的
`purpose`、本包的 `notDo` 与 `ARCHITECTURE.md` §9.1 三处一致写明
（§9.1 原文：「注意别把后者误派给 `overlay`」）。

⚠️ **但包内源码的注释与之矛盾，需要修**：`src/index.ts` 与 `src/types.ts` 的头部
都写着「❌ DOM 测量（getBoundingClientRect / collectScroller）—— 由 overlay 完成后以
Rect 传入」。按事实来源优先级（`registry/*.json` > 源码注释），**注释是错的**，
本次实现会一并改正。留着它的代价很大：下一个人读到注释就会把测量层写进 `overlay`。

---

## 2. 事实来源

| 来源 | 版本 / 位置 | 用途 |
|---|---|---|
| antd 兼容目标 | 6.6.4 | `registry/components.json` 的 `antdVersion` |
| `@rc-component/trigger` | **3.10.1** | 定位的行为判据。本地无副本（React 包，H5 禁止依赖），已下载到 `/tmp/rc-trigger-ref/` 供本次分析 |
| `es/hooks/useAlign.js` | 531 行 | `onAlign` 在 **61–505** 行；**94–226 行**是 DOM 测量侧；228 行之后是几何侧（已由 `oracle.js` 机械移植并差分） |
| `es/util.js` | 136 行 | `collectScroller`（30–46）、`getVisibleArea`（75–137）、`getWin`、`toNum` |
| `@rc-component/util/Dom/isVisible` | 1.13.0 | 早退判定；本仓库已在 `@apollo-design/utils` 中复刻 |

**禁止**凭记忆描述 antd 行为。本文件里的每一条公式都注明了行号，可回查。

---

## 3. antd 的 DOM 测量侧契约（逐条）

以下是 `onAlign`（`useAlign.js` 94–226 行）的**求值顺序**。顺序不是风格问题 ——
每一步都依赖上一步的副作用，改变顺序会得到不同的数字。

| # | 动作 | 行 | 要点 / 坑 |
|---|---|---|---|
| 1 | `scrollerList = collectScroller(popupEle)` | 75–80 | 只在 `popupEle` 变化时重算（React `useMemo`）。等价于「挂在 popup 上、不是每次对齐都走一遍 DOM 树」 |
| 2 | `win = popupEle.ownerDocument.defaultView` | 98 | 不用全局 `window` —— 支持 iframe |
| 3 | `popupPosition = getComputedStyle(popupEle).position` | 99–101 | 给 placeholder 用 |
| 4 | 记录 inline style：`left/top/right/bottom/overflow/overflowX/overflowY` | 102–108 | 收尾要逐项还原 |
| 5 | 插 placeholder div 到 `popupEle.parentElement` | 117–123 | 尺寸取 `offsetWidth/offsetHeight`，位置取 `offsetLeft/offsetTop`，`position` 同上。**目的**：popup 被临时改成 `left:0` 时不引起父容器塌陷（塌陷会改变后续 `getBoundingClientRect`） |
| 6 | **归零** `left/top = 0`、`right/bottom = auto`、`overflow = hidden` | 126–130 | 见 §3.1：这一步是 `getPopupContainer` 免换算的关键 |
| 7 | `targetRect` | 133–151 | 数组形态 `[x, y]` → `{x, y, width: 0, height: 0}`；元素形态 → `getBoundingClientRect()`，并有 `rect.x ?? rect.left` 的兼容分支 |
| 8 | `popupRect = popupEle.getBoundingClientRect()` | 152–158 | 归零**之后**测 |
| 9 | `const { width, height } = getComputedStyle(popupEle)` | 153–156 | 是 **CSS 声明值**（字符串，如 `"120px"`），不是实测值 —— 算 scale 的分母 |
| 10 | 读 `documentElement` 的 `clientWidth/Height`、`scrollWidth/Height`、`scrollTop/Left` | 159–166 | 构造两个区域 |
| 11 | `visibleRegion = {0, 0, clientWidth, clientHeight}`；`scrollRegion = {-scrollLeft, -scrollTop, scrollWidth - scrollLeft, scrollHeight - scrollTop}` | 173–184 | `scrollRegion` 的**原点是 (-scrollLeft, -scrollTop)**，不是 0 |
| 12 | `htmlRegion` 归一化 | 185–193 | 只有 `'scroll'` / `'visibleFirst'` 被保留，其余（含 `undefined`）一律降级为 `'visible'` |
| 13 | `scrollRegionArea = getVisibleArea(scrollRegion, scrollerList)`；`visibleRegionArea = getVisibleArea(visibleRegion, scrollerList)` | 194–195 | **两个都算**，不短路 |
| 14 | `visibleArea = htmlRegion === 'visible' ? visibleRegionArea : scrollRegionArea` | 196 | |
| 15 | `adjustCheckVisibleArea = isVisibleFirst ? visibleRegionArea : visibleArea` | 200 | `visibleFirst` 的含义：用视口区做**翻转判定**，用滚动区做**几何** |
| 16 | **镜像测量**：`left/top = auto`、`right/bottom = 0` → `popupMirrorRect` | 203–207 | 唯一用途是算 `offsetR` / `offsetB`（`dynamicInset` 且对齐点为右/下时启用，见 `useOffsetStyle.js` 19–32） |
| 17 | 还原 inline style + 移除 placeholder | 209–217 | |
| 18 | `scaleX = toNum(round(popupWidth / parseFloat(cssWidth) * 1000) / 1000)` | 220–221 | `toNum` = `Number.isNaN ? 1 : n`。**分母为 0 时（jsdom！）得到 NaN → 兜底 1** |
| 19 | **早退**：`scaleX === 0 \|\| scaleY === 0 \|\| (isDOM(target) && !isVisible(target))` → `return` | 224–226 | 早退时**不更新** `offsetInfo`，`ready` 保持上一次的值 |
| 20 | 几何计算 | 233–477 | 由 `oracle.js` 覆盖 |
| 21 | `offsetX4Right = popupMirrorRect.right - popupRect.x - (nextOffsetX + popupRect.width)` | 481–482 | 距**容器**右缘的距离 |
| 22 | `scaleX === 1` 时 `Math.floor(nextOffsetX)` | 483–490 | **只在无缩放时取整** —— 有缩放时取整会放大误差 |
| 23 | 输出统一除以 scale：`offsetX / scaleX`… | 491–502 | `alignPopup` 已按此实现 |
| 24 | `onPopupAlign?.(popupEle, nextAlignInfo)` | 478 | 回调时机在取整**之前** |

### 3.1 为什么 `getPopupContainer` 不需要换算（本轮最重要的发现）

直觉上，浮层挂在 `getPopupContainer()` 返回的容器里，而 `getBoundingClientRect()`
给的是**视口**坐标，两者原点不同 —— 似乎必须显式减去容器的偏移。

**antd 不这么做，而且是对的。** 关键在于第 6 步的**归零**：

```
popupRect 是在「popup 位于其包含块的 (0,0)」时测得的
  ⇒ popupRect.x/y 就等于包含块的视口坐标
  ⇒ nextOffsetX = targetAlignPoint.x − popupAlignPoint.x
                 = 目标视口x − 容器视口x
                 = 目标在容器坐标系里的偏移
```

也就是说，**容器偏移在减法里自动消掉了**，无论容器在页面哪个位置、有没有
`position: relative`、`position: fixed` 与否，都不需要额外项。
`offsetR` / `offsetB` 同理（第 16 步在容器右下角测镜像矩形）。

所以本包的「`getPopupContainer` 坐标系解析」**不是**一个换算函数，
而是一条**必须在归零位置测量**的不变量。这条不变量必须由测试钉住 ——
否则后人「顺手优化」掉归零步骤，浮层会在非 body 容器下整体错位。

### 3.2 `getVisibleArea` 的逐项公式（`util.js` 75–137）

对每个滚动容器（`HTMLBodyElement` / `HTMLHtmlElement` 直接跳过）：

```
读 computedStyle : overflow, overflowClipMargin, border{Top,Bottom,Left,Right}Width
eleRect          : getBoundingClientRect()
eleOut{W,H}      : offsetWidth / offsetHeight          （含边框与滚动条）
eleInner{W,H}    : clientWidth / clientHeight          （含 padding，不含边框/滚动条）
borderXNum       : parseFloat(borderXxxWidth)  NaN → 0

scaleX = toNum(round(eleRect.width  / eleOutW * 1000) / 1000)     NaN → 1
scaleY = toNum(round(eleRect.height / eleOutH * 1000) / 1000)

滚动条尺寸（注意先减边框再乘 scale）：
eleScrollW = (eleOutW − eleInnerW − borderL − borderR) * scaleX
eleScrollH = (eleOutH − eleInnerH − borderT − borderB) * scaleY

缩放后的边框：scaledBorderX = borderXNum * scale（X 轴用 scaleX，Y 轴用 scaleY）

只有 overflow === 'clip' 时才有 clip margin：
clipMarginW = parseFloat(overflowClipMargin) * scaleX
clipMarginH = parseFloat(overflowClipMargin) * scaleY      否则为 0

eleLeft   = eleRect.x + scaledBorderLeft  − clipMarginW
eleTop    = eleRect.y + scaledBorderTop   − clipMarginH
eleRight  = eleLeft + eleRect.width  + 2*clipMarginW − scaledBorderLeft − scaledBorderRight − eleScrollW
eleBottom = eleTop  + eleRect.height + 2*clipMarginH − scaledBorderTop  − scaledBorderBottom − eleScrollH

逐级取交集（与本项目 clipArea 完全一致）
```

⚠️ `eleRight` 用 `eleLeft` 起算而不是 `eleRect.x + eleRect.width`，
因为 `eleLeft` 已经含了 clip margin 与左边框；直接改写会丢掉这两项。

### 3.3 `collectScroller`（`util.js` 30–46）

从 `ele.parentElement` 起逐级向上，读 `overflowX` / `overflowY` / `overflow`，
**任一**命中 `['hidden', 'scroll', 'clip', 'auto']` 即收集。

⚠️ 注意 `overflow: visible`（默认值）不收集 —— 但 CSS 规范里
`overflowX: hidden` 会把 `overflowY` 的 `visible` 计算成 `auto`。
antd 读的是**计算值**，所以这个组合会被正确地收进来；
手写 `getComputedStyle` 时不能改成读 inline style。

---

## 4. 边界

**做**：

- 上述 DOM 侧采集（滚动容器收集、可见区裁剪、矩形测量、scale、早退判定）
- 归零 + 镜像 + 还原的「测量会话」，并保证异常时不泄漏 inline style

**不做**（分属别的包，写在 `notDo` 里）：

| 不做 | 归属 |
|---|---|
| 触发时机 / 显隐延迟 / 关闭行为 / 层级栈 | `overlay` |
| 挂载、portal 容器创建、z-index | `portal` |
| 任何视觉样式与 DOM 结构（只输出数字） | `ui` |
| 把数字写回 `style.left/top`（`useOffsetStyle` 的事） | `overlay` |
| 任何 Vue 依赖 | —— 本包是纯 TS |

---

## 5. API 设计

新增 `src/measure.ts`。设计与几何内核同一条原则：
**能纯函数化的部分一律纯函数化，DOM 侧只做「取值」这一件不可测的事。**

### 5.1 纯数据侧（可穷举测试）

```ts
/** DOMRect 的最小投影。兼容只有 left/top 的旧实现（antd 的 `x ?? left`）。 */
export function toRect(rect: RectLike): Rect;

/** 数组态 target（鼠标右键菜单等场景）→ 0×0 矩形。 */
export function pointRect(x: number, y: number): Rect;

/** htmlRegion 归一化：非 'scroll'/'visibleFirst' 一律降级为 'visible'。 */
export function normalizeHtmlRegion(value: string | undefined): HtmlRegion;

/** 逐级裁剪（已有 clipArea 的 DOM 侧专用包装，行为完全一致）。 */
export function clipVisibleArea(initArea: Area, clips: readonly Area[]): Area;

/** 由镜像矩形反解「距容器右/下缘的距离」。 */
export function mirrorOffsetR(mirror: Rect, popup: Rect, offsetX: number): number;
export function mirrorOffsetB(mirror: Rect, popup: Rect, offsetY: number): number;

/** scale === 1 才取整 —— 有缩放时取整会放大误差。 */
export function scaleFloor(value: number, scale: number): number;

/** antd 的 toNum：NaN → 1。 */
export function toSafeNum(value: number, fallback?: number): number;
```

### 5.2 DOM 侧

```ts
export interface MeasureInput {
  popupEle: HTMLElement;
  target: Element | readonly [number, number];
  htmlRegion?: 'visible' | 'scroll' | 'visibleFirst';
  /** 复用已收集的滚动容器；省略则现算 */
  scrollers?: readonly Element[];
}

export interface MeasureResult {
  target: Rect;
  popup: Rect;
  /** right/bottom 归零后的镜像矩形，仅用于 offsetR/offsetB */
  mirror: Rect;
  scaleX: number;
  scaleY: number;
  /** 按 htmlRegion 选好的几何用区域 */
  visible: Area;
  /** 翻转判定用区域（visibleFirst 时与 visible 不同） */
  check: Area;
}

/** 不可测（scale 为 0 或目标不可见）时返回 null，对应 antd 的早退。 */
export function measureAlign(input: MeasureInput): MeasureResult | null;

export function collectScroller(ele: Element): HTMLElement[];
export function getVisibleArea(initArea: Area, scrollers: readonly Element[]): Area;
export function getViewportArea(doc: Document): Area;
export function getScrollArea(doc: Document): Area;
export function measureRect(ele: Element): Rect;
export function measureScale(ele: Element, rect: Rect, win: Window): { scaleX: number; scaleY: number };
```

`measureAlign` 是唯一有副作用的函数，必须 `try/finally` 保证还原。

### 5.3 依赖

`measureAlign` 复用 `@apollo-design/utils` 的 `isVisible`（T2）。
`getScroll` **不使用**：它只返回垂直滚动量且类型为 `number | undefined`，
而 `scrollRegion` 需要同时要 `scrollLeft` 与 `scrollWidth/Height`，
直接读 `documentElement` 更贴合参考实现。

这也解释了 `package.json` 里那条「声明了但未使用」的 `@apollo-design/utils` 依赖 ——
它是为测量层预留的，本次实现后会真正被用到。

---

## 6. 与 antd 的差异

**本次不新增 `D<n>`。** 判据在 `COMPATIBILITY.md` §9：`D<n>` 只登记**行为差异**，
而校验器会从 §9.2 的表格**刮取**真实存在的编号 —— 把内部架构写进去会污染编号空间，
让「项目到底与 antd 差在哪」这个问题重新变得不可回答。

测量层的目标是**与参考实现逐位一致**，下面是三条「看起来像差异、其实不是」的拆分，
以及用什么断言钉住它们：

| 拆分 | 为什么不是差异 | 钉住它的断言 |
|---|---|---|
| `getVisibleArea` 拆成「DOM 采集」+「纯裁剪 `clipArea`」 | 产出的 `Area` 四个边与 antd 的取值逐位相同（公式见 §3.2） | L1 用假 DOM 对象把 §3.2 的每个中间量都断言一遍，包括 `eleRight` 从 `eleLeft` 起算这一条 |
| 测量与几何拆成两阶段（antd 在 `onAlign` 里交错） | 几何是纯函数，输入相同则输出相同；副作用只剩测量阶段 | `mirrorOffsetR/B` 与 `scaleFloor` 各自单测，再与 `alignPopup` 组合 |
| 早退判定抽成纯函数（§8 P1） | 只是把 `scaleX===0 \|\| scaleY===0 \|\| !isVisible(target)` 换个位置 | 三条件的所有组合都被穷举；输入侧仍用 `@apollo-design/utils` 的 `isVisible` |

### 6.1 三条**必须照抄**的顺序与判据（实测踩到，写在这里防止后人「顺手优化」）

实现时逐行对过 `useAlign.js` / `util.js`，有三处「看起来可以改得更好、改了就与 antd 分叉」：

| 位置 | antd 原文 | 看起来更好的写法 | 为什么不能改 |
|---|---|---|---|
| placeholder（`useAlign.js` 117–123） | **先** `appendChild`，**再**读 `offsetLeft/offsetTop/offsetWidth/offsetHeight` 并设样式 | 先设样式再插入，读到的尺寸更"干净" | 插入一个空块级元素本身会改变父容器布局（flex/grid 下会推移既有子项），于是**插入前后**读到的 `offsetLeft` 是**不同的数**。改了顺序就是不同的输入。已由 L2 用例「插入发生在读取 offsetLeft 之前」钉住（用 `childElementCount` 断言读取瞬间占位元素已在 DOM 里） |
| body/html 跳过（`util.js` 80） | `ele instanceof HTMLBodyElement \|\| ele instanceof HTMLHtmlElement` | 改成 `ele === ele.ownerDocument.body \|\| ...`，更"语义化"且跨 frame 更"正确" | 两种写法**同 realm 等价、跨 iframe 不等价**：父窗口的 `HTMLBodyElement` 与 iframe 的不是同一个构造函数，所以 antd 在跨 frame 时**不会**跳过 iframe 的 body。这是上游既有行为。按「antd 是规格」复刻它 —— 静默修正比已知的怪癖更危险。只额外加了 `typeof` 守卫以便 SSR 下不抛 `ReferenceError`，不改变浏览器行为 |
| 测量期的 computed `width/height`（`useAlign.js` 153–156 → 219–221） | 在**归零之后、还原之前**取，用于算 scale；还原**之后**才算比值 | 还原后再取一次，代码更直白 | 归零会把 `right/bottom` 改成 `auto`，可能改变可用宽度 ⇒ 归零态与还原态的 computed 宽度**可以不同**。antd 用的是归零态的值，我们也必须用归零态的值 |

### 6.2 一处**有意**的加强：`try/finally`

antd 的 `onAlign` 没有 `try/finally`：任一步抛异常，`left:0 / right:0 / overflow:hidden`
会永久留在浮层的 inline style 上，placeholder 也会留在容器里。

这里用 `finally` 包住整个测量段。**正常路径下可观测行为与 antd 完全一致**
（还原发生在早退之前，这点也是照抄 antd 209–217 → 224 的顺序）；
差异只出现在异常路径，而异常路径下 antd 的行为是「把浮层留在错误位置」，
不构成需要复刻的契约。

已由 L2 用例「抛异常路径也要还原」钉住：断言异常照常向上抛（`toThrow`），
同时 7 个 inline 键复原、placeholder 被移除。

唯一与数值相关的既有差异是 **D13**（相交面积），已登记、已裁决
（`intersection-area-clamp`），`oracle.js` 上的 `clampIntersection` 开关使
「这是唯一差异」本身成为可证伪断言。测量层不引入新的数值差异。

⚠️ 若实现过程中发现**真实**的行为偏差，必须在 `COMPATIBILITY.md` §9.2 追加一行
（编号顺延 D19）并在 §9.3 登记决策 —— 反过来，**不要**为了「看起来有登记」而把架构
决策写进 `D<n>`。

---

## 7. 测试策略

| 层 | 内容 | 状态 |
|---|---|---|
| L1 | 纯数据侧：§5.1 全部函数；`getVisibleArea` 逐项复算 §3.2 的每个中间量 | ✅ `measure.test.ts`（53 用例） |
| L2 | jsdom 交互：测量会话的副作用（7 个 inline 键与 placeholder 必须还原）、早退/异常路径不泄漏、归零不变量（§3.1）、placeholder 插入时机 | ✅ `measure-session.test.ts`（9 用例） |
| L3 | `*.test-d.ts`（含负例） | ✅ `measure.test-d.ts`（34 断言） |
| L4/L5/L6 | 不适用（无组件 DOM 契约、无视觉产物）；L6 属 `overlay` + `position` 集成后 | n/a |
| L7 | `tests/build/run.mjs` | 待测 |

⚠️ **`testLayers['L2-interaction']` 原先是 `n/a`**，理由写的是「几何内核不接触 DOM」。
测量层落地后这一条**已改成 `done`** —— 否则就是 `layerNotes` 自己警告过的
「用 n/a 掩盖未做」。

### 7.1 jsdom 下怎么测「有布局」的公式

jsdom 没有布局引擎，直接测会让所有公式退化成 0。实测可用的三条支点（都已验证）：

1. **inline style 会传导到 computed style** —— `overflow` / `overflowX` /
   `border-*-width` / `width` / `height` / `position` / `overflow-clip-margin` 都能
   通过设置 inline 样式来控制 `getComputedStyle` 的返回值。**不需要** spy
   `getComputedStyle`，也就不需要把假对象断言成 `CSSStyleDeclaration`（H10）。
2. **`offsetWidth/offsetHeight/clientWidth/clientHeight` 可以 `Object.defineProperty`**
   逐个覆盖；`getBoundingClientRect` 可以整个替换成返回 `new DOMRect(...)`。
   `DOMRect` 构造器在 jsdom 下可用。
3. ⚠️ **computed `border-*-width` 的默认值是 `"16px"`** —— 既不是 CSS 初始值
   `medium`(3px) 也不是 0。测试里每个元素的四条边都必须显式归零，
   否则公式里会混进这个 16，断言变得无法解释。

⚠️ **`cloneNode` 不会复制挂在实例上的桩**（`getBoundingClientRect` 等），
克隆体的 rect 会退回恒 0 进而走早退分支。要造"无父元素"的浮层，
应当先 `stubEle` 再 `remove()`。

---

## 8. 待裁决

### P1 · jsdom 下 `isVisible` 恒为 false

`@rc-component/util` 的 `isVisible` 依赖 `offsetParent` / `getBBox` / `getBoundingClientRect`。
jsdom 没有布局引擎：`offsetParent` 为 `null`，`getBoundingClientRect()` 全 0
⇒ **`isVisible` 在 jsdom 里恒为 false**，于是测量会话永远走早退分支返回 `null`。

- **选项 A**：测量层把「早退判定」做成**可注入参数**，默认用 `isVisible`，
  测试时注入一个返回 `true` 的桩。好处：不污染生产语义；
  坏处：早退这条分支本身在 jsdom 下测不到。
- **选项 B**：早退判定抽成纯函数 `shouldMeasure(scaleX, scaleY, targetVisible)`，
  测量层只负责把三个布尔/数字算好再问它。好处：早退逻辑**可以**被穷举测试；
  注入点更窄（只注入「目标是否可见」这一个布尔）。
- **建议**：**B**。A 的两个选项其实不冲突 —— B 是「怎么组织」，A 是「测试怎么注入」。
  采用 B 之后，A 的注入自然退化成传一个布尔，不再需要替换整个 `isVisible`。

### P2 · 测量失败时是否告警

早退返回 `null` 时，调用方（未来的 `overlay`）拿不到任何原因。
- **选项 A**：静默返回 `null`，由调用方决定。
- **选项 B**：返回 `null` 的同时在 dev 下 `warning()` 一次。
- **建议**：A。测量早退是**正常控制流**（目标被隐藏时每次都会发生），
  打成 warning 会瞬间刷屏。

---

## 9. 这个包**没有**证明什么

1. **没有证明真实浏览器下的位置正确**。`getBoundingClientRect` 在 jsdom 里恒为 0、
   `offsetWidth/clientWidth` 恒为 0 ⇒ 不桩替时测量层走的永远是**退化分支**
   （`0/0 → NaN → toSafeNum → scale = 1`）。L1/L2 证明的是
   「**给定**一组度量值，公式与副作用处理正确」，**不能**证明浏览器量出来的
   那组值就是我们假设的样子。真实位置的证明属于 L6 视觉回归，
   需要 `overlay` + `position` 集成后做。
2. **没有证明滚动条宽度在真实浏览器里被正确读出**。§3.2 的扣除**公式**已被逐项钉住
   （含「先减边框再乘 scale」的顺序），但**输入** `offsetWidth − clientWidth`
   在测试里是 `defineProperty` 灌进去的。jsdom 下它恒为 0，
   真实滚动条是否等于这个差值（以及 `overlay` 滚动条与经典滚动条的量法差异）未验证。
3. ~~没有证明 `getPopupContainer` 在真实容器下不错位~~ —— §3.1 的不变量**现在已被钉住**：
   L1 用「rect 随 inline 定位变化」的桩构造了容器在 `(100,200)` 的场景，
   断言归零后测得的 `popupRect` **就是**容器的视口坐标。
   仍未证明的是：真实浏览器在 `left:0;top:0` 时 `getBoundingClientRect()`
   确实返回容器原点（例如容器自身有 `transform` 时会不成立）。
4. **没有证明 `overflow: clip` 的真实裁剪语义**。已验证 jsdom **会**把 inline 的
   `overflow-clip-margin` 传导到 computed style（所以公式的两个分支都能测到），
   但 CSS 里它还可以取 `content-box` / `padding-box` 等关键字 ——
   `parseFloat` 会全部得到 0，与真实语义是否一致未验证。
5. **没有证明与 antd 参考截图逐像素一致** —— 那是 AR1 PoC 的验收项之一，
   至今未做（缺真实 DOM 与渲染结果），需 `overlay` 集成后补。
6. **没有证明 §6.1 的 body/html 判定在跨 iframe 下与 antd 一致**。
   我们照抄了 `instanceof`，同 realm 下有断言，跨 frame 场景没有测试 ——
   因为 jsdom 里构造跨 realm 的 `HTMLBodyElement` 成本过高，且该路径在
   「浮层挂在 iframe 内」这种罕见配置下才会触发。
