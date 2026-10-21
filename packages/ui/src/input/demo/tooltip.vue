<script setup lang="ts">
// 输入提示：Tooltip 包裹 Input，聚焦或悬停时展示说明
import { Input, Tooltip } from '@apollo-design/ui';
</script>

<template>
  <div style="display: flex; flex-direction: column; gap: 16px; width: 360px">
    <Tooltip title="用户名支持 4–16 位字母、数字和下划线" trigger="focus">
      <Input aria-label="用户名" placeholder="聚焦查看输入规则" />
    </Tooltip>

    <Tooltip title="我们会向该邮箱发送确认链接">
      <Input aria-label="邮箱" placeholder="悬停查看提示" />
    </Tooltip>

    <p style="margin: 0; color: #999; font-size: 12px">
      第一个输入框使用 focus 触发，键盘用户也能看到提示；第二个使用默认 hover 触发。
    </p>
  </div>
</template>
