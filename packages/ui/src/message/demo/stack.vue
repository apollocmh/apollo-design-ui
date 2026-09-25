<script setup lang="ts">
// 对齐 antd demo/stack.tsx —— 堆叠配置（默认关闭；threshold 决定折叠阈值）
// ⚠️ 本仓 useMessage 接受 getter 形态的配置 ⇒ 开关与阈值改动能实时生效
import { Button, Divider, InputNumber, message, Space, Switch } from '@apollo-design/ui';
import { ref } from 'vue';

const enabled = ref(true);
const threshold = ref(3);
const index = ref(0);

const [messageApi, contextHolder] = message.useMessage(() => ({
  stack: enabled.value ? { threshold: threshold.value } : false,
}));

const openMessage = () => {
  index.value += 1;
  const isOdd = index.value % 2 === 1;
  messageApi.open({
    type: 'info',
    content: isOdd
      ? `Message ${index.value}: This is a stacked message.`
      : `Message ${index.value}: This is a slightly longer stacked message.`,
    duration: 0,
  });
};
</script>

<template>
  <component :is="contextHolder" />
  <Space size="large">
    <Space>
      <span>Enabled: </span>
      <Switch v-model:checked="enabled" aria-label="Enable message stack" />
    </Space>
    <Space>
      <span>Threshold: </span>
      <InputNumber
        v-model:value="threshold"
        aria-label="Stack threshold"
        :disabled="!enabled"
        :step="1"
        :min="1"
        :max="10"
      />
    </Space>
  </Space>
  <Divider />
  <Space>
    <Button type="primary" @click="openMessage">Open the message box</Button>
    <Button @click="messageApi.destroy()">Destroy all</Button>
  </Space>
</template>
