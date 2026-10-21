<script setup lang="ts">
// 语义化样式与类：root / content / icon 三个槽位
import { SearchOutlined } from '@apollo-design/icons';
import type { ButtonProps } from '@apollo-design/ui';
import { Button, Space } from '@apollo-design/ui';

const classNames: ButtonProps['classNames'] = {
  root: 'demo-button-style',
  content: 'demo-button-style__content',
  icon: 'demo-button-style__icon',
};

const styles: ButtonProps['styles'] = {
  root: { borderRadius: '18px', paddingInline: '20px' },
  content: { letterSpacing: '1px' },
  icon: { color: '#fa8c16' },
};
</script>

<template>
  <div class="demo-button-style-wrap">
    <Space wrap>
      <Button type="primary" :icon="SearchOutlined" :class-names="classNames" :styles="styles">
        查询
      </Button>
      <Button :class-names="classNames" :styles="styles">默认按钮</Button>
      <Button type="dashed" :class-names="classNames" :styles="styles" disabled>禁用按钮</Button>
    </Space>
    <p class="demo-button-style-wrap__hint">
      root 控制圆角与内边距，content 控制字距，icon 单独着色。
    </p>
  </div>
</template>

<style>
.demo-button-style {
  border-color: #d3adf7;
}

.demo-button-style__content {
  font-weight: 500;
}

.demo-button-style-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.demo-button-style-wrap__hint {
  margin: 0;
  color: #999;
  font-size: 12px;
}
</style>
