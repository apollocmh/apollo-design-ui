const n=`<script setup lang="ts">
import { Space } from '../../index';
import { CARD, CARD_BODY, CARD_HEAD } from './_standin';
<\/script>

<template>
  <Space orientation="vertical" size="medium" :style="{ display: 'flex' }">
    <div v-for="i in 3" :key="i" :style="CARD">
      <div :style="CARD_HEAD">Card</div>
      <div :style="CARD_BODY">
        <p>Card content</p>
        <p>Card content</p>
      </div>
    </div>
  </Space>
</template>
`;export{n as default};
