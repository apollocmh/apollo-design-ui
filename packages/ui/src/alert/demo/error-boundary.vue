<script setup lang="ts">
import { AlertErrorBoundary, Button, Space } from '@apollo-design/ui';
import { defineComponent, h, ref } from 'vue';

const failed = ref(false);
const boundaryKey = ref(0);
const Content = defineComponent({
  props: { failed: Boolean },
  setup(props) {
    return () => {
      if (props.failed) throw new Error('The task panel could not render');
      return h('p', 'The task panel is ready.');
    };
  },
});
const reset = () => {
  failed.value = false;
  boundaryKey.value += 1;
};
</script>

<template>
  <div>
    <Space wrap>
    <Button danger @click="failed = true">Fail descendant render</Button>
    <Button @click="reset">Remount boundary</Button>
    </Space>
    <AlertErrorBoundary :key="boundaryKey"><Content :failed="failed" /></AlertErrorBoundary>
  </div>
</template>
