<script setup lang="ts">
import { Button, Space } from '../../index';
</script>

<template>
  <Space wrap>
    <Button type="primary" href="https://example.com">Href</Button>
    <Button href="https://example.com" target="_blank">Href(target=_blank)</Button>
    <Button type="link" href="https://example.com">Link</Button>
  </Space>
</template>
