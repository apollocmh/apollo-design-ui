<script setup lang="ts">
import { UserOutlined } from '@apollo-design/icons';
import { Avatar, AvatarGroup, ConfigProvider, Space, Switch } from '@apollo-design/ui';
import { ref } from 'vue';

const custom = ref(true);
const tokens = {
  containerSize: 48,
  containerSizeLG: 64,
  containerSizeSM: 36,
  textFontSize: 16,
  textFontSizeLG: 18,
  textFontSizeSM: 14,
  iconFontSize: 24,
  iconFontSizeLG: 32,
  iconFontSizeSM: 20,
  groupSpace: 10,
  groupOverlapping: -12,
  groupBorderColor: '#6250cc',
};
</script>
<template>
  <Space vertical :size="16">
    <label>Use custom Avatar tokens <Switch v-model:checked="custom" aria-label="Use custom Avatar tokens" /></label>
    <ConfigProvider :theme="custom ? {components:{Avatar:tokens}} : undefined">
      <Space :size="16" wrap>
        <Avatar size="small">S</Avatar><Avatar>M</Avatar><Avatar size="large">L</Avatar>
        <Avatar><template #icon><UserOutlined /></template></Avatar>
        <AvatarGroup :max="{count:2,popover:{trigger:'click'}}"><Avatar>A</Avatar><Avatar>B</Avatar><Avatar>C</Avatar><Avatar>D</Avatar></AvatarGroup>
      </Space>
    </ConfigProvider>
  </Space>
</template>
