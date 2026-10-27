<script setup lang="ts">
import { ConfigProvider, Empty, type EmptyConfig, PRESENTED_IMAGE_SIMPLE } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const custom = ref(false);
// A deterministic original illustration keeps the URL-image example available offline.
const image = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect x="20" y="24" width="80" height="42" rx="8" fill="#8ba6bf"/><path d="M44 24V14h32v10M44 45h32" fill="none" stroke="#18344d" stroke-width="4"/></svg>')}`;
const empty = computed<EmptyConfig>(() => ({
  image: custom.value ? image : PRESENTED_IMAGE_SIMPLE,
  className: custom.value ? 'empty-config-custom' : 'empty-config-simple',
  styles: { description: { fontWeight: custom.value ? 600 : 400 } },
}));
</script>

<template>
  <label><input v-model="custom" type="checkbox" /> Change Provider configuration</label>
  <ConfigProvider :components="{ empty }">
    <Empty description="Current illustration from ConfigProvider" />
  </ConfigProvider>
</template>
