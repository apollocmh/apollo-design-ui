<script setup lang="ts">
// 对齐 antd demo/custom-dropdown.tsx。C8-R2：popupRender 走 `#popupRender="{ originNode }"` 插槽。
import { Button, Dropdown } from '@apollo-design/ui';
</script>

<template>
  <Dropdown>
    <template #popupRender="{ originNode }">
      <div style="padding: 8px; width: 200px">
        <component :is="originNode" />
        <div style="border-top: 1px solid var(--apollo-color-border-secondary); padding-top: 8px; margin-top: 4px">
          This is a custom dropdown content.
        </div>
      </div>
    </template>
    <Button type="link">
      Hover me
    </Button>
  </Dropdown>
</template>
