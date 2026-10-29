<script setup lang="ts">
import { Button, ConfigProvider, Space } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const clicks = ref(0);
const enabled = ref(true);
const enlarged = ref(false);
const native = ref(false);
const customForeground = ref(false);
const theme = computed(() =>
  enabled.value
    ? {
        token: { colorPrimary: '#006b45', borderRadius: 16 },
        components: {
          Button: {
            ...(customForeground.value ? { primaryColor: '#fff6e6' } : {}),
            fontWeight: 600,
            iconGap: 12,
            paddingInline: 24,
            contentFontSize: enlarged.value ? 18 : 14,
            defaultBg: '#e8f5ee',
            defaultColor: '#123b2c',
            defaultBorderColor: '#33775b',
          },
        },
      }
    : undefined,
);
</script>
<template>
  <div class="demo-button-token">
    <fieldset>
      <legend>当前配置</legend>
      <label><input v-model="enabled" type="checkbox">启用组件 Token</label>
      <label><input v-model="enlarged" type="checkbox">放大字号</label>
      <label><input v-model="native" type="checkbox">原生变量优先</label>
      <label><input v-model="customForeground" type="checkbox">自定义主按钮文字</label>
    </fieldset>
    <ConfigProvider :theme="theme">
      <Space wrap>
        <Button type="primary" :style="native ? {'--apollo-btn-content-font-size':'22px'} : undefined" @click="clicks++">Primary</Button>
        <Button>Default</Button>
        <Button type="primary" danger>Danger</Button>
      </Space>
    </ConfigProvider>
    <label>保留草稿 <input aria-label="Button token draft" placeholder="切换配置时保留输入和焦点"></label>
    <p aria-live="polite" class="demo-button-token__hint">
      点击 Primary 次数：{{ clicks }}；切换或移除当前组件配置，原生根变量仍有最高优先级。
    </p>
  </div>
</template>
<style>
.demo-button-token {display:flex;flex-direction:column;gap:12px;font-family:var(--apollo-font-family);}
.demo-button-token fieldset {display:flex;flex-wrap:wrap;gap:12px;}
.demo-button-token__hint {margin:0;color:var(--apollo-color-text-secondary);font-size:12px;}
</style>
