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

见 [`demo/`](./demo)（13 个，包含数字计数与模板富内容场景）。

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
| `content-slots` | 可切换富内容、空插槽、数字计数与圆点 |

## API

### Badge

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| prefixCls | DOM 类名前缀；任意前缀的 CSS 由调用方提供 | `string` | `apollo-badge` |
| scrollNumberPrefixCls | 数字轨道类名前缀 | `string` | `apollo-scroll-number` |
| count | 展示的数字（`null` 不显示；超出封顶显示 `+`） | `VNodeChild` | `null` |
| overflowCount | 封顶值 | `number` | `99` |
| dot | 只显示小红点，覆盖 count（含零值） | `boolean` | `false` |
| showZero | 数值为 0 时是否显示 | `boolean` | `false` |
| size | 尺寸（`default` 已废弃，等价 `medium`） | `'medium' \| 'small'` | `'medium'` |
| status | 状态点 | `'success' \| 'processing' \| 'error' \| 'default' \| 'warning'` | — |
| color | 自定义颜色（13 预设键走类名，其它色串走内联） | `string` | — |
| text | 状态文本 | `VNodeChild` | — |
| title | 指示器原生 title，含独立状态点；`null`/`false` 禁用，不传回落标量 count | `string \| null \| false` | — |
| offset | 偏移 `[x, y]`：x → `inset-inline-end`，y → `margin-top` | `[number \| string, number \| string]` | — |
| classNames / styles | 语义槽位（root / indicator） | — | — |

Vue 原生 `class` / `style`（对象、字符串、数组）、id、ARIA、tabindex 和监听器落根 span；指示器样式用 `styles.indicator`。Badge 不声明业务 emits 或 v-model；原生事件只触发一次。状态与计数共用根，父级更新保留业务内容、草稿和所属焦点。

非标量 count（VNode、数组、Fragment、多根组件、文本节点）与 #count 共用原生指示器和完整内容路径，不克隆业务节点。语义类/样式、title、offset 作用于指示器，子节点保留自身属性与身份。Vue 空内容不产生空徽标，独立 text 不依赖 count 可见性；条件组件为空时隐藏空宿主，保留业务实例。

### Badge 插槽

| 插槽 | 说明 |
| --- | --- |
| default | 被徽标包裹的内容 |
| count | 静态富内容指示器；覆盖 count prop，不进行封顶或数字位滚动 |
| text | 富文本状态文案；覆盖 text prop |

插槽按存在性优先，空结果隐藏对应内容；条件插槽移除后恢复 prop。`#count` 中的文本 `0` 按静态内容展示，`showZero` 和 `overflowCount` 控制数字 prop 分支；`dot` 仍优先于两种计数内容。富内容保留 indicator 样式、offset 与离场缓存，未显式设置 title 时不从 VNode 生成标题。数字滚动继续使用 count prop。

### Badge.Ribbon

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| prefixCls | DOM 类名前缀 | `string` | `apollo-ribbon` |
| className | 丝带本体的独立类；根类使用 Vue class | `string` | — |
| text | 丝带文本 | `VNodeChild` | — |
| color | 颜色 | `string` | — |
| placement | 挂靠角 | `'start' \| 'end'` | `'end'` |
| classNames / styles | 语义槽位（root / indicator / content） | — | — |

Ribbon 的 default 是被包裹内容，`#text` 是完整丝带内容。text 支持所有 VNodeChild，含数组、Fragment 和 0；插槽存在则优先，空槽不回退，条件槽移除后恢复 prop。原生 class/style 和其他 attrs 落 wrapper，丝带样式用 styles.indicator，文字样式用 styles.content。

### Expose 与当前配置

BadgeRef / RibbonRef 只读 `nativeElement: HTMLElement | null` 指向当前实际根，卸载后为空。ConfigProvider.components.badge / ribbon 的配置、方向和前缀保持响应性；语义对象或函数替换、移除立即生效。配置字段 style 保留独立目标：Badge 状态独立模式为 root、其他为 indicator；Ribbon 为 indicator。它与组件原生 style attrs 不同，明确区域推荐 styles。

## Theme

### Component Token（9 个）

| Token | 默认值 | 说明 |
|---|---|---|
| indicatorZIndex | `auto` | 指示器 z-index |
| indicatorHeight | `20px` | count 高度 |
| indicatorHeightSM | `14px` | 小尺寸高度 |
| dotSize | `6px` | 小红点尺寸 |
| textFontSize | `12px` | 计数字号 |
| textFontSizeSM | `12px` | 小尺寸计数字号 |
| textFontWeight | `normal` | 计数字重 |
| statusSize | `6px` | 状态点尺寸 |
| paddingInline | `8px` | 多字符内边距 |

九值由当前 Alias 派生，`theme.components.Badge` 可覆盖；适用 0、配置替换和移除均生效，显式根 CSS 变量优先。size/数字轨道使用相同实际高度。系统 reduced-motion 下停用波纹、滚动和出入场动画。

普通实色 count / Ribbon 使用可读前景，不改变原预设背景；显式 indicator/content color 优先。覆盖渐变、透明背景或完整样式时由作者配对前景。数字动画的额外轨道不参与朗读；组件不自动创建 live region。offset 的数字/数字字符串按 px，带单位、百分比或表达式保留为 CSS 长度。

开发期根 style / 内容 / 数字和引用修正见 [迁移说明](../../../../docs/migrations/badge-contracts.md)。原始参考证据保留，不作为 Apollo 公共用法的判据。
