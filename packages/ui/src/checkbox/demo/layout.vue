<script setup lang="ts">
// 对齐 antd 的 layout demo
import { Checkbox, Col, Row } from '@apollo-design/ui';
</script>

<template>
  <Checkbox.Group>
    <Row>
      <Col :span="8">
        <Checkbox value="Apple">Apple</Checkbox>
      </Col>
      <Col :span="8">
        <Checkbox value="Pear">Pear</Checkbox>
      </Col>
      <Col :span="8">
        <Checkbox value="Orange">Orange</Checkbox>
      </Col>
    </Row>
  </Checkbox.Group>
</template>
