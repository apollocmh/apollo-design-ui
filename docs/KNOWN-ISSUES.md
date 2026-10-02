# KNOWN-ISSUES.md — 已发现的问题登记簿

> **这份文档是「欠账台账」，不是规范。** 规则本体在 `AGENTS.md` / `ARCHITECTURE.md` /
> `COMPATIBILITY.md` / `COMPONENT-RULES.md` / `TESTING.md` / `WORKFLOW.md`；
> 坑的全文在 `.workbuddy-ai/memory/PITFALLS.md`（那份**不进会话注入**，按需读）。
>
> **这里只放两类东西**（2026-10-03 起）：
>
> | 段 | 含义 | 什么时候来 |
> |---|---|---|
> | **§1 已发现、未修** | 已经**证实**存在的问题（有可复现证据），但本次没修 | 接手时先扫这一节 |
> | **§2 已修、但有残留** | 症状**已修**，但同一根因的**其它面**没覆盖 / 没审计 | 别把「已修」当成「已解决」 |
>
> **写法要求**（与 `PITFALLS.md` 同一条纪律）：每条必须给**可复现的判据**
> （命令 / 文件:行号 / 实测数字），不许写「疑似」「大概」。**没有证据的不进这份文档**。
>
> **维护**：修掉一条就把该条移到 `git log` 里（或标 ✅ 并写明 commit），**不要删了不留痕**。

---

## §1 已发现、未修（待排期）

### 1.1 🚨 L6 有 **84 条 `missing-baseline`** —— 9 个组件从未入库 React 基线

- **现象**：全量 `node tests/visual/run.mjs --mode compare` 报 84 条
  `[missing-baseline] 缺少 React 参考截图：tests/visual/baselines/react/<c>/<variant>__light__<viewport>.png`。
  涉及 `select` / `auto-complete` / `cascader` / `popconfirm` / `float-button` / `rate` /
  `segmented` / `steps` / `progress`。
- **证据**：2026-10-03 全量 compare 实测 —— `991 exact` + **84 `missing-baseline`** + 3 `size-mismatch`。
- **根因**：**未决开放决策 `visual-baseline-in-git`**（`node registry/tools/ask.mjs decision visual-baseline-in-git`）。
  这 9 个组件的 `visualStatus` 是 `done`，但基线没入库 ⇒ 只能 `--mode both`（两侧现渲染再互比）。
- **修法**：先裁决「基线是否入库」；若入库，对每个组件跑
  `node tests/visual/run.mjs --mode baseline --component <c>` 并提交 PNG。
- **需要谁**：**用户裁决**（开放决策）。
- ⚠️ `color-picker` **不在**这 9 个里（它的 27 张基线已入库，全量 compare 里 **27/27 exact**）。

### 1.2 ⚠️ `typography/semantic` 三个视口 `size-mismatch`（1.28% / 2.41% / 4.93%）

- **现象**：`node tests/visual/run.mjs --mode compare --component typography` ⇒
  `semantic__light__{mobile,tablet,desktop}` 三条 `block-diff`；差异率**与视口宽反比**
  （= 固定尺寸面，不是布局）。
- **已排除**：**不是本次改动引入的** —— `git log -- packages/ui/src/typography` 显示该目录
  最近一次改动是 `4acd68d`（C8-R2 插槽重构），**不在本会话的任何 commit 里**。
- **怀疑**：`semantic` 变体的基线**早于** `4acd68d` ⇒ 基线过期（与 PITFALLS 327 同族：
  「差异率逐位不变 / 与视口反比 ⇒ 先怀疑基线/产物，再怀疑实现」）。
- **修法**：① 先确认是**基线过期**还是**真差异** ——
  对 `semantic` 单独跑 `--mode baseline --component typography` 重生成基线再 compare；
  ② 若仍红，用 `tests/visual/debug/rect.mjs` / `styles.mjs` 逐属性定位（范本见
  `docs/analysis/calendar.md` 的「定位三步」）。
- **需要谁**：无（可直接做），但**属于 typography 的回归**，改动要单独过它的门禁。

### 1.3 ✅ **已修**（2026-10-03）`h()` 事件名大小写 —— **两处真 bug，静默失效**

> 本节保留记录：两处都已在同日修掉（`onMouseDown → onMousedown`、`onKeyDown → onKeydown`），
> 并更正了 `segmented/README.md` 的误诊。**留在这里是因为「同类是否还有」需要定期复扫**。

- **根因**：Vue 的 `parseName` 会对 `on` 之后的部分做 `hyphenate`
  ⇒ `onMouseDown` 解析成 **`mouse-down`**、`onKeyDown` 解析成 **`key-down`**
  （**永不触发、且不报错**，编译期与 `vue-tsc` 都无感）。
  **单段名不受影响**（`onClick` → `click` ✓），所以这个坑**只在复合词上出现**。
- **命中两处**（都是**原生元素**上的键，不是组件声明过的 prop）：
  1. `segmented/Segmented.ts:353` —— `h('label', { onMouseDown })`
     ⇒ 「mousedown 清除键盘态」**从未生效**；
  2. `collapse/Panel.ts:98` —— `collapsibleProps` 里的 `onKeyDown` 被 spread 到**原生 `<div>`**
     （header / 展开图标）⇒ **Enter 键展开/收起失效**（**a11y 键盘操作**）。
- **修后实测**：`segmented` + `collapse` 的 unit/a11y **87/87 通过**；DOM 类名不变 ⇒ L4/L6 无影响。
- **判据（复扫用）**：
  ```sh
  # 找「对象键」形态的复合词事件名（`: onXxxYyy`）
  # 逐个判断目标是【原生元素】(bug) 还是【声明过的组件 prop】(合法)
  ```
- ⚠️ **合法 ≠ 同类**：本仓有 ~10 处 `onKeyDown:` / `onMouseEnter:` 是**组件声明过的 prop**
  （`input/engine/Input.ts` / `notification/engine/Notice.ts` / `slider/Handles/*` 等）——
  Vue 按**名字**解析声明过的 prop，不经 `hyphenate` ⇒ **它们是对的**，别误改。
- 📌 详见 `PITFALLS.md` **323**（含反向哨兵用例）。

### 1.4 ⚠️ `Trigger` 的 `children[0]` 归一化对「数组」的处理，未做全仓扫描

- **现象**：`packages/ui/src/_internal/trigger.ts:606` 是
  `const first = Array.isArray(children) ? children[0] : children;` ——
  只认**元素 vnode**；拿到**数组/Fragment** 时会走「包一层 `<span>`」分支（D79）。
- **已知命中**：`color-picker` 的 `children` 通道（**已修**，见 §2.1）。
- **未做**：**没有扫过其它把插槽直接转交给 Trigger 的组件** —— 它们可能同样多包一层 `<span>`。
- **修法**：全仓扫「模板里 `<slot/>` 直接喂给 `Trigger`/`Popover`/`Tooltip` 默认插槽」的位置；
  有 L4 用例的组件可以直接看 `$/div[0]: 标签不同 <div> vs <span>`。
- **需要谁**：无。
- 📌 详见 `PITFALLS.md` **330**。

### 1.5 ⚠️ `ContextIsolator` 在本仓**不存在**（`color-picker` 目前靠「行为等价」绕过）

- **现象**：上游 `ColorPicker` 把面板包在 `<ContextIsolator form>` 里（屏蔽 Form 的 `status`）；
  本仓全仓无此物（最接近的 `NoCompactStyle` 只重置**紧凑**上下文）。
- **当前为什么没出事**：面板侧（`PanelPicker` / `ColorPresets` / 输入件）**没有任何子件读
  `useFormItemInputContext`** —— 只有 `ColorTrigger` 读，而它本来就在隔离器**外面**
  ⇒ 行为等价（登记 PLATFORM）。
- **风险**：**将来面板里只要出现一个读 form status 的子件，就会与上游分叉**（且不会有红灯）。
- **修法**：要么实现一个通用的 `ContextIsolator`，要么在 `ColorPicker.vue` 的面板处
  显式 `provide` 一个空的 form 上下文（并写一条 L1 断言钉住）。
- **需要谁**：无。

### 1.6 📌 `validate-registry.mjs` / `classify-date-picker-rules.mjs` 的 `suppressions/unused` 警告

- **现象**：`pnpm exec biome check .` 报 **2 条 warn 级诊断**（**不阻塞**，`Found 1 error` 那条
  已在本会话修掉 —— 是 fixture 的 JSON 格式）：
  1. `tests/visual/debug/classify-date-picker-rules.mjs:91:3` **`suppressions/unused`**
     —— 一条 `biome-ignore lint/style/useTemplate` 不再命中；
  2. `registry/tools/validate-registry.mjs:467:15` 的 **FIXABLE 建议**
     （`if (skip && skip.test(line))` → `skip?.test(line)`，属 `useSimplifiedLogicExpression` 一类）。
- **已排除**：**不是本会话引入的**（`classify-date-picker-rules.mjs` 本次未被触碰；
  `validate-registry.mjs` 只改了 `HARDCODED_PATTERNS` 的正则与注释）。
- **修法**：按 `PITFALLS.md` **2**（`biome-ignore` 必须紧贴诊断行）核对那两处的贴合关系。
- **需要谁**：无。

---

## §2 已修、但有残留（别把「已修」当成「已解决」）

### 2.1 ✅ `color-picker` 的 `children` 多包一层 `<span>` —— 只修了**单子节点**路径

- **已修**（commit `f950386`）：默认插槽改经**渲染函数宿主组件**（`ColorPicker.vue` 的
  `TriggerHost`）转交，摊平后取单元素 ⇒ `Trigger` 的 `children[0]` 拿到**元素**
  ⇒ 不再包 span。L4 的 `color-picker:children` **删掉 allow 后零差异**。
- **残留**：**传多个子节点**时仍会包 span —— `renderChildren` 在 `nodes.length > 1` 时
  原样返回数组。上游的 `children` 是**单个** `ReactNode`（无对应物）⇒ 这条**不构成分叉**，
  但也没有测试钉住它（当前**没有**「多子节点」的 L4 用例）。
- **继续做**：若认为需要，加一条 L4 用例 + `allow` 把「多子节点 ⇒ 包 span」写成**明确契约**。

### 2.2 ✅ `tabs` 的 `size` 类型 —— 只修了 `size`，**没有全量审计 `TabsProps` 的其它字段**

- **已修**（commit `afc462f`）：`size` 从 `'small' | 'default' | 'large'` 改成上游的 `SizeType`
  （`'default'` 不是 antd 的值、且缺 `'middle'`/`'medium'`）。同时修掉三处
  **「把 bug 写成规格」**：L3 负例、两份文档 API 表、`card/demo/tabs.vue`（改回上游原值 `'medium'`）。
- **残留**：**`TabsProps` 的其它字段没有逐一与 antd 对拍** —— 本次只处理了 card 报出的
  `size` 与回调三类（§2.3）。**建议**：按 `registry/source/antd-6.6.4.raw.json` 做一次
  「prop 名 × 类型」的全量 diff。
- **继续做**：写一个脚本对比 `TabsProps` 与 antd `es/tabs/index.d.ts` 的字段集与类型。

### 2.3 ✅ `tabs` 运行时声明 vs 公开 `TabsProps` —— 只统一了 **card 用到的字段**

- **已修**（commit `9419ff5`）：运行时声明一律改用**公开类型**
  （`TabsProps['renderTabBar'|'locale'|'more'|'classNames'|'styles']`），三个事件的 emits
  载荷从 `unknown` 换成 `TabsEditEvent` / `TabsEditAction` / 方向联合。
  **✅ 自证**：把 card 的 `as unknown as TabsRuntimeProps` 换成 `satisfies` ⇒ `lint:types` 0 错。
- **残留**：**其余字段（`animated` / `indicator` / `tabBarExtraContent` / `getPopupContainer` …
  ~20 个）没有逐一核对「运行时声明是否与公开类型同源」** —— 它们目前**没有消费方**在转发，
  所以没有暴露；一旦有第二个薄壳组件转发 `TabsProps`，就会撞上同一堵墙。
- **继续做**：`grep -n "PropType<" packages/ui/src/tabs/Tabs.vue` 逐条核对是否都引用了公开类型。
- 📌 判据见 `PITFALLS.md` **333**（消费方能用 `satisfies` 通过 = 同源）。

### 2.4 ✅ `calendar` 的日期依赖 flake —— 只移除了那**一条**用例，未做全仓扫描

- **已修**（commit `c7fd2ec`）：`calendar:no-value`（不传值 ⇒ 上游取 `getNow()`）的产物
  **随运行日变化** ⇒ 从 L4 移除（生成器 + 消费侧同步，两处写明原因）；
  行为仍由 `calendar/__tests__/index.test.ts` 的**语义断言**覆盖。`calendar` L4 **27/27**。
- **残留**：**没有扫过其它组件的 L4 基线里是否也有「随运行日 / 运行时刻变化」的用例** ——
  判据是基线产物里出现 `getNow()` / `Date.now()` / `new Date()` / `Math.random()` 的痕迹
  （如 `-today` / `-now` / 相对时间文案）。
- **继续做**：对 `tests/compat/baseline/*.mjs` 做一次「是否传了时间相关 prop」的扫描；
  对已入库的 `tests/compat/baselines/*.dom.json` 搜 `today` / `now` 类类名。
- 📌 判据见 `PITFALLS.md` **334**。

### 2.5 ✅ `utils.Color` 的字段 `private → public`（L0 变更）—— 只改了**已发现**的成员

- **已修**（commit `1bd30e7`）：为绕过 Vue 的 `UnwrapRef`（**映射类型**会丢掉 `private` 成员），
  把 `packages/utils/src/color/color.ts` 的 **7 个缓存字段 + `getMax` / `getMin`** 改成
  `public` + `/** @internal */`。**`utils` 已单独重建**。
- **残留**：**没有审计 `utils` 里是否还有别的「带 private 成员的值对象」** ——
  凡是会被放进 `ref()` / 组件 prop / 模板的类型，都会踩同一个坑。
- **继续做**：`grep -n "private " packages/utils/src/**/*.ts` 逐个判断是否属于「值对象」。
- 📌 判据见 `PITFALLS.md` **325**（三个触发点：`ref()` / 模板 unwrap / `props`）。

### 2.6 ✅ `picker/time-tmpl.ts` 的 `useIndexOf` —— 按 biome 建议改了，**未单独跑 picker 的测试**

- **已修**（commit `0255c4b`）：`liDistList.findIndex((dist) => dist === minDist)` →
  `liDistList.indexOf(minDist)`（**语义等价**：都是严格相等，`NaN` 时都返回 -1）。
  这是**master 上既有的** lint 错误，会让 `verify:full` 的 `lint:format` 直接红。
- ✅ **残留已关闭**（2026-10-03 同日补跑）：
  `pnpm exec vitest run --project unit packages/picker` ⇒ **308 / 308 通过**。
  该改动是语义等价的，picker 侧无回归。

### 2.6b ⚠️ `Switch.ts` 从 `attrs` 剥掉了 `onKeyDown` / `onClick` 但**未见再次使用**

- **现象**：`packages/ui/src/switch/Switch.ts:210` 解构出 `onKeyDown: _onKeyDown` / `onClick: _onClick`
  并放进 `...restAttrs` 的**排除项**，但 `grep -n "_onKeyDown" packages/ui/src/switch/Switch.ts`
  **只有这一处** ⇒ 这两个 handler **被静默丢弃**（父组件传的 `onKeyDown`/`onClick` 不生效）。
- **为什么**：注释写的是「被 rc-switch 消费的三个事件」—— 但**本仓的实现里没看到消费点**。
- **判定**：**待核**（不是已确认的 bug）：若 `Switch` 通过 `emits: ['click']` 收 `onClick`，
  那它走的是 `props.onClick` 而不是 `attrs`，剥 attrs 不会影响它；`onKeyDown` 则**没有对应的 emit**。
- **修法（若确认是 bug）**：把 `_onKeyDown` 显式绑到根 `<button>`（键名用 `onKeydown`，见 §1.3）。
- **需要谁**：无（但要跑 switch 的 L1/L4 确认）。

### 2.7 ✅ `color-picker` 的 L4 只覆盖**触发器** —— 面板的 DOM 契约只在 L6

- **不是缺陷，是**有意分工**：面板在 `Popover` 的 Portal 里，**SSR 不渲染**
  （上游告警 `Portal only work in client side…`）；`PurePanel` 在 SSR 下**也不渲染面板**
  （`open` 由 `useEffect` 置真，SSR 不跑 effect）⇒ 面板的 DOM 拿不到。
- **已做**：`tests/compat/baseline/color-picker.mjs` 里留了 `open-no-portal` 用例作为
  **事实哨兵**；面板由 L6（真浏览器）承担 —— **27/27 exact**。
- **残留**：**面板的 DOM 结构没有任何「与 antd 逐条对拍」的自动化** ——
  只有像素级（L6）。若将来面板 DOM 出现「像素相同但结构不同」的漂移，**不会红**。
- **继续做**（若认为值得）：在 L6 的用例里加 DOM 断言（`tests/visual` 有 `dump.mjs`），
  或做一个「真浏览器里 dump 面板 DOM 再与 antd 对拍」的探针。

---

## 附：本登记簿的「证据来源」速查

| 想验证 | 命令 |
|---|---|
| 全量 L6 现状（含 missing-baseline） | `CODEBUDDY_SAFE_DELETE_ENABLED=0 node tests/visual/run.mjs --mode compare` |
| 单组件 L6 | `... --mode compare --component <c>` |
| 重新生成某组件基线 | `... --mode baseline --component <c>` |
| 基线重复自检 | `... --check-baselines` |
| L4 全量 | `pnpm run test:dom` |
| 类型测试（**已修为 `vue-tsc`**） | `pnpm run test:types` |
| 四道门禁 | `pnpm run verify:full` |
| 开放决策原文 | `node registry/tools/ask.mjs decision <id>` |

> ⚠️ **跑视觉 / 构建门禁的入口都要带 `CODEBUDDY_SAFE_DELETE_ENABLED=0`**
> （`tests/visual/run.mjs` / `tests/build/run.mjs` / `pnpm build:ui`）——
> 漏了会在打包阶段被 safe-delete 拦下（阈值 50），报 `SAFE_DELETE_BULK_CONFIRM_REQUIRED`。
