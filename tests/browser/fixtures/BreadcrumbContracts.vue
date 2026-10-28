<script setup lang="ts">
import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import {
  Breadcrumb,
  BreadcrumbItem,
  type BreadcrumbItemInput,
  BreadcrumbSeparator,
  ConfigProvider,
  type DropdownProps,
} from '@apollo-design/ui';
import { computed, h, onBeforeUnmount, onMounted, reactive } from 'vue';

interface AuditState {
  mode: 'default' | 'dark' | 'compact' | 'both';
  prefix: string | undefined;
  id: number;
  menu: boolean;
  controlled: boolean;
  accept: boolean;
  open: boolean;
  icon: boolean;
  emptyIcon: boolean;
  separator: boolean;
  emptySeparator: boolean;
  reverse: boolean;
  customTokens: boolean;
  mounted: boolean;
}
const state = reactive<AuditState>({
  mode: 'default',
  prefix: undefined,
  id: 0,
  menu: true,
  controlled: false,
  accept: true,
  open: false,
  icon: false,
  emptyIcon: false,
  separator: false,
  emptySeparator: false,
  reverse: false,
  customTokens: false,
  mounted: true,
});
const events: { open: boolean; source: 'trigger' | 'menu' }[] = [];
const set = (patch: Partial<AuditState>) => Object.assign(state, patch);
const theme = computed(() =>
  state.mode === 'default' && !state.customTokens
    ? undefined
    : {
        algorithm:
          state.mode === 'dark'
            ? darkAlgorithm
            : state.mode === 'compact'
              ? compactAlgorithm
              : state.mode === 'both'
                ? [darkAlgorithm, compactAlgorithm]
                : undefined,
        components: state.customTokens
          ? {
              Breadcrumb: {
                itemColor: '#164c7e',
                lastItemColor: '#873800',
                linkColor: '#075621',
                linkHoverColor: '#61108c',
                separatorColor: '#754500',
                iconFontSize: 23,
                separatorMargin: 17,
              },
            }
          : undefined,
      },
);
const dropdownProps = computed<DropdownProps>(() => ({
  trigger: ['click', 'hover'],
  open: state.controlled ? state.open : undefined,
  onOpenChange(open, { source }) {
    events.push({ open, source });
    if (state.controlled && state.accept) state.open = open;
  },
}));
const items = computed<BreadcrumbItemInput[]>(() => [
  {
    key: 'home',
    title: [
      h('span', { class: 'apollo-icon', 'aria-hidden': 'true', 'data-title-icon': '' }, '★'),
      ' Home',
    ],
    href: '#home',
    'aria-label': 'Home',
  },
  {
    key: 'content',
    title: [h('strong', 'Products '), String(state.id)],
    path: ':id/:id',
    menu: state.menu
      ? {
          items: [
            { key: 'relative', label: 'Relative destination', path: '/child' },
            { key: 'explicit', label: 'Explicit destination', href: '#explicit' },
            { key: 'disabled', label: 'Disabled destination', disabled: true },
          ],
        }
      : undefined,
    dropdownProps: dropdownProps.value,
  },
  { key: 'current', title: 'Current page' },
]);
const keys = computed(() => (state.reverse ? ['b', 'a'] : ['a', 'b']));
const semantic = ({ props }: { props: { params?: Record<string, unknown> } }) => ({
  root: `route-${String(props.params?.id)}`,
});
declare global {
  interface Window {
    breadcrumbAudit: { set: typeof set; state: AuditState; events: typeof events };
  }
}
onMounted(() => {
  window.breadcrumbAudit = { set, state, events };
});
onBeforeUnmount(() => {
  events.length = 0;
});
</script>

<template>
  <main :style="{ background: state.mode === 'dark' || state.mode === 'both' ? '#141414' : '#ffffff' }">
    <ConfigProvider :theme="theme" :components="{ breadcrumb: { separator: '›' } }">
      <section v-if="state.mounted" data-scope>
        <Breadcrumb
          :items="items" :params="{ id: state.id }" :prefix-cls="state.prefix"
          :class-names="semantic" aria-label="Contract routes" data-routes
        >
          <template v-if="state.icon" #dropdownIcon><b v-if="!state.emptyIcon" data-custom-icon>↓</b></template>
          <template v-if="state.separator" #separator><b v-if="!state.emptySeparator" data-custom-separator>|</b></template>
        </Breadcrumb>
        <Breadcrumb aria-label="Native items" :prefix-cls="state.prefix" data-native>
          <BreadcrumbItem v-for="key in keys" :key="key" :id="`native-${key}`" :data-owner="key"
            class="native-item" style="padding: 2px" :aria-label="`Native ${key}`">
            <input :aria-label="`Crumb ${key}`" :placeholder="key" />
          </BreadcrumbItem>
          <BreadcrumbSeparator id="explicit-separator"><span>·</span></BreadcrumbSeparator>
          <BreadcrumbItem>Final</BreadcrumbItem>
        </Breadcrumb>
        <Breadcrumb aria-label="Second menu" :items="[{ title: 'Other', menu: { items: [{ key: 'other', label: 'Other destination' }] } }]" />
        <Breadcrumb aria-label="Empty data" :items="[]"><BreadcrumbItem>Unexpected fallback</BreadcrumbItem></Breadcrumb>
        <ConfigProvider :theme="{ components: { Breadcrumb: { separatorMargin: 3 } } }">
          <Breadcrumb data-nested aria-label="Nested theme" :items="[{ title: 'Inner A' }, { title: 'Inner B' }]" />
        </ConfigProvider>
      </section>
    </ConfigProvider>
    <button id="outside" type="button">Outside control</button>
  </main>
</template>
