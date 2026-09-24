<script setup lang="ts">
// 对齐 antd 的 demo/style-class.tsx（antd-style 的 createStaticStyles ⇒ 普通 object）

import { Button, Flex, Tooltip } from '@apollo-design/ui';

const classNames = { container: 'demo-tooltip-container' };
const styles = { container: { borderRadius: '12px', boxShadow: 'inset 0 0 8px #ccc' } };
const stylesFn = (info: { props: { arrow?: unknown } }) => {
  if (!info.props.arrow) {
    return {
      container: {
        backgroundColor: 'rgba(53, 71, 125, 0.8)',
        padding: '12px',
        color: '#fff',
        borderRadius: '4px',
      },
    };
  }
  return {};
};
</script>

<template>
  <div style="font-family: sans-serif">
    <Flex gap="medium">
      <Tooltip :class-names="classNames" :styles="styles" :arrow="false" title="Object text">
        <Button>Object Style</Button>
      </Tooltip>
      <Tooltip :class-names="classNames" :styles="stylesFn" :arrow="false" title="Function text">
        <Button type="primary">Function Style</Button>
      </Tooltip>
    </Flex>
  </div>
</template>
