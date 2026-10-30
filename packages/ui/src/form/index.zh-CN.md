---
category: 数据录入
title: Form
subtitle: 表单
titleTemplate: '%s - @apollo-design/ui'
description: 数据采集与校验，支持输入、选择、嵌套与列表字段。
---

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

## 代码演示

### 基本

<code src="./demo/basic.vue"></code>

### 表单布局

<code src="./demo/layout.vue"></code>

### 校验状态

<code src="./demo/validate-status.vue"></code>

### 自定义表单控件

<code src="./demo/customized-form-controls.vue"></code>

### label 定制

<code src="./demo/label.vue"></code>

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
| renderProps | 让默认槽的 values 随 store 更新；字段仍处理自身状态与重置 | boolean | false |
| classNames / styles | 语义槽（root/label/content/help/helpItem/extra）。⚠️ 也接受**函数形态**（`(info) => …`）；根槽与 `ConfigProvider components.form` 及调用方原生 `class` / `style` **合并**（原生 `style` 胜） | object \| function | - |

### 事件（Emits）

`finish(values)` / `finishFailed(errorInfo)` / `valuesChange(changed, all)` / `fieldsChange(changed, all)`；`update:*` 不适用（值由 store 管理）。

默认作用域插槽为 `{ values, form }`。例如 `<Form render-props v-slot="{ values }">…</Form>`；普通字段表单可省略 `render-props`，字段继续独立订阅。

### FormInstance（expose）

`getFieldValue` / `getFieldsValue` / `setFieldValue` / `setFieldsValue` / `resetFields` / `validateFields` / `submit` / `getFieldsError` / `getFieldError` / `isFieldsTouched` / `setFields` / `scrollToField(name, options)` / `focusField(name)` / `nativeElement`。

### Form.Item

props：`name`（NamePath）、`rules`、`dependencies`、`trigger`、`valuePropName`、`getValueFromEvent`、`getValueProps`、`normalize`、`validateTrigger`、`validateFirst`、`preserve`、`initialValue`、`messageVariables`、`shouldUpdate`；展示：`label` / `labelCol` / `wrapperCol` / `colon` / `required` / `requiredMark` / `tooltip` / `noStyle` / `help` / `extra` / `hasFeedback` / `validateStatus` / `hidden` / `htmlFor` / `layout`。

slots：`default({ control, meta, form })`（子控件；有 name 时单个控件被注入 value 与事件）、`label` / `help` / `extra`。无字段的布局项也提供同一对象，control 为空、meta 为当前空状态；脱离 Form 的布局项 form 为 undefined。

事件：`reset()` / `metaChange(meta)`，分别使用 `@reset` / `@meta-change`。组件不手动调用同名回调 Prop。

动态 `prefixCls` 与布局变更会更新派生类、真实控件的反馈图标、错误/帮助内容，并按已加载 CSS 重新测量 margin 占位。`Form.ErrorList` 独立使用时读取 ConfigProvider 前缀；在 Form.Item / Form.List 中使用最近的前缀上下文。动态前缀需要预先提供对应的静态 CSS，组件不会生成运行时样式。

### Form.List

props：`name`。scoped slot `{ fields, operations, meta }` —— `fields: { name, key, fieldKey }[]`、`operations: { add, remove, move }`、`meta: { errors, warnings }`。`Form.ErrorList` 用于展示 List 级错误。

### useWatch

`useWatch(dependencies, form)` 或 `useWatch(dependencies, { form, preserve })` —— 返回监听字段路径/selector 的 Ref，随调用它的 effect scope 释放。

开发版直接把 Form / Form.Item 的旧位置参数槽迁为具名对象，不提供兼容层或弃用期。Form.List 既有对象作用域保持不变。校验器、取值/归一算法与异步业务回调仍是函数。

### 主题变量

10 个（`labelRequiredMarkColor` / `labelColor` / `labelFontSize` / `labelHeight` / `verticalLabelHeight` / `labelColonMarginInlineStart` / `labelColonMarginInlineEnd` / `itemMarginBottom` / `verticalLabelPadding` / `verticalLabelMargin`）。
