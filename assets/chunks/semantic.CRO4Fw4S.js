const a=`<script setup lang="ts">
import { Skeleton } from '../../index';
<\/script>

<template>
  <Skeleton
    avatar
    :class-names="{ root: 'demo-root', avatar: 'demo-avatar', paragraph: 'demo-paragraph' }"
    :styles="{ paragraph: { marginBlockStart: '24px' } }"
  />
</template>
`;export{a as default};
