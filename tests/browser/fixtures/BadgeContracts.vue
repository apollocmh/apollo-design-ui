<script setup lang="ts">
import { compactAlgorithm, darkAlgorithm, type ThemeConfig } from '@apollo-design/theme';
import { Badge, type BadgeRef, ConfigProvider, FloatButton, Ribbon } from '@apollo-design/ui';
import {
  computed,
  createTextVNode,
  defineComponent,
  Fragment,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
} from 'vue';

const state = reactive({
  mode: 'default',
  tokenStage: 0,
  count: 5,
  dot: false,
  status: false,
  rtl: false,
  cssOffset: false,
  custom: true,
  empty: false,
  providerStage: 0,
  shown: true,
});
const badge = ref<BadgeRef | null>(null);
const words = () => [h('strong', 'First'), ' / ', h('em', 'Last'), 0];
const conditionalState = reactive({ visible: false, mounts: 0, unmounts: 0 });
const ConditionalCount = defineComponent(() => {
  onMounted(() => {
    conditionalState.mounts++;
  });
  onUnmounted(() => {
    conditionalState.unmounts++;
  });
  return () => (conditionalState.visible ? words() : null);
});
const conditionalCount = h(ConditionalCount);
const MultipleRoots = defineComponent(() => () => words());
const contentCounts = [
  { name: 'native', count: h('strong', { class: 'owned-count-child' }, 'First / Last0') },
  { name: 'array', count: words() },
  { name: 'fragment', count: h(Fragment, words()) },
  { name: 'text', count: createTextVNode('First / Last0') },
  { name: 'component', count: h(MultipleRoots) },
];
const emptyCounts = [null, false, true, 0, '0', '', [], h(Fragment, []), createTextVNode('')];
const palette = [
  '',
  'pink',
  'red',
  'yellow',
  'orange',
  'cyan',
  'green',
  'blue',
  'purple',
  'geekblue',
  'magenta',
  'volcano',
  'gold',
  'lime',
  '#2db7f5',
  '#ffffff',
  '#111111',
  'color(srgb-linear 0.178995 0.178995 0.178995)',
];
const theme = computed<ThemeConfig>(() => ({
  algorithm:
    state.mode === 'both'
      ? [darkAlgorithm, compactAlgorithm]
      : state.mode === 'dark'
        ? darkAlgorithm
        : state.mode === 'compact'
          ? compactAlgorithm
          : undefined,
  components:
    state.tokenStage === 1
      ? {
          Badge: {
            indicatorZIndex: 13,
            indicatorHeight: 30,
            indicatorHeightSM: 18,
            dotSize: 10,
            textFontSize: 15,
            textFontSizeSM: 11,
            textFontWeight: 700,
            statusSize: 9,
            paddingInline: 13,
          },
        }
      : state.tokenStage === 2
        ? {
            Badge: {
              indicatorZIndex: 0,
              indicatorHeight: 0,
              indicatorHeightSM: 0,
              dotSize: 0,
              textFontSize: 0,
              textFontSizeSM: 0,
              textFontWeight: 0,
              statusSize: 0,
              paddingInline: 0,
            },
          }
        : {},
}));
const components = computed(() =>
  state.providerStage === 1
    ? {
        badge: {
          classNames: () => ({ root: 'provider-badge' }),
          styles: () => ({ root: { marginTop: '9px' } }),
        },
        ribbon: {
          classNames: () => ({ root: 'provider-ribbon' }),
          styles: () => ({ content: { fontWeight: 700 } }),
        },
      }
    : {},
);
Object.assign(window, {
  badgeAudit: {
    async countVisible(visible: boolean) {
      conditionalState.visible = visible;
      await nextTick();
    },
    countLifecycle: () => ({
      mounts: conditionalState.mounts,
      unmounts: conditionalState.unmounts,
    }),
    async set(patch: Partial<typeof state>) {
      Object.assign(state, patch);
      await nextTick();
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
    },
    snapshot: () => ({
      exposed: badge.value?.nativeElement === document.querySelector('#owned-badge'),
    }),
  },
});
</script>
<template>
  <ConfigProvider :theme="theme" :components="components" :direction="state.rtl ? 'rtl' : 'ltr'">
    <main :style="{ padding: '32px', minHeight: '100vh', color: 'var(--apollo-color-text)', background: 'var(--apollo-color-bg-container)' }">
      <h1>Badge native contract controls</h1>
      <section v-if="state.shown" style="display: flex; gap: 32px; align-items: center; padding: 24px">
        <Badge id="owned-badge" ref="badge" :count="state.count" :dot="state.dot" :status="state.status ? 'success' : undefined"
          :offset="state.cssOffset ? ['1.5em', '0.5rem'] : [1.5, 2.5]" :style="[{ padding: '7px' }, { '--native-style': '1' }]">
          <input aria-label="Badge business draft" style="width: 120px" />
        </Badge>
        <Badge id="token-count" :count="15" />
        <Badge id="token-small" :count="15" size="small" />
        <Badge id="token-dot" dot />
        <Badge id="token-status" status="processing" text="Processing" />
        <Badge id="token-wrapped-status" status="success"><i style="display: inline-block; width: 60px; height: 40px">Anchor</i></Badge>
        <Badge id="token-rich"><template #count><strong>Words</strong></template></Badge>
        <Badge id="shadow-count" :count="5" :styles="{ indicator: { borderColor: 'red', boxShadow: 'none' } }" />
      </section>
      <Ribbon id="owned-ribbon" text="Fallback" :style="'padding: 11px'">
        <template v-if="state.custom" #text><strong v-if="!state.empty">First</strong><em v-if="!state.empty">Second</em></template>
        <input aria-label="Ribbon business draft" />
      </Ribbon>
      <section style="display: flex; flex-wrap: wrap; gap: 28px; padding-block: 32px">
        <Badge v-for="color in palette" :key="color" :data-color="color || 'default'" :color="color || undefined" :count="25" />
      </section>
      <section style="display: grid; gap: 32px; grid-template-columns: repeat(4, 1fr)">
        <Ribbon v-for="color in palette" :key="color" :data-ribbon-color="color || 'default'" :color="color || undefined" text="Ribbon">
          <div style="height: 52px; background: var(--apollo-color-fill-alter)" />
        </Ribbon>
      </section>
      <section style="display: flex; gap: 24px; padding-block: 32px">
        <Badge v-for="item in contentCounts" :key="item.name" :data-rich-count="item.name"
          :count="item.count" title="Custom count" :class-names="{ indicator: 'owned-rich-indicator' }"
          :styles="{ indicator: { paddingInline: '8px' } }" />
      </section>
      <section style="display: flex; gap: 24px; padding-block: 32px">
        <Badge v-for="(count, index) in emptyCounts" :key="index" :data-empty-count="index" :count="count" text="Caption" />
        <Badge id="changing-status" :count="state.status ? null : 8" status="success" />
      </section>
      <Badge id="conditional-count" :count="conditionalCount" />
      <ConfigProvider direction="rtl">
        <Badge id="native-dir-badge" dir="ltr" :count="5"><span>Native direction</span></Badge>
        <Badge id="auto-dir-badge" dir="auto" :count="5"><span>עברית</span></Badge>
        <Badge dir="rtl" :count="8"><Badge id="nested-ltr-badge" dir="ltr" :count="5"><span>Nested LTR</span></Badge></Badge>
        <Ribbon id="native-dir-ribbon" dir="ltr" text="Native direction"><div>Body</div></Ribbon>
      </ConfigProvider>
      <div style="display: flex; gap: 32px; padding-block: 32px">
        <FloatButton v-for="shape in (['circle', 'square'] as const)" :key="shape" :id="`dot-float-${shape}`"
          :shape="shape" :badge="{ dot: true }" aria-label="Floating dot action" style="position: relative; inset: auto" />
      </div>
      <button id="outside" type="button">Outside</button>
    </main>
  </ConfigProvider>
</template>
