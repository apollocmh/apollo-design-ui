const o=`<script setup lang="ts">
/**
 * \`locale\` —— 语言包。
 *
 * 语言包由 \`@apollo-design/locale\` 提供（73 个，\`import { zh_CN } from '@apollo-design/locale'\`）。
 * \`ConfigProvider\` 会把它包进 \`LocaleProvider\`，下游用 \`useLocale('Empty')\` 读到。
 */
import { zh_CN } from '@apollo-design/locale';
import { ConfigProvider, Empty } from '../../index';
<\/script>

<template>
  <ConfigProvider :locale="zh_CN">
    <Empty />
  </ConfigProvider>
</template>
`;export{o as default};
