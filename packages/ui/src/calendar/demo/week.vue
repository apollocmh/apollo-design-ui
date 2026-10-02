<script setup lang="ts">
// 对齐 antd 的 week demo：全屏与迷你两种形态都开 `showWeek`。

import { Calendar } from '@apollo-design/ui';
</script>

<template>
  <Calendar :fullscreen="true" :show-week="true" />
  <br />
  <Calendar :fullscreen="false" :show-week="true" />
</template>
