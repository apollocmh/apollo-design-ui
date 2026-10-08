<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from 'vue';

const props = defineProps<{
  /** 组件目录名（packages/ui/src/<component>）。 */
  component: string;
  /** demo 文件名（不含扩展名）。 */
  demo: string;
}>();

const demos = import.meta.glob('../../../ui/src/*/demo/*.vue');
const sources = import.meta.glob('../../../ui/src/*/demo/*.vue', {
  query: '?raw',
  import: 'default',
});

const key = `../../../ui/src/${props.component}/demo/${props.demo}.vue`;

const loaded = ref(false);
const showCode = ref(false);
const source = ref('');

onMounted(async () => {
  // 演示代码在客户端异步加载（构建期不做 SSR 求值，浏览器 API 组件也不会炸构建）
  source.value = (await sources[key]()) as string;
});

const demoComp = defineAsyncComponent(() => demos[key]());
</script>

<template>
  <div class="demo-preview">
    <div class="demo-preview-canvas">
      <ClientOnly>
        <component :is="demoComp" />
        <template #fallback>
          <div class="demo-preview-loading">加载中…</div>
        </template>
      </ClientOnly>
    </div>
    <div class="demo-preview-toolbar">
      <button
        class="demo-preview-toggle"
        type="button"
        :aria-expanded="showCode"
        @click="showCode = !showCode"
      >
        {{ showCode ? '收起代码' : '查看代码' }}
      </button>
    </div>
    <div v-show="showCode" class="demo-preview-code">
      <pre class="vp-code"><code>{{ source }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
.demo-preview {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  margin: 16px 0 24px;
  overflow: hidden;
}

.demo-preview-canvas {
  padding: 24px;
}

.demo-preview-loading {
  color: var(--vp-c-text-3);
  font-size: 13px;
}

.demo-preview-toolbar {
  border-top: 1px dashed var(--vp-c-divider);
  padding: 6px 12px;
  text-align: right;
}

.demo-preview-toggle {
  background: transparent;
  border: none;
  color: var(--vp-c-brand-1);
  cursor: pointer;
  font-size: 13px;
  padding: 2px 4px;
}

.demo-preview-code {
  border-top: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  max-height: 480px;
  overflow: auto;
}

.demo-preview-code pre {
  margin: 0;
  padding: 16px;
  font-size: 13px;
  line-height: 1.6;
}
</style>
