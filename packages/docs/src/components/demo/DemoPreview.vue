<script setup lang="ts">
/**
 * DemoPreview —— 预览卡片与状态协调。
 *
 * 组成：标题 + 描述（双语，缺失回退提示）+ 画布（内联或 iframe）+ 工具栏 + 源码面板。
 * 状态归这里：源码展开、重置计数；画布内的运行状态归 DemoRenderer。
 *
 * 重置语义：递增 resetToken ⇒ DemoRenderer 重建组件子树 ⇒ 只影响当前示例。
 */
import { computed, ref } from 'vue';
import { useSiteLocale } from '../../composables/locale';
import type { DemoMeta } from '../../types/manifest';
import DemoErrorBoundary from './DemoErrorBoundary.vue';
import DemoFrame from './DemoFrame.vue';
import DemoProvider from './DemoProvider.vue';
import DemoRenderer from './DemoRenderer.vue';
import DemoSource from './DemoSource.vue';
import DemoToolbar from './DemoToolbar.vue';
import DemoViewport from './DemoViewport.vue';

const props = defineProps<{ demo: DemoMeta; fullWidth?: boolean }>();

const { t, pick, locale } = useSiteLocale();

const expanded = ref(false);
const resetToken = ref(0);
const boundaryKey = ref(0);

const instanceId = `${props.demo.component}-${props.demo.name}`;

/**
 * ⚠️ 不能硬编码 `/components/...`（DOC-02）：站点部署在 GitHub Pages 子路径
 * `/apollo-design-ui/` 下时，根路径链接会 404。用 `BASE_URL` 拼接，SSR 可用；
 * 不用 `router.resolve()` 是为了让没有 router 的单元测试也能挂载本组件。
 */
const standaloneHref = computed(() => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/components/${props.demo.component}/demo/${props.demo.name}`;
});

const title = computed(() => pick(props.demo.title));
const desc = computed(() => pick(props.demo.descHtml));

/** 兼容旧元数据（没有 `preview` 字段时按 `iframe` 推断）。 */
const previewMode = computed(
  () => props.demo.preview?.mode ?? (props.demo.iframe ? 'isolated' : 'inline'),
);

function reset(): void {
  resetToken.value += 1;
  boundaryKey.value += 1;
}
</script>

<template>
  <section
    :id="`demo-${demo.name}`"
    class="demo-preview"
    :class="{ 'full-width': fullWidth }"
    :aria-labelledby="`demo-${demo.name}-title`"
  >
    <header class="demo-preview-head">
      <h4 :id="`demo-${demo.name}-title`" class="demo-preview-title">
        {{ title.text }}
        <a class="demo-anchor" :href="`#demo-${demo.name}`" aria-label="#">#</a>
        <span v-if="locale === 'en-US' && demo.title.enFallback" class="demo-lang-badge">zh</span>
      </h4>
      <p v-if="locale === 'en-US' && desc.fallback" class="site-fallback-hint">
        {{ t('fallbackHint') }}
      </p>
    </header>

    <div class="demo-canvas" :class="{ 'demo-canvas-viewport': previewMode === 'viewport' }">
      <DemoViewport v-if="previewMode === 'viewport'" :demo="demo" />
      <DemoFrame v-else-if="previewMode === 'isolated'" :demo="demo" />
      <DemoProvider v-else :instance-id="instanceId">
        <DemoErrorBoundary :key="boundaryKey" @retry="reset">
          <DemoRenderer
            :component="demo.component"
            :demo="demo.name"
            :reset-token="resetToken"
            class="demo-canvas-inner"
          />
        </DemoErrorBoundary>
      </DemoProvider>
    </div>

    <!-- 画布优先（DOC-07）：描述放在预览之后，先把示例本身推到首屏。 -->
    <!-- 描述为构建期 markdown-it 渲染产物（第一方内容，非用户输入） -->
    <div class="demo-preview-desc" v-html="desc.text" />

    <DemoToolbar
      :demo="demo"
      :expanded="expanded"
      :standalone-href="standaloneHref"
      @toggle-code="expanded = !expanded"
      @reset="reset"
    />

    <DemoSource v-if="expanded" :sources="demo.sources" />
  </section>
</template>

<style scoped>
.demo-preview {
  border: 1px solid var(--site-border);
  border-radius: var(--site-radius);
  margin: 0 0 20px;
  overflow: hidden;
  background: var(--site-bg);
}

.demo-preview-head {
  padding: 14px 18px 4px;
}

.demo-preview-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--site-text);
  display: flex;
  align-items: center;
  gap: 8px;
}

.demo-anchor {
  color: var(--site-text-tertiary);
  font-weight: 400;
  opacity: 0;
  transition: opacity 0.15s;
}

.demo-preview:hover .demo-anchor {
  opacity: 1;
}

.demo-lang-badge {
  font-size: 10.5px;
  padding: 0 6px;
  border-radius: 4px;
  background: var(--site-bg-soft);
  border: 1px solid var(--site-border);
  color: var(--site-text-tertiary);
  font-weight: 400;
}

.demo-preview-desc {
  padding: 10px 18px 2px;
  color: var(--site-text-secondary);
  font-size: 13.5px;
}

.demo-preview-desc :deep(p) {
  margin: 4px 0 10px;
}

.demo-preview-desc :deep(table) {
  border-collapse: collapse;
  font-size: 12.5px;
  margin-bottom: 10px;
}

.demo-preview-desc :deep(th),
.demo-preview-desc :deep(td) {
  border: 1px solid var(--site-border);
  padding: 4px 10px;
}

.demo-preview-desc :deep(code) {
  font-family: var(--site-font-code);
  font-size: 0.9em;
  background: var(--site-code-bg);
  border: 1px solid var(--site-border);
  border-radius: 4px;
  padding: 0 4px;
}

.demo-canvas {
  padding: 28px;
  border-top: 1px dashed var(--site-border);
  /* 示例画布 = 组件库令牌作用域（--apollo-* 来自 html 上的 tokens.css）；
     站点令牌不进入这里，组件视觉与发布产物一致 */
  color: var(--apollo-color-text, rgba(0, 0, 0, 0.88));
}

/* 独立视口画布：窗口自身带边框，外边距收一点 */
.demo-canvas-viewport {
  padding: 16px;
  background: var(--site-bg-soft);
}
</style>
