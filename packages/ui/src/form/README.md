# Form 实现说明

> 收口记录（2026-09-29）。**form 是 `@apollo-design/form-core`（foundation）的第一个 UI 消费者。**

## 1. 对应 antd 组件

- antd 6.6.4 `es/form/`：`Form.js` 188 行（薄壳）+ `FormItem/index.js` 284 行 +
  `FormItem/{ItemHolder,StatusProvider}.js` + `FormItemInput.js` 127 行 +
  `FormItemLabel.js` 100 行 + `ErrorList.js` 110 行 + `FormList.js` + `context.js` + `util.js`
- 上游状态机：`@rc-component/form@1.8.6`（→ 本仓 `@apollo-design/form-core`：
  `FormStore` / `Field` / `List` / `useWatch` / `useForm`）
- 分析产物：`docs/analysis/form.md`
- 复用的本仓资产：`grid`（Row / Col）、`Input` 族（作 control）、`Tooltip`（label 的提示）、
  `@apollo-design/motion`（ErrorList 的双层 collapse 动效）、`config-provider` 的
  Size/Disabled/Variant context
- 样式：**机械移植** antd 产物（见 §4），11 个 Component Token

## 2. 与 antd 的行为差异清单（同步 COMPATIBILITY.md §9）

| # | 差异 | 分类 | 说明 |
| --- | --- | --- | --- |
| 1 | `onValuesChange` / `onFieldsChange` / `onFinish` / `onFinishFailed` → **emits** | INTENDED | Vue 事件模型（规则 C5）；`FormProps` 里 `Omit` 掉，避免与 `defineEmits` 撞键 |
| 2 | render props（children 函数）→ **scoped slot** | INTENDED | 规则 C8；`Form` / `Form.Item` / `Form.List` 三处都是 |
| 3 | `trigger` 事件键上额外注入 **`onUpdate:${valuePropName}`** | INTENDED | Vue 生态里 Input 族的「值更新」是 `update:value`（v-model），React 的 `onChange` 触发名在本仓对应两个键：`onChange`（用户手写）+ `onUpdate:value`（v-model 桥）。两个都注入是为了让 `v-model:value` 与 `@change` 并存 |
| 4 | `label` / `help` / `extra` / `tooltip` 等 `VNodeChild` prop **必须显式 `default: undefined`** | PLATFORM | 否则 Vue 的 Boolean prop 转换会把未传值变成 `false`（同 D21） |
| 5 | `Form.Item` 的 label tooltip 走本仓 `Tooltip` 组件 | INTENDED | 判据落在 **Item 级 `tooltip` prop**（同 antd），context 只参与浅合并 |
| 6 | `Form` 重新 provide **SizeContext**（`size` 传导到 input 族） | 同上游 | antd 的 `SizeContext.Provider value={mergedSize}`；本仓此前缺，L4 抓到 |
| 7 | `FormItemInputContext` 的值在 Vue 侧是 **`ComputedRef`** | PLATFORM | antd 每次渲染重建对象；Vue 用 ref 保响应式，读取方经 `useFormItemInputContext()`（内部 `toValue` 解包） |
| 8 | ErrorList 的动效类来自 motion 包（`CSSMotion` / `CSSMotionList` 槽回传） | PLATFORM | 不手写 `-appear` / `-enter-done` 之类猜名字符串（猜错静默失效） |

## 3. 文件结构与选型

```
form/
├── Form.vue            # 容器：context 合并 / 类名 / finishFailed 包装 / NoFormStyle
├── FormItem.vue        # 字段项：消费 form-core 的 Field → control 注入 → renderLayout
│   └── FormItem/{ItemHolder,StatusProvider}.ts
├── FormItemInput.ts    # control 列 + ErrorList + extra（Col 包裹）
├── FormItemLabel.ts    # label 列（colon / requiredMark / tooltip）
├── ErrorList.ts        # 错误/警告列表（双层 collapse 动效）
├── FormList.vue        # Form.List（scoped slot 的 add/remove/move）
├── context.ts          # FormContext / FormItemInputContext / FormItemPrefixContext / NoStyleItemContext
├── hooks/              # use-form（scrollToField/focusField 补丁）、use-watch、use-debounce、useVariants
├── util.ts             # getFieldId / getStatus / toArray
└── style/              # token.ts（11 个 Component Token）+ index.ts（机械移植的静态 CSS）
```

- `Form.vue` / `FormItem.vue` / `FormList.vue` 用 `.vue`（布局驱动，模板表达力足够），
  其余用 `.ts` + 渲染函数（control 注入需要 `cloneVNode` + Field 的 scoped slot，模板表达不了）。
- `Form.Item` / `Form.List` / `useForm` / `useWatch` / `ErrorList` 同时提供**复合静态属性**
  与**独立具名导出**（antd 的两种写法都要能跑）。

## 4. Component Token（11 个）

`prepareComponentToken` 与 antd 6.6.4 产物**逐字对拍**：`labelRequiredMarkColor` /
`labelColor` / `labelFontSize` / `labelHeight` / `verticalLabelHeight` /
`labelColonMarginInlineStart` / `labelColonMarginInlineEnd` / `itemMarginBottom` /
`verticalLabelPadding` / `verticalLabelMargin` / **`inlineItemMarginBottom`**。

⚠️ 第 11 个 `inlineItemMarginBottom` 只在 `-inline` 布局规则里被消费 ——
漏掉时那条规则静默回退到继承值，普通截图看不出来（本次收口补齐）。

CSS 侧是**机械移植**：`node tests/visual/debug/extract-form-css.mjs --emit-static`
把 antd 产物转成静态规则（75 条 + 1 条 keyframes），只做「删壳改名」不改值。
两条踩过的坑记在脚本注释里（`:where()` 壳、**空白必须折成空格**）。

## 5. 实现要点（最容易写错的判据）

1. **`-has-error` 的状态源是 `meta.errors`（未 debounce）**，不是合并后的 `errors`。
   ItemHolder 的 `getValidateState(isDebounce=false)` 用 `meta` —— 于是「外层布局 Item
   + 内层 noStyle Item」的聚合形态里，**外层不带 `-has-error`**（错误文案仍然渲染）。
   判据是 antd 6.6.4 的**真实运行时**：`tests/visual/debug/probe-form-nostyle.mjs`。
2. **`aria-invalid` 的判据是 `mergedErrors.length`**（不是 `validateStatus`）——
   只传 `validateStatus="error"` 不会给控件加 `aria-invalid`。
3. **tooltip 的判据在 Item 级 `tooltip` prop 上**（antd `convertToTooltipProps`）：
   `tooltip` 不可渲染 ⇒ 直接 `null`。判据若落在 context 上，而 Form 的
   `mergedTooltip()` 恒返回 `{}`（真值）⇒ **每个 label 都多一个问号图标**（L4 抓到）。
   指示器用 `icon || children || <QuestionCircleOutlined/>`，**不是 `title`**（title 是气泡内容）。
4. **`useFormItemInputContext` 必须 `toValue` 解包**：StatusProvider 提供的是
   `ComputedRef`，不解包时消费者读到 ref 本身 ⇒ 状态/反馈图标全丢（L4 的
   `form:size-*` / `form:feedback-*` 一起红）。
5. **StatusProvider 不产 DOM**（antd 逐字）：只 provide 上下文。早期实现自造了
   `-item-status-provider` 包裹 div，会污染 DOM 契约。
6. **反馈图标是 `<span class="{item}-feedback-icon {item}-feedback-icon-{status}">`
   + 默认四件图标**（CheckCircleFilled / ExclamationCircleFilled / CloseCircleFilled /
   LoadingOutlined）；`hasFeedback.icons` 优先于 Form 级 `feedbackIcons`（函数形态）。
7. **`classNames` / `styles` 语义槽从 FormContext 读**（label / content / help / helpItem /
   extra 五处），不是当成 Item 的 prop 逐层传 —— 早期实现传了一串永远 undefined 的 prop。
8. **类名拼接不用对象条件**（`{[cls]: cond}`）：本仓的 biome 规则下对象字面量里的
   suppression 无效（PITFALLS 139），统一写成三元字符串再 `filter(Boolean)`。
9. **ErrorList 双层动效都要给 `motionDeadline`**：collapse 的 handler 要映射成
   motion 包的 `hooks` 对象（`initCollapseMotion` 在 antd 是 9 个独立 prop）。
10. **`getFieldId` 的 `form_item_` 黑名单**只对 `parentNode` 生效（`util.js` 逐字）。

## 6. 层与证据（本组件收口时全绿）

| 层 | 文件 | 结果 |
| --- | --- | --- |
| L1/L2 单元 + 交互 | `__tests__/form.test.ts` | 14 用例 |
| L3 类型 | `__tests__/type.test-d.ts` | 10 用例（含 3 个负例） |
| L4 DOM 契约 | `__tests__/semantic.test.ts` + `tests/compat/baselines/form.dom.json` | 20 用例逐节点一致 |
| L5 无障碍 | `__tests__/a11y.test.ts` | 11 用例（含 5 个 demo 的 axe 扫描） |
| L6 视觉 | `tests/visual/`（matrix `form` 条目，7 variant × 3 viewport） | 21 组比对 |
| L7 主题 / demo / 构建 | `__tests__/theme.test.ts`（+ demo 扫描）、`__tests__/demo.test.ts`、`tests/build/` | 见门禁输出 |

## 7. 已知缺口

1. **`Form.List` 的 UI 级测试**未做：`add` / `remove` / `move` 的行为缺 L2 断言
   （form-core 侧有 store 级测试，但 UI 那层的 key 复用没钉）。
2. **Form 级 `feedbackIcons`（函数形态）**的自定义图标渲染未做 L2 断言（默认四件图标已由
   L4 的 `form:feedback-*` 钉住）。
3. **`scrollToFirstError` 的滚动**在 jsdom 里不可断言（`scroll-into-view-if-needed` 依赖布局），
   只验证了「调用路径」。
4. **dark / compact 主题**：`tests/visual` 的 `THEMES` 目前只有 light（全局限制，见
   `tests/visual/matrix.mjs` 的 `LIMITATIONS`）。
5. **`classNames` / `styles` 的 `useMergeSemantic` 合并**（antd 在 Form 上做的
   `[contextClassNames, classNames]` 合并 + 函数式变体）未接：目前 Form 只读自己的 prop。
6. **demo 覆盖（见 §8）**：45 → 5。
7. **wave（点击波纹）**：antd 的 Form 不产生 wave，不适用。

## 8. demo 覆盖登记

antd 6.6.4 的 `components/form/demo/` 有 **45 个** demo，本仓先落 **5 个**
（`basic` / `label` / `layout` / `validate-status` / `customized-form-controls`），
其余 40 个**显式登记为未覆盖**，原因分三类：

| 类别 | demo | 原因 |
| --- | --- | --- |
| 依赖未落地组件 | `advanced-search` `time-related-controls` `form-in-modal` `variant` `component-token` `style-class` `col-24-debug` `label-debug`… | 需要 Select / DatePicker / Modal / Typography / Space.Compact / antd-style 等 |
| 依赖运行时可交互 | `dynamic-form-item*` `dynamic-rule` `nest-messages` `validate-*` `control-hooks` `useWatch` `form-context` `global-state` `form-dependencies` | 纯交互 demo，静态截图无意义（行为由 L2 覆盖） |
| 仅调试用 | `_semantic` `disabled-input-debug` `getValueProps-normalize` `ref-item` `register` | 上游内部调试页，不面向用户 |

⚠️ 这不是「按需挑选」：`basic` / `label` / `layout` / `validate-status` /
`customized-form-controls` 是能被现有组件完整支撑的那批；补齐其余 demo
需要先补齐它们的依赖组件（registry 里各自的条目）。
