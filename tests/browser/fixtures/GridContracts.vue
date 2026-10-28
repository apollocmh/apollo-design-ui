<script setup lang="ts">
import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import {
  Col,
  type ColProps,
  ConfigProvider,
  type GridRef,
  type Gutter,
  Row,
  type RowProps,
  useBreakpoint,
} from '@apollo-design/ui';
import {
  computed,
  defineComponent,
  h,
  nextTick,
  onMounted,
  ref,
  type StyleValue,
  shallowReactive,
} from 'vue';

interface GridState {
  gutter: Gutter | undefined;
  wrap: boolean | undefined;
  justify: RowProps['justify'];
  align: RowProps['align'];
  col: ColProps;
  sibling: ColProps | undefined;
  provider: boolean;
  rtl: boolean;
  mode: string;
  present: boolean;
  rich: boolean;
  id: string | undefined;
  rootClass: string | undefined;
  rowStyle: StyleValue;
  colStyle: StyleValue;
  dir: 'rtl' | 'ltr' | 'auto' | undefined;
  font: boolean;
}
const state = shallowReactive<GridState>({
  gutter: [16, 12],
  wrap: undefined,
  justify: undefined,
  align: undefined,
  col: { xs: 24, sm: 12, md: 8, lg: 6, xl: 4, xxl: 3, xxxl: 2 },
  sibling: undefined,
  provider: false,
  rtl: false,
  mode: 'light',
  present: true,
  rich: true,
  id: 'current-grid',
  rootClass: 'native-row',
  rowStyle: undefined,
  colStyle: undefined,
  dir: undefined,
  font: false,
});
const rowRef = ref<GridRef | null>(null),
  colRef = ref<GridRef | null>(null);
const clicks = ref(0),
  rowClicks = ref(0),
  theme = computed(() => ({
    algorithm:
      state.mode === 'dark'
        ? darkAlgorithm
        : state.mode === 'compact'
          ? compactAlgorithm
          : state.mode === 'both'
            ? [darkAlgorithm, compactAlgorithm]
            : undefined,
    token: state.font ? { fontSize: 19, fontFamily: 'monospace' } : {},
  }));
const components = computed(() =>
  state.provider
    ? {
        row: {
          className: 'provider-row',
          style: { paddingBlock: '3px', borderInlineStart: '2px solid currentColor' },
        },
        col: { className: 'provider-col', style: { paddingBlock: '5px' } },
      }
    : undefined,
);
const BreakpointProbe = defineComponent(() => {
  const screens = useBreakpoint();
  return () => h('output', { 'data-screens': '' }, JSON.stringify(screens.value));
});
const CompleteContent = defineComponent(() => () => [
  h('strong', 'Complete'),
  h('em', ' content'),
  0,
]);
declare global {
  interface Window {
    gridAudit: {
      set(patch: Partial<GridState>): Promise<void>;
      snapshot(): { row: boolean; col: boolean; clicks: number; rowClicks: number };
    };
  }
}
onMounted(() => {
  window.gridAudit = {
    async set(patch) {
      Object.assign(state, patch);
      await nextTick();
    },
    snapshot: () => ({
      row: rowRef.value?.nativeElement === document.querySelector('[data-grid-main]'),
      col: colRef.value?.nativeElement === document.querySelector('[data-grid-a]'),
      clicks: clicks.value,
      rowClicks: rowClicks.value,
    }),
  };
});
</script>
<template>
  <main>
    <h1>Grid current native contracts</h1>
    <ConfigProvider :theme="theme" :components="components" :direction="state.rtl ? 'rtl' : 'ltr'">
      <section data-grid-surface :style="{ color: 'var(--apollo-color-text)', background: 'var(--apollo-color-bg-container)', padding: '24px' }">
        <div data-grid-container style="width: 720px; max-width: 100%">
          <Row v-if="state.present" ref="rowRef" data-grid-main :id="state.id" :class="state.rootClass" :style="state.rowStyle" :gutter="state.gutter" :wrap="state.wrap" :justify="state.justify" :align="state.align" :dir="state.dir" @click="rowClicks++">
            <Col ref="colRef" data-grid-a v-bind="state.col" :style="state.colStyle">
              <div data-grid-content="a" class="grid-business">
                <label>Persistent grid draft <input aria-label="Persistent grid draft" value="Original draft" style="width: 100%; min-width: 0" /></label>
                <template v-if="state.rich"><CompleteContent /></template>
                <button type="button" @click="clicks++">Grid action</button>
              </div>
            </Col>
            <Col v-for="key in ['b', 'c', 'd']" :key="key" :data-grid-col="key" v-bind="state.sibling ?? state.col">
              <div :data-grid-content="key" class="grid-business">Column {{ key }}</div>
            </Col>
          </Row>
        </div>
        <BreakpointProbe />
        <Row data-grid-outer :gutter="24" style="margin-top: 24px">
          <Col :span="12" data-grid-outer-col>
            <Row data-grid-inner :gutter="4"><Col :span="12" data-grid-inner-col>Nested</Col></Row>
          </Col>
        </Row>
        <ConfigProvider direction="ltr"><Row data-grid-independent :gutter="10"><Col :span="12" data-grid-independent-col>Independent LTR</Col></Row></ConfigProvider>
      </section>
    </ConfigProvider>
  </main>
</template>
<style scoped>
.grid-business { min-height: 40px; background: var(--apollo-color-fill-alter); padding: 8px; border: 1px solid var(--apollo-color-border); }
</style>
