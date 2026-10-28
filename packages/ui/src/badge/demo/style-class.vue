<script setup lang="ts">
import {
  Badge,
  Button,
  ConfigProvider,
  type ConfigProviderThemeConfig,
  Flex,
  Ribbon,
} from '@apollo-design/ui';
import { computed, ref } from 'vue';

const stage = ref(0);
const rtl = ref(false);
const theme = computed<ConfigProviderThemeConfig>(() => {
  const components: NonNullable<ConfigProviderThemeConfig['components']> = {};
  if (stage.value === 1)
    components.Badge = {
      indicatorZIndex: 3,
      indicatorHeight: 28,
      indicatorHeightSM: 18,
      dotSize: 10,
      textFontSize: 15,
      textFontSizeSM: 11,
      textFontWeight: 700,
      statusSize: 10,
      paddingInline: 12,
    };
  else if (stage.value === 2)
    components.Badge = {
      indicatorZIndex: 0,
      indicatorHeight: 0,
      indicatorHeightSM: 0,
      dotSize: 0,
      textFontSize: 0,
      textFontSizeSM: 0,
      textFontWeight: 'normal',
      statusSize: 0,
      paddingInline: 0,
    };
  return { components };
});
</script>

<template>
  <Flex vertical gap="middle">
    <Badge
    :count="5"
    :class-names="{ indicator: 'demo-indicator-cls' }"
    :styles="{ indicator: { backgroundColor: '#52c41a', borderColor: 'transparent', boxShadow: 'none' } }"
  >
    <div style="width: 40px; height: 40px; background: var(--apollo-color-fill-alter); border-radius: 4px; display: inline-flex; align-items: center; justify-content: center" />
    </Badge>
    <Flex gap="small" wrap>
      <Button @click="stage = 1">九个 Token / Nine tokens</Button>
      <Button @click="stage = 2">零值 / Zero</Button>
      <Button @click="stage = 0">恢复默认 / Reset</Button>
      <Button @click="rtl = !rtl">RTL / LTR</Button>
    </Flex>
    <ConfigProvider :theme="theme" :direction="rtl ? 'rtl' : 'ltr'"
      :components="{ badge: { classNames: () => ({ root: `demo-stage-${stage}` }) } }">
      <Flex gap="large" wrap style="padding-block: 12px">
        <Badge :count="15" :style="[{ marginInline: '8px' }, 'padding: 4px']" />
        <Badge :count="15" size="small" />
        <Badge dot />
        <Badge status="processing" text="Processing" />
        <Badge :count="5"><input aria-label="Token and direction draft" placeholder="Draft" style="width: 100px" /></Badge>
        <Badge><template #count><strong>Rich padding</strong></template></Badge>
        <Badge dir="ltr" :count="5"><span>Native LTR</span></Badge>
        <Ribbon dir="ltr" text="Native LTR"><span>Root direction</span></Ribbon>
      </Flex>
    </ConfigProvider>
  </Flex>
</template>
