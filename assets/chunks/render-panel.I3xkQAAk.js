const n=`<script setup lang="ts">
// 对齐 antd demo/render-panel.tsx —— 调试用组件，请勿直接使用
import { notification } from '@apollo-design/ui';

const InternalPanel = notification._InternalPanelDoNotUseOrYouWillBeFired;
<\/script>

<template>
  <component :is="InternalPanel" title="Hello World!" type="error" />
</template>
`;export{n as default};
