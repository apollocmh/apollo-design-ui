const n=`<script setup lang="ts">
// 对齐 antd 的 demo/picture-card.tsx

import { PlusOutlined } from '@apollo-design/icons';
import { Upload } from '@apollo-design/ui';
import { ref } from 'vue';

const fileList = ref([
  {
    uid: '-1',
    name: 'image.png',
    status: 'done' as const,
    url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
  },
]);
<\/script>

<template>
  <div style="font-family: sans-serif">
    <Upload v-model:file-list="fileList" action="/upload.do" list-type="picture-card">
      <div>
        <PlusOutlined />
        <div style="margin-top: 8px">Upload</div>
      </div>
    </Upload>
  </div>
</template>
`;export{n as default};
