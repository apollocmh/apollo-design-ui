<script setup lang="ts">
import { Button, ConfigProvider, Drawer } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const open = ref(false);
const custom = ref(false);
const theme = computed(() => custom.value ? {
  components: { Drawer: { footerPaddingBlock: 20, footerPaddingInline: 32, draggerSize: 10, zIndexPopup: 1400 } },
} : {});
</script>

<template>
  <Button type="primary" @click="open = true">Open themed drawer</Button>
  <ConfigProvider :theme="theme">
    <Drawer title="Current component tokens" :open="open" resizable @close="open = false">
      <Button @click="custom = !custom">{{ custom ? 'Use defaults' : 'Override four tokens' }}</Button>
      <p>Footer padding, resize handle and stacking use the current Drawer theme.</p>
      <template #footer>Footer spacing changes immediately.</template>
    </Drawer>
  </ConfigProvider>
</template>
