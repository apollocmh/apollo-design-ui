---
order: 6
title:
  zh-CN: 组件 Token
  en-US: Component Token
---

Divider 有 3 个组件 Token（与 antd 同名同默认值，定义在 `style/token.ts`）：

| Component Token | 默认值 | 我们这边的落点 | 可运行时覆盖 |
| --- | --- | --- | --- |
| `verticalMarginInline` | `token.marginXS` | `var(--apollo-margin-xs)` | ✅ 覆盖变量 |
| `textPaddingInline` | `'1em'` | 常量内联 | ❌ 见下 |
| `orientationMargin` | `0.05` | 常量内联 | ❌ 见下 |

antd 的写法是 `<ConfigProvider theme={{ components: { Divider: { ... } } }}>`。本仓库是
**零运行时架构**（ADR 0001）：Token 的最终形态就是 CSS 变量，所以覆盖方式是**就地重声明变量**
（下面的 `--apollo-*`）。别名派生的那个 Token 因此可以覆盖。

⚠️ **登记缺口**：`textPaddingInline` / `orientationMargin` 是**字面量** Token，在零运行时管线里
被内联成常量，**没有**对应的 CSS 变量 —— 因为 `packages/theme` 的 `tokens.css` 只声明
**Alias** 层变量，不声明组件层变量（`getDesignToken()` 的返回类型是 `AliasToken`）。
所以这两个 Token 目前**不可运行时覆盖**，antd 的 `theme.components.Divider` 覆盖写法对它们无效。
这不是 Divider 独有的问题，而是**全库的管线缺口**：修复位置在 `packages/theme` 的
`tokens.css` 生成处（把每个组件的 `prepareComponentToken(...)` 结果也声明成变量），
属于 foundation 侧的工作，不在本组件的文件域内。详见 `README.md` §7。

等价的临时手段：用 `styles.content.padding` 覆盖 `textPaddingInline` 的效果、
用 `styles.content.margin` 覆盖 `orientationMargin` 的效果。

```vue
<script setup lang="ts">
import { Divider } from '@apollo-design/ui';
</script>

<template>
  <div
    :style="{
      '--apollo-margin-xs': '24px',
      '--apollo-margin': '24px',
      '--apollo-line-width': '5px',
      '--apollo-color-split': '#1677ff',
    }"
  >
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
      probare, quae sunt a te dicta? Refert tamen, quo modo.
    </p>
    <Divider>Text</Divider>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
      probare, quae sunt a te dicta? Refert tamen, quo modo.
    </p>
    <Divider title-placement="start" :styles="{ content: { padding: '0 16px' } }">Left Text</Divider>
    <p>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
      probare, quae sunt a te dicta? Refert tamen, quo modo.
    </p>
    <Divider title-placement="end" :styles="{ content: { margin: '0 50px' } }">
      Right Text
    </Divider>
  </div>
</template>
```
