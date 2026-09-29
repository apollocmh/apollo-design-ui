<script lang="ts">
/**
 * Form.Item —— 字段项（antd `es/form/FormItem/index.js` 284 行的 Vue 等价物）。
 *
 * 结构：消费 form-core 的 `Field`（scoped slot `(control, meta, form)`）→
 * 子节点 control 注入（cloneVNode）→ renderLayout（noStyle ? StatusProvider : ItemHolder）。
 *
 * ── 关键判据（docs/analysis/form.md §3）──────────────────────────────────────
 * 1. control 注入：单 VNode 子组件时合并 props（value/valuePropName + id +
 *    aria-describedby/invalid/required）+ trigger/validateTrigger 事件合成
 *    （control 的先调、用户的后调，两者都保留）；
 * 2. isRequired：prop.required ?? rules.some(r => r.required && !warningOnly)；
 * 3. noStyle：错误上抛（NoStyleItemContext）+ 子 Field meta 聚合（NAME_SPLIT key）；
 * 4. meta 聚合：自身 meta.errors + 子 noStyle Field errors → ItemHolder；
 * 5. props 里所有 Boolean 形态的字段必须显式 `default: undefined`（Boolean 转换坑，
 *    骨架注释逐字保留）。
 *
 * ⚠️ SFC 用普通 `<script>`（defineComponent + 渲染函数）：child control 注入需要
 *    `cloneVNode` 与 Field 的 scoped slot，模板表达不了。
 */

import {
  type Meta as CoreMeta,
  Field,
  type FormInstance,
  fieldProps,
  listContextKey,
} from '@apollo-design/form-core';
import {
  type ComponentPublicInstance,
  cloneVNode,
  computed,
  defineComponent,
  h,
  inject,
  type PropType,
  reactive,
  shallowRef,
  type VNode,
  type VNodeChild,
} from 'vue';
import { useComponentConfig } from '../config-provider/context';
import { formContextKey, type NoStyleItemNotify, noStyleItemContextKey } from './context';
import ItemHolder from './FormItem/ItemHolder';
import StatusProvider from './FormItem/StatusProvider';
import type { FormItemProps } from './interface';
import { getFieldId, toArray } from './util';

const NAME_SPLIT = '__SPLIT__';

function genEmptyMeta(): CoreMeta & { destroy?: boolean } {
  return {
    errors: [],
    warnings: [],
    touched: false,
    validating: false,
    name: [],
    validated: false,
  };
}

/** antd FormItem 的展示层 props（FieldProps 之外的部分）。 */
const uiProps = {
  prefixCls: { type: String, default: undefined },
  noStyle: { type: Boolean, default: undefined },
  style: { type: Object as PropType<Record<string, string | number>>, default: undefined },
  className: { type: String, default: undefined },
  rootClassName: { type: String, default: undefined },
  hasFeedback: {
    type: [Boolean, Object] as PropType<boolean | { icons: unknown }>,
    default: undefined,
  },
  validateStatus: { type: String as PropType<FormItemProps['validateStatus']>, default: undefined },
  required: { type: Boolean, default: undefined },
  hidden: { type: Boolean, default: undefined },
  messageVariables: { type: Object as PropType<Record<string, string>>, default: undefined },
  layout: { type: String as PropType<FormItemProps['layout']>, default: undefined },
  colon: { type: Boolean, default: undefined },
  htmlFor: { type: String, default: undefined },
  label: { type: null as unknown as PropType<VNodeChild>, default: undefined },
  labelAlign: { type: String as PropType<FormItemProps['labelAlign']>, default: undefined },
  labelCol: { type: Object as PropType<FormItemProps['labelCol']>, default: undefined },
  tooltip: { type: null as unknown as PropType<FormItemProps['tooltip']>, default: undefined },
  wrapperCol: { type: Object as PropType<FormItemProps['wrapperCol']>, default: undefined },
  extra: { type: null as unknown as PropType<VNodeChild>, default: undefined },
  status: { type: String as PropType<FormItemProps['status']>, default: undefined },
  help: { type: null as unknown as PropType<VNodeChild>, default: undefined },
  id: { type: String, default: undefined },
};

export default defineComponent({
  name: 'AFormItem',
  props: {
    ...fieldProps,
    ...uiProps,
  },
  setup(props, { slots }) {
    const { getPrefixCls } = useComponentConfig('form');
    const formContext = inject(formContextKey, undefined);
    const notifyParentMetaChange = inject<NoStyleItemNotify | null>(noStyleItemContextKey, null);
    const listContext = inject(listContextKey, null);

    const prefixCls = computed(() => getPrefixCls('form', props.prefixCls));
    const hasName = computed(() => props.name !== undefined && props.name !== null);
    const isRenderProps = computed(() => typeof props.shouldUpdate !== 'undefined');

    // ── 子 Field 错误聚合（noStyle 链）──
    const subFieldErrors = reactive<Record<string, CoreMeta & { destroy?: boolean }>>({});
    const meta = shallowRef<CoreMeta & { destroy?: boolean }>(genEmptyMeta());
    const fieldKeyPathRef = shallowRef<string[] | null>(null);

    const onMetaChange = (nextMeta: CoreMeta & { destroy?: boolean }): void => {
      const keyInfo =
        listContext && typeof (listContext as { getKey?: unknown }).getKey === 'function'
          ? (listContext as unknown as { getKey: (name: unknown) => [string, ...string[]] }).getKey(
              nextMeta.name,
            )
          : undefined;
      meta.value = nextMeta.destroy ? genEmptyMeta() : nextMeta;
      props.onMetaChange?.(nextMeta as never);
      // Bump to parent since noStyle
      if (props.noStyle && props.help !== false && notifyParentMetaChange) {
        let namePath = [...(nextMeta.name ?? [])] as string[];
        if (!nextMeta.destroy) {
          if (keyInfo !== undefined) {
            const [fieldKey, ...restPath] = keyInfo;
            namePath = [fieldKey, ...restPath];
            fieldKeyPathRef.value = namePath;
          }
        } else {
          // Use origin cache data
          namePath = fieldKeyPathRef.value ?? namePath;
        }
        notifyParentMetaChange(nextMeta, namePath as never);
      }
    };

    /** noStyle 子 Field 的 meta 上抛聚合（antd onSubItemMetaChange 逐字）。 */
    const onSubItemMetaChange = (
      subMeta: CoreMeta & { destroy?: boolean },
      uniqueKeys: unknown,
    ): void => {
      const mergedNamePath = [
        ...(subMeta.name.slice(0, -1) as (string | number)[]),
        ...(Array.isArray(uniqueKeys) ? uniqueKeys : [uniqueKeys]),
      ] as (string | number)[];
      const mergedNameKey = mergedNamePath.join(NAME_SPLIT);
      if (subMeta.destroy) {
        delete subFieldErrors[mergedNameKey];
      } else {
        subFieldErrors[mergedNameKey] = subMeta;
      }
    };

    const mergedErrors = computed<VNodeChild[]>(() => {
      const errorList: VNodeChild[] = [...(meta.value.errors ?? [])];
      Object.values(subFieldErrors).forEach((subFieldError) => {
        errorList.push(...((subFieldError.errors ?? []) as VNodeChild[]));
      });
      return errorList;
    });
    const mergedWarnings = computed<VNodeChild[]>(() => {
      const warningList: VNodeChild[] = [...(meta.value.warnings ?? [])];
      Object.values(subFieldErrors).forEach((subFieldError) => {
        warningList.push(...((subFieldError.warnings ?? []) as VNodeChild[]));
      });
      return warningList;
    });

    // ── ref 收集（useItemRef：form.scrollToField / focus 用）──
    const itemRefMap = new Map<string, ComponentPublicInstance | HTMLElement | null>();
    const getItemRef = (name: (string | number)[]): ((el: unknown) => void) | undefined => {
      const key = (getFieldId(name) ?? name.join('_')) as string;
      if (!itemRefMap.has(key)) {
        itemRefMap.set(key, null);
      }
      return (el: unknown) => {
        const element = (el as ComponentPublicInstance | null)?.$el ?? (el as HTMLElement | null);
        itemRefMap.set(key, element);
      };
    };

    return () => {
      function renderLayout(
        baseChildren: VNodeChild,
        fieldId: string | undefined,
        isRequired: boolean,
      ): VNodeChild {
        if (props.noStyle && !props.hidden) {
          return h(
            StatusProvider,
            {
              prefixCls: prefixCls.value,
              hasFeedback: props.hasFeedback as never,
              validateStatus: props.validateStatus as never,
              meta: meta.value,
              errors: mergedErrors.value,
              warnings: mergedWarnings.value,
              noStyle: true,
            },
            { default: () => [baseChildren] },
          );
        }
        return h(
          ItemHolder as never,
          {
            prefixCls: prefixCls.value,
            className: props.className,
            rootClassName: props.rootClassName,
            style: props.style,
            help: props.help,
            errors: mergedErrors.value,
            warnings: mergedWarnings.value,
            validateStatus: props.validateStatus as never,
            meta: meta.value,
            hasFeedback: props.hasFeedback as never,
            hidden: props.hidden,
            fieldId,
            required: props.required,
            isRequired,
            onSubItemMetaChange: onSubItemMetaChange as never,
            layout: props.layout as never,
            htmlFor: props.htmlFor,
            label: props.label,
            labelAlign: props.labelAlign,
            labelCol: props.labelCol as never,
            wrapperCol: props.wrapperCol as never,
            colon: props.colon,
            tooltip: props.tooltip,
            extra: props.extra,
            requiredMark: formContext?.requiredMark as never,
            name: props.name as never,
          },
          {
            default: () => [baseChildren, slots.help?.(), slots.extra?.()],
          },
        );
      }

      // 纯布局 Item：无 name / 非 render-props / 无 dependencies
      if (!hasName.value && !isRenderProps.value && !props.dependencies) {
        return renderLayout(slots.default?.(), undefined, false);
      }

      const variables: Record<string, string> = {};
      if (typeof props.label === 'string') {
        variables.label = props.label;
      } else if (props.name) {
        variables.label = String(props.name);
      }
      if (props.messageVariables) {
        Object.assign(variables, props.messageVariables);
      }

      // ── With Field ──
      return h(
        Field,
        {
          ...(props as Record<string, unknown>),
          messageVariables: variables,
          trigger: props.trigger,
          validateTrigger: props.validateTrigger,
          onMetaChange: onMetaChange as never,
        },
        {
          default: (
            control: Record<string, unknown>,
            renderMeta: CoreMeta,
            context: FormInstance,
          ) => {
            const mergedName =
              toArray(props.name as never).length && renderMeta ? renderMeta.name : [];
            const fieldId = getFieldId(mergedName, formContext?.name) ?? props.id;
            const isRequired =
              props.required !== undefined
                ? props.required
                : (props.rules ?? []).some((rule) => {
                    if (typeof rule === 'object' && rule !== null && 'required' in rule) {
                      const r = rule as { required?: boolean; warningOnly?: boolean };
                      return !!r.required && !r.warningOnly;
                    }
                    if (typeof rule === 'function') {
                      const ruleEntity = (
                        rule as (f: FormInstance) => { required?: boolean; warningOnly?: boolean }
                      )(context);
                      return ruleEntity?.required && !ruleEntity?.warningOnly;
                    }
                    return false;
                  });

            // ── Children ──
            const childNodes = (slots.default?.(control as never, renderMeta as never, context) ??
              []) as VNodeChild[];
            const list = Array.isArray(childNodes) ? childNodes : [childNodes];
            const single = list.filter(
              (n): n is VNode => !!n && typeof n === 'object' && 'type' in (n as object),
            );
            let childNode: VNodeChild;
            if (list.length > 1 && hasName.value) {
              // 多子节点带 name：antd 告警后原样渲染
              childNode = childNodes;
            } else if (single.length === 1 && hasName.value && !isRenderProps.value) {
              const child = single[0] as VNode;
              const childProps: Record<string, unknown> = {
                ...(child.props ?? {}),
                ...control,
              };
              if (!childProps.id && fieldId) {
                childProps.id = fieldId;
              }
              const describedbyArr: string[] = [];
              if (props.help || mergedErrors.value.length > 0) {
                describedbyArr.push(`${fieldId}_help`);
              }
              if (props.extra) {
                describedbyArr.push(`${fieldId}_extra`);
              }
              if (describedbyArr.length) {
                childProps['aria-describedby'] = describedbyArr.join(' ');
              }
              if (mergedErrors.value.length > 0) {
                childProps['aria-invalid'] = 'true';
              }
              if (isRequired) {
                childProps['aria-required'] = 'true';
              }
              // ref 收集（scrollToField / focus）
              childProps.ref = getItemRef(mergedName as string[]);

              // 事件合成：trigger + validateTrigger 的 handler（control 先、用户后）。
              // antd 在 React 事件名上合成；Vue 侧 control 的键即触发名（onChange），
              // 子组件的用户 handler 是 props.onXxx。
              // ⭐ Vue 生态映射：Input 族组件的值更新事件是 `update:value`（v-model），
              //    对应 React 的 onChange trigger —— 注入键 `onUpdate:${valuePropName}`。
              const valuePropName = props.valuePropName ?? 'value';
              const triggers = new Set<string>([
                ...toArray(props.trigger ?? 'onChange'),
                ...toArray(props.validateTrigger as never),
              ]);
              const makeHandler = (eventName: string) => {
                const controlHandler = control[eventName] as
                  | ((...args: unknown[]) => void)
                  | undefined;
                const camel = `on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`;
                const userHandler = (child.props as Record<string, unknown>)?.[camel];
                return (...args: unknown[]) => {
                  controlHandler?.(...args);
                  (userHandler as ((...a: unknown[]) => void) | undefined)?.(...args);
                };
              };
              triggers.forEach((eventName) => {
                childProps[eventName] = makeHandler(eventName);
                if (eventName === 'onChange') {
                  // v-model 桥（INTENDED：Vue 组件的值更新走 update:value）
                  childProps[`onUpdate:${valuePropName}`] = makeHandler(eventName);
                }
              });
              childNode = cloneVNode(child, childProps as never);
            } else {
              childNode = childNodes;
            }
            return renderLayout(childNode, fieldId, isRequired);
          },
        },
      );
    };
  },
});
</script>

