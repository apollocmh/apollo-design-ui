<script setup lang="ts">
// 对齐 antd 的 combination demo（Card / Typography / Button 未落地，用原生元素等价替换，缺口见 README §7）
import { Flex } from '@apollo-design/ui';

const cardStyle = { width: '620px' };
const imgStyle = { display: 'block', width: '273px' };
</script>

<template>
  <div :style="{ ...cardStyle, border: '1px solid #f0f0f0', borderRadius: '8px', overflow: 'hidden' }">
    <Flex justify="space-between">
      <img
        draggable="false"
        alt="avatar"
        src="https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png"
        :style="imgStyle"
      />
      <Flex vertical align="flex-end" justify="space-between" style="padding: 32px">
        <h3 style="margin: 0">“antd is an enterprise-class UI design language and React UI library.”</h3>
        <button type="button">Get Started</button>
      </Flex>
    </Flex>
  </div>
</template>
