<script setup lang="ts">
import { en_US, zh_CN } from '@apollo-design/locale';
import { type AliasToken, compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import {
  ConfigProvider,
  Empty,
  type EmptyConfig,
  type EmptyImage,
  type EmptyProps,
  type EmptyRef,
  PRESENTED_IMAGE_DEFAULT,
  PRESENTED_IMAGE_SIMPLE,
} from '@apollo-design/ui';
import {
  computed,
  defineComponent,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  type StyleValue,
  shallowReactive,
  shallowRef,
} from 'vue';

interface Options {
  mode: 'light' | 'dark' | 'compact' | 'both';
  locale: 'en' | 'zh';
  image: 'default' | 'simple' | 'url' | 'wide' | 'zero' | 'hidden' | 'array' | 'proxy';
  imageSlot: 'absent' | 'full' | 'empty';
  descriptionSlot: 'absent' | 'full' | 'empty';
  footerSlot: 'absent' | 'full' | 'empty';
  description?: EmptyProps['description'];
  config: 'none' | 'first' | 'second';
  props: EmptyProps;
  nativeStyle?: StyleValue;
  nativeClass?: string;
  nativeDir?: string;
  rtl: boolean;
  aliases?: Partial<AliasToken>;
}
const state = shallowReactive<Options>({
  mode: 'light',
  locale: 'en',
  image: 'default',
  imageSlot: 'absent',
  descriptionSlot: 'absent',
  footerSlot: 'absent',
  config: 'none',
  props: {},
  rtl: false,
});
const instance = shallowRef<EmptyRef | null>(null);
const clicks = ref(0),
  mounts = ref(0),
  unmounts = ref(0);
const Probe = defineComponent({
  props: { part: { type: String, required: true } },
  setup(props) {
    const value = ref(`Initial ${props.part}`);
    onMounted(() => mounts.value++);
    onUnmounted(() => unmounts.value++);
    return () =>
      h('label', { style: { display: 'block' } }, [
        props.part,
        h('input', {
          'aria-label': `${props.part} draft`,
          'data-draft': props.part,
          value: value.value,
          onInput: (e: Event) => {
            if (e.target instanceof HTMLInputElement) value.value = e.target.value;
          },
        }),
        h('span', { style: { display: 'block' } }, 'Business tail line one'),
        h('span', { style: { display: 'block' } }, 'Business tail line two'),
      ]);
  },
});
const picture = reactive({
  component: defineComponent({
    setup: () => () =>
      h('svg', { width: 48, height: 32, role: 'img', 'aria-label': 'Business diagram' }, [
        h('rect', { width: 48, height: 32, fill: '#8ba6bf' }),
      ]),
  }),
});
const url = (wide = false) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${wide ? 2400 : 120}" height="120"><rect width="100%" height="100%" fill="#8ba6bf"/></svg>`)}`;
const image = computed<EmptyImage>(() => {
  switch (state.image) {
    case 'simple':
      return PRESENTED_IMAGE_SIMPLE;
    case 'url':
      return url();
    case 'wide':
      return url(true);
    case 'zero':
      return 0;
    case 'hidden':
      return false;
    case 'array':
      return [h('span', 'Array image'), h('strong', 'Tail'), 0];
    case 'proxy':
      return picture.component;
    default:
      return PRESENTED_IMAGE_DEFAULT;
  }
});
const config = computed<EmptyConfig | undefined>(() =>
  state.config === 'none'
    ? undefined
    : state.config === 'first'
      ? {
          className: 'global-first',
          image: PRESENTED_IMAGE_SIMPLE,
          style: { marginInline: '13px' },
          classNames: { description: 'desc-first' },
          styles: { description: { paddingBlock: '3px' } },
        }
      : {
          className: 'global-second',
          image: PRESENTED_IMAGE_DEFAULT,
          style: { marginInline: '17px' },
          classNames: { description: 'desc-second' },
          styles: { description: { paddingBlock: '7px' } },
        },
);
const components = computed(() => (config.value ? { empty: config.value } : undefined));
const theme = computed(() => ({
  algorithm:
    state.mode === 'dark'
      ? darkAlgorithm
      : state.mode === 'compact'
        ? compactAlgorithm
        : state.mode === 'both'
          ? [darkAlgorithm, compactAlgorithm]
          : undefined,
  token: state.aliases,
}));
const snapshot = () => ({
  clicks: clicks.value,
  mounts: mounts.value,
  unmounts: unmounts.value,
  nativeTag: instance.value?.nativeElement?.tagName ?? null,
  name: Empty.name,
  defaultIdentity: Empty.PRESENTED_IMAGE_DEFAULT === PRESENTED_IMAGE_DEFAULT,
  simpleIdentity: Empty.PRESENTED_IMAGE_SIMPLE === PRESENTED_IMAGE_SIMPLE,
});
declare global {
  interface Window {
    emptyAudit: { set(options: Partial<Options>): Promise<void>; snapshot: typeof snapshot };
  }
}
onMounted(() => {
  window.emptyAudit = {
    set: async (options) => {
      Object.assign(state, options);
      await nextTick();
    },
    snapshot,
  };
});
</script>
<template>
  <ConfigProvider :theme="theme" :locale="state.locale === 'en' ? en_US : zh_CN" :components="components" :direction="state.rtl ? 'rtl' : 'ltr'">
    <main style="box-sizing:border-box;width:100%;min-height:320px;padding:16px;background:var(--apollo-color-bg-container);color:var(--apollo-color-text);font-family:var(--apollo-font-family)">
      <h1 style="font-size:20px">Empty contract audit</h1>
      <Empty id="empty-audit" ref="instance" :image="image" :description="state.description" v-bind="state.props" :class="state.nativeClass" :style="state.nativeStyle" :dir="state.nativeDir" data-native="empty" @click="clicks++">
        <template v-if="state.imageSlot !== 'absent'" #image><template v-if="state.imageSlot === 'full'"><svg width="32" height="24" aria-hidden="true"><path d="M2 12h28" stroke="currentColor"/></svg><Probe part="image"/><strong>Image tail</strong><span>0</span></template></template>
        <template v-if="state.descriptionSlot !== 'absent'" #description><template v-if="state.descriptionSlot === 'full'"><span>Description </span><strong>tail</strong><span>0</span></template></template>
        <template v-if="state.footerSlot !== 'absent'" #default><template v-if="state.footerSlot === 'full'"><Probe part="footer"/><button type="button">Create</button><strong>Footer tail</strong><span>0</span></template></template>
      </Empty>
      <p aria-live="polite">Native clicks: {{ clicks }}</p>
    </main>
  </ConfigProvider>
</template>
