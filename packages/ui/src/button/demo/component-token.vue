<script setup lang="ts">
/**
 * 零运行时等价：Button 的组件 token 在构建期落进 CSS，运行时通过覆盖它消费的
 * 别名 CSS 变量（`--apollo-color-primary*` / `--apollo-border-radius*`）来定制外观。
 */
import { Button, Space } from '@apollo-design/ui';
import { ref } from 'vue';

const clicks = ref(0);
</script>

<template>
  <div class="demo-button-token">
    <Space wrap>
      <Button type="primary" @click="clicks++">Primary</Button>
      <Button type="primary" ghost>Primary Ghost</Button>
      <Button>Default</Button>
      <Button type="primary" danger>Danger</Button>
    </Space>
    <div class="demo-button-token__hint">
      点击 Primary 次数：{{ clicks }}（主色与圆角来自下方 CSS 变量覆盖）
    </div>
  </div>
</template>

<style>
.demo-button-token {
  --apollo-color-primary: #00b96b;
  --apollo-color-primary-hover: #36cfc9;
  --apollo-color-primary-active: #08979c;
  --apollo-border-radius: 16px;
  --apollo-border-radius-sm: 12px;
  --apollo-border-radius-lg: 20px;
  font-family: sans-serif;
}

.demo-button-token__hint {
  margin-top: 12px;
  color: #999;
  font-size: 12px;
}
</style>
