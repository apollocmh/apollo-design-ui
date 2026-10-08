const e=`<script setup lang="ts">
// 对齐 antd 的 radiogroup-more demo（垂直组合 + 额外输入项）
import { Flex, Radio } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref(1);

/** antd 的 \`labelStyle\`（高 32 / 行高 32px）—— 内联样式走 px 字符串。 */
const labelStyle = { height: '32px', lineHeight: '32px' };

const buttonOptions = [
  { label: 'Apple', value: 'Apple', className: 'label-1' },
  { label: 'Pear', value: 'Pear', className: 'label-2' },
  { label: 'Orange', value: 'Orange', title: 'Orange', className: 'label-3' },
];
<\/script>

<template>
  <Flex align="start" gap="large">
    <div :style="{ flex: 1 }">
      <Radio.Group v-model:value="value" vertical>
        <Radio :value="1" :style="labelStyle">Option A</Radio>
        <Radio :value="2" :style="labelStyle">Option B</Radio>
        <Radio :value="3" :style="labelStyle">Option C</Radio>
        <Radio :value="4" :style="labelStyle">
          More...
          <!-- ⚠️ PLATFORM 替换：antd 用 Input variant="filled"；Input 组件尚未落地，
               这里用原生 input + 等价外观（README §2 登记）。 -->
          <input v-if="value === 4" class="demo-radio-filled-input" placeholder="please input" />
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
  height: 32px;
  margin-inline-start: 12px;
  padding: 4px 11px;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 14px;
}
</style>
`;export{e as default};
