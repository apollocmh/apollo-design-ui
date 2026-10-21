<script setup lang="ts">
// 滑动切换：开启面板动画（animated.tabPane）
import { Tabs } from '@apollo-design/ui';

const items = [
  { key: '1', label: '第一步', children: '填写基本信息，切换页签查看面板过渡。' },
  { key: '2', label: '第二步', children: '上传相关材料，面板会以切换动效进入。' },
  { key: '3', label: '第三步', children: '确认并提交，指示条与面板同时参与动画。' },
];
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px; width: 440px">
    <Tabs
      default-active-key="1"
      :items="items"
      :animated="{ inkBar: true, tabPane: true }"
    />
    <p style="margin: 0; color: #999; font-size: 12px">
      animated.tabPane 为 true 时启用面板切换动效；默认值为 { inkBar: true, tabPane: false }。
    </p>
  </div>
</template>
