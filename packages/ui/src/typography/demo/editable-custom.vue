<script setup lang="ts">
// editable 变体：自定义图标、触发方式、maxLength 与多行 autoSize
import { EditOutlined } from '@apollo-design/icons';
import type { EditConfig } from '@apollo-design/ui';
import { Paragraph, Text } from '@apollo-design/ui';
import { computed, h, ref } from 'vue';

const text = ref('点击图标或文字进入编辑');
const saved = ref(text.value);

const editableConfig = computed<EditConfig>(() => ({
  text: text.value,
  onChange: (value: string) => {
    text.value = value;
    saved.value = value;
  },
  triggerType: ['icon', 'text'],
  maxLength: 20,
  icon: h(EditOutlined),
  tooltip: '编辑这段文字',
}));

const paragraph = ref('多行可编辑段落：编辑框会随内容自动撑高，按 Enter 保存，按 Esc 取消。');
const paragraphConfig = computed<EditConfig>(() => ({
  text: paragraph.value,
  onChange: (value: string) => {
    paragraph.value = value;
  },
  autoSize: { minRows: 2, maxRows: 5 },
  enterIcon: null,
}));
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 12px; font-family: sans-serif">
    <div>
      <Text :editable="editableConfig">{{ text }}</Text>
    </div>
    <div style="font-size: 12px; color: var(--apollo-color-text)">保存后的值：{{ saved }}</div>
    <Paragraph :editable="paragraphConfig" :style="{ width: '320px' }">
      {{ paragraph }}
    </Paragraph>
  </div>
</template>
