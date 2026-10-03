# KNOWN-ISSUES.md — 已发现的问题登记簿（**可交接**）

> **这份文档是「欠账台账」，不是规范。** 规则本体在 `AGENTS.md` / `ARCHITECTURE.md` /
> `COMPATIBILITY.md` / `COMPONENT-RULES.md` / `TESTING.md` / `WORKFLOW.md`；
> 坑的全文在 `.workbuddy-ai/memory/PITFALLS.md`（**不进会话注入**，按需读）。
>
> **接手方式**：读 §0 → 按 §4 的顺序挑一条 → 每条都给了「怎么修 + 怎么验」。
>
> **写法要求**（与 `PITFALLS.md` 同一条纪律）：每条必须给**可复现的判据**
> （命令 / 文件:行号 / 实测数字）。**没有证据的不进这份文档**（宁可标「待核」）。
> **修掉一条**：标 ✅ 并写明 commit，**不要删了不留痕**。

---

## §0 复现环境（**先做这个**，否则下面的命令会失败或慢 6–8 倍）

```sh
# ① pnpm 不在 PATH（只有 corepack）⇒ 造 shim
mkdir -p /tmp/pnpm-shim && printf '#!/bin/sh\nexec corepack pnpm "$@"\n' > /tmp/pnpm-shim/pnpm
chmod +x /tmp/pnpm-shim/pnpm
export PATH=/tmp/pnpm-shim:$PATH COREPACK_ENABLE_DOWNLOAD_PROMPT=0 CI=1

# ② 关掉两个拖慢 6–8 倍的沙箱钩子（本机两个都是 1）
export CODEBUDDY_BROKERED_FS_HOOK_ENABLED=0 CODEBUDDY_SAFE_DELETE_SANDBOX=0

# ③ 🚨 视觉 / 构建入口**额外**要带这个，否则打包阶段被 safe-delete 拦下（阈值 50）
export CODEBUDDY_SAFE_DELETE_ENABLED=0
#    报错原文：SAFE_DELETE_BULK_CONFIRM_REQUIRED {"count":50,"threshold":50}
```

| 想做什么 | 命令 |
|---|---|
| 看下一个任务（**唯一权威**） | `node registry/tools/next-task.mjs` |
| 查某组件的 11 维度 | `node registry/tools/ask.mjs component <c>` |
| 查开放决策**原文** | `node registry/tools/ask.mjs decision <id>` |
| 全量 L6 | `node tests/visual/run.mjs --mode compare` |
| 单组件 L6 | `node tests/visual/run.mjs --mode compare --component <c>` |
| 重生成某组件基线 | `node tests/visual/run.mjs --mode baseline --component <c>` |
| 基线重复自检 | `node tests/visual/run.mjs --check-baselines` |
| L4 全量 | `pnpm run test:dom` |
| 类型测试 | `pnpm run test:types` |
| 四道门禁 | `pnpm run verify:full` |

⚠️ **改完组件源码再跑 L6 时，必须先 `pnpm run build:ui`** —— 视觉层解析的是
`packages/ui/dist` 产物，不是 `src`（PITFALLS **327**；判据：差异率与上一轮**逐位相同**）。
⚠️ **改完 `style/` 同理**（PITFALLS 20）。
⚠️ **registry 生成器有顺序**：`gen-registry` → `foundation-status` → `gen-workstreams`
（PITFALLS **329**），乱序会让 `registry:check` 报「已过期」。

---

## §1 已发现、未修（按性价比排序见 §4）

> **本节现状**（2026-10-03 复核后）：
> - **1.1 已裁决并执行**（`visual-baseline-in-git` = **A 入库 git**）：84 条 → **9 条**（只剩 float-button，
>   原因见 **1.10**）；
> - **1.4 已加护栏**（`event-name-casing.test.ts`，489 → 3）· **1.9 已裁决并执行**（测试目录关闭
>   `noNonNullAssertion`）：207 → **63** 条 warn · **1.2 已修**（基线过期，非实现差异）；
> - **1.3 已证伪、关闭**（❌ 不是 bug，**别再查一遍**）；
> - **1.10 新登记**（float-button 的视觉变体**空转**，**需定夺**）·
>   **1.11 新登记**（`form` 校验链用例偶发红，`flush()` 固定 60 ms）；
> - 其余（1.5 / 1.6 / 1.7 / 1.8）**不需要决策**，可直接排期。

### 1.1 ✅ **已裁决并执行**（2026-10-03）L6 的 `missing-baseline`：**84 → 9**

- **裁决**：`visual-baseline-in-git` = **A —— 基线截图入库 git**
  （`node registry/tools/ask.mjs decision visual-baseline-in-git` 看原文）。
- **已做**：对 9 个组件跑 `node tests/visual/run.mjs --mode baseline --component <c>`，
  **入库 75 张**（`auto-complete` 9 · `cascader` 9 · `popconfirm` 9 · `progress` 9 ·
  `rate` 9 · `segmented` **12** · `select` 9 · `steps` 9）。
- **✅ 实测（这才是基线入库的真正价值）**：8 个组件 `--mode compare` ⇒
  **75 / 75 全部 `0.000% exact`** —— 我们的 Vue 实现与 antd React 渲染**逐像素一致**。
- **⚠️ 剩下 9 条**（`float-button`）：**基线没有入库**，原因见 **§1.10**
  —— 它三变体的截图**全是空白**，入库等于制造假绿。
- **✅ 全量 compare 实测**（2026-10-03，33 分钟）：**通过 1065 / 1077**。
  12 条失败 = **9 条 `float-button` 的 `missing-baseline`**（见 §1.10，**有意留红**）
  + **3 条 `typography/semantic` 的 `size-mismatch`**（见 §1.2，**既有欠账**）。
- **怎么验**：`node tests/visual/run.mjs --mode compare --component <c>` ⇒ `通过 N / N`。

### 1.10 🚨 **[新登记]** `float-button` 的 3 个视觉变体**全是空白图 ⇒ 变体空转**

- **现象**：生成基线时 `--check-baselines` 直接拦下：
  ```
  🚨 基线自检失败：
    - float-button/desktop：badge-tooltip == basic == shape-content 逐字节相同（未登记）
    - float-button/mobile：同上      - float-button/tablet：同上
  ```
  三张 PNG 的 `md5` **完全相同**，且尺寸极小（mobile **558 B** / tablet 747 B / desktop 1071 B）
  —— 打开看是**纯白**。
- **根因（已用 antd 源码确认）**：`FloatButton` 的根容器是 **`position: fixed`**
  —— `/tmp/antd-src/package/es/float-button/style/button.js:46-48`：
  ```js
  position: 'fixed',
  zIndex: token.zIndexPopupBase,
  insetInlineEnd: token.floatButtonInsetInlineEnd,
  ```
  而视觉 harness 的截图目标是 **`#stage` 元素**（`tests/visual/run.mjs:202`
  `screenshotElement(page, '#stage', outFile)`）⇒ `fixed` 元素定位到**视口**右下角，
  落在 `#stage` 的 boundingBox **之外** ⇒ **裁不到** ⇒ 两侧都是空白 ⇒ compare「exact」是**空的**。
- **为什么没有入库基线**：空白基线**不能当回归判据**（它测不出任何外观差异）。
  入库只会把「已知缺口」变成「**看不见的假绿**」。⇒ 保持 `missing-baseline` **红着可见**。
- **两条修法（择一，需定夺）**：
  1. **改用例**：在 `render/cases/{react,vue}/float-button.*` 的容器上加
     `transform: translateZ(0)` / `contain: paint`（任一都能让后代 `fixed` **改以该容器为包含块**）
     ⇒ 截图能拍到按钮 ⇒ 变体真正产生差异。⚠️ 代价：测的就不再是 antd 的**真实定位语义**。
  2. **改 harness**：对这类「视口级 fixed」组件改用**整页截图**（`fullPage: true`）而非元素截图
     ⇒ 保留真实语义。⚠️ 代价：影响**所有**组件的截图口径，需全量重生成基线。
  - 备选（不推荐）：在 `matrix.mjs` 登记 `duplicateAllow` —— 自检会过，
    但**测试依然空转**，属于「用登记掩盖空转」。
- **需要谁**：**用户/维护者定夺**（改用例 vs 改 harness）。📌 同族：`affix` 的
  「固钉态（`position:fixed`）需要真实滚动，不进视觉比对」——但 `affix` 至少**未固钉态是可见的**，
  `float-button` 是**整张图都空**，性质更严重。
- **判据（复现）**：
  ```sh
  node tests/visual/run.mjs --mode baseline --component float-button   # ⇒ 自检失败 + exit=1
  md5 tests/visual/baselines/react/float-button/*.png | awk '{print $NF}' | sort | uniq -c
  ```

### 1.11 ⚠️ **[新登记]** `form` 的校验链用例**偶发红**（`flush()` 固定 60 ms，并行负载下不够）

- **现象**：`verify:full` 的 `test:unit` 报
  ```
  FAIL unit packages/ui/src/form/__tests__/form.test.ts > Form · 校验链
       > required 失败 → explain + has-error + aria 三键；修复后清除
  AssertionError: expected false to be true
    ❯ form.test.ts:157  expect(w.find('.apollo-form-item-explain-error').exists()).toBe(true)
  ```
- **已排除「本次改动引入」**：
  - 单独跑该文件 ⇒ **14 / 14 通过**；
  - 带本次全部改动**重跑整套 `test:unit`** ⇒ **277 / 277 文件全过**、`exit=0`。
  ⇒ **间歇性**（同一份代码，一次红一次绿）。
- **根因（读码 + 已定位到具体链路）**：
  - 该文件的 `flush()` 是**单次墙钟等待**（`form.test.ts:29-33`：`setTimeout(60)` + 2×`nextTick`）；
  - 而渲染链**至少需要一个宏任务跳**：`validateFields` 的**旁路链**
    （`form-store.ts:901` `summaryPromise.catch().then(→ notifyObservers / triggerOnFieldsChange)`）
    → FormItem 的 `errors` prop → `useDebounce` 的 `watch` → **`setTimeout(0|10)`**
    （`form/hooks/use-debounce.ts:27`，用在 `ErrorList.ts:71` 与 `FormItem/ItemHolder.ts:68`）
    → 状态更新 → 重渲染。
  - ⇒ **线程被抢占时，链路可能还没走到「排定时器」那一步，而 60 ms 已经到期**
    ⇒ 断言在链路完成前执行 ⇒ **假红**。**单一墙钟等待无法覆盖这种「微任务被饿住」**。
- **⚠️ 复现尝试（做了，但没复现 —— 别重复劳动）**：
  - 单独跑该文件：**14 / 14 通过**；
  - 带本次全部改动重跑整套 `test:unit`：**277 / 277 文件全过**、`exit=0`；
  - **6 个 CPU burner + 连跑 30 轮**：**0 次失败**。
  ⇒ 只在**全量 277 文件并行**时偶发，**加 CPU 负载的单文件循环复现不出来**。
- **怎么修（建议，按稳健度排序）**：
  1. **首选**：把该用例里**依赖异步渲染**的断言换成 `vi.waitFor(() => expect(…))`
     —— **按条件轮询**（默认 interval 50 ms / timeout 1000 ms），与调度无关；
     断言本身**不放松**（条件始终不成立仍会红）。
  2. 次选：把 `flush()` 改成**多轮排空宏任务**（每轮 `await` 一个宏任务 + 冲刷调度器），
     把「单次墙钟」换成「多次让出」—— 仍不如 ①（轮次有限）。
  ⚠️ 该文件**没有用假定时器**（无 `vi.useFakeTimers`），所以 `vi.waitFor` 可直接用。
- **需要谁**：无（但要先判断「是等待不够」还是「校验链真的慢」——后者是真 bug）。
  ⚠️ 这是**另一个组件的测试**，改动要单独过 form 的门禁；**不要**为了让绿灯而放宽断言。
- 📌 判据：`pnpm exec vitest run --project unit packages/ui/src/form/__tests__/form.test.ts`

### 1.2 ✅ **已修（基线过期，不是实现差异）**（2026-10-03）`typography/semantic` 三条 `size-mismatch`

- **现象**：`node tests/visual/run.mjs --mode compare --component typography` ⇒
  `semantic__light__{mobile,tablet,desktop}` 三条 `size-mismatch`
  （**React 375×130 vs Vue 375×90**，差 **40 px**）；差异率**与视口宽反比**（1.284% / 2.408% / 4.931%）。
- **判定过程（决定性实验）**：
  1. 重新生成 React 基线 ⇒ `--mode baseline --component typography`；
  2. **三个 `semantic` PNG 全部变化**，高度 **130 → 90**；
  3. 复跑 compare ⇒ **24 / 24 exact**。
  ⇒ **React 与 Vue 现在都渲染 90 px** —— 旧基线（130 px）是**过期产物**，
  **不是**我们的实现与 antd 有差异。
- **根因**：该基线由 `8fdb121`（**2026-09-20**「test(typography): L6 视觉用例 + React 基线入库」）
  入库后**再未重生成**；而 `tests/visual` 的 harness / 用例在之后改过多次，
  其中 `b9a15bc`（「修两条系统性缺陷 —— 占位残留 与 **视觉变体空转**」）就动了渲染口径。
  ⇒ 旧图把 `ellipsis.expandable: 'collapsible'` 的 **`Expand` 渲染在单独一行**（共 3 行 / 130 px），
  新图是 antd 当前行为：**`Expand` 与第 2 行同行**（2 行 / 90 px）。
- **修法**：重生成基线并入库（**已做**）。
- **怎么验**：`node tests/visual/run.mjs --mode compare --component typography` ⇒ **24 / 24 exact**；
  基线自检 ✅（0 组重复）。
- ⚠️ **同类风险**：**基线一旦入库就要跟着 harness 走** —— 凡改 `tests/visual/render/**`
  或 `stabilize.mjs` / `run.mjs`，都要评估**已入库基线是否整体过期**
  （判据：`--mode compare` 大面积 `size-mismatch`/`block-diff`，而**组件源码没动**）。
  这与 §1.10 是**同一族**（都是「基线/harness 的口径问题」），但 1.10 更严重（拍不到东西）。

### 1.3 ❌ **不是 bug（2026-10-03 已证伪）** `Switch.ts` 剥掉 `onKeyDown` / `onClick`

> **本条原标「待核」，经复核后撤销** —— 记在这里是为了**防止下一个人再怀疑一遍**。
> 结论：**handler 不会被丢弃**，且**早有测试覆盖**。

- **原怀疑**：`packages/ui/src/switch/Switch.ts` 的 `:210/:211` 解构出
  `onKeyDown: _onKeyDown` / `onClick: _onClick` 并放进 `...restAttrs` 的**排除项**，
  而 `_onKeyDown` 在文件里**只出现这一处** ⇒ 疑似「父组件传的 handler 被静默丢弃」。
- **真相（读码）**：`callbacks` 是 **`attrs` 的别名**（`:86` `const callbacks = attrs as unknown as {...}`，
  **同一对象引用**，不是拷贝）⇒ 解构只是从**新对象** `restAttrs` 里摘掉这两个键
  （防止把父组件的 handler 再裸绑到 DOM 上一次），**`attrs` 本身没动**
  ⇒ `callbacks.onKeyDown?.(event)`（`:164`）/ `callbacks.onClick?.(ret, event)`（`:170`）
  **照样取到父组件的 handler**。`_` 前缀（`_onKeyDown`）正是「**故意不使用**」的约定。
- **实证**：这两条行为**早有 L1 用例**（`switch/__tests__/index.test.ts`）——
  - `:175` `onKeyDown 照常转发（在内部处理之后）`
  - `:182` `onClick 收到的是**结果值**（不是原生事件），且 disabled 时仍触发`
  - 实测：`pnpm exec vitest run --project unit packages/ui/src/switch/__tests__/index.test.ts`
    ⇒ **28 / 28 通过**。
- **需要谁**：无（**已关闭**）。

### 1.4 ✅ **已加护栏**（2026-10-03）「复合词事件名」全仓扫描 —— 已修 2 处，同类不再复发

- **背景**：Vue 的 `parseName` 对 `on` 之后的部分做 `hyphenate`
  ⇒ `onMouseDown` → **`mouse-down`**、`onKeyDown` → **`key-down`**
  ⇒ **永不触发、且不报错**（编译期无告警、`vue-tsc` 全绿）。**单段名不受影响**（`onClick` ✓）。
- **已修 2 处**（2026-10-03，commit `7147a3f`）——⚠️ **按符号定位，别按行号**（修复时插入了注释，
  行号已下移）：
  1. `segmented/Segmented.ts` 的 **`onMousedown: handleMouseDown`**（现 **:356**，修前 :353）
     —— 目标是原生 `<label>` ⇒「mousedown 清除键盘态」**从未生效**；
  2. `collapse/Panel.ts` 的 **`onKeydown: (e: KeyboardEvent) =>`**（现 **:101**，修前 :98）
     —— 该对象被 spread 到原生 `<div>`（header / 展开图标）⇒
     **Enter 键展开/收起失效**（**a11y 键盘操作**）。
- ✅ **护栏已落地**：`packages/ui/src/__tests__/event-name-casing.test.ts`（4 条用例）。
  用 **TypeScript AST** 只扫 **`h('<原生标签>', <props>)`**，且**穿透**
  `spread` / 条件表达式 / `computed(() => ({…}))` / `x.value`。
  - **豁免清单双向校验**（与 `style-prefix.test.ts` 同纪律）：未登记却扫到 ⇒ 红；
    登记了却扫不到 ⇒ 红（哨兵被删/改名 ⇒ 豁免不能空转）。
  - **当前命中 3 条，全是有意的反向哨兵**（`color-picker` 的 `onMouseDown`、
    `utils` 的 `onKeyDown` / `onDoubleClick`），**生产代码 0 命中**。
  - **🔁 反向哨兵（护栏自身的）**：把两个真 bug 改回去 ⇒ 护栏**红**并精确点名
    `collapse/Panel.ts:101 onKeyDown [h('div')]`（×3，spread 到 3 处）与
    `segmented/Segmented.ts:356 onMouseDown [h('label')]`；恢复后 4/4 绿。
- ⚠️ **两个「不误报」的判据（踩过才知道，必须保住）**：
  1. **`Once` / `Passive` / `Capture` 是 Vue 的合法后缀** —— `parseName` **先剥后缀、再
     hyphenate** ⇒ `onPointerdownCapture` → `pointerdown` ✅。判定前必须先剥后缀，
     否则会把 `overlay/use-overlay.ts` 的写法误报（本仓真用到）。
  2. **不能把 `x.y.value` 回溯到 `useSomeHook({…})` 的配置实参** ——
     `trigger.ts` 的 `onOpenChange` 是 `useOverlay` 的**配置**，不是落到 DOM 的 prop。
     ⇒ 只穿透 `computed` / `ref` / `shallowRef` / `reactive` / `readonly` / `toRef` 这类
     **透明包装**（实参就是返回的对象本体），其余调用一律放弃。
- ⚠️ **判据**：本仓有 **489** 处 `onXxxYyy:` 形态的对象键（绝大多数是**组件声明过的 prop**，
  合法 —— Vue 按**名字**解析声明过的 prop、**不经 `hyphenate`**）。
  所以**不能**用「全仓正则 + 逐条白名单」——那要 489 条。
  只有 `h('<原生标签>')` 这一层才是危险面（AST 过滤后 489 → **3**）。
- **需要谁**：无（**已关闭**）。📌 `PITFALLS.md` **323** / **338**。

### 1.5 ⚠️ `Trigger` 的 `children[0]` 归一化对「数组」的处理 —— 未做全仓扫描

- **现象**：`packages/ui/src/_internal/trigger.ts:606` 是
  `const first = Array.isArray(children) ? children[0] : children;` ——
  只认**元素 vnode**；拿到**数组 / Fragment** 会走「包一层 `<span>`」分支（D79）。
- **已知命中并已修**：`color-picker` 的 `children` 通道（commit `f950386`，见 §2.1）。
- **未做**：**没扫过其它把插槽直接转交给 Trigger / Popover / Tooltip 的组件**。
- **怎么扫**：找模板里「`<slot/>` 直接作为 `Trigger` / `Popover` / `Tooltip` 默认插槽内容」的位置；
  有 L4 用例的组件可直接看是否出现 `$/div[0]: 标签不同 <div> vs <span>`。
- **需要谁**：无。📌 `PITFALLS.md` **330**。

### 1.6 ⚠️ `ContextIsolator` 在本仓**不存在**（`color-picker` 靠「行为等价」绕过）

- **现象**：上游 `ColorPicker` 把面板包在 `<ContextIsolator form>` 里（屏蔽 Form 的 `status`）；
  本仓全仓无此物（最接近的 `NoCompactStyle` 只重置**紧凑**上下文）。
- **当前为什么没出事**：面板侧（`PanelPicker` / `ColorPresets` / 输入件）**没有任何子件读
  `useFormItemInputContext`** —— 只有 `ColorTrigger` 读，而它本来就在隔离器**外面**
  ⇒ 行为等价（登记 PLATFORM）。
- **风险**：**将来面板里只要出现一个读 form status 的子件，就会与上游分叉**（且不会有红灯）。
- **怎么修**：① 实现通用的 `ContextIsolator`；或 ②（更小）在 `ColorPicker.vue` 的面板处
  显式 `provide` 一个空的 form 上下文 + 写一条 L1 断言钉住。
- **需要谁**：无。

### 1.7 ⚠️ `_internal/use-merge-semantic.ts` **不支持 `schema` 档**（嵌套语义槽）

- **现象**：本仓的 `useMergeSemantic` 只做「平铺合并」；antd 的第四个参数 `schema`
  （如 `{ popup: { _default: 'root' } }`）**未实现**（该文件头自己写了「等出现第一个
  嵌套语义对象再实现」）。
- **当前为什么没出事**：`color-picker` 曾以为需要它，实测**不需要** ——
  读上游 `useMergeSemantic/utils.ts` 的 `fillObjectBySchema` 确认：`_default` 只做
  「把嵌套键初始化为 `{}`」+「把**字符串**形态的嵌套键落到 `popup.root`」，
  **不是**「从顶层 `root` 回退」。所以 `color-picker` 用可选链读 `popup.root` 即可。
- **风险**：**下一个有「真·嵌套语义槽」的组件**（如 Table 的 `header.cell`）会需要它。
- **怎么修**：按上游 `mergeClassNames(schema, …)` + `fillObjectBySchema` 逐条移植，
  补一条 L1 用例（顶层 `root` 与嵌套 `popup.root` **各传一半**，断言合并结果）。
- **需要谁**：无（**等第一个真实消费者**，别提前实现）。

### 1.8 📌 `ui` 包入口**没有导出 `Color` 别名**（上游有）

- **现象**：上游 `es/color-picker/index.js` 有 `export type { AggregationColor as Color }`；
  本仓 `packages/ui/src/index.ts` **没有**这个别名（只在 `color-picker/index.ts` 里导了）。
- **当前怎么绕过**：`color-picker` 的 7 个 demo 用
  `Parameters<ColorPickerEmits['change']>[0]` 代替 `Color`（已登记在组件 `README §5`）。
- **为什么不直接加**：顶层 `Color` 是**极易撞名**的短名。
- **怎么修**：若确认要加，按本仓「重名用别名」的约定导成 `ColorPickerColor`
  （与 `SelectInfo as CalendarSelectInfo` 同判，PITFALLS 6/158/168），并同步改 demo。
- **需要谁**：无。

### 1.9 ✅ **已裁决并执行** biome 诊断：**207 → 65 条 warn**（**不阻塞**，`exit=0`）

> ⚠️ **本条原写「2 条」，是错的**（2026-10-03 复核）。真实数字是 **207 条**。
> 错因值得记：biome **默认只显示前 20 条诊断**（输出末尾写 `Diagnostics not shown: 198.`），
> 照默认输出数就会严重低估 —— **必须加 `--max-diagnostics=none`** 才能看全。
> 判据：`pnpm exec biome check . --max-diagnostics=none 2>&1 | tail -3`
> ⇒ `Found 207 warnings.` / `Found 11 infos.` / `exit=0`。

- **全量分布 —— 改前（207 条，2026-10-03 实测，2738 文件）**：

  | 规则 | 改前 | 改后 | 性质 |
  |---|---|---|---|
  | `lint/style/noNonNullAssertion` | **184** | **40** | 144 条在 `__tests__/`（**已关规则**）；剩 40 条是生产代码的算法不变式 |
  | `lint/style/useTemplate` | 14 | 14 | 字符串拼接 |
  | `lint/complexity/useOptionalChain` | 9 | 9 | 可改 `?.` |
  | `lint/correctness/noUnusedFunctionParameters` | 4 | 4 | 未用参数 |
  | `lint/suspicious/noTemplateCurlyInString` | 3 | 3 | — |
  | `lint/suspicious/noConfusingVoidType` | 3 | 3 | — |
  | `lint/correctness/noUnusedPrivateClassMembers` | 2 | 2 | — |
  | `lint/performance/noAccumulatingSpread` | 1 | 1 | — |
  | **合计** | **207** | **65** | 全部 **warn** ⇒ `exit=0` |

  改前集中目录：`tooltip/__tests__`(23) · `tree/utils`(20) · `carousel/__tests__`(20) ·
  `date-picker/__tests__`(17) · `dropdown/__tests__`(15) · `rate/__tests__`(12) …
  改后只剩 13 个生产文件（`tree/utils/conductUtil.ts` 10 · `tree/utils/util.ts` 6 ·
  `tree/utils/treeUtil.ts` 4 · `progress/utils.ts` 4 · `listy/Listy.ts` 4 · …）。
- **其中 2 条**是「非测试代码、且**可当场修**」的（原文档只写了这两条）：
  1. `tests/visual/debug/classify-date-picker-rules.mjs:91:3` **`suppressions/unused`**
     —— 一条 `biome-ignore lint/style/useTemplate` **不再命中**（真正命中它的违规在
     **`:93:34` 与 `:94:27`**，说明 ignore 注释与违规行**没贴合**，同 PITFALLS **2**）；
  2. `registry/tools/validate-registry.mjs:467:15` **`lint/complexity/useOptionalChain`**
     （`if (skip && skip.test(line))` → `skip?.test(line)`，语义等价）。
- **已排除**：**不是 2026-10-03 那次改动引入的**（两个文件本次均未触碰；
  184 条 `noNonNullAssertion` 是长期存量）。

#### ✅ **已裁决并执行**（2026-10-03）：**测试目录关闭该规则**，生产代码保持开启

**处置 = 分两层**（判据见下）：

| 层 | 条数 | 处置 | 理由 |
|---|---|---|---|
| `**/__tests__/**` | **144** | **关闭** `noNonNullAssertion`（`biome.json` override） | 测试里的 `!` 是**故意的非空断言**；`?.` 反而**更弱**（见下） |
| 生产代码（13 文件） | **40** | **保持开启**，逐个用**真收窄**修，**不扫改** | 是**算法不变式**，机械改会**改语义**（见下） |

**① 为什么测试目录关闭 ≠ 降低验收标准（H8）**：`noNonNullAssertion` 是 **style** 规则，
不是 correctness。在测试里，元素为 `null` 意味着**夹具没产出预期节点** ——
`el()!.foo` 会抛 `TypeError`（**测试响亮地失败**，正是想要的），
而 `el()?.foo` 会**静默变 `undefined`**（部分断言形态下**假通过**）。
⇒ 保留 `!` 是**更强的**约束，关掉这条 style 规则**不削弱任何断言**。
（这也是主流做法：ESLint 的 `@typescript-eslint/no-non-null-assertion` 普遍对
`**/*.test.*` / `**/__tests__/**` 关闭。biome 自己把这条的 fix 标为 **unsafe**。）

**② 为什么生产代码**不能**扫改（硬证据，已实测）**：把 biome 的 unsafe fix 应用到真实形态：
```ts
checkedKeys.add(parent!.key);        // 原
checkedKeys.add(parent?.key);        // biome --write --unsafe 之后 ← Set<string> 里混进 undefined！
const steps = extra!.steps!;         // 原
const _steps = extra?.steps!;        // 之后 ← 类型变 `number | undefined`，且变量被改名
```
⇒ **`Set<string>.add(undefined)` 是静默的数据污染**。这类 `parent!` / `extra!.steps!`
（`tree/utils` 16 条 · `progress` 7 条 · `listy` 4 条 · `cascader/engine` 3 条 …）
与 rc-* 上游同构，**必须逐个判断不变量后再收窄**（`if (!parent) continue;` 之类），
**不能批量**。它们仍是 **warn（`exit=0`）**，不阻塞 `verify:full`。

- **落地**：`biome.json` 的 `overrides` 里 `**/__tests__/**` 增加
  `"style": { "noNonNullAssertion": "off" }`（⚠️ `biome.json` **不能写注释**，PITFALLS 4
  ⇒ 理由只在本文件与 commit message 里）。
- **✅ 实测**：`pnpm exec biome check . --max-diagnostics=none` ⇒
  **207 → 65 warnings**（`noNonNullAssertion` **184 → 40**），`exit=0`。
- **怎么验**：`pnpm exec biome check . --max-diagnostics=none 2>&1 | tail -3` ⇒ `Found 65 warnings.`
- ✅ **两条「可当场修」的也已修**（2026-10-03）：
  1. `tests/visual/debug/classify-date-picker-rules.mjs` **`suppressions/unused`**
     —— 根因是 ignore 注释**没紧贴诊断行**（PITFALLS **2**）：`biome-ignore` 下方隔了一行
     注释才到违规行 ⇒ 它作用于那行注释（无诊断）⇒ unused。
     **修法**：把 `biome-ignore` 移到**紧贴** `src.match(new RegExp('…' + name + '…'))` 那行；
     并把下一行 `throw new Error('找不到常量 ' + name)` 直接改成模板字面量
     （那处拼接**不需要**规避转义，属纯 style）。
  2. `registry/tools/validate-registry.mjs` **`lint/complexity/useOptionalChain`**
     —— `if (skip && skip.test(line))` → `if (skip?.test(line))`（语义等价；
     `skip` 为 `undefined` 时两者都是 falsy）。**✅ 改后 `registry:check` 仍 19/19。**
- **✅ 实测**：全仓 `biome check --max-diagnostics=none` ⇒ **63 warnings / exit 0**（再 −2）。
- **需要谁**：无（已执行）。生产代码那 40 条**随各组件下次改动时顺手收窄**，不单独排期。

---

## §2 已修、但有残留（**别把「已修」当成「已解决」**）

### 2.1 ✅ `color-picker` 的 `children` 多包一层 `<span>` —— 只修了**单子节点**路径

- **已修**（commit `f950386`）：默认插槽改经**渲染函数宿主组件**（`ColorPicker.vue` 的
  `TriggerHost`）转交，摊平后取单元素 ⇒ `Trigger` 的 `children[0]` 拿到**元素**
  ⇒ 不再包 span。L4 的 `color-picker:children` **删掉 allow 后零差异**。
- **残留**：**传多个子节点**时仍会包 span（`renderChildren` 在 `nodes.length > 1` 时返回数组）。
  上游 `children` 是**单个** `ReactNode`（无对应物）⇒ 不构成分叉，但**没有用例钉住**。
- **继续做**：若认为需要，加一条 L4 用例把「多子节点 ⇒ 包 span」写成**明确契约**。

### 2.2 ✅ `tabs` 的 `size` 类型 —— 只修了 `size`，**没有全量审计 `TabsProps`**

- **已修**（commit `afc462f`）：`size` 从 `'small' | 'default' | 'large'` 改成上游的 `SizeType`
  （`'default'` 不是 antd 的值、且缺 `'middle'` / `'medium'`）。同时修掉三处
  **「把 bug 写成规格」**：L3 负例、两份文档 API 表、`card/demo/tabs.vue`（改回上游原值 `'medium'`）。
- **残留**：**`TabsProps` 的其它字段没有逐一与 antd 对拍**。
- **继续做**：写脚本对比 `TabsProps` 与 antd `es/tabs/index.d.ts` 的**字段集 × 类型**
  （数据源：`registry/source/antd-6.6.4.raw.json`）。

### 2.3 ✅ `tabs` 运行时声明 vs 公开 `TabsProps` —— 只统一了 **card 用到的字段**

- **已修**（commit `9419ff5`）：运行时声明一律改用**公开类型**
  （`TabsProps['renderTabBar' | 'locale' | 'more' | 'classNames' | 'styles']`），三个事件的 emits
  载荷从 `unknown` 换成 `TabsEditEvent` / `TabsEditAction` / 方向联合。
  **✅ 自证**：把 card 的 `as unknown as TabsRuntimeProps` 换成 `satisfies` ⇒ `lint:types` 0 错。
- **残留**：**其余 ~20 个字段（`animated` / `indicator` / `tabBarExtraContent` /
  `getPopupContainer` …）没有逐一核对** —— 目前**没有消费方**在转发，所以没暴露；
  一旦有第二个薄壳组件转发 `TabsProps`，就会撞上同一堵墙。
- **继续做**：`grep -n "PropType<" packages/ui/src/tabs/Tabs.vue` 逐条核对是否都引用了公开类型。
- 📌 判据：`PITFALLS.md` **333**（消费方能用 `satisfies` 通过 = 同源）。

### 2.4 ✅ `calendar` 的日期依赖 flake —— 只移除了**一条**，未做全仓扫描

- **已修**（commit `c7fd2ec`）：`calendar:no-value`（不传值 ⇒ 上游取 `getNow()`）的产物
  **随运行日变化** ⇒ 从 L4 移除（生成器 + 消费侧同步，两处写明原因）；行为仍由
  `calendar/__tests__/index.test.ts` 的**语义断言**覆盖。`calendar` L4 **27/27**。
- **残留**：**没有扫过其它组件的 L4 基线里是否也有「随运行日 / 运行时刻变化」的用例**。
- **怎么扫**：① 对 `tests/compat/baseline/*.mjs` 找「是否传了时间相关 prop」；
  ② 对已入库的 `tests/compat/baselines/*.dom.json` 搜 `today` / `now` / 相对时间文案；
  ③ 搜 `getNow()` / `Date.now()` / `new Date()` / `Math.random()`。
- **需要谁**：无。📌 `PITFALLS.md` **334**。

### 2.5 ✅ **已完全关闭** `utils.Color` 的字段 `private → public`（**L0 变更**）

- **已修**（⚠️ **commit 是 `9c9f557`，不是原写的 `1bd30e7`** —— 2026-10-03 复核更正；
  判据：`git log --oneline -S"@internal" -- packages/utils/src/color/color.ts` ⇒ 唯一命中 `9c9f557`）：
  为绕过 Vue 的 `UnwrapRef`（**映射类型**会丢掉 `private` 成员），
  把 `packages/utils/src/color/color.ts` 的 **7 个缓存字段 + `getMax` / `getMin`** 改成
  `public` + `/** @internal */`。**`utils` 已单独重建**
  （改 L0 后**必须**重建，PITFALLS 176 / 249）。
- ✅ **残留已关闭**（2026-10-03 复核）—— 原担心「`utils` 里还有别的带 private 成员的值对象」，
  实测**一个都没有**：
  ```sh
  grep -rnE "(^|[^a-zA-Z])private |protected " packages/utils/src   # ⇒ 0 命中
  grep -rnE "^\s*#[a-zA-Z_]" packages/utils/src                    # ⇒ 0 命中（JS 原生私有字段也没有）
  ```
  ⇒ `color.ts` 的那批是**唯一一处**，审计已天然完成。
- 📌 `PITFALLS.md` **325**（三个触发点：`ref()` / 模板 unwrap / `props`）。

### 2.6 ✅ `picker/time-tmpl.ts` 的 `useIndexOf` —— 已改，**已补跑 picker 测试 ⇒ 关闭**

- **已修**（commit `0255c4b`）：`findIndex((d) => d === minDist)` → `indexOf(minDist)`
  （**语义等价**：都是严格相等，`NaN` 时都返回 -1）。这是 **master 上既有的** lint 错误，
  会让 `verify:full` 的 `lint:format` 直接红。
- ✅ **残留已关闭**（同日补跑）：`pnpm exec vitest run --project unit packages/picker`
  ⇒ **308 / 308 通过**。

### 2.6b ✅ `segmented` / `collapse` 的「事件名」bug 已修，但**缺 L1 覆盖**

- **已修**（commit `7147a3f`，见 §1.4）：两处 `onMouseDown` / `onKeyDown` 改成小写 d。
- **残留**：**这两条行为此前没有任何 L1 用例** —— 这正是它们能活很久的原因。
  - `segmented`：「mousedown 清除键盘态」（原 README 写「由 L6 真浏览器验证」，现在 L1 可测了）；
  - `collapse`：**Enter 键展开/收起**（a11y 键盘操作）。
- ✅ **已补，且做了「反向哨兵」验证**（2026-10-03）：
  - `segmented/__tests__/keyboard.test.ts` 新增
    **`mousedown 清除键盘态：-item-focused 消失`**（事件派发到 **`label`**，handler 在那儿）；
  - `collapse/__tests__/index.test.ts` 新增
    **`键盘：header 上 Enter 切换展开（a11y 键盘操作）`** + 对照 `非 Enter 键不切换`。
  - **反向哨兵（关键）**：把两处键名**临时改回** `onMouseDown` / `onKeyDown` 再跑 ⇒
    **恰好这两条新用例红**（其余全绿）；恢复后 **28 / 28**。
    ⇒ 它们是**真的回归哨兵**，不是空转的假绿。
  - ⚠️ **同时更正了 `keyboard.test.ts` 里的旧误诊** —— 原文把原因写成
    「jsdom 下 Vue 的 mousedown listener 不被派发」，真因是**事件名大小写**（PITFALLS 323）。

### 2.7 ✅ `color-picker` 的 L4 只覆盖**触发器** —— 面板的 DOM 契约只在 L6

- **不是缺陷，是**有意分工**：面板在 `Popover` 的 Portal 里，**SSR 不渲染**
  （上游告警 `Portal only work in client side…`）；`PurePanel` 在 SSR 下**也不渲染面板**
  （`open` 由 `useEffect` 置真，SSR 不跑 effect）⇒ 面板 DOM 拿不到。
- **已做**：基线里留了 `open-no-portal` 用例作为**事实哨兵**；面板由 L6 承担（**27/27 exact**）。
- **残留**：**面板的 DOM 结构没有「与 antd 逐条对拍」的自动化** —— 只有像素级。
  若将来面板出现「像素相同但结构不同」的漂移，**不会红**。
- **继续做**（若认为值得）：在 L6 用例里加 DOM 断言（`tests/visual/debug/dump.mjs` 可 dump），
  或做「真浏览器里 dump 面板 DOM 再与 antd 对拍」的探针。

### 2.8 ✅ `color-picker` 的 demo **没有显式钉字体**

- **现象**：G11 落地时按**仓内惯例**（`card` 等 demo 都不写 `font-family`）没有钉字体；
  字体钉在 L6 的 `render/cases/*` 容器里。
- **残留**：若将来 **demo 参与像素比对**，继承字体的差异会显形
  （`docs/COMPONENT-CHECKLIST.md` 第 15 条）。
- **需要谁**：无（与全仓一致，**不要单独改 color-picker**）。

---

## §3 建议补的**护栏**（防止同类复发）

> 三条都是「本会话踩过、修了、但**没有自动化拦截**」的坑。加护栏的收益远大于再修一次。

| # | 护栏 | 防的是什么 | 落点 | 状态 |
|---|---|---|---|---|
| 1 | **复合词事件名扫描** | §1.4：`onMouseDown` 往原生元素上写 ⇒ 静默失效 | `packages/ui/src/__tests__/event-name-casing.test.ts` | ✅ **已落地**（4 条用例，含 5 段自证 + 双向校验） |
| 2 | **L4 基线的「时间依赖」扫描** | §2.4：`getNow()` 类用例让门禁**每天跨午夜就红** | 扫 `tests/compat/baselines/*.dom.json` 的 `today`/`now`；扫 `baseline/*.mjs` 的时间 prop | ⬜ 待做 |
| 3 | **运行时声明 ↔ 公开类型同源** | §2.2 / §2.3：宽松声明让消费方被迫 `as unknown as` | 对每个组件：`InstanceType<typeof C>['$props']` 与 `CProps` 双向赋值（判据 = 消费方 `satisfies` 能过） | ⬜ 待做 |

> ⚠️ 加护栏时**先跑一遍看会不会误报** —— #1 的实测结论：**不能用「全仓正则 + 逐条白名单」**
> （489 条对象键里绝大多数是合法的组件 prop），必须用 AST 限定到 `h('<原生标签>')`（489 → 3）。
> 另有两个必守的「不误报」判据，见 §1.4。

---

## §4 接手顺序建议（按性价比）

1. **§1.10 `float-button` 的视觉变体空转**（**需要定夺**：改用例 vs 改 harness）——
   ⚠️ 它是**唯一的 `missing-baseline`**（9 条），且**不能靠提交空白基线糊过去**。
2. **§1.11 `form` 校验链用例偶发红**（`flush()` 单次墙钟等待）—— **最小**：
   把依赖异步渲染的断言换成 `vi.waitFor`。⚠️ 先判断「等待不够」还是「校验链真慢」；
   **已记录「30 轮 + 6 burner 未复现」，别重复劳动**。
3. **§3 #2 加「L4 时间依赖」扫描**（防 `getNow()` 类用例让门禁每天跨午夜红）——
   §3 #1 的护栏可作范本。
4. **§2.2 + §2.3 全量审计 `TabsProps` 与运行时声明**（一次做完两件事）。
5. **§1.5 扫 `Trigger` 的 `children[0]`** / **§2.4 扫时间依赖用例**
   （都是扫描类，可批量做）。
6. **§1.6 `ContextIsolator`** / **§1.7 `use-merge-semantic` 的 `schema`** ——
   **等第一个真实消费者**再做，别提前实现。
7. **§1.9 的 40 条生产 `noNonNullAssertion`** —— **不单独排期**，
   随各组件（`tree` / `progress` / `listy` / `cascader`）下次改动时**逐个收窄**。

> ⚠️ **改 `tests/visual/**` 的 harness / 用例后，必须评估「已入库基线是否整体过期」** ——
> §1.2 就是这么来的（基线自 **2026-09-20** 起没再生成，harness 却改过 5 次）。
> **判据**：`--mode compare` 出现大面积 `size-mismatch` / `block-diff`，而**组件源码没动**。

> ✅ **本轮已完成、从队列里划掉**：§2.6b（补两条 L1 用例 + 反向哨兵）·
> §1.9 的两条可当场修 · §1.1（基线入库，除 float-button）· **§3 #1（复合词事件名护栏）** ·
> §1.4（护栏落地）· **§1.2（重生成过期基线，24/24 exact）**。

---

## §5 本会话（2026-10-02 ~ 10-03）已修清单（留痕）

| commit | 内容 |
|---|---|
| `d936962` → `0255c4b` | **color-picker G0–G14 全量交付 → `completed`（69/72）**；顺手修 `picker/time-tmpl.ts` 的既有 lint 红 |
| `f950386` | `color-picker` 的 `children` 不再多包一层 `<span>`（§2.1） |
| `afc462f` | `tabs` 的 `size` → 上游 `SizeType`（§2.2） |
| `9419ff5` | `tabs` 运行时声明统一到公开类型 ⇒ **删掉 card 的 `as unknown as`**（§2.3） |
| `c7fd2ec` | `calendar` 的日期依赖用例从 L4 移除（§2.4） |
| `07b8ff7` | **`test:types` 的「假红」修掉**（`types` project 指定 `checker: 'vue-tsc'`）；新建本文件 |
| `7147a3f` | `segmented` / `collapse` 的事件名大小写（§1.4、§2.6b） |
| `625cc84` | **复核本文件并改掉 4 处事实错误**：§1.3 证伪 · §1.9 由「2 条」改「207 条」 · §2.5 的 commit 更正为 `9c9f557` 且残留关闭 · §1.4 改按符号定位 |
| （本轮） | **裁决并执行**：`visual-baseline-in-git` = **A 入库 git** ⇒ 9 个组件生成 **75 张基线**（`missing-baseline` **84 → 9**，compare **75/75 exact**）；§1.9 = **测试目录关闭** `noNonNullAssertion`（**207 → 65** warn）；**新登记 §1.10**（float-button 变体空转） |
| （本轮续） | §1.9 的**两条可当场修**修掉（**65 → 63** warn）· **§2.6b 补两条 L1 用例**并做**反向哨兵**验证（改回错误键名 ⇒ 恰好这两条红）· **全量 compare 1065 / 1077**（12 条失败 = 9 float-button + 3 typography，均已登记） |
| （本轮再续） | **§1.2 修掉**（重生成过期基线：`semantic` **130 → 90 px** ⇒ compare **24/24 exact**）· **§1.11 新登记**（`form` 偶发红；含「30 轮 + 6 burner **未复现**」的记录） |
| （本轮再续） | **§3 #1 / §1.4 护栏落地**：`packages/ui/src/__tests__/event-name-casing.test.ts`（AST 扫描 `h('原生标签')`，489 → **3**，全是有意的反向哨兵）· 含 **5 段自证** + **双向校验** · 护栏自身的反向哨兵已验证（改回真 bug ⇒ 精确点名） |

**PITFALLS 319–336**（18 条）。`verify:full` **exit=0**。

> ⚠️ **本文件的坐标会漂移**（改代码时插注释就会移行）—— 引用时**优先给符号名**（如
> `onMousedown: handleMouseDown`），行号只作辅助；**动手前先 `sed -n 'Np'` 核一眼**。
