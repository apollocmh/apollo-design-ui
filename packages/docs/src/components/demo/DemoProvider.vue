<script setup lang="ts">
/**
 * DemoProvider —— 示例运行环境的提供者。
 *
 * 职责：
 *  - 给每个示例一个稳定、唯一的 DOM 标识（多实例互不冲突的选择器锚点）；
 *  - 用站点当前语言驱动示例内组件的 `ConfigProvider.locale`（Issue I18N-01）：
 *    切换中文/英文后，DatePicker / Modal / Select 等组件的内置文案同步变化；
 *  - 方向（ltr/rtl）在客户端挂载后读取，避免 SSR 阶段直接触碰 `document`。
 *
 * 站点 chrome 不包裹其它组件库 Provider —— 示例内的 Message / Notification
 * 上下文仍是示例自建的；这里同步语言、方向与源主题上下文。
 */

import { en_US, zh_CN } from '@apollo-design/locale';
import { darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider } from '@apollo-design/ui';
import { computed, onMounted, provide, ref } from 'vue';
import { useSiteLocale } from '../../composables/locale';
import { useResolvedTheme } from '../../composables/theme';
import { DEMO_CONTEXT_KEY } from './context';

const props = defineProps<{ instanceId: string }>();

const { locale } = useSiteLocale();
const resetToken = ref(0);
const direction = ref<'ltr' | 'rtl'>('ltr');
const themeReady = ref(false);
const resolvedTheme = useResolvedTheme();
const theme = computed(() =>
  themeReady.value && resolvedTheme.value === 'dark' ? { algorithm: darkAlgorithm } : undefined,
);

const apolloLocale = computed(() => (locale.value === 'zh-CN' ? zh_CN : en_US));

onMounted(() => {
  themeReady.value = true;
  direction.value = document.documentElement.dir === 'rtl' ? 'rtl' : 'ltr';
});

provide(DEMO_CONTEXT_KEY, {
  instanceId: props.instanceId,
  direction: direction.value,
  resetToken,
});

defineExpose({ reset: () => (resetToken.value += 1) });
</script>

<template>
  <ConfigProvider :locale="apolloLocale" :direction="direction" :theme="theme">
    <div class="demo-provider" :data-demo-id="instanceId">
      <slot />
    </div>
  </ConfigProvider>
</template>

<style scoped>
.demo-provider {
  display: contents;
}
</style>
