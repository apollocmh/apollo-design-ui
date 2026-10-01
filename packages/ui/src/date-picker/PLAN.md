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
      - [x] S2 键入解析 + **提交时机** —— **全部落地**（2026-10-01）：
        - ✅ 纯函数：`hooks/picker-typing.ts`（`parseTextWithFormat` / `validateFormat`）
        - ✅ **默认 `format` 的补齐层** —— `hooks/picker-filled.ts`：
          上游 `useFilledProps.js:72-76` 的 `locale` 补齐 + `showTime` 归一。
          **根因更正**：不是「缺 `showTime` 推导」，而是缺 **rc `useLocale` → `fillLocale`
          的硬编码兜底**（`fieldDateFormat || 'YYYY-MM-DD'` 等 11 个键）——
          本仓与 antd 的语言包**都没有**这些键（实测）。
        - ✅ **`format` 的函数形态** —— `mergeFormat` 的 `.map` 补上
          `typeof c === 'function'` 那一支；`getFormatLength` 处理 `input[size]` 的求值。
        - ✅ 解析接线：`invalid` 状态 + `onInput` + `Selector` 的 `aria-invalid` / `-invalid`
        - ✅ **提交时机** —— `hooks/picker-value-change.ts`（上游 `useRangeValueChange.js`
          **405 行**的逐字移植：7 种 action × 10 种 source 的 `resolveAction` +
          统一执行的 `triggerChange` + 三份簿记）。`DatePicker.vue` 按
          `SinglePicker.js` 接线：键入 / Tab / Esc / 焦点 / 清除 / 关浮层 / 面板点选。
        - ✅ 用例：`picker-value-change.test.ts` **36 条**（L1，node）+
          `s2-commit.test.ts` **12 条**（L2，jsdom）
      - [x] S3 掩码模式（`format.type: "mask"`）—— **已落地**（2026-10-01）：
        `components/mask-format.ts`（上游 `MaskFormat.js` 81 行，工厂 + 接口形态）+
        `components/mask-input.ts`（上游 `Input.js` 的 `format` 分支）+ `Selector` 转接。
        用例：`mask-format.test.ts` **18 条**（L1，node）+ `s3-mask.test.ts` **11 条**（L2，jsdom）。
      - [~] S4 键盘字段导航与分段（`-input-active`）—— **单值可达的部分已落地**（2026-10-01）：
        - ✅ 调度（`field-switch` 分支 + `forceFocus`）随 S2 落地；
        - ✅ **`-focused` 根类名** + `focus`/`blur` 事件 + **确认离开才关浮层**
          （上游 `useFocusEvents.js` 55 行）；用例 `s4-focus.test.ts` **5 条**。
        - ⏳ **范围专属**、本仓尚不可达的两项（随 S5 的 RangePicker 一起做）：
          - **`-input-active`**：上游 `Input.js` 的 `active = activeIndex === index`，
            而 `SinglePicker` **不传** `activeIndex` 给 `SingleSelector` ⇒ **单值恒不加**
            （所以「分段高亮」本质是范围特性）；
          - **`useFocusLock` 的强切换聚焦**：`forceFocus` 在单值下**恒为 `false`**
            （`submitField` 一定 `allFieldsTriggered` ⇒ `reset()` 把它抹掉）。
      - [~] S5 `multiple` + `tagRender` / `maxTagCount`、范围两端切换、`presets` / footer ——
        **已落地一部分**（2026-10-01）：
        - ✅ **面板粒度的受控化 + 「打开即重置」**（README §5.5(d) 的收口）：
          `panelProps.mode` 改传 `mergedMode`（上游 `SinglePicker.js:366`），
          并在 `mergedOpen` 变真时把粒度重置回 `picker`
          （上游 `:451-456` 的 `Reset for every active`，`triggerEvent = false` ⇒ 不发事件）。
          用例 `s5-mode.test.ts` **5 条**。
        - ✅ **`multiple`**（2026-10-01 同日）—— 值侧本就就绪（`valueTexts` 的数组分支、
          `onChange` 的 `multiple` 分支、`onSelect` 的 `toggleDates`），本轮补齐
          **选择器渲染**：`Selector.renderMultiple`（上游 `MultipleDates.js` 77 行）+
          `renderMultipleInput` + `-multiple` 根类名 + `onMultipleRemove`。
          🚨 前置欠账**已还**：`_internal/overflow.ts` 补了 **`renderItem`**
          （rc 的非 raw 路径；此前只有 `renderRawItem`）—— menu 全层回归 **110 passed** 无变化。
          用例 `s5-multiple.test.ts` **9 条**。
        - ⏳ **范围两端（`RangePicker`）**：要新开 `RangePicker.vue` + 范围的 Selector
          （`-input-start` / `-input-end` / `-range-separator` / `-active-bar`）
          + `fieldCount = 2` 的状态机接线（调度已在，S4 的 `-input-active` /
          `useFocusLock` 也归这一批）。
        - ⏳ **`presets` / footer**：上游在 **Popup 层**（`PickerInput/Popup/PresetPanel.js`
          + `Footer.js`），本仓的 `panelVNode` 只渲染面板 ⇒ 要先有一个「浮层内容容器」
          组件。`showNow` / `showToday` / `renderExtraFooter` / `panelRender` 同批。
- [x] G5 L1 单元 + G6 L2 交互 —— `__tests__/index.test.ts`（**上游 testCases 的镜像**）。
      覆盖：locale 三态（prop / 默认 / 深合并）· `disabledDate` · `showTime` 的
      **列数与项数**（8 条上游用例合并成一张表 + `{}` 空参 + 12/24 小时）·
      `format` 的函数 / 数组 / `kk:mm` · `multiple` 的 `tagRender` 自定义删除 ·
      `suffixIcon` 五态 + ConfigProvider 优先序 · `allowClear` 四态 + `clearIcon` 优先序 +
      `onClear` · **legacy prop 的告警与落点**（`dropdownClassName` / `popupClassName` /
      `popupStyle` / `bordered` / `onSelect` + 一条「不传则无告警」的反向哨兵）。
      ⚠️ **未移植清单与逐条理由写在文件头**（`generatePicker` / 范围版 / `focusTest` /
      affix token 的 CSS 计算值 / 快照）。
      🚨 移植过程中抓到并修掉两个**真缺口**：**废弃告警一条都没有**（→ PITFALLS 246）+
      **`popupStyle` 算出来却从没绑到 `Trigger`**（→ PITFALLS 247）。
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
- [~] G9 L6 视觉 —— **已跑通、抓到并修掉三个真 bug**，但**尚未全绿**（详见下节）。
      当前：**12 / 21 exact**（`month` / `year` / `multiple` / `variants` 全 **0.000%**），
      其余 9 组 **0.22%~0.83%**（block-diff）。
      🚨 首轮 18 组是 0.42%~3.51%（**面板铺满容器**）⇒ 修掉 `-css-var` 漏挂后降到 0.12%~0.57%；
      二轮修掉「表头图标」「缺 `-panel-container`」「`popup.root` 新 API 死」后 → **12/21 exact**。
- [x] G10 L4 DOM 契约 —— `tests/compat/baseline/date-picker.mjs` +
      `baselines/date-picker.dom.json`（**16 用例**，单值）+ `semantic.test.ts` **17 条**
      （16 契约 + 1 覆盖检查），**零豁免**（`allow: {}`）。
      ⚠️ 只覆盖**触发元素**（与 cascader 同判）：SSR 下浮层走 Portal 不渲染 ⇒
      面板侧的结构契约由 `@apollo-design/picker` 的 L4 负责，不在两层各钉一份。
      ⚠️ 范围版留到 **S5**（`RangePicker.vue` 同批落地，届时补 5 个 range 用例）。
- [x] G11 DOCS —— `index.zh-CN.md` / `index.en-US.md`（**完整**：何时使用 / 引入 /
      代码演示 / API 四表 / Theme 45 个 token（**实测值**）/ 设计说明）。
      ⚠️ 代码演示**只写了 `basic`**（demo 目录里只有它），其余用 TODO 注明；
      **不写不存在的 demo 引用**（坏链比缺一节更糟）。
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
| G5/G6 L1+L2 | ✅ | `index.test.ts` **29**（上游 testCases 镜像）+ `picker-pure` **65** + `picker-typing` **11** + `picker-value-change` **36** + `mask-format` **18** + `s1-smoke` **10** + `s2-typing` **16** + `s2-commit` **12** + `s3-mask` **11** + `s4-focus` **5** + `s5-mode` **5** + `s5-multiple` **9** |
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

## G9 L6 的落地方案（**已落地，未全绿** —— 2026-10-01，二轮）

### 已完成

| 项 | 内容 |
|---|---|
| 用例文件 | `tests/visual/render/cases/vue/date-picker.js` + `react/date-picker.jsx`（**逐条对应**，7 个 variant） |
| matrix | `date-picker` 条目（7 × 3 viewport = **21 张**） |
| 共享常量 | `cases/shared.mjs` 的 DatePicker 段（固定日期字面量 / 容器样式 / `variants` 列表） |
| harness | `tests/visual/build.mjs` 加了 **`dayjs` 解析别名**（根 `node_modules` 里没有它，见那边的注释） |
| React 基线 | 21 张已生成（`baselines/react/date-picker/`） |

### 🚨 浮层怎么进截图区域 —— 与 cascader 的解法**不同**

`#stage` 是截图目标，而浮层默认 **portal 到 `document.body`** ⇒ 拍不到。
cascader 的解法是「用公开的 `Cascader.Panel` 直渲面板」；**date-picker 没有这样的公开出口**，
所以这里换成：**两侧都传 `getPopupContainer` 指向用例自己的盒子**（盒子 `position: relative`）。

⚠️ **不用**上游的 `DatePicker._InternalPanelDoNotUseOrYouWillBeFired`（`genPurePanel`）：
它的 holder 用 **`paddingBottom: <实测浮层高>`** 撑高（`_util/PurePanel.js:78-82`），
Vue 侧撑不出同一个高度 ⇒ 两侧 `#stage` 尺寸不等 ⇒ pixelmatch 直接判尺寸不匹配。
两侧**手写同一个 holder** 才能让输入完全对称（与 cascader「把浮层进画面这件事在用例层解决」同思路）。

### 首轮结果与**修掉的真 bug**

首轮 **18 / 21 红**（0.42%~3.51%），两侧源图对比：React 面板 ~250px、**Vue 面板铺满 1440px**。

根因：`--apollo-date-picker-*` 的声明块只挂在 `.apollo-picker`，而浮层走 Portal **不在它的子树里**
⇒ `calc(var(--apollo-date-picker-cell-width) * 7 + …)` **非法** ⇒ `width` 整条被丢弃 ⇒ 面板铺满。
（就是 PITFALLS 9 / D95 那件事，具体后果比「回退」更隐蔽。）→ PITFALLS **248**

修法（与 `select` 同判）：声明块挂 `.apollo-picker,.apollo-picker-css-var` 两个选择器 +
`.vue` 把 `css-var-root` / `-css-var` 同时加到**根**与**浮层**。
⇒ 差异率 3.51% → **0.25%**。

### ✅ 二轮（2026-10-01）：3/21 → **12/21 exact**

修掉三处（**都是真 bug**，不是调阈值 —— 阈值本来就没动）：

| # | 症状 | 根因 | 归属 |
|---|---|---|---|
| 1 | 表头四个导航箭头是**细字形 Unicode 字符**（`‹` `«`） | `PickerPanel` **少声明 4 个图标 props** ⇒ 被归进 `attrs` ⇒ `pickProps` 取不到 ⇒ `PanelHeader` 回退字符兜底 | `@apollo-design/picker`（PITFALLS 250） |
| 2 | 🚨 面板在真实浏览器里**完全点不动** + 无阴影 + `popup.container` 语义槽无宿主 | 浮层**缺 `-panel-container` / `-panel-layout` 两层**（浮层根是 `pointer-events: none`，**只有 container 重置成 `auto`**） | `ui`（PITFALLS 251） |
| 3 | `classNames.popup.root`（**新 API**）静默失效 | 传的是原始 deprecated prop，而不是上游那种**合并后**的 `popup.root` | `ui`（PITFALLS 252） |

`month` / `year` / `multiple` / `variants` 已 **0.000% exact**。
新增 `__tests__/popup-shell.test.ts`（4 条）把「外壳三层」钉在 L4，不必每次都等 L6。

### ⏳ 剩余（**只剩一项**）

| # | 现象 | 归属 | 说明 |
|---|---|---|---|
| 1 | **缺 `Today` 页脚**（容器高 **309** vs antd **348**，差的 39px 就是它） | **S5 的 presets/footer** | 页脚由 **Popup 层**渲染（rc-picker 的 `PickerPanel` 里**没有** `showToday`/`-footer`）。⚠️ 宿主层 `-panel-layout` 已就位 ⇒ 只差接线 + 用例。**不是 bug，是已知范围** |

⚠️ `basic` / `value` / `datetime` 的差异率比一轮**变大**（0.13%→0.22% 等）**不是回归**：
它们 antd 侧**有页脚**，Vue 侧没有；此前 Vue 连阴影都没有 ⇒ 「缺阴影」与「缺页脚」两块差异
**恰好抵消了一部分**。现在阴影对齐了，剩下的差异**纯粹**是缺页脚。
（`month`/`year`/`multiple` 掉到精确 0 恰好反证：它们 antd 侧**没有页脚**，
此前的差异**全部**来自缺阴影。）

⚠️ L6 是**硬门禁**（`compare.mjs` 的阈值 0.1% + 邻域判据，`TESTING.md` §9.3 / T17 明确「不得放宽」，
**没有豁免机制**）⇒ 这一项修完之前 **G9 不能判 done**，组件也不能 `completed`。

⚠️ **与 G12 的关系**：`test:visual` **不在** `verify:full`（= registry:check && lint && test && test:build）
⇒ L6 的红**不会**让日常门禁红，必须显式跑 `node tests/visual/run.mjs --component date-picker`。

### 两条仍然有效的约定

**字体必须钉具体值**：date-picker 的**触发器**在 antd 里有 `font-family`（`input` 族），
但**面板**是 `resetFont: false` ⇒ 靠继承。照 `cascader.js` 的做法在用例内钉
`DATE_PICKER_CONTEXT_FONT`，**不动全局 BASE_CSS**
（裁决见 `docs/COMPONENT-CHECKLIST.md` 第 15 条 / COMPATIBILITY.md D114）。

⚠️ 比对不过时**先怀疑实现**（PITFALLS 170 / D94：`style` 里的裸数字被 Vue 静默丢弃、
以及 `toCssSize()` 漏用）—— tabs 的第一次 L6 就是「指示条数值没带单位」差 0.03%~0.12%。
**本轮的首轮 18 红也是实现问题**（`-css-var` 漏挂），不是夹具问题 —— 这条经验再次成立。

⚠️ **已废弃的两条旧方案**（2026-09-30 写的，实测后推翻，留作记录）：
1. 原计划 React 侧用 `DatePicker._InternalPanelDoNotUseOrYouWillBeFired`、
   Vue 侧用 `PickerPanel` 直渲 —— **行不通**：前者的 holder 用实测高度撑高，
   两侧 `#stage` 尺寸不等（详见上面的「浮层怎么进截图区域」）。
2. 原计划把 `PickerPanel` 从 `ui` 再导出 —— **不需要**：改用 `getPopupContainer` 后
   根本不必单独渲染面板。

## S2 的落地方案（跨包欠账已还清，键入解析待做）

### ✅ 已还清：`PickerFormat` 的泛型与函数形态（PITFALLS 214 的欠账）

`@apollo-design/picker` 的 `time-config.ts` 此前刻意**不挂泛型**（因为本仓只到
「字符串 / 数组 / `{ format }`」三形态，挂了泛型也无人使用）。S2 真做函数式 `format`
时按约定「随实现一起加回来」—— 已落地：

```ts
export type CustomFormat<DateType> = (value: DateType) => string;
export type FormatType<DateType = PanelDateType> = string | CustomFormat<DateType>;
export type PickerFormat<DateType = PanelDateType> =
  | FormatType<DateType> | readonly FormatType<DateType>[] | { format: string; type?: 'mask' };
```

⚠️ 三处**顺带修正**：
1. 第三支补上上游有的 **`type?: 'mask'`**（本仓此前漏了）；
2. 默认泛型参数 `= PanelDateType` ⇒ **不传泛型的既有用法不受影响**；
3. ui 侧（`date-picker/interface.ts`）原本**又写了一遍** `CustomFormat` / `FormatType`
   ⇒ 改为 picker 定义的**特化别名**（`CustomFormat<DatePickerDate>` 等），消除两处同义。

⚠️ 一个必须记住的判据：**函数形态只参与格式化，不参与解析** ——
键入时无法从函数反推日期 ⇒ `pickPropFormat` 遇到函数返回 `null`（「没有静态格式串」），
解析退回 `formatList` 的字符串项。这与上游一致。

### ✅ 落值 + 提交时机 —— **已落地**（2026-10-01）

`hooks/picker-value-change.ts` 是上游 `useRangeValueChange.js`（**405 行**）的逐字移植：

```
source × needConfirm × allowEmpty × index  ──resolveAction──▶  action  ──▶  统一执行
```

- **8 种 action**：`modify` / `submitCurrent` / `switchNext` / `finish` / `abort` /
  `resetCurrent` / `resetCurrentAndSwitchNext` / `resetAll`。
- **10 种 source**：`input` / `remove` / `keyboard-submit` / `keyboard-submit-weak` /
  `esc` / `panel-intermediate` / `panel-final` / `popupClose` / `field-switch` / `confirm`。
- **三份簿记**：`triggeredFields`（参与过 + 改过）、`confirmedIndex`（显式确认过）、
  `isLastInput`（最近一次是不是 input ⇒ 决定 `popupClose` 的 focus 强弱）。

**接线点**（全部对齐 `SinglePicker.js`）：

| 交互 | source | 出处 |
|---|---|---|
| 键入 | 先 `input`（**不带值**）+ 再 `input`（带 `[date]`） | `useInputProps.js:114-135` + `SingleSelector.js:94-96` |
| 聚焦 | `field-switch` | `SinglePicker.js:417-423` |
| `Tab` | `keyboard-submit-weak`（局部提交，**不**关浮层） | `SinglePicker.js:428-429` |
| `Escape` | `esc` + 关浮层 | 同上 `:431-432` |
| `Enter` | **文本合法 ⇒ `keyboard-submit`（提交 + 关浮层）**；空/非法 ⇒ 只在关闭时开浮层 | `Input.js:182-183` + `useInputProps.js:152-158` |
| 关浮层 | `popupClose` | `SinglePicker.js:187-191` |
| 清除 | `reset()` + 提交 `null` + 关浮层 + 焦点回输入框 + `clear` | `SinglePicker.js:242-249` |
| 点面板格 | `panel-final`（无确认制**且**面板粒度 = 组件粒度）否则 `panel-intermediate` | `SinglePicker.js:322-328` |

🚨 **四条最容易想当然、已被用例钉住的判据**：

1. **键入本身不提交** —— `input` 只走 `modify`（写临时日历值）。提交在**后续事件**
   （关浮层 / Tab / 确定）。这与「多数输入框改完即提交」的直觉相反。
   （上游被废弃的 `changeOnBlur` 注释「Value will always be update if user type correct
   date type」说的是**用户视角**，机制上仍是「关浮层时提交」。）
2. 🚨 **`Enter` 的判据不是「不提交」**（这一条 2026-10-01 被**更正**）：
   `Input.onSharedKeyDown` 是 `key === 'Enter' && validateFormat(inputValue)` ⇒ `onSubmit()`
   ⇒ `triggerConfirm('keyboard-submit')` ⇒ **提交并关浮层**。
   只有**空 / 非法**文本才落到「只在关闭时开浮层」那一支。
   ⇒ 我先前把上游的 keydown 读成「两段」（`onSelectorKeyDown` + `useInputProps`），
   漏掉了 `Input.js` **最前面**那一段 —— 与 234/235 是同一类错误（少读一层）。
3. **`popupClose` ≠ 一定提交**：有确认制且还有 field 没参与过 ⇒ `resetAll`（丢弃）；
   整轮没改过 ⇒ `finish`（什么都不做）。
4. **`isLastInput` 只被「非 `popupClose`」的事件写**（上游注释：`popupClose`
   *consumes* the previous update type instead of replacing it）⇒ 无条件赋值会让
   `popupClose` 的 focus 强弱判定恒假。

⚠️ 用例：L1 `picker-value-change.test.ts` **36 条**（node 环境，纯 `resolveAction` +
簿记）+ L2 `s2-commit.test.ts` **12 条**（jsdom，真实键入 / Tab / Esc / 关浮层 / 面板点选）。

## ✅ S2 的阻塞项 —— **已闭合**（2026-10-01）

**原症状**：键入**任何**内容都被判非法（`aria-invalid` 恒 `true`）。

**根因（2026-10-01 更正 —— 2026-09-30 那版定位错了一半）**：

原判据链里「上游的 `format` 不是从 locale 来的，而是 `useFilledProps` 里经 `showTime` /
`getTimeProps` **推导**出来的」—— **对**；但**推导的形式说反了**：

| 层 | 内容 | 2026-10-01 之前 |
|---|---|---|
| ① 用户 `props.format` | 直接用 | ✅ |
| ② 语言包 `locale.fieldXxxFormat` | `getRowFormat` 读它 | ✅（但本仓与 antd 的语言包**都没有**这些键） |
| ③ **rc 的硬编码兜底** | `useLocale` → `fillLocale`（`fieldDateFormat \|\| 'YYYY-MM-DD'` 等 **11** 个键） | ❌ **缺的是这一层** |

- ③ 的判据在 `es/hooks/useLocale.js:56-69`（11 个 `||` 兜底），
  **不是** `showTime` / `getTimeProps` 那条（那条只决定**时间格式串**怎么拼）。
- ⇒ 修复：`hooks/picker-filled.ts` 逐字移植 `useFilledProps.js:72-76` 的两段
  （`fillPickerLocale` = 上游 `useLocale`；`useFilledLocale` = 两者的响应式包装），
  并让 `.vue` 的 **4 处**消费点（`mergeFormat` / `formatValue` / `rangeValue.locale` /
  `panelProps.locale`）全部改用**补齐后**的 locale。

**为什么 S1 的 L4 没抓到**：`valueTexts` 用 `firstFormat ?? ''` 兜底，`formatValue` 对空格式串
有默认 ⇒ **显示正常**（`2026-09-30` 照样渲染）⇒ 16 个 L4 用例全绿。
⇒ **「显示对」不等于「功能对」**，`formatList` 空只有**键入**才暴露。

**回归哨兵**（三处，缺口若被改回去会同时红）：
1. `s2-typing.test.ts`「不传 `format` 也能解析」（2026-10-01 前它断言的正是**相反**的行为）；
2. `picker-pure.test.ts`「补齐前 `formatList` 为空，补齐后有默认格式」；
3. `picker-pure.test.ts`「补齐用的时间格式**从 show 标志推出来**，不是 `showTime.format`」。

**S2 的收尾（同日）**：落值 + **提交时机** —— 上游 `useRangeValueChange.js`（405 行）的
`triggerChange` 状态机，已逐字移植（见上面「✅ 落值 + 提交时机」一节）。
⚠️ 它与 **S4 的字段导航是同一个状态机** —— 本轮把**调度逻辑**（`field-switch` 分支 +
`forceFocus`）一并做掉了，S4 只剩**渲染**（`-input-active` 分段高亮 + 焦点跟随）。

## ✅ S3 掩码模式 —— **已落地**（2026-10-01）

`format={{ format: 'YYYY-MM-DD', type: 'mask' }}` 时输入框切成**分段掩码**。

| 文件 | 对应上游 | 内容 |
|---|---|---|
| `components/mask-format.ts` | `MaskFormat.js`（81 行） | 工厂 + 接口形态：模板 / 分段 / `getSelection` / `match` / `size` / `getMaskCellIndex` |
| `components/mask-input.ts` | `Input.js` 的 `format` 分支 | 本地文本 / 字段选择区间 / keydown（Backspace·方向键·数字）/ paste / 失焦还原 |
| `components/Selector.ts` | `Input.js` 的 `inputProps` 覆盖 | 6 个新 prop 转接 + 两个元素 ref |
| `DatePicker.vue` | `useInputProps` 的 `onChange` | `applyInputText` 抽出（普通 `input` 与掩码 `keydown` 共用） |

**🚨 四条「写错也不会报错」的判据**：

1. **DOM 不变**：还是**一个 `<input>`**，「分段」只体现在 `setSelectionRange` 上。
2. **原生 `input` 事件在掩码模式不改状态**（上游 `if (!format)`）—— 键入全走 `keydown`。
3. **键值判据是 `!isNaN(Number(key))`**：空格（`Number(' ') === 0`）**不被过滤**，
   且 `leftPad(' ', 4)` 会补成 `'000 '`（空格留在文本里）。
4. **`Backspace` / `Delete` 一样**（清空字段 + 回填字段模板），没有「删一个字符」的语义。

**🚨 一处 PLATFORM 差异（→ PITFALLS 242）**：上游靠 **React 的 `restoreControlledState`**
在事件后把 DOM 值强制还原；**Vue 没有这个机制** ⇒ 本仓必须在 `onInput` 里**主动打一拍**
（`syncTick += 1`）触发重渲染，否则浏览器在 `keydown` **之后**落进 DOM 的原生字符会留在框里。
⚠️ 打拍必须打在**渲染函数读得到的地方**（`bind()` 里 `void syncTick.value`）。

用例：`mask-format.test.ts` **18 条**（L1，node）+ `s3-mask.test.ts` **11 条**（L2，jsdom）。

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
