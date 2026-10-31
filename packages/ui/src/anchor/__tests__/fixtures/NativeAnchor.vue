<script setup lang="ts">
import { computed, ref, type StyleValue, shallowRef } from 'vue';
import { Affix, type AffixRef } from '../../../affix';
import { ConfigProvider, type ConfigProviderProps } from '../../../config-provider';
import {
  Anchor,
  type AnchorDirection,
  AnchorLink,
  type AnchorLinkInfo,
  type AnchorLinkItemProps,
} from '../../index';

const scrollA = ref<HTMLElement | null>(null);
const scrollB = ref<HTMLElement | null>(null);
const affix = ref<AffixRef | null>(null);
const target = ref<'a' | 'b' | 'pending'>('a');
const getContainer = () =>
  target.value === 'pending' ? null : target.value === 'a' ? scrollA.value : scrollB.value;
const prefix = ref('apollo');
const theme = shallowRef<ConfigProviderProps['theme']>();
const config = shallowRef<NonNullable<ConfigProviderProps['components']>>({});
const rootStyle = shallowRef<StyleValue>({ width: '240px' });
const offset = ref(16);
const targetOffset = ref(20);
const direction = ref<AnchorDirection>('vertical');
const textDirection = ref<'ltr' | 'rtl'>('ltr');
const label = ref('Section A');
const showComposition = ref(false);
const emptyComposition = ref(false);
const child = ref(true);
const cancelled = ref(false);
const dynamicHeight = ref(40);
const items = computed<AnchorLinkItemProps[]>(() => [
  { key: 'a', href: '#native-browser-a', title: label.value, targetOffset: targetOffset.value },
  { key: 'b', href: '#native-browser-b', title: 'Section B' },
  { key: 'c', href: '#native-browser-c', title: 'Section C' },
]);
const events: { clicks: string[]; changes: string[]; linkClicks: number; affix: boolean[] } = {
  clicks: [],
  changes: [],
  linkClicks: 0,
  affix: [],
};
const onClick = (event: MouseEvent, link: AnchorLinkInfo) => {
  events.clicks.push(link.href);
  if (cancelled.value) event.preventDefault();
};
const expose = {
  patch(name: string) {
    if (name === 'cancel') cancelled.value = true;
    if (name === 'accept') cancelled.value = false;
    if (name === 'theme') {
      theme.value = {
        token: { fontSize: 18, paddingXXS: 8 },
        components: {
          Affix: { zIndexPopup: 70 },
          Anchor: { linkPaddingBlock: 9, linkPaddingInlineStart: 28 },
        },
      };
      config.value = {
        anchor: {
          className: 'current-provider',
          styles: { itemTitle: { color: 'rgb(23, 45, 67)' } },
        },
      };
    }
    if (name === 'replace-theme')
      theme.value = {
        components: {
          Affix: { zIndexPopup: 0 },
          Anchor: { linkPaddingBlock: 0, linkPaddingInlineStart: 11 },
        },
      };
    if (name === 'clear-theme') {
      theme.value = undefined;
      config.value = {};
    }
    if (name === 'prefix') prefix.value = 'orbit';
    if (name === 'offset') offset.value = 0;
    if (name === 'pending') target.value = 'pending';
    if (name === 'target-b') target.value = 'b';
    if (name === 'target-a') target.value = 'a';
    if (name === 'label') label.value = 'A changed label with a much longer title';
    if (name === 'horizontal') direction.value = 'horizontal';
    if (name === 'rtl') textDirection.value = 'rtl';
    if (name === 'vertical') direction.value = 'vertical';
    if (name === 'composition') showComposition.value = true;
    if (name === 'empty') emptyComposition.value = true;
    if (name === 'hide-child') child.value = false;
    if (name === 'data') {
      showComposition.value = false;
      emptyComposition.value = false;
    }
    if (name === 'height') dynamicHeight.value = 95;
    if (name === 'shrink') dynamicHeight.value = 25;
    if (name === 'offset-link') targetOffset.value = 65;
    if (name === 'style')
      rootStyle.value = ['width:240px', { backgroundColor: 'rgb(242, 244, 246)' }];
    if (name === 'measure') affix.value?.updatePosition();
  },
  events: () => ({
    ...events,
    clicks: [...events.clicks],
    changes: [...events.changes],
    affix: [...events.affix],
  }),
};
defineExpose(expose);
</script>

<template>
  <ConfigProvider :prefix-cls="prefix" :theme="theme" :components="config" :direction="textDirection">
    <div class="layout">
      <aside>
        <Anchor id="native-nav" :style="rootStyle" :items="items" :get-container="getContainer" :offset-top="offset" :target-offset="20" :direction="direction" show-ink-in-fixed @click="onClick" @change="events.changes.push($event)">
          <template v-if="showComposition" #default>
            <template v-if="!emptyComposition">
              <AnchorLink href="#native-browser-a" class="composed" data-owner="link-root" aria-label="Composed A" :tabindex="0" @click.once="events.linkClicks++">
                <template #title>{{ label }}</template>
              </AnchorLink>
              <AnchorLink v-if="child" href="#native-browser-a" title="Duplicate A" />
            </template>
          </template>
        </Anchor>
      </aside>
      <div id="scroll-a" ref="scrollA" class="scroll">
        <div style="height:60px"></div>
        <Affix id="native-affix" ref="affix" :target="getContainer" :offset-top="offset" @change="events.affix.push($event)">
          <div id="fixed-content" :style="{ height: `${dynamicHeight}px`, background: '#d9e8ff' }"><input id="draft" aria-label="Sticky draft" value="initial" /></div>
        </Affix>
        <section id="native-browser-a">Target A</section>
        <section id="native-browser-b">Target B</section>
        <section id="native-browser-c">Target C</section>
        <div style="height:400px"></div>
      </div>
      <div id="scroll-b" ref="scrollB" class="scroll"><div style="height:1100px">Second scroll target</div></div>
    </div>
  </ConfigProvider>
</template>

<style scoped>
.layout { display:flex; gap:24px; align-items:flex-start; margin-top:100px; }
aside { width:240px; }
.scroll { height:260px; width:300px; overflow:auto; outline:1px solid #aaa; }
section { height:220px; padding-top:1px; box-sizing:border-box; background:#f5f5f5; }
input { max-width:180px; }
</style>
