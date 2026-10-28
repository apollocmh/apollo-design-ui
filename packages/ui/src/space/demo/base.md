---
order: 0
title:
  zh-CN: 基础用法
  en-US: Basic
---

使用真实 Button 和默认插槽内容设置间距。

Use real Buttons and default slot content with consistent spacing.

```vue
<script setup lang="ts">
import { Button, Space } from '@apollo-design/ui';
</script>
<template>
  <Space>Space <Button type="primary">Save</Button><Button>Upload</Button><Button type="text">Confirm</Button></Space>
</template>
```
