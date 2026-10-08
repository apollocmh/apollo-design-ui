const e=`<script setup lang="ts">
// 对齐 antd 的 custom-container demo（任意可挂 ref 的宿主）
import { BorderBeam } from '@apollo-design/ui';
<\/script>

<template>
  <BorderBeam :size="40">
    <div
      style="position: relative; border-radius: 16px; height: 64px; display: flex; align-items: center; justify-content: center; border: 1px solid #ddd"
    >
      Custom container
    </div>
  </BorderBeam>
</template>
`;export{e as default};
