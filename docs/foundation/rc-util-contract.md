# `@rc-component/util` 契约提取（`@apollo-design/utils` 的实现依据）

> **状态**：Phase 2 / S1 前置产物（Task 1）
> **事实来源**：`@rc-component/util@1.13.0` npm 产物（`es/` + `es/**/*.d.ts`），非记忆、非文档
> **消费侧事实来源**：`antd@6.6.4` npm 产物 `es/**/*.js` 的 165 条 `from '@rc-component/util'` 导入语句
> **提取工具**：`scripts/analyze-util-usage.mjs` → `registry/source/antd-util-usage.json`
>
> 本文档只描述**契约**（签名 + 语义 + 边界行为），不描述 antd 的实现代码。
> 实现必须由我们独立完成（`AGENTS.md` H1/H5/H6）。

---

## 1. 使用面（使用面 = 我们的实现面）

antd 6.6.4 对 `@rc-component/util` 的**全部**导入都走根 barrel（`165/165` 条均为 `from '@rc-component/util'`，
无任何子路径导入）。因此使用面 = 下面 32 个符号，无遗漏、无子路径。

| 符号 | 引用组件数 | 分类 |
| --- | ---: | --- |
| `omit` | 34 | A |
| `isReactRenderable` | 33 | A |
| `isNonNullable` | 26 | A |
| `useControlledState` | 22 | B |
| `useEvent` | 20 | C |
| `toArray` | 19 | B |
| `composeRef` | 16 | B |
| `pickAttrs` | 15 | A ⚠️ |
| `raf` | 11 | A |
| `useLayoutEffect` | 10 | B |
| `useDelayState` | 6 | B |
| `useComposeRef` | 6 | B |
| `mergeProps` | 6 | A |
| `getNodeRef` | 5 | B |
| `render` | 4 | B（不在 utils） |
| `merge` | 4 | A |
| `isEqual` | 4 | A ⚠️ |
| `useId` | 3 | B |
| `supportRef` | 3 | B |
| `KeyCode` | 3 | A |
| `useState` | 2 | B |
| `useMemo` | 2 | C |
| `unmount` | 2 | B（不在 utils） |
| `triggerFocus` | 2 | A |
| `isVisible` | 2 | A |
| `isStyleSupport` | 2 | A |
| `getDOM` | 2 | B |
| `warning`（`as rcWarning`） | 1 | A |
| `supportNodeRef` | 1 | B |
| `set` | 1 | A |
| `get` | 1 | A |
| `canUseDom` | 1 | A |

**分类定义**

- **A = 框架无关**：纯逻辑 / 纯 DOM，无 React 语义。→ 语义 **1:1 保留**，仅改名（去 React 色彩）。
- **B = React 特定**：语义绑定 React 的运行时模型。→ **必须用 Vue 原生机制重设计**，不可移植。
- **C = 不需要**：Vue 语言/运行时已覆盖，或仅为 React 服务。→ **不实现**，但必须写入 `COMPATIBILITY.md` 的映射规则。

---

## 2. A 组：框架无关符号的精确契约

### 2.1 `omit(obj, fields)`

```
omit<T extends object, K extends keyof T>(obj: T, fields: K[] | readonly K[]): Omit<T, K>
```

- **浅拷贝**：`Object.assign({}, obj)`，**不递归**。嵌套对象仍是同一引用。
- 仅当 `Array.isArray(fields)` 时删除；非数组时返回原样浅拷贝。
- `delete` 对不可配置属性静默失败（非严格模式下）。
- **实现要求**：保留「非数组 fields 不删任何键」这一分支行为（可被测试覆盖）。

### 2.2 `pickAttrs(props, ariaOnly?)` ⚠️ 见 §6.1

```
interface PickConfig { aria?: boolean; data?: boolean; attr?: boolean }
pickAttrs(props: object, ariaOnly?: boolean | PickConfig): {}
```

配置归一化（**顺序敏感**，`false` 必须显式判断，不能用 `??`）：

| 入参 | 归一化结果 |
| --- | --- |
| `false` / `undefined`（默认） | `{ aria: true, data: true, attr: true }` |
| `true` | `{ aria: true }` |
| `{...}` | `{ ...ariaOnly }`（**展开拷贝，未给的键为 `undefined` → falsy**） |

匹配规则（三个条件 `||` 连接，短路）：

1. `aria`：`key === 'role'` **或** `key.startsWith('aria-')`
2. `data`：`key.startsWith('data-')`
3. `attr`：`key` 命中内置白名单（`attributes` + `eventsName`，`split(/[\s\n]+/)`）

白名单必须**逐字**复刻（它决定了哪些属性会被透传到 DOM，是 DOM Contract 的一部分）。
清单内容见 `registry/source/rc-util-attr-allowlist.json`（由脚本从产物提取，避免手抄出错）。

> 白名单里的 `eventsName` 全部是 **React 合成事件名**（`onDoubleClick`、`onMouseEnter`…）。
> 在 Vue 侧必须做事件名映射 —— 见 §6.1。

### 2.3 `raf(cb, times = 1)` / `raf.cancel(id)` / `raf.ids()`

```
raf: { (cb: () => void, times?: number): number; cancel(id: number): void; ids(): Map<number, number> }
```

- **返回的是「包装 id」（自增 `rafUUID`），不是真实的 rAF handle。**
- 内部维护 `rafIds: Map<包装id, 真实id>`；每跳一次 rAF 就 `set(id, realId)` 覆盖，所以 map 里只保留**最后一跳**的真实 id。
- `times` 为跳数：`times = 1` 表示下一帧执行；`times = 0` **同步立即执行**（`callRef(0)` 直接 `callback()`）。
- 执行前先 `cleanup(id)`（从 map 删除），再调 `callback()`。
- `cancel(id)`：先 `cleanup(id)`，再 `caf(rafIds.get(id))`；若 id 不存在，`rafIds.get` 返回 `undefined` → `cancelAnimationFrame(undefined)`，**必须不抛错**（这是被依赖的行为）。
- 环境探测：`typeof window !== 'undefined' && 'requestAnimationFrame' in window` → 用 rAF，否则退化为 `setTimeout(cb, 16)` / `clearTimeout`。
- `ids()` **仅 dev 存在**（`process.env.NODE_ENV !== 'production'` 才挂载）。
- **测试注意**：`raf.ids()` 在 prod 构建中不存在；不要在生产分支断言它。

### 2.4 `isEqual(a, b, shallow = false)` ⚠️ 见 §6.2

```
isEqual(obj1: any, obj2: any, shallow?: boolean): boolean
```

- 深比较；`shallow = true` 时 `level > 1` 直接返回 `false`（只比一层）。
- 数组：长度必须相等，逐项递归。
- 普通对象：`Object.keys` 数量必须相等，再逐键递归。
- 其它（函数、Date、RegExp、Map、Set、Symbol、NaN…）：**一律 `false`**（除非 `a === b`）。即 `isEqual(NaN, NaN) === false`，`isEqual(new Date(0), new Date(0)) === false`。
- `refSet` 在**顶层调用内共享**，每次 `deepEqual(a, ...)` 都 `refSet.add(a)`；命中即 `warning(false, 'Warning: There may be circular references')` 并返回 `false`。
  → 副作用：**同一个对象在一棵树里出现两次也会被判不等**（非环但共享引用）。这是 quirk，必须保留（见 §6.2）。
- 依赖 `warning`。

### 2.5 `mergeProps(...items)`

```
mergeProps<A,B>(a: A, b: B): B & A   // 最多 4 个重载，运行时可变参
```

- 从左到右覆盖，但**跳过值为 `undefined` 的键**（这是与 `Object.assign` / `{...a, ...b}` 的唯一区别）。
- falsy 但非 `undefined`（`null` / `0` / `''` / `false`）**会覆盖**。
- 入参为 falsy（`null` / `undefined`）时跳过该参数。
- 只遍历 `Object.keys`（自身可枚举字符串键），不含 Symbol、不含原型链。

### 2.6 `isNonNullable(v)` / `isReactRenderable(v)`

```
isNonNullable<T>(v: T): v is NonNullable<T>            // v !== undefined && v !== null
isReactRenderable<T>(v: T): v is Exclude<NonNullable<T>, false | ''>
                                                       // isNonNullable(v) && v !== false && v !== ''
```

- `isReactRenderable(0) === true`，`isReactRenderable(true) === true`，`isReactRenderable('') === false`。
- 语义在 Vue 中完全一致（`0` 应被渲染），**但名字必须改**：Vue 无 React node 概念 → 命名为 `isRenderable`。
  `v-if` 会把 `0` 当 falsy，所以组件内部**不能**用 `v-if="someProp"`，必须用 `v-if="isRenderable(someProp)"`。这是需要写进 `COMPONENT-RULES.md` 的强制规则。

### 2.7 `KeyCode`

- 纯数字常量表（`MAC_ENTER:3` … `WIN_IME:229`）+ 3 个函数。
- `isTextModifyingKeyEvent(e)`：`e.altKey && !e.ctrlKey || e.metaKey || (keyCode in [F1..F12])` → `false`；再对一张白名单 keyCode 返回 `false`，其余 `true`。
- `isCharacterKey(keyCode)`：区间 `[ZERO..NINE]`、`[NUM_ZERO..NUM_MULTIPLY]`、`[A..Z]` → `true`；`window.navigator.userAgent.indexOf('WebKit') !== -1 && keyCode === 0` → `true`；再一张标点白名单。
  ⚠️ **直接引用 `window.navigator`**，无 `canUseDom` 保护 → 我们必须在 SSR/无 DOM 环境返回 `false` 而不是抛错（**有意修正，登记为 deviation**）。
- `isEditableTarget(e)`：`e.target instanceof HTMLElement` 且 `tagName ∈ {INPUT, TEXTAREA, SELECT}` 或 `isContentEditable`。
- 全部是 `keyCode`（已废弃的 DOM 属性），不是 `e.key`。antd 的 `table`/`typography` 依赖它 → 必须保留 `keyCode` 语义。

### 2.8 DOM 基础

| 符号 | 契约 |
| --- | --- |
| `canUseDom()` | `!!(typeof window !== 'undefined' && window.document && window.document.createElement)` |
| `contains(root, n?)` | `root` falsy → `false`；有原生 `root.contains` → 直接调用；否则沿 `n.parentNode` 上溯比较 |
| `isVisible(el)` | 非 `Element` → `false`；`offsetParent` 存在 → `true`；否则 `getBBox()` 或 `getBoundingClientRect()` 的 `width \|\| height` 非 0 → `true` |
| `isStyleSupport(name)` | `canUseDom() && document.documentElement` 才检测；数组时 **`some`**（任一支持即 true） |
| `isStyleSupport(name, value)` | 先 `isStyleNameSupport(name)`；再建 `<div>` 写入 `style[name] = value`，比较写入前后是否变化 |
| `getFocusNodeList(node, includePositive=false)` | `querySelectorAll('*')` 过滤 `focusable`，若 `node` 自身 focusable 则 `unshift` 到队首（顺序：自身 → 文档序） |
| `triggerFocus(el, opt?)` | `el.focus(opt)`；`opt.cursor` 为 `start/end/其它` 时对 `HTMLInputElement`/`HTMLTextAreaElement` 调 `setSelectionRange` |

`focusable(node, includePositive)` 判定（`isVisible` 为前提）：

1. `nodeName ∈ {input, select, textarea, button}` 或 `isContentEditable` 或 (`a` 且有 `href`)
2. `tabindex` 属性可解析为数字 → 用它；否则若 1 成立 → `0`
3. 若 1 成立且 `node.disabled` → `tabIndex = null`
4. 结果：`tabIndex !== null && (tabIndex >= 0 || (includePositive && tabIndex < 0))`

`lockFocus(element, id)` / `useLockFocus(lock, getElement)`：

- 模块级状态：`lastFocusElement`、`focusElements: HTMLElement[]`、`idToElementMap: Map<id, el>`、`ignoredElementMap: Map<id, el>`。
- `lockFocus` 把 element 挪到 `focusElements` 末尾（去重后 push）→ **后锁者生效**；监听 `window` 的 `focusin`（冒泡）与 `keydown`（**capture**）。
- `syncFocus`：若 `activeElement` 在 ignored 内 → 放行；否则若最后锁的元素不含 `activeElement` → 聚焦 `lastFocusElement`（若仍可聚焦）或列表首项，`{ preventScroll: true }`；否则记录 `lastFocusElement = activeElement`。
- `onWindowKeyDown`：`Tab` 时若 `shiftKey && activeElement === first` → 跳到 `last`；若 `!shiftKey && activeElement === last` → 跳到 `first`。即**循环 Tab**。
- 卸载：清 `lastFocusElement`、移除 element、删两个 map；`focusElements` 空时移除两个全局监听。
- `useLockFocus` 返回 `[ignoreElement]`；`ignoreElement(ele)` 写入 `ignoredElementMap`（**只能忽略一个**，后写覆盖）。
- `useLockFocus` 内含「retry effect」：元素未就绪时重试 **1 次**（`retryTimes >= 1` 后放弃）。

### 2.9 `get` / `set` / `merge` / `mergeWith`

```
get(entity, path: (string|number|symbol)[]): any
set<Entity, Output, Value>(entity, paths: Path, value: Value, removeIfUndefined = false): Output
mergeWith<T extends object>(sources: T[], config?: { prepareArray?: (cur, next) => any }): T
merge<T extends object>(...sources: T[]): T
```

- `get`：逐级取值；中途遇 `null`/`undefined` 立即返回 `undefined`。
- `set`：**不可变**（返回新对象/数组，原对象不变）。
  - `paths.length === 0` → 返回 `value`（整体替换）。
  - 当前层 `!entity && typeof path === 'number'` → 建 `[]`；`Array.isArray(entity)` → `[...entity]`；否则 `{...entity}`。
  - `removeIfUndefined && value === undefined && restPath.length === 1` → `delete clone[path][restPath[0]]`（**注意此处会改到 clone 里的子对象**，因为浅拷贝共享引用 —— quirk，保留）。
  - 顶层守卫：`paths.length && removeIfUndefined && value === undefined && !get(entity, paths.slice(0, -1))` → 原样返回 `entity`（父路径不存在则不动）。
- `mergeWith(sources, config)`：`clone = createEmpty(sources[0])`（数组→`[]`，否则 `{}`）；对每个 source 递归。
  - 数组：`set(clone, path, prepareArray(originValue, value))`，默认 `prepareArray = () => []` → **数组整体替换**。
  - 普通对象：`isObject` = `typeof obj === 'object' && obj !== null && Object.getPrototypeOf(obj) === Object.prototype`（**必须是纯对象**，class 实例 / Date / Map 不算）。
  - 用 `loopSet: Set` 做环检测（每层 `new Set(parentLoopSet)`）；命中环则跳过该子树。
  - 键遍历用 `Reflect.ownKeys`（`Reflect` 不存在时退化为 `Object.keys`），且过滤 `getOwnPropertyDescriptor(...).enumerable`。
- `merge(...sources)` = `mergeWith(sources)`。

### 2.10 warning 体系

```
warning(valid: boolean, message: string): void      // valid=false 且 dev 时 console.error(`Warning: ${msg}`)
note(valid, message): void                          // 同上但 console.warn(`Note: ${msg}`)
call(method, valid, message): void                  // 去重：同一 message 只调一次
warningOnce(valid, message): void
noteOnce(valid, message): void
preMessage(fn: (msg, type: 'warning'|'note') => string | null | undefined | number): void
resetWarned(): void
// 默认导出 = warningOnce，且 warningOnce.preMessage / .resetWarned / .noteOnce 三个静态属性必须存在
```

- **全部 dev-only**：`process.env.NODE_ENV !== 'production' && !valid && console !== undefined` 才输出。
- `preWarningFns` 是**累加数组**，按注册顺序 `reduce`；`preMessage` 返回 `null` 可阻止输出。
- 去重表 `warned` 是模块级对象，`resetWarned()` 清空。
- 消息前缀由调用方拼：antd 用 `[antd: ${component}] ${message}`。
- **Vue 侧**：antd 在此之上还包了一层 `devUseWarning(componentName)`（`_util/warning.js`），提供：
  - `typeWarning(valid, type, message)`，`type === 'deprecated'` 且 `WarningContext.strict === false` 时**不逐条告警**，而是累积到 `deprecatedWarnList`，只在**首次**打印 `console.warn('[antd] There exists deprecated usage in your code:', list)`。
  - `typeWarning.deprecated(valid, oldProp, newProp, message?)`，文案 `` `${oldProp}` is deprecated. Please use `${newProp}` instead.${message ? ' ' + message : ''} ``。
  - `WarningContext` 是 `{}` 默认值的 context（React context）→ Vue 用 `provide/inject` 复刻，键名 `apolloWarning`。
  - **测试语义**：`process.env.NODE_ENV === 'test'` 时每次 warning 后自动 `resetWarned()`（否则测试间互相污染）。

---

## 3. B 组：必须用 Vue 重设计的符号

### 3.1 `useControlledState(defaultStateValue, value?)` → `defineModel` / `useControlledValue`

React 语义：`mergedValue = value !== undefined ? value : innerValue`；`useLayoutEffect([value])` 在**非首次挂载**时 `setInnerValue(value)`（即受控 → 非受控切换时把内部值重置为 `undefined`）。

**Vue 映射决策**

| 场景 | Vue 方案 |
| --- | --- |
| SFC 中，prop + 事件是标准 `v-model` 对 | **`defineModel<T>()`**（编译器宏，首选） |
| SFC 中，prop 名非 `modelValue` | `defineModel<T>('value')` |
| `.ts` composable 内（无 SFC 上下文，如 `form-core`/`picker` 的 headless 逻辑） | `useControlledValue(defaultValue, getValue, onChange)` |

**`defineModel` 与 React 语义的差异（必须登记）**

- React 在受控状态下仍会更新 `innerValue`（只是被 `mergedValue` 屏蔽）；Vue 的 `useModel` 用 `localValue` + `needReset` 机制，语义上等价但**不产生同样的"内部状态被同步"副作用**。该副作用无人依赖（antd 只在非受控态读它）。
- React 的 `value === undefined` 表示非受控；Vue 的 `defineModel` 在父组件不绑定 `v-model` 时 `props.value === undefined` → 行为一致。
- **`defaultValue` 语义**：React 的 `defaultStateValue` 在挂载后变更无效；`defineModel` 的 `default` 同理（只在 `props` 为 `undefined` 时使用，且是**惰性 getter**）。

### 3.2 `useDelayState(defaultValue)` → `useDelayState`（保留名字，Vue 实现）

语义：**默认在下一帧更新；pending 更新总是被最新值替换**。

- 返回 `[value, setValue]`；`setValue(next, immediatelyOrDelay?)`：
  - `immediatelyOrDelay === true` → 立即 `setValue`
  - `{ ms }` → `setTimeout`，取消前一个
  - `{ frame: n }` / 默认 → `raf(..., n)`，取消前一个
- 每次调用先 `cancelPending()`。
- `next` 支持函数式更新 `(prev) => next`。
- Vue 实现要点：`shallowRef` + 手动取消（**不要**用 `watchEffect`，会破坏"帧对齐"语义）。

### 3.3 `useLayoutEffect(cb: (mount: boolean) => void | VoidFunction, deps?)` → `useLayoutUpdateEffect` / `onMounted`+`watch`

React 语义：布局阶段副作用；`cb` 收到 `mount: boolean`；返回的函数作为 cleanup。

**Vue 映射**

```
useLayoutEffect(cb, deps)  ≙  onMounted(() => cleanup = cb(true)) + watch(deps, () => { cleanup?.(); cleanup = cb(false) }, { flush: 'post' })
```

- `flush: 'post'` 在 DOM 更新后、微任务内执行 → 与 React 布局副作用「绘制前」的时机等价。
- ⚠️ **顺序差异**：React 的布局副作用是**逐组件**在提交阶段同步执行；Vue 的 `flush: 'post'` 是**同一 flush 内所有组件更新完之后**执行。对 antd 的用法（测量 DOM、同步受控值）无影响，但**测量类代码必须容忍同批多个组件的相对顺序不确定**。
- `deps` 数组 → Vue 的 `watch` source 数组：React 的 deps 是**任意值**，Vue 需要 getter → 用 `deps.map(d => () => toValue(d))`。
- React 的 `useLayoutUpdateEffect(cb, deps)`（只在非首次运行）→ `useUpdateEffect(cb, deps)`，我们提供这个更 Vue 惯用的名字，**不**提供 `useLayoutUpdateEffect`。

### 3.4 `useId(id?)` → `useId(id?)`（Vue 3.5 原生）

- Vue 3.5+ 有内置 `useId()`，返回 `v-0`、`v-1`…（同一 app 内稳定且唯一）。
- 映射：`return id ?? vueUseId()`。
- **测试影响（重要）**：React 产出 `«r0»` / `:r1:`，Vue 产出 `v-0`。**DOM Contract 测试不得断言具体 id 值**，只能断言：非空、两次渲染稳定、同页唯一、且能作为 `aria-controls` / `aria-labelledby` / `for` 的有效目标。
- `resetUuid()` / `getId(prefix, key)` 是 `@rc-component/util` 的额外导出，antd 未使用 → 不实现。
- ⚠️ antd 的 `useId` 在 `NODE_ENV === 'test'` 时固定返回 `'test-id'`（便于测试）。**我们不复刻这个行为**：它会让「同页唯一」断言失效，且属测试便利而非契约 → 登记为 deviation。

### 3.5 `toArray(children, { keepEmpty })` → `toArray(children, { keepEmpty })`

React 语义：展平 `Children`；跳过 `undefined`/`null`（除非 `keepEmpty`）；`Array` 递归；**Fragment 拆包**（读 `child.props.children`）。

Vue 映射要点：

- 输入可能是：`VNode[]`、单个 `VNode`、`Slot`（函数）、`undefined`、嵌套数组、`Fragment` vnode。
- `isFragmentVNode(vnode)` 判定：`vnode.type === Fragment`（`import { Fragment } from 'vue'`）。**不需要** React 的 `Symbol.for('react.fragment')` 那套。
- Fragment 拆包：读 `vnode.children`（**不是** `props.children`）。
- 跳过条件：`vnode == null` → 跳过（`keepEmpty` 时保留）。**`false` / `''` / `0` 作为 vnode 不会出现**（Vue 在创建 vnode 前已归一化为文本 vnode 或 `Comment`），所以 `isReactRenderable` 的语义在 vnode 层不适用 —— 需要的是**文本 vnode 层面的空值判定**，见 §6.3。
- React 的 `Children.forEach` 会对缺失 `key` 的元素告警；Vue 在编译期处理 → 无关。

### 3.6 `findDOMNode` / `getDOM` / `isDOM` → `getDOM` / `isDOM`

- `isDOM(v)`：`v instanceof HTMLElement || v instanceof SVGElement`。Vue 侧**必须加 `typeof HTMLElement !== 'undefined'` 守卫**（SSR）。
- `getDOM(v)`：`v?.nativeElement` 是 DOM → 返回它；`isDOM(v)` → 返回 `v`；否则 `null`。
  Vue 侧的等价输入是 `ComponentPublicInstance` → 它的 DOM 在 `$el`。→ 我们的 `getDOM` 需支持：`HTMLElement | SVGElement | ComponentPublicInstance | { $el } | { nativeElement } | null`。
- `findDOMNode`：`getDOM(node)` → `getDOM(node.current)`（React ref 对象）→ `null`。Vue 侧 `Ref<T>` 是 `{ value }` 而非 `{ current }` → 我们的实现要同时接受 `{ current }` 与 `{ value }`（跨实现兼容的输入形态），但**对外只承诺 Vue 形态**。
- **结论**：`findDOMNode` 这个名字在 Vue 里无意义（Vue 没有 React 的 findDOMNode 反模式）→ **不导出 `findDOMNode`**，只导出 `isDOM` / `getDOM` / `getElement`。

### 3.7 `fillRef` / `composeRef` / `useComposeRef` / `supportRef` / `supportNodeRef` / `getNodeRef`

- `fillRef(ref, node)`：函数 → `ref(node)`；`{ current: ... }` 对象 → `ref.current = node`。
  Vue 侧 ref 形态：函数、`Ref<T>`（`{ value }`）、`null`/`undefined`。→ 我们的 `fillRef` 必须支持 `{ value }`。
- `composeRef(...refs)`：过滤 falsy；`length <= 1` → 返回 `refList[0]`（**注意：返回原 ref，不包装**，这是可被观测的行为）；否则返回一个函数，对每个 ref 调 `fillRef`。
- `useComposeRef(...refs)`：带**自定义比较器**的 memo —— `prev.length !== next.length || prev.every((r, i) => r !== next[i])` 时重建。Vue 侧用 `computed` 无法表达"按数组元素身份缓存"，因为 `refs` 不是响应式源。
  → 实现：接受 `MaybeRefOrGetter<...>[]`，用 `computed` 读取每个 `toValue`，内部按 `[length, ...identity]` 比较决定是否复用上一次的合并函数。**必须复用**，否则每次渲染产生新函数 → 子组件 ref 反复 detach/attach。
- `supportRef(nodeOrComponent)`：React 用它判断「把 ref 传下去能不能拿到 DOM」。React 19 起"是元素即支持"。
  Vue 侧等价判断：**是元素 vnode 或组件 vnode → `true`**；Fragment / 文本 / 注释 vnode → `false`。
  组件 vnode 能拿到 DOM 的前提是单根（Vue 3 单根组件 `$el` 可用；多根组件的 `$el` 是 Fragment 锚点，**不可靠**）。
  → 我们的 `supportRef(vnode)`：`isElementVNode(vnode) || (isComponentVNode(vnode) && isSingleRootComponent(vnode))`。多根组件无法静态判定 → **默认视为支持，由 `getDOM` 在运行时返回 `null`**（失败降级而非抛错），并登记 deviation。
- `supportNodeRef(node)` = `isElementVNode(node) && supportRef(node)`（React 版要求 `isValidElement && !isFragment`）。
- `getNodeRef(node)`：React 19 从 `node.props.ref` 或 `node.ref` 取。
  Vue 侧：vnode 的 ref 解析结果在 `vnode.component?.proxy`（组件）或 `vnode.el`（元素）。→ `getNodeRef(vnode) = vnode.component?.proxy ?? vnode.el ?? null`。

### 3.8 `render(node, container)` / `unmount(container)` → **不放在 utils**

React 语义：`createRoot(container)` 缓存到 `container.__rc_react_root__`，`render(node)`；`unmount` 在微任务里 `root.unmount()` 并删除标记（避开 React 18 的同步告警）。

Vue 映射（关键架构决策，**AR7**）：

- Vue 的等价物是 `render(vnode, container)` / `render(null, container)`（来自 `vue`），**不是** `createApp().mount()`。
  原因：`createApp` 会创建**独立的 app 上下文**，拿不到宿主 app 的 `provide`（ConfigProvider 的主题、locale、prefixCls 全部丢失）。`render()` + 手动 `vnode.appContext = appContext` 才能继承。
- `appContext` 捕获：`getCurrentInstance()!.appContext`（在宿主组件的 setup 期捕获并保存）。
- 容器标记：用 `Symbol('apolloRoot')` 或 `__apollo_root__` 属性缓存已挂载的 vnode，避免重复挂载。
- **归属**：3 个消费者（message / notification / modal），但含 Vue 渲染器耦合与 `appContext` 语义，属**引擎级**能力 → 放在 `packages/ui/src/_internal/render.ts`，**不放 L0 utils**（L0 必须保持"纯逻辑 + 无渲染语义"）。
- 这是 Phase 2 需要 PoC 的第二个架构风险点（第一个是 AR1 trigger 定位）。

---

## 4. C 组：不实现的符号

| 符号 | 为什么不需要 |
| --- | --- |
| `useEvent` | Vue 的 `setup()` 只执行一次，`props` 是响应式代理 → 闭包天然读到最新值，无需 stable identity。**代价**：必须禁止 `const { onX } = props` 解构，否则重新引入 stale closure。→ 写入 `COMPONENT-RULES.md` 强制规则 + 建议 lint。 |
| `useMemo(getValue, condition, shouldUpdate)` | Vue 的 `computed` 自带缓存且依赖追踪比手写比较器更精确。antd 用它只是为规避 React 的引用相等重渲染。→ 用 `computed`。 |
| `useMergedState` | 已被 `@rc-component/util` 标记 `@deprecated`，且 antd 6.6.4 **零引用**（已核实：165 条导入语句中无此符号）。 |
| `isFragment`（React 版） | Vue 用 `vnode.type === Fragment`。 |
| `Children/toArray` 的 React 实现 | 保留语义，重写实现（§3.5）。 |
| `note` / `noteOnce` / `preMessage` | antd 未使用（仅 `warning` 被导入）。**但**：`warningOnce.preMessage` / `.resetWarned` / `.noteOnce` 是默认导出对象的静态属性，antd 读 `resetWarned` → **必须保留 `resetWarned`**；`preMessage` / `noteOnce` 一并保留以保证 `warningOnce` 对象形状完整（成本极低）。 |
| `getScrollBarSize` | antd 未直接导入。antd 的 `_util/getScroll.js` 只用 `is*` 判断。→ **降级为内部工具**，不导出为公开 API（README 里已列出，需修正）。 |
| `Dom/dynamicCSS` / `Dom/shadow` / `Dom/scrollLocker` / `hooks/useMobile` / `hooks/useSyncState` / `hooks/useEffect` / `utils/get`（深层路径） | antd 零引用。`scrollLocker` 的职责由 `@apollo-design/portal` 的滚动锁承担。 |

---

## 5. antd `_util` 中属于地基层的部分（本轮不实现，登记待办）

`es/_util/` 共 60 个条目。按「≥2 消费者 且 无视觉语义」筛选，属于地基候选的：

| antd `_util` 模块 | 引用数 | 归属判断 |
| --- | ---: | --- |
| `is.js`（`isNumber/isString/isPlainObject/isFunction/isThenable/isPrimitive/isWindow/isDocument/isHTMLElement/isTransitionEvent`） | 110 | → **utils**（框架无关） |
| `warning.js`（`devUseWarning` + `WarningContext` + `deprecated`） | 95 | → **utils**（需要 `provide/inject`，可接受） |
| `reactNode.js`（`isValidElement` / `cloneElement` 替代） | 25 | → **utils**，需重设计为 vnode 操作 |
| `statusUtils.js`（`getStatusClassNames`） | 29 | → utils，但**产出类名 → 有视觉语义** → 归 `ui`（L3） |
| `responsiveObserver.js` | 25 | → **utils**（媒体查询单例，框架无关） |
| `getRenderPropValue.js` | 8 | → utils |
| `toList.js` | 4 | → utils |
| `capitalize.js` | 1 | → utils（消费者不足，但成本≈0，随 `is` 一起给） |
| `motion.js` / `wave/` | 18 / 11 | → `@apollo-design/motion`（AR2 PoC） |
| `PurePanel.js` / `ActionButton.js` / `ContextIsolator.js` / `placements.js` / `aria-data-attrs.js` / `zindexContext.js` / `scrollTo.js` / `throttleByAnimationFrame.js` / `colors.js` / `easings.js` / `gapSize.js` / `transKeys.js` / `convertToTooltipProps.js` / `normalizeIcon.js` / `fallbackProp.js` / `copy.js` / `getScroll.js` / `styleChecker.js` / `hooks/*` | 1–11 | → `ui`（单一或少数消费者，或含视觉语义） |

> `statusUtils` 是**唯一**一个"高引用但含视觉语义"的模块 —— 它是 `ui` 层跨组件复用的典型例子，
> 印证了 `ARCHITECTURE.md` 的分层判据（视觉语义必须留在 L3，不能下沉到 L0）。

---

## 6. 关键发现（跨组件风险，必须在实现前定案）

### 6.1 ⚠️ F1：`pickAttrs` 在 Vue 下会静默失效 —— 事件名必须归一化

antd 把 `onXxx` 透传给 React DOM，由 **React 的合成事件系统**做名称归一化。
Vue 的 `runtime-dom` 只判断 `/^on[^a-z]/`，然后对事件名做 **`hyphenate()`**，不做同义词归一化：

| React 事件名（`pickAttrs` 白名单内） | Vue `hyphenate` 后监听的事件 | 真实 DOM 事件 | 结果 |
| --- | --- | --- | --- |
| `onDoubleClick` | `double-click` | `dblclick` | ❌ 永不触发 |
| `onMouseEnter` / `onMouseLeave` | `mouse-enter` / `mouse-leave` | `mouseenter` / `mouseleave` | ❌ 永不触发 |
| `onKeyDown` / `onKeyUp` / `onKeyPress` | `key-down` / … | `keydown` / … | ❌ 永不触发 |
| `onTouchStart` / `onTouchMove` / `onTouchEnd` | `touch-start` / … | `touchstart` / … | ❌ 永不触发 |
| `onPointerDown` / … | `pointer-down` / … | `pointerdown` / … | ❌ 永不触发 |
| `onCompositionStart` / `onCompositionEnd` | `composition-start` / … | `compositionstart` / … | ❌ 永不触发 |
| `onAnimationStart` / `onTransitionEnd` | `animation-start` / … | `animationstart` / … | ❌ 永不触发 |
| `onBeforeInput` / `onBeforeToggle` / `onAuxClick` | `before-input` / … | `beforeinput` / … | ❌ 永不触发 |
| `onContextMenu` | `context-menu` | `contextmenu` | ❌ 永不触发 |
| `onScrollEnd` / `onGotPointerCapture` | `scroll-end` / … | `scrollend` / … | ❌ 永不触发 |
| `onClick` / `onInput` / `onBlur` / `onCopy` / `onLoad` / `onError` / `onScroll` / `onWheel` / `onReset` / `onSubmit` / `onToggle` | `click` / … | 同名 | ✅ 但见下 |

即使"名字碰巧对上"的也有语义差：

- `onChange`：React 在文本输入上等价于 `input` 事件（每次击键）；Vue 监听的是原生 `change`（失焦才触发）。
- `onFocus` / `onBlur`：React 的 `onFocus`/`onBlur` **冒泡**（等价 `focusin`/`focusout`）；原生 `focus`/`blur` **不冒泡**。

**结论（必须落地的设计）**

1. `@apollo-design/utils` 提供 `toNativeEventName(reactEventName): string | null` 映射表，
   覆盖 `pickAttrs` 白名单里的全部 `eventsName`。
2. `pickAttrs` 在 Vue 侧**默认做事件名转换**：输出对象的键为原生事件名（`dblclick`），值为原 listener。
   这样 `v-bind="pickAttrs(props)"` 才能正常工作。
   → 这是一个**行为差异**，登记为 deviation（编号待分配）。
3. `onChange` / `onFocus` / `onBlur` 的语义差**不能**在 `pickAttrs` 层修（需要知道元素类型）。
   → 归入「attrs 透传规范」，写入 `COMPATIBILITY.md`：组件必须显式处理 `onChange`，不能依赖透传。
4. **影响面远超 15 个组件**：任何 `v-bind="$attrs"` 到原生元素的组件都受影响。这是 Phase 2 暴露出的**最高优先级跨组件风险**。

### 6.2 ⚠️ F2：`isEqual` 的共享引用 quirk

`refSet` 在顶层调用内共享 → 同一个对象出现两次即被判不等。antd 用它比较 `theme` / `classNames` 等
「结构相同但可能共享子对象」的配置。**必须 1:1 保留**（否则某些配置会被判"变了"而触发多余更新，
或反之被判"没变"而漏更新）。测试必须显式覆盖：
`isEqual({a: o, b: o}, {a: o, b: o})` 中同一 `o` → `false`；用两个结构相同的不同对象 → `true`。

### 6.3 ⚠️ F3：`isReactRenderable` 的 Vue 侧对应物是「文本 vnode 判空」

React 里 `{0}` 会渲染 `0`，`{''}` 不渲染。Vue 里 `h('span', [0])` 会创建**文本 vnode**，`h('span', [''])`
也会创建文本 vnode（内容为空字符串）→ **两者都"存在"**，用 vnode 存在性判空会得到错误结果。

因此 Vue 侧需要两个层次的判空：

| 层次 | 函数 | 用途 |
| --- | --- | --- |
| 值层（props 传入的原始值） | `isRenderable(v)` | 决定是否渲染某块内容，语义 = `isReactRenderable` |
| vnode 层（插槽产出的 vnode） | `isEmptyVNode(v)` | 过滤 `Comment` vnode、文本 vnode 且内容为 `''`、`Fragment` 且子节点全空 |

`isEmptyVNode` 是 antd 没有、但 Vue 必需的新能力。**若不提供，所有"有内容才渲染包裹元素"的逻辑
（如 `empty`、`card` 的 header、`descriptions` 的 title）都会产出多余空节点，导致 DOM Contract 与视觉回归失败。**
→ 登记为「新增能力」，写入 `COMPATIBILITY.md`。

### 6.4 ⚠️ F4：`process.env.NODE_ENV` 在 Vite 消费侧

antd 用 `process.env.NODE_ENV !== 'production'` 门控全部告警。Vite **会**为依赖注入
`process.env.NODE_ENV` 的 define 替换，但为稳妥（也为了 CJS 产物可用），我们的实现必须：

```
const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'
```

并在 `import.meta.env` 存在时优先使用它（Vite 库模式下的更准确信号）。
**禁止**在产出代码里直接裸写 `process.env.NODE_ENV`（CJS/ESM 双产物下会破坏 tree-shaking）。

### 6.5 ⚠️ F5：`KeyCode.isCharacterKey` 无 DOM 守卫

原实现直接读 `window.navigator.userAgent`。SSR / jsdom（`window` 存在但 `navigator` 可能被 mock 掉）下会抛错。
→ 我们的实现返回 `false` 而不是抛错。**登记为 deviation（INTENDED 类）**。

### 6.6 F6：`lockFocus` 的全局状态在 Vue 中需要 scope 隔离

`lastFocusElement` / `focusElements` / 两个 `Map` 是**模块级单例**。Vue 组件卸载不一定会调用
`lockFocus` 的返回函数（例如 `onScopeDispose` 时机差异）→ 可能残留。
→ 我们的 `useLockFocus` 必须用 `onScopeDispose` + `tryOnScopeDispose` 保证清理，并在清理时
调用 `syncFocus` 相关状态重置（与 React 版一致地重置 `lastFocusElement`）。

---

## 7. 对测试体系的影响

| 层 | 由本次提取新增的测试要求 |
| --- | --- |
| L1 单元 | `raf` 的包装 id / cancel 幂等 / `times=0` 同步执行；`set` 的 `removeIfUndefined` 三个分支；`mergeWith` 环检测；`isEqual` 共享引用 quirk；`pickAttrs` 三种配置 + 事件名映射；`warning` 去重 + `preMessage` 阻断 |
| L2 交互 | `useDelayState` 的"pending 被最新值替换"；`useControlledValue` 的受控↔非受控切换；`lockFocus` 的循环 Tab |
| L3 类型 | `omit` 的 `Omit<T,K>` 推断；`mergeProps` 的重载（`B & A`）；`set` 的 `Output` 泛型；`pickAttrs` 的返回类型 |
| L4 DOM Contract | 事件名归一化后 `dblclick` 真的被触发（反向验证：`double-click` 不触发）；`isVisible` 对 `offsetParent` 的依赖 |
| L5 无障碍 | `useId` 产出的 id 可作为 `aria-*` 目标（**不断言具体值**）；`lockFocus` 的焦点不逃逸 |
| L7 构建 | 产物中不得出现 `react`；`process.env.NODE_ENV` 被正确替换；`raf.ids` 在 prod 产物中不存在 |

---

## 8. 对 `@apollo-design/utils` 公开 API 的最终决定

**保留（语义 1:1，仅去 React 色彩）**
`omit` `pickAttrs`(+`toNativeEventName`) `raf`/`cancelRaf` `isEqual` `mergeProps` `isNonNullable` `isRenderable`
`KeyCode` `canUseDom` `contains` `isVisible` `isStyleSupport` `getFocusNodeList` `triggerFocus` `lockFocus`
`get` `set` `merge` `mergeWith` `warning` `note` `warningOnce` `noteOnce` `preMessage` `resetWarned`
`devUseWarning` `WarningContextKey` `toList` `capitalize`

**新增（Vue 必需，antd 无对应）**
`isEmptyVNode` `isVNode` `isElementVNode` `isComponentVNode` `isFragmentVNode` `toArray` `isDOM` `getDOM`
`fillRef` `composeRef` `useComposeRef` `supportRef` `supportNodeRef` `getNodeRef`
`useControlledValue` `useDelayState` `useUpdateEffect` `useId` `useSafeState`

**移除**
`useEvent` `useMemo` `useMergedState` `findDOMNode` `getScrollBarSize`(降为内部)

**修正 README**：`@apollo-design/utils` 的 README「公开 API」一节需按本节重写
（原文列出的 `throttle/debounce`、`useResizeObserver`、`useMutationObserver`、`useOverflow`、
`easings`、`placements`、`convertToTooltipProps`、`getRenderPropValue` 归属待定，
其中 `easings`/`placements`/`convertToTooltipProps` 含视觉/组件语义 → 应移到 `ui`；
`getRenderPropValue` 是 Vue 插槽的替代物 → 不需要；`throttleByAnimationFrame` 保留）。

---

## 9. 待裁决

| # | 问题 | 影响 |
| --- | --- | --- |
| Q1 | `prefixCls` 默认值 `apollo` 还是 `ant`？ | 决定 warning 前缀 `[apollo: X]` vs `[ant: X]`，进而决定全部告警断言与快照 |
| Q7 | 是否接受 §6.1 的「`pickAttrs` 默认转换事件名」这一行为差异？ | 影响 15+ 组件与全部 attrs 透传 |
| Q8 | `useId` 是否需要在测试环境固定为常量（antd 行为）？ | 影响所有 `aria-*` 关联的 DOM Contract 断言 |
