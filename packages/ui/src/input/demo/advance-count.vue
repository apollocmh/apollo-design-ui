<script setup lang="ts">
// count.show / count.max / count.strategy / count.exceedFormatter 的进阶用法
import { Input, TextArea } from '@apollo-design/ui';
import { ref } from 'vue';

const basic = ref('');
const chinese = ref('');
const note = ref('');

/** 汉字按 2 个字符计数，其余按 1 个。 */
function countChinese(value: string): number {
  let count = 0;
  for (const char of value) {
    count += /[一-龥]/u.test(char) ? 2 : 1;
  }
  return count;
}

/** 超出 max 时按与 strategy 相同的口径截断（汉字占 2 个名额）。 */
function cutAtMax(value: string, info: { max: number }): string {
  let result = '';
  let count = 0;
  for (const char of value) {
    const size = /[一-龥]/u.test(char) ? 2 : 1;
    if (count + size > info.max) break;
    count += size;
    result += char;
  }
  return result;
}
</script>

<template>
  <div
    style="display: flex; flex-direction: column; gap: 16px; width: 320px; font-family: sans-serif"
  >
    <div>
      <div style="margin-bottom: 6px; font-size: 13px; color: #666">count.show + max</div>
      <Input
        v-model:value="basic"
        :count="{ show: true, max: 10 }"
        placeholder="最多 10 个字符"
      />
    </div>
    <div>
      <div style="margin-bottom: 6px; font-size: 13px; color: #666">
        自定义 strategy：汉字算 2 个字符
      </div>
      <Input
        v-model:value="chinese"
        :count="{ show: true, max: 10, strategy: countChinese, exceedFormatter: cutAtMax }"
        placeholder="汉字算 2 个"
      />
    </div>
    <div>
      <div style="margin-bottom: 6px; font-size: 13px; color: #666">TextArea 同样支持 count</div>
      <TextArea
        v-model:value="note"
        :count="{ show: true, max: 20 }"
        :auto-size="{ minRows: 2, maxRows: 4 }"
        placeholder="最多 20 个字符"
      />
    </div>
  </div>
</template>
