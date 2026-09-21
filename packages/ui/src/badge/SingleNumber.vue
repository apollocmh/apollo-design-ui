<script setup lang="ts">
/**
 * SingleNumber —— 单个数字的滚动单元（Badge 内部组件，不公开导出）。
 *
 * 契约来源：antd 6.6.4 的 `es/badge/SingleNumber.js`（逐条对齐）。
 *
 * ── 数字滚动机制 ──────────────────────────────────────────────────────────────
 *
 * prevValue 与 value 不同时，渲染 value…value+10 的单位序列，容器
 * `translateY(-{offset}00%)` 过渡；过渡结束（+1s 兜底定时器）回写 prev 值。
 *
 * ── 与 React 的差异 ───────────────────────────────────────────────────────────
 *
 * React 的 `onTransitionEnd` 挂在元素上、`useEffect` 清理定时器；Vue 对应
 * `@transitionend` + `watch` 的 onCleanup。其余判据逐字：
 *   - `prevValue === value || Number.isNaN(...)` → 无过渡（transition:none）
 *   - `unit = prevCount < count ? 1 : -1` 决定列表方向与裁剪
 */

import { computed, onScopeDispose, ref, watch } from 'vue';

const props = defineProps<{
  prefixCls: string;
  /** 当前数值（antd 的 count，绝对值参与比较）。 */
  count: number;
  /** 本单元的字符值（0-9 的字符串）。 */
  value: string;
}>();

const value = computed(() => Number(props.value));
const count = computed(() => Math.abs(props.count));

const prevValue = ref(value.value);
const prevCount = ref(count.value);

const onTransitionEnd = (): void => {
  prevValue.value = value.value;
  prevCount.value = count.value;
};

// Fallback if transition events are not supported（antd 原注释）
let timer: ReturnType<typeof setTimeout> | undefined;
watch(value, () => {
  if (timer !== undefined) clearTimeout(timer);
  timer = setTimeout(onTransitionEnd, 1000);
});
onScopeDispose(() => timer !== undefined && clearTimeout(timer));

function getOffset(start: number, end: number, unit: number): number {
  let index = start;
  let offset = 0;
  while ((index + 10) % 10 !== end) {
    index += unit;
    offset += unit;
  }
  return offset;
}

interface Unit {
  key: number;
  n: number;
  value: number;
  offset: number;
  current: boolean;
}

const state = computed(() => {
  if (
    prevValue.value === value.value ||
    Number.isNaN(value.value) ||
    Number.isNaN(prevValue.value)
  ) {
    // Nothing to change
    return {
      transitionNone: true,
      units: [
        { key: value.value, n: value.value, value: value.value, offset: 0, current: true },
      ] as Unit[],
      translateY: 0,
    };
  }
  // Fill basic number units
  const end = value.value + 10;
  const unitNumberList: number[] = [];
  for (let index = value.value; index <= end; index += 1) {
    unitNumberList.push(index);
  }
  const unit = prevCount.value < count.value ? 1 : -1;
  const prevIndex = unitNumberList.findIndex((n) => n % 10 === prevValue.value);
  const cutUnitNumberList =
    unit < 0 ? unitNumberList.slice(0, prevIndex + 1) : unitNumberList.slice(prevIndex);
  const units: Unit[] = cutUnitNumberList.map((n, index) => ({
    key: n,
    n: n % 10,
    value: n % 10,
    offset: unit < 0 ? index - prevIndex : index,
    current: index === prevIndex,
  }));
  return {
    transitionNone: false,
    units,
    translateY: -getOffset(prevValue.value, value.value, unit),
  };
});

const containerStyle = computed<{ transition?: string; transform?: string }>(() =>
  state.value.transitionNone
    ? { transition: 'none' }
    : { transform: `translateY(${state.value.translateY}00%)` },
);
</script>

<template>
  <span :class="`${prefixCls}-only`" :style="containerStyle" @transitionend="onTransitionEnd">
    <span
      v-for="u in state.units"
      :key="u.key"
      :class="[`${prefixCls}-only-unit`, { current: u.current }]"
      :style="u.offset ? { position: 'absolute', top: `${u.offset}00%`, left: '0' } : undefined"
    >
      {{ u.value }}
    </span>
  </span>
</template>
