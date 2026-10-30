<script lang="ts">
/**
 * Form.Item —— 字段项（antd `es/form/FormItem/index.js` 284 行的 Vue 等价物）。
 *
 * 结构：消费 form-core 的 `Field`（scoped slot `{ control, meta, form }`）→
 * 子节点 control 注入（cloneVNode）→ renderLayout（noStyle ? StatusProvider : ItemHolder）。
 *
 * ── 关键判据（docs/analysis/form.md §3）──────────────────────────────────────
 * 1. control 注入：单 VNode 子组件时合并 props（value/valuePropName + id +
 *    aria-describedby/invalid/required）+ trigger/validateTrigger 事件合成
 *    （control 的先调、用户的后调，两者都保留）；
 * 2. isRequired：prop.required ?? rules.some(r => r.required && !warningOnly)；
 * 3. noStyle：错误上抛（NoStyleItemContext）+ 按真实路径聚合子 Field meta；
 * 4. meta 聚合：自身 meta.errors + 子 noStyle Field errors → ItemHolder；
 * 5. props 里所有 Boolean 形态的字段必须显式 `default: undefined`（Boolean 转换坑，
 *    骨架注释逐字保留）。
 *
 * ⚠️ SFC 用普通 `<script>`（defineComponent + 渲染函数）：child control 注入需要
 *    `cloneVNode` 与 Field 的 scoped slot，模板表达不了。
 */

import {
  Field,
  type FieldSlots,
  fieldProps,
  type InternalNamePath,
  listContextKey,
  type MetaEvent,
} from '@apollo-design/form-core';
import {
  Comment,
  type ComponentPublicInstance,
  cloneVNode,
  computed,
  defineComponent,
  Fragment,
  h,
  inject,
  isVNode,
  mergeProps,
  onBeforeUnmount,
  type PropType,
  type SlotsType,
  shallowReactive,
  shallowRef,
  type VNode,
  type VNodeChild,
} from 'vue';
import { useComponentConfig } from '../config-provider/context';
import { formContextKey, type NoStyleItemNotify, noStyleItemContextKey } from './context';
import ItemHolder from './FormItem/ItemHolder';
import StatusProvider from './FormItem/StatusProvider';
import type { FormItemProps, FormItemSlots } from './interface';
import { useFormTheme } from './use-form-theme';
import { getFieldId, toArray } from './util';

function controlChildren(children: VNodeChild): VNodeChild[] {
  if (Array.isArray(children)) return children.flatMap(controlChildren);
  if (isVNode(children) && children.type === Fragment && Array.isArray(children.children)) {
    return children.children.flatMap(controlChildren);
  }
  return children == null ||
    typeof children === 'boolean' ||
    (isVNode(children) && children.type === Comment)
    ? []
    : [children];
}

function genEmptyMeta(): MetaEvent {
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
  hasFeedback: { type: Boolean, default: undefined },
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
  help: { type: null as unknown as PropType<VNodeChild>, default: undefined },
  id: { type: String, default: undefined },
};

export default defineComponent({
  name: 'AFormItem',
  inheritAttrs: false,
  props: {
    ...fieldProps,
    ...uiProps,
  },
  slots: Object as SlotsType<FormItemSlots>,
  emits: {
    reset: () => true,
    metaChange: (_meta: MetaEvent) => true,
  },
  setup(props, { slots, attrs, emit }) {
    const { getPrefixCls } = useComponentConfig('form');
    const formContext = inject(formContextKey, undefined);
    const notifyParentMetaChange = inject<NoStyleItemNotify | null>(noStyleItemContextKey, null);
    const listContext = inject(listContextKey, null);
    let disposed = false;
    let pendingModelChange: { cancelled: boolean } | undefined;
    onBeforeUnmount(() => {
      disposed = true;
    });

    const prefixCls = computed(() => getPrefixCls('form', props.prefixCls));
    const themeStyle = useFormTheme(() => prefixCls.value);
    const hasName = computed(() => props.name !== undefined && props.name !== null);
    const isRenderProps = computed(() => typeof props.shouldUpdate !== 'undefined');

    // ── 子 Field 错误聚合（noStyle 链）──
    const subFieldErrors = shallowReactive(new Map<string, MetaEvent>());
    const meta = shallowRef<MetaEvent>(genEmptyMeta());
    const fieldKeyPathRef = shallowRef<InternalNamePath | null>(null);

    const onMetaChange = (nextMeta: MetaEvent): void => {
      const keyInfo = listContext?.getKey(nextMeta.name);
      meta.value = nextMeta.destroy ? genEmptyMeta() : nextMeta;
      emit('metaChange', nextMeta);
      // Bump to parent since noStyle
      if (props.noStyle && props.help !== false && notifyParentMetaChange) {
        let namePath = [...nextMeta.name];
        if (!nextMeta.destroy) {
          if (keyInfo?.[0] !== undefined) {
            const [fieldKey, restPath] = keyInfo;
            namePath = [fieldKey, ...restPath];
            fieldKeyPathRef.value = namePath;
          }
        } else {
          // Use origin cache data
          namePath = fieldKeyPathRef.value ?? namePath;
        }
        notifyParentMetaChange(nextMeta, namePath);
      }
    };

    const onSubItemMetaChange: NoStyleItemNotify = (subMeta, uniqueKeys): void => {
      const mergedNameKey = JSON.stringify(uniqueKeys);
      if (subMeta.destroy) {
        subFieldErrors.delete(mergedNameKey);
      } else {
        subFieldErrors.set(mergedNameKey, subMeta);
      }
    };

    const mergedErrors = computed<VNodeChild[]>(() => {
      const errorList: VNodeChild[] = [...(meta.value.errors ?? [])];
      subFieldErrors.forEach((subFieldError) => {
        errorList.push(...subFieldError.errors);
      });
      return errorList;
    });
    const mergedWarnings = computed<VNodeChild[]>(() => {
      const warningList: VNodeChild[] = [...(meta.value.warnings ?? [])];
      subFieldErrors.forEach((subFieldError) => {
        warningList.push(...subFieldError.warnings);
      });
      return warningList;
    });

    let controlRefKey: string | undefined;
    let controlRef: ((node: Element | ComponentPublicInstance | null) => void) | undefined;
    const getItemRef = (name: InternalNamePath) => {
      const key = JSON.stringify(name);
      if (controlRefKey !== key) {
        controlRefKey = key;
        let cancel: (() => void) | undefined;
        controlRef = (node) => {
          cancel?.();
          cancel = node ? formContext?.itemRef(name, node) : undefined;
        };
      }
      return controlRef;
    };

    return () => {
      function renderLayout(
        baseChildren: VNodeChild,
        fieldId: string | undefined,
        isRequired: boolean,
      ): VNodeChild {
        const help = slots.help ? slots.help() : props.help;
        const extra = slots.extra ? slots.extra() : props.extra;
        if (props.noStyle && !props.hidden) {
          return h(
            StatusProvider,
            {
              prefixCls: prefixCls.value,
              hasFeedback: props.hasFeedback,
              validateStatus: props.validateStatus,
              meta: meta.value,
              errors: mergedErrors.value,
              warnings: mergedWarnings.value,
              noStyle: true,
            },
            {
              default: () => [baseChildren],
              ...(slots.feedbackIcon ? { feedbackIcon: slots.feedbackIcon } : {}),
            },
          );
        }
        return h(
          ItemHolder,
          {
            ...attrs,
            style: [themeStyle.value, formContext?.componentVariables, attrs.style],
            prefixCls: prefixCls.value,
            help,
            errors: mergedErrors.value,
            warnings: mergedWarnings.value,
            validateStatus: props.validateStatus,
            meta: meta.value,
            hasFeedback: props.hasFeedback,
            hidden: props.hidden,
            fieldId,
            required: props.required,
            isRequired,
            onSubItemMetaChange,
            layout: props.layout,
            htmlFor: props.htmlFor,
            label: props.label,
            labelAlign: props.labelAlign,
            labelCol: props.labelCol,
            wrapperCol: props.wrapperCol,
            colon: props.colon,
            tooltip: props.tooltip,
            extra,
            requiredMark: formContext?.requiredMark,
            name: props.name,
          },
          {
            default: () => [baseChildren],
            ...(slots.label ? { label: slots.label } : {}),
            ...(slots.tooltip ? { tooltip: slots.tooltip } : {}),
            ...(slots.feedbackIcon ? { feedbackIcon: slots.feedbackIcon } : {}),
          },
        );
      }

      // 纯布局 Item：无 name / 非 render-props / 无 dependencies
      if (!hasName.value && !isRenderProps.value && !props.dependencies) {
        return renderLayout(
          slots.default?.({ control: {}, meta: meta.value, form: formContext?.form }),
          undefined,
          false,
        );
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
          ...props,
          messageVariables: variables,
          trigger: props.trigger,
          validateTrigger: props.validateTrigger,
          onMetaChange,
          onReset: () => emit('reset'),
        },
        {
          default: ({
            control,
            meta: renderMeta,
            form: context,
          }: Parameters<NonNullable<FieldSlots['default']>>[0]) => {
            const mergedName = hasName.value ? renderMeta.name : [];
            let fieldId = props.id ?? getFieldId(mergedName, formContext?.name);
            const isRequired =
              props.required !== undefined
                ? props.required
                : (props.rules ?? []).some((rule) => {
                    if (typeof rule === 'object' && rule !== null && 'required' in rule) {
                      return !!rule.required && !rule.warningOnly;
                    }
                    if (typeof rule === 'function') {
                      const ruleEntity = rule(context);
                      return Boolean(ruleEntity.required && !ruleEntity.warningOnly);
                    }
                    return false;
                  });

            // ── Children ──
            const childNodes = slots.default?.({ control, meta: renderMeta, form: context }) ?? [];
            const list = controlChildren(childNodes);
            const child = list.length === 1 && isVNode(list[0]) ? list[0] : undefined;
            let childNode: VNodeChild;
            if (list.length > 1 && hasName.value) {
              // 多子节点带 name：antd 告警后原样渲染
              childNode = childNodes;
            } else if (child && hasName.value && child.type !== Comment) {
              if (typeof child.props?.id === 'string') fieldId = child.props.id;
              const childProps: Record<string, unknown> = {
                ...(child.props ?? {}),
                ...control,
              };
              if (!childProps.id && fieldId) {
                childProps.id = fieldId;
              }
              const describedby = childProps['aria-describedby'];
              const describedbyArr =
                typeof describedby === 'string' ? describedby.split(/\s+/).filter(Boolean) : [];
              if (
                fieldId &&
                (slots.help ||
                  (props.help !== undefined && props.help !== null) ||
                  mergedErrors.value.length > 0 ||
                  mergedWarnings.value.length > 0)
              ) {
                describedbyArr.push(`${fieldId}_help`);
              }
              if (
                fieldId &&
                (slots.extra ||
                  (props.extra !== undefined &&
                    props.extra !== null &&
                    typeof props.extra !== 'boolean'))
              ) {
                describedbyArr.push(`${fieldId}_extra`);
              }
              if (describedbyArr.length) {
                childProps['aria-describedby'] = [...new Set(describedbyArr)].join(' ');
              }
              if (mergedErrors.value.length > 0) {
                childProps['aria-invalid'] = 'true';
              }
              if (isRequired) {
                childProps['aria-required'] = 'true';
              }
              // ref 收集（scrollToField / focus）

              // 事件合成：trigger + validateTrigger 的 handler（control 先、用户后）。
              // antd 在 React 事件名上合成；Vue 侧 control 的键即触发名（onChange），
              // 子组件的用户 handler 是 props.onXxx。
              // ⭐ Vue 生态映射：Input 族组件的值更新事件是 `update:value`（v-model），
              //    对应 React 的 onChange trigger —— 注入键 `onUpdate:${valuePropName}`。
              const valuePropName = props.valuePropName ?? 'value';
              const triggers = new Set<string>([
                ...toArray(props.trigger ?? 'onChange'),
                ...toArray(props.validateTrigger),
              ]);
              /**
               * 合成一个事件处理器：**control 先、用户原回调后**，各调**一次**
               * （上游 `FormItem/index.js:261-266` 逐字）。
               *
               * ⚠️ 用户原回调必须从**原 child 的 props** 上取 —— 它在 `childProps`
               * 里已经被这一行覆盖掉了。
               */
              const originalProps = child.props ?? {};
              const makeHandler = (
                eventName: string,
                userKey: string,
                controller = control[eventName],
              ) =>
                mergeProps({ [eventName]: controller }, { [eventName]: originalProps[userKey] })[
                  eventName
                ];
              triggers.forEach((eventName) => {
                // 🚨 `triggers` 里的键**已经是 `onXxx` 形态**（`trigger` 的默认就是
                //    `'onChange'`）⇒ 取用户回调的键就是 `eventName` **本身**。
                //    此前又拼了一次 `on` + 首字母大写 ⇒ 查的是 `onOnChange`
                //    ⇒ `userHandler` 恒 `undefined` ⇒ **用户的 `onChange` 从来没被调过**
                //    （实测：DOM 上 `change` 触发后 `control` 走了、用户回调 0 次）。
                childProps[eventName] = makeHandler(eventName, eventName);
                const controller = control[eventName];
                if (eventName === 'onChange' && typeof controller === 'function') {
                  // A native change following update:value owns this edit. Defer only
                  // the model-only fallback, keeping real Events for getValueFromEvent
                  // and validating once when a component emits both notifications.
                  const updateKey = `onUpdate:${valuePropName}`;
                  childProps[eventName] = makeHandler(
                    eventName,
                    eventName,
                    (...args: unknown[]) => {
                      if (pendingModelChange) pendingModelChange.cancelled = true;
                      pendingModelChange = undefined;
                      controller(...args);
                    },
                  );
                  childProps[updateKey] = makeHandler(
                    updateKey,
                    updateKey,
                    (...args: unknown[]) => {
                      const pending = { cancelled: false };
                      pendingModelChange = pending;
                      queueMicrotask(() => {
                        if (pendingModelChange === pending) pendingModelChange = undefined;
                        if (!disposed && !pending.cancelled) controller(...args);
                      });
                    },
                  );
                }
              });

              // Preserve Vue's normalized ref owner, directives, key and scope IDs.
              // An empty extra-props object requests FULL_PROPS for dynamic field attrs;
              // assigning the final props avoids merging composed listeners a second time.
              childNode = cloneVNode(child, { ref: getItemRef(mergedName) }, true);
              childNode.props = childProps;
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

