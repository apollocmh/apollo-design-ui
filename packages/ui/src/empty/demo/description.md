---
order: 3
title:
  zh-CN: 自定义描述
  en-US: Description
---

`description` 有**两条不同的判据**，这是本组件最容易写错的地方：

| 判据 | 作用 |
|---|---|
| `description !== undefined` | 决定**取值**：传了就用传入值（包括 `0` 与 `''`），没传才回退到 locale |
| `isRenderable(description)` | 决定**是否渲染**：`false` / `''` / `null` 不渲染描述块 |

所以 `description={''}` 会取到 `''`（不走 locale），但不渲染任何东西。

```vue
<script setup lang="ts">
import { Empty } from '@apollo-design/ui';
</script>

<template>
  <Empty description="Nothing to show" />
  <Empty :description="false" />
</template>
```
