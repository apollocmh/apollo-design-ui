const t=`<script setup lang="ts">
import { Button } from '../../index';
<\/script>

<template>
  <div :style="{ background: 'rgb(190, 200, 200)', padding: '16px' }">
    <Button type="primary" ghost>Primary</Button>
    <Button ghost>Default</Button>
    <Button type="dashed" ghost>Dashed</Button>
    <Button type="primary" danger ghost>Danger</Button>
  </div>
</template>
`;export{t as default};
