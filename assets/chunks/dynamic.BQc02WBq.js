const n=`<script setup lang="ts">
// 对齐 antd 的 dynamic demo

import { Button, Segmented } from '@apollo-design/ui';
import { ref } from 'vue';

const options = ref(['Daily', 'Weekly', 'Monthly']);
const moreLoaded = ref(false);

const handleLoadOptions = () => {
  options.value = [...options.value, 'Quarterly', 'Yearly'];
  moreLoaded.value = true;
};
<\/script>

<template>
  <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px">
    <Segmented :options="options" />
    <Button type="primary" :disabled="moreLoaded" @click="handleLoadOptions">
      Load more options
    </Button>
  </div>
</template>
`;export{n as default};
