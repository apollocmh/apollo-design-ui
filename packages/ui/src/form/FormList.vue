<script setup lang="ts" generic="Values = unknown">
/**
 * Form.List —— 数组字段（**骨架**）。
 *
 * 契约来源：antd 6.6.4 `es/form/FormList.js` + `es/form/FormList.d.ts`，
 * 上游实现是 `@rc-component/form` 的 `List`（143 行，契约 §4.7.11）。
 *
 * ⚠️⚠️ **本文件是骨架，不是实现。**
 *
 * ❌ TODO(impl) 清单：
 *   - 接入 form-core 的 `List`（`prefixName` / `keyManager` / `getKey` 的 ListContext）
 *   - scoped slot 的 `fields` / `operations` / `meta` 三个参数（骨架阶段只声明类型）
 *   - `operations.add` / `remove` / `move` 的 key 管理（`keyManager.id` 单调递增）
 *   - `children` 不是函数时的 dev 告警（上游 `List.js:41-44` 会返回 `null`）
 */

import type { FormListProps, FormListSlots } from './interface';

defineOptions({ name: 'AFormList', inheritAttrs: false });

withDefaults(defineProps<FormListProps<Values>>(), {
  rules: undefined,
  validateTrigger: undefined,
  initialValue: undefined,
  isListField: undefined,
  prefixCls: undefined,
});

defineSlots<FormListSlots<Values>>();
</script>

<template>
  <!-- ⚠️ TODO(impl)：这里**必须**是作用域插槽，参数是
       `(fields, operations, meta)`。骨架阶段直接把默认插槽透出去（不传参），
       是为了让「形状」先立住、不猜实现。 -->
  <slot />
</template>
