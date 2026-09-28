<script setup lang="ts">
// 对齐 antd demo/style-class.tsx：styles 对象形态 + 函数形态 + classNames + arrow=false
// ⚠️ createStaticStyles(css``) 是 antd-style 的产物，本仓直接用等价的普通对象。
import { Button, Divider, Flex, Space, Tour } from '@apollo-design/ui';
import { ref } from 'vue';

const open = ref(false);
const openFn = ref(false);

const ref1 = ref<{ nativeElement: HTMLButtonElement | HTMLAnchorElement | null } | null>(null);
const ref2 = ref<{ nativeElement: HTMLButtonElement | HTMLAnchorElement | null } | null>(null);
const ref3 = ref<{ nativeElement: HTMLButtonElement | HTMLAnchorElement | null } | null>(null);

const target1 = () => (ref1.value?.nativeElement as HTMLElement) ?? document.body;
const target2 = () => (ref2.value?.nativeElement as HTMLElement) ?? document.body;
const target3 = () => (ref3.value?.nativeElement as HTMLElement) ?? document.body;

const btnProps = {
  nextButtonProps: {
    style: {
      border: '1px solid #CDC1FF',
      color: '#CDC1FF',
    },
  },
  prevButtonProps: {
    style: {
      backgroundColor: '#CDC1FF',
      color: '#fff',
    },
  },
};

const classNames = {
  root: 'tour-demo-root-radius',
  section: 'tour-demo-section-radius',
};

const stylesObject = {
  mask: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  section: {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: '2px solid #4096ff',
  },
  cover: {
    borderRadius: '12px 12px 0 0',
  },
};

const stylesFunction = (info: { props: { type?: string } }) => {
  if (info.props.type === 'primary') {
    return {
      mask: {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      },
      section: {
        backgroundColor: 'rgb(205,193,255, 0.8)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      cover: {
        borderRadius: '12px 12px 0 0',
      },
    };
  }
  return {};
};

const steps = [
  {
    title: 'Upload File',
    description: 'Put your files here.',
    target: target1,
    prevButtonProps: {},
  },
  {
    title: 'Save',
    description: 'Save your changes.',
    target: target2,
  },
  {
    title: 'Other Actions',
    description: 'Click to see other actions.',
    target: target3,
  },
];

const sharedProps = {
  steps,
  classNames,
  arrow: false,
};
</script>

<template>
  <Flex vertical gap="medium">
    <Flex gap="medium">
      <Button type="primary" @click="open = true">Begin Tour Object</Button>
      <Button type="primary" @click="openFn = true">Begin Tour Function</Button>
    </Flex>
    <Divider />
    <Tour
      :steps="sharedProps.steps"
      :class-names="sharedProps.classNames"
      :arrow="false"
      :open="open"
      :styles="stylesObject"
      @close="open = false"
    >
      <template #cover="{ current }">
        <img
          v-if="current === 0"
          alt="tour.png"
          src="https://user-images.githubusercontent.com/5378891/197385811-55df8480-7ff4-44bd-9d43-a7dade598d70.png"
        />
      </template>
    </Tour>
    <Tour
      :steps="steps.map((s) => ({ ...s, ...btnProps }))"
      :class-names="sharedProps.classNames"
      :arrow="false"
      type="primary"
      :open="openFn"
      :styles="stylesFunction"
      @close="openFn = false"
    >
      <template #cover="{ current }">
        <img
          v-if="current === 0"
          alt="tour.png"
          src="https://user-images.githubusercontent.com/5378891/197385811-55df8480-7ff4-44bd-9d43-a7dade598d70.png"
        />
      </template>
    </Tour>
    <Space>
      <Button ref="ref1" type="primary">Upload</Button>
      <Button ref="ref2">Save</Button>
      <Button ref="ref3" type="dashed">Other Actions</Button>
    </Space>
  </Flex>
</template>
