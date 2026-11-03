<script setup lang="ts">
// 对齐 antd demo/render-panel.tsx（PurePanel 静态面板）
import { Button, Input, PopoverPurePanel } from '@apollo-design/ui';
import { ref } from 'vue';

const content = ['Content', 'Content'];
const show = ref(false);
const empty = ref(false);
const count = ref(0);
</script>

<template>
  <div>
    <p style="display: flex; flex-wrap: wrap; gap: 8px">
      <Button @click="show = !show">Toggle popover title</Button>
      <Button @click="empty = !empty">Empty popover title</Button>
      <Button @click="count++">Update popover title</Button>
    </p>
    <div style="display: flex; flex-wrap: wrap; gap: 16px">
      <PopoverPurePanel title="Title">
        <template #content>
          <div>
            <p v-for="(c, i) in content" :key="i">{{ c }}</p>
          </div>
        </template>
      </PopoverPurePanel>
      <PopoverPurePanel
        data-native-popover-panel
        title="Title"
        placement="bottomLeft"
        style="width: 250px; max-width: 100%"
      >
        <template v-if="show" #title>
          <strong v-if="!empty">Native popover {{ count }}</strong>
        </template>
        <template #content>
          <div>
            <p v-for="(c, i) in content" :key="i">{{ c }}</p>
            <Input aria-label="Popover panel note" />
          </div>
        </template>
      </PopoverPurePanel>
    </div>
  </div>
</template>
