<script setup lang="ts">
import {
  Col,
  type ColConfig,
  type ColProps,
  type GridRef,
  type GridSlot,
  type Gutter,
  Row,
  type RowConfig,
  useBreakpoint,
} from '@apollo-design/ui';
import { h, ref, type StyleValue } from 'vue';

const row = ref<GridRef | null>(null),
  col = ref<GridRef | null>(null);
const gutter: Gutter = [
  { xs: 0, md: 10.5 },
  { xs: '0.5rem', md: 7.5 },
];
const columns: ColProps = {
  span: 12,
  xs: { span: 24, offset: 0, order: 0, push: 0, pull: 0, flex: 0 },
  xxxl: { flex: 'auto' },
};
const rowConfig: RowConfig = { className: 'row-default', style: { padding: '4px' } };
const colConfig: ColConfig = { className: 'col-default', style: { padding: '4px' } };
const native: StyleValue = ['max-width: 720px', { minWidth: '0' }];
const content: GridSlot = () => [h('b', 'first'), ' tail', 0];
const enabled = ref(false),
  screens = useBreakpoint(() => enabled.value, null);
void rowConfig;
void colConfig;
void content;

// @ts-expect-error Each gutter axis is scalar or breakpoint map, never another tuple.
const nested: Gutter = [[8, 16], 24];
// @ts-expect-error Column spans are numeric.
const invalid: ColProps = { span: '12' };
// @ts-expect-error Component configs use Vue CSSProperties.
const wrongStyle: RowConfig = { style: 'width: 300px' };
void nested;
void invalid;
void wrongStyle;
</script>
<template>
  <Row ref="row" :gutter="gutter" :style="native" :justify="{ xs: 'start', md: 'space-between' }" :align="{ xs: 'middle', md: 'stretch' }" :wrap="false" aria-label="Public grid">
    <Col ref="col" v-bind="columns" style="min-height: 30px"><b>Native</b> content {{ 0 }}</Col>
  </Row>
  <output>{{ screens?.md }} {{ row?.nativeElement?.tagName }} {{ col?.nativeElement?.tagName }}</output>
</template>
