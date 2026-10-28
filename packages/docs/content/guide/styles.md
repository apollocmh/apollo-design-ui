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
| 组件样式 | `@apollo-design/ui/style.css` | 全量组件规则及默认组件变量（类名前缀 `apollo-*`），使用共享主题变量 |

```ts
// 入口文件（顺序：先令牌、后组件样式）
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/style.css';
```

### 为什么必须先引 tokens.css

组件 CSS 消费共享主题变量，同时声明各组件的默认变量。缺少令牌层时，共享 `var(--apollo-*)` 无法解析，相关样式会失效。

### 按组件引入

JS 导入不会自动挂载 CSS。可以用公开样式入口代替全量样式：

```ts
import { Timeline, Space, Input } from '@apollo-design/ui';
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/timeline/style.css';
import '@apollo-design/ui/space/style.css';
import '@apollo-design/ui/input/style.css';
```

单个入口包含组件实现内部所需的样式。例如 Timeline 包含内部 Steps 的基础规则，无需额外了解内部组件。插槽中由你提供的组件需引入各自样式；上例的 Input 用在 Space 插槽中，因此仍单独引入 Input CSS。组件样式与依赖在构建时组合，运行时通过 Vue 原生 CSS 变量更新当前主题。

| 用法 | 已有样式入口 |
| --- | --- |
| AutoComplete | `@apollo-design/ui/select/style.css` |
| TimePicker / TimeRangePicker | `@apollo-design/ui/date-picker/style.css` |
| Layout.Sider / Sider | `@apollo-design/ui/layout-sider/style.css`，与 `layout/style.css` 分开引入 |
| ConfigProvider / Watermark | 自身不需要组件样式；内容组件仍需各自样式 |

发布的静态样式使用默认 `apollo` 前缀。自定义前缀需自行提供对应的静态 CSS。

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

### 默认链接样式

共享基础层为原生链接提供当前主题的颜色、装饰与可见键盘焦点；这些默认值不依赖是否使用 Select。可以用原生 `style` 或自己的 CSS 覆盖。

### 原生表单控件

共享样式保留原生控件的浏览器前景、背景和禁用颜色。Apollo 组件使用各自的主题色；自行给原生控件设置颜色时，请同时配置背景。例如 `style="color: inherit; background: transparent"` 可让原生按钮使用父级颜色，避免暗色作用域中的浅色文字落在浏览器浅色背景上。

## en-US

Apollo Design uses **static CSS + CSS variables** — there is no CSS-in-JS runtime. Styles ship in two layers:

| Layer | Package | Content |
|---|---|---|
| Design tokens | `@apollo-design/theme/tokens.css` | All `--apollo-*` CSS variables, with light / dark / compact scopes |
| Component styles | `@apollo-design/ui/style.css` | Component rules and default component variables (`apollo-*` class prefix), using shared theme variables |

```ts
import '@apollo-design/theme/tokens.css';
import '@apollo-design/ui/style.css';
```

### Individual stylesheets

JS imports do not install CSS. Import `theme/tokens.css` first, then the public `ui/<component>/style.css` entries you use. Each entry includes styles required by implementation-owned descendants: Timeline supplies its internal Steps rules. Components you provide through slots still need their own styles, such as Input inside Space. Composition happens at build time; current themes use Vue's native CSS variables.

AutoComplete uses `select/style.css`; TimePicker and TimeRangePicker use `date-picker/style.css`. Layout.Sider has its separate `layout-sider/style.css` entry. ConfigProvider and Watermark need no component stylesheet themselves. Published CSS targets the default `apollo` prefix; custom prefixes require matching static CSS.

### Dark & compact mode

Toggle the scope via an attribute on `<html>`: `<html data-apollo-theme="dark">`.

### Default link styles

The shared base applies themed link colors, decoration and a visible keyboard focus indicator, independently of Select. Native inline styles or application CSS can override these defaults.

### Native form controls

Shared styles preserve the browser's foreground, background and disabled colors for native controls. Apollo components declare their own theme colors. When styling a native control, set its foreground and background together. For example, `style="color: inherit; background: transparent"` lets a native button follow its parent without placing light text on the browser's light background in a dark scope.
