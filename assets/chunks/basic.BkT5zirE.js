const n=`<script setup lang="ts">
// 对齐 antd 的 demo/basic.tsx

import { UploadOutlined } from '@apollo-design/icons';
import { Upload } from '@apollo-design/ui';
import { ref } from 'vue';

const fileList = ref([
  {
    uid: '-1',
    name: 'xxx.png',
    status: 'done' as const,
    url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    thumbUrl: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
  },
]);

const handleChange = (info: unknown) => {
  void info;
};
<\/script>

<template>
  <!-- 显式钉字体：继承字体差异是平台差异（CHECKLIST 四） -->
  <div style="font-family: sans-serif">
    <Upload
      v-model:file-list="fileList"
      action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
      @change="handleChange"
    >
      <button class="demo-upload-btn" type="button">
        <UploadOutlined /> Click to Upload
      </button>
    </Upload>
  </div>
</template>
`;export{n as default};
