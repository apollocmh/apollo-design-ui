<script setup lang="ts">
import { Image, type ImageProps, type ImageRenderInfo } from '@apollo-design/ui';
import { type ClassValue, defineComponent, h, ref, type StyleValue } from 'vue';
import ImageStyleDemo from '../../../packages/ui/src/image/demo/style-class.vue';

type Kind = 'normal' | 'percent' | 'busy' | 'placeholder';
const kinds: Kind[] = ['normal', 'percent', 'busy', 'placeholder'];
const phase = ref(0);
const revision = ref(0);
const labels = ref(true);
const clicks = ref({ normal: 0, percent: 0, busy: 0, placeholder: 0 });
const errors = ref({ normal: 0, percent: 0, busy: 0, placeholder: 0 });
const previews = ref(0);
const validEvents = ref(true);
const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="80"><rect width="160" height="80" fill="#38598b"/></svg>')}`;
const semanticStyles: ImageProps['styles'] = {
  root: { maxWidth: '240px', minHeight: '80px', height: 'auto', paddingTop: '4px', '--semantic-root': 'kept' },
  image: { paddingTop: '6px', boxSizing: 'border-box' },
  placeholder: { progress: { root: { maxWidth: '220px', paddingTop: '8px', '--semantic-progress': 'kept' } } },
};
const branchProps: Record<Kind, ImageProps> = {
  normal: { src, alt: 'Native image style source', preview: false },
  percent: { placeholder: { progress: { percent: 50 } } },
  busy: { placeholder: { progress: true } },
  placeholder: { placeholder: h('span', { 'data-plain-placeholder': '' }, 'Plain image placeholder') },
};
const classNames: Record<Kind, ImageProps['classNames']> = {
  normal: { root: 'semantic-normal-image-root', image: 'semantic-original-image' },
  percent: { root: 'semantic-percent-image-root', placeholder: { progress: { root: 'semantic-percent-progress-root' } } },
  busy: { root: 'semantic-busy-image-root', placeholder: { progress: { root: 'semantic-busy-progress-root' } } },
  placeholder: { root: 'semantic-placeholder-image-root', placeholder: { progress: { root: 'semantic-placeholder-progress-root' } } },
};
const clickHandlers = Object.fromEntries(kinds.map(kind => [kind, (event: MouseEvent) => {
  validEvents.value &&= event instanceof MouseEvent;
  clicks.value[kind]++;
}]));
const errorHandlers = Object.fromEntries(kinds.map(kind => [kind, (event: Event) => {
  validEvents.value &&= event instanceof Event;
  errors.value[kind]++;
}]));
const preview = { onOpenChange: () => { previews.value++; } };
const nativeStyle = (): StyleValue => {
  if (phase.value === 0) return 'max-width:300px;padding-top:20px;--native-phase:string;--string-only:yes';
  if (phase.value === 1) return ['max-width:340px;--native-phase:array', { paddingBottom: '10px', '--array-only': 'yes' }];
  if (phase.value === 2) return { maxWidth: '360px', paddingTop: '24px', paddingInlineEnd: '9px', '--native-phase': 'object' };
  return undefined;
};
const nativeClass = (): ClassValue => phase.value < 3 ? ['native-image-root', `native-image-phase-${phase.value}`] : undefined;
const normalSlot = (info: ImageRenderInfo) => h('figure', { style: { margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' } }, [
  h('figcaption', { 'data-current-image-style-title': '' }, info.title),
  info.originNode,
  h('input', {
    key: 'draft', 'aria-label': 'Image style fixture draft', style: { width: '100%', boxSizing: 'border-box' },
    onClick: (event: MouseEvent) => event.stopPropagation(), onKeydown: (event: KeyboardEvent) => event.stopPropagation(),
  }),
]);
const StyleTargets = defineComponent(() => () => h('div', { style: { display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-start' } }, kinds.map(kind => h(Image, {
  ...branchProps[kind], key: kind,
  width: 160, height: 80, styles: semanticStyles, classNames: classNames[kind],
  class: nativeClass(), style: nativeStyle(), id: `native-image-${kind}-${revision.value}`,
  title: `Image attrs ${revision.value}`, 'data-image-style-kind': kind, 'data-live-revision': revision.value,
  'aria-describedby': 'image-style-fixture-help',
  ...(kind === 'normal' ? {} : {
    preview, 'aria-label': labels.value ? `${kind} image progress ${revision.value}` : undefined,
    role: 'button', 'aria-valuemin': 9, 'aria-valuemax': 9, 'aria-valuenow': 9, 'aria-busy': false,
  }),
  onClick: clickHandlers[kind], onError: errorHandlers[kind],
}, kind === 'normal' ? { imageRender: normalSlot } : {}))));
</script>

<template>
  <section data-image-style-fixture>
    <p>
      <button type="button" @mousedown.prevent @click="phase = (phase + 1) % 4">Cycle image fixture styles</button>
      <button type="button" @mousedown.prevent @click="revision++">Replace image attrs only</button>
      <button type="button" @mousedown.prevent @click="labels = !labels">Toggle image progress labels</button>
    </p>
    <StyleTargets />
    <p id="image-style-fixture-help">Native image style fixture description.</p>
    <output data-image-style-phase>{{ phase }}</output>
    <output data-image-style-revision>{{ revision }}</output>
    <output data-image-style-events>{{ JSON.stringify({ clicks, errors, previews, validEvents }) }}</output>
  </section>
  <ImageStyleDemo />
</template>
