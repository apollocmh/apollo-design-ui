const n=`<script setup lang="ts">
// 对齐 antd demo/certain-category.tsx

import type { DefaultOptionType } from '@apollo-design/ui';
import { AutoComplete } from '@apollo-design/ui';
import { ref } from 'vue';

const options = ref<DefaultOptionType[]>([]);
const handleSearch = (value: string) => {
  options.value =
    !value || value.includes('@')
      ? []
      : ['gmail.com', '163.com', 'qq.com'].map((domain) => ({
          label: \`\${value}@\${domain}\`,
          value: \`\${value}@\${domain}\`,
        }));
};
<\/script>

<template>
  <AutoComplete
    style="width: 200px"
    :show-search="{ onSearch: handleSearch }"
    placeholder="input here"
    :options="options"
  />
</template>
`;export{n as default};
