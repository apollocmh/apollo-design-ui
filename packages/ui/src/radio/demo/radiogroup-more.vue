<script setup lang="ts">
// 对齐 antd 的 radiogroup-more demo（垂直组合 + 额外输入项）
import { Flex, Input, Radio } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref(1);

/** antd 的 `labelStyle`（高 32 / 行高 32px）—— 内联样式走 px 字符串。 */
const labelStyle = { height: '32px', lineHeight: '32px' };

const buttonOptions = [
  { label: 'Apple', value: 'Apple', className: 'label-1' },
  { label: 'Pear', value: 'Pear', className: 'label-2' },
  { label: 'Orange', value: 'Orange', title: 'Orange', className: 'label-3' },
];
</script>

<template>
  <Flex align="start" gap="large" wrap>
    <div :style="{ flex: 1 }">
      <Radio.Group v-model:value="value" vertical>
        <Radio :value="1" :style="labelStyle">Option A</Radio>
        <Radio :value="2" :style="labelStyle">Option B</Radio>
        <Radio :value="3" :style="labelStyle">Option C</Radio>
        <Radio :value="4" :style="labelStyle">
          More...
          <Input v-if="value === 4" variant="filled" class="demo-radio-filled-input" aria-label="更多选项内容" placeholder="please input" />
        </Radio>
      </Radio.Group>
    </div>
    <div :style="{ flex: 1 }">
      <Radio.Group :options="buttonOptions" option-type="button" vertical />
    </div>
  </Flex>
</template>

<style>
.demo-radio-filled-input {
  width: 120px;
  margin-inline-start: 12px;

}
</style>
