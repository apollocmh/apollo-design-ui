<script setup lang="ts">
import { Image, type ImageProps, type ImageRenderInfo } from '@apollo-design/ui';
import { defineComponent, h, ref } from 'vue';
import ImageRenderDemo from '../../../packages/ui/src/image/demo/image-render.vue';

type Kind = 'static' | 'preview' | 'percent' | 'busy' | 'placeholder' | 'template';
type NativeName = 'click' | 'keydown' | 'error';
interface Entry {
  kind: Kind;
  listener: string;
  revision: number;
  eventId?: number;
  eventType?: string;
  eventClass?: string;
  target?: string;
  prevented?: boolean;
  open?: boolean;
}
const kinds: Kind[] = ['static', 'preview', 'percent', 'busy', 'placeholder'];
const revision = ref(0);
const attrsPhase = ref(0);
const resolved = ref(false);
const validEvents = ref(true);
const templateBubbles = ref(0);
const entries = ref<Entry[]>([]);
const ids = new WeakMap<Event, number>();
let nextId = 0;
const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="90"><rect width="180" height="90" fill="#38598b"/><text x="90" y="52" text-anchor="middle" font-family="sans-serif" font-size="18" fill="white">Native events</text></svg>')}`;
const record = (kind: Kind, name: NativeName, listener: string, current: number, event: Event) => {
  const valid =
    name === 'click'
      ? event instanceof MouseEvent
      : name === 'keydown'
        ? event instanceof KeyboardEvent
        : event instanceof Event;
  validEvents.value &&= valid;
  let eventId = ids.get(event);
  if (eventId === undefined) {
    eventId = ++nextId;
    ids.set(event, eventId);
  }
  entries.value.push({
    kind,
    listener,
    revision: current,
    eventId,
    eventType: event.type,
    eventClass: event.constructor.name,
    target: event.target instanceof Element ? event.target.tagName : undefined,
    prevented: event.defaultPrevented,
  });
};
const placeholders: Partial<Record<Kind, ImageProps['placeholder']>> = {
  percent: { progress: { percent: 50 } },
  busy: { progress: true },
  placeholder: 'Waiting for native image events',
};
const Targets = defineComponent(() => () => {
  const current = revision.value;
  const phase = attrsPhase.value;
  return h(
    'div',
    { class: 'image-native-event-targets' },
    kinds.map((kind) => {
      const placeholder = !resolved.value ? placeholders[kind] : undefined;
      const imageProps: ImageProps = {
        src: placeholder === undefined ? source : undefined,
        alt: `${kind} fallback alt`,
        width: 180,
        height: 90,
        placeholder,
        preview:
          kind === 'static'
            ? false
            : {
                cover: false,
                onOpenChange: (open) =>
                  entries.value.push({ kind, listener: 'preview', revision: current, open }),
              },
        styles: { root: { height: placeholder === undefined ? 'auto' : '110px' } },
      };
      const attrs =
        phase < 2
          ? {
              role: phase === 0 ? 'img' : 'presentation',
              tabindex: phase === 0 ? 3 : -1,
              'aria-label': `${kind} explicit name ${phase}`,
            }
          : {};
      const listeners = Object.fromEntries(
        (['click', 'keydown', 'error'] satisfies NativeName[]).flatMap((name) => {
          const eventName = name === 'keydown' ? 'Keydown' : name === 'click' ? 'Click' : 'Error';
          return [
            [
              `on${eventName}`,
              [
                (event: Event) => record(kind, name, name, current, event),
                (event: Event) => record(kind, name, `${name}-secondary`, current, event),
              ],
            ],
            [
              `on${eventName}Once`,
              (event: Event) => record(kind, name, `${name}-once`, current, event),
            ],
          ];
        }),
      );
      return h(
        Image,
        {
          ...imageProps,
          ...attrs,
          ...listeners,
          key: kind,
          'data-image-event-kind': kind,
          'data-image-event-revision': current,
          'onUpdate:open': (open: boolean) =>
            entries.value.push({ kind, listener: 'update:open', revision: current, open }),
        },
        ['static', 'preview'].includes(kind)
          ? {
              imageRender: (info: ImageRenderInfo) =>
                h('figure', { 'data-image-event-rich': kind }, [
                  info.originNode,
                  h('input', {
                    key: 'draft',
                    'aria-label': `${kind} image event draft`,
                    onClick: (event: MouseEvent) => event.stopPropagation(),
                    onKeydown: (event: KeyboardEvent) => event.stopPropagation(),
                  }),
                ]),
            }
          : undefined,
      );
    }),
  );
});
</script>

<template>
  <section data-image-native-events-fixture>
    <nav data-image-native-events-controls aria-label="Image native event controls">
      <button type="button" @mousedown.prevent @click="revision++">Replace image native listeners</button>
      <button type="button" @mousedown.prevent @click="attrsPhase = (attrsPhase + 1) % 3">Cycle image native attrs</button>
      <button type="button" @mousedown.prevent @click="resolved = true">Resolve image event placeholders</button>
    </nav>
    <Targets />
    <section data-image-native-event-template @click="templateBubbles++" @keydown="templateBubbles++">
      <Image
        data-image-event-template-root :src="source" :width="180" :height="90"
        alt="template fallback alt" :preview="{ cover: false }"
        @click.stop="event => record('template', 'click', 'click', revision, event)"
        @click.once="event => record('template', 'click', 'click-once', revision, event)"
        @keydown.stop.prevent="event => record('template', 'keydown', 'keydown', revision, event)"
        @keydown.once="event => record('template', 'keydown', 'keydown-once', revision, event)"
        @error="event => record('template', 'error', 'error', revision, event)"
        @error.once="event => record('template', 'error', 'error-once', revision, event)"
      />
    </section>
    <pre data-image-native-event-log hidden>{{ JSON.stringify({ entries, validEvents, templateBubbles, revision, attrsPhase, resolved }) }}</pre>
    <ImageRenderDemo />
  </section>
</template>

<style>
[data-image-native-events-fixture] { padding-top: 100px; }
[data-image-native-events-controls] {
  position: fixed;
  z-index: 2000;
  inset: 0 100px auto 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: white;
}
.image-native-event-targets { display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start; margin-bottom: 24px; }
[data-image-event-rich] { display: flex; flex-direction: column; gap: 6px; margin: 0; }
[data-image-event-rich] input { box-sizing: border-box; width: 100%; }
</style>
