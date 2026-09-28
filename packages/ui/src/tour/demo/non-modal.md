---
order: 2
title:
  zh-CN: 非模态
  en-US: Non-modal
---

## zh-CN

使用 `mask=false` 可以将引导变为非模态，同时为了强调引导本身，建议与 `type="primary"` 组合使用。

## en-US

Use `mask=false` to make Tour non-modal. At the meantime it is recommended to use with `type="primary"` to emphasize the guide itself.

```vue
<script setup lang="ts">
import { EllipsisOutlined } from '@apollo-design/icons';
import { Button, Divider, Space, Tour } from '@apollo-design/ui';
import { ref } from 'vue';
// steps 与 basic 相同，此处省略
</script>

<template>
  <Button type="primary" @click="open = true">Begin non-modal Tour</Button>
  <Divider />
  <Space>
    <Button ref="ref1">Upload</Button>
    <Button ref="ref2" type="primary">Save</Button>
    <Button ref="ref3" :icon="EllipsisOutlined" />
  </Space>
  <Tour :open="open" :mask="false" type="primary" :steps="steps" @close="open = false" />
</template>
```
