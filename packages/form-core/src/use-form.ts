/**
 * `useForm` —— 建一个表单实例（批次 ③a）。
 *
 * 契约来源：`@rc-component/form@1.8.6/es/hooks/useForm.js:895-918`。
 * 逐条对照见 `docs/foundation/form-core-contract.md` §4.7.1 与 §6.4.4。
 *
 * ── ⚠️ 为什么 Vue 版**少了 `useRef` 那一层** ────────────────────────────────
 *
 * 上游用 `React.useRef(null)` + `if (!formRef.current)` 保证「同一个组件实例
 * 只建一次 store」—— 因为 React 的函数组件体**每次渲染都重跑**，不守卫就会
 * 每次渲染新建一个 `FormStore`（所有字段状态丢失）。
 *
 * Vue 的 `setup()` **一个实例只跑一次** ⇒ 那句守卫没有对应物，局部常量即单例。
 * 这是 H3 要求的「用 Vue 心智模型重设计」，不是简化。
 *
 * ── ⚠️ `forceRootUpdate` 的落点（契约 §6.4.1 的一处订正）────────────────────
 *
 * 上游是 `useState` 的 `forceUpdate`，作用在**调用 `useForm` 的那个组件**上。
 * Vue 的对应物是同一个实例上的 `$forceUpdate()`。
 *
 * ⚠️ 契约 §6.4.1 的表里曾写「`useForm` 内的 `shallowRef(0)` 版本号」，**那条对
 * `useForm` 不成立**：版本号必须有人**读**才会触发渲染，而 `useForm` 返回的是
 * 普通对象，组件不会因为它的值变化而重渲染。版本号方案属于 `Field` 的
 * renderless 组件（它的 render 函数直接读那个 `shallowRef`）。此处按**可工作的**
 * 方案实现，契约已同步订正。
 *
 * ⚠️ `forceRootUpdate` **只在 `subscribable === false`**（render-props 形态）时
 * 被 `FormStore.notifyObservers` 调用。所以「脱离组件实例调用 `useForm`」的告警
 * 放在**回调体内部**而不是 setup 期 —— 只有真的需要重渲染时才提示，
 * 避免「在模块顶层建实例但只当受控值容器用」的合法场景被噪声打扰。
 */

import { warning } from '@apollo-design/utils';
import { getCurrentInstance } from 'vue';

import { FormStore } from './form-store';
import type { FormInstance } from './form-types';

/**
 * 与上游同构：返回**元组**，便于 `const [form] = useForm()` 直接迁移（§6.4.4）。
 */
// biome-ignore lint/suspicious/noExplicitAny: `Values = any` 是**上游的公开签名**（`useForm<Values = any>`，契约 §6.4.4）。收紧成 `unknown` 会让 `const [form] = useForm()` 后所有 `form.getFieldValue(...)` 都不可用 —— 那是破坏兼容，不是修类型（H10 禁的是用 any **掩盖**问题，不是禁这个默认值）。
export function useForm<Values = any>(form?: FormInstance<Values>): [FormInstance<Values>] {
  const instance = getCurrentInstance();

  // 外部传入的实例：直接用，不建 store（上游同样短路）。
  if (form) {
    return [form];
  }

  const formStore = new FormStore(() => {
    if (instance) {
      instance.proxy?.$forceUpdate();
      return;
    }
    warning(
      false,
      '`useForm` is called outside a component instance, so the form can not force re-render. ' +
        'Call it inside `setup()`, or pass an existing form instance.',
    );
  });

  return [formStore.getForm() as FormInstance<Values>];
}
