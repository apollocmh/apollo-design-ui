<script setup lang="ts">
import { ConfigProvider, PopoverPurePanel } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const content = ['Content', 'Content'];
const padding = ref(12);
const theme = computed(() => ({
  components: {
    Popover: { titleMinWidth: 200, innerPadding: padding.value, titleMarginBottom: 10 },
  },
}));
</script>

<template>
  <ConfigProvider :theme="theme">
    <button type="button" @click="padding = padding === 12 ? 20 : 12">Padding: {{ padding }}px</button>
    <div style="display: flex; gap: 16px">
      <PopoverPurePanel title="Title" class="demo-current-popover">
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
  </ConfigProvider>
</template>
