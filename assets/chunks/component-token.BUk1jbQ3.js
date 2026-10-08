const o=`<script setup lang="ts">
// 对齐 antd 的 component-token demo
// ⚠️ PLATFORM 等价替换：antd 用 \`ConfigProvider theme.components.Radio\` 注入 Component
//    Token；本仓零运行时 —— Component Token 就是 CSS 变量（\`--apollo-radio-*\`），
//    在容器上覆盖同名变量即可（完整清单见 index.zh-CN.md 的 Design Token 表）。
import { Radio, Space } from '@apollo-design/ui';
<\/script>

<template>
  <div class="demo-radio-token">
    <Space orientation="vertical">
      <Radio checked>Test</Radio>
      <Radio checked disabled>Disabled</Radio>
      <Radio.Group default-value="a">
        <Radio.Button value="a">Hangzhou</Radio.Button>
        <Radio.Button value="b">Shanghai</Radio.Button>
        <Radio.Button value="c">Beijing</Radio.Button>
        <Radio.Button value="d">Chengdu</Radio.Button>
      </Radio.Group>
      <Radio.Group default-value="a" disabled>
        <Radio.Button value="a">Hangzhou</Radio.Button>
        <Radio.Button value="b">Shanghai</Radio.Button>
        <Radio.Button value="c">Beijing</Radio.Button>
        <Radio.Button value="d">Chengdu</Radio.Button>
      </Radio.Group>
      <Radio.Group default-value="a" button-style="solid">
        <Radio.Button value="a">Hangzhou</Radio.Button>
        <Radio.Button value="b">Shanghai</Radio.Button>
        <Radio.Button value="c">Beijing</Radio.Button>
        <Radio.Button value="d">Chengdu</Radio.Button>
      </Radio.Group>
    </Space>
  </div>
</template>

<style>
/* 与 antd demo 的 token 覆盖逐项对应（radioSize / dotSize / dotColorDisabled /
   buttonBg / buttonCheckedBg / buttonColor / buttonPaddingInline /
   buttonCheckedBgDisabled / buttonCheckedColorDisabled / buttonSolidCheckedColor /
   wrapperMarginInlineEnd）。⚠️ 选择器必须比组件自身的声明更具体（0,2,0 > 0,1,0）。 */
.demo-radio-token .apollo-radio-group,
.demo-radio-token .apollo-radio-wrapper,
.demo-radio-token .apollo-radio-button-wrapper {
  --apollo-radio-radio-size: 20;
  --apollo-radio-dot-size: 10;
  --apollo-radio-dot-color-disabled: grey;
  --apollo-radio-button-bg: #f6ffed;
  --apollo-radio-button-checked-bg: #d9f7be;
  --apollo-radio-button-color: #faad14;
  --apollo-radio-button-padding-inline: 20px;
  --apollo-radio-button-checked-bg-disabled: #fffbe6;
  --apollo-radio-button-checked-color-disabled: #ffe58f;
  --apollo-radio-button-solid-checked-color: #ffa39e;
  --apollo-radio-wrapper-margin-inline-end: 20px;
}
</style>
`;export{o as default};
