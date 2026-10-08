const t=`<script setup lang="ts">
import { Button, Space } from '../../index';
<\/script>

<template>
  <Space wrap>
    <Button type="primary" danger>Primary</Button>
    <Button danger>Default</Button>
    <Button type="dashed" danger>Dashed</Button>
    <Button type="text" danger>Text</Button>
    <Button type="link" danger>Link</Button>
  </Space>
</template>
`;export{t as default};
