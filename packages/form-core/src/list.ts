/**
 * `List` —— 数组字段的增删移（批次 ③c）。
 *
 * 契约来源：`@rc-component/form@1.8.6/es/List.js`（143 行）。
 * 逐条对照见 `docs/foundation/form-core-contract.md` §4.7.11。
 *
 * ── ⚠️ 本文件**没有 Oracle**（契约 §7.0.1）────────────────────────────────────
 *
 * 上游用 `useContext` / `useRef` / `useMemo` / render props，绑 React；
 * 期望值全部来自**读上游源码 + 行为测试**，每条都标了行号。
 *
 * ── 结构（与上游同构，但用 Vue 的手段）─────────────────────────────────────────
 *
 * | 上游 | 我们 | 说明 |
 * |---|---|---|
 * | `ListContext.Provider` + `FieldContext.Provider` 两层 | `provide()` 两次 | Vue 的 `provide` 沿父链解析，不需要「Provider 组件」 |
 * | `useMemo(() => prefixName, [...])` | `prefixName()` 函数 + **getter** | Vue 的 `setup()` 只跑一次，getter 让「读的时候是最新值」成立 |
 * | `<Field name={[]} ...>{(control, meta) => ...}</Field>` | `h(Field, {...}, { default })` | 复用 ③b 的 renderless `Field`（差异 2：scoped slot） |
 * | `typeof children !== 'function'` ⇒ 告警 + `null` | **没有 `default` 插槽** ⇒ 告警 + `null` | Vue 的插槽永远是函数，「不是函数」没有对应物（差异 14） |
 *
 * ⭐ **为什么 `name: []`**：`Field.getNamePath()` 是 `[...prefixName, ...name]`，
 * 传空数组 ⇒ 该 `Field` 的路径**就是** `prefixName`（`List.js:58`）。
 * 于是「List 自己的值」与「子字段 `[...prefixName, index]` 的值」由 store 天然拼出。
 */

import { warning } from '@apollo-design/utils';
import type { PropType } from 'vue';
import { defineComponent, h, inject, provide } from 'vue';

import { Field } from './field';
import { defaultFieldContext, fieldContextKey, listContextKey } from './form-context';
import type {
  ChildProps,
  InternalFormInstance,
  InternalNamePath,
  ListContextProps,
  ListField,
  ListOperations,
  Meta,
  NamePath,
  ShouldUpdate,
  StoreValue,
  ValidatorRule,
} from './form-types';
import { getNamePath, move } from './value-util';

export const listProps = {
  name: {
    type: [String, Number, Array] as PropType<NamePath>,
    required: true,
  },
  rules: { type: Array as PropType<ValidatorRule[]>, default: undefined },
  validateTrigger: {
    type: [String, Array, Boolean] as PropType<string | string[] | false>,
    default: undefined,
  },
  initialValue: { type: Array as PropType<StoreValue[]>, default: undefined },
  /** ⚠️ 含 `Boolean` ⇒ **必须**显式 `default: undefined`（PITFALLS 46）。 */
  isListField: { type: Boolean, default: undefined },
} as const;

/**
 * `List` —— 数组字段容器。
 *
 * 用法（契约 §6.4.3）：
 *
 * ```vue
 * <List :name="['users']" v-slot="(fields, operations, meta)">
 *   <div v-for="field in fields" :key="field.key">
 *     <Field :name="[field.name, 'first']" v-slot="(control)">
 *       <input v-bind="control" />
 *     </Field>
 *   </div>
 * </List>
 * ```
 *
 * ⭐ `fields[i].key` 是**稳定**的（不随增删重排），`fields[i].name` 是**当前下标**
 * —— 这正是上游 `keyManager` 存在的理由（`List.js:17-20`）。
 */
export const List = defineComponent({
  name: 'AList',
  inheritAttrs: false,
  props: listProps,
  setup(props, { slots }) {
    const context = inject(fieldContextKey, defaultFieldContext);
    const wrapperListContext = inject(listContextKey, null);

    /** ⭐ 上游 `keyRef = useRef({keys: [], id: 0})`（`List.js:17-20`）。 */
    const keyManager: { keys: number[]; id: number } = { keys: [], id: 0 };

    /**
     * 上游 `useMemo(() => [...getNamePath(context.prefixName) || [], ...getNamePath(name)])`
     * （`List.js:22-25`）。⚠️ 用**函数**而不是 `computed`：这里的值只被「读」，
     * 不需要响应式（§6.4.1），而 `props.name` 变化时函数能立刻反映。
     */
    const prefixName = (): InternalNamePath => [
      ...(getNamePath(context.prefixName) || []),
      ...getNamePath(props.name),
    ];

    const fieldContext: InternalFormInstance = {
      ...context,
      get prefixName() {
        return prefixName();
      },
    };
    provide(fieldContextKey, fieldContext);

    /**
     * 上游 `List.js:32-38`。
     *
     * ⚠️ 返回元组的第一个元素在「该 index 还没登记过 key」时是 `undefined`
     * —— 但 `ListContextProps.getKey` 的声明（上游 `ListContext.d.ts`）写的是
     * `InternalNamePath[number]`，即**不含 undefined**。这里按声明收敛（上游同款失真），
     * 消费方（`Field` 的 `getKey` 调用点）只用真值语境。
     */
    const listContext: ListContextProps = {
      getKey: (namePath) => {
        const len = prefixName().length;
        const pathName = namePath[len] as number;
        return [keyManager.keys[pathName] as number, namePath.slice(len + 1)];
      },
    };
    provide(listContextKey, listContext);

    // 上游 `List.js:41-44`：`typeof children !== 'function'` ⇒ 告警 + `null`。
    // Vue 的插槽**总是**函数，所以「不是函数」的对应物是「根本没有这个插槽」（差异 14）。
    if (!slots.default) {
      warning(false, 'Form.List only accepts function as children.');
      return () => null;
    }

    /**
     * 上游 `List.js:45-52`：内部来源的更新**不**触发 `shouldUpdate` 重渲染
     * （`List` 自己的 `onChange` 是 `source: 'internal'`，那时必然已经因为
     *  `namePathMatch` 重渲染过了，再走 `shouldUpdate` 会多渲染一次）。
     */
    const shouldUpdate: ShouldUpdate = (prevValue, nextValue, { source }) => {
      if (source === 'internal') {
        return false;
      }
      return prevValue !== nextValue;
    };

    return () =>
      h(
        Field,
        {
          name: [],
          shouldUpdate,
          rules: props.rules,
          validateTrigger: props.validateTrigger,
          initialValue: props.initialValue,
          isList: true,
          isListField: props.isListField ?? Boolean(wrapperListContext),
        },
        {
          default: (control: ChildProps, meta: Meta) => {
            const onChange = control.onChange as (value: StoreValue[]) => void;

            /**
             * 上游 `List.js:72-75`：**每次操作都重新取**，因为用户可能用
             * `form.setFieldValue` 等 API 从外部改过值。
             *
             * ⚠️ 用的是**外层** `context`（`List.js:70` 的解构来自 `context`）。
             * 这里传的是**完整的 `prefixName`**，而不是让 `getFieldValue` 自己去拼，
             * ⇒ 换成 `fieldContext` 结果**完全一样**（`getFieldValue` 是 FormStore 的
             * 箭头属性 `form-store.ts:361`，`this` 与宿主对象无关）。
             * 变异验证里「换成 `fieldContext`」是**等价变异体**（杀不掉），
             * 保留 `context` 只是为了与上游 `List.js:70` 同形。
             */
            const getNewValue = (): StoreValue[] => {
              const values = context.getFieldValue(prefixName());
              return (values as StoreValue[] | undefined) || [];
            };

            const operations: ListOperations = {
              add: (defaultValue, index) => {
                const newValue = getNewValue();

                if (index !== undefined && index >= 0 && index <= newValue.length) {
                  keyManager.keys = [
                    ...keyManager.keys.slice(0, index),
                    keyManager.id,
                    ...keyManager.keys.slice(index),
                  ];
                  onChange([...newValue.slice(0, index), defaultValue, ...newValue.slice(index)]);
                } else {
                  // ⚠️ `add(v)`（不传 index）时 `undefined` 的两个比较都是 `false`
                  //    ⇒ **不告警**，直接追加（上游 `List.js:87` 的同一套判据）。
                  if (index !== undefined && (index < 0 || index > newValue.length)) {
                    warning(
                      false,
                      'The second parameter of the add function should be a valid positive number.',
                    );
                  }
                  keyManager.keys = [...keyManager.keys, keyManager.id];
                  onChange([...newValue, defaultValue]);
                }
                keyManager.id += 1;
              },

              remove: (index) => {
                const newValue = getNewValue();
                const indexSet = new Set(Array.isArray(index) ? index : [index]);
                if (indexSet.size <= 0) {
                  return;
                }
                keyManager.keys = keyManager.keys.filter(
                  (_, keysIndex) => !indexSet.has(keysIndex),
                );

                // Trigger store change
                onChange(newValue.filter((_, valueIndex) => !indexSet.has(valueIndex)));
              },

              move: (from, to) => {
                if (from === to) {
                  return;
                }
                const newValue = getNewValue();

                // Do not handle out of range
                if (from < 0 || from >= newValue.length || to < 0 || to >= newValue.length) {
                  return;
                }
                keyManager.keys = move(keyManager.keys, from, to);
                onChange(move(newValue, from, to));
              },
            };

            // 上游 `List.js:122-128`：非数组 ⇒ 归零 + 告警。
            // ⚠️ 用 `||` 而不是 `??` —— `''` / `0` 也会被归零（上游如此）。
            let listValue: StoreValue = control.value || [];
            if (!Array.isArray(listValue)) {
              listValue = [];
              warning(
                false,
                `Current value of '${prefixName().join(' > ')}' is not an array type.`,
              );
            }

            const fields: ListField[] = (listValue as StoreValue[]).map((__, index) => {
              let key = keyManager.keys[index];
              if (key === undefined) {
                keyManager.keys[index] = keyManager.id;
                key = keyManager.keys[index];
                keyManager.id += 1;
              }
              return { name: index, key, isListField: true };
            });

            return slots.default?.(fields, operations, meta);
          },
        },
      );
  },
});

export default List;
