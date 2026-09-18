/**
 * `Field` —— 字段编排（批次 ③b）。
 *
 * 契约来源：`@rc-component/form@1.8.6/es/Field.js`（603 行）。
 * 逐条对照见 `docs/foundation/form-core-contract.md` §4.7.7 与 §4.7.8.1。
 *
 * ── ⚠️ 本文件**没有 Oracle**（契约 §7.0.1）────────────────────────────────────
 *
 * 上游 `Field extends React.PureComponent`，绑在 React 的渲染生命周期上
 * （`forceUpdate` / `setState` / `cloneElement` / `componentDidMount`）。
 * 期望值全部来自**读上游源码 + 行为测试**，每条都标了行号。
 *
 * ── 两层结构：`FieldController`（状态与编排）+ `Field`（renderless 组件）──────
 *
 * | 上游 `Field`（class 组件） | 我们 |
 * |---|---|
 * | `forceUpdate()` | 组件的 `shallowRef` 版本号，渲染函数读它（**有人读才成立**） |
 * | `setState({resetCount})` | 组件的 `ref` + 渲染时包一层 **keyed `Fragment`** |
 * | `cloneElement(child, control)` | **scoped slot** `default(control, meta, form)` |
 * | `constructor` 的 `initEntityValue` | `setup()` 里调（Vue setup 只跑一次，早于 mount） |
 * | `componentDidMount` / `componentWillUnmount` | `onMounted` / `onUnmounted` |
 * | `WrapperField`（函数组件，读两个 Context） | 合并进 `setup()`（Vue 没有"函数体每次重跑"） |
 *
 * ⚠️ 三处**有意差异**（契约 §6.4.5）：
 * 1. **不做 `cloneElement`**（差异 2）—— 受控 props 由消费方 `v-bind="control"` 注入；
 * 2. **`refresh()` 用 keyed `Fragment`**（差异 11）—— 上游改 Fragment 的 `key`，
 *    我们让同一个 `resetCount` 当 Fragment 的 key，效果一致；
 * 3. **Boolean prop 显式 `default: undefined`**（差异 12 / `PITFALLS.md` 46）——
 *    `preserve` / `isListField` / `isList` / `validateTrigger` 的「未传」必须是 `undefined`
 *    而不是 `false`，否则字段级会覆盖表单级。
 */

import { isEqual, warning } from '@apollo-design/utils';
import type { PropType, VNodeChild } from 'vue';
import { defineComponent, Fragment, h, inject, onMounted, onUnmounted, ref, shallowRef } from 'vue';

import delayFrame from './delay-frame';
import { defaultFieldContext, fieldContextKey, HOOK_MARK, listContextKey } from './form-context';
import type {
  ChildProps,
  EventArgs,
  FieldCancelRegister,
  FieldEntity,
  FieldEntityProps,
  FieldMessage,
  FormInstance,
  FormRule,
  InternalFieldProps,
  InternalFormInstance,
  InternalNamePath,
  InternalValidateOptions,
  Meta,
  MetaEvent,
  NamePath,
  RuleError,
  RuleObject,
  ShouldUpdate,
  Store,
  StoreValue,
  ValuedNotifyInfo,
} from './form-types';
import { validateRules } from './validate-util';
import {
  containsNamePath,
  defaultGetValueFromEvent,
  getNamePath,
  getValue,
  toArray as toNamePathArray,
} from './value-util';

/** 全字段共享的空数组（上游 `Field.js:10-11`）。 */
const EMPTY_ERRORS: FieldMessage[] = [];
const EMPTY_WARNINGS: FieldMessage[] = [];

/**
 * 上游 `Field.js:12-19` 的 `requireUpdate`。
 *
 * `shouldUpdate` 是函数时用它判断，否则退回「值引用是否变了」。
 * ⚠️ `info` 上有 `source` 时才把它包成对象传给用户回调（上游的 `'source' in info`）。
 */
function requireUpdate(
  shouldUpdate: ShouldUpdate | undefined,
  prev: Store,
  next: Store,
  prevValue: StoreValue,
  nextValue: StoreValue,
  info: ValuedNotifyInfo,
): boolean {
  if (typeof shouldUpdate === 'function') {
    return shouldUpdate(prev, next, 'source' in info ? { source: info.source } : {});
  }
  return prevValue !== nextValue;
}

/** `FieldController` 与 Vue 组件之间的接口（组件提供响应式与生命周期，controller 提供状态）。 */
interface FieldControllerOptions {
  /** store 读的那几个 prop（`FieldEntity.props`）。 */
  entityProps: FieldEntityProps;
  /** 归一后的路径（**未加** `prefixName`，即上游 `WrapperField` 传下来的 `name`）。 */
  rawNamePath: () => InternalNamePath | undefined;
  /** 注入的 `FieldContext`（找不到时是「全部告警」的兜底实例）。 */
  fieldContext: () => InternalFormInstance;
  /** 当前 props 的只读快照（`trigger` / `valuePropName` 已填默认值）。 */
  props: () => InternalFieldProps;
  /** 求值 `rules` —— `RuleRender` 在这里被调用（`Field.js:115-126`）。 */
  getRules: () => RuleObject[];
  /** 触发一次重渲染（bump 版本号）。 */
  forceRender: () => void;
  /** 清空子节点（bump `resetCount`）。 */
  forceRefresh: () => void;
}

/**
 * 字段状态与编排 —— 上游 `Field` class 的**非渲染**部分。
 *
 * ⚠️ 它**不是** React 组件，也不含 JSX：所有渲染相关的事都交给 `Field` 组件
 * （版本号、keyed Fragment、scoped slot）。这是 H3 要求的「Vue 心智模型」，
 * 而不是把 `PureComponent` 逐行翻译成 Vue 组件。
 */
class FieldController implements FieldEntity {
  touched = false;

  dirty = false;

  /** ⚠️ 三态：`undefined`（从未校验）/ `null`（校验过且已结束）/ `Promise`（进行中）。 */
  validatePromise: Promise<unknown> | null | undefined;

  prevValidating: boolean | undefined;

  errors: FieldMessage[] = EMPTY_ERRORS;

  warnings: FieldMessage[] = EMPTY_WARNINGS;

  mounted = false;

  cancelRegisterFunc: FieldCancelRegister | null = null;

  private metaCache: MetaEvent | null = null;

  constructor(private readonly opts: FieldControllerOptions) {}

  /**
   * `FieldEntity.props` —— 直接暴露给 store 的那个只读视图。
   * ⚠️ 必须是 **getter**：`props` 在 Vue 侧是响应式代理，快照会丢掉后续变化
   * （例如 `useWatch` 动态改的 `rules`）。
   */
  get props(): FieldEntityProps {
    return this.opts.entityProps;
  }

  // ================================== Utils ==================================

  getNamePath = (): InternalNamePath => {
    const raw = this.opts.rawNamePath();
    if (raw === undefined) {
      return [];
    }
    const { prefixName = [] } = this.opts.fieldContext();
    return [...prefixName, ...raw];
  };

  getRules = (): RuleObject[] => this.opts.getRules();

  reRender(): void {
    if (!this.mounted) return;
    this.opts.forceRender();
  }

  refresh = (): void => {
    if (!this.mounted) return;
    this.opts.forceRefresh();
  };

  triggerMetaEvent = (destroy?: boolean): void => {
    const { onMetaChange } = this.opts.props();
    if (onMetaChange) {
      const meta: MetaEvent = { ...this.getMeta(), destroy };
      if (!isEqual(this.metaCache, meta)) {
        onMetaChange(meta);
      }
      this.metaCache = meta;
    } else {
      this.metaCache = null;
    }
  };

  // ========================= Field Entity Interfaces =========================

  onStoreChange = (
    prevStore: Store,
    namePathList: InternalNamePath[] | null,
    info: ValuedNotifyInfo,
  ): void => {
    const { shouldUpdate, dependencies = [], onReset } = this.opts.props();
    const { store } = info;
    const namePath = this.getNamePath();
    const prevValue = this.getValue(prevStore);
    const curValue = this.getValue(store);
    const namePathMatch = namePathList && containsNamePath(namePathList, namePath);

    // `setFieldsValue` is a quick access to update related status
    if (
      info.type === 'valueUpdate' &&
      info.source === 'external' &&
      !isEqual(prevValue, curValue)
    ) {
      this.touched = true;
      this.dirty = true;
      this.validatePromise = null;
      this.errors = EMPTY_ERRORS;
      this.warnings = EMPTY_WARNINGS;
      this.triggerMetaEvent();
    }
    switch (info.type) {
      case 'reset':
        if (!namePathList || namePathMatch) {
          // Clean up state
          this.touched = false;
          this.dirty = false;
          this.validatePromise = undefined;
          this.errors = EMPTY_ERRORS;
          this.warnings = EMPTY_WARNINGS;
          this.triggerMetaEvent();
          onReset?.();
          this.refresh();
          return;
        }
        break;

      /**
       * In case field with `preserve = false` nest deps like:
       * - A = 1 => show B
       * - B = 1 => show C
       * - Reset A, need clean B, C
       */
      case 'remove': {
        if (
          shouldUpdate &&
          requireUpdate(shouldUpdate, prevStore, store, prevValue, curValue, info)
        ) {
          this.reRender();
          return;
        }
        break;
      }
      case 'setField': {
        const { data } = info;
        if (namePathMatch) {
          if ('touched' in data) {
            this.touched = Boolean(data.touched);
          }
          if ('validating' in data && !('originRCField' in data)) {
            this.validatePromise = data.validating ? Promise.resolve([]) : null;
          }
          if ('errors' in data) {
            this.errors = (data.errors as FieldMessage[] | undefined) || EMPTY_ERRORS;
          }
          if ('warnings' in data) {
            this.warnings = (data.warnings as FieldMessage[] | undefined) || EMPTY_WARNINGS;
          }
          this.dirty = true;
          this.triggerMetaEvent();
          this.reRender();
          return;
        }
        if ('value' in data && containsNamePath(namePathList, namePath, true)) {
          // Contains path with value should also check
          this.reRender();
          return;
        }

        // Handle update by `setField` with `shouldUpdate`
        if (
          shouldUpdate &&
          !namePath.length &&
          requireUpdate(shouldUpdate, prevStore, store, prevValue, curValue, info)
        ) {
          this.reRender();
          return;
        }
        break;
      }
      case 'dependenciesUpdate': {
        /**
         * Trigger when marked `dependencies` updated. Related fields will all update
         */
        const dependencyList = dependencies.map((dependency) => getNamePath(dependency));
        // No need for `namePathMatch` check and `shouldUpdate` check, since `valueUpdate` will be
        // emitted earlier and they will work there
        // If set it may cause unnecessary twice rerendering
        if (dependencyList.some((dependency) => containsNamePath(info.relatedFields, dependency))) {
          this.reRender();
          return;
        }
        break;
      }
      default: {
        // 1. If `namePath` exists in `namePathList`, means it's related value and should update
        //      For example <List name="list"><Field name={['list', 0]}></List>
        //      If `namePathList` is [['list']] (List value update), Field should be updated
        //      If `namePathList` is [['list', 0]] (Field value update), List shouldn't be updated
        // 2.
        //   2.1 If `dependencies` is set, `name` is not set and `shouldUpdate` is not set,
        //       don't use `shouldUpdate`. `dependencies` is view as a shortcut if `shouldUpdate`
        //       is not provided
        //   2.2 If `shouldUpdate` provided, use customize logic to update the field
        //       else to check if value changed
        if (
          namePathMatch ||
          ((!dependencies.length || namePath.length || shouldUpdate) &&
            requireUpdate(shouldUpdate, prevStore, store, prevValue, curValue, info))
        ) {
          this.reRender();
          return;
        }
        break;
      }
    }
    if (shouldUpdate === true) {
      this.reRender();
    }
  };

  validateRules = (options?: InternalValidateOptions): Promise<RuleError[]> => {
    // We should fixed namePath & value to avoid developer change then by form function
    const namePath = this.getNamePath();
    const currentValue = this.getValue();
    const { triggerName, validateOnly = false, delayFrame: showDelayFrame } = options || {};

    // Force change to async to avoid rule OOD under renderProps field
    const rootPromise = Promise.resolve().then(async (): Promise<RuleError[]> => {
      if (!this.mounted) {
        return [];
      }
      const { validateFirst = false, messageVariables, validateDebounce } = this.opts.props();

      // Should wait for the frame render,
      // since developer may `useWatch` value in the rules.
      if (showDelayFrame) {
        await delayFrame();
      }

      // Start validate
      let filteredRules = this.getRules();
      if (triggerName) {
        filteredRules = filteredRules
          .filter((rule) => rule)
          .filter((rule) => {
            const { validateTrigger } = rule;
            if (!validateTrigger) {
              return true;
            }
            const triggerList = toNamePathArray(validateTrigger) as string[];
            return triggerList.includes(triggerName);
          });
      }

      // Wait for debounce. Skip if no `triggerName` since its from `validateFields / submit`
      if (validateDebounce && triggerName) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, validateDebounce);
        });

        // Skip since out of date
        if (this.validatePromise !== rootPromise) {
          return [];
        }
      }
      const promise = validateRules(
        namePath,
        currentValue,
        filteredRules,
        options ?? {},
        validateFirst,
        messageVariables,
      );
      promise
        .catch((e) => e)
        .then((ruleErrors: RuleError[] = EMPTY_ERRORS as unknown as RuleError[]) => {
          if (this.validatePromise === rootPromise) {
            this.validatePromise = null;

            // Get errors & warnings
            const nextErrors: FieldMessage[] = [];
            const nextWarnings: FieldMessage[] = [];
            ruleErrors?.forEach?.(({ rule: { warningOnly }, errors = EMPTY_ERRORS }) => {
              if (warningOnly) {
                nextWarnings.push(...(errors as FieldMessage[]));
              } else {
                nextErrors.push(...(errors as FieldMessage[]));
              }
            });
            this.errors = nextErrors;
            this.warnings = nextWarnings;
            this.triggerMetaEvent();
            this.reRender();
          }
        });
      return promise;
    });
    if (validateOnly) {
      return rootPromise;
    }
    this.validatePromise = rootPromise;
    this.dirty = true;
    this.errors = EMPTY_ERRORS;
    this.warnings = EMPTY_WARNINGS;
    this.triggerMetaEvent();

    // Force trigger re-render since we need sync renderProps with new meta
    this.reRender();
    return rootPromise;
  };

  isFieldValidating = (): boolean => !!this.validatePromise;

  isFieldTouched = (): boolean => this.touched;

  isFieldDirty = (): boolean => {
    // Touched or validate or has initialValue
    if (this.dirty || this.opts.props().initialValue !== undefined) {
      return true;
    }

    // Form set initialValue
    const { getInitialValue } = this.opts.fieldContext().getInternalHooks(HOOK_MARK) ?? {};
    if (getInitialValue && getInitialValue(this.getNamePath()) !== undefined) {
      return true;
    }
    return false;
  };

  getErrors = (): FieldMessage[] => this.errors;

  getWarnings = (): FieldMessage[] => this.warnings;

  isListField = (): boolean => Boolean(this.opts.props().isListField);

  isList = (): boolean => Boolean(this.opts.props().isList);

  /**
   * ⚠️ **不能** `Boolean(...)` —— `undefined` 与 `false` 在 `FormStore.isMergedPreserve`
   * 里语义不同（前者表示「用表单级 `preserve`」）。见 `form-types.ts` 的声明订正。
   */
  isPreserve = (): boolean | undefined => this.opts.props().preserve;

  // ============================= Child Component =============================

  getMeta = (): Meta => {
    // Make error & validating in cache to save perf
    this.prevValidating = this.isFieldValidating();
    return {
      touched: this.isFieldTouched(),
      validating: this.prevValidating,
      errors: this.errors,
      warnings: this.warnings,
      name: this.getNamePath(),
      validated: this.validatePromise === null,
    };
  };

  // ============================== Field Control ==============================

  getValue = (store?: Store): StoreValue => {
    const { getFieldsValue } = this.opts.fieldContext();
    const namePath = this.getNamePath();
    return getValue(store || getFieldsValue(true), namePath);
  };

  /**
   * 把受控 props 交给消费方（上游 `Field.js:458-550` 的 `getControlled`）。
   *
   * ⚠️ **有意差异（Vue-native）**：上游的形参 `childProps` 是**子元素的原始 props**，
   * 它来自 `cloneElement(child, control)` 那一步 —— 用于把子元素自己写的
   * `onChange` 包在 store 更新**之后**再调一次。
   *
   * Vue 侧没有 `cloneElement`（差异 2），子元素由消费方自己渲染，`Field` 看不到它的 props
   * ⇒ 那个形参**没有对应物**，删掉（保留就是永不可达的死代码）。
   *
   * 「子元素自己的 handler 也要跑」这条语义由 Vue 原生提供：
   * `<Input v-bind="control" @change="mine" />` 会被编译器展开成
   * `mergeProps(control, { onChange: mine })`，而 Vue 的 `mergeProps` 对 `onXxx`
   * 做的是**串接**（`[].concat(existing, incoming)`）—— 两个 handler 都会跑。
   * `ui` 层若用 `cloneVNode(child, control)` 注入，同样会串接。
   */
  getControlled = (): ChildProps => {
    const {
      name,
      trigger = 'onChange',
      validateTrigger,
      getValueFromEvent,
      normalize,
      valuePropName = 'value',
      getValueProps,
    } = this.opts.props();
    const fieldContext = this.opts.fieldContext();
    const mergedValidateTrigger =
      validateTrigger !== undefined ? validateTrigger : fieldContext.validateTrigger;
    const namePath = this.getNamePath();
    const { getInternalHooks, getFieldsValue } = fieldContext;
    const hooks = getInternalHooks(HOOK_MARK);
    const value = this.getValue();
    const mergedGetValueProps = getValueProps || ((val: StoreValue) => ({ [valuePropName]: val }));
    const valueProps = name !== undefined ? mergedGetValueProps(value) : {};

    // warning when prop value is function
    Object.keys(valueProps).forEach((key) => {
      warning(
        typeof valueProps[key] !== 'function',
        `It's not recommended to generate dynamic function prop by \`getValueProps\`. Please pass it to child component directly (prop: ${key})`,
      );
    });
    const control: ChildProps = {
      ...valueProps,
    };

    // Add trigger
    control[trigger] = (...args: EventArgs) => {
      // Mark as touched
      this.touched = true;
      this.dirty = true;
      this.triggerMetaEvent();
      const curValue = this.getValue();
      let newValue: StoreValue;
      if (getValueFromEvent) {
        newValue = getValueFromEvent(...args);
      } else {
        newValue = defaultGetValueFromEvent(valuePropName, ...args);
      }
      if (normalize) {
        newValue = normalize(newValue, curValue, getFieldsValue(true) as Store);
      }
      if (newValue !== curValue) {
        hooks?.dispatch({
          type: 'updateValue',
          namePath,
          value: newValue,
        });
      }
    };

    // Add validateTrigger
    // ⚠️ `toArray` 返回 `(string | number)[]`，但上游的 `validateTrigger` 只可能是字符串
    //    （类型就是 `string | string[] | false`）⇒ 收窄成 `string[]`，省掉每次 `String()`。
    const validateTriggerList = toNamePathArray(mergedValidateTrigger || []) as string[];
    validateTriggerList.forEach((triggerName) => {
      // Wrap additional function of component, so that we can get latest value from store
      const originTrigger = control[triggerName];
      control[triggerName] = (...args: EventArgs) => {
        if (originTrigger) {
          (originTrigger as (...a: EventArgs) => void)(...args);
        }

        // Always use latest rules
        const { rules } = this.opts.props();
        if (rules && rules.length) {
          // We dispatch validate to root,
          // since it will update related data with other field with same name
          hooks?.dispatch({
            type: 'validateField',
            namePath,
            triggerName,
          });
        }
      };
    });
    return control;
  };

  // ============================== Lifecycle ==============================

  /**
   * 上游 `Field.js:92-102` 的 `cancelRegister`。
   * ⚠️ 传给注销函数的 `subNamePath` 是**未加 `prefixName`** 的路径（上游如此）。
   */
  cancelRegister = (): void => {
    const { preserve, isListField } = this.opts.props();
    if (this.cancelRegisterFunc) {
      this.cancelRegisterFunc(isListField, preserve, this.opts.rawNamePath() ?? []);
    }
    this.cancelRegisterFunc = null;
  };
}

/**
 * 运行时 props。
 *
 * ⚠️⚠️ **每一个含 `Boolean` 的 prop 都必须显式写 `default: undefined`**（差异 12）。
 * 不给默认值时 Vue 会把「未传」转成 `false`（`PITFALLS.md` 46），而这里
 * `preserve` / `isListField` / `isList` / `validateTrigger` 的「未传」是**有语义的**
 * （`undefined` ⇒ 用上层配置）。
 */
const fieldProps = {
  name: { type: [String, Number, Array] as PropType<NamePath>, default: undefined },
  rules: { type: Array as PropType<FormRule[]>, default: undefined },
  dependencies: { type: Array as PropType<NamePath[]>, default: undefined },
  initialValue: { type: null as unknown as PropType<StoreValue>, default: undefined },
  trigger: { type: String, default: undefined },
  validateTrigger: {
    type: [String, Array, Boolean] as PropType<string | string[] | false>,
    default: undefined,
  },
  validateDebounce: { type: Number, default: undefined },
  validateFirst: {
    type: [Boolean, String] as PropType<boolean | 'parallel'>,
    default: undefined,
  },
  valuePropName: { type: String, default: undefined },
  getValueFromEvent: {
    type: Function as PropType<(...args: EventArgs) => StoreValue>,
    default: undefined,
  },
  getValueProps: {
    type: Function as PropType<(value: StoreValue) => Record<string, unknown>>,
    default: undefined,
  },
  normalize: {
    type: Function as PropType<
      (value: StoreValue, prevValue: StoreValue, allValues: Store) => StoreValue
    >,
    default: undefined,
  },
  messageVariables: { type: Object as PropType<Record<string, string>>, default: undefined },
  shouldUpdate: { type: [Boolean, Function] as PropType<ShouldUpdate>, default: undefined },
  onReset: { type: Function as PropType<() => void>, default: undefined },
  onMetaChange: { type: Function as PropType<(meta: MetaEvent) => void>, default: undefined },
  preserve: { type: Boolean, default: undefined },
  isListField: { type: Boolean, default: undefined },
  isList: { type: Boolean, default: undefined },
} as const;

/**
 * `Field` —— renderless 组件（上游 `WrapperField` + `Field.render` 的对应物）。
 *
 * 用法（契约 §6.4.3）：
 *
 * ```vue
 * <Field :name="['user', 'name']" :rules="rules" v-slot="(control, meta, form)">
 *   <input v-bind="control" />
 * </Field>
 * ```
 *
 * ⚠️ `v-slot` 的参数列表就是上游 render prop 的 `(control, meta, form)` 三个位置参数。
 */
export const Field = defineComponent({
  name: 'AField',
  inheritAttrs: false,
  props: fieldProps,
  setup(props, { slots }) {
    const fieldContext = inject(fieldContextKey, defaultFieldContext);
    const listContext = inject(listContextKey, null);

    /** 未加 `prefixName` 的路径（上游 `WrapperField` 的 `namePath`）。 */
    const rawNamePath = (): InternalNamePath | undefined =>
      props.name !== undefined ? getNamePath(props.name) : undefined;

    /** 上游 `WrapperField.js:585`：`isListField ?? !!listContext`。 */
    const isMergedListField = (): boolean => props.isListField ?? Boolean(listContext);

    /** 当前 props 的只读快照（`trigger` / `valuePropName` 的默认值在这里落地）。 */
    const fieldPropsSnapshot = (): InternalFieldProps => ({
      dependencies: props.dependencies,
      getValueFromEvent: props.getValueFromEvent,
      name: rawNamePath(),
      normalize: props.normalize,
      rules: props.rules,
      shouldUpdate: props.shouldUpdate,
      trigger: props.trigger ?? 'onChange',
      validateTrigger: props.validateTrigger,
      validateDebounce: props.validateDebounce,
      validateFirst: props.validateFirst,
      valuePropName: props.valuePropName ?? 'value',
      getValueProps: props.getValueProps,
      messageVariables: props.messageVariables,
      initialValue: props.initialValue,
      onReset: props.onReset,
      onMetaChange: props.onMetaChange,
      preserve: props.preserve,
      isListField: isMergedListField(),
      isList: props.isList,
    });

    const getRules = (): RuleObject[] =>
      (props.rules ?? []).map((rule) =>
        typeof rule === 'function' ? rule(fieldContext as FormInstance) : rule,
      );

    // ⚠️ `shallowRef` 版本号 —— 只有**渲染函数读它**才成立（契约 §6.4.1 的订正）。
    const version = shallowRef(0);
    const resetCount = ref(0);

    const controller = new FieldController({
      // ⚠️ `entityProps` 只放 store **真的会读** 的三个键
      //    （`form-store.ts` 只读 `field.props.{rules,dependencies,initialValue}`）。
      //    `preserve` / `isListField` / `isList` 在 store 侧走的是**方法**
      //    （`entity.isPreserve()` / `isListField()` / `isList()`），放进来就是死代码。
      entityProps: {
        get rules() {
          return props.rules;
        },
        get dependencies() {
          return props.dependencies;
        },
        get initialValue() {
          return props.initialValue;
        },
      },
      rawNamePath,
      fieldContext: () => fieldContext,
      props: fieldPropsSnapshot,
      getRules,
      forceRender: () => {
        version.value += 1;
      },
      forceRefresh: () => {
        resetCount.value += 1;
      },
    });

    // 上游 `WrapperField.js:593-595`：直接挂在 `Form.List` 下的字段不允许 `preserve: false`。
    // ⚠️ 上游用的是**未加 `prefixName`** 的 `namePath.length`；且 `name === undefined` 时
    //    上游会读 `undefined.length` 抛错 —— 这里 `rawNamePath() ?? []` 退化成 `0`（告警而非抛错）。
    if (props.preserve === false && isMergedListField() && (rawNamePath() ?? []).length <= 1) {
      warning(false, '`preserve` should not apply on Form.List fields.');
    }

    // 上游在 `Field` 的 constructor 里调 `initEntityValue(this)` —— 避免 initialValue 太晚。
    fieldContext.getInternalHooks(HOOK_MARK)?.initEntityValue(controller);

    onMounted(() => {
      controller.mounted = true;
      // ⚠️ 上游判 `if (fieldContext)`；Vue 的 `inject` 有默认值 ⇒ 恒为真，故去掉该分支。
      //    没有 `Form` 时拿到的是 `defaultFieldContext`，它的 `registerField` 是告警桩。
      const hooks = fieldContext.getInternalHooks(HOOK_MARK);
      controller.cancelRegisterFunc = hooks?.registerField(controller) ?? null;

      // One more render for component in case fields not ready
      if (props.shouldUpdate === true) {
        controller.reRender();
      }
    });

    onUnmounted(() => {
      controller.cancelRegister();
      controller.triggerMetaEvent(true);
      controller.mounted = false;
    });

    return (): VNodeChild => {
      // ⚠️ 读版本号 —— 这是 `reRender()` 能触发重渲染的**唯一**原因。
      void version.value;

      const meta = controller.getMeta();
      const control = controller.getControlled();
      const child = slots.default?.(control, meta, fieldContext as FormInstance);

      // ⭐ keyed Fragment：`refresh()` 改 `resetCount` ⇒ Fragment 的 key 变化 ⇒
      //    Vue 整体 unmount/mount（等价上游 `<Fragment key={resetCount}>`，差异 11）。
      return h(Fragment, { key: resetCount.value }, [child]);
    };
  },
});

export default Field;
