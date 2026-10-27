---
category: 数据展示
title: Empty
subtitle: 空状态
---

数据为空时的占位提示。默认插槽可放置新建按钮等引导内容。

## 何时使用

- 列表、表格或业务区域没有数据时显示说明。
- 使用完整图片、描述和页脚插槽承载业务内容。

## 代码演示

六个示例覆盖默认与简洁插画、自定义内容、当前 Provider 配置、条件描述和四个语义区域。

## API

### Props

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| prefixCls | 完整组件前缀 | `string` | `apollo-empty`，跟随 ConfigProvider |
| image | 顶层字符串为图片 URL；也支持组件、VNode、数组及数字。只有 undefined 回退；null、布尔值、空串及空内容隐藏图片宿主 | `EmptyImage` | Provider 配置或 `PRESENTED_IMAGE_DEFAULT` |
| imageStyle | 既有弃用字段，使用 `styles.image`；合并后后者优先 | `CSSProperties` | — |
| description | 完整 Vue 内容；只有 undefined 使用当前语言；空内容隐藏描述宿主，数字 0 保留 | `VNodeChild` | 当前 locale 的 `Empty.description` |
| classNames | 四个语义区域的类名，函数接收当前局部 Props | `EmptySemanticValue<EmptySemanticClassNames>` | — |
| styles | 四个语义区域的样式，函数接收当前局部 Props | `EmptySemanticValue<EmptySemanticStyles>` | — |

根节点支持 Vue 原生 class、style、dir、data/ARIA 和事件 attrs。style 接受字符串、对象和数组；原生 style 覆盖 `styles.root`。组件没有业务 Emits 或 v-model。

### 插槽

| 名称 | 说明 |
|---|---|
| image | 完整图片区域，优先于 image 和 Provider 图片；自定义内容按自然高度布局 |
| description | 完整描述区域，优先于 description 和语言默认值 |
| default | 完整页脚区域，例如一个或多个操作控件 |

三个插槽均在当前 render 中求值一次；存在即优先，故意返回空内容时也不回退。空数组、注释、布尔值及空 Fragment 不创建带间距的空宿主。完整业务子级保持自身属性、编辑状态和焦点。

### Provider 与语义区域

`ConfigProvider :components="{ empty }"` 接收 `EmptyConfig`，包含 `image`、`className`、`style`、`classNames`、`styles`，支持动态更新和移除。Provider 的语义配置为对象。

四个区域为 `root`、`image`、`description`、`footer`。类名按 Provider、局部语义、原生根 class 合并；根样式按以下顺序覆盖：

```
Provider styles.root → Provider style → 局部 styles.root → 原生根 style
```

其余区域由局部语义覆盖 Provider 语义；`imageStyle` 低于 `styles.image`。图像高度与透明度仅作用于内置插画和 URL 图片，自定义完整内容保留自身布局与颜色。RTL 跟随当前 Provider，原生 dir 可覆盖。

### 静态属性、类型与 ref

`Empty.PRESENTED_IMAGE_DEFAULT` 和 `Empty.PRESENTED_IMAGE_SIMPLE` 也提供同名具名导出，根入口与 `@apollo-design/ui/empty` 的值相同。它们是可复用组件定义；简洁组件及其 VNode 会使用 normal 模式，相似的自建图形不会触发此模式。

导出类型：`EmptyProps`、`EmptySlots`、`EmptyImage`、`EmptyRef`、`EmptyConfig`、`EmptySemanticClassNames`、`EmptySemanticStyles`、`EmptySemanticValue`、`EmptySemanticType`、`EmptySemanticAllType`。

| Expose | 类型 | 说明 |
|---|---|---|
| nativeElement | `HTMLDivElement \| null` | 实际根 div；挂载前及卸载后为空 |

URL 图片 alt 使用字符串 description；非字符串使用当前语言的空状态说明。内置插画的 title 随语言更新，纯图片状态仍有可访问名称。

### 主题与样式

Empty 没有 Component Token。布局消费现有 Alias Token；插画调色在运行时从当前主题派生，保留生成几何与来源。默认说明文字使用 `colorTextSecondary`。

```ts
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/empty/style.css';
// 或 import '@apollo-design/ui/style.css';
```

静态 CSS 只包含 apollo 根前缀。自定义根前缀 my-app 时，使用 `ConfigProvider prefix-cls="my-app"` 并加载 `genComponentCss('empty', 'my-app')` 生成的样式。直接设置组件 `prefixCls` 时传完整值，例如 my-app-empty。
