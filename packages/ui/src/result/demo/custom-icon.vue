<script setup lang="ts">
// 对齐 antd 的 customIcon demo

import { SmileOutlined } from '@apollo-design/icons';
import { Button, Result } from '@apollo-design/ui';
import { h } from 'vue';

const extraNode = () => h(Button, { type: 'primary' }, () => 'Next');
</script>

<template>
  <Result
    :icon="h(SmileOutlined)"
    title="Great, we have done all the operations!"
    :extra="extraNode()"
  />
</template>
