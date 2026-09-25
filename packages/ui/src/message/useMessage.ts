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
  defineComponent,
  h,
  type MaybeRefOrGetter,
  type PropType,
  shallowRef,
  toValue,
  type VNode,
} from 'vue';

import { useComponentConfig } from '../config-provider/context';
import { useNotification } from '../notification/engine';
import { clsx } from '../notification/engine/util';
import { useStackConfig } from '../notification/hooks/useStackConfig';
import type { NoticeListConfig } from '../notification/interface';
import { getPlacementOffsetStyle } from '../notification/util';
import { getMessageIcon } from './icon';
import type {
  ArgsProps,
  ConfigOptions,
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
    duration: { type: Number, default: DEFAULT_DURATION },
    rtl: { type: Boolean, default: undefined },
    classNames: { type: Object as PropType<ConfigOptions['classNames']>, default: undefined },
    styles: { type: Object as PropType<ConfigOptions['styles']>, default: undefined },
    transitionName: { type: String, default: undefined },
    pauseOnHover: { type: Boolean, default: true },
    stack: { type: [Boolean, Object] as PropType<ConfigOptions['stack']>, default: undefined },
    onAllRemoved: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props, { expose }) {
    const config = useComponentConfig('message');
    const prefixCls = props.prefixCls || config.getPrefixCls('message');

    const stackConfig = useStackConfig(
      () => props.stack,
      () => DEFAULT_STACK_CONFIG,
    );

    const { api, holder } = useNotification({
      prefixCls,
      style: () => getPlacementOffsetStyle(props.top ?? DEFAULT_OFFSET),
      className: () =>
        clsx((props.rtl ?? config.direction === 'rtl') ? `${prefixCls}-rtl` : undefined),
      motion: () => getMotion(prefixCls, props.transitionName),
      closable: false,
      duration: props.duration,
      getContainer: () =>
        props.getContainer?.() ??
        (config.getPopupContainer as (() => HTMLElement) | undefined)?.() ??
        document.body,
      maxCount: props.maxCount,
      onAllRemoved: props.onAllRemoved,
      classNames: props.classNames as never,
      styles: props.styles as never,
      pauseOnHover: props.pauseOnHover,
      stack: stackConfig.value,
    });

    expose({ ...api, prefixCls });

    return () => holder();
  },
});

// ==============================================================================
// ==                                   Hook                                   ==
// ==============================================================================

let keyIndex = 0;

export function useInternalMessage(
  messageConfig?: MaybeRefOrGetter<ConfigOptions | undefined>,
): readonly [MessageInstance, () => VNode] {
  const holderRef = shallowRef<HolderRef | null>(null);

  const close = (key: string | number): void => {
    holderRef.value?.close(key);
  };

  const open = (config: ArgsProps): MessageType => {
    const instance = holderRef.value;
    if (!instance) {
      // 与上游同判：在 render 期调用拿不到实例 ⇒ 返回一个空壳（不抛错）
      const fakeResult = (() => {}) as MessageType;
      fakeResult.then = (() => Promise.resolve(false)) as MessageType['then'];
      fakeResult.promise = Promise.resolve(false);
      return fakeResult;
    }

    const { prefixCls = 'apollo-message' } = instance;
    const noticePrefixCls = `${prefixCls}-notice`;

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

    let mergedKey: string | number = key as string | number;
    if (mergedKey === null || mergedKey === undefined) {
      keyIndex += 1;
      mergedKey = `apollo-message-${keyIndex}`;
    }

    const iconNode = getMessageIcon(type, icon);
    const typeIconCls = type ? `${noticePrefixCls}-icon-${type}` : undefined;

    return wrapPromiseFn((resolve) => {
      instance.open({
        ...(restConfig as Partial<NoticeListConfig>),
        key: mergedKey,
        icon: iconNode,
        title: content,
        classNames: {
          ...configClassNames,
          wrapper: clsx(type ? `${prefixCls}-${type}` : undefined, configClassNames.wrapper),
          icon: clsx(typeIconCls, configClassNames.icon),
        } as never,
        styles: styles as never,
        placement: 'top',
        className: clsx(type ? `${noticePrefixCls}-${type}` : undefined, className),
        style,
        onClose: () => {
          onClose?.();
          resolve();
        },
      });

      return () => {
        close(mergedKey);
      };
    });
  };

  const destroy = (key?: string | number): void => {
    if (key !== undefined) {
      close(key);
    } else {
      holderRef.value?.destroy();
    }
  };

  const clone = { open, destroy } as MessageInstance;

  const keys: NoticeType[] = ['info', 'success', 'warning', 'error', 'loading'];
  for (const type of keys) {
    const typeOpen: TypeOpen = (jointContent, duration, onClose) => {
      let config: ArgsProps;
      if (isPlainObject(jointContent) && 'content' in (jointContent as ArgsProps)) {
        config = jointContent as ArgsProps;
      } else {
        config = { content: jointContent as ArgsProps['content'] };
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
    clone[type] = typeOpen;
  }

  const holderFactory = (): VNode =>
    h(Holder, {
      ref: holderRef,
      ...((toValue(messageConfig) ?? {}) as Record<string, unknown>),
    } as never);

  return [clone, holderFactory] as const;
}

export default function useMessage(
  messageConfig?: MaybeRefOrGetter<ConfigOptions | undefined>,
): readonly [MessageInstance, () => VNode] {
  return useInternalMessage(messageConfig);
}
