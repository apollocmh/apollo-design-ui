<script setup lang="ts">
// 对齐 antd 的 `style-class` demo。
import { Flex, Timeline } from '@apollo-design/ui';

const items = [
  { title: '2015-09-01', content: 'Create a services site' },
  { title: '2015-09-01 09:12:11', content: 'Solve initial network problems' },
  { content: 'Technical testing' },
];
const classNames = { root: 'demo-timeline-root' };
const styles = { itemIcon: { borderColor: '#1890ff' } };
/** ⚠️ 函数形态：拿到的 `info.props` 是**解析后**的 props。 */
const stylesFn = (info: { props: { orientation?: string } }) =>
  info.props.orientation === 'vertical'
    ? {
        root: { padding: '10px 6px', border: '1px solid #A294F9' },
        itemIcon: { borderColor: '#A294F9' },
      }
    : {};
</script>

<template>
  <Flex vertical :gap="16">
    <Timeline
      :class-names="classNames"
      :items="items"
      orientation="horizontal"
      :styles="styles"
    />
    <Timeline
      :class-names="classNames"
      :items="items"
      orientation="vertical"
      :styles="stylesFn"
    />
  </Flex>
</template>
