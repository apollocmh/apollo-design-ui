<script setup lang="ts">
import { Alert, Button, ConfigProvider } from '@apollo-design/ui';
import { ref } from 'vue';

const custom = ref(true);
const draft = ref('Saved business draft');
</script>

<template>
  <div class="alert-component-token-demo">
    <Button @click="custom = !custom">{{ custom ? 'Use defaults' : 'Use custom tokens' }}</Button>
    <ConfigProvider :theme="custom ? { components: { Alert: {
      borderRadius: 16,
      defaultPadding: '12px 20px',
      withDescriptionPadding: '16px 20px',
      withDescriptionIconSize: 28,
    } } } : undefined">
      <Alert show-icon type="success" title="Current border radius and padding" />
      <Alert show-icon type="info" title="Current description spacing">
        <template #description>
          <label>Business draft <input v-model="draft" aria-label="Alert theme draft" /></label>
        </template>
      </Alert>
    </ConfigProvider>
  </div>
</template>

<style scoped>
.alert-component-token-demo { display: flex; flex-direction: column; gap: 16px; }
</style>
