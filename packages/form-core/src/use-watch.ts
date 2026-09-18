/**
 * `useWatch` —— 订阅表单值的 composable（批次 ③a）。
 *
 * 契约来源：`@rc-component/form@1.8.6/es/hooks/useWatch.js`（95 行）。
 * 逐条对照见 `docs/foundation/form-core-contract.md` §4.7.10 与 §6.4.4。
 *
 * ── ⚠️ 与 React 版的三处**有意差异**（契约 §6.4.5 差异 3 / 5，本文件另有 1 条）──
 *
 * 1. **返回 `Ref` 而不是值** —— Vue 侧要能参与响应式（INTENDED，§6.4.4）。
 * 2. **`useState` → `shallowRef`** —— 与上游一样是「整体替换」而非原地改
 *    （`setValue` 只在 `stringify` 不等时发生，见下）。
 * 3. ⭐ **`dependencies` 在 `setup()` 期被捕获一次，不会重算** ——
 *    上游的 `deps` effect 依赖 `[isValidForm, flattenDeps]`，而 `flattenDeps`
 *    是每次渲染重算的（React 函数组件每次渲染都重跑）。Vue 的 `setup()` 只跑一次
 *    ⇒ 传进来的 `dependencies` 天然是常量。
 *    **实际影响为零**：上游那次重算只会导致「再调一次 `triggerUpdate()`」，
 *    不会重新注册 watcher；而 `dependencies` 是值（路径数组 / 选择器函数），
 *    调用方在 Vue 里本来也只会传一次。已在契约 §6.4.5 登记为差异 8。
 *
 * ── ⚠️ 为什么 `triggerUpdate` 不能在 `setup()` 里同步跑 ────────────────────
 *
 * 上游把它放在 `useEffect` 里 —— **提交之后**才执行，那时子组件（各个 `Field`）
 * 已经注册完毕，`getFieldsValue()` 拿得到真值。若在 setup 期同步跑，
 * 子字段还没 `registerField`，路径型依赖会一律拿到 `undefined`。
 *
 * Vue 的对应时机是 `onMounted`（子组件的 `mounted` 先于父组件）。
 * ⚠️ 但 `useWatch` 也可能在没有组件实例的地方被调用（例如 `effectScope` 里做单测）
 * —— 那时**没有「挂载时机」可言**，退化为同步执行。这个分支是显式的，见文件末尾。
 */

import { warning } from '@apollo-design/utils';
import type { Ref } from 'vue';
import {
  getCurrentInstance,
  getCurrentScope,
  inject,
  onMounted,
  onScopeDispose,
  shallowRef,
} from 'vue';

import { defaultFieldContext, fieldContextKey, HOOK_MARK } from './form-context';
import type {
  FormInstance,
  InternalFormInstance,
  InternalHooks,
  Store,
  WatchDependencies,
  WatchOptions,
} from './form-types';
import { isFormInstance } from './form-util';
import { getNamePath, getValue } from './value-util';

/**
 * 用于「值有没有变」的比较。
 *
 * ⭐ `JSON.stringify` **抛错时返回 `Math.random()`**（上游如此）——
 * 于是「不可序列化的值」永远判定为「不等」，每次都 `setValue`。
 * 这不是 bug，是刻意的兜底：宁可多渲染一次，也不要因为比较不出来而丢掉更新。
 *
 * ⚠️ **类型修正**：上游声明 `stringify(value: any): string | number`，
 * 但 `JSON.stringify(undefined)` / `JSON.stringify(() => {})` / `JSON.stringify(Symbol())`
 * 都返回 `undefined` ⇒ 补上 `| undefined`（与运行时一致，不是放宽断言）。
 */
export function stringify(value: unknown): string | number | undefined {
  try {
    return JSON.stringify(value);
  } catch {
    return Math.random();
  }
}

// biome-ignore lint/suspicious/noExplicitAny: 同 `useForm` —— `Values = any` 是上游公开签名（契约 §6.4.4）。收紧会让 `useWatch('a')` 在未给泛型时无法推导出可用类型。
export function useWatch<Values = any>(
  dependencies: WatchDependencies<Values>,
  ...args: [formOrOptions?: FormInstance<Values> | WatchOptions<FormInstance<Values>>]
): Ref<unknown> {
  const formOrOptions = args[0];

  // 上游：`isFormInstance(_form) ? { form: _form } : _form`。
  // ⚠️ 判别用的是**实例身份**（`_init`），不是「有没有 form 键」。
  const options: WatchOptions<FormInstance<Values>> = isFormInstance(formOrOptions)
    ? { form: formOrOptions as FormInstance<Values> }
    : ((formOrOptions ?? {}) as WatchOptions<FormInstance<Values>>);
  const form = options.form;

  // 初始值：选择器函数先拿空对象试一次；路径型依赖没有「初值」可言 ⇒ undefined。
  const value = shallowRef<unknown>(
    typeof dependencies === 'function'
      ? (dependencies as (values: Store) => unknown)({})
      : undefined,
  );
  const instance = getCurrentInstance();

  // ⚠️ 必须先判实例再 `inject`：Vue 的 `inject` **在实例之外调用时返回 `undefined`
  // 并打一条 dev 告警**（不是返回默认值）。所以「没有实例」这一支直接取默认 Context
  // ——语义上也对：没有实例就没有 provider 链，只能拿到那个「全部告警」的兜底实例。
  const injected = instance ? inject(fieldContextKey, defaultFieldContext) : defaultFieldContext;

  // ⚠️ 这个 `as` 不是掩盖类型问题：`FormStore.getForm()` 产出的对象**确实**带
  // `getInternalHooks`（见 `form-store.ts` 的 `getForm`），但 `FormInstance` 这个
  // **公开**类型刻意不暴露它（用户不该调）。这里要的是内部能力，故按内部类型取用。
  const formInstance = ((form as InternalFormInstance | undefined) ??
    injected) as InternalFormInstance;

  const isValidForm = isFormInstance(formInstance);

  // 上游：`warning(args.length === 2 ? (form ? isValidForm : true) : isValidForm, ...)`。
  // 我们的 `args` 是「`dependencies` 之后的实参」，故 `args.length === 2` ⇒ `args.length >= 1`。
  // ⭐ 用**变参**而不是可选形参，就是为了保住这个 `args.length` 语义：
  //    `useWatch(deps, undefined)` 与 `useWatch(deps)` 在上游是**不同**的（前者不告警）。
  warning(
    args.length >= 1 ? !form || isValidForm : isValidForm,
    'useWatch requires a form instance since it can not auto detect from context.',
  );

  const hooks: InternalHooks | null = isValidForm ? formInstance.getInternalHooks(HOOK_MARK) : null;

  const triggerUpdate = (values?: Store, allValues?: Store): void => {
    // ⭐ `options.preserve` 时优先用 `allValues`（含未注册字段的值）。
    const watchValue = options.preserve
      ? (allValues ?? formInstance.getFieldsValue(true))
      : (values ?? formInstance.getFieldsValue());
    // ⚠️ 两处写法都是必需的，不是风格问题：
    //   1. 选择器分支的 `as`：当 `Values = any` 时 `WatchDependencies<any>` 塌成 `any`，
    //      而 `typeof x === 'function'` 会把 `any` **收窄成 `Function`** —— 而
    //      `Function` 不可调用。这里断言的是「它确实是个选择器」，运行时已由
    //      上面的 `typeof` 判定过。
    //   2. 路径分支的**显式类型实参** `<Values>`：`NamePath<Values>`（深推导）在
    //      **开放泛型**下 TS 无法自行证明它属于 `value-util` 的 `NamePath` 联合
    //      （`DeepNamePath` 是条件类型，对未实例化的 `Values` 是不透明的），
    //      推断会退化成默认的 `never` 而报错。显式给实参即可对上。
    const nextValue =
      typeof dependencies === 'function'
        ? (dependencies as (values: Store) => unknown)(watchValue)
        : getValue(watchValue, getNamePath<Values>(dependencies));

    if (stringify(value.value) !== stringify(nextValue)) {
      value.value = nextValue;
    }
  };

  let cancelRegister: (() => void) | undefined;

  const sync = (): void => {
    if (!hooks) {
      return;
    }
    // ⚠️ 顺序与上游一致：先同步一次当前值（deps effect），再注册（register effect）。
    //    两个 effect 在上游是同一个同步批次里跑的，这里合并成一个函数。
    triggerUpdate();
    cancelRegister = hooks.registerWatch((values, allValues) => {
      triggerUpdate(values, allValues);
    });
  };

  // 清理**先于**挂载登记：即使组件在挂载前就被销毁，也不会漏掉 cancel。
  // 用 `getCurrentScope()` 而不是 `getCurrentInstance()` —— 前者在
  // `effectScope().run(...)` 里也成立（单测就是靠它做清理）。
  if (getCurrentScope()) {
    onScopeDispose(() => {
      cancelRegister?.();
    });
  }

  if (instance) {
    onMounted(sync);
  } else {
    // 没有组件实例 ⇒ 没有「提交后」这个时机，只能立即同步（见文件头）。
    sync();
  }

  return value;
}
