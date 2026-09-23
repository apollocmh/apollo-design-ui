<script setup lang="ts">
// 对齐 antd 的 radiobutton-solid demo
import { Flex, Radio } from '@apollo-design/ui';
</script>

<template>
  <Flex vertical gap="medium">
    <Radio.Group default-value="a" button-style="solid">
      <Radio.Button value="a">Hangzhou</Radio.Button>
      <Radio.Button value="b">Shanghai</Radio.Button>
      <Radio.Button value="c">Beijing</Radio.Button>
      <Radio.Button value="d">Chengdu</Radio.Button>
    </Radio.Group>
    <Radio.Group default-value="c" button-style="solid">
      <Radio.Button value="a">Hangzhou</Radio.Button>
      <Radio.Button value="b" disabled>Shanghai</Radio.Button>
      <Radio.Button value="c">Beijing</Radio.Button>
      <Radio.Button value="d">Chengdu</Radio.Button>
    </Radio.Group>
  </Flex>
</template>
