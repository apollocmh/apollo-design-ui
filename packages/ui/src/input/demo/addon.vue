<script setup lang="ts">
// addonBefore / addonAfter 已 deprecated，推荐改用 Space.Compact + SpaceAddon
import { Input, SpaceAddon, SpaceCompact } from '@apollo-design/ui';
import { ref } from 'vue';

const site = ref('apollo');
const amount = ref('');
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px; width: 320px">
    <SpaceCompact>
      <SpaceAddon>https://</SpaceAddon>
      <Input v-model:value="site" aria-label="站点前缀" />
      <SpaceAddon>.com</SpaceAddon>
    </SpaceCompact>
    <SpaceCompact>
      <SpaceAddon>￥</SpaceAddon>
      <Input v-model:value="amount" aria-label="金额" placeholder="金额" />
      <SpaceAddon>RMB</SpaceAddon>
    </SpaceCompact>
    <div style="font-size: 12px; color: var(--apollo-color-text-tertiary)">
      site：{{ site || '-' }}；amount：{{ amount || '-' }}
    </div>
  </div>
</template>
