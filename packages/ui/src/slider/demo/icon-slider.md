---
order: 10
title:
  zh-CN: 自定义把手图标
  en-US: Icon slider
---

`#handle` 作用域插槽自定义把手（槽参数给出可用的 `nodeProps` / `className` / `style`）。

```vue
<script setup lang="ts">
// 对齐 antd `icon-slider.tsx`：`#handle` 槽自定义把手。槽参数给出 `nodeProps` / `className` /
// `style`（与 rc 的 `handleRender(node, info)` 同构 —— 可替换、也可在里面再包一层）。
import { FrownOutlined, SmileOutlined } from '@apollo-design/icons';
import { computed, h, ref } from 'vue';
import { Slider } from '@apollo-design/ui';

const value = ref(30);
const icon = computed(() => (value.value < 50 ? h(FrownOutlined) : h(SmileOutlined)));
</script>

<template>
  <Slider v-model:value="value">
    <template #handle="{ nodeProps, className, style }">
      <div v-bind="nodeProps" :class="className" :style="style">
        <component :is="icon" />
      </div>
    </template>
  </Slider>
</template>
```
