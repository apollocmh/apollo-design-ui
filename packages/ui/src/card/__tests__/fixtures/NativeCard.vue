<script setup lang="ts">
import type { ThemeConfig } from '@apollo-design/theme';
import { h, ref, shallowRef } from 'vue';
import { ConfigProvider } from '../../../config-provider';
import {
  Card,
  CardGrid,
  type CardGridRef,
  CardMeta,
  type CardMetaRef,
  type CardRef,
} from '../../index';

const prefix = ref('apollo');
const theme = shallowRef<ThemeConfig | undefined>({
  components: {
    Card: {
      headerBg: 'rgb(230, 240, 250)',
      headerFontSize: 19,
      headerFontSizeSM: 15,
      headerHeight: 80,
      headerHeightSM: 58,
      bodyPadding: 28,
      bodyPaddingSM: 13,
      headerPadding: 26,
      headerPaddingSM: 12,
      actionsBg: 'rgb(240, 245, 250)',
      actionsLiMargin: '9px 0',
      tabsMarginBottom: -23,
      extraColor: 'rgb(40, 60, 80)',
    },
  },
});
const shown = ref(false);
const slotActions = ref(true);
const emptyActions = ref(false);
const order = ref(['a', 'b', 'c']);
const currentAttrs = ref(false);
const loading = ref(false);
const card = shallowRef<CardRef | null>(null);
const meta = shallowRef<CardMetaRef | null>(null);
const grid = shallowRef<CardGridRef | null>(null);
const active = ref<string | undefined>('a');
const accept = ref(false);
const proposals: string[] = [];
const changes: string[] = [];
const nestedUpdates: string[] = [];
const nestedChanges: string[] = [];
let indicatorCalls = 0;
const tabList = [
  { key: 'a', label: h('b', 'Alpha') },
  { key: 'b', label: h('em', 'Beta') },
];
const tabProps = {
  indicator: {
    size: (width: number) => {
      indicatorCalls++;
      return width / 2;
    },
  },
  'onUpdate:activeKey': (key: string) => {
    nestedUpdates.push(key);
  },
  onChange: (key: string) => {
    nestedChanges.push(key);
  },
};
const dataActions = [h('button', { type: 'button', key: 'data-action' }, 'Data action')];
function propose(key: string): void {
  proposals.push(key);
  if (accept.value) active.value = key;
}
function patch(kind: string): void {
  if (kind === 'show') shown.value = !shown.value;
  else if (kind === 'theme')
    theme.value = {
      token: { fontSize: 18, colorTextDescription: 'rgb(30, 60, 90)' },
      components: { Card: { bodyPadding: 22 } },
    };
  else if (kind === 'clear') theme.value = undefined;
  else if (kind === 'prefix') prefix.value = 'brand';
  else if (kind === 'actions') slotActions.value = !slotActions.value;
  else if (kind === 'empty') emptyActions.value = !emptyActions.value;
  else if (kind === 'reverse') order.value = [...order.value].reverse();
  else if (kind === 'attrs') currentAttrs.value = !currentAttrs.value;
  else if (kind === 'loading') loading.value = !loading.value;
  else if (kind === 'release') active.value = undefined;
  else if (kind === 'accept') accept.value = true;
}
defineExpose({
  patch,
  refsValid: () =>
    card.value?.nativeElement?.classList.contains('interactive-card') &&
    meta.value?.nativeElement?.classList.contains('live-meta') &&
    grid.value?.nativeElement?.classList.contains('standalone-grid'),
  state: () => ({
    active: active.value,
    proposals,
    changes,
    nestedUpdates,
    nestedChanges,
    indicatorCalls,
  }),
});
</script>

<template>
  <ConfigProvider :prefix-cls="prefix" :theme="theme">
    <section style="width: 640px; display: flex; flex-direction: column; gap: 16px">
      <Card class="token-card" title="Token title" extra="Token extra" :actions="['Edit', 'More']"><p>Token body</p></Card>
      <Card class="small-card" size="small" title="Small title" extra="Small extra"><p>Small body</p></Card>
      <Card ref="card" class="interactive-card" :class="{ current: currentAttrs }" :data-current="currentAttrs ? 'second' : 'first'" :style="{ paddingTop: currentAttrs ? '7px' : '2px' }" :actions="dataActions" :loading="loading">
        <template v-if="shown" #title><span>Live title</span></template>
        <template #extra><input aria-label="Extra draft" /></template>
        <template v-if="shown" #cover><div>Current cover</div></template>
        <template v-if="slotActions" #actions>
          <template v-if="!emptyActions"><input v-for="key in order" :key="key" :aria-label="`Action ${key}`" /></template>
        </template>
        <input aria-label="Body draft" />
        <CardMeta ref="meta" class="live-meta">
          <template v-if="shown" #avatar><span>Live avatar</span></template>
          <template v-if="shown" #title><span>Live metadata</span></template>
          <input aria-label="Meta draft" />
        </CardMeta>
      </Card>
      <Card class="tabs-card" :tab-list="tabList" :tab-props="tabProps" :active-tab-key="active" @update:active-tab-key="propose" @tab-change="key => changes.push(key)">Card tab body</Card>
      <CardGrid ref="grid" class="standalone-grid">Standalone grid</CardGrid>
    </section>
  </ConfigProvider>
</template>
