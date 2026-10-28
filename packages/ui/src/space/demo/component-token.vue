<script setup lang="ts">
import { Button, ConfigProvider, Space, SpaceAddon, SpaceCompact } from '@apollo-design/ui';
</script>
<template>
  <ConfigProvider :theme="{ token: { paddingXS: 12, colorText: '#224466', colorBgContainer: '#ffffff', colorBgContainerDisabled: '#e8f0f8' } }">
    <Space orientation="vertical"><Space><Button>Alias gap</Button><Button>Current theme</Button></Space><SpaceCompact><SpaceAddon>Scoped addon</SpaceAddon><Button type="primary">Button</Button></SpaceCompact></Space>
  </ConfigProvider>
</template>
