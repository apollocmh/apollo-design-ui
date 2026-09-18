---
order: 7
title:
  zh-CN: 变体
  en-US: Variant
---

`variant` 取 `solid`（默认）/ `dashed` / `dotted`。

⚠️ `dashed` 布尔 prop 是 `variant="dashed"` 的旧写法，两者**可以叠加**（不会输出重复类名）。

```vue
<script setup lang="ts">
import { Divider } from '@apollo-design/ui';
</script>

<template>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
    probare, quae sunt a te dicta? Refert tamen, quo modo.
  </p>
  <Divider :style="{ borderColor: '#7cb305' }">Solid</Divider>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
    probare, quae sunt a te dicta? Refert tamen, quo modo.
  </p>
  <Divider variant="dotted" :style="{ borderColor: '#7cb305' }">Dotted</Divider>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
    probare, quae sunt a te dicta? Refert tamen, quo modo.
  </p>
  <Divider variant="dashed" :style="{ borderColor: '#7cb305' }" dashed>Dashed</Divider>
  <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nonne merninisti licere mihi ista
    probare, quae sunt a te dicta? Refert tamen, quo modo.
  </p>
</template>
```
