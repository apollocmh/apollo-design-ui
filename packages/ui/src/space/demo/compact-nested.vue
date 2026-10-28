<script setup lang="ts">
import {
  Button,
  Input,
  InputNumber,
  InputSearch,
  Select,
  Space,
  SpaceCompact,
  TimePicker,
} from '@apollo-design/ui';

const options = [
  { value: 'opt1', label: 'Option 1' },
  { value: 'opt2', label: 'Option 2' },
];
</script>
<template>
  <Space orientation="vertical" style="display: flex">
    <SpaceCompact block>
      <SpaceCompact><SpaceCompact><Input aria-label="Nested query" placeholder="Typing…" style="width: 90px" /><Button type="primary">Search</Button></SpaceCompact><SpaceCompact><InputNumber aria-label="Nested number" :default-value="12" /><Select aria-label="Nested option" :options="options" default-value="opt1" style="width: 110px" /></SpaceCompact></SpaceCompact>
      <Button>Separator</Button>
      <SpaceCompact><SpaceCompact><InputSearch aria-label="Nested search" placeholder="Search" style="width: 170px" /></SpaceCompact><SpaceCompact><Input aria-label="Nested site" default-value="mysite" style="width: 110px" /><Button>Copy</Button></SpaceCompact></SpaceCompact>
    </SpaceCompact>
    <SpaceCompact block><SpaceCompact><TimePicker aria-label="Nested time" /><Button type="primary">Submit</Button></SpaceCompact><Button>~</Button><Button>~</Button><SpaceCompact><Select aria-label="Nested address" :options="options" default-value="opt1" style="width: 130px" /><Button type="primary">Submit</Button></SpaceCompact></SpaceCompact>
    <SpaceCompact><Button v-for="i in 4" :key="i" type="primary">Button {{ i }}</Button></SpaceCompact>
  </Space>
</template>
