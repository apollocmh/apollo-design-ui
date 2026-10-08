---
title: Switch 开关
outline: [2, 3]
---

<!-- ⚠️ 本文件由 scripts/gen-component-pages.mjs 生成，请勿手改；改 packages/ui/src/<c>/index.zh-CN.md -->

::: v-pre

开关选择器。

## 何时使用

- 需要表示**开 / 关**两种状态，且切换后立即生效（不需要点「确定」）。
- 与复选框的区别：开关的语义是「立即生效的状态」，复选框是「待提交的选择」。

:::

## 代码演示

::: v-pre

**basic**：最简单的用法：`defaultChecked` 非受控；`@change` 回调收到 `(checked, event)`。

:::

<DemoPreview component="switch" demo="basic" />

::: v-pre

**component-token**：> 等价替换：antd 用 `ConfigProvider theme.components.Switch` 覆盖 Component Token；
> 本仓零运行时 —— Component Token 即 CSS 变量，在容器上覆盖 `--apollo-switch-*` 即可。
覆盖 `trackHeight` / `trackMinWidth` / `trackPadding` / `handleSize` / `handleBg` /
`handleShadow` 后的效果（把手比轨道大，探出轨道外）。

:::

<DemoPreview component="switch" demo="component-token" />

::: v-pre

**disabled**：`disabled` 让开关失效；`loading` 同样会强制失效（内部是 `||` 判据）。

:::

<DemoPreview component="switch" demo="disabled" />

::: v-pre

**loading**：`loading` 表示正在加载：把手位置显示一个转圈图标，并**强制**不可交互。

:::

<DemoPreview component="switch" demo="loading" />

::: v-pre

**size**：`size="small"` 得到小号开关；`size="default"` 已废弃（会提示改用 `"medium"`）。

:::

<DemoPreview component="switch" demo="size" />

::: v-pre

**style-class**：通过 `classNames` / `styles` 自定义三槽（root / content / indicator）；两者都支持对象与
函数两种形态，函数形态能拿到合并后的 props（如 `size`）。

:::

<DemoPreview component="switch" demo="style-class" />

::: v-pre

**text**：`checkedChildren` / `unCheckedChildren` 接受字符串、数字或任意节点（含图标）。

:::

<DemoPreview component="switch" demo="text" />

::: v-pre

## API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| checked | 指定当前是否选中（受控） | `boolean` | — |
| defaultChecked | 初始是否选中（非受控） | `boolean` | `false` |
| value | ⚠️ `checked` 的**别名**（antd `@since 5.12.0`） | `boolean` | — |
| defaultValue | ⚠️ `defaultChecked` 的**别名** | `boolean` | — |
| onChange | 变化时回调（**两个参数**；`disabled` 时不触发） | `(checked: boolean, event: MouseEvent \| KeyboardEvent) => void` | — |
| onClick | 点击时回调；⚠️ 收到的是**结果值**（不是原生事件），且 `disabled` 时**仍会触发** | `(checked: boolean, event) => void` | — |
| checkedChildren | 选中时的内容 | `VNodeChild` | — |
| unCheckedChildren | 未选中时的内容 | `VNodeChild` | — |
| disabled | 失效状态 | `boolean` | — |
| loading | 加载中；⚠️ 会**强制**失效（`\|\|` 判据） | `boolean` | `false` |
| size | 尺寸；⚠️ `'default'` 已废弃（提示改用 `'medium'`） | `'small' \| 'medium' \| 'middle' \| 'default'` | — |
| autoFocus | 自动获取焦点 | `boolean` | — |
| title / id / tabIndex | 原生属性（落 `<button>`） | — | — |
| class / style | **根元素原生 attrs**（不是 Props） | — | — |
| classNames / styles | 语义槽 `{ root, content, indicator }`（对象或函数） | — | — |

### Events

| 事件 | 说明 | 参数 |
|---|---|---|
| update:checked | `v-model:checked` 通道（与 `onChange` 同时发出） | `boolean` |
| update:value | `v-model:value` 通道（别名通道，同上） | `boolean` |

### 键盘

| 按键 | 行为 |
|---|---|
| `ArrowLeft` | 置为未选中（`disabled` 时不生效） |
| `ArrowRight` | 置为选中（`disabled` 时不生效） |
| `Space` / `Enter` | 原生 `<button>` 的激活行为（等价点击） |

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

**为什么 `disabled` 时 `onClick` 还会触发？**
这是 rc-switch 的 legacy 语义（`onClick` 收到「结果值」而不是事件），我们逐字对齐。
注意浏览器本身会抑制 `disabled` 按钮的 click 派发，所以正常用户交互下观察不到。

**`value` 和 `checked` 有什么区别？**
没有区别 —— `value` / `defaultValue` 是 `checked` / `defaultChecked` 的别名
（antd 5.12.0 起为表单场景加的）。两者同时传时 `checked` 优先。

:::
