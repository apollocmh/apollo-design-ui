<script setup lang="ts">
// 对齐 antd 的 demo/render-extra-footer.tsx
import { DatePicker } from '@apollo-design/ui';
</script>

<template>
  <DatePicker placeholder="面板底部有额外内容"><template #extraFooter>自定义面板底部内容</template></DatePicker>
</template>
