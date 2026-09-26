<script setup lang="ts">
// 对齐 antd demo/placement.tsx —— 六个方位
import {
  BorderBottomOutlined,
  BorderTopOutlined,
  RadiusBottomleftOutlined,
  RadiusBottomrightOutlined,
  RadiusUpleftOutlined,
  RadiusUprightOutlined,
} from '@apollo-design/icons';
import type { NotificationPlacement } from '@apollo-design/ui';
import { Button, Divider, notification, Space } from '@apollo-design/ui';

const [api, contextHolder] = notification.useNotification();

const openNotification = (placement: NotificationPlacement) => {
  api.info({
    title: `Notification ${placement}`,
    description:
      'This is the content of the notification. This is the content of the notification. This is the content of the notification.',
    placement,
  });
};
</script>

<template>
  <component :is="contextHolder" />
  <Space>
    <Button type="primary" :icon="BorderTopOutlined" @click="openNotification('top')">top</Button>
    <Button type="primary" :icon="BorderBottomOutlined" @click="openNotification('bottom')">
      bottom
    </Button>
  </Space>
  <Divider />
  <Space>
    <Button type="primary" :icon="RadiusUpleftOutlined" @click="openNotification('topLeft')">
      topLeft
    </Button>
    <Button type="primary" :icon="RadiusUprightOutlined" @click="openNotification('topRight')">
      topRight
    </Button>
  </Space>
  <Divider />
  <Space>
    <Button type="primary" :icon="RadiusBottomleftOutlined" @click="openNotification('bottomLeft')">
      bottomLeft
    </Button>
    <Button
      type="primary"
      :icon="RadiusBottomrightOutlined"
      @click="openNotification('bottomRight')"
    >
      bottomRight
    </Button>
  </Space>
</template>
