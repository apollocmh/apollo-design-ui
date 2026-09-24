<script setup lang="ts">
// 对齐 antd demo/component-token.tsx（PurePanel 静态面板 ×2）。
// ⚠️ ConfigProvider 的 components.Popover token 覆盖不支持（D25/D83）⇒
//    以默认 token 渲染（结构一致，token 覆盖路径见 L7 的 prepareComponentToken 判据）。
import { PopoverPurePanel } from '@apollo-design/ui';

const content = ['Content', 'Content'];
</script>

<template>
  <div style="display: flex; gap: 16px">
    <PopoverPurePanel title="Title">
      <template #content>
        <div>
          <p v-for="(c, i) in content" :key="i">{{ c }}</p>
        </div>
      </template>
    </PopoverPurePanel>
    <PopoverPurePanel title="Title" placement="bottomLeft" style="width: 250px">
      <template #content>
        <div>
          <p v-for="(c, i) in content" :key="i">{{ c }}</p>
        </div>
      </template>
    </PopoverPurePanel>
  </div>
</template>
