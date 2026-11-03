<script setup lang="ts">
import { Button, ConfigProvider, Flex, message } from '@apollo-design/ui';
import { ref } from 'vue';

const InternalPanel = message._InternalPanelDoNotUseOrYouWillBeFired;
const custom = ref(true);
const theme = {
  components: {
    Message: {
      contentBg: 'var(--apollo-color-primary-bg)',
      contentPadding: '16px 24px',
      zIndexPopup: 2100,
    },
  },
};
</script>

<template>
  <Flex vertical gap="middle" align="flex-start">
    <Button @click="custom = !custom">{{ custom ? 'Use default tokens' : 'Use custom tokens' }}</Button>
    <InternalPanel content="Default message" type="info" />
    <ConfigProvider :theme="custom ? theme : undefined">
      <InternalPanel content="Message with current component tokens" type="success" />
    </ConfigProvider>
  </Flex>
</template>
