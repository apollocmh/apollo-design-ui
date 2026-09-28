<script setup lang="ts">
// 对齐 antd 的 style-class demo（含函数式 styles）

import { CloudOutlined, RocketOutlined, ThunderboltOutlined } from '@apollo-design/icons';
import { Segmented } from '@apollo-design/ui';
import { h } from 'vue';

const classNames = { root: 'seg-demo-root' };

const styleFn = (info: { props: { vertical?: boolean } }) => {
  if (info.props.vertical) {
    return {
      root: { border: '1px solid #77BEF0', padding: '4px', width: '100px' },
      icon: { color: '#77BEF0' },
      item: { textAlign: 'start' },
    };
  }
  return {};
};

const styles = { root: { padding: '4px', width: '260px' } };

const options = [
  { label: 'Boost', value: 'boost', icon: h(RocketOutlined) },
  { label: 'Stream', value: 'stream', icon: h(ThunderboltOutlined) },
  { label: 'Cloud', value: 'cloud', icon: h(CloudOutlined) },
];
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px">
    <Segmented :options="options" :class-names="classNames" :styles="styles" />
    <Segmented :options="options" :class-names="classNames" :styles="styleFn" vertical />
  </div>
</template>
