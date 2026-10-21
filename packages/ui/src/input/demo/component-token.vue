<script setup lang="ts">
// 组件 Token：覆盖 Input 根节点上的 --apollo-input-* 变量
import { Input } from '@apollo-design/ui';
</script>

<template>
  <div class="demo-input-token">
    <div class="demo-input-token__field">
      <span class="demo-input-token__label">内边距与紫色聚焦态</span>
      <Input aria-label="令牌示例输入框" placeholder="聚焦查看紫色描边" />
    </div>
    <div class="demo-input-token__field">
      <span class="demo-input-token__label">带前缀的输入框</span>
      <Input aria-label="带前缀的令牌示例" prefix="@" default-value="apollo" />
    </div>
    <p class="demo-input-token__hint">
      覆盖 --apollo-input-padding-inline / --apollo-input-hover-border-color /
      --apollo-input-active-border-color / --apollo-input-active-shadow。
    </p>
  </div>
</template>

<style>
.demo-input-token {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 360px;
}

.demo-input-token__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.demo-input-token__label {
  color: #595959;
  font-size: 12px;
}

.demo-input-token .apollo-input,
.demo-input-token .apollo-input-affix-wrapper {
  --apollo-input-padding-inline: 16px;
  --apollo-input-hover-border-color: #9254de;
  --apollo-input-active-border-color: #722ed1;
  --apollo-input-hover-bg: #f9f0ff;
  --apollo-input-active-bg: #fff;
  --apollo-input-active-shadow: 0 0 0 2px rgb(114 46 209 / 18%);
}

.demo-input-token__hint {
  margin: 0;
  color: #999;
  font-size: 12px;
}
</style>
