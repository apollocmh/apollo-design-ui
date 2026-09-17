# `a11y` 契约文档

> G1/G2 的分析产物。**步骤 3 的产物必须先于步骤 5 存在**（`AGENTS.md` §2）。
> 兼容目标：antd **6.6.4**。

---

## 1. 这个包解决什么

antd 把无障碍逻辑**散落在各组件与 rc 包里**，没有独立包。本项目把它们收敛为可复用原语。

五类原语：

| # | 原语 | 上游出处 | 落地位置 |
|---|---|---|---|
| 1 | 焦点陷阱 | `@rc-component/util@1.9.0/es/Dom/focus.js`（198 行） | ⚠️ **已在 `@apollo-design/utils`（L0）落地**，本包**再导出**、不重写 |
| 2 | 焦点恢复 | `@rc-component/dialog@1.10.0/es/Dialog/index.js:53-95` | 本包实现（utils 没有） |
| 3 | roving tabindex | `@rc-component/menu@1.5.0/es/hooks/useAccessibility.js:113-138`（`getNextFocusElement`） | 本包实现**索引算术** + `useRovingFocus`；模式分派是 Menu 私有，不搬 |
| 4 | active-descendant | `@rc-component/select@1.10.1/es/OptionList.js:237-281`（id 方案） | 本包实现 **id 方案**；渲染在组件层 |
| 5 | live region 播报 | `@rc-component/select@1.10.1/es/BaseSelect/Polite.js` + `components/image/Progress.tsx:7-17,125` + `components/spin/index.tsx:264` | 本包实现 |
| 6 | typeahead 键盘搜索 | **上游没有** | 本包自行定义，见 §3.9 |

⚠️ **本包是「本项目新增能力」**（`registry/dependencies.json` 的 `replaces` 明写
「antd 无对应独立包」）。所以 §3 每一条都要写清「从哪抄的」还是「我们自己定的」——
后者必须在 §9 明确标注为**没有上游可对齐**。

### 1.1 ⚠️ 焦点陷阱**不重写**（开工前核实出来的职责重叠）

`purpose` 里写「焦点陷阱与焦点恢复」是本包的职责，但动手前核实发现
**`packages/utils/src/dom/focus.ts` 已经完整实现了它** —— `focusable` / `getFocusNodeList` /
`lockFocus` / `useLockFocus` / `triggerFocus` / `resetFocusLock`，且是 rc-util `focus.js`
的忠实移植（含模块级单例的四个变量、Tab 两步式环绕、`preventScroll: true`）。

按 **`TESTING.md` T2（共享契约必须复用）**，本包的处置是：

- **不再实现一遍**；从 `@apollo-design/utils` **再导出**，让 a11y 成为消费者看到的统一入口；
- 本包只补 utils **没有**的：焦点恢复、roving 算术、active-descendant id、live region、typeahead；
- `registry/foundation.json` 的 `notes` 里登记这条复用关系，避免后人以为 a11y 自己有一套陷阱。

为什么不能反过来「把 focus.ts 从 utils 搬到 a11y」：utils 是 **L0**、a11y 是 **L1**，
搬过去会让 L0 反向依赖 L1（`AGENTS.md` 硬约束：禁跨层反向依赖）。

---

## 2. 事实来源

| 来源 | 版本 / 位置 | 用途 |
|---|---|---|
| `@rc-component/util` | 1.9.0 · `es/Dom/focus.js`（198 行） | 焦点陷阱的**全部**实现 |
| `@rc-component/drawer` | 1.4.2 · `es/hooks/useFocusable.js` | `focusTrap` 的默认值推导 |
| `@rc-component/dialog` | 1.10.0 · `es/Dialog/index.js:53-95` | 焦点恢复 |
| `@rc-component/menu` | 1.5.0 · `es/hooks/useAccessibility.js` | roving 的索引算术 |
| `@rc-component/select` | 1.10.1 · `es/OptionList.js` / `es/BaseSelect/Polite.js` | active-descendant id 方案 / live region |
| antd 源码 | `components/image/Progress.tsx:7-17,125`、`components/spin/index.tsx:264` | live region 的隐藏样式与 `aria-live` 取值 |

本地副本：`/tmp/rc-util-ref/focus.js`、`/tmp/rc-dialog-ref/`、`/tmp/rc-select-ref/`、
`/tmp/useAccessibility.js`（menu）。

---

## 3. antd 的契约（逐条）

### 3.1 可聚焦判定（`focus.js:4-33`）

```js
function focusable(node, includePositive = false) {
  if (isVisible(node)) {
    const nodeName = node.nodeName.toLowerCase();
    const isFocusableElement =
      ['input', 'select', 'textarea', 'button'].includes(nodeName) ||
      node.isContentEditable ||
      nodeName === 'a' && !!node.getAttribute('href');

    const tabIndexAttr = node.getAttribute('tabindex');
    const tabIndexNum = Number(tabIndexAttr);

    let tabIndex = null;
    if (tabIndexAttr && !Number.isNaN(tabIndexNum)) {
      tabIndex = tabIndexNum;
    } else if (isFocusableElement && tabIndex === null) {
      tabIndex = 0;
    }

    if (isFocusableElement && node.disabled) {
      tabIndex = null;
    }
    return tabIndex !== null && (tabIndex >= 0 || includePositive && tabIndex < 0);
  }
  return false;
}
```

**必须逐条照抄的判据**（改了就与上游分叉）：

1. **先看 `isVisible(node)`** —— 不可见的元素**根本不进候选表**。
   ⚠️ jsdom 下 `isVisible` 恒为 `false`（无布局引擎，`offsetParent`/`getBBox`/rect 全空），
   所以 jsdom 里 `getFocusNodeList` 恒返回空数组。这是**测试侧**必须绕的，不是实现问题。
2. 三种「天然可聚焦元素」：`input` / `select` / `textarea` / `button`、
   `isContentEditable`、`a[href]`（注意 `a` 必须**有 href**）。
3. `tabindex` 取 `getAttribute('tabindex')` **而不是** `node.tabIndex` 属性 ——
   属性值会把「没写 tabindex」也变成 0，而 attribute 为 `null` 时才会走「天然元素 → 0」分支。
4. **`disabled` 的天然可聚焦元素被排除**（`tabIndex = null`）。
   注意顺序：先算 tabIndex，再被 disabled 清掉。
5. 最终条件 `tabIndex >= 0 || (includePositive && tabIndex < 0)` ——
   默认**排除** `tabindex="-1"`；只有 `includePositive=true` 时才纳入负值。
6. ⚠️ **一处上游的无效条件**：`else if (isFocusableElement && tabIndex === null)` 里的
   `tabIndex === null` **恒为真**（上一行刚 `let tabIndex = null`，前面的 if 走的是另一分支）。
   等价于 `else if (isFocusableElement)`。
   这是死代码，**照抄**（保留可读性），不要「优化」成删掉 —— 否则与上游 diff 时无法确认等价。

### 3.2 焦点节点表（`focus.js:35-43`）

```js
export function getFocusNodeList(node, includePositive = false) {
  const res = [...node.querySelectorAll('*')].filter(child => focusable(child, includePositive));
  if (focusable(node, includePositive)) {
    res.unshift(node);
  }
  return res;
}
```

- 用 `querySelectorAll('*')` ⇒ **文档顺序**。
- 容器自身可聚焦时 **unshift 到最前**（不是 push）。

### 3.3 焦点陷阱（`focus.js:101-198`）

模块级单例状态（**四个**）：

```js
let lastFocusElement = null;      // 上一次在锁定区内的焦点
let focusElements = [];           // 锁栈，只有栈顶生效
const idToElementMap = new Map(); // lockId -> element
const ignoredElementMap = new Map(); // lockId -> 允许获得焦点的例外元素
```

**`lockFocus(element, id)`**（`focus.js:150-181`）：

1. `idToElementMap.set(id, element)`
2. `focusElements = focusElements.filter(ele => ele !== element); focusElements.push(element)`
   ⇒ **去重并移到栈顶**
3. `window.addEventListener('focusin', syncFocus)`（冒泡阶段）
   `window.addEventListener('keydown', onWindowKeyDown, true)`（**捕获阶段**）
4. 立刻 `syncFocus()`
5. 返回反注册函数：清 `lastFocusElement`、移出栈、删两张表；
   **只有 `focusElements.length === 0` 时才移除监听器**。

**`syncFocus()`**（`focus.js:111-131`）—— 拉回焦点：

```js
const lastElement = getLastElement();          // 栈顶
const { activeElement } = document;
if (isIgnoredElement(activeElement)) return;   // 例外元素，不干预
if (lastElement && !hasFocus(lastElement)) {
  const focusableList = getFocusNodeList(lastElement);
  const matchElement = focusableList.includes(lastFocusElement) ? lastFocusElement : focusableList[0];
  matchElement?.focus({ preventScroll: true });
} else {
  lastFocusElement = activeElement;
}
```

**`onWindowKeyDown`**（`focus.js:132-148`）—— 处理 Tab 环绕：

```js
if (e.key === 'Tab') {
  const focusableList = getFocusNodeList(lastElement);
  const last = focusableList[focusableList.length - 1];
  if (e.shiftKey && activeElement === focusableList[0]) lastFocusElement = last;
  else if (!e.shiftKey && activeElement === last) lastFocusElement = focusableList[0];
}
```

⭐ **关键机制**：`onWindowKeyDown` **不调用 `preventDefault`**。
它只把 `lastFocusElement` 预先设成「另一端」，然后**让浏览器真的把焦点移出去**，
再由随后的 `focusin` → `syncFocus` 把焦点拉回到 `lastFocusElement`。
所以环绕是**两步**完成的 —— 改成一个 `preventDefault` 的等价实现虽然在多数场景下表现相同，
但会与上游在「焦点短暂离开容器的那一瞬」上产生可观察差异（例如外部 `focusout` 监听者）。
**照抄两步式。**

**`isIgnoredElement`**（`focus.js:87-100`）：反向从 `idToElementMap` 里查栈顶元素对应的
`lockId`，再取 `ignoredElementMap.get(lockId)`，判断 `=== element || contains(element)`。

**`useLockFocus(lock, getElement)`**（`focus.js:190-198`）：
`useEffect` 里 `if (lock) { const element = getElement(); if (element) return lockFocus(element, id); }`，
返回 `[ignoreElement]`，`ignoreElement(ele)` 把 ele 写进 `ignoredElementMap`。

### 3.4 陷阱开关的默认值（`rc-drawer/es/hooks/useFocusable.js`）

```js
const mergedFocusTrap = focusTrap ?? mask !== false;
```

antd 侧（`components/drawer/useFocusable.ts`）：`focusTriggerAfterClose` 默认 **true**，
`trap` 默认 **true**；Drawer 传入的默认值是 `getContainer !== false && mergedMask`。

### 3.5 焦点恢复（`@rc-component/dialog/es/Dialog/index.js:53-95`）

```js
function saveLastOutSideActiveElementRef() {
  if (!contains(wrapperRef.current, document.activeElement)) {
    lastOutSideActiveElementRef.current = document.activeElement;
  }
}
function focusDialogContent() {
  if (!contains(wrapperRef.current, document.activeElement)) {
    contentRef.current?.focus();
  }
}
// doClose():
if (mask && lastOutSideActiveElementRef.current && focusTriggerAfterClose) {
  try {
    lastOutSideActiveElementRef.current.focus({ preventScroll: true });
  } catch (e) { /* Do nothing */ }
  lastOutSideActiveElementRef.current = null;
}
```

三条必须照抄的判据：

1. 保存与恢复**都以 `!contains(container, activeElement)` 为门** —— 焦点已在容器内时不覆盖。
2. 恢复被 **`mask`** 额外门控 —— 无遮罩的 dialog 不恢复焦点。这是上游的形状，别「顺手修」。
3. `focus({ preventScroll: true })` 且**吞掉异常**（被恢复的元素可能已从文档移除）。
4. 恢复后立刻置 `null` —— 保证只恢复一次。

### 3.6 roving 的索引算术（`rc-menu/es/hooks/useAccessibility.js:113-138`）

```js
function getNextFocusElement(parentQueryContainer, elements, focusMenuElement, offset = 1) {
  const sameLevelFocusableMenuElementList = getFocusableElements(parentQueryContainer, elements);
  const count = sameLevelFocusableMenuElementList.length;
  let focusIndex = sameLevelFocusableMenuElementList.findIndex(ele => focusMenuElement === ele);
  if (offset < 0) {
    if (focusIndex === -1) focusIndex = count - 1;
    else focusIndex -= 1;
  } else if (offset > 0) {
    focusIndex += 1;
  }
  focusIndex = (focusIndex + count) % count;
  return sameLevelFocusableMenuElementList[focusIndex];
}
```

**可移植的核心**就是这段环绕算术：

- `offset > 0`：`focusIndex + 1`（找不到时 `focusIndex === -1` ⇒ 变成 `0`，即**从头开始**）
- `offset < 0`：`focusIndex === -1` ⇒ `count - 1`（**从尾开始**），否则 `-1`
- 最后统一 `(focusIndex + count) % count`

`HOME` / `END` 不走这段，直接取 `focusableElements[0]` / `[length - 1]`（`:216-221`）。

⚠️ **不可移植的部分**：`getOffset(mode, isRootLevel, isRtl, which)` 的
inline / horizontal / vertical × root/sub 六张分派表是 **Menu 私有语义**，
不属于通用 roving 原语。本包只取索引算术，模式分派留给调用方。

### 3.7 active-descendant 的 id 方案（`rc-select/es/OptionList.js:237-281`）

```js
// 空态与常态都渲染 role="listbox"
const a11yProps = { role: 'listbox', id: `${id}_list` };
// 每个 option
const itemProps = { role: group ? 'presentation' : 'option', id: `${id}_list_${index}` };
```

对照 antd 的 DOM 快照（`components/config-provider/__tests__/__snapshots__/components.test.tsx.snap:23546`）：

```
aria-activedescendant="test-id_list_0"
aria-autocomplete="list"
aria-controls="test-id_list"
aria-expanded="true"
aria-haspopup="listbox"
```

⇒ 输入框上：`aria-controls = ${id}_list`、`aria-activedescendant = ${id}_list_${index}`。
**`${id}` 来自 `useId`**（utils 已有，不重复实现 —— `notDo` 第三条）。

### 3.8 live region

三处上游，两条**不同**的隐藏样式：

**(a) rc-select `Polite.js`** —— 截断 50 条：

```js
const MAX_COUNT = 50;
// <span aria-live="polite" style={{width:0,height:0,position:'absolute',overflow:'hidden',opacity:0}}>
//   {values.slice(0, MAX_COUNT).map(({label, value}) =>
//      ['number','string'].includes(typeof label) ? label : value).join(', ')}
//   {values.length > MAX_COUNT ? ', ...' : null}
```

- 只取 `label` 是 number/string 的，否则用 `value`
- `join(', ')`
- 超过 50 条追加 `', ...'`（注意是**半角逗号**）
- `visible === false` 时**返回 null**（不渲染）

**(b) `components/image/Progress.tsx:7-17`** —— 视觉隐藏样式：

```js
const VISUALLY_HIDDEN_STYLE = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0,
};
// <span role="status" aria-live="polite" style={VISUALLY_HIDDEN_STYLE}>Loading</span>
```

**(c) `components/spin/index.tsx:264`** —— 直接挂在容器上：`aria-live="polite"` + `aria-busy={spinning}`。

⚠️ 两处隐藏样式**不一致**（一个是 0×0 + opacity:0，一个是 1×1 + clip）。
本包以 **(b) 的 `VISUALLY_HIDDEN_STYLE`** 为准（更接近「视觉隐藏但仍被读屏识别」的标准做法），
并在 §6 说明为什么不选 (a)。

### 3.9 typeahead（**上游没有**）

已在 antd 仓库全量搜索 `typeahead|Typeahead|typeAhead` —— **零命中**。
rc-select 的「搜索」是 combobox 的过滤语义（`useFilterOptions`），不是经典的
「敲首字母跳到匹配项」。

⇒ 本包**自行定义**语义，并在 §9 标注「无上游可对齐」。定义：

- 缓冲区累积可打印字符；
- 两次按键间隔超过 `resetDelay`（默认 500ms）则**重新起头**；
- 匹配用**前缀**比较、大小写不敏感；
- 连续按**同一个字符**时，在匹配项之间**循环**（这是经典 typeahead 的标志行为）；
- 搜索从 `fromIndex + 1` 开始，绕回 0，再回到 `fromIndex`（含），即**全表循环一次**。

---

## 4. 边界

| 做 | 不做（`notDo`） |
|---|---|
| 焦点**恢复**（陷阱在 utils，见 §1.1） | ❌ 视觉样式（本包**零 CSS**，唯一例外是隐藏 live region 的内联样式 —— 它是可达性语义的一部分，不是装饰） |
| roving tabindex 的索引算术 | ❌ axe 扫描（那是 `test-utils` 的 `a11yDemoTest`） |
| active-descendant 的 id 方案 | ❌ 重复实现 `useId`（在 utils） |
| live region | ❌ 组件渲染（列表/菜单的 DOM 结构属 ui 层） |
| typeahead 的匹配算法 | ❌ 具体组件的键盘语义分派（如 Menu 的 inline/horizontal/vertical） |
| | ❌ **重写焦点陷阱**（已在 utils，T2） |

依赖：`@apollo-design/utils`（`contains` / `useId` / `getFocusNodeList` / `lockFocus` / `useLockFocus`
—— 全部已在 utils，T2 复用成立）。**不依赖 theme / position / motion / portal。**

---

## 5. API 设计

### 5.0 再导出（**不重写**，见 §1.1）

从 `@apollo-design/utils` 原样再导出：`getFocusNodeList` / `lockFocus` / `useLockFocus` /
`triggerFocus` / `resetFocusLock` / `InputFocusOptions`。

### 5.1 纯数据侧（可穷举测试）

| 函数 | 出处 | 说明 |
|---|---|---|
| `nextRovingIndex(focusIndex, offset, count)` | `useAccessibility.js:126-137` | 环绕算术（`-1` 起头的两种走向） |
| `moveRovingIndex(current, offset, count, loop?)` | **自定** | 同上但可关环绕；`loop` 默认 `true` |
| `getRovingOffset(orientation, rtl, key)` | **自定**（APG 通用映射） | 方向键 → offset；不参与导航的键返回 `null`。**不是** rc-menu 的分派表，见 §3.6 |
| `resolveRovingHome(count)` / `resolveRovingEnd(count)` | `:216-221` | HOME → 0；END → count-1 |
| `getRovingTabIndex(activeIndex, itemIndex)` | 派生 | `activeIndex === itemIndex ? 0 : -1` |
| `NO_ACTIVE_INDEX` | 派生 | `-1` 哨兵，与 `findIndex` 的约定一致 |
| `getListboxId(id)` | `OptionList.js:280` | `` `${id}_list` `` |
| `getOptionId(id, index)` | `OptionList.js:251` | `` `${id}_list_${index}` `` |
| `formatLiveRegionText(values, maxCount?)` | `Polite.js` | 截断 + join + `', ...'` |
| `pushTypeaheadChar(state, char, now, resetDelay?)` | 自定 | 超时重起头 / 同字符累积 |
| `findTypeaheadIndex(labels, buffer, fromIndex)` | 自定 | 全表循环一次的前缀匹配 |
| `isTypeaheadKey(event)` | 自定 | 可打印字符且无 Ctrl/Meta/Alt |

常量：`VISUALLY_HIDDEN_STYLE`（`Progress.tsx:7-17`）、`LIVE_REGION_MAX_COUNT = 50`、
`DEFAULT_TYPEAHEAD_RESET_DELAY = 500`。

### 5.2 有副作用的一侧

| 导出 | 出处 | 说明 |
|---|---|---|
| `useFocusRestore(getContainer, options)` | `Dialog/index.js:53-95` | 拆成 `save()` / `focusContent()` / `restore()`；三条门见 §3.5 |
| `createLiveRegion(options)` | `Polite.js` + `Progress.tsx` | 建隐藏 span 挂到 body，返回 `{ element, setText, destroy }` |
| `useLiveRegion(options)` | — | Vue 包装，卸载即销毁 |
| `announce(text)` / `announceValues(values, maxCount?)` | — | **模块级单例**，复用同一个节点（README 契约第二条）；命令式 API 用 |
| `resetAnnounceRegion()` | — | 测试辅助 |
| `useRovingFocus(options)` | — | 组合式：受控/非受控状态 + 方向键 + 真实移动焦点 |
| `useActiveDescendant(options)` | — | 组合式：只产出 id，不渲染 |
| `useTypeahead(options)` | — | 组合式：缓冲 + 时间源可注入 + 「退化到单字符」的循环语义 |

### 5.3 三个组合式的分工

纯函数与组合式的边界是刻意的：

- **纯函数**回答「下一个下标是什么」「这个键算不算方向键」「哪个项匹配」—— 无状态、可穷举。
- **组合式**只负责把纯函数接到 Vue 的响应式与 DOM 上，并且**不注册任何全局监听**
  （`useRovingFocus` / `useTypeahead` 都要求调用方把键盘事件转发进来）。
  理由：「谁响应方向键」的边界必须是显式的，全局监听会误吞外部的方向键。

⚠️ 与 rc-menu 的对照：上游的 `useAccessibility` 是**一体式**的（把模式分派、元素查询、
raf 延迟、`triggerActiveKey` 全揉在一个 `onKeyDown` 里）。本包拆成「纯算术 + 组合式」，
是**有意**的结构差异 —— 上游那种写法无法在无 DOM 环境下测试。

---

## 6. 与上游的差异

| # | 上游 | 我们 | 理由 |
|---|---|---|---|
| 1 | `lockFocus` 的监听器挂在**全局 `window`** | 挂在**元素所属文档的 `defaultView`**（`ownerDocument.defaultView`），取不到时退全局 `window` | 与 `position` 的 `getWin` 同一判据；跨 iframe 场景更正确，且单文档下行为一致 |
| 2 | live region 有两套隐藏样式（0×0+opacity / 1×1+clip） | 统一用 **1×1+clip** | 0×0 + `opacity:0` 在部分读屏实现下会被判为「真正不可见」而跳过；1×1+clip 是 `visually-hidden` 的标准做法 |
| 3 | `focusable` 里 `tabIndex === null` 恒真的死条件 | 照抄 | 保留与上游的逐行可 diff 性 |
| 4 | typeahead **不存在** | 自行定义 | 见 §3.9 |
| 5 | `getNextFocusElement` 在 `count === 0` 时算出 `NaN` | 返回 `-1` | 两者对调用方都是「没有目标」，但 `-1` 是可用下标哨兵，不会把 NaN 带进后续算术 |
| 6 | live region 由组件渲染（`Polite.js` 内联） | `createLiveRegion` 直接建节点挂到 `body` | 本包**不产出组件**（§4 边界）；挂载位置属组件层 |
| 7 | `focusable` 里 `tabIndex === null` 恒真的死条件（§3.1 第 6 条） | utils 里已删掉该条件 | 这是 utils 的既有决定（在焦点陷阱那一侧），本包不重复判断 |

### 6.1 一处必须照抄的「两步式环绕」

见 §3.3 的 ⭐：**不 `preventDefault`**，靠 `focusin` 拉回。
jsdom 不会真的实现 Tab 移动焦点，所以 L2 测试必须**手动派发 `keydown` 再手动 `focus()`**
来模拟这一步，否则测不到。

---

## 7. 测试策略

| 层 | 内容 | 状态 |
|---|---|---|
| L1 | §5.1 全部纯函数逐项断言 —— `roving.test.ts`、`combobox.test.ts`、`live-region.test.ts` 的纯函数部分 | ✅ done |
| L2 | jsdom：焦点恢复的三条门与完整往返（`focus-restore.test.ts`）、live region 的节点生命周期（`live-region.test.ts`） | ✅ done |
| L3 | `a11y.test-d.ts`（含 10 条负例） | ✅ done |
| L4 | live region 的 DOM 产物（`role` / `aria-live` / 隐藏样式 / 挂载位置） | ✅ done |
| L5 | n/a —— 本包是**被** a11y 测试的对象，axe 扫描在 `test-utils` | n/a |
| L6 | n/a —— 零视觉产物 | n/a |
| L7 | `tests/build/run.mjs --package a11y`：10 checks / FAIL 0 / n/a 4 | ✅ done |

> ⚠️ 焦点陷阱那一侧的 L1/L2 在 `@apollo-design/utils` 的测试里（本包只再导出）。
> 本包不重复测别人的实现 —— 那是 T2 的另一半。

### 7.1 测试侧的坑（不写下来下次还会踩）

1. **jsdom 下 `isVisible` 恒 false** ⇒ `getFocusNodeList` 恒空。
   必须在桩替里给元素补 `getBoundingClientRect`（或 `offsetParent`）。
2. **`focusin` 在 jsdom 里可以 `dispatchEvent`**，但**不会自动移动焦点** ——
   Tab 的两步环绕要手动走完：`dispatchEvent(keydown)` → `element.focus()` → 断言 `syncFocus` 拉回。
3. `lockFocus` 的状态是**模块级单例**，测试之间必须 `unlock()` 干净，否则互相污染。

### 7.2 变异验证（确认断言不是「永远绿」）

本轮实际跑了 **6 处**变异，全部被抓到（共 10 个用例失败）：

| 变异 | 结果 |
|---|---|
| `nextRovingIndex` 去掉 `offset < 0` 时的 `focusIndex === -1` 特判 | ✅ 1 个 L1 失败 |
| `findTypeaheadIndex` 从 `fromIndex` 而不是 `fromIndex + 1` 开始 | ✅ 3 个 L1 失败 |
| `formatLiveRegionText` 把 `> maxCount` 改成 `>= maxCount` | ✅ 1 个 L1 失败 |
| `useFocusRestore` 去掉 `mask` 门 | ✅ 3 个 L2 失败 |
| `useFocusRestore` 去掉 `save` 的 `contains` 门（无条件覆盖） | ✅ 1 个 L2 失败 |
| `getRovingTabIndex` 恒返回 `0` | ✅ 2 个 L1 失败 |

（焦点陷阱那四条属于 utils 的测试，不在本轮范围内。）

---

## 8. 待裁决

### P1 · `typeahead` 的 `resetDelay` 默认 500ms 是否要对齐某个上游

上游无对应实现，500ms 取自通用实践。若将来发现 antd 某处有隐含期望，需回来改。

### P2 · live region 是否要提供 `assertive`

上游只用 `polite`。`assertive` 会打断读屏，除非有明确需求，否则暂不提供。
若提供，必须是**显式传入**，不能默认。

---

## 9. 这个包**没有**证明什么

1. **没有证明 typeahead 与任何上游一致** —— 上游不存在（§3.9）。它的语义是本项目自定义的，
   只能靠自身测试保证内部一致。**这是本包最大的一块无对齐区域。**
2. **没有证明焦点陷阱在真实浏览器下不闪** —— jsdom 不实现 Tab 的焦点移动，
   「两步式环绕」的第二步是我们手动模拟的（§6.1）。真实行为属 L6/手工验证。
   ⚠️ 而且这一条现在**落在 utils 的账上**（§1.1），本包只再导出。
3. **没有证明 `isVisible` 门在真实场景下正确** —— 焦点陷阱的 `isVisible` 前置门在 jsdom 下恒 false，
   utils 的测试用的是「桩替让它为真」的路径。本包自己没有触及这条门。
4. **没有证明 roving 索引算术能覆盖 Menu 的全部模式** —— 模式分派表（inline/horizontal/vertical
   × root/sub）是 Menu 私有的（§3.6），本包只移植了环绕算术本身。
5. **没有证明 live region 真被读屏播报** —— 那需要真实辅助技术。
   本包只能保证 DOM 形态（`role` / `aria-live` / 隐藏样式）与上游一致。
6. **没有证明 active-descendant 的 id 方案在虚拟滚动下正确** —— rc-select 在 `virtual` 模式下
   把 `a11yProps` 挂在一个独立的 div 上（`OptionList.js:282`），本包只提供了 id 生成函数，
   挂载位置属组件层。
7. **没有证明 live region 的隐藏样式在真实读屏下不被跳过** —— §6 第 2 条选 1×1+clip 而不是
   0×0+opacity 是**基于通用实践**的判断，不是实测结论。要证伪需要真实辅助技术。
8. **没有证明`useLiveRegion` 的「卸载即销毁」在组件被 keep-alive 缓存时的行为** ——
   `onScopeDispose` 在 `deactivate` 时**不**触发，所以缓存期间 live region 会一直留在 body 上。
   这是本包与「渲染在组件树里」的上游实现的**结构性差异**，尚未验证是否有可观察后果。
