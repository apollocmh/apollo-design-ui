const e=`<script setup lang="ts">
// 对齐 antd 的 style-class demo（语义化三槽：root / icon / label）
// ⚠️ PLATFORM 替换：antd 用 antd-style 的 createStyles 生成类名；本仓零运行时，
//    类名与样式都由 demo 自己的 <style> 提供（两边机制本就不同，比的是挂载结果）。
import { Flex, Radio } from '@apollo-design/ui';
import { ref } from 'vue';

const value = ref<'styles' | 'classNames'>('styles');

/** 对象形态的 \`styles\`。 */
const styles = {
  icon: { borderRadius: '6px' },
  label: { color: 'blue' },
};

/** 函数形态的 \`classNames\` —— 按选中态动态返回（antd 同 demo 的写法）。 */
const classNamesFn = (info: { props: { checked?: boolean } }) =>
  info.props.checked
    ? {
        root: 'demo-radio-style-root demo-radio-style-root-checked',
        icon: 'demo-radio-style-icon demo-radio-style-icon-checked',
        label: 'demo-radio-style-label demo-radio-style-label-checked',
      }
    : {
        root: 'demo-radio-style-root',
        icon: 'demo-radio-style-icon',
        label: 'demo-radio-style-label',
      };
<\/script>

<template>
  <Flex vertical gap="medium">
    <Radio
      name="style-class"
      :styles="styles"
      :checked="value === 'styles'"
      @change="value = 'styles'"
    >
      Object styles
    </Radio>
    <Radio
      name="style-class"
      :class-names="classNamesFn"
      :checked="value === 'classNames'"
      @change="value = 'classNames'"
    >
      Function classNames
    </Radio>
  </Flex>
</template>

<style>
.demo-radio-style-root {
  border-radius: 6px;
  background-color: #fff;
}
.demo-radio-style-icon {
  border-color: #faad14;
}
.demo-radio-style-label {
  color: rgba(0, 0, 0, 0.25);
  font-weight: bold;
}
.demo-radio-style-icon-checked {
  background-color: #faad14;
}
.demo-radio-style-label-checked {
  color: #faad14;
}
</style>
`;export{e as default};
