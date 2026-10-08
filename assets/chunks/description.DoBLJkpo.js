const n=`<script setup lang="ts">
import { Spin } from '../../index';

const rowStyle = { display: 'flex', alignItems: 'center', gap: '16px' };
const contentStyle = { padding: '50px', background: 'rgba(0, 0, 0, 0.05)', borderRadius: '4px' };
<\/script>

<template>
  <div :style="rowStyle">
    <Spin description="Loading" size="small">
      <div :style="contentStyle" />
    </Spin>
    <Spin description="Loading">
      <div :style="contentStyle" />
    </Spin>
    <Spin description="Loading" size="large">
      <div :style="contentStyle" />
    </Spin>
  </div>
</template>
`;export{n as default};
