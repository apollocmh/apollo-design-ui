---
order: 13
title:
  zh-CN: 自定义语义结构的样式和类
  en-US: Style & Class
---

对象与函数式语义样式采用当前合并后的 props；主题变量随所属作用域变化。

Object and function semantic styles receive current merged props and use scoped theme variables.

```vue
<script setup lang="ts">
import { Button, Space, type SpaceProps } from '@apollo-design/ui';
const classNames: SpaceProps['classNames'] = { root: 'demo-space-root', item: 'demo-space-item', separator: 'demo-space-separator' };
const styles: SpaceProps['styles'] = { root: { border: '2px dashed var(--apollo-color-border)', padding: '8px', marginBottom: '10px' }, item: { background: 'var(--apollo-color-fill-secondary)', padding: '4px' }, separator: { color: 'var(--apollo-color-primary)', fontWeight: 'bold' } };
const classNamesFn: SpaceProps['classNames'] = ({ props }) => ({ root: `demo-space-${props.orientation}` });
const stylesFn: SpaceProps['styles'] = ({ props }) => ({ root: { background: props.size === 'large' ? 'var(--apollo-color-primary-bg)' : 'var(--apollo-color-fill-secondary)', padding: '8px' } });
</script>
<template>
  <div><Space :styles="styles" :class-names="classNames" separator="•"><Button v-for="i in 3" :key="i">Styled {{ i }}</Button></Space><Space size="large" :styles="stylesFn" :class-names="classNamesFn"><Button v-for="i in 3" :key="i">Large space {{ i }}</Button></Space></div>
</template>
```
