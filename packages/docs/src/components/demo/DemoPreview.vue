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
import { resolveDemoLayout } from '../../composables/demo-layout';
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

/** V3：画布档位 / 跨度（默认按组件类别推断，demo frontmatter 可覆盖）。 */
const layout = computed(() => resolveDemoLayout(props.demo));
const canvasStyle = computed(() => {
  const minHeight = props.demo.preview?.minHeight;
  return minHeight ? { minHeight: `${minHeight}px` } : undefined;
});

function reset(): void {
  resetToken.value += 1;
  boundaryKey.value += 1;
}
</script>

<template>
  <section
    :id="`demo-${demo.name}`"
    class="demo-preview"
    :class="[
      `demo-preview--${layout.size}`,
      `demo-preview--span-${layout.span}`,
      { 'full-width': fullWidth },
    ]"
    :aria-labelledby="`demo-${demo.name}-title`"
  >
    <!-- V3：预览优先 —— Canvas 是卡片第一视觉，标题/说明在画布之后。 -->
    <div
      class="demo-canvas"
      :class="{ 'demo-canvas-viewport': previewMode === 'viewport' }"
      :style="canvasStyle"
    >
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
  margin: 0;
  overflow: hidden;
  background: var(--site-bg);
}

/*
 * V3 画布档位：
 * - compact：小控件的留白下限（18–20px），不制造空高；
 * - interactive：默认交互控件（24px）；
 * - full：宽内容（24px）+ 占满栅格行。
 * 画布不再画虚线装饰边，卡片边界由外框承担。
 */
.demo-canvas {
  padding: 24px 20px;
  /* 示例画布 = 组件库令牌作用域（--apollo-* 来自 html 上的 tokens.css）；
     站点令牌不进入这里，组件视觉与发布产物一致 */
  color: var(--apollo-color-text, rgba(0, 0, 0, 0.88));
}

.demo-preview--compact .demo-canvas {
  padding: 18px 20px;
}

.demo-preview--full .demo-canvas {
  padding: 24px;
}

/* 独立视口画布：窗口自身带边框，外边距收一点 */
.demo-canvas-viewport {
  padding: 16px;
  background: var(--site-bg-soft);
}

.demo-preview-head {
  padding: 14px 18px 0;
  border-top: 1px solid var(--site-border);
}

.demo-preview--compact .demo-preview-head {
  padding: 12px 16px 0;
}

.demo-preview-title {
  margin: 0;
  font-size: 14px;
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
  padding: 8px 18px 2px;
  color: var(--site-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.demo-preview--compact .demo-preview-desc {
  padding: 6px 16px 2px;
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

/* 栅格跨度（V3）：full 档占满一行；数字跨度由父级 grid 解释。 */
.demo-preview--span-full {
  grid-column: 1 / -1;
}

.demo-preview--span-2 {
  grid-column: span 2;
}
</style>
