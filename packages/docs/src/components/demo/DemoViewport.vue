<script setup lang="ts">
/**
 * DemoViewport —— 模拟独立浏览器视口的示例画布（DOC-01 / DOC-11）。
 *
 * 用于 `position: fixed`（FloatButton / BackTop）等必须以**视口**为参照的组件：
 * 不修改组件样式、不把 fixed 改成 absolute，而是把示例放进一个固定尺寸的
 * iframe 窗口；组件在窗口内部滚动、吸附，行为与真实页面一致。
 *
 * 数据来源：demo frontmatter 的 `preview.mode: viewport`（由内容管线解析），
 * 不做 `component === 'float-button'` 之类的硬编码判断。
 */
import { useSiteLocale } from '../../composables/locale';
import type { DemoMeta } from '../../types/manifest';
import DemoFrame from './DemoFrame.vue';

defineProps<{ demo: DemoMeta }>();

const { t } = useSiteLocale();
</script>

<template>
  <div class="demo-viewport">
    <div class="demo-viewport-bar">
      <span class="demo-viewport-dots" aria-hidden="true">
        <i /><i /><i />
      </span>
      <span class="demo-viewport-title">{{ t('liveDemo') }}</span>
    </div>
    <DemoFrame :demo="demo" mode="viewport" />
  </div>
</template>

<style scoped>
.demo-viewport {
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius);
  overflow: hidden;
  background: var(--site-bg);
  box-shadow: inset 0 0 0 1px var(--site-bg-soft);
}

.demo-viewport-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--site-border);
  background: var(--site-bg-soft);
}

.demo-viewport-dots {
  display: inline-flex;
  gap: 5px;
}

.demo-viewport-dots i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--site-border);
}

.demo-viewport-title {
  font-size: 12px;
  color: var(--site-text-tertiary);
  letter-spacing: 0.02em;
}
</style>
