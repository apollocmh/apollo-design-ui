<script setup lang="ts">
import { Empty } from '../../index';

/** 语义化 `classNames` / `styles`：按槽位覆盖根、插画、描述、页脚。 */
const classNames = {
  root: 'demo-empty-root',
  image: 'demo-empty-image',
  description: 'demo-empty-description',
};

const styles = {
  root: { backgroundColor: '#fafafa' },
  image: { opacity: 0.6 },
};
</script>

<template>
  <Empty
    :class-names="classNames"
    :styles="styles"
    description="带语义化类名与样式"
  >
    <button type="button">Create</button>
  </Empty>
</template>
