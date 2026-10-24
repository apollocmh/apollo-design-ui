---
order: 11
title:
  zh-CN: 自定义切换器
  en-US: Custom size changer
---

通过原生 `#sizeChanger` 将尺寸切换器替换为 InputNumber，业务动作使用 onSizeChange。

```vue
<script setup lang="ts">
import { InputNumber, Pagination } from '@apollo-design/ui';
</script>

<template>
  <Pagination show-size-changer :default-current="3" :total="500">
    <template #sizeChanger="{ value, onSizeChange, disabled, className }">
      <InputNumber aria-label="Page Size" :class="className" :disabled="disabled" :min="1"
        style="width: 100px" :value="value"
        @change="next => { if (typeof next === 'number') onSizeChange(next); }" />
    </template>
  </Pagination>
</template>
```
