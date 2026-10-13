---
order: 1
title:
  zh-CN: 按钮尺寸
  en-US: Size
---

`size` 的默认档是 `medium`（旧写法 `middle` 同样合法），此时**不**输出 `-lg` / `-sm` 类名。

```vue
<script setup lang="ts">
import { Button } from '@apollo-design/ui';
</script>

<template>
  <Button type="primary" size="large">Large</Button>
  <Button type="primary" size="medium">Medium</Button>
  <Button type="primary">Default</Button>
  <Button type="primary" size="small">Small</Button>
</template>
```
