<script setup lang="ts">
// 对齐 antd 的 collapsible-icon demo：collapsible.icon + motion
import { DoubleLeftOutlined, DoubleRightOutlined } from '@apollo-design/icons';
import { Splitter } from '@apollo-design/ui';
import { h, ref } from 'vue';

const collapsible = {
  motion: true,
  icon: {
    start: h(DoubleLeftOutlined),
    end: h(DoubleRightOutlined),
  },
};

const collapsedText = ref('尚未折叠');

const onCollapse = (collapsed: boolean[]) => {
  collapsedText.value = collapsed
    .map((item, index) => `面板 ${index + 1}：${item ? '已折叠' : '已展开'}`)
    .join('，');
};
</script>

<template>
  <Splitter
    style="height: 200px; box-shadow: 0 0 0 1px #d9d9d9"
    :collapsible="collapsible"
    @collapse="onCollapse"
  >
    <Splitter.Panel collapsible default-size="40%">左侧（可折叠）</Splitter.Panel>
    <Splitter.Panel collapsible>右侧（可折叠）</Splitter.Panel>
  </Splitter>
  <p>悬浮到分隔条后点击双箭头：{{ collapsedText }}</p>
</template>
