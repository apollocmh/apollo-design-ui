const n=`<script setup lang="ts">
// 对齐 antd 的 timer demo（components/statistic/demo/timer.tsx）
import { Statistic } from '@apollo-design/ui';

const deadline = Date.now() + 1000 * 60 * 60 * 24 * 2 + 1000 * 30; // 两天后
const before = Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 30; // 两天前
const tenSecondsLater = Date.now() + 10 * 1000;

const onFinish = () => {
  console.log('finished!');
};

const onChange = (val?: number | string) => {
  if (typeof val === 'number' && !Number.isNaN(val) && 4.95 * 1000 < val && val < 5 * 1000) {
    console.log('changed!');
  }
};
<\/script>

<template>
  <div class="demo-statistic-timer">
    <Statistic.Timer
      type="countdown"
      :value="deadline"
      :class-names="{ content: 'demo-statistic-tabular' }"
      :on-finish="onFinish"
    />
    <Statistic.Timer
      type="countdown"
      title="Milliseconds"
      :value="deadline"
      format="HH:mm:ss:SSS"
      :class-names="{ content: 'demo-statistic-tabular' }"
    />
    <Statistic.Timer
      type="countdown"
      title="Countdown"
      :value="tenSecondsLater"
      :on-change="onChange"
      :class-names="{ content: 'demo-statistic-tabular' }"
    />
    <Statistic.Timer
      type="countup"
      title="Countup"
      :value="before"
      :on-change="onChange"
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
`;export{n as default};
