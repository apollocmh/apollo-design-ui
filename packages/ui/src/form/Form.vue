<script setup lang="ts" generic="Values = unknown">
/**
 * Form —— 表单容器（**骨架**）。
 *
 * 契约来源：antd 6.6.4 `es/form/Form.js`（188 行）+ `es/form/Form.d.ts`。
 *
 * ⚠️⚠️ **本文件是骨架，不是实现。** 见 `README.md` 的「骨架范围」一节。
 * 它只做两件事：
 *   1. 把 antd 的 props / emits / slots **逐条声明**（类型面）；
 *   2. 渲染容器元素的结构外壳（类名按规则 R6 派生）。
 *
 * ❌ TODO(impl) 清单（落地时要做的全部事）：
 *   - 接入 `@apollo-design/form-core` 的 `useForm` + `Form`（provider）+ `FormProvider`
 *   - `provide(fieldContextKey, formContextValue)` / `provide(listContextKey, null)`
 *   - `formInstance.getInternalHooks(HOOK_MARK)` 的 setCallbacks / setInitialValues /
 *     setValidateMessages / setPreserve / useSubscribe / destroyForm 六个挂钩
 *   - `$attrs` 上的原生 `submit` / `reset` 拦截（见 `interface.ts` 的 TODO(api)）
 *   - `defineExpose` 暴露 `FormRef`（`{ ...formInstance, nativeElement }`）
 *   - ConfigProvider 的 `requiredMark` / `colon` / `labelAlign` / `labelWrap` / `disabled`
 *     / `scrollToFirstError` / `tooltip` / `size` / `variant` 合并
 *   - 语义化 `classNames` / `styles`（`useMergeSemantic`）+ Token + CSS（G3/G4）
 *   - 布局（`layout` / `labelCol` / `wrapperCol`）通过 FormContext 下发给 Form.Item
 */

import { computed } from 'vue';
import { useComponentConfig } from '../config-provider/context';
import type { FormEmits, FormProps, FormSlots } from './interface';

defineOptions({ name: 'AForm', inheritAttrs: false });

const props = withDefaults(defineProps<FormProps<Values>>(), {
  component: 'form',
  layout: 'horizontal',
  requiredMark: undefined,
  colon: undefined,
  labelAlign: undefined,
  labelWrap: undefined,
  labelCol: undefined,
  wrapperCol: undefined,
  form: undefined,
  feedbackIcons: undefined,
  size: undefined,
  disabled: undefined,
  scrollToFirstError: undefined,
  variant: undefined,
  tooltip: undefined,
  classNames: undefined,
  styles: undefined,
  prefixCls: undefined,
  rootClassName: undefined,
});

defineEmits<FormEmits<Values>>();

defineSlots<FormSlots<Values>>();

const { getPrefixCls } = useComponentConfig('form');

const prefixCls = computed(() => getPrefixCls('form', props.prefixCls));

/** ⚠️ `false` ⇒ 不产容器元素（上游 `component === false` 只渲染 children）。 */
const container = computed(() => props.component);

/**
 * 类名（规则 R6：`${prefixCls}` + `${prefixCls}-${layout}`）。
 *
 * ⚠️ TODO(impl)：还缺 `-hide-required-mark` / `-rtl` / `-large` / `-small` / cssVarCls /
 * hashId / 语义化 `classNames.root` / ConfigProvider 的 `className`。骨架只落基础两个，
 * 避免在 Token 与上下文都没就位时**猜**结构。
 */
const formClassName = computed(() => [prefixCls.value, `${prefixCls.value}-${props.layout}`]);
</script>

<template>
  <component :is="container" v-if="container" :class="formClassName" v-bind="$attrs">
    <slot />
  </component>
  <slot v-else />
</template>
