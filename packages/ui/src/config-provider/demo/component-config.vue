<script setup lang="ts">
/**
 * 组件级配置 —— 渐进式类型形态（D25）。
 *
 * `empty` / `divider` / `spin` / `form` 是**已落地组件**的精确 prop（有完整类型提示）；
 * 其余组件走 `components` 这个弱类型逃生口，等它们落地后再提升为精确 prop。
 *
 * 合并规则：组件自己的 prop **优先于** ConfigProvider 的配置。
 */
import { ConfigProvider, Divider, Empty } from '../../index';
</script>

<template>
  <ConfigProvider
    :empty="{
      className: 'cp-empty',
      classNames: { description: 'cp-empty-description' },
      styles: { image: { opacity: 0.6 } },
    }"
    :divider="{ className: 'cp-divider' }"
  >
    <Empty description="插画与描述都来自 ConfigProvider" />
    <Divider />
  </ConfigProvider>
</template>
