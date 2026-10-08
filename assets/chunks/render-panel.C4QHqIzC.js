const e=`<script setup lang="ts">
// 对齐 antd demo/render-panel.tsx —— 调试用组件，请勿直接使用
import { message } from '@apollo-design/ui';

const InternalPanel = message._InternalPanelDoNotUseOrYouWillBeFired;
<\/script>

<template>
  <component :is="InternalPanel" content="Hello World!" type="error" />
</template>
`;export{e as default};
