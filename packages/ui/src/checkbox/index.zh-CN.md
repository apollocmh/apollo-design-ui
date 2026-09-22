---
category: 数据录入
title: Checkbox
subtitle: 多选框
---

一组备选项中进行多选。

## 何时使用

- 在一组备选项中进行多项选择时。
- 单独使用可以表示两种状态之间的切换（配合 `indeterminate` 可表达半选）。

## 代码演示

见 [`demo/`](./demo)（8 个，与 antd 非 debug demo 一一对应）。

## API

### Checkbox

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| checked | 指定当前是否选中（受控） | `boolean` | — |
| defaultChecked | 初始是否选中 | `boolean` | `false` |
| indeterminate | 设置 indeterminate 状态（只影响样式与 `input.indeterminate`） | `boolean` | `false` |
| disabled | 失效状态（`props ?? group.disabled ?? DisabledContext`） | `boolean` | — |
| value | ⚠️ 组外不是有效 prop（发 usage 告警）；在 Group 内是选项值 | `unknown` | — |
| skipGroup | 脱离 Group 的管理 | `boolean` | `false` |
| name / id / tabIndex / required / autoFocus / title | 原生属性（落到 `<input>` / `<span>`） | — | — |
| onChange | 变化时回调 | `(e: CheckboxChangeEvent) => void` | — |
| onClick / onMouseEnter / onMouseLeave / onFocus / onBlur / onKeyDown / onKeyPress | 透传（onClick 有冒泡锁） | — | — |
| classNames / styles | 语义槽 `{ root, icon, label }`（对象或函数） | — | — |

### CheckboxChangeEvent

`{ target: { ...props, type: 'checkbox', checked }, stopPropagation, preventDefault, nativeEvent }`

### Checkbox.Group

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| options | 指定可选项（字符串/数字 ⇒ `{label, value}`；过滤空 value） | `(string \| number \| CheckboxOptionType)[]` | `[]` |
| value / defaultValue | 指定选中项（受控 / 非受控） | `T[]` | `[]` |
| onChange | 选中项变化时的回调（按 options/注册顺序排序、过滤已移除的值） | `(checkedValue: T[]) => void` | — |
| disabled | 整组失效（option 的 `disabled` 优先） | `boolean` | — |
| name | 组内全部 input 的 name（同时落根 div） | `string` | — |
| role | 根元素 role | `string` | `'group'` |
| className / rootClassName / style | 根元素属性 | — | — |

### 插槽

| 名称 | 说明 |
|---|---|
| default | Checkbox 文本（isRenderable 判据：`0` 渲染、`false`/`''` 不渲染） |
| Group default | 自定义子 Checkbox（与 options 二选一） |

## Ref

| 名称 | 类型 |
|---|---|
| nativeElement | `HTMLElement \| null` |
| input | `HTMLInputElement \| null` |
| focus / blur | `(options?: FocusOptions) => void` / `() => void` |

Group 的 ref 是 `HTMLDivElement`。

## Theme（Component Token）

无 —— Checkbox 没有任何 Component Token（antd 同），样式全部消费 alias token
（尺寸 = `controlInteractiveSize`）。用户想改样式用语义化 `classNames` / `styles`。
