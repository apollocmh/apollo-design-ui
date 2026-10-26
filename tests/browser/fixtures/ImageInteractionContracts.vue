<script setup lang="ts">
import {
  ConfigProvider,
  Image,
  ImagePreviewGroup,
  type ImageRenderInfo,
  type PreviewConfig,
  type PreviewImageInfo,
} from '@apollo-design/ui';
import { computed, defineComponent, h, onMounted, ref, shallowRef, Teleport } from 'vue';
import RichDemo from '../../../packages/ui/src/image/demo/image-render.vue';
import Preview from '../../../packages/ui/src/image/Preview';

declare global {
  interface Window {
    imageInteractionRoot?: ShadowRoot;
    imageInteractionSource?: ShadowRoot;
  }
}
const query = new URLSearchParams(location.search);
const scenario = query.get('case') ?? 'rich';
const grouped = query.get('target') === 'group';
const opened = ref(false);
const current = ref(0);
const changes = ref(0);
const saved = ref(0);
const phase = ref(0);
const rich = ref(true);
const mounted = ref(true);
const root = shallowRef<HTMLElement | ShadowRoot | null>(null);
const sourceRoot = shallowRef<ShadowRoot | null>(null);
const host = ref<HTMLElement | null>(null);
const frame = ref<HTMLIFrameElement | null>(null);
const inlineTrigger = shallowRef<HTMLElement | null>(null);
const popupContainer = () => root.value ?? document.body;
const source = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="200" height="120" fill="#38598b"/></svg>')}`;
const theme = computed(() =>
  phase.value === 1
    ? { token: { motion: false } }
    : phase.value === 2
      ? { token: { motionDurationSlow: '0s' } }
      : undefined,
);
const preview = computed<PreviewConfig>(() => ({
  getContainer:
    scenario === 'frame' ? () => frame.value?.contentDocument?.body ?? document.body : undefined,
  mask: false,
  cover:
    scenario === 'cover'
      ? h('button', { type: 'button', onClick: () => saved.value++ }, 'Cover save')
      : undefined,
}));
const thumbnail = ({ originNode }: ImageRenderInfo) => [
  originNode,
  h('label', ['Caption', h('input', { 'aria-label': 'Thumbnail caption' })]),
  h('button', { type: 'button', onClick: () => saved.value++ }, 'Save thumbnail'),
];
const previewImage = ({ originNode }: PreviewImageInfo) =>
  h('section', { 'aria-label': 'Editable preview' }, [
    originNode,
    h('input', { 'aria-label': 'Preview caption' }),
    h('button', { type: 'button' }, 'Preview custom last'),
    h(
      'svg',
      {
        role: 'button',
        tabindex: 0,
        width: 24,
        height: 24,
        'aria-label': 'Preview SVG action',
        onClick: () => saved.value++,
        onKeydown: (event: KeyboardEvent) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            saved.value++;
          }
        },
      },
      [h('circle', { cx: 12, cy: 12, r: 10, fill: 'currentColor', 'aria-hidden': true })],
    ),
  ]);
const Source = defineComponent({
  setup() {
    const slots = () =>
      (scenario === 'rich' || scenario === 'rich-no-origin') && rich.value
        ? {
            imageRender: (info: ImageRenderInfo) =>
              scenario === 'rich-no-origin' ? thumbnail(info).slice(1) : thumbnail(info),
          }
        : {};
    return () =>
      scenario === 'inline'
        ? h('section', [
            h(
              'button',
              {
                type: 'button',
                'aria-label': 'Interaction first',
                ref: (node: unknown) => {
                  inlineTrigger.value = node instanceof HTMLElement ? node : null;
                },
                onClick: () => (opened.value = true),
              },
              'Open internal inline preview',
            ),
            h(
              Preview,
              {
                prefixCls: 'apollo-image-preview',
                src: source,
                alt: 'Interaction first',
                open: opened.value,
                getContainer: false,
                getTriggerElement: () => inlineTrigger.value,
                inGroup: grouped,
                count: grouped ? 2 : 1,
                current: current.value,
                mask: false,
                onClose: () => (opened.value = false),
                onActive: (offset: number) => {
                  current.value += offset;
                  changes.value++;
                },
              },
              { previewImage },
            ),
          ])
        : grouped
          ? h(
              ImagePreviewGroup,
              {
                open: opened.value,
                current: current.value,
                'onUpdate:open': (value) => (opened.value = value),
                'onUpdate:current': (value) => {
                  current.value = value;
                  changes.value++;
                },
                preview: preview.value,
              },
              {
                default: () => [
                  h(
                    Image,
                    {
                      src: source,
                      alt: 'Interaction first',
                      width: 200,
                      styles: { root: { height: 'auto' } },
                      preview: { cover: preview.value.cover },
                    },
                    slots(),
                  ),
                  h(Image, { src: `${source}#2`, alt: 'Interaction second', width: 100 }),
                ],
                previewImage,
              },
            )
          : h(
              Image,
              {
                src: source,
                alt: 'Interaction first',
                width: 200,
                open: opened.value,
                'onUpdate:open': (value) => (opened.value = value),
                preview: preview.value,
                styles: { root: { height: 'auto' } },
              },
              { ...slots(), previewImage },
            );
  },
});
const copyStyles = (target: Document | ShadowRoot) => {
  const style = document.createElement('style');
  style.textContent = [...document.styleSheets]
    .flatMap((sheet) => [...sheet.cssRules].map((rule) => rule.cssText))
    .join('\n');
  if ('head' in target) target.head.append(style);
  else target.append(style);
};
onMounted(() => {
  if (scenario.startsWith('shadow') && host.value) {
    const shadow = host.value.attachShadow({
      mode: scenario === 'shadow-open' ? 'open' : 'closed',
    });
    copyStyles(shadow);
    root.value = shadow;
    window.imageInteractionRoot = shadow;
    if (scenario === 'shadow-source') {
      sourceRoot.value = shadow;
      window.imageInteractionSource = shadow;
    }
  }
});
const setupFrame = () => {
  const doc = frame.value?.contentDocument;
  if (doc) {
    copyStyles(doc);
    root.value = doc.body;
  }
};
</script>
<template>
  <section aria-label="Image interaction fixture" style="min-height:3000px;padding:24px">
    <nav aria-label="Interaction controls" style="position:fixed;top:0;z-index:4000">
      <button type="button" @mousedown.prevent @click="phase = (phase + 1) % 3">Cycle motion</button>
      <button type="button" @mousedown.prevent @click="rich = !rich">Toggle rich slot</button>
      <button type="button" @click="opened = true">Open externally</button>
      <button type="button" @click="mounted = !mounted">Toggle mount</button>
    </nav>
    <button type="button" data-interaction-outside>Outside focus</button>
    <output data-interaction-state>{{ JSON.stringify({ opened, current, changes, saved, phase }) }}</output>
    <section ref="host" />
    <iframe v-if="scenario === 'frame'" ref="frame" title="Interaction target" srcdoc="<!doctype html><html lang='en'><head><title>Interaction target</title></head><body style='min-height:3000px'><button data-frame-outside>Frame outside</button></body></html>" style="width:800px;height:500px" @load="setupFrame" />
    <ConfigProvider :theme="theme" :get-popup-container="popupContainer">
      <template v-if="scenario !== 'public-rich'">
        <Teleport v-if="sourceRoot" :to="sourceRoot"><Source v-if="mounted" /></Teleport>
        <Source v-else-if="mounted" />
        <Image v-if="scenario === 'motion'" :width="200" :height="120" :placeholder="{ progress: { percent: 30 } }" />
        <Image v-if="scenario === 'progress'" :width="200" :height="140" :placeholder="{ progress: { percent: 30, render: (originNode) => h('div', [originNode, h('input', { 'aria-label': 'Progress note' }), h('button', { type: 'button', onClick: () => saved++ }, 'Cancel loading')]) } }" />
      </template>
      <RichDemo v-else />
    </ConfigProvider>
  </section>
</template>
