/**
 * `useMessage` —— antd `components/message/useMessage.tsx` 的 Vue 版。
 *
 * 职责：`Holder`（把 message 的配置翻译成通知内核的 props）+ `useInternalMessage`
 * （把内核的 `open/close/destroy` 包装成 message 的 `MessageInstance`）。
 *
 * 逐条对齐上游的判据：
 *   1. `DEFAULT_DURATION = 3`、`DEFAULT_OFFSET = 8`、`DEFAULT_STACK_CONFIG = false`；
 *   2. `closable: false` ⇒ message 的 notice **没有关闭按钮**；
 *   3. `placement` 恒 `'top'`；`getContainer` 三级优先级：
 *      `messageConfig.getContainer` → `ConfigProvider.getPopupContainer` → `document.body`；
 *   4. 语义槽的 `wrapper` / `icon` 要叠加类型类（`{p}-{type}` / `{p}-notice-icon-{type}`）；
 *   5. `key` 未传时自动生成（本仓字面量是 `apollo-message-N`，与 antd 的
 *      `antd-message-N` 属 D45 同判的「字面值不同、语义相同」）；
 *   6. `typeOpen` 的第二参传函数 ⇒ 视为 `onClose`（第三参被忽略）。
 *
 * ⚠️ 与上游的两处平台差异（登记在 COMPATIBILITY.md）：
 *   - 没有 `renderNotifications` 的 `-css-var` 包裹：本仓无 cssinjs 的
 *     hash/`-css-var` 类机制（D69/D95 同源），列表根的组件变量由静态 CSS 的
 *     声明块提供；
 *   - `holderRef` 在 Vue 里是**组件实例的 expose**（不是 DOM ref），因为内核的
 *     `open/close/destroy` 是方法而不是 DOM API。
 */
import { isPlainObject } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  isVNode,
  type MaybeRefOrGetter,
  onScopeDispose,
  type PropType,
  shallowRef,
  toValue,
  type VNode,
  watch,
} from 'vue';
import { clsx } from '../_internal/clsx';
import { mergeClassNames, mergeStyles } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { useNotification } from '../notification/engine';
import type { NoticeListConfig } from '../notification/engine/interface';
import { useStackConfig } from '../notification/hooks/useStackConfig';
import { provideNoticeZIndex, useMessageTheme } from '../notification/use-notice-theme';
import { getPlacementOffsetStyle } from '../notification/util';
import { getMessageIcon } from './icon';
import type {
  ArgsProps,
  ConfigOptions,
  JointContent,
  MessageInstance,
  MessageType,
  NoticeType,
  TypeOpen,
} from './interface';
import { getMotion, wrapPromiseFn } from './util';

const DEFAULT_OFFSET = 8;
const DEFAULT_DURATION = 3;
const DEFAULT_STACK_CONFIG = false;

// ==============================================================================
// ==                                  Holder                                  ==
// ==============================================================================

/** 内核实例暴露的方法（+ 本组件要往外传的 `prefixCls`）。 */
interface HolderRef {
  open: (config: Partial<NoticeListConfig>) => void;
  close: (key: string | number) => void;
  destroy: () => void;
  prefixCls?: string;
}

const Holder = defineComponent({
  name: 'AMessageHolder',
  inheritAttrs: false,
  props: {
    top: { type: [String, Number] as PropType<ConfigOptions['top']>, default: undefined },
    prefixCls: { type: String, default: undefined },
    getContainer: { type: Function as PropType<ConfigOptions['getContainer']>, default: undefined },
    maxCount: { type: Number, default: undefined },
    duration: { type: Number, default: undefined },
    rtl: { type: Boolean, default: undefined },
    classNames: { type: Object as PropType<ConfigOptions['classNames']>, default: undefined },
    styles: { type: Object as PropType<ConfigOptions['styles']>, default: undefined },
    transitionName: { type: String, default: undefined },
    pauseOnHover: { type: Boolean, default: undefined },
    stack: { type: [Boolean, Object] as PropType<ConfigOptions['stack']>, default: undefined },
    onAllRemoved: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props, { expose }) {
    const config = useComponentConfig<
      ConfigOptions & { className?: string; style?: import('vue').CSSProperties }
    >('message');
    const theme = useMessageTheme();
    provideNoticeZIndex(
      () => theme.token.value.zIndexPopup,
      () => config.style?.zIndex ?? props.styles?.list?.zIndex ?? config.styles?.list?.zIndex,
    );
    const prefixCls = computed(() => props.prefixCls || config.getPrefixCls('message'));

    const stackConfig = useStackConfig(
      () => props.stack ?? config.stack,
      () => DEFAULT_STACK_CONFIG,
    );

    const { api, holder } = useNotification({
      prefixCls: () => prefixCls.value,
      style: () => ({
        ...theme.style.value,
        ...config.style,
        ...getPlacementOffsetStyle(props.top ?? config.top ?? DEFAULT_OFFSET),
      }),
      className: () =>
        clsx(
          config.className,
          (props.rtl ?? config.rtl ?? config.direction === 'rtl')
            ? `${prefixCls.value}-rtl`
            : undefined,
        ),
      motion: () => getMotion(prefixCls.value, props.transitionName),
      closable: false,
      // ⚠️ 这几个必须是 **getter**（Issue #45）：`useNotification` 在 setup 期把
      //    根配置解构成常量 ⇒ 传裸值会被钉死，「holder 建好之后再改配置」
      //    （`message.config({ maxCount })` 等）就传不进内核。
      //    `style` / `className` / `motion` / `getContainer` 本来就是 getter，同判。
      duration: () => props.duration ?? config.duration ?? DEFAULT_DURATION,
      getContainer: () => props.getContainer?.() ?? config.getPopupContainer?.() ?? document.body,
      maxCount: () => props.maxCount ?? config.maxCount,
      onAllRemoved: () => props.onAllRemoved?.(),
      classNames: () => mergeClassNames(config.classNames, props.classNames),
      styles: () => mergeStyles(config.styles, props.styles),
      pauseOnHover: () => props.pauseOnHover ?? config.pauseOnHover ?? true,
      stack: () => stackConfig.value,
    });

    expose({
      ...api,
      get prefixCls() {
        return prefixCls.value;
      },
    });

    return () => holder();
  },
});

// ==============================================================================
// ==                                   Hook                                   ==
// ==============================================================================

let keyIndex = 0;
function isMessageConfig(value: JointContent): value is ArgsProps {
  return isPlainObject(value) && !isVNode(value) && 'content' in value;
}

export function useInternalMessage(
  messageConfig?: MaybeRefOrGetter<ConfigOptions | undefined>,
): readonly [MessageInstance, () => VNode] {
  const holderRef = shallowRef<HolderRef | null>(null);
  let disposed = false;
  let queue: Array<(instance: HolderRef) => void> = [];
  const settlements = new Set<() => void>();
  const submit = (action: (instance: HolderRef) => void) => {
    if (disposed) return;
    if (holderRef.value) action(holderRef.value);
    else queue.push(action);
  };
  watch(
    holderRef,
    (instance) => {
      if (!instance) return;
      const pending = queue;
      queue = [];
      for (const action of pending) action(instance);
    },
    { flush: 'post' },
  );
  onScopeDispose(() => {
    disposed = true;
    queue = [];
    for (const settle of [...settlements]) settle();
  });
  const close = (key: string | number) => submit((instance) => instance.close(key));

  const open = (input: ArgsProps): MessageType => {
    const config = { ...input };
    const mergedKey = config.key ?? `apollo-message-${++keyIndex}`;
    return wrapPromiseFn((resolve) => {
      let submitted = false;
      let canceled = false;
      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        settlements.delete(settle);
        resolve();
      };
      settlements.add(settle);
      if (disposed) settle();
      else
        submit((instance) => {
          if (canceled) return;
          submitted = true;
          const prefixCls = () => instance.prefixCls ?? 'apollo-message';
          const noticePrefixCls = () => `${prefixCls()}-notice`;

          const {
            content,
            icon,
            type,
            key,
            className,
            style,
            onClose,
            classNames: configClassNames = {},
            styles = {},
            ...restConfig
          } = config;

          const iconNode = getMessageIcon(type, icon);

          instance.open({
            ...restConfig,
            key: mergedKey,
            icon: iconNode,
            title: content,
            classNames: {
              ...configClassNames,
              get wrapper() {
                return clsx(type ? `${prefixCls()}-${type}` : undefined, configClassNames.wrapper);
              },
              get icon() {
                return clsx(
                  type ? `${noticePrefixCls()}-icon-${type}` : undefined,
                  configClassNames.icon,
                );
              },
            },
            styles,
            placement: 'top',
            className: () => clsx(type ? `${noticePrefixCls()}-${type}` : undefined, className),
            style,
            onClose,
            onRemoved: settle,
          });
        });
      return () => {
        if (!submitted) {
          canceled = true;
          settle();
        } else close(mergedKey);
      };
    });
  };

  const destroy = (key?: string | number): void => {
    if (key !== undefined) {
      close(key);
    } else {
      submit((instance) => instance.destroy());
    }
  };

  const typeMethod = (type: NoticeType): TypeOpen => {
    const typeOpen: TypeOpen = (jointContent, duration, onClose) => {
      let config: ArgsProps;
      if (isMessageConfig(jointContent)) {
        config = jointContent;
      } else {
        config = { content: jointContent };
      }

      // 第二参传函数 ⇒ 视为 onClose（第三参被忽略）
      let mergedDuration: number | undefined;
      let mergedOnClose: (() => void) | undefined;
      if (typeof duration === 'function') {
        mergedOnClose = duration;
      } else {
        mergedDuration = duration;
        mergedOnClose = onClose;
      }

      return open({
        onClose: mergedOnClose,
        duration: mergedDuration,
        ...config,
        type,
      });
    };
    return typeOpen;
  };
  const clone: MessageInstance = {
    open,
    destroy,
    info: typeMethod('info'),
    success: typeMethod('success'),
    warning: typeMethod('warning'),
    error: typeMethod('error'),
    loading: typeMethod('loading'),
  };

  const holderFactory = (): VNode =>
    h(Holder, {
      ref: holderRef,
      ...(toValue(messageConfig) ?? {}),
    });

  return [clone, holderFactory] as const;
}

export default function useMessage(
  messageConfig?: MaybeRefOrGetter<ConfigOptions | undefined>,
): readonly [MessageInstance, () => VNode] {
  return useInternalMessage(messageConfig);
}
