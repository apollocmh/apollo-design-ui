---
category: 数据录入
title: Switch
subtitle: 开关
---

开关选择器。

## 何时使用

- 需要表示**开 / 关**两种状态，且切换后立即生效（不需要点「确定」）。
- 与复选框的区别：开关的语义是「立即生效的状态」，复选框是「待提交的选择」。

## 代码演示

见 [`demo/`](./demo)（7 个，覆盖 antd 的主要用户场景）。

## API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| checked | 指定当前是否选中（受控） | `boolean` | — |
| defaultChecked | 初始是否选中（非受控） | `boolean` | `false` |
| value | ⚠️ `checked` 的**别名**（antd `@since 5.12.0`） | `boolean` | — |
| defaultValue | ⚠️ `defaultChecked` 的**别名** | `boolean` | — |
| onChange | `change` 事件的监听器写法（**两个参数**；`disabled` 时不触发） | `(checked: boolean, event: MouseEvent \| KeyboardEvent) => void` | — |
| onClick | 原生 click 事件监听器；状态从 change / v-model 获取 | `(event: MouseEvent) => void` | — |
| checkedChildren | 选中时的内容 | `VNodeChild` | — |
| unCheckedChildren | 未选中时的内容 | `VNodeChild` | — |
| disabled | 失效状态 | `boolean` | — |
| loading | 加载中；⚠️ 会**强制**失效（`\|\|` 判据） | `boolean` | `false` |
| size | 尺寸；⚠️ `'default'` 已废弃（提示改用 `'medium'`） | `'small' \| 'medium' \| 'middle' \| 'default'` | — |
| autoFocus | 自动获取焦点 | `boolean` | — |
| title / id / tabIndex | 原生属性（落 `<button>`） | — | — |
| class / style | **根元素原生 attrs**（不是 Props） | — | — |
| classNames / styles | 语义槽 `{ root, content, indicator }`（对象或函数） | — | — |

`checked` 优先于 `value`；`defaultChecked` 优先于 `defaultValue`，默认值只用于初始化。受控交互只提出更新，显示状态由父级回传决定；撤销两个受控值后保留最后已接受的状态。

### Slots

| 插槽 | 说明 |
|---|---|
| checkedChildren | 选中内容；存在时优先于同名 prop，包括有意为空的内容 |
| unCheckedChildren | 未选中内容；存在时优先于同名 prop，包括有意为空的内容 |

插槽内容会随当前渲染更新；条件插槽消失时恢复同名 prop。支持文本、数字（含 `0`）、VNode 和数组。

### ConfigProvider

`components.switch` 支持 `SwitchConfig` 的 `className`、`style`、`classNames` 和 `styles`。同一区域的类名拼接，样式按 Provider `styles` → Provider 根 `style` → 组件 `styles` → 原生根 `style` 合并，后者优先；配置替换和撤销会即时生效。

未指定的 `disabled` 和 `size` 分别跟随 `componentDisabled`、`componentSize`。全局 `large` 使用 Switch 的常规 `medium` 尺寸；显式组件 prop 优先，`loading` 始终禁用交互。语义函数读取当前解析后的 `size` 和 `disabled`。

### Events

| 事件 | 说明 | 参数 |
|---|---|---|
| update:checked | `v-model:checked` 通道（与 `onChange` 同时发出） | `boolean` |
| update:value | `v-model:value` 通道（别名通道，同上） | `boolean` |
| change | 声明的 Vue 语义事件；每次点击或方向键更新时发送一次，`disabled` 时不发送 | `(checked: boolean, event: MouseEvent \| KeyboardEvent)` |
| click | 原生按钮点击，含键盘激活；方向键不合成点击 | `MouseEvent` |

`@change` 与 `onChange` 注册同一事件，不会额外监听原生 DOM `change`。`@click` 只接收原生 `MouseEvent`，支持 `.stop` / `.prevent` / `.once`；不再传旧 `(checked, event)`，无兼容层或弃用期。迁移状态读取到 `@change` 或 `v-model:checked`。

原生根 `style` 支持字符串、对象和数组，与语义 root 样式按 Vue 规则合并；调用方样式优先。
原生小写 `tabindex` / `autofocus` 同样落在按钮；同时提供时，显式 `tabIndex` / `autoFocus` prop 优先。

### 键盘

| 按键 | 行为 |
|---|---|
| `ArrowLeft` | 置为未选中（`disabled` 时不生效） |
| `ArrowRight` | 置为选中（`disabled` 时不生效） |
| `Space` / `Enter` | 原生 `<button>` 的激活行为（等价点击） |

方向键使用标准 `KeyboardEvent.key` 并阻止滚动；Space/Enter 交由按钮原生激活，只产生一次 click 和状态变更。

## Ref

| 名称 | 类型 |
|---|---|
| nativeElement | `HTMLButtonElement \| null` |
| focus / blur | `(options?: FocusOptions) => void` / `() => void` |

> ⚠️ antd 的 `ref` 直接是 `HTMLButtonElement`；本仓按组件库惯例暴露对象
> （迁移时 `ref.current.focus()` → `ref.value.focus()`）。

## Theme（Component Token）

13 个，与 antd 的 `ComponentToken` 逐字段对齐（CSS 变量形态 `--apollo-switch-*`）。

| Token | 说明 | 默认值 |
|---|---|---|
| trackHeight | 开关高度 | `22px` |
| trackHeightSM | 小号开关高度 | `16px` |
| trackMinWidth | 开关最小宽度 | `44px` |
| trackMinWidthSM | 小号开关最小宽度 | `28px` |
| trackPadding | 开关内边距 | `2px` |
| handleBg | 把手背景色 | `#fff` |
| handleShadow | 把手阴影 | `0 2px 4px 0 rgba(0,35,11,0.2)` |
| handleSize | 把手大小 | `18px` |
| handleSizeSM | 小号把手大小 | `12px` |
| innerMinMargin | 内容区最小边距 | `9px` |
| innerMaxMargin | 内容区最大边距 | `24px` |
| innerMinMarginSM | 小号内容区最小边距 | `6px` |
| innerMaxMarginSM | 小号内容区最大边距 | `18px` |

> ⚠️ 这 13 个是**构建期算好的解析值**，不随主题缩放（其中 `handleBg` / `handleShadow`
> 在 dark 主题下会与 antd 分叉，已登记）。零运行时下用 CSS 变量覆盖即可自定义：

```css
.my-scope .apollo-switch {
  --apollo-switch-track-height: 14px;
  --apollo-switch-handle-size: 20px;
}
```

## FAQ

**禁用时点击会触发吗？**
真实用户交互及按钮的原生 `.click()` 由浏览器抑制，不发 click/change/update。显式 `dispatchEvent` 仍是普通 DOM 派发：监听器收到原生事件，但不会改变禁用状态或发送 change/update。

**`value` 和 `checked` 有什么区别？**
没有区别 —— `value` / `defaultValue` 是 `checked` / `defaultChecked` 的别名
（antd 5.12.0 起为表单场景加的）。两者同时传时 `checked` 优先。
