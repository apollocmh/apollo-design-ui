<script setup lang="ts">
import { Button, Checkbox, ConfigProvider, Input, Space } from '@apollo-design/ui';
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
      <Checkbox v-model:checked="enabled">启用组件 Token</Checkbox>
      <Checkbox v-model:checked="enlarged">放大字号</Checkbox>
      <Checkbox v-model:checked="native">原生变量优先</Checkbox>
      <Checkbox v-model:checked="customForeground">自定义主按钮文字</Checkbox>
    </fieldset>
    <ConfigProvider :theme="theme">
      <Space wrap>
        <Button type="primary" :style="native ? {'--apollo-btn-content-font-size':'22px'} : undefined" @click="clicks++">Primary</Button>
        <Button>Default</Button>
        <Button type="primary" danger>Danger</Button>
      </Space>
    </ConfigProvider>
    <label>保留草稿 <Input aria-label="Button token draft" placeholder="切换配置时保留输入和焦点" style="max-width: 280px" /></label>
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
