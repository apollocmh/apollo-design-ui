const e=`<script setup lang="ts">
// 对齐 antd 的 componentToken demo
import { ConfigProvider, Segmented } from '@apollo-design/ui';
<\/script>

<template>
  <ConfigProvider
    :theme="{
      components: {
        Segmented: {
          itemColor: '#222',
          itemHoverColor: '#333',
          itemHoverBg: 'rgba(0, 0, 0, 0.06)',
          itemSelectedBg: 'linear-gradient(225deg, #c200ff 0%, #00ffff 100%)',
          itemActiveBg: '#ccc',
          itemSelectedColor: '#fff',
        },
      },
    }"
  >
    <Segmented :options="['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']" />
  </ConfigProvider>
</template>
`;export{e as default};
