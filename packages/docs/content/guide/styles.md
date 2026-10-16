---
title:
  zh-CN: 样式引入
  en-US: Styles
order: 2
---

## zh-CN

Apollo Design 采用**静态 CSS + CSS 变量**，没有 CSS-in-JS 运行时。样式分两层，职责不同：

| 层 | 包 | 内容 |
|---|---|---|
| 设计令牌 | `@apollo-design/theme/tokens.css` | 全部 `--apollo-*` CSS 变量（色彩梯度、间距、圆角、字体、动效曲线、阴影……），含亮色 / 暗色 / 紧凑三套作用域 |
| 组件样式 | `@apollo-design/ui/style.css` | 全量组件 CSS（类名前缀 `apollo-*`），变量全部取自上一层 |

```ts
// 入口文件（顺序：先令牌、后组件样式）
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/style.css';
```

### 为什么必须先引 tokens.css

组件样式只消费 `var(--apollo-*)`，自身不含色值。缺了令牌层，变量会落到 `initial`，视觉直接失效。

### 暗色与紧凑模式

令牌层用属性选择器切换作用域，切到 `<html>` 上即可：

```html
<html data-apollo-theme="dark">
```

| 值 | 效果 |
|---|---|
| （缺省） | 亮色 |
| `dark` | 暗色 |
| `dark-compact` | 暗色 + 紧凑密度 |

### 与组件库 Token 的关系

站点（本文档站）自己另有一套 `--site-*` 令牌用于官网视觉，**不复用、也不污染** `--apollo-*`。组件示例永远渲染在组件库自己的令牌作用域内。

## en-US

Apollo Design uses **static CSS + CSS variables** — there is no CSS-in-JS runtime. Styles ship in two layers:

| Layer | Package | Content |
|---|---|---|
| Design tokens | `@apollo-design/theme/tokens.css` | All `--apollo-*` CSS variables, with light / dark / compact scopes |
| Component styles | `@apollo-design/ui/style.css` | Full component CSS (`apollo-*` class prefix), consuming only the variables above |

```ts
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/style.css';
```

### Dark & compact mode

Toggle the scope via an attribute on `<html>`: `<html data-apollo-theme="dark">`.
