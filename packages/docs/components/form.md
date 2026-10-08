---
title: Form 表单
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

# Form 表单

具有数据收集、校验和提交功能的表单，包含复选框、单选框、输入框、下拉选择框等元素。

## 何时使用

- 需要创建一个原生表单，可能包含各种交互式控件；
- 提交前需要校验用户输入（同步/异步规则）；
- 需要动态增删表单项（`Form.List`）。

## 引入

```ts
import { Form, FormItem, FormList, useForm, useWatch, ErrorList } from '@apollo-design/ui';
// 或复合写法
import { Form } from '@apollo-design/ui';
const { Item, List, useForm, useWatch, ErrorList } = Form;
```

:::

## 代码演示

::: v-pre

**basic**：最基础的表单：`Form.Item` 包裹控件，`rules` 声明校验。\n

:::

<DemoPreview component="form" demo="basic" />

::: v-pre

**customized-form-controls**：内联表单与提交按钮（`html-type="submit"`）。\n

:::

<DemoPreview component="form" demo="customized-form-controls" />

::: v-pre

**label**：label 定制：required 标记 / optional 文案 / 无 label（control 顶格）/ 无冒号 / tooltip。\n

:::

<DemoPreview component="form" demo="label" />

::: v-pre

**layout**：三种布局：`horizontal` / `vertical` / `inline`。\n

:::

<DemoPreview component="form" demo="layout" />

::: v-pre

**validate-status**：校验状态（`validateStatus` + `hasFeedback`）：错误/警告/校验中。\n

:::

<DemoPreview component="form" demo="validate-status" />

::: v-pre

## API

### FormProps

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| form | 表单实例（`useForm()` 创建） | FormInstance | - |
| name | 表单名（fieldId 前缀 + FormProvider 注册键） | string | - |
| layout | 布局 | 'horizontal' \| 'vertical' \| 'inline' | 'horizontal' |
| labelCol / wrapperCol | label / 控件列宽（grid ColProps） | ColProps | - |
| labelAlign | label 对齐 | 'left' \| 'right' | 'right' |
| labelWrap | label 换行 | boolean | - |
| colon | 冒号（vertical 布局无效） | boolean | - |
| requiredMark | 必填标记 | boolean \| 'optional' \| (label, info) => VNodeChild | true |
| initialValues | 初值 | object | - |
| validateMessages | 校验文案模板 | ValidateMessages | - |
| validateTrigger | 触发校验的事件 | string \| string[] \| false | 'onChange' |
| preserve | 字段卸载后保留值 | boolean | true |
| disabled | 整表禁用 | boolean | - |
| size / variant / tooltip / feedbackIcons | 表单态 | - | - |
| scrollToFirstError | 校验失败滚动到首个错误字段 | boolean \| ScrollOptions | - |
| component | 容器元素（false 不渲染） | string \| Component \| false | 'form' |
| classNames / styles | 语义槽（root/label/content/help/helpItem/extra） | object | - |

### 事件（Emits）

`finish(values)` / `finishFailed(errorInfo)` / `valuesChange(changed, all)` / `fieldsChange(changed, all)`；`update:*` 不适用（值由 store 管理）。

### FormInstance（expose）

`getFieldValue` / `getFieldsValue` / `setFieldValue` / `setFieldsValue` / `resetFields` / `validateFields` / `submit` / `getFieldsError` / `getFieldError` / `isFieldsTouched` / `setFields` / `scrollToField(name, options)` / `focusField(name)` / `nativeElement`。

### Form.Item

props：`name`（NamePath）、`rules`、`dependencies`、`trigger`、`valuePropName`、`getValueFromEvent`、`getValueProps`、`normalize`、`validateTrigger`、`validateFirst`、`preserve`、`initialValue`、`messageVariables`、`shouldUpdate`；展示：`label` / `labelCol` / `wrapperCol` / `colon` / `required` / `requiredMark` / `tooltip` / `noStyle` / `help` / `extra` / `hasFeedback` / `validateStatus` / `hidden` / `htmlFor` / `layout`。

slots：`default`（子控件；有 name 时控件被注入 value 与事件）、`label` / `help` / `extra`。

### Form.List

props：`name`。scoped slot `(fields, operation, meta)` —— `fields: { name, key, fieldKey }[]`、`operation: { add, remove, move }`、`meta: { errors, warnings }`。`Form.ErrorList` 用于展示 List 级错误。

### useWatch

`useWatch(dependencies, form, options)` —— 监听单个字段值。

### 主题变量

10 个（`labelRequiredMarkColor` / `labelColor` / `labelFontSize` / `labelHeight` / `verticalLabelHeight` / `labelColonMarginInlineStart` / `labelColonMarginInlineEnd` / `itemMarginBottom` / `verticalLabelPadding` / `verticalLabelMargin`）。

:::
