const t=`<script setup lang="ts">
import { Button, Space } from '../../index';
<\/script>

<template>
  <Space wrap>
    <Button type="primary">Primary</Button>
    <Button>Default</Button>
    <Button type="dashed">Dashed</Button>
    <Button type="text">Text</Button>
    <Button type="link">Link</Button>
    <!-- 两个中文字符会自动插入空格（-two-chinese-chars） -->
    <Button type="primary">确定</Button>
  </Space>
</template>
`;export{t as default};
