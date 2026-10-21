<script setup lang="ts">
// 组件/主题 Token：在容器上覆盖 Typography 消费的 CSS 变量
import { Paragraph, Text, Title } from '@apollo-design/ui';
</script>

<template>
  <div class="demo-typography-token">
    <Title :level="3">组件 Token 标题</Title>
    <Paragraph>
      正文颜色来自 --apollo-color-text，标题颜色来自 --apollo-color-text-heading。
    </Paragraph>
    <Paragraph>
      <Text type="secondary">次要文本使用 --apollo-color-text-description。</Text>
    </Paragraph>
    <p class="demo-typography-token__hint">
      容器同时覆盖 --apollo-font-size-heading-3 与 --apollo-font-weight-strong。
    </p>
  </div>
</template>

<style>
.demo-typography-token {
  --apollo-color-text: #006d75;
  --apollo-color-text-heading: #08979c;
  --apollo-color-text-description: #5cdbd3;
  --apollo-font-size-heading-3: 30px;
  --apollo-font-weight-strong: 700;
}

.demo-typography-token__hint {
  margin: 12px 0 0;
  color: #999;
  font-size: 12px;
}
</style>
