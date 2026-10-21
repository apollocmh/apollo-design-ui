<script setup lang="ts">
// 组件 Token：直接覆写根元素上的 `--apollo-alert-*` 变量。
// `ConfigProvider theme.components` 目前只参与主题合并、尚未产出 CSS 变量，
// 因此这里用与 layout/component-token 相同的做法：在根元素覆写变量。
import { Alert } from '@apollo-design/ui';

const defaultTokenStyle = {
  '--apollo-alert-border-radius': '16px',
  '--apollo-alert-default-padding': '12px 20px',
};

const descriptionTokenStyle = {
  '--apollo-alert-with-description-padding': '16px 20px',
  '--apollo-alert-with-description-icon-size': '28px',
};
</script>

<template>
  <div class="alert-component-token-demo">
    <Alert
      show-icon
      type="success"
      title="Custom border radius and padding"
      :style="defaultTokenStyle"
    />
    <Alert
      show-icon
      type="info"
      title="Custom description spacing"
      description="The icon size and padding follow the alert component tokens."
      :style="descriptionTokenStyle"
    />
  </div>
</template>

<style scoped>
.alert-component-token-demo {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
