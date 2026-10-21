<script setup lang="ts">
// 对齐 antd 的 load-data demo：isLeaf: false + loadData 异步补全
import type { CascaderBaseOptionType } from '@apollo-design/ui';
import { Cascader } from '@apollo-design/ui';
import { ref } from 'vue';

const options = ref<CascaderBaseOptionType[]>([
  { value: 'zhejiang', label: '浙江', isLeaf: false },
  { value: 'jiangsu', label: '江苏', isLeaf: false },
  { value: 'guangdong', label: '广东', isLeaf: false },
]);

const loadedCount = ref(0);
const allLoaded = ref(false);

const loadData = (selectedOptions: CascaderBaseOptionType[]) => {
  const target = selectedOptions[selectedOptions.length - 1];
  if (!target) return;
  // 已经加载过就不再重复请求（展开/点击父级都会触发 loadData）
  if (Array.isArray(target.children) && target.children.length > 0) return;
  const label = String(target.label ?? '');
  target.loading = true;
  setTimeout(() => {
    target.loading = false;
    target.children = [
      { value: `${String(target.value)}-city-1`, label: `${label}城市一`, isLeaf: true },
      { value: `${String(target.value)}-city-2`, label: `${label}城市二`, isLeaf: true },
    ];
    options.value = [...options.value];
    loadedCount.value += 1;
    allLoaded.value = options.value.every(
      (option) => Array.isArray(option.children) && option.children.length > 0,
    );
  }, 600);
};
</script>

<template>
  <Cascader :options="options" :load-data="loadData" placeholder="点击省份动态加载城市" />
  <p>
    已加载 {{ loadedCount }} 个省份的城市{{ allLoaded ? '（全部完成）' : '，继续点击其它省份' }}
  </p>
</template>
