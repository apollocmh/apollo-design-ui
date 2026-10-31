<script setup lang="ts">
import { computed, ref, shallowRef, useTemplateRef } from 'vue';
import { Carousel } from '../../index';
import type { CarouselProps, CarouselRef } from '../../interface';
import SlotShell from './SlotShell.vue';

const control = useTemplateRef<CarouselRef>('control');
const contents = useTemplateRef<HTMLElement[]>('contents');
const fields = useTemplateRef<HTMLInputElement[]>('fields');
const slottedFields = useTemplateRef<HTMLInputElement[]>('slottedFields');
const stampSuffix = ref('initial');
const slotCalls: string[] = [];
const record = (stamp: string) => {
  slotCalls.push(stamp);
  return stamp;
};
const items = ref(['a', 'b', 'c']);
const present = ref(true);
const custom = ref(true);
const options = shallowRef<CarouselProps>({ arrows: true, speed: 60 });
const before = ref<[number, number][]>([]);
const after = ref<number[]>([]);
const current = computed(() => control.value?.innerSlider.currentSlide);
const ready = computed(() => control.value?.innerSlider.initialized);
const goTo = (index: number, dontAnimate = true) => control.value?.goTo(index, dontAnimate);
const next = () => control.value?.next();
const prev = () => control.value?.prev();
const autoPlay = (type?: 'update' | 'leave' | 'blur') => control.value?.autoPlay(type);
defineExpose({
  items,
  stampSuffix,
  slotCalls,
  present,
  custom,
  options,
  before,
  after,
  current,
  ready,
  goTo,
  next,
  prev,
  autoPlay,
  get slottedElements() {
    return slottedFields.value;
  },
  get fieldElements() {
    return fields.value;
  },
  get contentElements() {
    return contents.value;
  },
  get element() {
    return control.value?.nativeElement;
  },
});
</script>
<template>
  <Carousel v-if="present" ref="control" id="compiled-carousel" v-bind="options" @before-change="(from, to) => before.push([from, to])" @after-change="(index) => after.push(index)">
    <section v-for="item in items" :key="item" ref="contents" :data-item="item"><button type="button" :data-action="item">{{ item }}</button><label :for="`field-${item}`">Field {{ item }}</label><input ref="fields" :id="`field-${item}`" :value="item" :aria-describedby="`help-${item} outside-help`" /><span :id="`help-${item}`">Help {{ item }}</span><SlotShell :stamp="`${item}-${stampSuffix}`"><template #default="{ stamp }"><input ref="slottedFields" :data-slot-stamp="stamp" :aria-label="record(stamp)" /></template></SlotShell></section>
    <template #next-arrow="{ currentSlide, slideCount }"><span v-if="custom">Next {{ currentSlide.toFixed(0) }} / {{ slideCount }}</span><b v-if="custom">slide</b></template>
  </Carousel>
</template>
