const t=`<script setup lang="ts">
// 对齐 antd demo/small-size（size 用法）
import { Steps } from '@apollo-design/ui';

const items = [{ title: '第一步' }, { title: '第二步' }, { title: '第三步' }];
<\/script>

<template>
  <Steps :items="items" :current="1" size="small" />
</template>
`;export{t as default};
