<script setup lang="ts">
// 对齐 antd demo/style-class.tsx（semantic styles 的对象与函数两种形态）
import { Button, Popover, Tooltip } from '@apollo-design/ui';
import { ref } from 'vue';

const highLayer = ref(true);

const styles = {
  container: {
    background: '#eee',
    boxShadow: 'inset 5px 5px 3px #fff, inset -5px -5px 3px #ddd, 0 0 3px rgba(0,0,0,0.2)',
  },
  content: {
    color: '#262626',
  },
};

const stylesFn = (info: { props: { arrow?: unknown } }) => {
  if (!info.props.arrow) {
    return {
      container: {
        backgroundColor: 'rgba(53, 71, 125, 0.8)',
        padding: '12px',
        borderRadius: '4px',
      },
      content: {
        color: '#fff',
      },
    };
  }
  return {};
};
</script>

<template>
  <div style="display: flex; flex-wrap: wrap; gap: 12px">
    <Popover content="Object text" :styles="styles" :arrow="false">
      <Button>Object Style</Button>
    </Popover>
    <Popover content="Function text" :styles="stylesFn" :arrow="false">
      <Button type="primary">Function Style</Button>
    </Popover>
    <Popover class="demo-layer-popover" :style="highLayer && { zIndex: 2500 }">
      <Button>Nested layers</Button>
      <template #content>
        <Tooltip class="demo-layer-tooltip" title="The nested hint follows the current popup layer.">
          <Button @click="highLayer = !highLayer">Popup layer: {{ highLayer ? '2500' : 'default' }}</Button>
        </Tooltip>
      </template>
    </Popover>
  </div>
</template>
