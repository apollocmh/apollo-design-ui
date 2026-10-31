<script setup lang="ts">
import {
  Button,
  ConfigProvider,
  type ConfigProviderProps,
  Drawer,
  type DrawerClosable,
} from '@apollo-design/ui';
import { computed, ref } from 'vue';

const open = ref(false);
const configured = ref(true);
const closable: DrawerClosable = { placement: 'end', 'aria-label': 'Dismiss drawer' };
const components = computed((): NonNullable<ConfigProviderProps['components']> => {
  if (!configured.value) return {};
  return {
    drawer: {
      closable,
      styles: { body: { padding: '32px' }, footer: { background: '#f5f5f5' } },
    },
  };
});
</script>

<template>
  <Button type="primary" @click="open = true">Open configured drawer</Button>
  <ConfigProvider :components="components">
    <Drawer title="Current provider configuration" :open="open" @close="open = false">
      <Button @click="configured = !configured">{{ configured ? 'Remove configuration' : 'Apply configuration' }}</Button>
      <p>The close button placement and body spacing follow provider replacement.</p>
      <template #footer>Provider footer styles</template>
    </Drawer>
  </ConfigProvider>
</template>
