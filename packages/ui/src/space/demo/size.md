---
order: 2
title:
  zh-CN: 间距尺寸
  en-US: Size
---

使用 `size` 设置元素之间的间距，预设了 `small`、`medium`、`large` 三种尺寸，
也可以自定义间距；若不设置 `size`，则默认为 `small`。

预设串（`small` / `medium` / `large`）走**类名**，取值来自 CSS 变量
（`--apollo-padding-xs` / `--apollo-padding` / `--apollo-padding-lg`），所以会随主题自适应。
数字走**内联** `row-gap` / `column-gap`，由我们补 `px`。
`size={0}` 是**有效值**（判据是 `??` 不是 `||`），但不产生任何 gap。
`[horizontal, vertical]` 元组形式可以两个方向分别指定（见「自动换行」demo）。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { Space, type SpaceSize } from '@apollo-design/ui';
import { BTN_DASHED, BTN_DEFAULT, BTN_PRIMARY, BTN_TEXT } from './_standin';

type Choice = 'small' | 'medium' | 'large' | 'customize';

const size = ref<Choice>('small');
const customSize = ref(0);

const spaceSize = (): SpaceSize => (size.value === 'customize' ? customSize.value : size.value);
</script>

<template>
  <label>
    size
    <select v-model="size" aria-label="space size">
      <option value="small">small</option>
      <option value="medium">medium</option>
      <option value="large">large</option>
      <option value="customize">customize</option>
    </select>
  </label>
  <br />
  <br />
  <label v-if="size === 'customize'">
    custom size
    <input v-model.number="customSize" type="range" min="0" max="100" aria-label="custom size" />
  </label>
  <Space :size="spaceSize()">
    <button type="button" :style="BTN_PRIMARY">Primary</button>
    <button type="button" :style="BTN_DEFAULT">Default</button>
    <button type="button" :style="BTN_DASHED">Dashed</button>
    <button type="button" :style="BTN_TEXT">Link</button>
  </Space>
</template>
```
