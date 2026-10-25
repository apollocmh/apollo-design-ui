<script setup lang="ts">
import { darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider, Image, ImagePreviewGroup, type PreviewConfig } from '@apollo-design/ui';
import { computed, defineComponent, h, onMounted, ref } from 'vue';
import { useLockFocus } from '../../../packages/a11y/dist/index.mjs';
import { Portal } from '../../../packages/portal/dist/index.mjs';
import TokenDemo from '../../../packages/ui/src/image/demo/component-token.vue';
import MaskDemo from '../../../packages/ui/src/image/demo/preview-mask.vue';

const query = new URLSearchParams(location.search);
const scenario = query.get('case') ?? 'default';
const group = query.get('target') === 'group';
const revision = ref(0);
const container = ref<HTMLElement | null>(null);
const frame = ref<HTMLIFrameElement | null>(null);
const frameReady = ref(false);
function installFrameStyles() {
  const doc = frame.value?.contentDocument;
  if (!doc) return;
  const style = doc.createElement('style');
  style.textContent = Array.from(document.styleSheets)
    .flatMap((sheet) => Array.from(sheet.cssRules, (rule) => rule.cssText))
    .join('\n');
  doc.head.appendChild(style);
  frameReady.value = true;
}
const FocusFoundation = defineComponent({
  setup() {
    const element = ref<HTMLElement | null>(null);
    useLockFocus(true, element);
    onMounted(() => element.value?.focus());
    return () =>
      h(
        Portal,
        { open: true, getContainer: () => frame.value?.contentDocument?.body ?? document.body },
        {
          default: () =>
            h(
              'div',
              {
                ref: (node: unknown) => {
                  element.value = node instanceof HTMLElement ? node : null;
                },
                role: 'dialog',
                'aria-label': 'Foundation frame focus',
                tabindex: -1,
              },
              [h('button', { type: 'button' }, 'Foundation inside')],
            ),
        },
      );
  },
});
const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140"><rect width="240" height="140" fill="#38598b"/></svg>')}`;
const broken = '/audit-broken-source.png';
const useFallback = scenario.includes('fallback');
const imageSource = useFallback ? broken : source;
const alt = scenario === 'no-alt' ? undefined : 'Contract audit first';
// Keep the resolver identity stable: the Portal must track its reactive result.
const crossDocumentContainer = () =>
  revision.value % 3 === 0
    ? (frame.value?.contentDocument?.body ?? document.body)
    : revision.value % 3 === 1
      ? (container.value ?? document.body)
      : document.body;
const preview = computed<PreviewConfig>(() => {
  if (scenario === 'mask')
    return {
      mask: { blur: true, className: 'audit-mask-object', style: { borderTopWidth: '7px' } },
    };
  if (scenario === 'container')
    return revision.value % 2
      ? { getContainer: () => document.body }
      : { getContainer: () => container.value ?? document.body };
  if (scenario === 'cross-document') return { getContainer: crossDocumentContainer };
  if (scenario === 'step') return { scaleStep: revision.value ? 0.25 : 0.5 };
  return {};
});
const theme = computed(() =>
  scenario === 'theme'
    ? {
        algorithm: darkAlgorithm,
        token: { colorBgSpotlight: revision.value ? '#234567' : '#123456' },
        components: { Image: { previewOperationSize: revision.value ? 27 : 31 } },
      }
    : undefined,
);
const transformed = ref<{ scale: number } | null>(null);
const opened = ref(0);
const errors = ref(0);
</script>

<template>
  <section data-image-audit-fixture>
    <nav class="image-audit-controls" aria-label="Image audit controls"><button type="button" @mousedown.prevent @click="revision++">Update audit configuration</button></nav>
    <div ref="container" data-image-audit-container />
    <iframe v-if="scenario === 'cross-document' || scenario === 'focus-foundation'" ref="frame" title="Audit target document" data-image-audit-frame srcdoc="<!doctype html><html lang='en'><head><title>Audit target</title></head><body><button data-frame-outside>Frame outside</button></body></html>" style="width: 700px; height: 480px" @load="installFrameStyles" />
    <FocusFoundation v-if="scenario === 'focus-foundation' && frameReady" />
    <MaskDemo v-if="scenario === 'public-mask-demo'" />
    <TokenDemo v-if="scenario === 'public-token-demo'" />
    <ConfigProvider v-if="scenario !== 'focus-foundation' && scenario !== 'public-mask-demo' && scenario !== 'public-token-demo'" :theme="theme">
      <section data-image-audit-theme>
        <ImagePreviewGroup v-if="group" :preview="preview" :class-names="scenario === 'semantics' ? { root: 'audit-group-root' } : undefined" :styles="scenario === 'semantics' ? { root: { borderTopWidth: '9px' } } : undefined" @transform="transformed = $event" @open-change="opened++">
          <Image :src="imageSource" :fallback="useFallback ? source : undefined" :src-set="scenario === 'srcset-fallback' ? '/audit-broken-candidate.png 1x' : undefined" :alt="alt" :width="180" :height="105" data-image-audit-trigger @error="errors++" />
          <Image :src="source" alt="Contract audit second" :width="180" :height="105" />
          <template v-if="scenario === 'cross-document' || scenario === 'container'" #previewImage="info"><figure class="image-audit-editor"><component :is="info.originNode" /><input aria-label="Cross document note" /></figure></template>
        </ImagePreviewGroup>
        <Image v-else :src="imageSource" :fallback="useFallback ? source : undefined" :src-set="scenario === 'srcset-fallback' ? '/audit-broken-candidate.png 1x' : undefined" :alt="alt" :width="180" :height="105" :preview="preview" data-image-audit-trigger @transform="transformed = $event" @open-change="opened++" @error="errors++">
          <template v-if="scenario === 'cross-document' || scenario === 'container'" #previewImage="info"><figure class="image-audit-editor"><component :is="info.originNode" /><input aria-label="Cross document note" /></figure></template>
        </Image>
      </section>
    </ConfigProvider>
    <output data-image-audit-state hidden>{{ JSON.stringify({ scenario, group, revision, transformed, opened, errors }) }}</output>
  </section>
</template>

<style>
.image-audit-controls { position: fixed; z-index: 3000; top: 0; left: 0; background: var(--apollo-color-bg-container); }
[data-image-audit-fixture] { padding-top: 70px; }
.image-audit-editor { display: flex; flex-direction: column; align-items: center; margin: 0; }
.image-audit-editor input { color: var(--apollo-color-text); background: var(--apollo-color-bg-container); }
</style>
