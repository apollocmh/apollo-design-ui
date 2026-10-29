---
order: 8
title:
  zh-CN: 自定义语义结构的样式和类
  en-US: Style & Class
---

`classNames` / `styles` 支持 root / rail / content 三个语义区域，也支持 `(info: { props }) => 对象`。函数接收当前有效方向、位置和尺寸；原生选择框更新 size，立即改变样式函数结果。类名拼接，样式按来源顺序覆盖，原生根 style 优先。

```vue
<script setup lang="ts">
import { ref } from 'vue';
import type { DividerProps } from '@apollo-design/ui';
import { Divider } from '@apollo-design/ui';

const size = ref<DividerProps['size']>('small');

const classNamesObject: DividerProps['classNames'] = {
  root: 'demo-divider-root',
  content: 'demo-divider-content',
  rail: 'demo-divider-rail',
};

const classNamesFn: DividerProps['classNames'] = (info) =>
  info.props.titlePlacement === 'start'
    ? { root: 'demo-divider-root--start' }
    : { root: 'demo-divider-root--default' };

const stylesObject: DividerProps['styles'] = {
  root: { borderWidth: '2px', borderStyle: 'dashed' },
  content: { fontStyle: 'italic' },
  rail: { opacity: 0.85 },
};

const stylesFn: DividerProps['styles'] = (info) =>
  info.props.size === 'small'
    ? { root: { borderColor: 'var(--apollo-color-primary)', paddingBlock: '4px' } }
    : {
        root: {
          backgroundColor: 'var(--apollo-color-fill-alter)',
          borderColor: 'var(--apollo-color-border)',
        },
      };
</script>

<template>
  <div>
    <label>Semantic size <select v-model="size" aria-label="Divider semantic size"><option value="small">Small</option><option value="medium">Medium</option><option value="middle">Middle</option><option value="large">Large</option></select></label>
    <Divider :class-names="classNamesObject">classNames Object</Divider>
    <Divider title-placement="start" :class-names="classNamesFn">classNames Function</Divider>
    <Divider :styles="stylesObject">styles Object</Divider>
    <Divider :size="size" :styles="stylesFn">styles Function</Divider>
  </div>
</template>

<style scoped>
.demo-divider-root { border-color: var(--apollo-color-primary); }
:deep(.demo-divider-content) { letter-spacing: 0.03em; }
</style>
```
