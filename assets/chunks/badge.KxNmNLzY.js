const t=`<script setup lang="ts">
// 对齐 antd 的 badge demo（Badge 包裹 Radio.Button 的两种方向）
import { Badge, Flex, Radio } from '@apollo-design/ui';
<\/script>

<template>
  <Flex vertical gap="middle" align="start">
    <Radio.Group button-style="solid">
      <Badge :count="1">
        <Radio.Button :value="1">Click Me</Radio.Button>
      </Badge>
      <Badge :count="2">
        <Radio.Button :value="2">Not Me</Radio.Button>
      </Badge>
    </Radio.Group>
    <Radio.Group vertical button-style="solid">
      <Badge :count="1">
        <Radio.Button value="vertical-1">Click Me</Radio.Button>
      </Badge>
      <Badge :count="0">
        <Radio.Button value="vertical-0">Hidden Badge</Radio.Button>
      </Badge>
      <Badge :count="2">
        <Radio.Button value="vertical-2">Not Me</Radio.Button>
      </Badge>
    </Radio.Group>
  </Flex>
</template>
`;export{t as default};
