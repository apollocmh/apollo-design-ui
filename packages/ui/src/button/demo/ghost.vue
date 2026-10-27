<script setup lang="ts">
import { Button, ConfigProvider, Space } from '@apollo-design/ui';
</script>
<template>
  <ConfigProvider :theme="{components:{Button:{defaultGhostColor:'var(--apollo-color-text)',defaultGhostBorderColor:'var(--apollo-color-border)'}}}">
    <div style="background:var(--apollo-color-fill-tertiary);padding:16px">
      <Space wrap>
        <Button type="primary" ghost>Primary</Button>
        <Button ghost>Default</Button>
        <Button type="dashed" ghost>Dashed</Button>
        <Button type="primary" danger ghost>Danger</Button>
      </Space>
    </div>
  </ConfigProvider>
</template>
