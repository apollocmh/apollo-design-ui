<script setup lang="ts">
// 对齐 antd 的 dynamic demo。
import { Avatar, Button } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const UserList = ['U', 'Lucy', 'Tom', 'Edward'];
const ColorList = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae'];
const GapList = [4, 3, 2, 1];

const index = ref(0);
const gapIndex = ref(0);

const user = computed(() => UserList[index.value]);
const color = computed(() => ColorList[index.value]);
const gap = computed(() => GapList[gapIndex.value]);

const changeUser = () => {
  index.value = (index.value + 1) % UserList.length;
};
const changeGap = () => {
  gapIndex.value = (gapIndex.value + 1) % GapList.length;
};
</script>

<template>
  <Avatar :style="{ backgroundColor: color, verticalAlign: 'middle' }" size="large" :gap="gap">
    {{ user }}
  </Avatar>
  <Button
    size="small"
    :style="{ margin: '0 16px', verticalAlign: 'middle' }"
    @click="changeUser"
  >
    ChangeUser
  </Button>
  <Button size="small" :style="{ verticalAlign: 'middle' }" @click="changeGap">changeGap</Button>
</template>
