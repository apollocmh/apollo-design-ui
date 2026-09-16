# `tests/shared/*` 契约提取（`@apollo-design/test-utils` 的实现依据）

> 对应上游：**antd 6.6.4** 的 `tests/shared/` 与 `tests/utils.tsx`（本地缓存
> `/tmp/antd-repo/ant-design-master/`）。
>
> 本文件是 `AGENTS.md` §2 的**步骤 3 产物**（ANALYZE），必须先于实现存在。
> 它记录的是「上游到底做了什么」（实测源码，不是回忆）+「Vue 侧必须怎么重做」+「我们有意不同在哪」。
>
> 消费方：`packages/test-utils/README.md`（职责边界）、`TESTING.md` §7（模块清单）、
> `WORKFLOW.md` §1.1（foundation 包 DoD）。

---

## 0. 一句话结论

`test-utils` 不是「把 antd 的 `tests/shared/` 翻译成 Vue」，而是**重新设计一套测试契约的公共层**。
上游那 10 个文件里有 **3 个依赖 React 专有机制**（`jest.requireActual` 动态加载、
`@testing-library/react` 的 `act`、`@ant-design/cssinjs` 的 `StyleProvider`），
**2 个产出完整 HTML 快照**（与本仓库 `TESTING.md` A7 直接冲突），
**1 个用 `jest-axe` 串行队列掩盖了 axe 在 jsdom 下的超线性耗时**。
这四类都必须重设计，不是改名。

---

## 1. 使用面（上游文件清单，实测）

| 文件 | 行数 | 作用 | 我们的处置 |
|---|---:|---|---|
| `mountTest.tsx` | 17 | 渲染 → 更新 → 卸载不抛错 | **重设计**（加内存泄漏契约） |
| `excludeWarning.ts` | 35 | 过滤 React 的 `useLayoutEffect` SSR 警告 | **重设计**（我们没有 React 警告要过滤） |
| `rtlTest.tsx` | 28 | `ConfigProvider direction="rtl"` + 全量 HTML 快照 | **重设计**（去快照，改断言 `-rtl` 类） |
| `focusTest.tsx` | 131 | 焦点获取/丢失/归还 | **重设计**（`jest.spyOn` → `vi.spyOn`，去 `sleep`） |
| `rootPropsTest.tsx` | 124 | `rootClassName` 契约 + 假定时器 | **重设计**（`jest.useFakeTimers` → `vi.useFakeTimers`，动态 require → 注入） |
| `accessibilityTest.tsx` | 207 | axe 扫描 + demo 遍历 | **重设计**（去 `jest-axe`、去 `disabledRules`、分块） |
| `demoTest.tsx` | 220 | 遍历 demo，全量 HTML 快照 + 警告快照 | **重设计**（去快照，只留「不抛错 + 无警告」） |
| `demoTestContext.ts` | 10 | `TriggerMockContext`（强制浮层展开） | **重设计**（Vue 侧用 `provide` 键，落在 ui 层而非测试层） |
| `imageTest.tsx` | 398 | Puppeteer 截图 | **不做**（归 `tests/visual/`，是 L6 的职责） |
| `semanticStylePriority.ts` | 49 | `classNames`/`styles` 优先级夹具 | **不做**（它是**数据夹具**不是契约；由 `themeTest` 覆盖同一件事） |
| `tests/utils.tsx` | 105 | `sleep` / `waitFakeTimer` / `triggerResize` / `renderHook` | **部分重设计**（`waitFrames` / `flushAll`；`sleep` 不移植） |

上游还有 `tests/setup.ts` / `setupAfterEnv.ts` —— 它们是 **jest 全局配置**，
对应我们的 `vitest.setup.ts`，**不进本包**（本包只提供契约函数，不改全局环境）。

---

## 2. 逐个模块的上游契约（读源码得到的实测事实）

### 2.1 `mountTest` —— 只断言「不抛错」

```tsx
export default function mountTest(Component) {
  describe(`mount and unmount`, () => {
    it(`component could be updated and unmounted without errors`, () => {
      const { unmount, rerender } = render(<Component />);
      expect(() => { rerender(<Component />); unmount(); }).not.toThrow();
    });
  });
}
```

**实测事实**：整个契约就是 `not.toThrow()`。它**不**断言警告、**不**断言清理、
**不**断言 DOM 残留。README 里我们写的是「渲染 → 更新 → 卸载不报错，**无内存泄漏警告**」——
后半句是**我们加的**，上游没有。

### 2.2 `excludeWarning` —— 过滤的是 React 的警告

```ts
const list = ['useLayoutEffect does nothing on the server'];
if (all) list.push('is deprecated in StrictMode');
```

**实测事实**：`isSafeWarning` 的两条白名单**都是 React/StrictMode 专有**。
我们在 H1/H4 下既没有 `useLayoutEffect` 也没有 StrictMode，
**这个函数在我们这里没有可过滤的对象**。

### 2.3 `rtlTest` —— 快照，不是断言

```tsx
const { container } = render(<ConfigProvider direction="rtl"><Component /></ConfigProvider>);
expect(container.firstChild).toMatchSnapshot();
```

**实测事实（关键）**：`ConfigProvider` **不在 DOM 上写 `dir` 属性**
（`grep 'dir' components/config-provider/*.tsx` 零命中）。
RTL 的真实 DOM 契约是**组件自己加的 `-rtl` 后缀类**：

```
components/button/Button.tsx:389   [`${prefixCls}-rtl`]: direction === 'rtl',
```

实测统计：**55 个组件**产出 `-rtl` 结尾的类，但**后缀形态不统一** ——
`-rtl` / `-wrapper-rtl` / `-wrap-rtl` / `-group-rtl` / `-dropdown-rtl` / `-directory-rtl` / `-compact-item-rtl`。

上游靠「全量 HTML 快照」绕过了「后缀不统一」这件事 —— 快照不需要你知道契约是什么，
只要它不变就绿。这**恰恰是 A7 禁止快照的原因**：它把「契约是什么」这个问题回避掉了。

### 2.4 `focusTest` —— 有 `sleep`，且分两条路径

**实测事实**：
- `refFocus: true` 时走「ref.focus() / ref.blur() + autoFocus」，用 `jest.spyOn(HTMLElement.prototype, 'focus')` 做**观测**
- `refFocus: false` 时走「真实 focus/blur 事件」
- 两条路径都用了 `await sleep(blurDelay)` / `await sleep(0)`

`sleep` 直接违反我们的 A3。而 `jest.spyOn(HTMLElement.prototype, 'focus')` 这个技巧
**是必要的**：jsdom 的 `focus()` 不派发真实事件，靠 DOM 状态判断「有没有被聚焦」在 jsdom 下不可靠。

### 2.5 `rootPropsTest` —— 契约很实在，但加载方式是 React 专有

核心断言（**这条要原样保留**）：

```ts
childList.forEach((ele) => {
  expect(ele).toHaveClass(rootClassName);
  // `rootClassName` should not show in children element
  expect(ele.querySelector(`.${rootClassName}`)).toBeFalsy();
});
```

第二行是真正有价值的部分：**`rootClassName` 只能出现在根元素上，不能下渗到子元素**。

但它的组件来源是 `jest.requireActual('../../components/' + name)` —— **动态 require**，
在 Vite/ESM 下不存在。`beforeRender` / `afterRender` / `findRootElements` 三个钩子
是为了绕开「不同组件的根元素位置不同」这个事实。

### 2.6 `accessibilityTest` / `accessibilityDemoTest` —— 两个必须注意的实测事实

```tsx
class AxeQueueManager { /* 串行队列 */ }
const runAxe = (...) => axeQueueManager.enqueue(...);
// ...
export default function accessibilityDemoTest(component, options = {}) {
  const files = globSync(`./components/${component}/demo/*.tsx`)
    .filter((f) => !f.includes('_semantic') && !f.includes('debug') && !f.includes('component-token'));
```

**实测事实 1**：上游**写了一个串行队列**（`AxeQueueManager`）来跑 axe。
这说明「axe 并发/连续跑会出问题」这件事上游也踩到了 —— 但它只是**排队**，
没有测量过**耗时与 DOM 规模的关系**。

我们的实测结论（见 `docs/foundation/icons-contract.md` §6.2）比它更具体：

| 节点数 | 单次 `axe.run` 耗时 |
|---:|---:|
| 10 | 134ms |
| 50 | 385ms |
| 100 | 672ms |
| 200 | 2 057ms |
| 400 | 11 941ms |
| 848 | 被 SIGTERM 杀掉 |

节点翻倍、耗时约 **5.7 倍**（二次方量级）。所以「排队」不够，必须**分块**。

**实测事实 2**：上游提供 `disabledRules` 与 `skip`。
我们的 `packages/test-utils/README.md` 已经明确写死：**「a11yDemoTest 不允许 disableRules 来通过」**。
这是一次**有意的收紧**（H8），见 §5.3。

### 2.7 `demoTest` —— 三件事，其中两件我们不做

上游 `baseTest()` 每个 demo 做三件事：

```tsx
expect({ type: 'demo', html: container.innerHTML }).toMatchSnapshot();   // ① 全量 HTML 快照
expect(errorMessages).toMatchSnapshot();                                 // ② 警告列表快照
// ③ 隐式：render 不抛错
```

外加两个额外契约：

```tsx
// 组件名必须是 kebab-case（或 nameCheckPathOnly）
expect(kebabCase(Component.displayName).replace(/^deprecated-/, '')).toBe(kebabName);
// 以及 demoTest 默认顺带跑 rootPropsTest
if (options?.testRootProps !== false) rootPropsTest(component, null!, {...});
```

它还注入了三件 React 专有的东西：`TriggerMockContext`（强制浮层展开）、
`ConfigProvider theme={{hashed:false}}`、`StyleProvider cache={createCache()}`（避免生成 `<style>`）。

**实测事实**：②（警告快照）与 ①（HTML 快照）都会**首次运行即写盘**，
第二次运行才开始有约束力 —— 也就是说**第一版永远是绿的**。
这正是 A7 说的「噪声大、无契约价值」：它检测「变了」，但不检测「对不对」。

---

## 3. 关键发现（Vue 侧的结构性差异）

### F1 · `import.meta.glob` 必须由**调用方**发起，本包无法代劳

上游用 `globSync('./components/<x>/demo/*.tsx')` + `jest.requireActual`。
`globSync` 是**运行时**文件系统扫描，`requireActual` 是**运行时**模块加载。

Vite 的 `import.meta.glob` 是**编译期静态分析**：模式串必须是**字面量**，
且相对路径的基准是**包含该调用的文件**，不是被导入的模块。

**结论**：`demoTest` **不可能**自己 glob 出某个组件的 demo 目录。
必须由组件测试文件传入自己的 glob 结果：

```ts
demoTest('button', import.meta.glob('../demo/*.vue', { eager: true }));
```

这不是妥协，而是一次**收紧**：上游的 `globSync` 会在文件被重命名/删除时静默少测几条
（glob 匹配不到就不生成用例，没有任何提示）；`import.meta.glob` 同样会，
但至少**模式串在调用点可见**，code review 时能看到「这个组件声称有几个 demo」。
为了把「静默少测」变成失败，本包额外提供 **`expectCount`** 选项（见 §5.2）。

### F2 · `jest.useFakeTimers` 与「确定性等待」的关系在 Vue 下不同

React 的 `act()` 会**同步冲刷**所有 pending 的 state 更新与 effect；
Vue 的 `nextTick()` 只冲刷**调度器队列**，watcher 的 `flush: 'post'` 在**下一帧**。

因此上游的 `waitFakeTimer(advanceTime=1000, times=20)` 这种「推进 20 次 × 1000ms」
在本仓库**不适用**：我们的浮层动画在测试环境**整体禁用**（`vitest.setup.ts`
把 `defaultMotionConfig` 改成 `{ motion: false }`，见 `TESTING.md` T6），
所以「等动画」这件事在单元层**根本不存在**。

**结论**：本包不提供 `waitFakeTimer`，提供两个语义精确的：

| 函数 | 语义 |
|---|---|
| `flushAll()` | 冲刷 Vue 调度器 + 微任务队列。**不碰定时器**。 |
| `waitFrames(n = 2)` | 等 `n` 个动画帧（真定时器）或推进 `n × 16ms`（假定时器）。 |

两者都**不接收毫秒数** —— 接收毫秒就等价于 `sleep`，A3 会立刻回来。

### F3 · 归一化必须只有一份实现，否则 L4 的比对会失去意义

`tests/compat/README.md` §4 要求「归一化必须对称」。
但当前 `packages/icons/src/__tests__/dom-contract.ts`（195 行）是**唯一**一份实现，
且它自己的头注释写着「等第二个包接入 L4 时再提取」。

现在到了那个时刻：`TESTING.md` §7 与 `packages/test-utils/README.md` 都把
`domContractTest` 列为本包的**公开 API**。若本包另写一份，
就会出现两份语义相同、实现独立的归一化器 —— 一旦漂移，
**「React 与 Vue 一致」这个结论就同时失去两侧的意义**，而且不会有任何测试报警。

**结论**：把 icons 的实现**提取**到本包，icons 改为从本包导入（T2「必须复用，禁止各自重写」）。
提取时**增强**（不是放宽）：新增 `contract` 投影档（T10 的子集）与 id 引用归一化，见 §5.4。

### F4 · `resetWarned` 无法在本包重新实现

去重表 `warned` 是 `@apollo-design/utils/src/warning.ts` 的**模块私有**变量：

```ts
let warned: Record<string, boolean> = {};
export function resetWarned(): void { warned = {}; }
```

本包**只能复用**它，不能重写（T2）。因此本包对 `@apollo-design/utils` 有**运行时依赖**。

这带来一个**必须写下来的后果**：`packages/utils/package.json` 已经有
`devDependencies: { "@apollo-design/test-utils": "workspace:*" }`（供它自己的测试使用），
加上本包的 `dependencies` 后形成 **utils ⇄ test-utils 的 workspace 依赖环**。

这个环是**架构明文许可的**：`ARCHITECTURE.md` §3 的分层表里，
`test-utils` 一行的「允许依赖」写的就是「**任意（private，不发布）**」。
且它**不影响构建顺序**：`tests/build/run.mjs:147-153` 是逐包直接调
`node_modules/.bin/unbuild`，不做拓扑排序，也不调 `pnpm -r build`。

### F5 · `ConfigProvider` 还不存在，`rtlTest` 的 Provider 必须由调用方注入

上游 `rtlTest` 直接 `import ConfigProvider from '../../components/config-provider'`。
我们的 `ConfigProvider` 是 `packages/ui` 的组件，**尚未实现**（`packages/ui/src` 为空）。

本包是 T 层，可以依赖 `ui`，但**不能依赖一个还不存在的东西**。
而且更根本的问题：`direction` 的 provide 键**属于 ui 层的契约**，
本包若自己定义一个 `direction` 上下文键，就等于制造**第二个事实来源**。

**结论**：`rtlTest` 接受一个 `wrap` 参数（默认恒等）。`ConfigProvider` 落地后，
组件测试传 `wrap: (slot) => h(ConfigProvider, { direction: 'rtl' }, { default: slot })`。
本包**不**内置任何 direction 上下文。

### F6 · `themeTest` 需要 `@apollo-design/theme`，而它是 L0

`theme` 已经导出 `ThemeProvider` / `getDesignToken` / `defaultAlgorithm` / `darkAlgorithm` /
`compactAlgorithm` / `defaultSeedToken`。四态（light/dark/compact/token-override）
可以**直接**由这些构造出来，不需要新造抽象。

---

## 4. 必须用 Vue 重设计的部分（对照 H3「禁止机械翻译」）

| 上游写法 | 为什么不能照搬 | 我们的做法 |
|---|---|---|
| `render(<Component/>)`（`@testing-library/react`） | React 渲染器 | `mount()`（`@vue/test-utils`） |
| `jest.requireActual(path)` 动态加载 demo | Vite/ESM 无此能力（F1） | 调用方传 `import.meta.glob` 结果 |
| `globSync()` 运行时扫描 | 同上 | 同上 + `expectCount` 断言防少测 |
| `jest.useFakeTimers()` / `jest.advanceTimersByTime()` | jest API | `vi.useFakeTimers()` / `vi.advanceTimersByTime()` |
| `act()` | React 专有 | `nextTick()` + `flushPromises()` |
| `await sleep(n)` | A3 禁止 | `flushAll()` / `waitFrames()` |
| `TriggerMockContext`（React Context） | React 专有 | **不进本包**：`provide/inject` 键属 ui 层契约 |
| `StyleProvider cache={createCache()}` | `@ant-design/cssinjs`（H6 禁止） | 不需要：零运行时，测试环境不注入样式 |
| `toMatchSnapshot()`（HTML） | A7 禁止 | 断言「不抛错 + 无未豁免警告」；结构契约由 `domContractTest` 结构化覆盖 |
| `toMatchSnapshot()`（警告列表） | 同上 | 断言警告列表**为空**（比快照更强：快照会把已有的错误固化成"预期"） |
| `jest-axe` + `AxeQueueManager` | 队列不能解决二次方耗时 | 逐 demo 扫描（天然分块）+ `maxNodes` 保护 |
| `disabledRules` | 我们的 README 明文禁止 | 改为 `allow`（**必须带 reason**），见 §5.3 |

---

## 5. 本项目增量模块的设计

### 5.1 统一形状：`RenderSource`

上游每个模块的入参形状都不同（`mountTest(Component)` / `demoTest(componentName)` /
`rootPropsTest(componentName, customizeRender, options)`）。我们统一成：

```ts
interface RenderSource {
  /** 一组 demo 模块（调用方的 `import.meta.glob(..., { eager: true })` 产物）。 */
  demos?: DemoModules;
  /** 单个渲染工厂。与 `demos` 互斥。 */
  render?: () => VNodeChild;
  /** Provider 包装（ConfigProvider / ThemeProvider / …）。默认恒等。 */
  wrap?: (slot: () => VNodeChild) => VNodeChild;
}
```

理由：`demos` 与 `render` 覆盖了上游全部形态（demo 遍历 / 单组件），
`wrap` 取代了上游散落在各处的 `ConfigProvider` 硬编码（F5）。

### 5.2 `demoTest` 的契约（去快照后的替代）

| # | 断言 | 上游有吗 |
|---|---|---|
| 1 | 每个 demo 渲染**不抛错** | 有（隐式） |
| 2 | 每个 demo **无未豁免的 `console.error` / `console.warn`** | 部分（上游只快照，不判空） |
| 3 | 卸载**不抛错** | 无（我们加） |
| 4 | `demos` 的条数 == `expectCount`（若给了） | 无（我们加，防 F1 的静默少测） |
| 5 | **不做** HTML 快照 | 上游有，我们**有意去掉**（A7） |

第 5 条是**唯一一处我们比上游弱**的地方，必须说明补偿机制：
上游快照能抓到「结构漂移」，我们由 **L4 `domContractTest`**（结构化投影 + 与 React 基线逐属性比对）
覆盖同一件事，而且**方向正确**（比对 React 而不是比对「上一次的自己」）。

### 5.3 `a11yDemoTest` 的收紧

```ts
a11yDemoTest('button', {
  demos,
  allow: [{ rule: 'color-contrast', reason: '…', deviationId: 'D19' }],
});
```

- **不提供** `disabledRules`（上游有）。改为 `allow`，每条**必须带非空 `reason`**，
  否则 `assertAllowance` 抛错。这与 `tests/compat/README.md` §3.4 的
  `allow` 约定（必须 `reason` + `deviationId`）**同构**，是全仓库统一的反静默机制。
- 扫描**逐个 demo**，不把所有 demo 塞进一个容器 —— 这正是 icons 实测
  「节点数二次方」结论的直接应用（`docs/foundation/icons-contract.md` §6.2）。
- 额外提供 `maxNodes`：单个 demo 的 DOM 节点数超过阈值时**失败并提示**，
  而不是让 CI 悄悄跑 10 分钟再被 OOM 杀掉。默认 `400`（实测该规模约 12s，是可控上限）。

### 5.4 `domContractTest` 与归一化的两档投影

提取 `dom-contract.ts` 时新增**投影档**（`profile`），两侧**必须用同一档**（对称）：

| 档 | 保留 | 用途 | 依据 |
|---|---|---|---|
| `contract`（默认） | 标签 + 类名 + `data-*` + `role`/`aria-*` | 组件 | `TESTING.md` T10 |
| `full` | 全部属性 | icons（图标**全部产出**就是属性） | `icons-contract.md` §6.1 的登记偏离 |

新增 **id 引用归一化**（`tests/compat/README.md` §4 要求「忽略 `id`，改为比对引用关系是否自洽」）：

1. 按文档序把每个 `id` 值映射成 `{i0}` `{i1}` …（两侧独立编号，只看**顺序**不看值）
2. `aria-labelledby` / `aria-describedby` / `aria-controls` / `aria-owns` /
   `aria-activedescendant` / `for` / `list` / `headers` 的值按空白拆成 token，
   逐个查表；查不到（引用了树外元素）映射为 `{ext}`
3. `id` 属性本身从投影中**移除**

于是「引用关系是否自洽」变成可断言的：`aria-controls` 指向树内元素时两侧都是 `{i0}`，
指向树外时两侧都是 `{ext}`。**若我们漏渲染了被引用的节点**，两侧会得到不同的 token，测试红。

### 5.5 `themeTest` 的四态

| 态 | 构造 |
|---|---|
| `light` | `ThemeProvider` + `defaultAlgorithm` |
| `dark` | `ThemeProvider` + `darkAlgorithm` |
| `compact` | `ThemeProvider` + `compactAlgorithm` |
| `token-override` | `ThemeProvider` + `theme.token` 覆盖若干 Seed Token |

断言：四态各自**渲染不抛错 + 无未豁免警告 + 根节点存在**。
**不**断言具体颜色值 —— 那是 `@apollo-design/theme` 自己的 L1 职责
（`packages/theme/src/__tests__/baseline.test.ts` 与 antd 逐字段比对），
组件层只需证明「四态都能渲染出来」。这条边界必须写在测试注释里，否则会重复建设。

---

## 6. 对测试体系的影响

### 6.1 本包自己的测试文件名**不能**用保留名

`vitest.config.ts` 按文件名分 project：

| 文件名 | 归属 project | 在 `--verify` 里跑吗 |
|---|---|---|
| `*.test.ts` | `unit` | ✅ |
| `semantic.test.ts` | `dom-contract` | ✅ |
| `a11y.test.ts` | `a11y` | ✅ |
| `theme.test.ts` | `theme` | ❌ **`TEST_PROJECTS` 里没有 `theme`** |

因此本包**禁止**出现 `a11y.test.ts` / `theme.test.ts` / `semantic.test.ts` 三个名字。
本包用：`a11y-demo.test.ts` / `theme-matrix.test.ts` / `dom-contract.test.ts`。

> ⚠️ **顺带发现的工具缺口**：`registry/tools/foundation-status.mjs` 的
> `TEST_PROJECTS = ['unit', 'dom-contract', 'types', 'a11y']` 漏了 `theme`。
> 今天没有包产出 `theme.test.ts`（`packages/theme` 的测试文件叫 `vue.test.ts` / `css-var.test.ts`…），
> 所以这个洞**尚未显形**；一旦第一个组件加 `theme.test.ts`，`--verify` 就会静默漏测它。
> 已登记为待办（见 §8 Q2）。

### 6.2 本包必须进入覆盖率阈值档位

`vitest.config.ts` 的 `coverage.thresholds` 当前列了 10 个包，**不含 `test-utils`**。
不列它意味着本包的覆盖率**只被 `foundation.json` 的 `--verify` 事后比对**，
而 vitest 本身不会拦。既然本包是「所有测试都依赖的一层」，
它的逻辑错误会**同时污染所有下游测试的语义**，必须前置拦住。

**处置**：把 `packages/test-utils/src/**` 加入 foundation 档位（95 / 90 / 95）。
这是**收紧**。

### 6.3 `--verify` 的覆盖率聚合口径

`foundation-status.mjs:298-307` 的 `coverageFor(dir)` 按
`packages/<dir>/src/` 前缀聚合 `coverage-summary.json` 的键。
本包**没有生成产物目录**，所以不存在 icons 那种「生成物被算进来」的问题
（那次踩坑见 `vitest.config.ts` 的 `coverage.exclude` 注释）。

---

## 7. 对 `@apollo-design/test-utils` 公开 API 的最终决定

```ts
// ---- 夹具与渲染源 ----
export type { Allowance, DemoModules, RenderFactory, RenderSource, Wrap } from './types';

// ---- 豁免校验（反静默） ----
export { assertAllowance, AllowanceError } from './allowance';

// ---- 告警 ----
export type { WarningCapture, WarningRecord } from './warnings';
export {
  captureWarnings,          // 采集 console.error / console.warn
  excludeWarning,           // captureWarnings 的别名（对齐上游命名，便于迁移时搜索）
  resetWarned,              // 复用 @apollo-design/utils（T2；本包不重写）
  resetDevWarned,
} from './warnings';
export { default as excludeAllWarning } from './warnings';   // beforeAll/afterAll 包装

// ---- 确定性等待 ----
export { flushAll, waitFrames } from './timing';

// ---- L4 DOM 契约 ----
export type { ContractOptions, DomBaseline, DomNode, ProjectionProfile } from './dom-contract';
export {
  contractOf, diffContract, diffHtml, domContractTest, normalizeStyle, parseFragment, projectNode,
} from './dom-contract';

// ---- 共享契约 ----
export { default as mountTest } from './mount-test';
export { default as demoTest } from './demo-test';
export { default as a11yDemoTest } from './a11y-demo-test';
export { default as focusTest } from './focus-test';
export { default as rtlTest } from './rtl-test';
export { default as rootPropsTest } from './root-props-test';
export { default as themeTest } from './theme-test';
```

**有意不导出**（与上游的差异，逐条有理由）：

| 上游有 | 我们不导出 | 理由 |
|---|---|---|
| `isSafeWarning` | ❌ | 白名单两条都是 React 专有（§2.2）。提供一个恒返回 `false` 的函数是死代码；提供一个可配置的静默开关是 A7/H8 的后门 |
| `sleep` | ❌ | A3 明文禁止 |
| `waitFakeTimer` | ❌ | 语义被 `flushAll` / `waitFrames` 覆盖（F2），且接收毫秒数等于 `sleep` |
| `disabledRules` | ❌ | README 明文禁止；改为必须带 `reason` 的 `allow` |
| `imageTest` | ❌ | L6 职责，在 `tests/visual/` |
| `semanticDemoTest` | ❌ | 它测的是 `_semantic.tsx` demo 的快照，同 A7 |
| `extendTest`（强制浮层展开） | ❌ | 依赖 `TriggerMockContext`，而浮层的 provide 键属 `overlay`/`ui` 层契约（F5 同理） |
| `renderHook` | ❌ | Vue 无对应物；composable 测试用 `mount` + 夹具组件 |

---

## 8. 待裁决（不阻塞本包完成，登记备查）

### Q1 · `--verify` 是否补上 `theme` project

- **事实**：`TEST_PROJECTS` 缺 `theme`；今天没有文件落在那，所以未显形。
- **选项 A**：补上 `theme`，并给 `--verify` 的 vitest 调用加 `--passWithNoTests`
  （否则 `theme` project 零匹配会让 vitest 非零退出 → `--verify` 拿不到报告 → 静默保留旧值）。
- **选项 B**：保持现状，在 `TESTING.md` 里写明「`theme.test.ts` 不进 `--verify`」。
- **建议**：A。零匹配的失败含义已由「覆盖率 `met: null`」兜住，比漏测一个 project 安全。
- **本包的影响**：无（本包不产 `theme.test.ts`）。

### Q2 · `domContractTest` 与 `tests/compat/runner/` 的基线格式归一

`tests/compat/README.md` §2 规划的基线格式是 `<id>.dom.json`（**归一化后**的结构化契约），
而 icons 的基线存的是**原始 HTML**（`icons.dom.json` 的 `cases[].html`），归一化在消费侧做。

- **选项 A**：基线**存原始 HTML**（现状），归一化只在消费侧 —— 好处是「归一化规则改了不用重生成基线」，
  坏处是基线文件大（icons 855KB）。
- **选项 B**：基线**存归一化结果**，Phase 2 的 runner 生成 —— 文件小，但归一化规则一改就得重跑 React 侧。
- **建议**：A。理由：归一化是**我们的解释**，把它写进基线会让「基线」不再是机械 oracle。
  （这与 `WORKFLOW.md` §1.1.1 的 PoC 判据「对照物必须机械移植」是同一条原则。）
- **本包的影响**：`DomBaseline` 类型按 A 定义（`cases[].html`），但**只要求这个最小形状**，
  不锁定基线文件的其他字段，给 Phase 2 留空间。

### Q3 · `verification.typecheck` 无人校验（2026-09-17 补登）

- **事实**：`foundation.json` 每个包都有 `verification.typecheck.{status,errors}`，但**没有任何工具会去重算它**。
  `--verify` 只覆盖 `verifiedAt / unit / coverage / thresholds`，`--verify-build` 只覆盖 `build`。
  `typecheck` 是纯人工填写的字段。
- **后果（已经发生过）**：`utils` 与 `theme` 的条目写着 `status: "clean", errors: 0`，
  但 2026-09-17 实测 `vue-tsc --noEmit -p tsconfig.json` 报 **2 个错误**
  （`packages/theme/build.config.ts` 的手写类型注解与 dist 真实签名不符；
  `packages/utils/src/env.ts` 的 `ProcessEnvLike` 是 weak type）。
  也就是说这两条 `clean` 在写下之后就已经过期，而**没有任何门禁会发现**——
  因为 G13 的 `pnpm run lint` 虽然会跑 `vue-tsc`，但它的红/绿**不会被写回 registry**，
  人只要不看 CI 输出，registry 就一直显示「干净」。
- **选项 A**：给 `foundation-status.mjs` 加一个 `--verify-types`，跑 `vue-tsc` 并把
  按文件归属的错误数写回 `verification.typecheck`（与 `--verify` 同样的归属逻辑）。
- **选项 B**：删掉 `verification.typecheck` 字段，把「类型是否干净」完全交给 `pnpm run lint`
  的退出码，不在 registry 里留一份会腐烂的副本。
- **建议**：A。理由：`verification` 的价值在于「一条命令就能拿到全部事实」，
  把 typecheck 摘出去会让它重新变成需要人记得跑的东西；而 B 会让「这个包类型干净吗」
  在多包并行推进时失去按包粒度。
- **本包的影响**：无。本包对 `vue-tsc` 的贡献是 0 错误（2026-09-17 实测，全仓 202 个文件零错误）。

---

## 9. 这个包**没有**证明什么（必须写下来）

1. **没有证明像素一致**。本包不产出任何视觉产物；L6 是 `tests/visual/` 的职责。
2. **没有证明 RTL 布局正确**。jsdom 无布局引擎。`rtlTest` 只证明
   「在调用方给的 RTL 上下文里能渲染出来，且根元素带 `-rtl` 后缀类」。
   真正的布局正确性靠 `COMPONENT-RULES.md` §5.3 的「逻辑属性」约束 + L6。
3. **没有证明 `ConfigProvider` 的 `direction` 契约**。`ConfigProvider` 尚未实现（F5）；
   本包的 `rtlTest` 只提供了注入点。
4. **没有证明组件行为正确**。`mountTest` / `demoTest` 只证明「不抛错、无警告、无泄漏」；
   T14 明文写着「不允许用 `mountTest` 替代行为测试」。
5. **没有证明 demo 内容是对的**。去掉 HTML 快照（A7）之后，
   「demo 渲染出了预期内容」这件事**只由 L4 `domContractTest` 承担**，
   而它比对的是 fixture 而不是 demo。demo 的语义正确性靠人读 + L6 截图。
6. **没有证明 axe 的结论与真实浏览器一致**。axe 在 jsdom 下不做布局/绘制，
   `color-contrast` 等规则在 jsdom 中**无法判定**（会报 `incomplete` 而不是 `violation`）。
   对比度按 `TESTING.md` §6.2 由 theme 层断言 Token，由 L6 断言渲染结果。
7. **没有证明 `@apollo-design/utils` 的告警体系在测试环境之外也静默**。
   那是 `packages/utils` 的 L7 构建测试（`NODE_ENV=production` 下 `warning()` 静默）的职责。

---

## 10. 实现回填（2026-09-17）

设计（§1–§9）写于实现之前。这一节记录**实现之后**与设计的差异，
以及实现过程中由测试发现的、设计阶段没预见到的问题。

### 10.1 与设计的差异

| 项 | 设计 | 实现 | 原因 |
|---|---|---|---|
| 模块导出形式 | 未指定 | **具名 + default 双导出** | 上游 antd 的 `tests/shared/*` 用默认导出，保留它便于迁移；具名导出便于本包内部与测试引用。**踩过**：只给 default 时 `import { mountTest }` 静默变成 `undefined`，报错信息是 `mountTest is not a function`，指向错误的方向 |
| `mountTest` 的 `assertNoLeak` | `boolean \| 'auto'` | `'auto' \| { skip: true; reason }` | 布尔开关就是一条可以无声关掉断言的通道，与全包「不允许沉默的例外」冲突 |
| `MountTestOptions` | `extends RenderSource` | **封闭接口**（不继承） | 继承会让 `mountTest(name, { demos })` 在类型层合法、只在运行期报错。封闭接口把错误提前到编译期（运行期守卫仍保留，保护 JS 调用方） |
| `DomRenderResult` | `string \| VNodeChild` | `string \| VNodeChild \| Component` | 类型层拒绝组件、运行期接受组件 —— 这是最难查的一类不一致。`resolveRenderable` 本来就接受组件 |
| `findFocusElement` 的 0 候选分支 | 合并进 `!== 1` | **拆成 0 与 >1 两条** | 合并后「一个候选都没有」这句话永远说不出来（实测踩过），而两种情况的下一步动作不同 |
| `themeTest` / `mountTest` / `rootPropsTest` 的豁免校验 | 只在运行期 | **同时**在收集阶段 | 与 `demoTest` / `a11yDemoTest` / `rtlTest` 对齐，快速失败 |
| `expectCount` 守卫 | 内联 `expect(n).toBe(m)` | 抽成 `collectCountFailures` **纯函数** | 与全包「判定逻辑必须可单测」一致；失败信息里给出「glob 匹配不到文件不会报错」的指引 |
| 新增 `MountedCase.content` | 无 | 有 | `host > div[data-v-app] > 产物` 是三层结构（实测）。`html()` 与默认 `findRoots` 都必须取第二层的**子节点**，否则会多出一层包装 |

### 10.2 由测试发现、设计阶段未预见的问题（全部已修）

| # | 问题 | 后果（若不修） | 修法 |
|---|---|---|---|
| 1 | `flushAll()` 在**假定时器**下死等 | 所有在 `vi.useFakeTimers()` 里跑的组件测试挂死。根因：`@vue/test-utils` 的 `flushPromises` 用 `setImmediate \| setTimeout`，而 vitest 默认伪造全部 timer；实测 `advanceTimersByTime(0)` 同步推进**也救不回来**，只有 `advanceTimersByTimeAsync(0)` 可以 | `timing.ts` 按 `vi.isFakeTimers()` 分流；`timing.test.ts` 把三个实测事实固化成断言 |
| 2 | `mountCase.html()` 返回 `host.innerHTML` | 每个 DOM 契约比对都会多一条 `我们多出属性 data-v-app=""`，且类名比对整体错位 | 改取挂载容器（`host.firstElementChild`）的 `innerHTML`，并把它暴露为 `content` |
| 3 | `mountCase` 在 `attach: false` 时不传 `attachTo` | `@vue/test-utils` 自建内部容器，产物落在那里，`html()` 永远返回空串 | 始终 `attachTo: host`；`attach` 只控制 host 是否进 `document.body` |
| 4 | `rootPropsTest` 默认 `findRoots` 取 `host.children` | 拿到的是挂载容器 div，**每个组件**都会以「根[0] 缺少 rootClassName」假失败 | 默认取 `host.firstElementChild.children`（产物自己的根） |
| 5 | `domContractTest` 的 `toHtml` 把组件对象直接交给渲染函数 | Vue 只认 vnode，渲染出**零个根节点** → `$: 根节点数不同 1 vs 0` | 经 `resolveRenderable` 解析（与 `demoTest` 同一套规则，T2） |
| 6 | `focusTest` 的 `refFocus` 用 `wrapper.vm` | `mountCase` 外面套了 Host，`wrapper.vm` 是 Host 而不是被测组件 → 失败信息指向「组件没 expose focus」 | 用 `findComponent(vnode.type)` 精确定位被测组件 |
| 7 | 夹具 `RtlBox` 的静态类名以 `-rtl` 结尾 | 默认断言「存在任一 `-rtl` 结尾类名」在 ltr 下也恒真，整条夹具丧失分辨力 | 静态类名改为 `fixture-dir`，标记类为 `fixture-dir-rtl` |
| 8 | 用 grep 源码断言「没有用快照」 | 本包模块的**文档注释里引用了**上游的 `toMatchSnapshot()`，grep 会误判 | 改成行为断言：`__snapshots__` 目录不存在 |

### 10.3 `dom-contract` 的提取已执行

见 `docs/foundation/icons-contract.md` §6.3。`packages/icons/src/__tests__/dom-contract.ts`
（195 行）已删除，icons 的 `semantic.test.ts` 改为从本包导入并传 `profile: 'full'`。
迁移后 L4 层 43 个用例（含 848 图标全量比对）逐条通过，与提取前**逐位一致**。

### 10.4 测试与覆盖率

| 层 | 文件 | 用例数 |
|---|---|---|
| L1/L2 | `allowance` / `warnings` / `timing` / `render` / `dom-contract` / `mount-test` / `demo-test` / `a11y-demo` / `focus-test` / `rtl-test` / `root-props` / `theme-matrix` 共 12 个 `.test.ts` | **256** |
| L3 | `api.test-d.ts`（含 12 处 `@ts-expect-error` 负例） | **37** |
| L4 | 本包**不**产 `semantic.test.ts` —— 它是 L4 的**提供方**，不是消费者 | `n/a` |
| L5 | **`n/a`** | 见 `registry/foundation.json` 的 `layerNotes` |
| L6 | **`n/a`** | 同上 |
| L7 | `tests/build/run.mjs` | 见 §10.5 |

⚠️ 本包**刻意不用** `a11y.test.ts` / `theme.test.ts` / `semantic.test.ts` 三个文件名：
`vitest.config.ts` 按文件名分 project，占用它们会让本包的测试被归到别的层。
主题矩阵测试因此叫 `theme-matrix.test.ts`。

### 10.5 L7 构建门禁（`node tests/build/run.mjs --package test-utils`）

| 项 | 结果 | 说明 |
|---|---|---|
| B1 | ✅ | `unbuild` 退出码 0 |
| B2 | ✅ | `exports` 中每个子路径都解析到真实文件 |
| B3 | ✅ | 产物无 React 痕迹 |
| B4 | ✅ | 产物无 `@rc-component/*` / `rc-*` |
| B5 | n/a | 本包不产出 CSS（见 scaffold 的 `notDo`） |
| B6 | n/a | 裁决 A 下为单文件产物，无按组件按需入口可比对 |
| B7 | n/a | 本包不产出 CSS，无主题产物可校验 |
| B8 | n/a | 本包不含组件，无 SSR 冒烟对象 |
| B9 | ✅ | `package.json` 的 `files` 与产物一致 |
| B10 | ✅ | 产物体积在预算内（`dist/index.mjs` 39.1 KB） |

**B1 一度是红的，根因值得记下来**：`themeTest` 直接复用 `@apollo-design/theme` 的
`ThemeProvider` / `getDesignToken`（T2），但 `packages/test-utils/package.json` 没声明它。
unbuild 遇到「被 import 但未声明的 workspace 包」时会把它当成**要被内联打包**的目标，
于是以 `Potential implicit dependencies found: @apollo-design/theme` + 退出码 1 失败 ——
**报错信息说的是「隐式依赖」，不是「缺依赖」**，很容易被误读成配置问题。
同时这也是一个「`package.json` 由脚手架模板拥有」的陷阱：手工往 `package.json` 加的行，
会在下一次 `scaffold-packages.mjs --force-pkg` 时被抹掉。所以修法是**两处一起改**：
`registry/tools/scaffold-packages.mjs` 的 `deps`（真正的所有者）+ 包内 `package.json`。
`deps` 补上 `theme` / `utils` 之后，`foundation.json` 的 `dependsOn` / `implOrder` 也才与事实一致
（此前 test-utils 被算作零依赖，`implOrder` 排在 icons 之前）。

### 10.6 Registry 收口与三道门禁（G12 / G13）

`registry/foundation.json` 的 test-utils 条目：6 维度全 `done`；
`L1-unit` / `L2-interaction` / `L3-type` / `L7-build` = `done`，
`L4-dom-contract` / `L5-a11y` / `L6-visual` = `n/a`（依据写进 `layerNotes`）。

实测值（`foundation-status.mjs --verify` 自动写入，非手工填写）：

| 指标 | 值 | 阈值 |
|---|---|---|
| 测试 | 335 / 335 通过（14 个文件，projects = unit + dom-contract + types + a11y） | — |
| 覆盖率 · 语句 | 96.91% | ≥ 95 |
| 覆盖率 · 分支 | 92.11% | ≥ 90 |
| 覆盖率 · 函数 | 97.16% | ≥ 95 |
| 覆盖率 · 行 | 97.74% | — |
| `thresholds.met` | `true` | — |
| 类型检查 | `clean`（0 错误） | — |

⚠️ `unit.tests = 335` 比 §10.4 的 256 + 37 = 293 多 42：`types` project 会把每个
`*.test-d.ts` 跑两遍（一遍运行时、一遍 TS 报告），`--verify` 从 JSON 报告里逐条计数。
这是**工具口径**，不是本包的用例数写错了；utils / theme / icons 的历史记录同一口径。

三道门禁（G13）：

```
pnpm run registry:check   ✅ E2–E18 全绿（E16 确认 completed 包均通过门禁）
pnpm run lint             ✅ vue-tsc 零错误 + biome 0 error（19 warning，均为 noNonNullAssertion，配置为 warn）
pnpm run test             ✅ unit / dom-contract / a11y / theme 四 project 全绿
node tests/build/run.mjs  ✅ 127 项检查，FAIL 0（4 项 PENDING 全在 @apollo-design/ui，与本包无关）
```

**收口时顺手修掉的两个跨包缺陷**（都不是本包引入，但都会让 G13 永远红着）：

1. **`lint:types` 在 HEAD 上就是红的**（2 个错误，`packages/theme/build.config.ts` 与
   `packages/utils/src/env.ts`）。见 §8 Q3：`verification.typecheck` 是唯一无人重算的字段，
   所以 utils / theme 的 `clean` 已经过期很久而没人发现。修法见对应文件的注释。
2. **`scaffold-packages.mjs` 漏声明 test-utils 的两个依赖**（见 §10.5）。

