<script setup lang="ts">
import { Checkbox, Empty } from '@apollo-design/ui';
import { ref } from 'vue';

const showDescription = ref(true);
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px">
    <Empty description="Nothing to show" />
    <Empty :description="false" />
    <Checkbox v-model:checked="showDescription">Show description slot</Checkbox>
    <Empty description="The slot suppresses this fallback even when empty">
      <template #description>
        <template v-if="showDescription">
          <span>描述可以是任意节点，例如 </span><a class="empty-description-link" href="#demo-description">这段链接</a><strong>，以及后续内容。</strong>
        </template>
      </template>
    </Empty>
  </div>
</template>

<style scoped>
.empty-description-link { color: inherit; text-decoration: underline; }
</style>
