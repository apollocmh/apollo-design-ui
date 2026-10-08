const e=`<script setup lang="ts">
import { Divider } from '../../index';
<\/script>

<template>
  <Divider :style="{ borderWidth: '2px', borderColor: '#7cb305' }" />
  <Divider :style="{ borderColor: '#7cb305' }" dashed />
  <Divider :style="{ borderColor: '#7cb305' }" dashed>Text</Divider>
  <Divider vertical :style="{ height: '60px', borderColor: '#7cb305' }" />
  <Divider vertical :style="{ height: '60px', borderColor: '#7cb305' }" dashed />

  <div
    :style="{
      display: 'flex',
      flexDirection: 'column',
      height: '50px',
      boxShadow: '0 0 1px red',
    }"
  >
    <Divider :style="{ background: 'rgba(0,255,0,0.05)' }" title-placement="start">Text</Divider>
  </div>
</template>
`;export{e as default};
