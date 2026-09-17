<script setup lang="ts">
import { Empty } from '../../index';

/** `description={false}` 不渲染描述块；`description` 传节点时原样渲染。 */
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <Empty description="Nothing to show" />
    <Empty :description="false" />
    <Empty>
      <template #default>
        <span>描述可以是任意节点，例如 <a href="#demo">这段链接</a></span>
      </template>
    </Empty>
  </div>
</template>
