---
title:
  zh-CN: 主题展示
  en-US: Theme gallery
order: 4.1
---

## zh-CN

### 如何比较

上方以相同内容并排呈现 Default、Mono 和 Material，第一行为亮色，第二行为暗色。六个预览各有独立的主题作用域；切换站点外观时，预览仍保留标注的亮暗模式，便于比较色彩、圆角和控件状态。窄屏会按相同顺序折行，不必横向滚动整页。

可以直接修改名称、切换通知开关，或点击「继续」和「重置」观察进度。各个预览的状态互相独立，修改一处不会影响其他卡片。比较时也可使用 Tab 键依次访问控件，查看键盘焦点及禁用按钮的表现。

「重置」仅将进度恢复为 64；名称与通知开关保留各自的编辑状态，方便继续比较不同主题。

### 选用与定制

Default 提供默认外观，Mono 呈现单色风格，Material 参考 [MUI Material UI](https://github.com/mui/material-ui) 的中性表面、克制圆角和层级阴影。品牌色在亮暗模式中均为 **#0073E6**；填充操作的悬停色加深，暗色文字与链接使用更明亮的颜色。保留 `material3Preset` / `material3` 的公开名称，已有导入路径与主题配置无需改名。应用接入、自定义品牌、明暗切换与嵌套作用域的具体配置，请阅读[主题使用与定制](/guide/theming)；此页用于比较真实组件效果。

## en-US

### Compare the previews

The gallery above presents the same content in Default, Mono and Material. The first row uses light mode and the second uses dark mode. Each card owns its theme scope, so changing the surrounding site's appearance preserves the mode shown on its label. Narrow screens wrap the cards in the same order without requiring page-wide horizontal scrolling.

Edit a name, toggle notifications, or use Continue and Reset to change the progress value. State belongs to each preview independently. You can also use Tab to compare keyboard focus and disabled controls across the six appearances.

Reset restores only progress to 64. The edited name and notification switch keep their own state so you can continue comparing themes.

### Choose and customize

Default is the standard appearance, Mono uses a monochrome style, and Material references [MUI Material UI](https://github.com/mui/material-ui) for neutral surfaces, restrained corners and elevation shadows. The brand stays **#0073E6** in both appearances: filled actions darken on hover, while dark-mode text and links use lighter colors. The public `material3Preset` / `material3` names are retained, so existing imports and configuration need no renaming. See [Theming](/guide/theming) for application setup, brand overrides, appearance switching and nested scopes. This page focuses on comparing working components.
