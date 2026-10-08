const n=`<script setup lang="ts">
// 对齐 antd 的 control demo（Input/Tooltip 未落地 —— 原生 input + Tag 等价组合）

import { PlusOutlined } from '@apollo-design/icons';
import { Space, Tag } from '@apollo-design/ui';
import { ref } from 'vue';

const tags = ref(['Tag 1', 'Tag 2', 'Tag 3']);
const inputVisible = ref(false);
const inputValue = ref('');

const showInput = () => {
  inputVisible.value = true;
};
const handleInputConfirm = () => {
  if (inputValue.value && !tags.value.includes(inputValue.value)) {
    tags.value = [...tags.value, inputValue.value];
  }
  inputVisible.value = false;
  inputValue.value = '';
};

const handleClose = (removed: string) => {
  tags.value = tags.value.filter((t) => t !== removed);
};
<\/script>

<template>
  <Space wrap>
    <Tag v-for="tag in tags" :key="tag" closable @close="handleClose(tag)">{{ tag }}</Tag>
    <input
      v-if="inputVisible"
      type="text"
      size="small"
      :style="{ width: '78px', marginRight: '8px', verticalAlign: 'top' }"
      @blur="handleInputConfirm"
      @keydown.enter="handleInputConfirm"
    >
    <Tag v-else :style="{ borderStyle: 'dashed', cursor: 'pointer' }" @click="showInput">
      <PlusOutlined /> New Tag
    </Tag>
  </Space>
</template>
`;export{n as default};
