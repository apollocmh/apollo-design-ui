# `motion` 契约文档

> AR2（motion 五类语义）的分析产物。**先于实现存在**（`AGENTS.md` §2：步骤 3 的产物必须先于步骤 5）。
>
> 本文中所有「antd 原文」的行号都指 `@rc-component/motion@1.3.3` 的 `es/` 产物，
> 与 antd 仓库 `components/style/motion/` 下的 TS 源码。

---

## 1. 这个包解决什么

antd 的每个浮层、折叠面板、抽屉都在跑同一套显隐动画。React 侧由
`@rc-component/motion` 的 `CSSMotion` 统一供给，它解决的不是「怎么画动画」，
而是**什么时候挂哪个 class、什么时候摘掉、什么时候算结束**。

三件 Vue 内置 `<Transition>` 做不到、因而必须自研的事（`registry/dependencies.json`
的 `rationale` 原文）：

1. `motionDeadline` —— 动画事件迟迟不来（被 `display:none` 吞掉、被打断）时，
   靠定时器兜底结束，否则浮层永远卡在「正在离场」状态。
2. `motionLeaveImmediately` —— 组件**首次挂载**时就是 `visible=false` 也要走离场动画
   （例：Modal 初次渲染时 `open=false`，随后才打开）。
3. 「先渲染再离开」的两阶段语义 —— 离场时元素必须**先留在 DOM 里**跑完动画，
   再被移除；`removeOnLeave=false` 时还要留下一个 `leavedClassName` 的残骸。

本包**只输出 class 与内联样式的时间线**，不产出任何 CSS。
五类语义的 keyframes 与时长是 `theme` / `ui` 的事（见 §3.5）。

---

## 2. 事实来源

| 用途 | 路径 |
|---|---|
| 状态机 | `@rc-component/motion@1.3.3` `es/hooks/useStatus.js`（238 行） |
| 步进队列 | `es/hooks/useStepQueue.js`（53 行） |
| class/style 组装 | `es/CSSMotion.js` 92–146 |
| 常量 | `es/interface.d.ts` |
| 帧推进 | `es/hooks/useNextFrame.js` |
| DOM 事件 | `es/hooks/useDomMotionEvents.js` |
| 多元素 stagger | `es/CSSMotionList.js` |
| 五类语义（CSS） | antd `components/style/motion/{fade,zoom,slide,move,collapse}.ts` + `motion.ts` |
| 五类语义（行为） | antd `components/_util/motion.ts`（collapse 的 `initCollapseMotion`） |

antd 6.6.4 声明的是 `^1.3.3`；本地无副本，本轮从 jsdelivr 取到 `/tmp/rc-motion-ref/`。

---

## 3. antd 的契约（逐条）

### 3.1 两组常量：STATUS 与 STEP

```ts
STATUS_NONE / STATUS_APPEAR / STATUS_ENTER / STATUS_LEAVE   // 'none' | 'appear' | 'enter' | 'leave'
STEP_NONE / STEP_PREPARE / STEP_START / STEP_ACTIVE / STEP_ACTIVATED / STEP_PREPARED
//  'none'  | 'prepare'   | 'start'   | 'active'   | 'end'          | 'prepared'
```

⚠️ **最容易踩的一处**：常量名叫 `STEP_ACTIVATED`，**值是 `'end'`**。
它表示「动画已开始跑、正在等结束事件」，不是「已激活」。
`isActive(step)` 同时接受 `active` 与 `end`（`useStepQueue.js:13`）。

两条队列（`useStepQueue.js:6-7`）：

```js
const FULL_STEP_QUEUE   = [STEP_PREPARE, STEP_START, STEP_ACTIVE, STEP_ACTIVATED];
const SIMPLE_STEP_QUEUE = [STEP_PREPARE, STEP_PREPARED];
```

`prepareOnly` 由 `!supportMotion` 传入（`useStatus.js:108`）——
即**不支持动画时**只走 `prepare → prepared`，`prepared` 一到就立刻收尾
（`useStatus.js:134-136`），不挂 `start/active`。

### 3.2 每个步进挂哪些 class（`CSSMotion.js:127-143`）

```js
let statusSuffix;
if (statusStep === STEP_PREPARE) statusSuffix = 'prepare';
else if (isActive(statusStep))   statusSuffix = 'active';   // active 与 end 都是 'active'
else if (statusStep === STEP_START) statusSuffix = 'start';
// STEP_PREPARED / STEP_NONE ⇒ statusSuffix 为 undefined

const motionCls = getTransitionName(motionName, `${status}-${statusSuffix}`);
className: clsx(getTransitionName(motionName, status), {
  [motionCls]: motionCls && statusSuffix,        // `${n}-${status}-${suffix}`
  [motionName]: typeof motionName === 'string',  // ⚠️ 裸的 `${n}`
})
```

于是进入动画时元素上**始终有三个 class**：

```
{n}-{status}   {n}-{status}-{suffix}   {n}
```

⭐ **裸的 `{n}` 是必带的**，这一点与 Vue 的 `<Transition>` 根本不同（见 §6）。
另外 `STEP_PREPARED` 与 `STEP_NONE` 下 `statusSuffix` 是 `undefined`，
`{n}-{status}-undefined` 会被 `motionCls && statusSuffix` 挡掉 —— 不会真的出现在 DOM 上。

完整的 enter 时间线（以 `motionName='ant-zoom'` 为例）：

| step | class | 说明 |
|---|---|---|
| `prepare` | `ant-zoom-enter ant-zoom-enter-prepare ant-zoom` | 可选，只有传了 `onEnterPrepare` 才出现 |
| `start` | `ant-zoom-enter ant-zoom-enter-start ant-zoom` | 初始态 |
| `active` | `ant-zoom-enter ant-zoom-enter-active ant-zoom` | 开始跑 |
| `end` | `ant-zoom-enter ant-zoom-enter-active ant-zoom` | 与 active 同，等结束事件 |
| `none` | （只剩 children 自己的 class） | 收尾 |

### 3.3 步进之间隔**两帧**（`useNextFrame.js`）

```js
function nextFrame(callback, delay = 2) {   // ⚠️ 默认 2，即双 rAF
  cancelNextFrame();
  const nextFrameId = raf(() => {
    if (delay <= 1) callback({ isCanceled: ... });
    else nextFrame(callback, delay - 1);
  });
  nextFrameRef.current = nextFrameId;
}
```

`useStepQueue` 里每次步进都走 `nextFrame(...)`（`useStepQueue.js:33`），
即 prepare → start → active → end **每一步都是双 rAF**。

这不是性能浪费：§3.4 会说明，浏览器必须**先在 `start` 态绘制一帧**，
再切到 `active` 态，动画才会真的从初始值开始；单帧在部分浏览器下会被合并。

顺带一条**好消息**：Vue 自己的 `nextFrame` 也是双 rAF
（`@vue/runtime-dom@3.5.42` `runtime-dom.esm-bundler.js:280-283`，
`requestAnimationFrame(() => requestAnimationFrame(cb))`）。
所以**帧节奏不是 AR2 的差异点**——Vue 与 rc-motion 的步频一致，
真正的差异全在 class 语义上（见 §6）。

### 3.4 CSS 侧的契约：靠 `animation-play-state` 而不是 reflow

antd `components/style/motion/motion.ts` 的 `initMotion`：

```css
{n}-enter, {n}-appear        { animation-duration; animation-fill-mode: both; animation-play-state: paused }
{n}-leave                    { 同上 }
{n}-enter{n}-enter-active,
{n}-appear{n}-appear-active  { animation-name: <inKeyframes>;  animation-play-state: running }
{n}-leave{n}-leave-active    { animation-name: <outKeyframes>; animation-play-state: running; pointer-events: none }
```

⭐ 读法：`{n}-enter` 单独存在时动画**已定义但暂停**（配合 `fill-mode: both`
停在 0% 那一帧）；`{n}-enter` 与 `{n}-enter-active`**同时**存在时才 `running`。

所以 §3.2 的 `start → active` 那一步，在 CSS 上等价于「解除暂停」——
这正是它必须在**下一帧**发生的原因，也是 `pointer-events: none`
只在离场时加的原因。

⚠️ 由此得到一条**实现约束**：`{n}`（裸名）与 `{n}-{status}` 必须在
`{n}-{status}-active` **之前**就已经在元素上，否则浏览器看到的是
「同一帧内既定义又运行」，动画不生效。

### 3.5 五类语义

| 语义 | 机制 | 初始态 / 结束态 | 触发 class |
|---|---|---|---|
| **fade** | keyframes `antFadeIn/Out` | opacity 0↔1 | `ant-fade` |
| **zoom** | keyframes `antZoom*` + 方向变体（Up/Down/Left/Right/Big） | scale 0.2↔1（Big 为 0.8↔1），配 opacity | `ant-zoom` |
| **slide** | keyframes `antSlide*`（Up/Down/Left/Right） | translate ±100% + opacity | `ant-slide-up` 等 |
| **move** | keyframes `antMove*` | translate，幅度小（用于列表项进出） | `ant-move-up` 等 |
| **collapse** | ⚠️ **不是 keyframes**，是内联 height 过渡 | height 0 ↔ scrollHeight | `ant-motion-collapse` |

前四类靠 `motionName` + CSS keyframes 就够了，`CSSMotion` 不需要任何 handler；
**只有 collapse 需要 `onXxxStart/Active/End`**，因为它的高度是运行期测量的。

collapse（`components/_util/motion.ts:29-41`）：

```ts
onAppearStart / onEnterStart : () => ({ height: 0, opacity: 0 })
onAppearActive/ onEnterActive: node => ({ height: node?.scrollHeight ?? 0, opacity: node ? 1 : 0 })
onLeaveStart                 : node => ({ height: node?.offsetHeight ?? 0 })
onLeaveActive                : () => ({ height: 0, opacity: 0 })
onAppearEnd/onEnterEnd/onLeaveEnd : skipOpacityTransition
motionDeadline               : 500
```

`skipOpacityTransition` 只认 height 的 transitionend 或 deadline：
```ts
(_, event) => event?.deadline === true || (isTransitionEvent(event) && event.propertyName === 'height')
```
即：opacity 的 transitionend **不结束** collapse 动画，只有 height 的才算。

### 3.6 状态选取与早退（`useStatus.js:146-188`）

```js
if (!isMounted && visible && motionAppear)                    nextStatus = APPEAR;
if (isMounted  && visible && motionEnter)                     nextStatus = ENTER;
if (isMounted  && !visible && motionLeave
 || !isMounted && motionLeaveImmediately && !visible && motionLeave) nextStatus = LEAVE;

if (nextStatus && (supportMotion || nextEventHandlers[STEP_PREPARE])) {
  setStatus(nextStatus); startStep();
} else {
  setStatus(STATUS_NONE);   // 不支持动画、也没有 prepare handler ⇒ 直接跳过
}
```

⭐ 注意 `|| nextEventHandlers[STEP_PREPARE]`：**即便不支持动画，只要传了
prepare handler 也要走一遍队列**——collapse 依赖它在隐藏时测量高度。

结束判定（`useStatus.js:51-79`）：

```
status === NONE              → 什么都不做（deadline 触发过就会走到这）
event && !event.deadline
  && event.target !== element → 忽略（子元素冒泡上来的 transitionend 不算）
currentActive && canEnd !== false → 收尾（status=NONE, style=[null,null]）
```

⚠️ `canEnd !== false` 意味着 `onXxxEnd` **返回 `false` 可以否决结束**；
返回 `undefined` 视为同意。

### 3.7 首帧不渲染（`CSSMotion.js:87-95, 233-237`）

```js
styleReady = !mountedRef.current && currentStatus === NONE && supportMotion && motionAppear
  ? 'NONE'
  : (step === START || step === ACTIVE) ? styleStep === step : true;

if (styleReady === 'NONE') return null;
```

即：**支持动画且开了 appear 时，首帧返回 `null`**，要等 layout effect 把
status 推到 `appear` 之后才真正渲染。目的是避免「未带初始 class 的元素」闪一帧。

### 3.8 `status === NONE` 时的四种渲染分支（`CSSMotion.js:104-124`）

| 条件 | 结果 |
|---|---|
| `mergedVisible` | 渲染 children，**不加任何 class** |
| `!removeOnLeave && rendered && leavedClassName` | 渲染 children，`className = leavedClassName` |
| `forceRender \|\| (!removeOnLeave && !leavedClassName)` | 渲染 children，`style.display = 'none'` |
| 其余 | `null` |

### 3.9 多元素 stagger（`CSSMotionList.js`）

`CSSMotionList` 用 `util/diff` 对 `keys` 做 add/keep/remove/removed 四态 diff，
每个 key 各自套一个 `CSSMotion`。**stagger 的错峰不是 CSSMotionList 做的**，
而是各组件自己在 `motionDelay` / `style` 上加的（如 Collapse 逐项）。
本包只需提供「按 key 独立管理生命周期 + `onAllRemoved`」这一层。

---

## 4. 边界

✅ 做：状态机（status/step）、class 与内联样式的时间线、`motionDeadline` 兜底、
`motionLeaveImmediately`、事件来源校验（只认本元素的 transitionend/animationend）、
timer 与监听的清理、多元素按 key 管理。

❌ 不做：
- 不产出任何 CSS / keyframes（五类语义的**样式**在 `theme` / `ui`）
- 不依赖 `portal` / `overlay`（本包不关心元素挂在哪个容器）
- 不定义具体组件的动效参数
- ❌ **不直接复用 Vue 的 `<Transition>`**（见 §6）

---

## 5. API 设计

### 5.1 纯数据侧（可穷举测试，是 PoC 的差分对象）

| 函数 | 契约来源 |
|---|---|
| `pickStatus({ mounted, visible, motionAppear, motionEnter, motionLeave, motionLeaveImmediately })` | `useStatus.js:161-176` |
| `nextStepInQueue(step, prepareOnly)` | `useStepQueue.js:6-7, 24-26` |
| `getStatusSuffix(step)` | `CSSMotion.js:127-134` |
| `getMotionClassName(motionName, status, step)` | `CSSMotion.js:135-141` |
| `getMotionStyle({ hasPrepare, step, handlerStyle, styleStep })` | `useStatus.js:225-237` |
| `pickRenderMode({ status, mergedVisible, removeOnLeave, forceRender, leavedClassName, rendered })` | `CSSMotion.js:104-124` |
| `isMotionEndEvent({ status, event, element })` | `useStatus.js:51-79` |
| `shouldStartMotion({ nextStatus, supportMotion, hasPrepare })` | `useStatus.js:180-186` |

### 5.2 有副作用的一侧

- `useMotionStatus(...)` —— 驱动 status/step 的组合式函数，内部只用
  `onMounted` / `watch` / `requestAnimationFrame`，**不用 Vue 的 `<Transition>`**
- `CSSMotion` 组件（渲染 children 并注入 class/style）
- `MotionProvider` / 全局开关（对应 `context.js`，含 `prefers-reduced-motion` 自动禁用）
- `useNextFrame()` —— 双 rAF，带取消

---

## 6. 与 Vue `<Transition>` 的四处根本差异（AR2 的真正风险）

`dependencies.json` 的 rationale 说「可以基于 Vue 的 Transition **hooks** 实现」——
是 hooks，不是组件本身。差异如下，每条都必须由 PoC 明确处置：

Vue 源码依据：`@vue/runtime-dom@3.5.42` `runtime-dom.esm-bundler.js`
（下文的 `V:nnn` 都指这个文件的行号）。

| # | antd / rc-motion | Vue `<Transition>` | 处置 |
|---|---|---|---|
| 1 | class 命名 `{n}-{status}-start` / `{n}-{status}-active`，**没有 `-to`**；终态就是「元素的自然样式」 | `{n}-enter-from` / `-enter-active` / `-enter-to` 三件套齐全（`V:149-157`） | 自研 class 组装，不复用 Vue 的命名 |
| 2 | 动画期间**始终带裸的 `{n}`**（`CSSMotion.js:140`） | 从来不挂裸名 | 自研；裸名被组件 CSS 用到，缺了会掉样式 |
| 3 | —— | `onBeforeEnter` 里**先** `callHook` **再** `addTransitionClass(from/active)`（`V:200-204`）⇒ 钩子里读 `classList` 只有元素本来的类；到 `onEnter` 时 from/active 才在位（`V:186-196`） | 若沿用钩子，测量点必须在 `onEnter` 而不是 `onBeforeEnter` |
| 4 | `prepare` 步、`motionDeadline`、`motionLeaveImmediately`、`onXxxEnd` 可否决结束 | 都没有 | 自研 |
| 5 | 离场靠「换 class + 等帧」 | 离场靠 **`forceReflow(el)` 强制同步回流**（`V:217-221`） | 是两种不同技法；我们在 Vue 里同样可以自己加帧，不必迁就 `forceReflow` |

⚠️ 结论：**不直接用 `<Transition>`**，自己做「改 class + 双 rAF + 监听事件 + 兜底定时器」的循环。
Vue 在这里只提供渲染与生命周期，不提供过渡语义。

> 关于第 3 条的历史背景：上一轮曾尝试基于 `<Transition>` 做 PoC，卡在
> 「钩子里读到的 classList 只有基类名」。现在原因清楚了 —— 那不是 bug，
> 是 Vue 的钩子顺序如此。修正方向（测量点移到 `onEnter`）仍然有效，
> 但本轮直接自研驱动，不再依赖这套钩子顺序。

---

## 7. 测试策略（PoC 的 DoD 见 `WORKFLOW.md` §1.1.1）

| 层 | 内容 | 状态 |
|---|---|---|
| L1 | §5.1 全部纯函数逐项断言（含 `STEP_ACTIVATED === 'end'`）—— `motion.test.ts: 48`；collapse 三态与 `skipOpacityTransition` —— `presets.test.ts: 14` | ✅ done |
| L2 | 可注入帧泵驱动 `driver`（`driver.test.ts: 19`）+ 真实组件挂载（`use-motion-status.test.ts: 16`、`motion-list.test.ts: 5`、`next-frame.test.ts: 4`） | ✅ done |
| L3 | `motion.test-d.ts: 44`（含 4 条负例） | ✅ done |
| L4/L5/L6 | L4 不适用（本包不产出 DOM 结构，DOM 契约属组件层）；L5 不适用（无 ARIA 语义）；L6 需真实浏览器 | n/a |
| L7 | `tests/build/run.mjs` | 见收口记录 |

> ⚠️ 原先 L5 一栏写着「`prefers-reduced-motion` 需在 L2 断言」—— **本轮没做**：
> `MotionProvider` 尚未实现（§8 P2 仍未裁决）。因此 §5.2 列的 `MotionProvider`
> 一项**没有落地**，已登记在 registry 的 `notes` 里，不是静默放过。

### PoC 的差分设计（沿用 AR1 的做法）

1. **机械移植**：把 §5.1 的纯函数从 rc-motion 逐行搬成 `oracle.js`，
   保留变量名与求值顺序，不做任何顺手优化 —— 这样差分结果可归因于「我们改了什么」。
2. **确定性用例**：mulberry32 固定种子，生成
   `(visible 序列 × motionAppear/Enter/Leave × deadline × leaveImmediately ×
   supportMotion × 有无 prepare/start/active/end handler × removeOnLeave ×
   forceRender × leavedClassName)` 的组合，千级。
3. **可证伪的开关** —— 本轮**没有用上**，因为结论是「零偏差」。
   5000 组差分（种子 `20260917`）在 §5.1 的 8 个纯函数上全部逐位一致，
   没有任何一处是我们有意与 antd 不同的，于是不存在「关掉它分歧就归零」的那个开关。

   ⚠️ 这本身就是**可证伪的**：将来若出现偏差（例如为了不复刻 antd 的某个缺陷而分叉），
   必须补上开关、登记 `COMPATIBILITY.md` §9.2，并让「打开时分歧 > 0」成为断言。
   「没有偏差」不等于「不需要偏差登记机制」。
4. **写明没有证明什么**（见 §9）。

---

## 8. 待裁决

### P1 · jsdom 下的 rAF 与 CSS 动画

jsdom 没有 rAF 的帧语义，也不跑 CSS 动画、不发 `transitionend`/`animationend`。
- **选项 A**：把「帧推进」做成**可注入的帧泵**，测试时手动 pump。
- **选项 B**：直接用 `vi.useFakeTimers()` + 拦截 rAF。
- **建议**：**A**。B 在 vitest 里有个已知坑：假定时器默认伪造**全部** timer，
  于是 `flushPromises()` 不推进时间就死等；而 `prepare` 返回 Promise 的路径
  恰恰需要「微任务 + 帧」混合推进。手写的帧泵能把「第几帧」变成显式输入，
  断言也更清楚。

### P2 · `prefers-reduced-motion` 在哪一层生效

- **选项 A**：`MotionProvider` 里读 media query，等价于把 `contextMotion` 置 false。
- **选项 B**：只在组件层（ui）决定 `motionName` 为空串。
- **建议**：**A**，与 antd 的 `Context` 对齐；B 会让「全局关动画」漏掉
  那些不经 ui 直接用本包的消费者。

---

## 9. 这个包**没有**证明什么

1. **没有证明动画看起来对**。PoC 比的是 class/style **时间线**，不是像素。
   真实观感属 L6 视觉回归，需要真实浏览器。
2. **没有证明 CSS 侧的 `paused → running` 真的生效**。jsdom 不跑 CSS 动画，
   §3.4 的推论是**读 CSS 源码得出的**，不是测出来的。
3. **没有证明双 rAF 的必要性**。§3.3 记录的「delay=2」是 rc-motion 的实测行为，
   但「单帧会导致动画不触发」这条因果在 jsdom 下无法复现。
4. **没有证明 `transitionend` 的来源校验在真实冒泡下正确**。
   §3.6 的 `event.target !== element` 判定需要真实嵌套元素与真实事件。
5. **没有证明 `MotionList` 的 stagger 时序**。§3.9 指出错峰是组件自己加的，
   本包只负责按 key 的生命周期；`motion-list.test.ts` 验证的是「移除的 key 先播完再摘」
   与 `allRemoved`，**不含**错峰。
6. **没有证明 `useNextFrame` 在真实浏览器下必须是两帧**。`next-frame.test.ts` 只证明
   「我们的实现确实等了两帧」，不能证明「单帧在真实浏览器下会被合并」——
   那属于 §3.3 引自上游的结论，jsdom 复现不了。
7. **没有覆盖 `motionName` 为对象形态**（`getTransitionName` 支持
   `{ enter, leave, ... }` 映射）。本轮按字符串形态实现，对象形态留到有组件用到时。
