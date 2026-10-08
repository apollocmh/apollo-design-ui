<script setup lang="ts">
import { Button, Space } from '../../index';
</script>

<template>
  <Space wrap>
    <Button type="primary">Primary</Button>
    <Button type="primary" disabled>Primary(disabled)</Button>
    <Button type="text">Text</Button>
    <Button type="text" disabled>Text(disabled)</Button>
    <Button type="link">Link</Button>
    <Button type="link" disabled>Link(disabled)</Button>
    <Button type="primary" href="https://example.com">Href</Button>
    <Button type="primary" href="https://example.com" disabled>Href(disabled)</Button>
  </Space>
</template>
