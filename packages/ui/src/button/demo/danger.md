---
order: 4
title:
  zh-CN: 危险按钮
  en-US: Danger
---

`danger` 会把解析出的 `color` 换成 `danger`。

⚠️ 类名上有**两处不一致**（上游真实行为）：

- `-dangerous` 用的是**原始 `danger` prop**
- `-color-dangerous` 里 danger 被改写成 `dangerous`（不是 `-color-danger`）

```vue
<script setup lang="ts">
import { Button } from '@apollo-design/ui';
</script>

<template>
  <Button type="primary" danger>Primary</Button>
  <Button danger>Default</Button>
</template>
```
