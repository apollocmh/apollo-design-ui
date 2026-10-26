<script setup lang="ts">
import {
  ConfigProvider,
  Skeleton,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonImage,
  SkeletonInput,
  SkeletonNode,
} from '@apollo-design/ui';
import { computed, ref } from 'vue';

const themed = ref(true),
  native = ref(false),
  active = ref(true),
  draft = ref('Native Skeleton draft');
const theme = computed(() =>
  themed.value
    ? {
        components: {
          Skeleton: {
            gradientFromColor: '#dce8ff',
            gradientToColor: '#91b2ff',
            titleHeight: 22,
            blockRadius: 8,
            paragraphMarginTop: 30,
            paragraphLiHeight: 18,
          },
        },
      }
    : undefined,
);
</script>
<template>
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
    <button type="button" @click="themed = !themed">Toggle Skeleton theme</button>
    <button type="button" @click="native = !native">Toggle native Skeleton variable</button>
    <label><input v-model="active" type="checkbox" /> Active</label>
  </div>
  <ConfigProvider :theme="theme">
    <Skeleton avatar :active="active" :style="native ? { '--apollo-skeleton-title-height': '30px' } : undefined" />
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:16px;margin-top:16px">
      <SkeletonAvatar :active="active" />
      <SkeletonButton :active="active" />
      <SkeletonInput :active="active" />
      <SkeletonImage :active="active" />
    </div>
    <SkeletonNode :styles="{ root: { display: 'block', marginTop: '16px' }, content: { width: '100%', minHeight: '70px', padding: '16px', color: themed ? '#172b4d' : undefined } }">
      <label style="display:flex;flex-wrap:wrap;align-items:center;gap:8px">Persistent draft<input v-model="draft" aria-label="Skeleton token draft" style="max-width:100%;width:180px" /></label>
    </SkeletonNode>
  </ConfigProvider>
</template>
