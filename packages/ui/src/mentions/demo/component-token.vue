<script setup lang="ts">
import { ConfigProvider, Mentions } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const InternalMentions = Mentions._InternalPanelDoNotUseOrYouWillBeFired;

const compact = ref(false);
const options = Array.from({ length: 16 }, (_, index) => ({
  value: `author${index + 1}`,
  label: `Author ${index + 1}`,
}));
const theme = computed(() => ({
  components: {
    Mentions: {
      dropdownHeight: compact.value ? 120 : 500,
      controlItemWidth: compact.value ? 180 : 300,
      zIndexPopup: compact.value ? 1100 : 1000,
    },
  },
}));
</script>

<template>
  <button type="button" :aria-pressed="compact" @click="compact = !compact">Toggle component tokens</button>
  <ConfigProvider :theme="theme">
    <InternalMentions style="width: 100%" value="@" :options="options" aria-label="Custom token mention preview" />
  </ConfigProvider>
</template>
