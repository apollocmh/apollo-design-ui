---
category: 数据录入
title: Rate
subtitle: 评分
---

评分组件。

## 何时使用

- 对内容进行快速评级操作。
- 展示评价结果（配合 `disabled` 只读态）。

## 代码演示

见 [`demo/`](./demo)（9 个，覆盖 antd 的主要用户场景）。

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| value | 当前值（受控，`v-model:value`） | `number` | — |
| defaultValue | 默认值 | `number` | `0` |
| count | 星星总数 | `number` | `5` |
| allowHalf | 允许半星 | `boolean` | `false` |
| allowClear | 再次点击同值清零 | `boolean` | `true` |
| keyboard | 键盘方向键控制 | `boolean` | `true` |
| disabled | 只读（与 DisabledContext 合并） | `boolean` | `false` |
| size | 尺寸 | `'large' \| 'middle' \| 'small'` | `'middle'` |
| tooltips | 每颗星的提示（string 或 TooltipProps 对象） | `(TooltipProps \| string)[]` | — |
| direction | 文本方向（rtl 时半星/方向键反向） | `'ltr' \| 'rtl'` | `'ltr'` |
| autoFocus | 挂载后自动聚焦 | `boolean` | `false` |
| tabIndex | 当前星项焦点入口的 tabIndex；其余星项及根元素为 `-1` | `number` | `0` |
| id | 根 `ul` 的 id | `string` | — |
| prefixCls | 组件类名前缀 | `string` | `apollo-rate` |

### Events

| 事件 | 说明 | 载荷 |
|---|---|---|
| update:value | 评分更新请求，供 `v-model:value` 使用 | `number` |
| change | 评分更新请求，先于 `update:value` 触发 | `number` |
| hoverChange | 当前悬停值；移出时为 `undefined` | `number \| undefined` |
| focus | 焦点进入评分组 | `FocusEvent` |
| blur | 焦点离开评分组；组内移动不重复触发 | `FocusEvent` |

组件事件支持 Vue 的 `.once`。`@keydown`、`@mouseleave` 等原生监听器及 `class` / `style`、`aria-label`、`aria-labelledby`、`data-*` 落在根 `ul`，键盘事件先处理评分再通知监听器。disabled 时抑制键盘处理与通知。已有 `onKeyDown` / `onMouseLeave` 拼写仍走同一原生事件通道。

`value` 为受控值：父级未回传时保持原评分；移除 `value` 后沿用最后一次已接收值。`defaultValue` 只用于非受控初始值。悬停仅改变预览和 `#character.value`，不会改变已选项或模型。

根元素为 `radiogroup`，请提供 `aria-label` 或 `aria-labelledby`。当前星项是唯一的 Tab 入口；评分为 `0` 时进入第一项，半星值由对应的下一整星项表示并读出实际值。左右方向键更新评分并跟随焦点，RTL 时方向反转，Enter/空格选择当前项，`allowClear` 允许再次激活清零。disabled 时全部星项退出 Tab 序列。

### Slots

| 插槽 | 说明 | 参数 |
|---|---|---|
| #character | 自定义星星字符（默认 StarFilled） | `{ index, value, allowHalf, disabled, count, focused }` |
| #characterRender | 包装整颗星节点（tooltips 包装在内层组合生效） | `{ node, index }` |

> ⚠️ C8-R2：antd 的 `character`（ReactNode）与 `characterRender`（fn）在本仓**一律是
> 插槽**，不保留同名 prop。`tooltips` 是数据 prop（string / TooltipProps 对象），保留。

### Expose

| 方法 | 说明 |
|---|---|
| focus() | 聚焦当前星项（disabled 时无效） |
| blur() | 移除评分组内的实际焦点（disabled 时无效） |

### 开发期迁移

`change`、`hoverChange`、`focus`、`blur` 已声明为 Vue emits，原有 `@change` / `onChange` 等监听写法继续工作。`focus` / `blur` 现在提供原生 `FocusEvent`；焦点与 `tabIndex` 的目标由根容器调整为当前 radio 项。`#character.value` 与视觉预览一致；动态添加或移除 tooltips 保留星项 DOM 和焦点。

## 设计说明

- **rc-rate 1.0.1 内核的 Vue 自建**（Rate + Star + util.getOffsetLeft 逐字移植）。
- **cleanedValue**：allowClear 重置后记录被清的值，hover 判据 `nextHoverValue !== cleanedValue`
  防止清零后 hover 回同一值闪烁。
- **tooltips × characterRender 组合**：antd 里用户 characterRender 会覆盖 tooltip 包装
  （JSX spread 在后）；本仓为 slot 组合（先 Tooltip 再用户插槽）。
- hover 时整条星星按 `hoverValue ?? value` 重算类名（rc 语义）。
