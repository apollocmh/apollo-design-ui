# `portal` 契约文档

> G1/G2 分析产物。**先于实现存在**（`AGENTS.md` §2：步骤 3 的产物必须先于步骤 5）。
> 事实来源优先级：用户指令 > 仓库规范文件 > `registry/*.json` > antd 固定版本产物/源码 > 官方文档 > 模型先验。

---

## 1. 这个包解决什么

`registry/dependencies.json` 的 purpose 原文：

> 基于 Vue Teleport：**容器创建与复用**、**SSR 安全延迟挂载**、**getPopupContainer 解析**、
> **z-index 层级管理**、**同容器内多浮层堆叠顺序**

`strategy: apollo` 的 rationale 说得很直白：

> Vue 的 `<Teleport>` 解决了「渲染到别处」，但 antd 还需要：容器创建与复用、SSR 安全的延迟挂载、
> `getPopupContainer` 解析、z-index 层级管理、以及「同一容器内多个浮层的堆叠顺序」。这些必须自己实现。

也就是说：**Teleport 只是运输工具，本包要做的是「运到哪、什么时候运、谁压着谁」**。

---

## 2. 事实来源

| 来源 | 版本 / 路径 | 取用范围 |
|---|---|---|
| `@rc-component/portal` | **2.1.0**（`@rc-component/dialog@1.10.0` 声明 `^2.1.0`，dialog 由 antd 6.6.4 锁 `~1.10.0`） | `es/Portal.js`、`es/useDom.js`、`es/Context.js`、`es/mock.js` |
| antd | 6.6.4 | `components/_util/hooks/useZIndex.ts`、`components/_util/zindexContext.ts`、`components/theme/themes/seed.ts:73`、`components/config-provider/index.tsx:188` |

⚠️ antd 6.6.4 **不直接依赖** `@rc-component/portal`，是经 `@rc-component/dialog` 传递进来的。
所以「portal 的契约」= rc-portal 的挂载机制 + antd 自己的 z-index 层叠机制（后者在 `_util/hooks/useZIndex.ts`，
不在任何 rc 包里，是 antd 独有的）。

---

## 3. antd 的契约（逐条）

### 3.1 容器解析（`Portal.js:9-23`）

```js
const getPortalContainer = getContainer => {
  if (getContainer === false) return false;                 // 内联渲染
  if (!canUseDom() || !getContainer) return null;           // ⇒ 走「创建默认容器」
  if (typeof getContainer === 'string') return document.querySelector(getContainer);
  if (typeof getContainer === 'function') return getContainer();
  return getContainer;
};
```

四种输入形态：`false`（内联）/ `string`（选择器）/ `function`（工厂）/ 元素本身。
`null` 与「解析不到」都落到 `null` ⇒ 交给 `useDom` 新建默认容器。

antd 侧的公开类型（`config-provider/index.tsx:188`）：

```ts
getPopupContainer?: (triggerNode?: HTMLElement) => HTMLElement | ShadowRoot;
```

⭐ 注意返回类型含 **`ShadowRoot`** —— antd 6 起支持挂进 shadow DOM。我们的解析函数必须
接受它，不能只认 `HTMLElement`。

### 3.2 SSR 安全的延迟挂载（`Portal.js:31-49`）

```js
const [shouldRender, setShouldRender] = React.useState(open);
const mergedRender = shouldRender || open;

warning(canUseDom() || !open,
  `Portal only work in client side. Please call 'useEffect' to show Portal instead default render in SSR.`);

React.useEffect(() => {
  if (autoDestroy || open) setShouldRender(open);
}, [open, autoDestroy]);
```

三条语义：
1. **初始 state 就是 `open`**（不是 false）—— 所以客户端首屏即可渲染；
2. `mergedRender = shouldRender || open` —— 一旦渲染过就保持，直到 effect 把它改回去；
3. `autoDestroy` 决定是否**在关闭后卸载内容**（默认 `true`）；`autoDestroy=false` 时关闭后内容留在 DOM。

不渲染的三种情况（`Portal.js:81`）：`!mergedRender || !canUseDom() || innerContainer === undefined`。
第三条最微妙：**`innerContainer` 为 `undefined` 时不渲染**，因为「用户可能在同一次渲染里用 ref 指向
还没挂载的元素」，要等到 effect 里解析过一次才安全。

### 3.3 默认容器与嵌套顺序（`useDom.js`）

```js
const [ele] = useState(() => canUseDom() ? document.createElement('div') : null);
const queueCreate = useContext(OrderContext);
const [queue, setQueue] = useState([]);
const mergedQueueCreate = queueCreate || (appendedRef.current ? undefined : appendFn => {
  setQueue(origin => [appendFn, ...origin]);      // ⭐ 新的排前面
});

function append() { if (!ele.parentElement) document.body.appendChild(ele); appendedRef.current = true; }
function cleanup() { ele.parentElement?.removeChild(ele); appendedRef.current = false; }

useLayoutEffect(() => {
  if (render) { queueCreate ? queueCreate(append) : append(); } else { cleanup(); }
  return cleanup;
}, [render]);

useLayoutEffect(() => {
  if (queue.length) { queue.forEach(appendFn => appendFn()); setQueue([]); }
}, [queue]);
```

然后 `Portal` 把队列函数往下传（`Portal.js:98-100`）：

```jsx
<OrderContext.Provider value={queueCreate}>…</OrderContext.Provider>
```

（注意：传的是 `mergedQueueCreate` 的返回结果 `[ele, queueCreate]` 中的第二个 —— 见 `useDom` 的 return
与 `Portal` 的 `const [defaultContainer, queueCreate] = useDom(...)`。）

**机制总结**：
- 每个 Portal 自带一个 `div`；
- **顶层**（inject 不到 queueCreate）⇒ 立即 `append()` 到 `document.body`，并把自己的 enqueue 函数
  provide 给子树；
- **嵌套的子 Portal** ⇒ 不自己 append，而是把 `append` 交给**最近的祖先队列**；
- 祖先在 layout effect 里 flush 队列 ⇒ **祖先容器先入 DOM，子孙后入** ⇒ 无 z-index 时靠 DOM 顺序
  保证「子浮层压在父浮层之上」。

⭐ `[appendFn, ...origin]` 让**后登记的在数组前面**，`forEach` 又按数组顺序执行，
于是**后登记的先 append**。这一条决定了兄弟节点的最终 DOM 次序（见 §3.3.1）。

#### 3.3.1 兄弟顺序：一个必须写下来的推导

同一父 Portal 下的两个子 Portal A、B（组件树顺序 A→B）：

| 步骤 | 队列 | 说明 |
|---|---|---|
| A 的 layout effect | `[appendA]` | A 先入队 |
| B 的 layout effect | `[appendB, appendA]` | 新的排前面 |
| 父 flush | 先 `appendB()` 后 `appendA()` | 按数组顺序 |

⇒ body 中 **B 的容器先于 A 的容器**，即 **A 在 DOM 中更靠后 ⇒ A 显示在上层**。
而组件树顺序是 A→B。

⚠️ 这是**从源码推导**的结论，没有在真实 React 环境里实测（本仓库没有 React 运行时，H1 禁止引入）。
我们的实现会照抄这个次序，并由测试钉住 —— 若将来有机会在真实 React 下核对，以实测为准并回来改这里。
见 §9 第 3 条。

### 3.4 z-index 层级（`_util/hooks/useZIndex.ts`）

```ts
const CONTAINER_OFFSET = 100;
const CONTAINER_OFFSET_MAX_COUNT = 10;
export const CONTAINER_MAX_OFFSET = CONTAINER_OFFSET * CONTAINER_OFFSET_MAX_COUNT;   // 1000
const CONTAINER_MAX_OFFSET_WITH_CHILDREN = CONTAINER_MAX_OFFSET + CONTAINER_OFFSET;  // 1100

containerBaseZIndexOffset = { Modal, Drawer, Popover, Popconfirm, Tooltip, Tour, FloatButton: 100 }
consumerBaseZIndexOffset = { SelectLike: 50, Dropdown: 50, DatePicker: 50, Menu: 50, ImagePreview: 1 }

const useZIndex = (componentType, customZIndex) => {
  const parentZIndex = useContext(ZIndexContext);      // 默认 undefined
  const isContainer = componentType in containerBaseZIndexOffset;
  let result;
  if (customZIndex !== undefined) {
    result = [customZIndex, customZIndex];
  } else {
    let zIndex = parentZIndex ?? 0;
    if (isContainer) {
      zIndex += (parentZIndex ? 0 : token.zIndexPopupBase) + containerBaseZIndexOffset[componentType];
    } else {
      zIndex += consumerBaseZIndexOffset[componentType];
    }
    result = [parentZIndex === undefined ? customZIndex : zIndex, zIndex];
  }
  // dev 下：zIndex > zIndexPopupBase + 1100 时告警
  return result;
};
```

⭐⭐ 最关键的一条，也是最容易读错的：

> `result[0]`（**组件实际使用的 zIndex**）在 `parentZIndex === undefined` 时是
> `customZIndex` —— 也就是 **`undefined`**。

即：**最外层的浮层根本不设 `z-index`**，它靠 §3.3 的 DOM 顺序决定堆叠。
只有**嵌套在父浮层里**的子浮层才拿到数值型的 z-index（父的 zIndex + offset）。

`result[1]`（传给 `ZIndexContext` 让子孙继承的）永远是算出来的数值。

`token.zIndexPopupBase` 默认 **1000**（`theme/themes/seed.ts:73`）。

⭐ **本包不依赖 `@apollo-design/theme`**（`dependsOn` 只有 utils）——
`zIndexPopupBase` 由调用方传入，默认 1000。这样 portal 保持 L1 的纯依赖，
也让它在没有 theme 的环境（测试、SSR）里可用。

### 3.5 内联渲染（`Portal.js:91`）

```js
const renderInline = mergedContainer === false || inlineMock();
return renderInline ? reffedChildren : createPortal(reffedChildren, mergedContainer);
```

`inlineMock()` 是测试用的全局开关（`mock.js`：一个模块级 `let inline`，只在测试里被置 true）。
antd 的测试靠它把浮层渲染在原地，便于断言。

### 3.6 ❌ 不在这个包里的东西

`Portal.js` 里还调用了 `useScrollLocker` 与 `useEscKeyDown` —— **这两条不属于本包**。
依据 `dependencies.json` 里 Modal 的 rationale：

> 其中「挂载与层级」由 portal 承接；「焦点陷阱 + 滚动锁定 + Esc」属交互语义，留在 ui 内。

再加 `portal` 自己的 `notDo`：不实现浮层定位（position）、焦点陷阱（a11y）、触发时机与显隐延迟（overlay）。

---

## 4. 边界

✅ 做：容器解析与复用、SSR 安全延迟挂载、`autoDestroy`、默认容器创建、
嵌套 Portal 的容器顺序（enqueue 机制）、z-index 层级计算与继承、内联渲染开关。

❌ 不做：
- 浮层定位（`position`）
- 焦点陷阱 / 焦点恢复（`a11y`）
- 触发动作与显隐延迟（`overlay`）
- **滚动锁定与 Esc**（rc-portal 有，但按 Modal 的 rationale 属 ui 交互语义）
- 不依赖 `theme`（`zIndexPopupBase` 由调用方给）

---

## 5. API 设计

### 5.1 纯数据侧（可穷举测试）

| 函数 | 契约来源 |
|---|---|
| `resolveContainer(getContainer, doc)` | `Portal.js:9-23` |
| `isContainerType(type)` | `useZIndex.ts:53-55` |
| `computeZIndex({ componentType, customZIndex, parentZIndex, zIndexPopupBase })` | `useZIndex.ts:69-84` |
| `enqueueAppend(queue, appendFn)` | `useDom.js:26-30` |
| `shouldWarnZIndex({ customZIndex, currentZIndex, zIndexPopupBase })` | `useZIndex.ts:89-96` |

常量：`CONTAINER_OFFSET` / `CONTAINER_OFFSET_MAX_COUNT` / `CONTAINER_MAX_OFFSET` /
`CONTAINER_MAX_OFFSET_WITH_CHILDREN` / `DEFAULT_Z_INDEX_POPUP_BASE` /
`containerBaseZIndexOffset` / `consumerBaseZIndexOffset`。

### 5.2 有副作用的一侧

- `usePortalContainer({ getContainer, open, autoDestroy, debug })` —— 容器解析 + 默认容器创建与复用 +
  嵌套入队（对应 `useDom` + `Portal` 的容器部分）
- `usePortalOrder()` —— enqueue 函数的 provide/inject 配对
- `useZIndex(componentType, customZIndex, options)` —— Vue 版，配 `ZIndexContext` 的 provide/inject
- `Portal` 组件 —— Vue 的 `<Teleport>` 封装

---

## 6. 与 React `createPortal` / Vue `<Teleport>` 的差异

| # | rc-portal (React) | Vue `<Teleport>` | 处置 |
|---|---|---|---|
| 1 | `createPortal(children, container)` | `<Teleport :to="container">` | 直接映射 |
| 2 | `renderInline` 时用普通 children | `<Teleport :disabled="true">` | 用 `disabled` 表达，语义等价 |
| 3 | `OrderContext`（React context）传 enqueue 函数 | `provide/inject` | 自己实现 provide/inject 配对 |
| 4 | `ZIndexContext`（React context） | `provide/inject` | 同上 |
| 5 | `useState(() => canUseDom() ? createElement : null)` —— **首次渲染就建** | 组合式函数在 **setup** 阶段建 | 同样「首次渲染就建」，SSR 下**不建** |
| 6 | `useLayoutEffect` 里 append/cleanup | `onMounted` + `watch` + `onUnmounted` | ⚠️ 见下 |
| 7 | `ZIndexContext` 提供裸数值（靠重渲染拿新值） | `provide` 一个 `ComputedRef<number>` | ⚠️ 见下 |

⚠️ 关于第 6 条：rc-portal 用 **layout** effect，因为它必须在浏览器绘制前把容器放进 DOM，
否则嵌套顺序可能闪。Vue 的 `onMounted` 是「挂载后」，语义上更接近 `useEffect` 而非 `useLayoutEffect`。
Vue 没有官方的 layout-effect 钩子，通常用 `watch(..., { flush: 'post' })` 或直接在 `onMounted` 里同步执行
（此时 DOM 已插入但尚未绘制）。本包采用「`onMounted` 里同步 append」。

⭐ 但这里有一条**必须照抄的执行次序**：首次 append 一定要放在 `onMounted`，
**不能**用 `watch(shouldAppend, cb, { immediate: true, flush: 'post' })`。
`immediate` 会在 **setup 里同步**执行，而 setup 是自顶向下的 —— 父级会在子级被创建前
就 `append()` 并置 `appended = true`，于是子级认为「父已入 DOM」而立刻自己 append，
**子容器排到父容器前面**，嵌套顺序反转。React 的 effect 与 Vue 的 `onMounted`
都是自底向上（子先于父），二者等价；`immediate: true` 不等价。

⚠️ 关于第 7 条：`provide` 一个裸数值不会让子孙更新 —— 必须传响应式容器，
子孙再 `.value` 读取才能建立依赖。这是 Vue 相对 React `useContext` 的必要改写。

### 6.1 `getContainer` 的两层形态

`usePortalContainer` 的 `getContainer` 是「取 spec 的 getter」，`GetContainer` 本身又可以是函数
（antd 的写法）。**两层都不能省**：

- 少了外层 ⇒ 组件侧读不到最新的 props（`reResolveContainer` 挂在 `onUpdated` 上，每次都得重读）；
- 少了内层（直接返回元素）⇒ `resolveContainer` 拿到 `undefined` 时只能给 `null`，
  「未就绪」这个第三态就没了，内容会先渲染进默认容器再搬一次家。

所以 `Portal` 组件的 prop 接受的是 **spec 本体**（`GetContainer`），
传给 `usePortalContainer` 时才包成 `() => props.getContainer`。

### 6.2 一处照抄的噪音行为（**别顺手优化**）

`useDom(mergedRender && !innerContainer, debug)` —— `innerContainer` 为 `false` 时
`!innerContainer` 为真 ⇒ antd **仍然会创建并 append 一个空的默认容器**，
尽管此时走的是内联渲染、那个容器根本不会被用到。

我们没有改它：改成不 append 就会与上游产生可观察的 DOM 差异。
`portal.test.ts` 里有专门的用例钉住它。

---

## 7. 测试策略

| 层 | 内容 | 状态 |
|---|---|---|
| L1 | §5.1 五个纯函数 + 常量表；`resolveContainer` 覆盖 false/string/function/元素/null/SSR —— `container.test.ts` | ✅ done |
| L2 | jsdom：`usePortalContainer` 的创建/复用/卸载、`autoDestroy`、嵌套入队顺序、`Portal` 组件渲染分支 —— `use-portal.test.ts` + `portal.test.ts` | ✅ done |
| L3 | `portal.test-d.ts`（含 4 条负例） | ✅ done |
| L4 | 默认容器的 DOM 形状（裸 `<div>` + 可选 `data-debug`）在 `portal.test.ts` 里钉住 | ✅ done |
| L5 | n/a —— Portal 本身无 ARIA 语义（焦点管理在 a11y） | n/a |
| L6 | n/a —— 需真实浏览器 | n/a |
| L7 | `tests/build/run.mjs` | 见收口记录 |

`pocRequired: false`，所以**不做** PoC 差分；但 `computeZIndex` 与 `resolveContainer` 是纯函数，
会用与 `motion`/`position` 同档的穷举强度覆盖。

### 7.1 测试侧的三个坑（不写下来下次还会踩）

1. **VTU 默认把 `<Teleport>` 打桩成 `<teleport-stub>`**，内容留在原地 ——
   「内容到底进没进容器」根本测不出来。必须 `global: { stubs: { teleport: false } }`。
2. **Vue 的 `<Teleport>` 在 `to` 变化时是「移动」节点，不会重新挂载** ——
   所以「先渲染进默认容器再搬家」这个错误用**挂载次数**测不出来（两种实现都是 1 次）。
   判据必须是「内容首次挂载时的父节点」（`portal.test.ts` 的 `firstParent`）。
3. **VTU 不 `attachTo` 时组件树挂在游离元素上**，`document.querySelector` 找不到它；
   要么 `attachTo: document.body`，要么从容器元素自己往下查。

### 7.2 变异验证（确认断言不是「永远绿」）

| 变异 | 被抓到的用例 |
|---|---|
| `enqueueAppend` 改成 `[...queue, appendFn]`（顺序反转） | 1 个 L1 |
| `resolveContainer` 的函数分支加 `?? null`（吃掉「未就绪」态） | 1 个 L1 + 1 个 L2 |

⚠️ L4 判为「做」而不是 n/a：默认容器是本包**唯一**产出的 DOM 结构
（`<div>` + 可选 `data-debug`），它的形状必须被钉住，否则 ui 层的 DOM 契约会漂移。

---

## 8. 待裁决

### P1 · `autoDestroy` 的默认值

antd 默认 `autoDestroy = true`（关闭即卸载内容）。Vue 侧若照抄，某些需要保留 DOM 状态的场景
（如带动画的离场）会出问题 —— 但离场动画由 `motion` 控制，motion 结束才轮到 portal 卸载。
- **建议**：照抄 `true`，并在 `Portal` 上暴露 prop 让组件自己关掉。

### P2 · 默认容器是否加 `prefixCls`

antd 的默认容器是**裸 `<div>`**，没有任何 class。
- **建议**：照抄裸 div（`debug` 时加 `data-debug`）。加 class 会改变 DOM 契约，属无谓差异。

---

## 9. 这个包**没有**证明什么

### 9.1 本轮新增的「没有证明」

- **没有证明 SSR 下真的不建容器**。jsdom 不是 SSR；`vi.stubGlobal('window', undefined)`
  只能覆盖 `resolveContainer` 的早退分支，`usePortalContainer` 那条
  `canUseDom() ⇒ 不建 div` 的路径没有被真实无 DOM 环境验证过。
- **没有证明挂载时机的视觉表现**。`onMounted` 与 antd 的 `useLayoutEffect` 都发生在
  绘制前，但 Vue 没有官方的 layout-effect 钩子，「会不会闪一帧」要真实浏览器才能回答。
- **没有覆盖 `motionName` 之类的 ui 层集成**：`Portal` / `usePortalContainer`
  **还没有被任何真实组件消费过**（与 position 的 `measureAlign` 同类的风险）。
1. **没有证明真实浏览器下的堆叠正确**。jsdom 不排版，`z-index` 的实际层叠效果测不出来；
   这里测的是「算出来的数值与继承关系」。
2. **没有证明 SSR 下真的安全**。jsdom 不是 SSR；`canUseDom()` 为 false 的分支
   只能靠注入假 document 模拟，真实 SSR（Vue 的 `renderToString` + teleports）未验证。
3. ⭐ **没有证明兄弟 Portal 的 DOM 顺序是对的**（§3.3.1）。那是**从源码推导**的：
   本仓库没有 React 运行时（H1 禁引入），无法与真实 React 行为对拍。
   我们的实现照抄推导结果并有测试钉住，但「antd 真的就是这样」这件事**没有被证明**。
4. **没有证明 `ShadowRoot` 容器可用**。antd 的类型允许它，但 jsdom 的 shadow DOM 支持有限，
   且没有 antd 的实测用例可参照。
5. **没有证明滚动锁定与 Esc 的缺失不会造成回归** —— 那两项按 §3.6 属 ui，
   等 Modal/Drawer 落地时才会被真正检验。
