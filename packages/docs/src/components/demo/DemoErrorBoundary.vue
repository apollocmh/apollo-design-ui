<script setup lang="ts">
/**
 * DemoErrorBoundary —— 局部错误边界。
 *
 * 只捕获子树（当前示例）的错误：动态 import 失败交由 DemoRenderer 的加载态处理，
 * 这里兜的是「组件渲染期抛错」。关键行为：
 *  - 返回 false 阻止错误冒泡到 Vue 全局 handler ⇒ 一个示例崩了，
 *    官网导航和其它文档内容照常可用；
 *  - 重试 = 清空错误 + 通知父级换 resetToken 重建子树（不是简单刷新页面）。
 */
import { onErrorCaptured, ref } from 'vue';
import { useSiteLocale } from '../../composables/locale';

const emit = defineEmits<{ retry: [] }>();

const { t } = useSiteLocale();
const error = ref<{ message: string; stack?: string } | null>(null);

onErrorCaptured((err) => {
  error.value = { message: err.message, stack: err.stack?.split('\n').slice(0, 4).join('\n') };
  // 阻止继续冒泡：示例失败不能拖垮整个文档页
  return false;
});

function retry(): void {
  error.value = null;
  emit('retry');
}

defineExpose({ error });
</script>

<template>
  <slot v-if="!error" />
  <div v-else class="demo-error" role="alert">
    <p class="demo-error-title">⚠️ {{ t('demoError') }}</p>
    <pre class="demo-error-detail">{{ error.message }}</pre>
    <button type="button" class="demo-error-retry" @click="retry">{{ t('retry') }}</button>
  </div>
</template>

<style scoped>
.demo-error {
  padding: 24px;
  border: 1px dashed #ff4d4f66;
  border-radius: var(--site-radius);
  background: color-mix(in srgb, #ff4d4f 6%, transparent);
}

.demo-error-title {
  margin: 0 0 8px;
  font-weight: 600;
  color: var(--site-text);
}

.demo-error-detail {
  margin: 0 0 12px;
  font-family: var(--site-font-code);
  font-size: 12px;
  color: var(--site-text-secondary);
  white-space: pre-wrap;
}

.demo-error-retry {
  border: 1px solid var(--site-border-strong);
  background: var(--site-bg);
  color: var(--site-brand);
  border-radius: 6px;
  padding: 4px 14px;
  cursor: pointer;
}

.demo-error-retry:hover {
  border-color: var(--site-brand);
}
</style>
