<script setup lang="ts">
import { Statistic, type TimerType } from '@apollo-design/ui';
import { ref } from 'vue';

const deadline = Date.now() + 1000 * 60 * 60 * 24 * 2 + 1000 * 30; // 两天后
const before = Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 30; // 两天前
const shortTarget = ref(Date.now() + 10_000);
const type = ref<TimerType>('countdown');
const finishes = ref(0),
  draft = ref('Saved clock draft');
const onFinish = () => {
  finishes.value++;
};
const restart = () => {
  type.value = 'countdown';
  shortTarget.value = Date.now() + 1500;
};
const switchDirection = () => {
  type.value = type.value === 'countdown' ? 'countup' : 'countdown';
  shortTarget.value = Date.now() + (type.value === 'countdown' ? 5000 : -5000);
};
</script>

<template>
  <div style="margin-bottom:16px">
    <button type="button" @click="restart">Restart short countdown</button>
    <button type="button" @click="switchDirection">Switch clock direction</button>
    <output aria-label="Completed countdowns">{{ finishes }}</output>
  </div>
  <div class="demo-statistic-timer">
    <Statistic.Timer
      type="countdown"
      :value="deadline"
      :class-names="{ content: 'demo-statistic-tabular' }"
      @finish="onFinish"
    />
    <Statistic.Timer
      type="countdown"
      title="Milliseconds"
      :value="deadline"
      format="HH:mm:ss:SSS"
      :class-names="{ content: 'demo-statistic-tabular' }"
    />
    <Statistic.Timer
      :type="type"
      title="Interactive clock"
      :value="shortTarget"
      @finish="onFinish"
      :class-names="{ content: 'demo-statistic-tabular' }"
    >
      <template #value="{ text, duration }">
        <span data-clock-text>{{ text }}</span>
        <input v-model="draft" aria-label="Clock draft" style="display:block;width:150px;font-size:14px" />
        <small data-clock-duration style="font-size:12px">{{ duration === null ? 'Starting' : 'Running' }}</small>
      </template>
    </Statistic.Timer>
    <Statistic.Timer
      type="countup"
      title="Countup"
      :value="before"
      :class-names="{ content: 'demo-statistic-tabular' }"
    />
    <div class="demo-statistic-timer-row">
      <Statistic.Timer
        type="countdown"
        title="Day Level (Countdown)"
        :value="deadline"
        format="D 天 H 时 m 分 s 秒"
        :class-names="{ content: 'demo-statistic-tabular' }"
      />
    </div>
    <div class="demo-statistic-timer-row">
      <Statistic.Timer
        type="countup"
        title="Day Level (Countup)"
        :value="before"
        format="D 天 H 时 m 分 s 秒"
        :class-names="{ content: 'demo-statistic-tabular' }"
      />
    </div>
  </div>
</template>

<style scoped>
.demo-statistic-timer {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}
.demo-statistic-timer-row {
  width: 100%;
}
</style>

<style>
.demo-statistic-tabular {
  font-variant-numeric: tabular-nums;
}
</style>
