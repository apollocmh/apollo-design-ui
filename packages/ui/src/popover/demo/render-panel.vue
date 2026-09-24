<script setup lang="ts">
// 对齐 antd demo/render-panel.tsx（PurePanel 静态面板）
import { PopoverPurePanel } from '@apollo-design/ui';

const content = ['Content', 'Content'];
</script>

<template>
  <div style="display: flex; gap: 16px">
    <PopoverPurePanel title="Title">
      <template #content>
        <div>
          <p v-for="(c, i) in content" :key="i">{{ c }}</p>
        </div>
      </template>
    </PopoverPurePanel>
    <PopoverPurePanel title="Title" placement="bottomLeft" style="width: 250px">
      <template #content>
        <div>
          <p v-for="(c, i) in content" :key="i">{{ c }}</p>
        </div>
      </template>
    </PopoverPurePanel>
  </div>
</template>
