# `overlay` 契约文档

> G1/G2 分析产物。**先于实现存在**（`AGENTS.md` §2：步骤 3 的产物必须先于步骤 5）。
> 事实来源优先级：用户指令 > 仓库规范文件 > `registry/*.json` > antd 固定版本产物/源码 > 官方文档 > 模型先验。

---

## 1. 这个包解决什么

`registry/dependencies.json` 的 purpose 原文：

> 锚定浮层的生命周期编排。替代 @rc-component/trigger 的触发时机与生命周期部分。
> **定位几何在 @apollo-design/position，挂载在 @apollo-design/portal** —— 本包只编排
> 「何时开、何时关、谁在上层」。

拆包理由（`ARCHITECTURE.md` §3 表格）：原设想的一个 `overlay` 包同时承担「纯几何」与
「生命周期」。前者是纯函数、极易测试；后者与 DOM/生命周期强耦合，是全项目最大风险点 **AR1**。
拆开后 AR1 的 PoC 只用纯函数 + 尺寸测量完成，不必先实现触发时机与层级栈。

⚠️ **AR1 的剩余风险在 `position`，不在本包**。`ARCHITECTURE.md` §9 明确：

> 注意别把后者误派给 `overlay` —— 按 `dependencies.json` 的职责划分，`overlay` 只管触发时机与
> 显隐生命周期，"尺寸测量"明确写在 `position` 的 purpose 里。

所以本包**不碰** `getBoundingClientRect`、不碰滚动容器裁剪、不碰 `getPopupContainer` 坐标系。

---

## 2. 事实来源

| 来源 | 版本 / 路径 | 取用范围 |
|---|---|---|
| `@rc-component/trigger` | **3.10.1**（antd 6.6.4 声明 `^3.10.1`） | `es/index.js`、`es/hooks/useAction.js`、`es/hooks/useDelay.js`、`es/hooks/useWinClick.js`、`es/context.js` |
| `@rc-component/portal` | **2.2.1**（`trigger@3.10.1` 声明 `^2.2.1`） | `es/useEscKeyDown.js` |
| antd | 6.6.4 | `es/tooltip/index.js`（delay 默认值）、`es/dropdown/dropdown.js`（delay + contextMenu⇒alignPoint）、`es/_util/hooks/useZIndex.js`（**用于划清边界，不是本包的范围**） |

⚠️ 本轮这两个 rc 包是**新下载**的（仓库里没有缓存）。`/tmp` 不是持久存储，下次会话可能已丢失：

```bash
ls /tmp/rc-src/package/es/index.js || {
  mkdir -p /tmp/rc-src && cd /tmp/rc-src
  npm pack @rc-component/trigger@3.10.1 && tar -xzf rc-component-trigger-3.10.1.tgz
  npm pack @rc-component/portal@2.2.1 && mkdir -p portal && tar -xzf rc-component-portal-2.2.1.tgz -C portal
}
```

⭐ **一个必须写下来的发现**：`@rc-component/trigger` 3.10.1 的产物里**没有任何 `Escape` /
`keydown` 字样**（全 `es/` 目录 grep 为空）。Esc 的**监听与顶层判定**在
`@rc-component/portal/es/useEscKeyDown.js`，trigger 只消费它回调里的 `top` 字段。
这条推翻了「Esc 是 trigger 的功能」的直觉，见 §3.11。

---

## 3. antd 的契约（逐条）

以下行号均指 `@rc-component/trigger@3.10.1/es/`，除非另有说明。

### 3.1 动作集合解析（`hooks/useAction.js:3-21`）

```js
function toArray(val) { return val ? Array.isArray(val) ? val : [val] : []; }

export default function useAction(action, showAction, hideAction) {
  const mergedShowAction = toArray(showAction ?? action);
  const mergedHideAction = toArray(hideAction ?? action);
  const showActionSet = new Set(mergedShowAction);
  const hideActionSet = new Set(mergedHideAction);
  if (showActionSet.has('hover') && !showActionSet.has('click')) showActionSet.add('touch');
  if (hideActionSet.has('hover') && !hideActionSet.has('click')) hideActionSet.add('touch');
  return [showActionSet, hideActionSet];
}
```

逐条：

1. `showAction ?? action` —— 只有 `showAction === undefined`（不是 `null`）时才回落到 `action`。
2. `toArray` 对 `''` / `0` / `false` 都返回 `[]`（因为 `val ?` 判假）。antd Dropdown 用
   `triggerActions = disabled ? [] : trigger` 表示禁用（`dropdown/dropdown.js:128`），
   正是依赖这个。
3. ⭐ **`hover` 且不同时有 `click` ⇒ 自动注入 `touch`**。这是为了让 hover 型浮层在移动端
   可点开。副作用：`hoverToHide` 的浮层在触屏上会被 `touchstart` 关掉。
4. 返回值是 `Set`，顺序无关；`show` 与 `hide` 是**两个独立集合**（可以 show 用 hover、
   hide 用 click）。

### 3.2 延迟（`hooks/useDelay.js`）

```js
const delayInvoke = (callback, delay) => {
  clearDelay();
  if (delay === 0) { callback(); }
  else { delayRef.current = setTimeout(callback, delay * 1000); }
};
```

- ⭐ **单位是秒**（`delay * 1000`）。antd 侧的默认值也都是秒：
  - `trigger` 的 `mouseLeaveDelay = 0.1`（`index.js:44`）
  - Tooltip / Popover / Popconfirm：`mouseEnterDelay = 0.1`、`mouseLeaveDelay = 0.1`
    （`es/tooltip/index.js:76`、`es/popover/index.js:46`、`es/popconfirm/index.js:47`）
  - Dropdown：`mouseEnterDelay = 0.15`、`mouseLeaveDelay = 0.1`（`es/dropdown/dropdown.js:40-41`）
  - `mouseEnterDelay` / `focusDelay` / `blurDelay` 在 trigger 里**没有默认值**（`undefined`）。
- `delay === 0` **同步立即执行**；`undefined` 会走 `setTimeout(cb, NaN)` —— `NaN` 被浏览器
  当作 `0`，所以是**下一个宏任务**，与 `0` 差一个 tick。⚠️ 这条差异很细但可观测（见 §8 P1）。
- 每次调用先 `clearDelay()`：**新的触发总是取消上一个待执行触发**（不排队）。
- 卸载时 `clearDelay()`（`useEffect` 的 cleanup）。

### 3.3 受控 / 非受控（`index.js:141-143`）

```js
const openUncontrolled = popupVisible === undefined;
const [internalOpen, setInternalOpen] = useControlledState(defaultPopupVisible || false, popupVisible);
const rawOpen = internalOpen || false;
const mergedOpen = rawOpen && !disabled;
```

- `popupVisible === undefined` 判定非受控 —— 与 `utils` 的 `useControlledValue` 语义一致。
- `defaultPopupVisible || false` —— falsy 默认值一律归一成 `false`。
- ⭐ `mergedOpen = rawOpen && !disabled`：`disabled` **不改变状态**，只压制渲染。
  也就是说 disabled 期间的事件仍会调用 `triggerOpen`，`onOpenChange` 仍会触发，
  只是浮层不显示。这是 antd 的既定行为，别"顺手"在事件入口处 return。

`internalTriggerOpen`（`index.js:196-206`）：

```js
if (rawOpen !== nextOpen) { setInternalOpen(nextOpen); onOpenChange?.(nextOpen); onPopupVisibleChange?.(nextOpen); }
```

⭐ **只在真的变了才回调**。连续两次 `triggerOpen(true)` 只回调一次。

React 版外面包了 `flushSync`（`react-dom`），是为了让 `onOpenChange` 里的后续 DOM 操作
拿到已提交的状态。Vue 的响应式是同步的，**不需要等价物** —— 登记为 PLATFORM 差异。

### 3.4 wrapperAction（`index.js:336-346`）

```js
function wrapperAction(eventName, nextOpen, delay, callback, ignoreCheck) {
  cloneProps[eventName] = (event, ...args) => {
    if (!ignoreCheck || !ignoreCheck()) {
      callback?.(event);
      triggerOpen(nextOpen, delay);
    }
    originChildProps[eventName]?.(event, ...args);   // ← 原始处理器最后调用
  };
}
```

⭐ **原事件处理器在最后调用**（先改状态，再让用户代码看到）。手写版的 click / touch /
contextMenu 也是同一顺序。

### 3.5 Click（`index.js:256-257, 368-383`）

```js
const clickToShow = showActions.has('click');
const clickToHide = hideActions.has('click') || hideActions.has('contextMenu');
```

⭐ **`clickToHide` 包含 `contextMenu`** —— 右键菜单型浮层在左键点击时也要关。这条很容易漏。

```js
cloneProps.onClick = (event, ...args) => {
  if (openRef.current && clickToHide) triggerOpen(false);
  else if (!openRef.current && clickToShow) { setMousePosByEvent(event); triggerOpen(true); }
  originChildProps.onClick?.(event, ...args);
  touchedRef.current = false;
};
```

- 用的是 `openRef.current`（**同步的最新值**），不是 `mergedOpen`。因为同一次事件循环里
  `mergedOpen` 还没更新。
- 开启时记录鼠标位置（`alignPoint` 用），关闭时不记录。
- 末尾把 `touchedRef` 复位（见 §3.9）。
- 只绑 `onClick`，**不绑** `onMouseDown`。

### 3.6 Hover（`index.js:387-423`）

```js
if (hoverToShow) {
  wrapperAction('onMouseEnter',  true, mouseEnterDelay, e => setMousePosByEvent(e), ignoreMouseTrigger);
  wrapperAction('onPointerEnter', true, mouseEnterDelay, e => setMousePosByEvent(e), ignoreMouseTrigger);
  onPopupMouseEnter = event => {
    if ((mergedOpen || inMotion) && popupEle?.contains(event.target)) {
      triggerOpen(true, mouseEnterDelay);
    }
  };
}
if (hoverToHide) {
  wrapperAction('onMouseLeave',  false, mouseLeaveDelay, undefined, ignoreMouseTrigger);
  wrapperAction('onPointerLeave', false, mouseLeaveDelay, undefined, ignoreMouseTrigger);
  onPopupMouseLeave = () => triggerOpen(false, mouseLeaveDelay);
}
```

⭐ 四件事：

1. `mouseenter` 与 `pointerenter` **都绑**（兼容不支持 pointer 事件的旧浏览器）；
   `mouseleave` / `pointerleave` 同理。所以一次真实移入会触发**两次** `triggerOpen(true, delay)`
   —— 第二次 `clearDelay()` 掉第一次的定时器，净效果是一次。
2. `ignoreMouseTrigger = () => touchedRef.current` —— 触屏后忽略鼠标事件。
3. ⭐⭐ **`onPopupMouseEnter` 只在 `mergedOpen || inMotion` 且 `popupEle.contains(event.target)`
   时重新 `triggerOpen(true)`**。这就是「从 trigger 移到浮层上不会关闭」的机制：
   `onMouseLeave` 排了一个 `mouseLeaveDelay` 的关闭定时器，移入浮层时再排一个**同延迟**的
   开启定时器 —— 后者 `clearDelay()` 掉前者。
   ⚠️ 注意它不是"清空计时器"，而是"再排一个反方向的计时器"（README 里那句
   「hover 到浮层上时不清空计时」的字面理解是错的，准确说法见上）。
   `inMotion` 是为了离场动画期间移回来还能救活。
4. 浮层的 `onMouseLeave` 与 trigger 的用**同一个** `mouseLeaveDelay`。

### 3.7 Focus（`index.js:425-431`）

```js
if (showActions.has('focus')) wrapperAction('onFocus', true, focusDelay);
if (hideActions.has('focus')) wrapperAction('onBlur',  false, blurDelay);
```

没有 `ignoreCheck`，没有鼠标位置。⭐ 注意 hide 侧也查 `showActions` 之外的 `hideActions`
（与 click 一致：`hideActions.has('focus')`）。

### 3.8 ContextMenu（`index.js:433-446`）

```js
cloneProps.onContextMenu = (event, ...args) => {
  if (openRef.current && hideActions.has('contextMenu')) triggerOpen(false);
  else { setMousePosByEvent(event); triggerOpen(true); }
  event.preventDefault();
  originChildProps.onContextMenu?.(event, ...args);
};
```

- ⭐ 无条件 `event.preventDefault()`（**包括关闭分支**）—— 抑制原生右键菜单。
- 只有 `showActions.has('contextMenu')` 时才绑这个事件；关闭分支还要额外看
  `hideActions.has('contextMenu')`。
- antd Dropdown：`const alignPoint = !!triggerActions?.includes('contextMenu')`
  （`dropdown/dropdown.js:129`）—— **contextMenu ⇒ 按鼠标位置定位**，这是 `position` 的事，
  但 overlay 必须把鼠标位置暴露出去。

### 3.9 Touch（`index.js:348-366`）

```js
cloneProps.onTouchStart = (...args) => {
  touchedRef.current = true;
  if (openRef.current && touchToHide) triggerOpen(false);
  else if (!openRef.current && touchToShow) triggerOpen(true);
  originChildProps.onTouchStart?.(...args);
};
```

- 只在 `touchToShow || touchToHide` 时绑（即 hover 型且无 click）。
- 置 `touchedRef = true`，让后续鼠标事件被 `ignoreMouseTrigger` 忽略。
- `touchedRef` 在 **click** 里被复位（`index.js:380`），其他动作不复位。

### 3.10 外部点击 · `useWinClick`（`hooks/useWinClick.js`）

```js
React.useEffect(() => {
  if (clickToHide && popupEle && (!mask || maskClosable)) {
    const onPointerDown = () => { popupPointerDownRef.current = false; };
    const onTriggerClose = e => {
      if (openRef.current && !inPopupOrChild(e.composedPath?.()?.[0] || e.target)
          && !popupPointerDownRef.current) triggerOpen(false);
    };
    const win = getWin(popupEle);                        // = popupEle.ownerDocument.defaultView
    win.addEventListener('pointerdown', onPointerDown, true);
    win.addEventListener('mousedown',   onTriggerClose, true);
    win.addEventListener('contextmenu', onTriggerClose, true);
    ...
  }
}, [clickToHide, targetEle, popupEle, mask, maskClosable]);
function onPopupPointerDown() { popupPointerDownRef.current = true; }   // 挂在 Popup 的 onPointerDownCapture
```

逐条：

1. 生效条件：`clickToHide && popupEle` 且（`!mask || maskClosable`）。
2. ⭐ 监听的是 **`mousedown` 与 `contextmenu`**，不是 `click`；且都是 **capture 阶段**，
   挂在 `window` 上（不是 `document`）。
3. ⭐ 目标取 `e.composedPath?.()?.[0] || e.target` —— 为了穿透 shadow DOM。
4. `inPopupOrChild(ele)`（`index.js:131-134`）的判定范围：
   `targetEle` 自身 / 其子孙 / 其 shadow host / `popupEle` 自身 / 其子孙 / 其 shadow host /
   **任意已注册的子浮层** `subPopupElements` 的成员及其子孙。
5. ⭐ `popupPointerDownRef` 双保险：window 的 capture `pointerdown` 先把它置 `false`，
   浮层自己的 `onPointerDownCapture` 再置 `true`。因为 capture 顺序是
   window（capture）→ … → popup（capture），所以点在浮层内时最终为 `true`，不关。
6. `triggerOpen(false)` **不带 delay** —— 外部点击立即关闭。

### 3.11 Esc（`@rc-component/portal@2.2.1/es/useEscKeyDown.js` + `index.js:232-236`）

portal 侧：

```js
let stack = [];                       // 模块级 LIFO，元素 { id, onEsc }
const IME_LOCK_DURATION = 200;
let lastCompositionEndTime = 0;

const onGlobalKeyDown = event => {
  if (event.key === 'Escape' && !event.isComposing) {
    const now = Date.now();
    if (now - lastCompositionEndTime < IME_LOCK_DURATION) return;    // ⭐ IME 锁
    const len = stack.length;
    for (let i = len - 1; i >= 0; i -= 1) {
      stack[i].onEsc({ top: i === len - 1, event });                 // ⭐ 从栈顶到栈底全通知
    }
  }
};
window.addEventListener('keydown', onGlobalKeyDown);
window.addEventListener('compositionend', () => { lastCompositionEndTime = Date.now(); });
```

- 入栈时机：`open` 为 `true` 时 push（用 `useId()` 去重），`false` 时过滤掉；卸载时 clear。
  `useMemo` 段保证首次渲染同步入栈，`useEffect` 段负责挂载全局监听。
- ⭐ 入栈顺序 = **开启顺序** ⇒ 栈顶 = 最后开的浮层。
- ⭐ **每个栈内成员都会收到 `onEsc`**，靠 `top` 字段区分。
- ⭐ **IME 锁**：`compositionend` 后 200ms 内的 Esc 被丢弃（中文输入法候选框的 Esc 不应关弹层）。
- 栈空时才摘掉全局监听。

trigger 侧：

```js
function onEsc({ top }) { if (top) triggerOpen(false); }
```

即「只有栈顶那个浮层真的关闭」。README 里「Esc 关闭必须冒泡到最上层一个浮层，且只关闭它」
的表述**准确**，实现机制如上。

归属：见 §4 —— 这段代码在 rc-portal 里，但 `portal-contract.md` §3.6 已把 Esc 排除出
`@apollo-design/portal`（理由是 Modal 的 rationale：「焦点陷阱 + 滚动锁定 + Esc」属交互语义）。
**本包承接它**：overlay 正是 L2 的交互语义包，且 `onEsc` 的消费方（trigger）就在本包范围内。

### 3.12 子浮层（`index.js:73-80, 380-383`）

```js
const context = { registerSubPopup: (id, subPopupEle) => {
  subPopupElements.current[id] = subPopupEle;
  parentContext?.registerSubPopup(id, subPopupEle);          // 向上透传
} };
```

子浮层把元素注册进**所有祖先** trigger 的 `subPopupElements`，于是点子浮层也算"在浮层内"。
Vue 侧对应 `provide/inject`。⚠️ v1 是否实现见 §8 P3。

### 3.13 ❌ z-index **不在本包**

`es/_util/hooks/useZIndex.js` 的机制是 **组件类型偏移 + 嵌套上下文累加**：

```
containerBaseZIndexOffset = { Modal, Drawer, Popover, Popconfirm, Tooltip, Tour, FloatButton: 100 }
consumerBaseZIndexOffset  = { SelectLike: 50, Dropdown: 50, DatePicker: 50, Menu: 50, ImagePreview: 1 }
zIndex = parentZIndex ?? 0
       + (isContainer ? (parentZIndex ? 0 : zIndexPopupBase) + containerOffset : consumerOffset)
result[0] = parentZIndex === undefined ? customZIndex : zIndex      // 最外层 ⇒ undefined
```

⭐ 两条结论：

1. **不是 LIFO 栈** —— 「后开的浮层在上层」在 z-index 维度**不成立**，antd 靠的是
   「同一容器内 DOM 顺序」（`portal-contract.md` §3.3）+ 类型偏移。
2. **最外层浮层根本不设 z-index**（`result[0]` 为 `undefined`）。

因此 `packages/overlay/README.md` 中「堆叠：与 portal 的 z-index 协调，后开的浮层在上层」
这句话**有两处错**：z-index 已由 `portal` 承接（`computeZIndex`），且不存在"后开在上"的栈语义。
**本包唯一的"栈"是 §3.11 的 Esc 栈**，它是按开启顺序的 LIFO —— 两者是**独立的两套机制**，别混。

### 3.14 `alignPoint` + 滚动关闭（`index.js:263-266`）

```js
const onScroll = () => { if (openRef.current && alignPoint && clickToHide) triggerOpen(false); };
```

右键菜单（alignPoint）在滚动时关闭。需要 `position` 的滚动监听配合 —— v1 是否实现见 §8 P3。

---

## 4. 边界

✅ 做：

- 动作集合解析（`showAction` / `hideAction` / 隐式 `touch` 注入）
- 延迟编排（秒 → ms、0 立即、新触发取消旧触发、卸载清理）
- 受控 / 非受控开合（`utils` 的 `useControlledValue`）
- 六种事件：`click` / `mouseenter` / `mouseleave` / `focus` / `blur` / `contextmenu` / `touchstart`
  （含 `pointerenter` / `pointerleave` 双绑）
- 浮层侧的 hover 抢救（`onPopupMouseEnter` 的 `mergedOpen || inMotion` 条件）
- 外部点击判定（capture `mousedown` / `contextmenu` + `composedPath` + 子浮层 + popupPointerDown 双保险）
- **Esc 栈**（LIFO + `top` 派发 + IME 锁 200ms）
- 鼠标位置采集（`alignPoint` 用）

❌ 不做：

- 定位几何 / 翻转 / 滚动容器测量 —— **`position`**
- 挂载、容器、z-index 数值 —— **`portal`**
- 焦点陷阱 / 焦点恢复 —— **`a11y`**（再导出自 `utils`）
- 滚动锁定 —— **ui 交互语义**（`portal-contract.md` §3.6）
- 离场动画（`inMotion` 的**产生**）—— **`motion`**；本包只**消费**它作为一个布尔入参
- `unique` / `UniqueProvider`（多 trigger 共享一个浮层容器）—— v1 不做，见 §8 P4
- 任何视觉样式 —— 不产 CSS（R4）

---

## 5. API 设计

### 5.1 纯数据侧（可穷举测试）

| 函数 | 契约来源 |
|---|---|
| `resolveActions({ action, showAction, hideAction })` → `{ show: Set, hide: Set }` | §3.1 |
| `toDelayMs(delay: number \| undefined)` → `number \| 'immediate' \| 'nextTick'` | §3.2 |
| `shouldCloseOnOutside({ open, target, ele })` | §3.10 第 4 条 |
| `createEscStack()` → `{ push, remove, dispatch }` | §3.11 |

`isActionEnabled` 系列由 `Set` 直接表达，不额外出函数。

### 5.2 有副作用的一侧

```ts
function useOverlay(options: UseOverlayOptions): {
  open: ComputedRef<boolean>;         // = mergedOpen（已含 disabled 压制）
  rawOpen: ComputedRef<boolean>;      // 未压制，供 motion / 调试用
  setOpen: (next: boolean, delay?: number) => void;
  targetProps: ComputedRef<Record<string, (e: Event) => void>>;   // v-bind 到触发元素
  popupProps: ComputedRef<Record<string, (e: Event) => void>>;    // v-bind 到浮层元素
  mousePos: Readonly<Ref<[number, number] | null>>;
  registerSubPopup: (id: string, el: HTMLElement | null) => void;
}
```

⚠️ 与 React 的**形态差异**：React 用 `cloneElement(child, cloneProps)` 把事件塞进子元素；
Vue 没有 clone 语义（也不该有）。改为**返回两个 props 对象供 `v-bind`**，这既符合
Vue 的心智模型（H3：禁止机械翻译），也让「事件到底挂在哪」在模板里一眼可见。

事件处理器内部顺序严格照抄 §3.4：**先改状态，再调用用户自己的同名处理器**。

---

## 6. 与 React 的差异

| # | rc-trigger (React) | Vue | 处置 |
|---|---|---|---|
| 1 | `cloneElement(child, cloneProps)` | 返回 `targetProps` / `popupProps` 供 `v-bind` | 形态改写（§5.2） |
| 2 | `useControlledState` | `utils` 的 `useControlledValue` | 已实现，直接复用 |
| 3 | `flushSync` 包 `setInternalOpen` | 无需（Vue 响应式同步） | PLATFORM 差异，登记 |
| 4 | `useRef` + 手动 `openRef.current = mergedOpen` | `ref` + `watch(..., { flush: 'sync' })` 或直接读 `ref` | ⚠️ 必须同步，见下 |
| 5 | `useEffect(() => clearDelay, [])` | `onScopeDispose` / `onUnmounted` | 等价 |
| 6 | `window.addEventListener` | 同（jsdom / 浏览器一致） | 注意 SSR 守卫 |
| 7 | `useMemo` 里 push Esc 栈 | `watch(open, ..., { immediate: true })` | ⚠️ 见下 |
| 8 | `cloneProps.onMouseEnter`（React 事件名） | **`props.onMouseenter`** | ⚠️⭐ 见 §6.1 |

⚠️ 第 4 条：`openRef.current = mergedOpen` 是**渲染期赋值**，保证同一次事件循环里读到最新值。
Vue 里若用 `watch(..., { flush: 'post' })` 会在 DOM 更新后才有值 —— **必须 `flush: 'sync'`**
或直接把 `open` 做成 `computed` 后读 `.value`（`computed` 本身就是同步求值的）。
实现选后者：读 `open.value` 即可，不需要额外 ref。

⚠️ 第 7 条：rc-portal 用 `useMemo` 在**渲染期**入栈（跳过 SSR），再加 `useEffect` 挂监听。
Vue 的等价物是 `watch(open, sync, { immediate: true })`；SSR 守卫用 `utils` 的 `canUseDom()`。

### 6.1 ⭐⭐ 事件 prop 名必须用 **Vue 的小写约定**（实测踩到，别写回 React 风格）

`targetProps` / `popupProps` 的键名看起来应该与 React 一致（`onMouseEnter`），
但 Vue 运行时的 `parseName` 会对 `on` 之后的部分做 **hyphenate**：

```js
// runtime-dom/src/modules/events.ts
const event = name[2] === ':' ? name.slice(3) : hyphenate(name.slice(2))
```

于是：

| 写成（React 风格） | Vue 实际监听 | 结果 |
|---|---|---|
| `onMouseEnter` | `mouse-enter` | ❌ 永不触发 |
| **`onMouseenter`** | `mouseenter` | ✅ |
| `onPointerEnter` | `pointer-enter` | ❌ |
| **`onPointerenter`** | `pointerenter` | ✅ |
| `onTouchStart` | `touch-start` | ❌ |
| **`onTouchstart`** | `touchstart` | ✅ |
| `onContextMenu` | `context-menu` | ❌ |
| **`onContextmenu`** | `contextmenu` | ✅ |
| `onPointerDownCapture` | `pointer-down` + capture | ❌ |
| **`onPointerdownCapture`** | `pointerdown` + capture | ✅ |

规则：**事件名整段小写，只有修饰符后缀（Once / Capture / Passive）保留大写**。
这也是 Vue 模板编译器产出的形态（`@mouseenter` → `onMouseenter`）。

`onClick` / `onFocus` / `onBlur` 本来就是单个单词，两种风格一致，无需改。

---

## 7. 测试策略

| 层 | 内容 | 状态 |
|---|---|---|
| L1 | §5.1 四个纯函数 + 常量；`resolveActions` 的 touch 注入全组合穷举 —— `actions.test.ts`（20）/ `esc-stack.test.ts`（12） | ✅ done |
| L2 | jsdom：`useOverlay` 的六类动作、延迟（含 0 / undefined / 取消语义）、受控非受控、外部点击判定、Esc 栈 LIFO 与 IME 锁 —— `use-overlay.test.ts`（21） | ✅ done |
| L3 | `overlay.test-d.ts`（含 6 条负例） | ✅ done |
| L4 | n/a —— 本包不产 DOM 结构（R4 无视觉） | n/a |
| L5 | n/a —— ARIA 语义在组件层 | n/a |
| L6 | n/a —— 本包无渲染产物 | n/a |
| L7 | `tests/build/run.mjs` | ⬜ 待收口 |

覆盖率下限：语句 95% / 分支 90% / 函数 95%（L2 档位）。

### 7.2 变异验证（确认断言不是「永远绿」）

| 变异 | 被抓到的用例 |
|---|---|
| 去掉 `hover ⇒ touch` 的隐式注入 | **6 个**（4 L1 + 2 L2） |
| `isClickToHide` 丢掉 `contextMenu` | 2 个（1 L1 + 1 L2） |
| Esc 只通知栈顶（改成 `i !== len-1` 就 `continue`） | 2 个 L1 |
| `mouseLeaveDelay` 默认值 `0.1` → `0` | 3 个 L2 |
| IME 锁 `200` → `0` | 3 个 L1 |

⚠️ 第二轮才补的覆盖：`isClickToHide` 的变异**一开始只有 L1 抓到** —— L2 里没有
「contextMenu 型浮层也吃外部点击」的用例。已补 `外部点击 > contextMenu 型也吃外部点击`。

### 7.1 测试侧会踩的坑（先写下来）

1. **延迟单位是秒** —— 测试里写 `100` 会被当成 100 秒。用 `vi.useFakeTimers()` 并
   `vi.advanceTimersByTime(delay * 1000)`。
2. **`pointerenter` 与 `mouseenter` 双绑** —— 断言"触发了几次 `setOpen`"时必须预期 **2 次**
   （净效果 1 次）。只 dispatch `mouseenter` 的用例测不到这条。
3. **`composedPath` 在 jsdom 里存在但返回空数组** —— `useWinClick` 的
   `e.composedPath?.()?.[0] || e.target` 会回落到 `e.target`；若测试直接调内部函数传
   假 event，必须显式提供 `composedPath: () => [target]` 才能覆盖真分支。
4. **Esc 栈是模块级单例** —— 用例之间必须 `resetEscStack()`，否则顺序耦合。
5. **IME 锁依赖 `Date.now()`** —— 用 `vi.setSystemTime()` 控制，别真等 200ms。

---

## 8. 待裁决

### P1 · `mouseEnterDelay` 为 `undefined` 时的行为

trigger 里 `mouseEnterDelay` 无默认值 ⇒ `setTimeout(cb, undefined * 1000)` = `setTimeout(cb, NaN)`
⇒ 浏览器按 `0` 处理 ⇒ **下一个宏任务**执行，而 `delay === 0` 是**同步**执行。
- **建议**：`toDelayMs(undefined)` 返回 `'nextTick'`，用 `setTimeout(fn, 0)` 复刻；
  `toDelayMs(0)` 返回 `'immediate'` 同步调用。差异必须保留（这是可观测的时序契约）。

### P2 · Esc 栈的归属

rc 的实现在 portal 包，但 `portal-contract.md` §3.6 已排除。
- **裁决**：放 **overlay**。理由：①它是交互语义；②消费方 `onEsc` 在 trigger 内；
  ③避免 portal（L1）依赖 Esc 这种组件级概念。需在 `portal` 的 README/契约里补一句交叉引用。

### P3 · v1 是否做子浮层注册（§3.12）与滚动关闭（§3.14）

两者都依赖"浮层已经渲染出来"与滚动监听，而 v1 的 `useOverlay` 是纯 composable。
- **建议**：v1 **不做**，在契约 §9 记录。等第一个真实消费组件（Tooltip / Dropdown）出现时补。

### P4 · `unique` / `UniqueProvider`

antd Tooltip 传了 `unique: true`，是"多个 trigger 共享一个浮层容器"的性能优化。
- **建议**：v1 **不做**，登记为 UPSTREAM 优化项。

---

## 9. 这个包**没有**证明什么

1. **没有与真实 React 运行时对拍**。本仓库禁止引入 React（H1），所有结论来自**读源码**。
   时序类结论（尤其是 §3.2 的 `NaN` vs `0`、§3.6 的双绑净效果）是推导，未经实测。
2. **没有被任何组件消费过**。`useOverlay` 目前零调用方 —— 与 `position.measureAlign`、
   `motion.CSSMotion` 同类的"契约已封但无人验证"风险。
3. **Esc 栈的 IME 锁只在单元测试层验证**。`isComposing` 的真实输入法行为需要浏览器。
4. **外部点击的 `composedPath` 分支在 jsdom 下只能测回落路径**（见 §7.1 第 3 条）。
5. **无上游可对齐的部分**：`subPopupElements` 的向上透传（§3.12）在 v1 不做，
   其必要性仅由源码注释推断，没有组件侧证据。
