<script setup lang="ts">
/**
 * Direct aliases and the open component configuration map share one consumer path.
 *
 * `empty` / `divider` / `spin` / `form` have precise aliases. Other component defaults
 * use the keys documented by their consumer, such as components.button.shape.
 *
 * 合并规则：组件自己的 prop **优先于** ConfigProvider 的配置。
 */
import { Button, ConfigProvider, Divider, Empty } from '../../index';
</script>

<template>
  <ConfigProvider
    :empty="{
      className: 'cp-empty',
      classNames: { description: 'cp-empty-description' },
      styles: { image: { opacity: 0.6 } },
    }"
    :divider="{ className: 'cp-divider' }"
    :components="{ button: { shape: 'round' } }"
  >
    <Empty description="Provider 配置了插画与描述的样式" />
    <Divider />
    <Button>圆角默认配置</Button>
  </ConfigProvider>
</template>
