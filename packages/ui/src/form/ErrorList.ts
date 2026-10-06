/**
 * ErrorList —— 错误/警告列表（antd `es/form/ErrorList.js` 的 Vue 等价物）。
 *
 * ── 关键判据 ────────────────────────────────────────────────────────────────
 * 1. help 非空 ⇒ 只渲染 help 一条（状态 = helpStatus）；否则 errors + warnings 逐条；
 * 2. key 去重：重复 key 加 `-fallback-${index}`；
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

import { CSSMotion, initCollapseMotion, type MotionHooks, MotionList } from '@apollo-design/motion';
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
  props: {
    help: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    helpStatus: { type: String as PropType<string>, default: undefined },
    errors: { type: Array as PropType<VNodeChild[]>, default: () => [] },
    warnings: { type: Array as PropType<VNodeChild[]>, default: () => [] },
    /** 语义槽（FormContext 的 classNames.help / helpItem）。 */
    helpClassName: { type: String, default: undefined },
    helpItemClassName: { type: String, default: undefined },
    fieldId: { type: String, default: undefined },
    onVisibleChanged: {
      type: Function as PropType<(visible: boolean) => void>,
      default: undefined,
    },
  },
  setup(props) {
    const { prefixCls } = useFormItemPrefixContext();
    const formContext = useFormContext();
    const baseClassName = `${prefixCls}-item-explain`;

    // antd useDebounce：延迟若干帧再更新（对拍 rc `useDebounce.js`；
    // 本仓实现是 setTimeout —— jsdom 里 rAF 不触发，见 use-debounce.ts）
    const debounceErrors = useDebounce(computed(() => props.errors));
    const debounceWarnings = useDebounce(computed(() => props.warnings));

    const hasHelp = computed(() => props.help !== undefined && props.help !== null);
    const fullKeyList = computed<ErrorEntity[]>(() => {
      if (hasHelp.value) {
        return [toErrorEntity(props.help as VNodeChild, 'help', props.helpStatus ?? '')];
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
      const keysCount: Record<string, number> = {};
      fullKeyList.value.forEach(({ key }) => {
        keysCount[key] = (keysCount[key] ?? 0) + 1;
      });
      return fullKeyList.value.map((entity, index) => ({
        ...entity,
        key: (keysCount[entity.key] ?? 0) > 1 ? `${entity.key}-fallback-${index}` : entity.key,
      }));
    });

    const visible = computed(() => filledKeyList.value.length > 0);

    const rootPrefixCls = computed(() => prefixCls.replace(/-form$/, ''));
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
      const helpProps: Record<string, unknown> = {};
      if (props.fieldId) {
        helpProps.id = `${props.fieldId}_help`;
      }

      return h(
        CSSMotion,
        {
          motionName: `${prefixCls}-show-help`,
          motionDeadline: collapseMotion.value.motionDeadline,
          visible: visible.value,
          hooks: {
            onVisibleChanged: (nextVisible: boolean) => {
              props.onVisibleChanged?.(nextVisible);
            },
          },
        },
        {
          default: (holderProps: { className?: string; style?: Record<string, string | number> }) =>
            h(
              'div',
              {
                ...helpProps,
                class: [
                  baseClassName,
                  holderProps.className,
                  props.helpClassName ?? formContext.classNames?.help,
                  // ⚠️ 调用方原生 class 不在这里加 —— 本组件没关 inheritAttrs，
                  //    Vue 会自动合并到根（加一遍会重复）。
                ]
                  .filter(Boolean)
                  .join(' '),
                style: { ...formContext.styles?.help, ...holderProps.style },
              },
              [
                h(
                  MotionList,
                  {
                    keys: filledKeyList.value,
                    component: false,
                    motionName: `${prefixCls}-show-help-item`,
                    motionDeadline: collapseMotion.value.motionDeadline,
                    hooks: collapseHooks.value,
                  },
                  {
                    default: (itemProps: {
                      itemKey?: unknown;
                      className?: string;
                      style?: Record<string, string | number>;
                    }) => {
                      const entity = filledKeyList.value.find(
                        (item) => item.key === itemProps.itemKey,
                      );
                      if (!entity) return null;
                      return h(
                        'div',
                        {
                          class: [
                            itemProps.className,
                            props.helpItemClassName ?? formContext.classNames?.helpItem,
                            entity.errorStatus
                              ? `${baseClassName}-${entity.errorStatus}`
                              : undefined,
                          ]
                            .filter(Boolean)
                            .join(' '),
                          style: { ...formContext.styles?.helpItem, ...itemProps.style },
                        },
                        [entity.error],
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
