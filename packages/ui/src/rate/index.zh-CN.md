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

见 [`demo/`](./demo)（9 个，与 antd 用户可见 demo 一一对应）。

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
| tabIndex | 根元素的 tabIndex | `number` | `0` |
| onChange / onHoverChange / onFocus / onBlur / onKeyDown | 回调（props 形态） | — | — |

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
| focus() | 聚焦（disabled 时无效） |
| blur() | 失焦（disabled 时无效） |

## 设计说明

- **rc-rate 1.0.1 内核的 Vue 自建**（Rate + Star + util.getOffsetLeft 逐字移植）。
- **cleanedValue**：allowClear 重置后记录被清的值，hover 判据 `nextHoverValue !== cleanedValue`
  防止清零后 hover 回同一值闪烁。
- **tooltips × characterRender 组合**：antd 里用户 characterRender 会覆盖 tooltip 包装
  （JSX spread 在后）；本仓为 slot 组合（先 Tooltip 再用户插槽），登记 INTENDED。
- hover 时整条星星按 `hoverValue ?? value` 重算类名（rc 语义）。
