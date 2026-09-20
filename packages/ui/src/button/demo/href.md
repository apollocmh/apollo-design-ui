---
order: 10
title:
  zh-CN: 链接按钮
  en-US: Href
---

传了 `href` 就渲染 `<a>` 而不是 `<button>`。此时 `htmlType` 无效、没有原生 `disabled`，
禁用靠「移除 `href` + `tabindex="-1"` + `aria-disabled`」。

```vue
<script setup lang="ts">
import { Button } from '@apollo-design/ui';
</script>

<template>
  <Button type="primary" href="https://example.com">Href</Button>
</template>
```
