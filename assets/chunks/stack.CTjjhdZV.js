const n=`<script setup lang="ts">
// 对齐 antd demo/stack.tsx —— 堆叠折叠（notification **默认就堆叠**，阈值默认 3）
import { Button, Divider, InputNumber, notification, Space, Switch } from '@apollo-design/ui';
import { ref } from 'vue';

const enabled = ref(true);
const threshold = ref(3);

// ⚠️ 本仓 useNotification 接受 getter 形态的配置 ⇒ 开关与阈值改动实时生效
const [api, contextHolder] = notification.useNotification(() => ({
  stack: enabled.value ? { threshold: threshold.value } : false,
}));

const openNotification = () => {
  const count = Math.round(Math.random() * 5) + 1;
  api.open({
    title: 'Notification Title',
    description: Array.from(
      { length: count },
      () => 'This is the content of the notification.',
    ).join('\\n'),
    duration: false,
  });
};
<\/script>

<template>
  <component :is="contextHolder" />
  <Space size="large">
    <Space>
      <span>Enabled: </span>
      <!-- ⚠️ 比 antd 的 demo 多了 aria-label：axe 会为无名的 Switch / InputNumber 报
           button-name / label 违规，而本仓的 L5 要求 demo 零违规（教学内容不受影响） -->
      <Switch v-model:checked="enabled" aria-label="Enable notification stack" />
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
  <Button type="primary" @click="openNotification">Open the notification box</Button>
</template>
`;export{n as default};
