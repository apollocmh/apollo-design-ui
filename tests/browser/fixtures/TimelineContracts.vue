<script setup lang="ts">
import { compactAlgorithm, darkAlgorithm, type ThemeConfig } from '@apollo-design/theme';
import {
  ConfigProvider,
  Timeline,
  type TimelineItemType,
  type TimelineMode,
  type TimelineRef,
} from '@apollo-design/ui';
import { computed, nextTick, onMounted, reactive, shallowRef } from 'vue';

interface State {
  theme: 'default' | 'dark' | 'compact' | 'both';
  tokens: 'default' | 'custom' | 'zero' | 'invalid';
  orientation: 'vertical' | 'horizontal';
  mode: TimelineMode;
  reverse: boolean;
  slotMode: 'rich' | 'empty' | 'absent';
  listener: 'first' | 'second' | 'none';
  pending: 'off' | 'zero' | 'text';
  scalarIcons: boolean;
  noTitles: boolean;
  mounted: boolean;
  updated: boolean;
  rtl: boolean;
}
const state = reactive<State>({
  theme: 'default',
  tokens: 'default',
  orientation: 'vertical',
  mode: 'start',
  reverse: false,
  slotMode: 'rich',
  listener: 'first',
  pending: 'off',
  scalarIcons: false,
  noTitles: false,
  mounted: true,
  updated: false,
  rtl: false,
});
const timeline = shallowRef<TimelineRef | null>(null);
const rows: TimelineItemType[] = [
  { key: 0, title: 'Created', content: 'Create record', position: 'left' },
  {
    key: 'apollo-timeline-pending',
    title: 'Reviewed',
    content: 'Review record',
    position: 'right',
  },
  { key: 'c', title: 'Complete', content: 'Complete record', placement: 'start' },
];
const items = computed<TimelineItemType[]>(() =>
  rows.map((item, index) => ({
    ...item,
    title: state.noTitles ? undefined : `${String(item.title)}${state.updated ? '!' : ''}`,
    content: `${String(item.content)}${state.updated ? '!' : ''}`,
    ...(state.scalarIcons ? { loading: true, icon: [0, false, ''][index] } : {}),
  })),
);
const algorithms = {
  default: undefined,
  dark: darkAlgorithm,
  compact: compactAlgorithm,
  both: [darkAlgorithm, compactAlgorithm],
};
const componentTokens = computed<Record<string, string | number>>(() =>
  state.tokens === 'custom'
    ? {
        tailColor: '#123456',
        tailWidth: 7,
        dotBorderWidth: 3,
        dotSize: 18,
        dotBg: '#abcdef',
        itemPaddingBottom: 31,
      }
    : state.tokens === 'zero'
      ? { tailWidth: 0, dotBorderWidth: 0, dotSize: 0, itemPaddingBottom: 0 }
      : state.tokens === 'invalid'
        ? {
            tailWidth: -7,
            dotBorderWidth: Number.NaN,
            dotSize: Number.POSITIVE_INFINITY,
            dotBg: '',
            itemPaddingBottom: -3,
          }
        : {},
);
const theme = computed<ThemeConfig>(() => ({
  algorithm: algorithms[state.theme],
  token: {},
  components: {
    Timeline: componentTokens.value,
  },
}));
const events: { listener: string; type: string; target: string; domEvent: boolean }[] = [];
let once = 0;
const record = (listener: string, event: Event) =>
  events.push({
    listener,
    type: event.type,
    target: event.target instanceof HTMLInputElement ? event.target.name : '',
    domEvent: event instanceof Event,
  });
const first = (event: Event) => record('first', event),
  second = (event: Event) => record('second', event);
const nativeAttrs = computed(() => ({
  class: state.updated ? ['timeline-current', { updated: true }] : 'timeline-initial',
  style: state.updated
    ? ['--native-marker:current', { minHeight: '30px' }]
    : '--native-marker:initial',
  ...(state.listener === 'none' ? {} : { onChange: state.listener === 'first' ? first : second }),
  onChangeOnce: () => {
    once += 1;
  },
}));
const pending = computed(() =>
  state.pending === 'zero' ? 0 : state.pending === 'text' ? 'Pending record' : undefined,
);
const snapshot = () => ({
  nativeTag: timeline.value?.nativeElement?.tagName ?? null,
  nativeConnected: timeline.value?.nativeElement?.isConnected ?? false,
  once,
  events: [...events],
  installation: Timeline.name,
  hasLegacyItem: Object.hasOwn(Timeline, 'Item'),
});
declare global {
  interface Window {
    timelineAudit: { set: (patch: Partial<State>) => Promise<void>; snapshot: typeof snapshot };
  }
}
onMounted(() => {
  window.timelineAudit = {
    set: async (patch) => {
      Object.assign(state, patch);
      await nextTick();
    },
    snapshot,
  };
});
</script>

<template>
  <main :style="{ background: state.theme === 'dark' || state.theme === 'both' ? '#141414' : '#fff', padding: '24px' }">
    <h1>Timeline native contracts</h1>
    <ConfigProvider :theme="theme" :direction="state.rtl ? 'rtl' : 'ltr'" :components="{ timeline: { className: state.updated ? 'configured-current' : 'configured-initial' } }">
      <Timeline v-if="state.mounted" id="timeline-audit" ref="timeline" v-bind="nativeAttrs"
        aria-label="History" :items="items" :orientation="state.orientation" :mode="state.mode" :reverse="state.reverse" :pending="pending">
        <template v-if="state.slotMode !== 'absent'" #itemTitle="{ item }"><time v-if="state.slotMode === 'rich'">{{ item.title }}</time></template>
        <template v-if="state.slotMode !== 'absent'" #itemContent="{ item, index }">
          <article v-if="state.slotMode === 'rich'"><strong>{{ item.content }} · {{ index }}</strong><input :name="String(item.key)" :data-owner="String(item.key)" :aria-label="`Note ${item.key}`" /></article>
        </template>
        <template v-if="state.slotMode !== 'absent'" #itemIcon="{ index }"><span v-if="state.slotMode === 'rich'" aria-hidden="true">{{ index + 1 }}</span></template>
      </Timeline>
      <ConfigProvider :theme="{ components: { Timeline: { dotSize: 22, tailWidth: 11 } } }">
        <Timeline id="timeline-nested" aria-label="Nested history" :items="[{ key: 'nested', title: 'Nested', content: 'Independent' }]" />
      </ConfigProvider>
    </ConfigProvider>
    <Timeline id="timeline-sibling" aria-label="Sibling history" :items="[{ key: 'sibling', content: 'Sibling' }]" />
  </main>
</template>

<style>
html, body { margin: 0; }
main { color: #141414; }
article { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
input { box-sizing: border-box; max-width: 150px; color: #141414; background: white; border: 1px solid #767676; padding: 2px; }
:focus-visible { outline: 2px solid #1677ff; outline-offset: 2px; }
</style>
