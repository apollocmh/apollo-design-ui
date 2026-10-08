const t=`<script setup lang="ts">
import { Space } from '../../index';
import { BTN_DEFAULT } from './_standin';
<\/script>

<template>
  <Space :size="[8, 16]" wrap>
    <button v-for="i in 20" :key="i" type="button" :style="BTN_DEFAULT">Button</button>
  </Space>
</template>
`;export{t as default};
