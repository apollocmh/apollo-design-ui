<script setup lang="ts">
// 语义化样式与类：Input / TextArea 各自的槽位
import type { InputProps, TextAreaProps } from '@apollo-design/ui';
import { Input, TextArea } from '@apollo-design/ui';

const inputClassNames: InputProps['classNames'] = {
  root: 'demo-input-style__root',
  input: 'demo-input-style__input',
  affixWrapper: 'demo-input-style__affix',
};

const inputStyles: InputProps['styles'] = {
  input: { color: '#722ed1', fontWeight: 600 },
  affixWrapper: { backgroundColor: '#f9f0ff' },
};

const textAreaClassNames: TextAreaProps['classNames'] = {
  root: 'demo-input-style__textarea-root',
  textarea: 'demo-input-style__textarea',
};

const textAreaStyles: TextAreaProps['styles'] = {
  textarea: { color: '#08979c' },
};
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px; width: 360px">
    <Input
      :class-names="inputClassNames"
      :styles="inputStyles"
      prefix="@"
      default-value="apollo"
      aria-label="语义化输入框"
    />
    <TextArea
      :class-names="textAreaClassNames"
      :styles="textAreaStyles"
      :rows="3"
      default-value="语义化槽位可以让类名与样式精确落在 input / textarea 上。"
      aria-label="语义化文本域"
    />
    <p style="margin: 0; color: #999; font-size: 12px">
      input 与 affixWrapper 槽位分别命中输入框和前缀包裹层。
    </p>
  </div>
</template>

<style>
.demo-input-style__input {
  letter-spacing: 0.4px;
}

.demo-input-style__affix {
  border-color: #d3adf7;
}

.demo-input-style__textarea {
  line-height: 1.7;
}
</style>
