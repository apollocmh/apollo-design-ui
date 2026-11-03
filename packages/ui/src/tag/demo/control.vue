<script setup lang="ts">
import { PlusOutlined } from '@apollo-design/icons';
import { Button, type ButtonRef, Input, type InputRef, Space, Tag } from '@apollo-design/ui';
import { nextTick, ref } from 'vue';

const tags = ref(['Tag 1', 'Tag 2', 'Tag 3']);
const inputVisible = ref(false);
const inputValue = ref('');
const input = ref<InputRef | null>(null);
const addButton = ref<ButtonRef | null>(null);

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
  addButton.value?.nativeElement?.focus();
};

const handleClose = (removed: string) => {
  tags.value = tags.value.filter((t) => t !== removed);
};
</script>

<template>
  <Space wrap>
    <Tag v-for="tag in tags" :key="tag" closable @close="handleClose(tag)">{{ tag }}</Tag>
    <Input
      v-if="inputVisible"
      ref="input"
      v-model:value="inputValue"
      type="text"
      aria-label="New tag name"
      :style="{ width: '78px', marginRight: '8px', verticalAlign: 'top' }"
      @blur="handleInputConfirm"
      @keydown.enter.prevent="handleInputConfirm"
    />
    <Button v-else ref="addButton" size="small" @click="showInput">
      <PlusOutlined aria-hidden="true" /> New Tag
    </Button>
  </Space>
</template>
