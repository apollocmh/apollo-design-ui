---
category: 数据展示
title: Tag
subtitle: 标签
---

标记属性和分类。交互选择使用 CheckableTag 或 CheckableTagGroup。

## 代码演示

十二个 [Demo](./demo) 覆盖基本链接/关闭、勾选、颜色、动态添加、自定义、禁用、拖拽、图标、状态、四语义样式、关闭重置和组件 Token。

## API

### Tag

| Prop | 说明 | 类型 | 默认值 |
|---|---|---|---|
| prefixCls | DOM 类名前缀；自定义前缀需对应静态 CSS | `string` | `apollo-tag` |
| color | 13 预设色、success/processing/error/warning/default 或合法 CSS 色值 | `TagColor` | — |
| variant | 变体 | `'filled' \| 'solid' \| 'outlined'` | `filled` |
| bordered | 已有废弃字段，false 相当于 filled；使用 variant | `boolean` | — |
| closable | 关闭开关/配置，包含 closeIcon、disabled、aria-*、data-* | `boolean \| TagClosableConfig \| null` | `false` |
| href / target | 内部链接地址/打开方式 | `string` | — |
| disabled | 禁用链接及关闭操作；省略时采用全局禁用配置 | `boolean` | `false` |
| classNames / styles | root、icon、content、close 四语义区域 | `TagSemanticClassNames / TagSemanticStyles` | — |

| Slot | 内容 |
|---|---|
| default | 完整正文 |
| icon | 完整前置图标内容 |
| closeIcon | 完整关闭内容；存在时优先于配置，显式空槽抑制按钮 |

| Emit | 参数与行为 |
|---|---|
| close | 原生 `MouseEvent`；`preventDefault()` 取消隐藏。停止关闭点击向根外传播 |

根固定为 span，icon/content/close 有独立语义宿主。href 使用 content 内的 a；关闭按钮为其兄弟元素，保留调用者图标的属性与监听器。关闭按钮消费 Enter/空格的 keydown 冒泡，保留原生默认激活，避免父级选择控件误处理。默认关闭保留 DOM 并添加 `-hidden`；父级可通过卸载重挂恢复。

### CheckableTag

| Prop | 说明 | 类型 | 默认值 |
|---|---|---|---|
| prefixCls | 标签前缀 | `string` | `apollo-tag` |
| checked | 受控选择状态，支持 `v-model:checked`；省略为非受控 | `boolean` | `false` |
| disabled | 禁用选择 | `boolean` | `false` |

插槽：default、icon，均保留完整内容。事件：`update:checked(boolean)`、`change(boolean)`、`click(MouseEvent)`、`keydown(KeyboardEvent)`。点击/空格更新一次；Enter 不切换；重复空格不重复更新，原生事件 `preventDefault()` 可取消切换。checkbox 的 role/aria-checked/禁用 tabindex 由组件维护。

### CheckableTagGroup

| Prop | 说明 | 类型 | 默认值 |
|---|---|---|---|
| id / prefixCls | 根 id / 标签前缀（Group 类名追加 -checkable-group） | `string` | — / `apollo-tag` |
| options | 原始值或选项；label 省略时显示 value | `(T \| CheckableTagOption<T>)[]`，T 为 string/number | `[]` |
| value | 受控模型，支持 `v-model:value` | 单选 `T \| null`；多选 `T[]` | — |
| defaultValue | 非受控初始值，仅挂载时读取 | 同 value | 单选 null，多选 [] |
| multiple | 多选模式 | `boolean` | `false` |
| disabled | 禁用全部选项 | `boolean` | `false` |
| classNames / styles | 仅 root/item；option.className/style 应用到对应选择项，option.style 最后覆盖 item 样式 | `GroupSemanticClassNames / GroupSemanticStyles` | — |

选项包含 value、可选 label（VNodeChild 数据）、className、style。Group 不提供公开插槽。事件：`update:value(value)`、`change(value)`，模型由 multiple 泛型确定，单次交互各发一次。动态 options/multiple/value 更新当前显示；切换模式不自动改写父模型，下次交互按当前模式输出。单选再次点击当前项回到 null。空字符串/数字 0 是有效值。

## Expose、attrs 与 Provider

三组件均公开 `nativeElement`（Tag/CheckableTag 为根 span，Group 为 div），保留 `Tag.CheckableTag` / `Tag.CheckableTagGroup` 与同名具名导出身份。原生根 class/style/id/data、监听器采用 Vue 合并规则；字符串/数组/对象 style 均支持，根原生 style 最后覆盖语义样式。CheckableTag 的事件使用 Vue `@keydown`。

Tag 链接专属 rel/download/hreflang/referrerpolicy/tabindex/accesskey、aria-label/labelledby/describedby 和 focus/blur 监听器落到真实 a；其他 attrs 落到根。Provider 的方向/禁用及 components.tag 当前样式即时生效；Tag 额外消费 variant/closable/closeIcon/classNames/styles。选择组件不消费 Tag 的关闭或 variant 配置。明确本地字段覆盖 Provider，移除后恢复当前配置。

## Theme

| Component Token | 默认来源 | 说明 |
|---|---|---|
| defaultBg | colorFillTertiary 叠加 colorBgContainer | 默认底色 |
| defaultColor | colorText | 默认文字色 |
| solidTextColor | 实际 solid 背景自动选择黑白色 | solid 文字色；显式配置保留调用者控制 |

通过 `ConfigProvider.theme.components.Tag` 配置，动态替换/移除即时生效。预设/状态/自定义色保留三变体，filled/outlined 文字按当前主题调整明度以保证可读性，选择态使用实际背景决定前景。显式文字色与背景应合理配对。兼容边界和旧/新写法见 [迁移记录](../../../../docs/migrations/tag-contracts.md)。
