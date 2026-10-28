<script setup lang="ts">
import {
  Badge,
  type BadgeRef,
  ConfigProvider,
  Ribbon,
  type RibbonRef,
  type RibbonSlots,
} from '@apollo-design/ui';
import { Fragment, h, ref, type StyleValue, shallowRef } from 'vue';

const count = ref(5),
  custom = ref(true),
  empty = ref(false);
const badge = ref<BadgeRef | null>(null),
  ribbon = ref<RibbonRef | null>(null);
const style = shallowRef<StyleValue>([{ padding: '4px' }, 'margin: 2px']);
if (Badge.Ribbon !== Ribbon) throw new Error('Compound Ribbon must be the named public component');
const fragmentCount = h(Fragment, [h('strong', 'First'), h('em', 'Last'), 0]);
const arrayCount = [h('strong', 'First'), h('em', 'Last'), 0];
type IsAny<T> = 0 extends 1 & T ? true : false;
const compoundIsAny: IsAny<typeof Badge.Ribbon> = false;
void compoundIsAny;
const slots: RibbonSlots = { text: () => ['First', 'Last', 0] };
void slots;
const check = (b: InstanceType<typeof Badge>, r: InstanceType<typeof Ribbon>) => {
  // @ts-expect-error the actual root is a readonly owned reference
  b.nativeElement = null;
  // @ts-expect-error the actual wrapper is a readonly owned reference
  r.nativeElement = null;
  // @ts-expect-error compound Ribbon keeps the exact placement type
  const invalid: InstanceType<typeof Badge.Ribbon>['$props'] = { placement: 'middle' };
  return invalid;
};
void check;
</script>
<template>
  <ConfigProvider :components="{ badge: { classNames: { root: 'configured' } } }"
    :theme="{ components: { Badge: { indicatorHeight: 28, dotSize: 0, indicatorZIndex: 0 } } }">
    <Badge ref="badge" :count="count" :style="style" @click="count++">
      <input aria-label="Public draft" />
      <template v-if="custom" #count><strong v-if="!empty">First</strong><em v-if="!empty">Last</em></template>
      <template v-if="custom" #text><span v-if="!empty">Status</span></template>
    </Badge>
    <Ribbon ref="ribbon" text="Fallback" :style="style" :styles="{ indicator: { paddingInline: '12px' } }">
      <input aria-label="Ribbon draft" />
      <template v-if="custom" #text><b v-if="!empty">First</b><i v-if="!empty">Last</i></template>
    </Ribbon>
    <Badge.Ribbon text="Compound" placement="start"><template #text><b>Typed compound slot</b></template><div>Body</div></Badge.Ribbon>
    <Badge :count="fragmentCount" /><Badge :count="arrayCount" />
    <output>{{ badge?.nativeElement?.tagName }} {{ ribbon?.nativeElement?.tagName }}</output>
  </ConfigProvider>
</template>
