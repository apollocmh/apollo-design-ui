<script setup lang="ts">
import {
  ConfigProvider,
  Statistic,
  StatisticCountdown,
  StatisticTimer,
  type TimerType,
} from '@apollo-design/ui';
import { computed, nextTick, onMounted, ref, type StyleValue, shallowRef } from 'vue';

const independentTarget = Date.now() + 86400000;
const value = ref<number | string>('1234.50'),
  precision = ref<number | undefined>(2);
const source = ref(false),
  provider = ref(false),
  rtl = ref(false),
  titleSlot = ref(false),
  empty = ref(false),
  extra = ref(false),
  loading = ref(false);
const nativeStyle = shallowRef<StyleValue>({ width: '240px' });
const direction = ref<TimerType>('countup'),
  target = ref(Date.now() - 5000),
  timerPresent = ref(true),
  finishes = ref(0),
  changes = ref(0),
  last = ref<number | null>(null),
  clicks = ref(0);
const draft = ref('Original numeric draft'),
  clockDraft = ref('Original clock draft');
const components = computed(() =>
  provider.value
    ? {
        statistic: {
          className: 'current-statistic-provider',
          style: { padding: '9px' },
          classNames: { value: 'provider-value' },
        },
      }
    : undefined,
);
const theme = computed(() =>
  source.value
    ? {
        token: { colorTextHeading: '#225577' },
        components: { Statistic: { titleFontSize: 18, contentFontSize: 42 } },
      }
    : undefined,
);
declare global {
  interface Window {
    statisticAudit: {
      set(options: {
        source?: boolean;
        provider?: boolean;
        rtl?: boolean;
        titleSlot?: boolean;
        empty?: boolean;
        extra?: boolean;
        loading?: boolean;
        value?: number | string;
        precision?: number;
        style?: StyleValue;
      }): Promise<void>;
      clock(type: TimerType, delta: number | null): Promise<void>;
      showClock(show: boolean): Promise<void>;
      snapshot(): { finishes: number; changes: number; last: number | null; clicks: number };
    };
  }
}
onMounted(() => {
  window.statisticAudit = {
    async set(options) {
      for (const [key, v] of Object.entries(options)) {
        if (key === 'source') source.value = Boolean(v);
        if (key === 'provider') provider.value = Boolean(v);
        if (key === 'rtl') rtl.value = Boolean(v);
        if (key === 'titleSlot') titleSlot.value = Boolean(v);
        if (key === 'empty') empty.value = Boolean(v);
        if (key === 'extra') extra.value = Boolean(v);
        if (key === 'loading') loading.value = Boolean(v);
      }
      if (options.value !== undefined) value.value = options.value;
      if (options.precision !== undefined) precision.value = options.precision;
      if (options.style !== undefined) nativeStyle.value = options.style;
      await nextTick();
    },
    async clock(type, delta) {
      direction.value = type;
      target.value = delta === null ? NaN : Date.now() + delta;
      await nextTick();
    },
    async showClock(show) {
      timerPresent.value = show;
      await nextTick();
    },
    snapshot: () => ({
      finishes: finishes.value,
      changes: changes.value,
      last: last.value,
      clicks: clicks.value,
    }),
  };
});
</script>
<template>
  <main style="padding:24px;max-width:700px">
    <h1>Statistic native contracts</h1>
    <ConfigProvider :theme="theme" :components="components" :direction="rtl ? 'rtl' : 'ltr'">
      <Statistic id="statistic-main" data-statistic-main title="Current balance" :value="value" :precision="precision" :style="nativeStyle" :loading="loading" tabindex="0" @click="clicks++">
        <template v-if="titleSlot" #title><template v-if="!empty"><!-- leading --><b>Native title</b><i> tail</i></template></template>
        <template v-if="extra" #prefix><b>Prefix</b></template>
        <template v-if="extra" #suffix><i>Suffix</i></template>
        <template #value="{ value: current, text }"><!-- leading --><input v-model="draft" aria-label="Statistic native draft" style="display:block;width:160px;font-size:14px" /><output data-statistic-value>{{ current }}|{{ text }}</output></template>
      </Statistic>
      <Statistic v-if="timerPresent" data-plain-statistic title="Default typography" :value="112893" />
      <StatisticTimer v-if="timerPresent" data-statistic-timer title="Clock" :type="direction" :value="target" format="ss" @finish="finishes++" @change="changes++; last = $event">
        <template #title><b>Current clock title</b></template>
        <template #value="{ text, duration, type }"><!-- leading --><input v-model="clockDraft" aria-label="Statistic clock draft" style="display:block;width:160px;font-size:14px" /><output data-statistic-clock>{{ type }}|{{ text }}|{{ duration }}</output></template>
      </StatisticTimer>
      <StatisticCountdown data-statistic-countdown title="Independent countdown" :value="independentTarget" format="D[ days]">
        <template #suffix><b>Remaining</b></template>
      </StatisticCountdown>
    </ConfigProvider>
  </main>
</template>
