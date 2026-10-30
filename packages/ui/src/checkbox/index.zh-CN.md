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

见 [`demo/`](./demo)（8 个，覆盖 antd 的主要用户场景）。

## API

### Checkbox

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| checked | 指定当前是否选中（受控） | `boolean` | — |
| defaultChecked | 初始是否选中 | `boolean` | `false` |
| indeterminate | 设置 indeterminate 状态（只影响样式与 `input.indeterminate`） | `boolean` | `false` |
| disabled | 失效状态（`props ?? group.disabled ?? DisabledContext`） | `boolean` | — |
| value | ⚠️ 组外不是有效 prop（发 usage 告警）；在 Group 内是选项值 | `string \| number \| boolean` | — |
| skipGroup | 脱离 Group 的管理 | `boolean` | `false` |
| name / id / tabIndex / required / autoFocus / title | 原生属性（落到 `<input>` / `<span>`） | — | — |
| @change | 原生变化事件与提议 checked 快照 | `(event: Event, checked: boolean)` | — |
| @click / @mouseenter / @mouseleave / @focus / @blur / @keydown / @keypress | 控件拥有的原生事件（click 保留冒泡锁） | 原生事件 | — |
| classNames / styles | 语义槽 `{ root, icon, label }`（对象或函数） | — | — |

### CheckboxChangeEvent

`CheckboxChangeEvent` 是原生 `Event` 的类型别名。首参可直接用于 Vue 原生事件修饰符；第二参 checked 保留本次提议，即使受控父级拒绝提议后 input.checked 已恢复。旧 target DTO/nativeEvent 包装已移除。

### Checkbox.Group

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| options | 指定可选项（字符串/数字 ⇒ `{label, value}`；过滤空 value） | `(string \| number \| CheckboxOptionType)[]` | `[]` |
| value / defaultValue | 指定选中项（受控 / 非受控） | `T[]`（T 为 string/number/boolean） | `[]` |
| @change | 选中项变化通知（按 options/注册顺序排序、过滤已移除的值） | `(checkedValue: T[]) => void` | — |
| disabled | 整组失效（option 的 `disabled` 优先） | `boolean` | — |
| name | 组内全部 input 的 name（同时落根 div） | `string` | — |
| role | 根元素 role | `string` | `'group'` |
| class / style | Vue 原生根属性（含 style 字符串和数组） | — | — |

### 插槽

| 名称 | 说明 |
|---|---|
| default | Checkbox 文本（isRenderable 判据：`0` 渲染、`false`/`''` 不渲染） |
| Group default | 自定义子 Checkbox（与 options 二选一） |

受控父级拒绝提议时，原生勾选态恢复最后接受值；撤控不会接受被拒绝的值。`skipGroup` 动态切换会同步值注册，并脱离组的选中、disabled/name 管理。原生 input 的 value 使用实际选项值，可直接参与 FormData。当前 `components.checkbox` 的 className/style/classNames/styles 支持响应式替换。

## Ref

| 名称 | 类型 |
|---|---|
| nativeElement | `HTMLElement \| null` |
| input | `HTMLInputElement \| null` |
| focus / blur | `(options?: FocusOptions) => void` / `() => void` |

Group 通过 ref 暴露 `nativeElement: HTMLDivElement | null`；所有元素在挂载前或卸载后均为 null。

## Theme（Component Token）

无 —— Checkbox 没有任何 Component Token（antd 同），样式全部消费 alias token
（尺寸 = `controlInteractiveSize`）。用户想改样式用语义化 `classNames` / `styles`。
