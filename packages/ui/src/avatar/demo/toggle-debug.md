---
order: 7
title:
  zh-CN: 隐藏情况下计算字符对齐
  en-US: Compute alignment when hidden
---

切换 Avatar 显示的时候，文本样式应该居中并正确调整字体大小。

```vue
<script setup lang="ts">
// 对齐 antd 的 toggle-debug demo。
import { Avatar, Button, Space } from '@apollo-design/ui';
import { ref } from 'vue';

const hide = ref(true);
</script>

<template>
  <Space wrap>
    <Button @click="toggle">Toggle Avatar visibility</Button>
  </Space>
  <div :style="{ textAlign: 'center' }">
    <Avatar :style="{ ...hidden(), background: '#7265e6' }">Avatar</Avatar>
  </div>
</template>
```
