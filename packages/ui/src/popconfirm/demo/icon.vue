<script setup lang="ts">
import { QuestionCircleOutlined } from '@apollo-design/icons';
import { Button, Input, Popconfirm, PopconfirmPurePanel } from '@apollo-design/ui';
import { ref } from 'vue';

const show = ref(true);
const empty = ref(false);
const count = ref(0);
</script>

<template>
  <div>
    <p style="display: flex; flex-wrap: wrap; gap: 8px">
      <Button @click="show = !show">Toggle native icon slot</Button>
      <Button @click="empty = !empty">Empty native icon slot</Button>
      <Button @click="count++">Update native icon</Button>
    </p>
    <Popconfirm title="Delete the task" description="Are you sure to delete this task?">
      <Button danger>Delete with native icon</Button>
      <template v-if="show" #icon>
        <template v-if="!empty"><QuestionCircleOutlined style="color: red" /><span>{{ count }}</span></template>
      </template>
    </Popconfirm>
    <PopconfirmPurePanel data-native-icon-panel title="Icon preview" :icon="false">
      <template v-if="show" #icon>
        <template v-if="!empty"><QuestionCircleOutlined style="color: red" /><span data-native-icon-count>{{ count }}</span></template>
      </template>
      <template #description><Input aria-label="Native icon note" /></template>
    </PopconfirmPurePanel>
  </div>
</template>
