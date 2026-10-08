const t=`<script setup lang="ts">
import { Space, SpaceCompact } from '../../index';
import { BTN_DASHED, BTN_DEFAULT, BTN_PRIMARY } from './_standin';

/** \`variant="outlined"\` 是 antd 6 的新写法，等价于默认的 \`BTN_DEFAULT\`。 */
const BTN_OUTLINED = BTN_DEFAULT;
<\/script>

<template>
  <Space>
    <SpaceCompact orientation="vertical">
      <button type="button" :style="BTN_DEFAULT">Button 1</button>
      <button type="button" :style="BTN_DEFAULT">Button 2</button>
      <button type="button" :style="BTN_DEFAULT">Button 3</button>
    </SpaceCompact>
    <SpaceCompact orientation="vertical">
      <button type="button" :style="BTN_DASHED">Button 1</button>
      <button type="button" :style="BTN_DASHED">Button 2</button>
      <button type="button" :style="BTN_DASHED">Button 3</button>
    </SpaceCompact>
    <SpaceCompact orientation="vertical">
      <button type="button" :style="BTN_PRIMARY">Button 1</button>
      <button type="button" :style="BTN_PRIMARY">Button 2</button>
      <button type="button" :style="BTN_PRIMARY">Button 3</button>
    </SpaceCompact>
    <SpaceCompact orientation="vertical">
      <button type="button" :style="BTN_OUTLINED">Button 1</button>
      <button type="button" :style="BTN_OUTLINED">Button 2</button>
      <button type="button" :style="BTN_OUTLINED">Button 3</button>
    </SpaceCompact>
  </Space>
</template>
`;export{t as default};
