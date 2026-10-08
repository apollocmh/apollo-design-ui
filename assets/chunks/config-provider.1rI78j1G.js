const n=`<script setup lang="ts">
import { provide } from 'vue';
import { configContextKey, DEFAULT_CONFIG_CONTEXT, Empty } from '../../index';

/**
 * 用 ConfigProvider 的上下文全局配置 Empty。
 *
 * ⚠️ ConfigProvider **组件**本身尚未实现（走它自己的 G0→G14），所以这里直接
 *    \`provide\` 它的注入键 —— 这正是 ConfigProvider 未来会做的事，不是测试专用后门。
 */
provide(configContextKey, {
  ...DEFAULT_CONFIG_CONTEXT,
  components: {
    empty: {
      image: 'https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg',
    },
  },
});
<\/script>

<template>
  <Empty description="ConfigProvider 提供了默认插画" />
</template>
`;export{n as default};
