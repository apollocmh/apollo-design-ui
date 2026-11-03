<script setup lang="ts">
import { Button, ConfigProvider, Flex, notification } from '@apollo-design/ui';
import { ref } from 'vue';

const InternalPanel = notification._InternalPanelDoNotUseOrYouWillBeFired;
const custom = ref(true);
const theme = {
  components: {
    Notification: {
      width: 320,
      zIndexPopup: 2200,
      progressBg: 'var(--apollo-color-success)',
      colorSuccessBg: 'var(--apollo-color-success-bg)',
      colorErrorBg: 'var(--apollo-color-error-bg)',
      colorInfoBg: 'var(--apollo-color-info-bg)',
      colorWarningBg: 'var(--apollo-color-warning-bg)',
    },
  },
};
</script>

<template>
  <Flex vertical gap="middle" align="flex-start">
    <Button @click="custom = !custom">{{ custom ? 'Use default tokens' : 'Use custom tokens' }}</Button>
    <InternalPanel title="Default notification" description="Default width and surface." type="info" />
    <ConfigProvider :theme="custom ? theme : undefined">
      <InternalPanel title="Custom notification" description="Width and state surface follow the current component tokens." type="success" />
    </ConfigProvider>
  </Flex>
</template>
