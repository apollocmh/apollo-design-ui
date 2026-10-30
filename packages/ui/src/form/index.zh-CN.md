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
| requiredMark | 必填标记；自定义内容使用 requiredMark 插槽 | boolean \| 'optional' | true |
| initialValues | 初值 | object | - |
| validateMessages | 校验文案模板 | ValidateMessages | - |
| validateTrigger | 触发校验的事件 | string \| string[] \| false | 'onChange' |
| preserve | 字段卸载后保留值 | boolean | true |
| clearOnDestroy | 表单卸载时清除值 | boolean | false |
| fields | 受控字段值及状态；数组替换和字段内更新都会同步 | FieldData[] | - |
| disabled | 整表禁用 | boolean | - |
| size / variant / tooltip | 表单态与标签提示配置 | - | - |
| scrollToFirstError | 校验失败滚动到首个错误字段 | boolean \| ScrollOptions | - |
| component | 容器元素（false 不渲染） | string \| Component \| false | 'form' |
| renderProps | 让默认槽的 values 随 store 更新；字段仍处理自身状态与重置 | boolean | false |
| classNames / styles | 语义槽（root/label/content/help/helpItem/extra）。⚠️ 也接受**函数形态**（`(info) => …`）；根槽与 `ConfigProvider components.form` 及调用方原生 `class` / `style` **合并**（原生 `style` 胜） | object \| function | - |

### 事件（Emits）

`finish(values)` / `finishFailed(errorInfo)` / `valuesChange(changed, all)` / `fieldsChange(changed, all)`；`update:*` 不适用（值由 store 管理）。

默认作用域插槽为 `{ values, form }`。例如 `<Form render-props v-slot="{ values }">…</Form>`；普通字段表单可省略 `render-props`，字段继续独立订阅。

内容槽：`requiredMark({ label, required })` 与 `feedbackIcon({ status, errors, warnings })`。`label` 是保留原始标签内容的稳定组件，模板中使用 `<component :is="label" />`。Form.Item 的同名 feedbackIcon 槽优先于 Form 槽；槽撤除后立即恢复当前默认内容。

### FormInstance（expose）

`getFieldValue` / `getFieldsValue` / `setFieldValue` / `setFieldsValue` / `resetFields` / `validateFields` / `submit` / `getFieldsError` / `getFieldError` / `getFieldWarning` / `isFieldsTouched` / `isFieldTouched` / `isFieldValidating` / `isFieldsValidating` / `setFields` / `getFieldInstance(name)` / `scrollToField(name, options)` / `focusField(name)` / `nativeElement`。

`getFieldInstance` 返回已挂载控件的真实 DOM 或 Vue 公开引用对象（`object | undefined`），保持调用方模板 ref 的身份；不能假定每个自定义 expose 都有 focus 方法。`focusField` 在实际支持的能力上聚焦，`scrollToField` 使用真实控件元素，`{ focus: true }` 可同时聚焦。`nativeElement` 是实际 HTML 容器，无容器时为 null。

### Form.Item

props：`name`（NamePath）、`rules`、`dependencies`、`trigger`、`valuePropName`、`getValueFromEvent`、`getValueProps`、`normalize`、`validateTrigger`、`validateFirst`、`preserve`、`initialValue`、`messageVariables`、`shouldUpdate`；展示：`label` / `labelCol` / `wrapperCol` / `colon` / `required` / `tooltip` / `noStyle` / `help` / `extra` / `hasFeedback`（boolean）/ `validateStatus` / `hidden` / `htmlFor` / `layout`。

slots：`default({ control, meta, form })`（子控件；有 name 时单个控件被注入 value 与事件）、`label` / `help` / `extra` / `tooltip` / `feedbackIcon({ status, errors, warnings })`。内容槽优先于对应 prop，显式空槽不会回退到 prop。无字段的布局项也提供同一对象，control 为空、meta 为当前空状态；脱离 Form 的布局项 form 为 undefined。

Form 与有布局壳的 Form.Item 将原生 class/style、属性和监听器落到各自实际根元素。noStyle 项与 Form.List 没有 DOM 根。labelCol/wrapperCol 使用 Grid ColProps 并可携带原生 class/style，嵌套布局项不会继承外层列宽。

事件：`reset()` / `metaChange(meta)`，分别使用 `@reset` / `@meta-change`。组件不手动调用同名回调 Prop。

动态 `prefixCls` 与布局变更会更新派生类、真实控件的反馈图标、错误/帮助内容，并按已加载 CSS 重新测量 margin 占位。`Form.ErrorList` 独立使用时读取 ConfigProvider 前缀；在 Form.Item / Form.List 中使用最近的前缀上下文。动态前缀需要预先提供对应的静态 CSS，组件不会生成运行时样式。

### Form.List

props：`name`。scoped slot `{ fields, operations, meta }` —— `fields: { name, key, fieldKey }[]`、`operations: { add, remove, move }`、`meta: { errors, warnings }`。`Form.ErrorList` 用于展示 List 级错误。

`Form.ErrorList` 接受 help/errors/warnings 与原生根属性，`visibleChanged(visible: boolean)` 是所属事件。重复消息保留独立行，离场行使用最后收到的内容，结束后释放布局占位；不再从已经移除的当前 keys 反查消息。

### useWatch

`useWatch(dependencies, form)` 或 `useWatch(dependencies, { form, preserve })` —— 返回监听字段路径/selector 的 Ref，随调用它的 effect scope 释放。

`useFormInstance()` 读取最近 Form 的现有实例；Form 外返回 undefined，不创建新 store。重复 `useForm(form)` 与直接传给 Form 的同一外建实例共用控件注册表。

开发版直接把 Form / Form.Item 的旧位置参数槽迁为具名对象；requiredMark 内容函数、feedbackIcons 与 hasFeedback.icons 改用上述内容槽，不提供兼容层或弃用期。Form.List 既有对象作用域保持不变。校验器、取值/归一算法与异步业务回调仍是函数。

### 主题变量

11 个（`labelRequiredMarkColor` / `labelColor` / `labelFontSize` / `labelHeight` / `verticalLabelHeight` / `labelColonMarginInlineStart` / `labelColonMarginInlineEnd` / `itemMarginBottom` / `verticalLabelPadding` / `verticalLabelMargin` / `inlineItemMarginBottom`）。

使用 `ConfigProvider theme.components.Form` 配置，支持当前主题/组件 Token 替换与撤除，并作用于独立 Form.Item。长度数值会转换为 px；`verticalLabelHeight` 也接受 `'auto'`。原生 style 中的 `--apollo-form-*` 变量保留局部覆盖优先级，自定义前缀使用对应的变量前缀。
