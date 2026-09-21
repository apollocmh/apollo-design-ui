---
category: 数据展示
title: Badge
subtitle: 徽标数
---

图标右上角的圆形徽标数字。

## 何时使用

- 一般出现在通知图标或头像的右上角位置，提示用户有消息或者有需要处理的项。
- 不强求数字一定要有确切的数值，也可以是文字或小红点。

## 代码演示

见 [`demo/`](./demo)（12 个，与 antd 非 debug demo 一一对应）。

| demo | 内容 |
|---|---|
| `basic` | 基本（count / showZero / 无 count） |
| `no-wrapper` | 独立使用 |
| `overflow` | 封顶数字 |
| `dot` | 讨嫌的小红点 |
| `change` | 动态（数字滚动） |
| `link` | 可点击 |
| `offset` | 位移 |
| `size` | 大小 |
| `status` | 状态点 |
| `colorful` | 多彩徽标（13 预设色） |
| `ribbon` | 缎带（Badge.Ribbon） |
| `style-class` | 自定义语义结构的样式和类 |

## API

### Badge

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| count | 展示的数字（`null` 不显示；超出封顶显示 `+`） | `VNodeChild` | `null` |
| overflowCount | 封顶值 | `number` | `99` |
| dot | 只显示小红点（优先级高于 count） | `boolean` | `false` |
| showZero | 数值为 0 时是否显示 | `boolean` | `false` |
| size | 尺寸（`default` 已废弃，等价 `medium`） | `'medium' \| 'small'` | `'medium'` |
| status | 状态点 | `'success' \| 'processing' \| 'error' \| 'default' \| 'warning'` | — |
| color | 自定义颜色（13 预设键走类名，其它色串走内联） | `string` | — |
| text | 状态文本 | `VNodeChild` | — |
| title | 原生 title（`null`/`false` 显式禁用；不传回落 count） | `string \| null \| false` | — |
| offset | 偏移 `[x, y]`：x → `inset-inline-end`，y → `margin-top` | `[number \| string, number \| string]` | — |
| classNames / styles | 语义槽位（root / indicator） | — | — |

### Badge.Ribbon

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| text | 丝带文本 | `VNodeChild` | — |
| color | 颜色 | `string` | — |
| placement | 挂靠角 | `'start' \| 'end'` | `'end'` |
| classNames / styles | 语义槽位（root / indicator / content） | — | — |

## Theme

### Component Token（9 个）

| Token | 默认值 | 说明 |
|---|---|---|
| indicatorZIndex | `auto` | 指示器 z-index |
| indicatorHeight | `20px` | count 高度 |
| indicatorHeightSM | `14px` | 小尺寸高度 |
| dotSize | `6px` | 小红点尺寸 |
| textFontSize | `12px` | 状态文本字号 |
| textFontSizeSM | `12px` | 小尺寸文本字号 |
| textFontWeight | `normal` | 状态文本字重 |
| statusSize | `6px` | 状态点尺寸 |
| paddingInline | `8px` | 多字符内边距 |

## 设计说明

- 判据链（Badge.js 原样）：`isZero`（值与串都算）→ `ignoreCount` → `hasStatus` →
  `isStatusBadge`（无 children 的状态点独立渲染分支）。
- 三组 ref 缓存（livingCount / displayCount / isDot）：离场动画期间保持上一次的显示值。
- 整数才拆位（`count && Number(count) % 1 === 0`，count=0 不拆 —— 上游真值判据）。
- 数字滚动：SingleNumber 渲染 value…value+10 单位序列 + `translateY` 过渡，
  `onTransitionEnd`（+1s 兜底）回写。
- offset：数字手动补 px（Vue patchStyle 不转换）；x 取负写 `inset-inline-end`。
- borderColor 旧用法 → `box-shadow: 0 0 0 1px {borderColor} inset`。
