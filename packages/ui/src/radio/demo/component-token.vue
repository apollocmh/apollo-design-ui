<script setup lang="ts">
import { ConfigProvider, Radio, Space } from '@apollo-design/ui';

const theme = {
  components: {
    Radio: {
      radioSize: 20,
      dotSize: 10,
      dotColorDisabled: 'grey',
      buttonBg: '#f6ffed',
      buttonCheckedBg: '#d9f7be',
      buttonColor: '#faad14',
      buttonPaddingInline: 20,
      buttonCheckedBgDisabled: '#fffbe6',
      buttonCheckedColorDisabled: '#ffe58f',
      buttonSolidCheckedColor: '#ffa39e',
      wrapperMarginInlineEnd: 20,
    },
  },
};
</script>

<template>
  <ConfigProvider :theme="theme">
    <Space orientation="vertical">
      <Radio checked>Test</Radio>
      <Radio checked disabled>Disabled</Radio>
      <Radio.Group default-value="a" aria-label="Cities">
        <Radio.Button value="a">Hangzhou</Radio.Button>
        <Radio.Button value="b">Shanghai</Radio.Button>
        <Radio.Button value="c">Beijing</Radio.Button>
        <Radio.Button value="d">Chengdu</Radio.Button>
      </Radio.Group>
      <Radio.Group default-value="a" disabled aria-label="Disabled cities">
        <Radio.Button value="a">Hangzhou</Radio.Button>
        <Radio.Button value="b">Shanghai</Radio.Button>
        <Radio.Button value="c">Beijing</Radio.Button>
        <Radio.Button value="d">Chengdu</Radio.Button>
      </Radio.Group>
      <Radio.Group default-value="a" button-style="solid" aria-label="Solid cities">
        <Radio.Button value="a">Hangzhou</Radio.Button>
        <Radio.Button value="b">Shanghai</Radio.Button>
        <Radio.Button value="c">Beijing</Radio.Button>
        <Radio.Button value="d">Chengdu</Radio.Button>
      </Radio.Group>
    </Space>
  </ConfigProvider>
</template>
