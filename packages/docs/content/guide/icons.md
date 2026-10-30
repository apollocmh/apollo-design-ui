---
title:
  zh-CN: 图标
  en-US: Icons
order: 7
---

## zh-CN

图标来自独立包 `@apollo-design/icons`，与 `@apollo-design/ui` 分开安装与按需引入。它提供 **848 个** 图标：447 个 Outlined、251 个 Filled、150 个 TwoTone；完整目录见 [图标资源页](/components/icon)。

### 安装与引入

```bash
pnpm add @apollo-design/icons
```

```vue
<script setup lang="ts">
import { SearchOutlined } from '@apollo-design/icons';
</script>

<template>
  <SearchOutlined />
</template>
```

图标是普通 Vue 组件，颜色继承 `currentColor`，尺寸继承 `font-size`；也可以直接用 `style` / `class` 覆盖：

```vue
<template>
  <SearchOutlined style="font-size: 24px; color: #1677ff" />
  <SearchOutlined :rotate="90" />
  <SearchOutlined spin />
</template>
```

### TwoTone 调色

TwoTone 图标支持 `twoToneColor`（单个图标）或 `setTwoToneColor`（全局）：

```ts
import { setTwoToneColor } from '@apollo-design/icons';

setTwoToneColor('#1677ff');
```

### IconProvider

`IconProvider` 用来覆盖图标类名前缀，默认是 `apollo-icon`：

```vue
<template>
  <IconProvider :value="{ prefixCls: 'my-icon' }">
    <SearchOutlined />
  </IconProvider>
</template>
```

### 自定义图标

```ts
import { createIcon } from '@apollo-design/icons';

export const MyIcon = createIcon(
  {
    name: 'my-icon',
    theme: 'outlined',
    icon: {
      tag: 'svg',
      attrs: { viewBox: '0 0 24 24' },
      children: [{ tag: 'path', attrs: { d: 'M12 2 L22 22 L2 22 Z' } }],
    },
  },
  'MyIcon',
);
```

从 iconfont.cn 接入：

```ts
import { createFromIconfontCN } from '@apollo-design/icons';

const IconFont = createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/c/font_xxx.js',
});
```

### 无障碍

图标默认通过 `role="img"` 语义输出。装饰性图标请加 `aria-hidden="true"`；承载语义的图标请提供 `aria-label`（或 `ariaLabel` prop），不要让读屏器去猜。

## en-US

Icons live in the standalone `@apollo-design/icons` package, installed and imported separately from `@apollo-design/ui`. It ships **848 icons**: 447 Outlined, 251 Filled, and 150 TwoTone. Browse the full catalog on the [icon resource page](/components/icon).

### Install and import

```bash
pnpm add @apollo-design/icons
```

```vue
<script setup lang="ts">
import { SearchOutlined } from '@apollo-design/icons';
</script>

<template>
  <SearchOutlined />
</template>
```

Icons are regular Vue components. They inherit `currentColor` and `font-size`, and accept `style` / `class` overrides:

```vue
<template>
  <SearchOutlined style="font-size: 24px; color: #1677ff" />
  <SearchOutlined :rotate="90" />
  <SearchOutlined spin />
</template>
```

### TwoTone colors

Use `twoToneColor` per icon or `setTwoToneColor` globally:

```ts
import { setTwoToneColor } from '@apollo-design/icons';

setTwoToneColor('#1677ff');
```

### IconProvider

`IconProvider` overrides the icon class prefix (default `apollo-icon`):

```vue
<template>
  <IconProvider :value="{ prefixCls: 'my-icon' }">
    <SearchOutlined />
  </IconProvider>
</template>
```

### Custom icons

```ts
import { createIcon } from '@apollo-design/icons';

export const MyIcon = createIcon(
  {
    name: 'my-icon',
    theme: 'outlined',
    icon: {
      tag: 'svg',
      attrs: { viewBox: '0 0 24 24' },
      children: [{ tag: 'path', attrs: { d: 'M12 2 L22 22 L2 22 Z' } }],
    },
  },
  'MyIcon',
);
```

For iconfont.cn:

```ts
import { createFromIconfontCN } from '@apollo-design/icons';

const IconFont = createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/c/font_xxx.js',
});
```

### Accessibility

Icons render with `role="img"`. Mark decorative icons with `aria-hidden="true"`; give meaningful icons an `aria-label` (or the `ariaLabel` prop) so assistive technology has a real name to announce.
