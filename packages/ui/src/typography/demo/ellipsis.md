---
order: 3
title:
  zh-CN: 省略号
  en-US: Ellipsis
---

`rows` 控制行数：`1` 走 `text-overflow`，`>1` 走 `-webkit-line-clamp`。

一旦传了 `expandable` / `suffix` / `onEllipsis`，或同时开了 `copyable` / `editable`，
CSS 省略号就**做不到**（省略号后面还要放东西），组件会改用 **JS 二分裁剪**。

⚠️ JS 裁剪依赖**真实布局测量**（`ResizeObserver` + `scrollHeight`/`clientHeight`）。
jsdom 没有布局引擎，所以 L1/L2 通过打桩尺寸驱动状态机，真实排版结果由 L6 覆盖 ——
见 `README.md` §7。

```vue
<script setup lang="ts">
import { Paragraph, Text } from '@apollo-design/ui';

const longText =
  'Ant Design, a design language for background applications, is refined by Ant UED Team. ' +
  'This sentence is intentionally long enough to overflow a narrow box, so the component has ' +
  'to decide where to cut it.';
</script>

<template>
  <Paragraph :ellipsis="{ rows: 1 }" :style="{ width: '220px' }">
    {{ longText }}
  </Paragraph>
  <Paragraph :ellipsis="{ rows: 2 }" :style="{ width: '220px' }">
    {{ longText }}
  </Paragraph>
  <Paragraph :ellipsis="{ rows: 2, expandable: true, suffix: '...more' }" :style="{ width: '220px' }">
    {{ longText }}
  </Paragraph>
  <Text :ellipsis="{ tooltip: 'I am a tooltip' }" :style="{ width: '220px' }">
    {{ longText }}
  </Text>
</template>
```
