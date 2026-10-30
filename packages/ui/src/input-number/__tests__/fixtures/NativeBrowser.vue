<script setup lang="ts">
import {
  compactAlgorithm,
  darkAlgorithm,
  getDesignToken,
  type ThemeConfig,
  transformToken,
} from '@apollo-design/theme';
import { h, ref } from 'vue';
import ConfigProvider from '../../../config-provider/ConfigProvider';
import { InputNumber, type ValueType } from '../../index';
import { genInputNumberStyle } from '../../style';

const css = `:root{${Object.entries(transformToken(getDesignToken()).vars)
  .map(([key, value]) => `${key}:${value}`)
  .join(';')}}${genInputNumberStyle('apollo')}*{transition:none!important}`;
const TokenStyles = () => h('style', css);
const theme = ref<ThemeConfig | undefined>({
  components: {
    InputNumber: {
      controlWidth: 180,
      handleWidth: 30,
      handleVisible: true,
      inputAffixPadding: 8,
      filledHandleBg: '#123456',
    },
  },
});
const value = ref<ValueType | null>(123);
const stepCount = ref(0);
const stepOnceCount = ref(0);
const enterCount = ref(0);
const formatter = (number: ValueType) => `$ ${number}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function changeTheme() {
  theme.value = {
    components: {
      InputNumber: {
        controlWidth: 240,
        handleWidth: 36,
        handleVisible: true,
        inputAffixPadding: 12,
        filledHandleBg: '#654321',
      },
    },
  };
}

function hideHandles() {
  theme.value = { components: { InputNumber: { handleVisible: false } } };
}

function darkCompact() {
  theme.value = {
    algorithm: [darkAlgorithm, compactAlgorithm],
    token: { controlHeight: 44, fontSize: 20 },
    components: { InputNumber: { handleVisible: true } },
  };
}
</script>

<template>
  <TokenStyles />
  <main style="display: grid; gap: 20px; padding: 40px">
    <ConfigProvider :theme="theme">
      <InputNumber id="tokens" :default-value="3" prefix="$" suffix="USD" variant="filled" aria-label="Themed number" />
      <ConfigProvider :theme="{ components: { InputNumber: { controlWidth: 210, handleVisible: true } } }">
        <InputNumber id="nested" :default-value="4" style="--apollo-input-number-handle-width: 40px" aria-label="Nested number" />
      </ConfigProvider>
      <InputNumber
        id="caret"
        v-model:value="value"
        :formatter="formatter"
        aria-label="Formatted number"
        @step="stepCount++"
        @step.once="stepOnceCount++"
        @press-enter="enterCount++"
      />
    </ConfigProvider>
    <div>
      <button id="change-theme" type="button" @click="changeTheme">Change theme</button>
      <button id="hide-handles" type="button" @click="hideHandles">Hide handles</button>
      <button id="dark-compact" type="button" @click="darkCompact">Dark compact</button>
      <button id="clear-theme" type="button" @click="theme = undefined">Clear theme</button>
    </div>
    <output id="events">{{ JSON.stringify({ stepCount, stepOnceCount, enterCount }) }}</output>
  </main>
</template>
