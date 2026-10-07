/**
 * `useNotification` —— antd `components/notification/useNotification.tsx` 的 Vue 版。
 *
 * `Holder`（把 notification 的配置翻译成内核 props）+ `useInternalNotification`
 * （把内核的 `open/close/destroy` 包成 `NotificationInstance`）。
 *
 * 逐条对齐上游：
 *   1. `DEFAULT_DURATION = 4.5`、`DEFAULT_PLACEMENT = 'topRight'`、
 *      **`DEFAULT_STACK_CONFIG = { offset: 8 }`（notification 默认就堆叠）**；
 *   2. `duration` 归一化：`isNumber(d) && d > 0 ? d : false`（`0`/`false`/`null` ⇒ 不自动关）；
 *   3. `closable` 默认 **true**（`CloseOutlined` + `{p}-close-icon` 类）；
 *   4. `closeLabel` 取 locale 的 `global.close`（默认 `'Close'`）⇒ 关闭按钮的可访问名；
 *   5. `role` 默认 `'alert'`；`-notice-icon-{type}` 类**只在没有自定义 icon 时**叠加；
 *   6. `placement` 优先级：单条 > 全局 > `'topRight'`；
 *   7. **`open()` 返回 `void`**（notification 没有 message 的 thenable 句柄）；
 *   8. `getContainer` 三级：`notificationConfig.getContainer` →
 *      `ConfigProvider.getPopupContainer` → `document.body`。
 *
 * ⚠️ 平台差异（与 message 同判，见 D96）：不实现 `renderNotifications` 的 `-css-var` 包裹
 *    （本仓无 cssinjs 的 hash/`-css-var` 类机制；组件变量由静态 CSS 的声明块提供）。
 */

import { useLocale } from '@apollo-design/locale';
import { isNumber, isPlainObject, isRenderable } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  type MaybeRefOrGetter,
  type PropType,
  shallowRef,
  toValue,
  type VNode,
} from 'vue';
import { clsx } from '../_internal/clsx';
import { computeClosable, pickClosable } from '../_internal/use-closable';
import { useComponentConfig } from '../config-provider/context';
import { useNotification as useKernelNotification } from './engine';
import { useStackConfig } from './hooks/useStackConfig';
import { getCloseIcon, getCloseIconWithLabel, TypeIcon } from './icon';
import type {
  ArgsProps,
  GlobalConfigProps,
  NotificationConfig,
  NotificationInstance,
  NotificationPlacement,
} from './interface';
import { getCloseIconConfig, getMotion, getPlacementOffsetStyle } from './util';

const DEFAULT_DURATION = 4.5;
const DEFAULT_PLACEMENT: NotificationPlacement = 'topRight';
const DEFAULT_STACK_CONFIG = { offset: 8 };

// ==============================================================================
// ==                                  Holder                                  ==
// ==============================================================================

interface HolderRef {
  open: (config: Partial<import('./engine/interface').NoticeListConfig>) => void;
  close: (key: string | number) => void;
  destroy: () => void;
  prefixCls?: string;
  closeLabel?: string;
}

const Holder = defineComponent({
  name: 'ANotificationHolder',
  inheritAttrs: false,
  props: {
    top: { type: Number, default: undefined },
    bottom: { type: Number, default: undefined },
    prefixCls: { type: String, default: undefined },
    getContainer: {
      type: Function as PropType<NotificationConfig['getContainer']>,
      default: undefined,
    },
    maxCount: { type: Number, default: undefined },
    rtl: { type: Boolean, default: undefined },
    stack: { type: [Boolean, Object] as PropType<NotificationConfig['stack']>, default: undefined },
    duration: {
      type: [Number, Boolean] as PropType<NotificationConfig['duration']>,
      default: DEFAULT_DURATION,
    },
    pauseOnHover: { type: Boolean, default: true },
    showProgress: { type: Boolean, default: undefined },
    classNames: {
      type: Object as PropType<NotificationConfig['classNames']>,
      default: undefined,
    },
    styles: { type: Object as PropType<NotificationConfig['styles']>, default: undefined },
    onAllRemoved: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props, { expose }) {
    const config = useComponentConfig('notification');
    const prefixCls = props.prefixCls || config.getPrefixCls('notification');
    const [locale] = useLocale('global');
    const closeLabel = locale?.close ?? 'Close';

    const mergedDuration = computed(() =>
      isNumber(props.duration) && props.duration > 0 ? props.duration : false,
    );

    const stackConfig = useStackConfig(
      () => props.stack,
      () => DEFAULT_STACK_CONFIG,
    );

    const { api, holder } = useKernelNotification({
      prefixCls,
      style: () => getPlacementOffsetStyle(props.top, props.bottom),
      className: () =>
        clsx((props.rtl ?? config.direction === 'rtl') ? `${prefixCls}-rtl` : undefined),
      motion: () => getMotion(prefixCls),
      closable: { closeIcon: getCloseIcon(prefixCls) },
      duration: mergedDuration.value,
      getContainer: () =>
        props.getContainer?.() ??
        (config.getPopupContainer as (() => HTMLElement) | undefined)?.() ??
        document.body,
      maxCount: props.maxCount,
      pauseOnHover: props.pauseOnHover,
      showProgress: props.showProgress,
      classNames: props.classNames as never,
      styles: props.styles as never,
      onAllRemoved: props.onAllRemoved,
      stack: stackConfig.value,
    });

    expose({ ...api, prefixCls, closeLabel });

    return () => holder();
  },
});

// ==============================================================================
// ==                                   Hook                                   ==
// ==============================================================================

export function useInternalNotification(
  notificationConfig?: MaybeRefOrGetter<NotificationConfig | undefined>,
): readonly [NotificationInstance, () => VNode] {
  const holderRef = shallowRef<HolderRef | null>(null);

  const open = (config: ArgsProps): void => {
    const instance = holderRef.value;
    // 与上游同判：在 render 期调用拿不到实例 ⇒ 直接返回（dev 下上游会告警，本仓无该基建）
    if (!instance) return;

    const { prefixCls = 'apollo-notification', closeLabel = 'Close' } = instance;
    const noticePrefixCls = `${prefixCls}-notice`;

    const {
      title,
      message,
      description,
      icon,
      type,
      btn,
      actions,
      className,
      style,
      role = 'alert',
      closeIcon,
      closable,
      classNames: configClassNames = {},
      styles = {},
      ...restConfig
    } = config;

    const mergedTitle = title ?? message;
    const hasTitle = isRenderable(mergedTitle);
    const mergedActions = actions ?? btn;

    const configValue = toValue(notificationConfig) ?? {};
    const realCloseIcon = getCloseIcon(
      noticePrefixCls,
      getCloseIconConfig(closeIcon, configValue, undefined),
    );

    const closableResult = computeClosable(
      pickClosable({ ...(configValue as Record<string, unknown>), ...config }).value,
      undefined,
      {
        closable: true,
        closeIcon: realCloseIcon,
        closeIconRender: (node) =>
          getCloseIconWithLabel(noticePrefixCls, node as never, closeLabel),
        closeLabel,
      },
    );
    const mergedClosable = closableResult.closable
      ? {
          onClose: isPlainObject(closable) ? closable.onClose : undefined,
          closeIcon: closableResult.closeIconNode,
          ...closableResult.ariaProps,
        }
      : false;

    const iconNode = icon || (type ? h(TypeIcon[type]) : null);
    const typeIconCls = !icon && type ? `${noticePrefixCls}-icon-${type}` : undefined;

    instance.open({
      placement: configValue.placement ?? DEFAULT_PLACEMENT,
      ...(restConfig as Partial<import('./engine/interface').NoticeListConfig>),
      title: hasTitle ? mergedTitle : null,
      description,
      icon: iconNode,
      actions: mergedActions,
      role,
      classNames: {
        ...configClassNames,
        icon: clsx(typeIconCls, configClassNames.icon),
      } as never,
      styles: styles as never,
      className: clsx(type ? `${noticePrefixCls}-${type}` : undefined, className),
      style,
      closable: mergedClosable,
    });
  };

  const destroy = (key?: string | number): void => {
    if (key !== undefined) {
      holderRef.value?.close(key);
    } else {
      holderRef.value?.destroy();
    }
  };

  const clone = { open, destroy } as NotificationInstance;
  const keys = ['success', 'info', 'warning', 'error'] as const;
  for (const type of keys) {
    clone[type] = (config: ArgsProps) => open({ ...config, type });
  }

  const holderFactory = (): VNode =>
    h(Holder, {
      ref: holderRef,
      ...((toValue(notificationConfig) ?? {}) as Record<string, unknown>),
    } as never);

  return [clone, holderFactory] as const;
}

export default function useNotification(
  notificationConfig?: MaybeRefOrGetter<NotificationConfig | undefined>,
): readonly [NotificationInstance, () => VNode] {
  return useInternalNotification(notificationConfig);
}

export type { GlobalConfigProps };
