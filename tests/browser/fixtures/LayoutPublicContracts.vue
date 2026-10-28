<script setup lang="ts">
import {
  Layout,
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
  type LayoutRef,
  LayoutSider,
  type LayoutSiderEmits,
  type LayoutSiderRef,
  type LayoutSiderSlots,
  type LayoutSlots as RootLayoutSlots,
} from '@apollo-design/ui';
import {
  type LayoutSlots,
  Sider,
  type SiderEmits,
  type SiderProps,
  type SiderSlots,
} from '@apollo-design/ui/layout';
import { h, ref, type StyleValue } from 'vue';

const root = ref<LayoutRef | null>(null),
  side = ref<LayoutSiderRef | null>(null);
const collapsed = ref(false);
const nativeStyle: StyleValue = [
  { color: 'red' },
  'padding-top: 2px',
  { '--apollo-layout-header-height': '68px' },
];
const config: SiderProps = {
  width: 'calc(30% - 2px)',
  collapsedWidth: 0,
  trigger: [h('b', 'Data'), 0],
  'onUpdate:collapsed': (value) => {
    collapsed.value = value;
  },
};
const layoutSlots: LayoutSlots = { default: () => [h('b', 'Complete'), 0] };
const siderSlots: SiderSlots = { ...layoutSlots, trigger: () => [h('i', 'Toggle'), 0] };
const events: SiderEmits = {
  'update:collapsed': (value) => {
    collapsed.value = value;
  },
  collapse: (_value, _type) => {},
  breakpoint: (_broken) => {},
};
const rootContracts: {
  layout: RootLayoutSlots;
  sider: LayoutSiderSlots;
  emits: LayoutSiderEmits;
} = { layout: layoutSlots, sider: siderSlots, emits: events };
const onCollapse = (_value: boolean, _type: 'clickTrigger' | 'responsive') => {};
const onBreakpoint = (_broken: boolean) => {};
const wrong = () => {
  // @ts-expect-error only documented responsive breakpoint names are accepted
  const breakpoint: SiderProps = { breakpoint: 'huge' };
  // @ts-expect-error update:collapsed carries a boolean
  events['update:collapsed']('yes');
  // @ts-expect-error the Layout default slot is Vue content
  const slots: LayoutSlots = { default: () => ({ unknown: true }) };
  // @ts-expect-error body is the only non-root Sider semantic region
  const semantics: SiderProps = { classNames: { title: 'unsupported' } };
  return [breakpoint, slots, semantics];
};
void [config, siderSlots, rootContracts, wrong, Sider];
</script>

<template>
  <Layout ref="root" :style="nativeStyle" class="public-layout" :has-sider="true">
    <LayoutSider ref="side" v-model:collapsed="collapsed" collapsible breakpoint="md" @collapse="onCollapse" @breakpoint="onBreakpoint">
      <template #trigger><strong>Toggle {{ 0 }}</strong></template>
      <label>Draft <input /></label>
    </LayoutSider>
    <Layout><LayoutHeader>Header {{ 0 }}</LayoutHeader><LayoutContent>Content</LayoutContent><LayoutFooter>Footer</LayoutFooter></Layout>
  </Layout>
</template>
