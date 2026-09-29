/**
 * ErrorList —— 错误/警告列表（antd `es/form/ErrorList.js` 110 行的 Vue 等价物）。
 *
 * 判据：
 * 1. help 存在时只渲染 help 一条（状态 = helpStatus），否则 errors+warnings 逐条；
 * 2. key 去重：重复 error 字符串 key 加 `-fallback-${index}`；
 * 3. debounce（rc/antd 的 useDebounce，5 帧）—— 错误抖动场景避免动画闪烁；
 * 4. 动效：容器 `${p}-show-help`（visible 切换）+ 逐条 `${p}-show-help-item`
 *    （本仓 motion 的 collapse 动效类，与 Tree 展开同源）；
 * 5. DOM：`-item-explain`（id = `${fieldId}_help`）> `-item-explain-${status}`。
 */

import type { PropType, VNodeChild } from 'vue';
import { computed, defineComponent, h } from 'vue';
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
    className: { type: String, default: undefined },
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
    const baseClassName = `${prefixCls}-item-explain`;

    // antd useDebounce：延迟若干帧再更新（对拍 rc `useDebounce.js`）
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

    return () => {
      if (import.meta.env?.DEV) {
        console.log(
          'DBG-ERRLIST:',
          props.errors.length,
          debounceErrors.value.length,
          filledKeyList.value.length,
        );
      }
      const helpProps: Record<string, unknown> = {};
      if (props.fieldId) {
        helpProps.id = `${props.fieldId}_help`;
      }
      return h(
        'div',
        {
          ...helpProps,
          class: [
            baseClassName,
            // 动效容器类（collapse 同源；visible 切换时由 CSS 过渡）
            visible.value
              ? `${prefixCls}-show-help-appear ${prefixCls}-show-help-enter-done`
              : `${prefixCls}-show-help ${prefixCls}-show-help-exit-done`,
            props.helpClassName,
            baseClassName,
            props.className,
          ]
            .filter(Boolean)
            .join(' '),
        },
        filledKeyList.value.map(({ key, error, errorStatus }) =>
          h(
            'div',
            {
              key,
              class: [
                `${prefixCls}-show-help-item`,
                `${prefixCls}-show-help-item-appear ${prefixCls}-show-help-item-enter-done`,
                props.helpItemClassName,
                errorStatus ? `${baseClassName}-${errorStatus}` : '',
              ]
                .filter(Boolean)
                .join(' '),
            },
            [error],
          ),
        ),
      );
    };
  },
});

export { ErrorList };
export default ErrorList;
