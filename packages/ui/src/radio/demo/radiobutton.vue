<script setup lang="ts">
// 对齐 antd 的 radiobutton demo（按钮形态的三态：正常 / 单项禁用 / 整组禁用）
import { Flex, Radio } from '@apollo-design/ui';
</script>

<template>
  <Flex vertical gap="medium">
    <Radio.Group default-value="a">
      <Radio.Button value="a">Hangzhou</Radio.Button>
      <Radio.Button value="b">Shanghai</Radio.Button>
      <Radio.Button value="c">Beijing</Radio.Button>
      <Radio.Button value="d">Chengdu</Radio.Button>
    </Radio.Group>
    <Radio.Group default-value="a">
      <Radio.Button value="a">Hangzhou</Radio.Button>
      <Radio.Button value="b" disabled>Shanghai</Radio.Button>
      <Radio.Button value="c">Beijing</Radio.Button>
      <Radio.Button value="d">Chengdu</Radio.Button>
    </Radio.Group>
    <Radio.Group disabled default-value="a">
      <Radio.Button value="a">Hangzhou</Radio.Button>
      <Radio.Button value="b">Shanghai</Radio.Button>
      <Radio.Button value="c">Beijing</Radio.Button>
      <Radio.Button value="d">Chengdu</Radio.Button>
    </Radio.Group>
  </Flex>
</template>
