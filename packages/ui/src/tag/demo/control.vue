<script setup lang="ts">
import { PlusOutlined } from '@apollo-design/icons';
import { Space, Tag } from '@apollo-design/ui';
import { nextTick, ref } from 'vue';

const tags = ref(['Tag 1', 'Tag 2', 'Tag 3']);
const inputVisible = ref(false);
const inputValue = ref('');
const input = ref<HTMLInputElement | null>(null);
const addButton = ref<HTMLButtonElement | null>(null);

const showInput = async () => {
  inputVisible.value = true;
  await nextTick();
  input.value?.focus();
};
const handleInputConfirm = async () => {
  if (!inputVisible.value) return;
  const text = inputValue.value.trim();
  if (text && !tags.value.includes(text)) {
    tags.value = [...tags.value, text];
  }
  inputVisible.value = false;
  inputValue.value = '';
  await nextTick();
  addButton.value?.focus();
};

const handleClose = (removed: string) => {
  tags.value = tags.value.filter((t) => t !== removed);
};
</script>

<template>
  <Space wrap>
    <Tag v-for="tag in tags" :key="tag" closable @close="handleClose(tag)">{{ tag }}</Tag>
    <input
      v-if="inputVisible"
      ref="input"
      v-model="inputValue"
      type="text"
      aria-label="New tag name"
      :style="{ width: '78px', marginRight: '8px', verticalAlign: 'top' }"
      @blur="handleInputConfirm"
      @keydown.enter.prevent="handleInputConfirm"
    >
    <button v-else ref="addButton" type="button" @click="showInput">
      <PlusOutlined aria-hidden="true" /> New Tag
    </button>
  </Space>
</template>
