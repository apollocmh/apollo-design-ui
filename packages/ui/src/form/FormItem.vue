<script setup lang="ts" generic="Values = unknown">
/**
 * Form.Item —— 字段项（**骨架**）。
 *
 * 契约来源：antd 6.6.4 `es/form/FormItem/index.js` + `es/form/FormItem/index.d.ts`。
 *
 * ⚠️⚠️ **本文件是骨架，不是实现。** 见 `README.md` 的「骨架范围」一节。
 * 它只做两件事：
 *   1. 把 antd 的 props / slots **逐条声明**（类型面，含 `FieldProps` 的继承）；
 *   2. 渲染 `noStyle` 分支的结构外壳。
 *
 * ❌ TODO(impl) 清单：
 *   - 用 form-core 的 `Field` 包一层（scoped slot 拿 `control` / `meta` / `form`）
 *   - `meta` → `validateStatus` / `help` / `errors` / `warnings` / `hasFeedback` 的映射
 *   - `label` / `labelCol` / `colon` / `requiredMark` / `tooltip` 的标签布局
 *   - `extra` / `help` 的渲染与 `aria-describedby` / `aria-invalid` / `aria-required`
 *   - `noStyle` 的错误上抛（antd 的 `NoStyleItemContext`）
 *   - `Form.List` 的 `getKey` 与 `fieldKeyPathRef`
 *   - `useItemRef` / `fieldId` 生成（`getFieldId`）
 *   - Token + CSS（G3/G4）、demo、文档、测试
 */

import { computed } from 'vue';
import { useComponentConfig } from '../config-provider/context';
import type { FormItemProps, FormItemSlots } from './interface';

defineOptions({ name: 'AFormItem', inheritAttrs: false });

/**
 * ⚠️⚠️ **下面这些 `undefined` 默认值不是冗余的，删掉会静默改变行为。**
 *
 * 两条独立的平台机制（`PITFALLS.md` 第 46 条 / `COMPATIBILITY.md` D21）：
 *
 * 1. **Boolean prop 转换**：只要 prop 的运行时类型含 `Boolean` 且调用方没传、
 *    又没有 `default`，Vue 就把它赋成 `false`。本组件里有 **11 个**这样的 prop
 *    （`required` / `shouldUpdate` / `validateFirst` / `validateTrigger` /
 *    `preserve` / `isListField` / `isList` / `hasFeedback` / `colon` / `name` / `tooltip`）。
 *    症状：`required` 由 `undefined` 变 `false` ⇒ 「从 rules 自动推断必填」整条失效；
 *    `preserve` 变 `false` ⇒ 卸载时字段值被清空。
 * 2. **`VNodeChild` 含 `boolean`**：`label` / `extra` / `help` / `tooltip` 的运行时类型
 *    经 SFC 编译器解析后含 `Boolean` ⇒ 同上。
 *
 * 声明 `default`（哪怕值是 `undefined`）会让 Vue 走 `hasDefault` 分支、跳过转换。
 */
const props = withDefaults(defineProps<FormItemProps<Values>>(), {
  // ---- ui 层 ----
  noStyle: false,
  hidden: false,
  hasFeedback: undefined,
  validateStatus: undefined,
  // ⭐ `required` 必须保持 `undefined`：antd 的判据是
  //    `required !== undefined ? required : rules?.some(r => r.required)`。
  required: undefined,
  initialValue: undefined,
  layout: undefined,
  colon: undefined,
  label: undefined,
  labelAlign: undefined,
  labelCol: undefined,
  tooltip: undefined,
  wrapperCol: undefined,
  extra: undefined,
  status: undefined,
  help: undefined,
  fieldId: undefined,
  id: undefined,
  prefixCls: undefined,
  rootClassName: undefined,
  className: undefined,
  style: undefined,
  // ---- 继承自 form-core 的 FieldProps（含 Boolean 的都要显式 undefined）----
  name: undefined,
  dependencies: undefined,
  shouldUpdate: undefined,
  validateTrigger: undefined,
  validateFirst: undefined,
  validateDebounce: undefined,
  preserve: undefined,
  isListField: undefined,
  isList: undefined,
  rules: undefined,
  trigger: undefined,
  valuePropName: undefined,
  getValueProps: undefined,
  getValueFromEvent: undefined,
  normalize: undefined,
  messageVariables: undefined,
  onReset: undefined,
  onMetaChange: undefined,
});

defineSlots<FormItemSlots>();

const { getPrefixCls } = useComponentConfig('form');

const prefixCls = computed(() => getPrefixCls('form', props.prefixCls));

/**
 * 类名（规则 R6）。
 *
 * ⚠️ TODO(impl)：antd 的 FormItem 类名由 `ItemHolder` 产出
 * （`${prefixCls}-item` / `-item-with-help` / `-item-control` / `-item-control-input` …），
 * 且与 `hasFeedback` / `validateStatus` / `layout` / `noStyle` 联动。
 * 骨架只落根类名，**不猜**完整结构。
 */
const itemClassName = computed(() => `${prefixCls.value}-item`);
</script>

<template>
  <!-- ⚠️ TODO(impl)：`noStyle` 分支目前**丢弃 `$attrs`**（多根 + 无宿主元素时
       必须显式决定落点，见规则 R3）。antd 的 `noStyle` 会把 attrs 交给
       `StatusProvider` 包裹的子节点 —— 落地时按它的真实行为决定。 -->
  <slot v-if="noStyle" />
  <div v-else :class="itemClassName" :style="style" v-bind="$attrs">
    <slot />
  </div>
</template>
