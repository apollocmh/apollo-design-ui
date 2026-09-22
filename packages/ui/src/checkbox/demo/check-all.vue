<script setup lang="ts">
// 对齐 antd 的 check-all demo
import { Checkbox, Divider } from '@apollo-design/ui';
import { computed, ref } from 'vue';

const plainOptions = ['Apple', 'Pear', 'Orange'];
const checkedList = ref<string[]>(['Apple', 'Orange']);

const checkAll = computed(() => plainOptions.length === checkedList.value.length);
const indeterminate = computed(
  () => checkedList.value.length > 0 && checkedList.value.length < plainOptions.length,
);

const onCheckAllChange = (e: { target: { checked: boolean } }) => {
  checkedList.value = e.target.checked ? [...plainOptions] : [];
};
</script>

<template>
  <div>
    <Checkbox :indeterminate="indeterminate" :checked="checkAll" @change="onCheckAllChange">
      Check all
    </Checkbox>
    <Divider />
    <Checkbox.Group v-model:value="checkedList" :options="plainOptions" />
  </div>
</template>
