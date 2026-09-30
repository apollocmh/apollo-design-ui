# DatePicker · 开发计划（G0–G14）

> 由 gen-component.mjs 生成。每次开工先过一遍「开工避坑清单」，Gate 完成一个勾一个。

## 状态

- registry status: **analyzing** · priority P5 · complexity XL
- 依赖组件: 无
- foundation: @apollo-design/icons, @apollo-design/locale, @apollo-design/overlay, @apollo-design/picker, @apollo-design/portal, @apollo-design/position, @apollo-design/theme, @apollo-design/utils
- antd 规模: 3675 行 / 172 文件 · token 3

## Gate 检查单

- [x] G0 CLAIM —— 由 `next-task.mjs` 授权开工（foundation 13/13 之后的下一个；8 个依赖包全部 completed）
- [x] G1 ANALYZE —— `docs/analysis/date-picker.md`（14 节，全部来自实测）。新增探针 `tests/visual/debug/dump-datepicker-antd.mjs`（23 用例 SSR dump）
- [x] G2 API DESIGN —— `interface.ts`（props/emits/slots/expose/子入口全量枚举；v-model 与语义事件按 **C11 双发**）。见下方「G2 的三条关键判据」
- [x] G3 TOKEN —— `style/token.ts` 对齐 antd ComponentToken。**实测口径（可复现）**：
      `node tests/visual/debug/extract-date-picker-css.mjs --tokens` ⇒
      `prepareComponentToken` 返回 **45 键**（18 input + 21 panel + 3 arrow + 3 自有）、
      落成 **44 个 CSS 变量**（减 `INTERNAL_FIXED_ITEM_MARGIN`）、产物里实见 **45 个**
      `--ant-date-picker-*`（44 + 规则内声明的 `affixColor`）；另有 `initPickerPanelToken` 的
      **10 个内部 token**。主题测试 **22 条**（`__tests__/theme.test.ts`）
- [ ] G4 IMPLEMENT —— 分 S1–S5 五阶段（见下方「G4 的架构分叉」）
      - [x] S1 值 / 开合 / 面板接线 —— **功能面完成**（`DatePicker.vue` + 7 个 hooks +
        4 个组件模块；测试 **64 条**全绿）。`needConfirm` 默认值与 zIndex 已收口。
      - [x] S1 剩余：**样式** —— `style/index.ts`（**257 条规则** + `genTokenDecls` 的
        **45 条**声明 + `genDatePickerStyle`），B7 **双向**比对 8 条用例。
      - [ ] S1 值 / 开合 / 面板接线 —— **进行中**。已落地（可验证部分，**40/40 通过**）：
        - `hooks/{picker-types,picker-locale,picker-value,picker-format,picker-suffix}.ts`
        - `components/picker-shared.ts` —— 组件层共用纯归一（`isRenderable` / `getInputSize` /
          `toDisabledPair` / `isPairDisabled` / `getMergedPickerStatus` / 两个 `showClear`）
        - `components/Selector.ts` —— 单值 / 范围共用的输入框选择器，DOM 逐字对齐 SSR 实测
        - `components/root-class.ts` —— 根类名组装（顺序对齐上游 `clsx` 参数序）
        - `components/trigger-config.ts` —— `BUILT_IN_PLACEMENTS`（4 落点 × points/offset/overflow）
          + `getRealPlacement` + `getDropdownClassName` + `getTransitionName`
        - `__tests__/picker-pure.test.ts` —— **40 条**
        ⏳ 未完成：`.vue` 壳（开合接线 / Trigger / PickerPanel 挂载）、L2 交互用例。
        ⚠️ 状态类名**复用**既有 `space/statusUtils.ts`（不重复实现）；
        status 合并按**上游 `||`** 实现为 `getMergedPickerStatus`（见 README §5 的既有不一致）。
      - [ ] S2 键入解析与 `format` 的函数 / 数组形态（含跨包欠账：`PickerFormat` 加泛型）
      - [ ] S3 掩码模式（`format.type: "mask"`）
      - [ ] S4 键盘字段导航与分段（`-input-active`）
      - [ ] S5 `multiple` + `tagRender` / `maxTagCount`、范围两端切换
- [ ] G5 L1 单元 + G6 L2 交互 —— __tests__/index.test.ts
- [x] G7 L3 类型 —— `__tests__/type.test-d.ts`，**42 条**（运行时 42 + 类型检查 42）。
      覆盖：值域 / `SingleValue` 与 `RangeValue` 的 `null` vs `undefined` / `format` 四写法 /
      语义槽 **4 平铺 + 7 嵌套**（且 `popup` **允许 string**，与 tabs 相反）/ emits 载荷
      （`calendarChange` 三参、`keydown` 两参）/ 两个 expose 的 `focus` 签名差异 /
      单值与范围的差异面（`showTime` / `presets` / `placeholder` / `disabled` / `separator`）/
      **8 条负例**（`'datetime'` 不是 `picker`/`mode`、`status` 只有两档、单值不接受元组 …）
- [x] G8 L5 a11y —— `__tests__/a11y.test.ts`，**24 条**（7 条 role/ARIA 契约 + 17 组 axe 扫描），
      **零 axe violation、零豁免**。判据：根无 role · `input[aria-invalid="false"]`
      （🚨 `status=error` 也**不改**）· 清除按钮 `aria-label` 取 **`locale.clear`**（en_US 是 `Clear`）·
      后缀图标 `role=img` + `aria-label=calendar` + `aria-hidden=true` · `disabled` 时不渲染清除按钮。
      ⚠️ 范围版（含上游两条专门的 **separator a11y 测试**：默认带 `aria-hidden`、自定义**去掉**它）
      留到 **S5**；浮层内（面板）的 role/ARIA 由 `@apollo-design/picker` 的 L5 负责。
- [ ] G9 L6 视觉 —— **未开始**。方案与前置发现见下节「G9 L6 的落地方案」。
- [x] G10 L4 DOM 契约 —— `tests/compat/baseline/date-picker.mjs` +
      `baselines/date-picker.dom.json`（**16 用例**，单值）+ `semantic.test.ts` **17 条**
      （16 契约 + 1 覆盖检查），**零豁免**（`allow: {}`）。
      ⚠️ 只覆盖**触发元素**（与 cascader 同判）：SSR 下浮层走 Portal 不渲染 ⇒
      面板侧的结构契约由 `@apollo-design/picker` 的 L4 负责，不在两层各钉一份。
      ⚠️ 范围版留到 **S5**（`RangePicker.vue` 同批落地，届时补 5 个 range 用例）。
- [ ] G11 DOCS —— demo 与 antd 一一对应（demo.test.ts 的 expectCount 钉死数量）
- [ ] G12 REGISTRY —— 11 维度置 done（唯一让进度被承认的方式）
- [ ] G13 BUILD —— pnpm run registry:check && lint && test && test:build 四道全绿
- [ ] G14 COMMIT —— commit message 带 [COMP:date-picker]

## G2 的三条关键判据（写 interface.ts 时定的，G4 必须遵守）

1. **所有 antd prop 都要声明，一个都不能少** —— 未声明的会被 Vue 归进 `attrs`，
   而 rc 那套「解构 + `...restProps`」的取值方式在 Vue 里取不到 ⇒ **静默失效**
   （PITFALLS 跨包判据 1；`picker` 面板流已经踩过一次，见分析文档 §11.1）。
2. **单值与范围的事件载荷形状是分开定的** —— `value` / `onChange` / `onCalendarChange` /
   `onOk` / `mode` / `presets` / `id` / `placeholder` / `disabled` **形状都不同**
   （范围全是「数组化」或「两端元组」）⇒ 共用部分放 `PickerCommonProps`，
   差异**下沉到各自的 interface**，不要用联合糊过去。
3. **函数 prop 一律配同名 scoped slot**（C8 双通道）—— 见 `DatePickerSlots`。
   另：`CellRender` 的第一个参数是上游的 `CurrentType` **联合**
   （`DateType | number | string`，时间列传数字、上下午列传 'am' / 'pm'），
   **不要收窄成 `DatePickerDate`**。

## G4 的架构分叉 —— 已裁决 = A（完整对齐，分阶段落地）

rc 的 `lib/PickerInput` 是 **37 个 `.js` / 4290 行**且**绑 React**（`useState` + `useEvent`），
而 `picker` foundation **只 Vue 化了面板**（裁决 `picker-panel-ownership` = B）。
⇒ 输入框的**解析 / 掩码 / 键盘字段导航 / 分段（`-input-active`）** 要自研。两条路：

| 选项 | 内容 | 代价 |
|---|---|---|
| **A. 完整重写** | 逐块对齐 `PickerInput`；`inputReadOnly` / `preserveInvalidOnBlur` / `previewValue` / 掩码模式 / 键入解析 全部落地 | 最大；但 11 维度可全 `done`、无缺口 |
| **B. 核心 + 明确缺口** | 值 / 开合 / 面板 / 格式化 / 约束 / 状态 / 语义槽 全落地；键入解析与掩码标 `DEFERRED`（`layerNotes` + README §5 登记） | 有缺口，但缺口**可枚举、可测** |

**用户裁决（2026-09-30）= A。** 登记在 `registry/source/open-decisions.mjs` 的
`date-picker-input-kernel`，裁决原文可 `node registry/tools/ask.mjs decision date-picker-input-kernel`。

⇒ G4 **必须**实现（裁决原文里的 ①–⑥）：值/开合/面板接线、键入解析与 `format` 的
函数/数组形态、掩码模式、键盘字段导航与分段、`inputReadOnly` / `preserveInvalidOnBlur` /
`previewValue` / `order` / `needConfirm` / `maxTagCount` / `tagRender` / `multiple`；
**⑥ 不得以「先跳过、回头补」的方式落 `DEFERRED`**。

**分阶段落地顺序**（每阶段自成绿灯，便于中途取证）：

| 阶段 | 内容 | 依赖 |
|---|---|---|
| S1 | 值 / 开合 / 面板接线 —— 受控 + 非受控、多个 v-model 的 C11 双发、`PickerPanel` 挂载 | G3 之后即可 |
| S2 | 键入解析与 `format` 的函数 / 数组形态（**含跨包欠账**：`PickerFormat` 加回泛型 + `CustomFormat`） | S1 |
| S3 | 掩码模式（`format.type: "mask"`） | S2 |
| S4 | 键盘字段导航与分段（`-input-active`） | S2 |
| S5 | `multiple` + `tagRender` / `maxTagCount`、范围的两端切换 | S4 |

## S1 的验证缺口 —— **已闭合**（2026-09-30 环境恢复后补跑）

2026-09-30 本机 `jsdom` 的加载一度退化到 **2 分 51 秒**（墙钟 / CPU 仅 1.34s ⇒ I/O 阻塞；
二次加载同样慢 ⇒ 不是 page cache），导致 **jsdom 的 vitest worker 一律 60s 超时**
（PITFALLS 221）。当时的绕行是给纯函数用例加 `// @vitest-environment node`，
代价是 `vitest.setup.ts` 的两处 DOM 依赖要加存在性护栏。

**环境恢复后已补跑，缺口全部闭合：**

| 项 | 结果 |
|---|---|
| `picker-pure.test.ts`（`--project unit`，`@vitest-environment node`） | ✅ **40 passed** |
| 根 `vue-tsc --noEmit -p tsconfig.json` | ✅ **0 error**（2m7s） |
| `biome check .` | ✅ **error 0** |
| **jsdom 回归**：`tag/__tests__/index.test.ts` + `space/__tests__` | ✅ **3 files / 166 tests passed** |

⇒ `vitest.setup.ts` 的两处护栏（`Element.prototype.scrollTo` 与 `afterEach` 的
`document.body`，都加了 `globalThis.X !== undefined`）**对 jsdom 用例无破坏**，
166 条既有测试全绿。**PITFALLS 222 里记的「无法验证」已解除。**

⚠️ 仍**未**验证的：`.vue` 壳（尚未落地）⇒ L2 / L4 / L5 / theme 与视觉基线都还没有对象。
## G4 的样式 —— **已落地**（257 条规则 / 45 条 token 声明）

`node tests/visual/debug/extract-date-picker-css.mjs --emit-static` ⇒ **257 条规则 / 52.8 KB**。

**关键突破**：SSR 下浮层走 Portal ⇒ 面板规则**不进 cache**（实测 `open: true` 的 SSR 只有
889 B，与不传 `open` 字节相同）。解法与 `extract-cascader-css.mjs` 同路 ——
**直渲 `PurePanel`**（`DatePicker._InternalPanelDoNotUseOrYouWillBeFired` 与
`_InternalRangePanelDoNotUseOrYouWillBeFired`）跳过输入框与浮层、只出面板。

⚠️ 两个坑（本轮实测）：

1. **两个面板出口的名字不同**，且**都在 `DatePicker` 上**（不在 `RangePicker` 上）——
   范围版是 `_InternalRangePanelDoNotUseOrYouWillBeFired`（中间有 `Range`）。
   写成 `RangePicker._InternalPanelDoNotUseOrYouWillBeFired` 会拿到 `undefined`，
   报「Element type is invalid … but got: undefined」。
2. **`ant-picker` 前缀被 date-picker 与 time-picker 共用** ⇒ 产物含 time-picker 的规则。
   那是**对的**（同一组件族），但移植时要知道。

**移植清单**（照 tabs / form / slider / pagination 的同一套）—— ✅ 已全部完成：

1. `style/index.ts`：`genTokenDecls(rootPrefixCls)` 产出 **45 条**声明
   （值来自 `datePickerTokenValues()`）+ 257 条规则（去 `:where()` 作用域壳、`.ant-` → `.apollo-`）。
2. B7 校验：规则里引用的**其它变量**（`--apollo-color-*` 等）必须在 theme 的 tokens.css 声明。
3. 断言规则条数（257）与 token 条数（45），防止静默漂移。

🚨 **落地时抓到并修正两个静默 bug**（详见 PITFALLS 228 / 229）：

1. **驼峰转 kebab 写错**：`/[A-Z]/g` 会给每个大写插连字符 ⇒ `paddingBlockSM` 变成
   `padding-block-s-m`（规则引用的是 `-sm`）⇒ **8 个变量名拼错、静默回退**。
   修成 `/([a-z0-9])([A-Z])/g`。
2. **`INTERNAL_FIXED_ITEM_MARGIN` 其实落变量**（G3 的结论错了）：产物里是
   `--ant-date-picker-internal_fixed_item_margin: 2px`（名字**带下划线**、值**补了 px**），
   且被 multiple 规则引用。漏掉它是因为探针正则的字符类不含下划线。
   ⇒ `genTokenDecls` **不排除任何键**（45 条）；变量总数 **46**。

⇒ **B7 必须是双向的**（声明 ↔ 引用）：单向往检查会把两边都当「自有」放过，
抓不到上面第 1 条。已落成 `theme.test.ts` 的 8 条用例（含反向哨兵）。

## ✅ 已收口的 Gate

| Gate | 状态 | 证据 |
|---|---|---|
| G0–G2 | ✅ | `docs/analysis/date-picker.md` + `interface.ts` |
| G3 TOKEN | ✅ | `style/token.ts` 45 键 + theme 22 条 |
| G4 S1（功能 + 样式） | ✅ | `DatePicker.vue` + 257 条规则 + 45 条声明 |
| G5/G6 L1+L2（S1 范围） | ⏳ 部分 | `picker-pure` 51 条 + `s1-smoke` 10 条 |
| G7 L3 | ✅ | `type.test-d.ts` 42 条 |

## ⚠️ `--project types` 的既有 SFC 解析噪音（对照实验确认，非本包引入）

`vitest run --project types` 会报 **55 条** `Unhandled Source Error`
（`Cannot find module '../button/Button.vue'` 等），并让**退出码为 1**。

**对照实验**（2026-09-30）：

| 跑什么 | 结果 | unhandled 数 | 含 date-picker 的 |
|---|---|---|---|
| `date-picker/__tests__/type.test-d.ts` | **84 passed** / exit 1 | **55** | **0** |
| `tabs/__tests__/type.test-d.ts`（对照） | **36 passed** / exit 1 | **55** | 0 |

⇒ 数量完全相同 ⇒ 是**既有的** SFC 解析噪音（PITFALLS 73），与本组件无关。
**判读门禁时看「Tests passed」与「含本包的错误数」，不要只看退出码。**

## G9 L6 的落地方案（含前置发现，尚未开始）

### 用例文件（照 `cascader` 的两侧配对写法）

| 文件 | 内容 |
|---|---|
| `tests/visual/render/cases/vue/date-picker.js` | Vue 侧（`@apollo-design/ui`） |
| `tests/visual/render/cases/react/date-picker.jsx` | React 侧（antd 6.6.4），**逐条对应** |

### 🚨 浮层怎么办 —— 与 cascader 同一套解法

浮层走 Portal ⇒ 渲染到 `document.body`，**不在用例的截图区域内**。
`cascader.jsx` 的解法是「用 `Cascader.Panel` **直接渲染面板**」（不打开浮层）。
本组件的对应物是：

| 侧 | 组件 | 出处 |
|---|---|---|
| React | `DatePicker._InternalPanelDoNotUseOrYouWillBeFired` | antd 的 PurePanel（**名字带「别用」⇒ 保留原名**） |
| Vue | `PickerPanel` | `@apollo-design/picker`（裁决 `picker-panel-ownership` = B） |

⚠️ **前置发现（2026-09-30）**：`PickerPanel` **不在 `packages/ui/src/index.ts` 的导出面里**。
⇒ 视觉用例要么从 `@apollo-design/picker` 直接 import（需确认 `tests/visual` 的构建能解析它），
要么把 `PickerPanel` 从 ui 再导出一次（**那是对外 API 面的变更，要先确认是否该导**）。
**下一轮开工第一件事就是定这一条。**

⚠️ 另一条已记录的坑（`cascader.jsx` 的注释）：**不要用 `_Internal*Panel*` 当作「面板」的
React 侧对照** —— 它是 `genPurePanel(Component)`（**完整外壳 + 浮层塞进 holder div**），
与 Vue 侧的裸面板不是同一个东西，会比出结构性差异。
**但 date-picker 的情况相反**：我们**没有**一个「只有面板」的 antd 公开出口，
`_InternalPanelDoNotUseOrYouWillBeFired` 就是唯一选择 ⇒ 要逐条核对它的 DOM 是否与
`PickerPanel` 同构（这是 L6 第一轮的主要风险）。

### 字体必须钉具体值

date-picker 的**触发器**在 antd 里有 `font-family`（`input` 族），但**面板**是 `resetFont: false`
⇒ 靠继承。照 `cascader.js` 的做法在用例内钉 `CONTEXT_FONT`，**不动全局 BASE_CSS**
（裁决见 `docs/COMPONENT-CHECKLIST.md` 第 15 条 / COMPATIBILITY.md D114）。

### 预期用例（~15 个 × 3 viewport）

触发器：basic / value / size-small / size-large / variant-filled / variant-borderless /
variant-underlined / status-error / status-warning / disabled / allow-clear-false / prefix。
面板：date / time / datetime（`showTime`）/ month / year / multiple。

⚠️ 比对不过时**先怀疑实现**（PITFALLS 170 / D94：`style` 里的裸数字被 Vue 静默丢弃、
以及 `toCssSize()` 漏用）—— tabs 的第一次 L6 就是「指示条数值没带单位」差 0.03%~0.12%。

## 开工避坑清单（全部真实踩过，详见 .workbuddy-ai/memory/PITFALLS.md）

1. **内联 style 的数字必须转 px 字符串** —— Vue patchStyle 不做转换（React 才有），裸数字被静默丢弃。
2. **L3 负例必须包在永不调用的闭包里** —— *.test-d.ts 会被 vitest 真执行。
3. **vitest 必须从仓库根跑** —— 在 packages/<x>/ 下跑不应用根 config，大面积假失败。
4. **demo 显式指定字体** —— 继承字体差异是平台差异，会让 L6 全红。
5. **Boolean prop 未传 ≠ false** —— withDefaults 里给 undefined，否则布尔语义静默失效。
6. **cssinjs 嵌套语义**：`&` 是复合选择器、普通键是后代 —— 搞反会让样式作用到所有形态。
7. **var(--apollo-*) 必须在 theme tokens.css 有声明** —— 写错不报错，由 test:build B7 兜底。
8. **凡是要断言「某决策/约定是这样」先跑 node registry/tools/ask.mjs**，不凭记忆。
9. **跑重型门禁前关 IDE** —— 实测 16 分钟 → 7 分 49 秒。
10. **改完文件回读** —— Edit 偶发报 success 但内容未变；biome 会重排 import。
