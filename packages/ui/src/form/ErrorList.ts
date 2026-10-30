/**
 * ErrorList —— 错误/警告列表（antd `es/form/ErrorList.js` 的 Vue 等价物）。
 *
 * ── 关键判据 ────────────────────────────────────────────────────────────────
 * 1. help 非空 ⇒ 只渲染 help 一条（状态 = helpStatus）；否则 errors + warnings 逐条；
 * 2. 按消息及其出现次数生成唯一 key，保留离场行的最后内容；
 * 3. 双层动效（都是 collapse 预设）：容器 `${p}-show-help`（CSSMotion）+
 *    逐条 `${p}-show-help-item`（CSSMotionList，`component:false` 不额外包元素）；
 * 4. DOM：`-item-explain`（id = `${fieldId}_help`）> `-item-explain-${status}`；
 * 5. `onVisibleChanged` 上抛（ItemHolder 用它回收 margin 占位）。
 *
 * ⚠️ 动效类来自 motion 包（`CSSMotion` 的槽回传 className/style），**不手写**
 *    `-appear / -enter-done` 之类的猜名字符串 —— 猜错是静默失效
 *    （PITFALLS 180 同族；本节曾因此写过一组不存在的类名）。
 *
 * ⚠️ `initCollapseMotion` 的 9 个 handler 在 antd 侧是**独立 prop**，本包
 *    `CSSMotion` 收**单个 `hooks` 对象**（`css-motion.ts` §2），必须显式映射，
 *    否则 Vue 把它们当事件监听器、高度测量静默失效（upload / collapse 同范式）。
 */

import {
  CSSMotion,
  type CSSMotionSlotProps,
  initCollapseMotion,
  type MotionHooks,
  MotionList,
  type MotionListSlotProps,
} from '@apollo-design/motion';
import type { PropType, VNodeChild } from 'vue';
import { computed, defineComponent, h } from 'vue';
import { useFormContext } from './context';
import { useDebounce } from './hooks/use-debounce';
import { useFormItemPrefixContext } from './hooks/use-form-item-prefix';

interface ErrorEntity {
  key: string;
  error: VNodeChild;
  errorStatus: string;
}

function toErrorEntity(
  error: VNodeChild,
  prefix: string,
  errorStatus: string,
  index = 0,
): ErrorEntity {
  return {
    key: typeof error === 'string' ? error : `${prefix}-${index}`,
    error,
    errorStatus,
  };
}

const ErrorList = defineComponent({
  name: 'AFormItemErrorList',
  inheritAttrs: false,
  props: {
    help: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    helpStatus: { type: String as PropType<string>, default: undefined },
    errors: { type: Array as PropType<VNodeChild[]>, default: () => [] },
    warnings: { type: Array as PropType<VNodeChild[]>, default: () => [] },
    /** 语义槽（FormContext 的 classNames.help / helpItem）。 */
    helpClassName: { type: String, default: undefined },
    helpItemClassName: { type: String, default: undefined },
    fieldId: { type: String, default: undefined },
  },
  emits: { visibleChanged: (_visible: boolean) => true },
  setup(props, { attrs, emit }) {
    const prefixContext = useFormItemPrefixContext();
    const prefixCls = computed(() => prefixContext.prefixCls);
    const formContext = useFormContext();
    const baseClassName = computed(() => `${prefixCls.value}-item-explain`);

    // antd useDebounce：延迟若干帧再更新（对拍 rc `useDebounce.js`；
    // 本仓实现是 setTimeout —— jsdom 里 rAF 不触发，见 use-debounce.ts）
    const debounceErrors = useDebounce(computed(() => props.errors));
    const debounceWarnings = useDebounce(computed(() => props.warnings));

    const hasHelp = computed(() => props.help !== undefined && props.help !== null);
    const fullKeyList = computed<ErrorEntity[]>(() => {
      if (hasHelp.value) {
        return [toErrorEntity(props.help, 'help', props.helpStatus ?? '')];
      }
      return [
        ...(debounceErrors.value ?? []).map((error: VNodeChild, index: number) =>
          toErrorEntity(error, 'error', 'error', index),
        ),
        ...(debounceWarnings.value ?? []).map((warning: VNodeChild, index: number) =>
          toErrorEntity(warning, 'warning', 'warning', index),
        ),
      ];
    });

    const filledKeyList = computed<ErrorEntity[]>(() => {
      const occurrences = new Map<string, number>();
      return fullKeyList.value.map((entity) => {
        const occurrence = occurrences.get(entity.key) ?? 0;
        occurrences.set(entity.key, occurrence + 1);
        return { ...entity, key: JSON.stringify([entity.key, occurrence]) };
      });
    });

    const visible = computed(() => filledKeyList.value.length > 0);

    const rootPrefixCls = computed(() => prefixCls.value.replace(/-form$/, ''));
    const collapseMotion = computed(() => initCollapseMotion(rootPrefixCls.value));
    /** collapse 预设的 handler → CSSMotion 的 hooks（upload / collapse 同判）。 */
    const collapseHooks = computed<MotionHooks>(() => {
      const m = collapseMotion.value;
      return {
        onAppearStart: m.onAppearStart,
        onEnterStart: m.onEnterStart,
        onLeaveStart: m.onLeaveStart,
        onAppearActive: m.onAppearActive,
        onEnterActive: m.onEnterActive,
        onLeaveActive: m.onLeaveActive,
        onAppearEnd: m.onAppearEnd,
        onEnterEnd: m.onEnterEnd,
        onLeaveEnd: m.onLeaveEnd,
      };
    });

    return () => {
      return h(
        CSSMotion,
        {
          motionName: `${prefixCls.value}-show-help`,
          motionDeadline: collapseMotion.value.motionDeadline,
          visible: visible.value,
          onVisibleChanged: (nextVisible: boolean) => emit('visibleChanged', nextVisible),
        },
        {
          default: (holderProps: CSSMotionSlotProps) =>
            h(
              'div',
              {
                ...attrs,
                id: attrs.id ?? (props.fieldId ? `${props.fieldId}_help` : undefined),
                class: [
                  baseClassName.value,
                  holderProps.className,
                  props.helpClassName ?? formContext.classNames?.help,
                  attrs.class,
                ],
                style: [formContext.styles?.help, holderProps.style, attrs.style],
              },
              [
                h(
                  MotionList,
                  {
                    keys: filledKeyList.value,
                    component: false,
                    motionName: `${prefixCls.value}-show-help-item`,
                    motionDeadline: collapseMotion.value.motionDeadline,
                    hooks: collapseHooks.value,
                  },
                  {
                    default: (itemProps: MotionListSlotProps<ErrorEntity>) => {
                      return h(
                        'div',
                        {
                          class: [
                            itemProps.className,
                            props.helpItemClassName ?? formContext.classNames?.helpItem,
                            itemProps.errorStatus
                              ? `${baseClassName.value}-${itemProps.errorStatus}`
                              : undefined,
                          ]
                            .filter(Boolean)
                            .join(' '),
                          style: [formContext.styles?.helpItem, itemProps.style],
                        },
                        [itemProps.error],
                      );
                    },
                  },
                ),
              ],
            ),
        },
      );
    };
  },
});

export { ErrorList };
export default ErrorList;
