/**
 * useForm —— form-core 的 useForm + antd 壳层补丁
 * （antd `es/form/hooks/useForm.js` 68 行逐字语义）。
 *
 * 补丁内容（antd 在壳层加，rc 无）：
 * - `scrollToField(name, options)`：getFieldDOMNode → scroll-into-view-if-needed，
 *   `focus` 选项滚动后聚焦；
 * - `focusField(name)`：FieldInstance.focus 或 DOM focus。
 *
 * 字段 ref 注册表由 Form.vue 的 `__INTERNAL__.itemRef` 指回（FormItem.useItemRef 收集）。
 */

import { type FormInstance, useForm as useCoreForm } from '@apollo-design/form-core';
import scrollIntoView from 'scroll-into-view-if-needed';
import { getFieldId, toArray } from '../util';

/** antd `getFieldDOMNode`：FieldInstance.$el → getElementById 兜底。 */
function getFieldDOMNode(name: unknown, wrapForm: FormInstance): HTMLElement | null {
  const field = (
    wrapForm as unknown as {
      getFieldInstance?: (n: unknown) => { $el?: HTMLElement; focus?: () => void } | null;
    }
  ).getFieldInstance?.(name);
  const fieldDom = (field as { $el?: HTMLElement } | undefined)?.$el ?? null;
  if (fieldDom) {
    return fieldDom;
  }
  const fieldId = getFieldId(
    toArray(name) as never,
    (wrapForm as unknown as { __INTERNAL__: { name?: string } }).__INTERNAL__.name,
  );
  if (fieldId) {
    return document.getElementById(fieldId);
  }
  return null;
}

export function useForm<Values = unknown>(form?: FormInstance<Values>): [FormInstance<Values>] {
  const [coreForm] = useCoreForm<Values>(form);

  const wrapForm: FormInstance<Values> = {
    ...coreForm,
    // antd 壳层补丁：__INTERNAL__（rc 的 useForm.js:25-27 逐字 —— name/itemRef 挂钩）
    __INTERNAL__: {
      /** 由 Form.vue 写入（`__INTERNAL__.name = props.name`）。 */
      name: undefined as string | undefined,
      /** FormItem.useItemRef 收集的 ref（Form.vue 里 `itemRef` 指回注册表）。 */
      itemRef: (): void => {},
    },
    // antd 壳层补丁（rc FormInstance 无此二方法）
    scrollToField: (name: never, options: unknown = {}) => {
      const { focus, ...restOpt } = (options ?? {}) as { focus?: boolean } & Record<
        string,
        unknown
      >;
      const node = getFieldDOMNode(name, coreForm as never);
      if (node) {
        scrollIntoView(node, {
          scrollMode: 'if-needed',
          block: 'nearest',
          ...restOpt,
        } as never);
        // Focus if scroll success
        if (focus) {
          (wrapForm as unknown as { focusField: (n: never) => void }).focusField(name);
        }
      }
    },
    focusField: (name: never) => {
      const field = (
        coreForm as unknown as { getFieldInstance?: (n: unknown) => { focus?: () => void } | null }
      ).getFieldInstance?.(name);
      if (typeof field?.focus === 'function') {
        field.focus();
      } else {
        getFieldDOMNode(name, coreForm as never)?.focus?.();
      }
    },
  } as FormInstance<Values>;

  return [wrapForm];
}
