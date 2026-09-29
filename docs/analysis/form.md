# Form 分析（antd 6.6.4）

> 分析日期：2026-09-29。来源：`/tmp/antd-src/package/es/form/`（1930 行：Form 188 +
> FormItem 284 + ItemHolder 125 + FormItemInput 127 + FormItemLabel 100 + ErrorList 110 +
> StatusProvider 78 + FormList 37 + context/util/hooks + style 486）、`@rc-component/form@1.8.6`
>（UI 无关内核 1009 行）。**本仓 form-core foundation（5751 行）已完整实现 rc-form 内核**，
> 且提供 Vue 渲染组件：`Form`（FieldForm 壳，form.ts）/ `Field`（field.ts:645，子插槽签名
> `(control, meta, fieldContext)`，field.ts:755）/ `List`（list.ts:80）。UI 层 = antd 展示层。

## 1. 组件定位与拆解

antd form = **rc-form 内核（本仓 form-core 已有）+ antd 展示层**。展示层拆解：

| antd 文件 | 行数 | 职责 | Vue 落点 |
|---|---|---|---|
| Form.js | 188 | 壳：context 合并 / 类名 / scrollToFirstError | `Form.vue`（消费 form-core `Form` + `useForm`） |
| FormItem/index.js | 284 | Field 消费 + 子节点 control 注入 + MemoInput | `FormItem.vue` |
| FormItem/ItemHolder.js | 125 | Row 布局（label + control） | `FormItem/ItemHolder.ts` |
| FormItemLabel.js | 100 | label 渲染（colon/requiredMark/tooltip） | `FormItemLabel.ts` |
| FormItemInput.js | 127 | control + ErrorList + extra + Col | `FormItemInput.ts` |
| StatusProvider.js | 78 | 状态 context 注入（status/hasFeedback/variant/size） | `FormItem/StatusProvider.ts` |
| ErrorList.js | 110 | 错误列表（debounce + CSSMotionList 动效） | `ErrorList.ts` |
| FormList.js | 37 | rc List 壳 + FormItemPrefixContext | `FormList.vue` |
| hooks/useForm.js | 68 | rc useForm 转发 + FormInstance 补丁 | `hooks/use-form.ts`（转发 form-core） |
| util.js | 40 | getFieldId / toArray / getStatus | `util.ts` |

## 2. Form 壳（Form.js 188 行）判据

1. **context 合并**：requiredMark（prop → ctx → true）、colon（prop ?? ctx）、labelAlign/labelWrap
   （prop ?? ctx）、tooltip（ctx 与 prop **浅合并**对象）、scrollToFirstError（prop ?? ctx）。
2. `wrapForm = useForm(form)`（外部传入受控实例）；`__INTERNAL__.name = name`。
3. 类名：`${p}` + `${p}-${layout}` + `-hide-required-mark`(requiredMark===false) + `-rtl` +
   `-large/-small` + semantic root。
4. **onFinishFailed 包装**：先回调用户，再有 errorFields 且 scrollToFirstError 时
   `scrollToField(fieldName, {block:'nearest', ...options})`。
5. context 栈（外→内）：VariantContext → DisabledContextProvider → SizeContext.Provider →
   FormProvider(validateMessages) → FormContext → **NoFormStyle(status=true)** → FieldForm。
   NoFormStyle(status) 会删掉 FormItemInputContext 的 status/hasFeedback/feedbackIcon ——
   **Form 根上不吃 Item 的状态反馈**（防外层 Form.Item 串味）。
6. expose：`{ ...wrapForm, nativeElement }`。

## 3. FormItem（284 行）判据

1. **双形态**：`noStyle`（只渲染 StatusProvider 包裹的 children，错误上抛给
   NoStyleItemContext 父级聚合）与普通（renderLayout → ItemHolder）。
2. **Field 消费**：`<Field name rules trigger validateTrigger onMetaChange messageVariables>`，
   children 是**函数** `(control, meta, context)`（form-core Field 已实现该插槽签名）。
3. **control 注入子元素**（有 name 且子是单个组件时）：
   - `childProps = {...child.props, ...control}`，补 `id=fieldId`；
   - aria：`aria-describedby`（help/errors → `${fieldId}_help`；extra → `${fieldId}_extra`）、
     errors>0 ⇒ `aria-invalid`、required ⇒ `aria-required`；
   - ref：`getItemRef(name, child)`（收集供 form.scrollToField/focus）；
   - **trigger 事件合并**：`trigger`（默认 onChange）与 validateTrigger 的事件在 child 上
     合成（先 control 的再用户自己的），用户原始 handler 保留；
   - MemoInput：control 浅比较不变则不重渲（Vue 侧不需要 memo，响应式天然按需）。
4. **isRequired**：prop.required ?? rules.some(r => r.required && !warningOnly)（函数 rule
   以 context 求值后判）。
5. **meta 聚合**：自身 meta.errors + 子 noStyle Field 的 subFieldErrors（NAME_SPLIT key 合并，
   destroy 时删除）→ mergedErrors/Warnings 传 ItemHolder。
6. **无 name 且非 renderProps 且无 dependencies** ⇒ 纯布局 Item（不进 Field）。
7. 警告：shouldUpdate+dependencies 同用 / render-props 无 shouldUpdate / 带 name 的
   render-props / dependencies 无 name / 多子节点带 name / child defaultValue。

## 4. ItemHolder（125）+ Label（100）+ Input（127）

- **Row**：`<Row>`（grid）> [LabelCol(Col, label) , ItemInput(Col wrapperCol)]；
  vertical 时 label 上下（`-item-label` 无 colon）。
- **Label**：`isReactRenderable(label)` 才渲染；colon 计算（`colon===true || (ctx!==false &&
  colon!==false)`，vertical 时无）；去用户重复冒号正则 `/[:|：]\s*$/`；tooltip
  （convertToTooltipProps → Tooltip 包 QuestionCircleOutlined，tabIndex=-1）；requiredMark
  三形态（true 默认红 * / 'optional' 非必填加 `(optional)` 文案 / fn 自定义 / false 隐藏 ⇒
  `-item-required-mark-hidden/optional` 类）；label htmlFor=fieldId；title 仅 string。
- **Input**：wrapperCol 合并（**label===null 且无自身 col 且有 ctx.labelCol 时
  wrapper.offset = label.span**，responsive 逐档）；`-item-control > -control-input >
  -control-input-content`（semantic content）；ErrorList + extra 包进 `-item-additional`
  （minHeight = marginBottom + extraHeight 动效联动）；ErrorList 渲染条件
  `marginBottom !== null || errors.length || warnings.length`。
- **StatusProvider**：向上提供 FormItemInputContext（status/hasFeedback/feedbackIcon/
  isFormItemInput/variant/size）—— **input 系组件的校验态消费入口**（input/select 已消费）。

## 5. ErrorList（110）

- useDebounce(errors/warnings)（防抖 5 帧）；help 存在时只渲染 help（状态 = helpStatus）；
- key 去重：重复 error key 加 `-fallback-${index}`；
- CSSMotion（`${p}-show-help` visible）+ CSSMotionList（`-show-help-item`）逐条动效
  （initCollapseMotion）；
- DOM：`-item-explain`（id=`${fieldId}_help`）> `-item-explain-${errorStatus}`。

## 6. FormList（37）

rc List 壳：children 为函数 `(fields, operation, meta)`；fields 补 `fieldKey: field.key`；
meta 只透传 errors/warnings；包 FormItemPrefixContext（prefixCls + status:'error'）。
**operation**：add(defaultValue, insertIndex?) / remove(index) / move(from,to)。Vue scoped slot。

## 7. Token（10 个，style/index.js:458）

`labelRequiredMarkColor: colorError` / `labelColor: colorTextHeading` / `labelFontSize: fontSize` /
`labelHeight: controlHeight` / `verticalLabelHeight: labelHeight ?? 'auto'` /
`labelColonMarginInlineStart: marginXXS/2` / `labelColonMarginInlineEnd: marginXS` /
`itemMarginBottom: marginLG` / `verticalLabelPadding: 0 0 paddingXS` / `verticalLabelMargin: 0`。
prepareToken 注入 `formItemCls`。样式 486 行：layout 水平/垂直/inline、label col、
explain/show-help 动效、required mark、optional、tooltip、extra、hidden（`-item-hidden`）。

## 8. Vue API 设计（G4）

### Form
props：`form`(FormInstance)、`component`('form')、`name`、`layout`、`labelCol/wrapperCol`、
`labelAlign/labelWrap`、`colon`、`requiredMark`、`size`、`disabled`、`variant`、
`scrollToFirstError`、`feedbackIcons`、`tooltip`、`validateMessages`、`preserve`、
`initialValues`、`validateTrigger`、`onValuesChange?(changed, all)`（emits `valuesChange`）、
semantic classNames/styles（root/vertical/inline…）。emits：`finish` / `finishFailed` /
`valuesChange` / `fieldsChange`。expose：FormInstance 全量（form-core）+ nativeElement。
slots：default（普通子组件）/ render-props（shouldUpdate/dependencies —— scoped slot
`(values)` 或显式 renderProps prop）。

### Form.Item
props 继承 FieldProps（form-core）：name/rules/dependencies/shouldUpdate/trigger/
validateTrigger/valuePropName/getValueProps/getValueFromEvent/normalize/preserve/hidden/
initialValue/messageVariables/validateFirst + 展示：label/labelCol/wrapperCol/labelAlign/
colon/required/requiredMark/tooltip/noStyle/help/extra/hasFeedback/validateStatus/
feedbackIcons/layout/warningOnly。slots：default / label / help / extra。
**子组件 control 注入协议（Vue）**：Field 插槽 `(control, meta, ctx)`；FormItem.vue 内部
消费 form-core `Field`（或直接用 FieldController via provide）——实现时以 form-core Field
组件的插槽能力为准。

### Form.List
props：name。scoped slot `(fields, operation, meta)`；Form.ErrorList 独立导出。

### useForm / useWatch
`useForm(form?)` → 转发 form-core；`useWatch(deps, form, options)` 同。

### INTENDED 差异登记
1. render-props → scoped slot（C8）；`shouldUpdate` 用函数 slot `(values, form)`。
2. `Form.useForm()` → `useForm()` 具名导出（Vue 惯例）。
3. MemoInput（React.memo）不需要 —— Vue 响应式天然细粒度。
4. React children 多元素 + name 的告警场景：Vue 插槽多根时告警同语义。
5. `aria-*` 注入策略不变（describedby/invalid/required 逐字）。

## 9. 实现要点（易错判据）

1. **getFieldId**：namePath.join('_')，formName 前缀；黑名单 'parentNode' ⇒ `form_item_` 前缀。
2. **getStatus**：validateStatus prop > validating > errors > warnings >
   (touched || (hasFeedback && validated)) ⇒ success。
3. **NoFormStyle(status=true)** 在 Form 根 —— FormItemInputContext 的状态在 Form 层被删
   （嵌套 Form 时不串态）。
4. **label===null 的 wrapperCol offset 自动补**（responsive 逐档，label.span < 24）。
5. **colon 正则去重** `/[:|：]\s*$/`；vertical 布局无 colon。
6. **ErrorList debounce**（useDebounce）+ 动效 `-${p}-show-help(-item)`（本仓 motion 有
   collapse 动效类）。
7. **additional minHeight** = marginBottom（motion 测量）+ extraHeight（extra 实测高）。
8. **tooltip 默认图标** QuestionCircleOutlined、tabIndex=-1、onClick preventDefault。
9. **noStyle 错误上抛链**：NoStyleItemContext 逐级 notify + List 的 getKey 映射
   fieldKey（form-core list 已有 ListContext）。
10. **form-core Form（FieldForm 壳）已存在**：Form.vue 是它的**壳**（context/类名/
    scrollToFirstError），别重复实现 store 逻辑。

## 10. 风险与规模

- antd 展示层 1930 行 → Vue 约 1500–1800 行（Form 壳/Item/Label/Input/Holder/Status/
  ErrorList/List/context/hooks/util + 样式 486 行翻译 + 10 token）。
- 最大风险：Field control 注入的 Vue 等价（props 合并 + trigger 事件合成 + ref 收集）与
  noStyle 错误上抛链；grid 的 Col 依赖（本仓 grid 已收口 ✓）。
- 测试重点：getFieldId、status 决策树、colon/requiredMark 三形态、ErrorList 动效 DOM、
  noStyle 聚合、List 增删移、scrollToFirstError、aria 注入。
