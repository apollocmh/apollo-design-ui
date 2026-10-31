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
import { computeClosable } from '../_internal/use-closable';
import { mergeClassNames, mergeStyles } from '../_internal/use-merge-semantic';
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
import { provideNoticeZIndex, useNotificationTheme } from './use-notice-theme';
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
      default: undefined,
    },
    pauseOnHover: { type: Boolean, default: undefined },
    showProgress: { type: Boolean, default: undefined },
    classNames: {
      type: Object as PropType<NotificationConfig['classNames']>,
      default: undefined,
    },
    styles: { type: Object as PropType<NotificationConfig['styles']>, default: undefined },
    onAllRemoved: { type: Function as PropType<() => void>, default: undefined },
  },
  setup(props, { expose }) {
    const config = useComponentConfig<
      NotificationConfig & { className?: string; style?: import('vue').CSSProperties }
    >('notification');
    const theme = useNotificationTheme();
    provideNoticeZIndex(
      () => theme.token.value.zIndexPopup,
      () => config.style?.zIndex ?? props.styles?.list?.zIndex ?? config.styles?.list?.zIndex,
    );
    const prefixCls = computed(() => props.prefixCls || config.getPrefixCls('notification'));
    // ⚠️ 必须用**响应式**变体（Issue #47）：把 `closeLabel` 拍成 setup 期常量的话，
    //    运行时切语言后**新开**的通知仍拿旧文案。上游的 React 版没有这个问题 ——
    //    `useImperativeHandle(ref, () => ({ ..., closeLabel: contextLocale.close }))`
    //    **没有依赖数组** ⇒ 每次 render 重建 imperative handle ⇒ 每次 `open()` 都现读。
    //    本仓的等价物：`closeLabel` 做成 computed + expose 上挂 getter（见下方 `expose`）。
    const [locale] = useLocale('global');
    const closeLabel = computed(() => locale.value?.close ?? 'Close');

    const mergedDuration = computed(() => {
      const duration = props.duration ?? config.duration ?? DEFAULT_DURATION;
      return isNumber(duration) && duration > 0 ? duration : false;
    });

    const stackConfig = useStackConfig(
      () => props.stack ?? config.stack,
      () => DEFAULT_STACK_CONFIG,
    );

    const { api, holder } = useKernelNotification({
      prefixCls: () => prefixCls.value,
      style: () => ({
        ...theme.style.value,
        ...config.style,
        ...getPlacementOffsetStyle(props.top ?? config.top, props.bottom ?? config.bottom),
      }),
      className: () =>
        clsx(
          config.className,
          (props.rtl ?? config.rtl ?? config.direction === 'rtl')
            ? `${prefixCls.value}-rtl`
            : undefined,
        ),
      motion: () => getMotion(prefixCls.value),
      closable: () => ({ closeIcon: getCloseIcon(prefixCls.value) }),
      // ⚠️ 这几个必须是 **getter**（Issue #46，与 message #45 同判）：`useNotification`
      //    在 setup 期把根配置解构成常量 ⇒ 传裸值会被钉死，「holder 建好之后再改配置」
      //    （`notification.config({ maxCount })` 等）就传不进内核。
      //    `style` / `className` / `motion` / `getContainer` 本来就是 getter，同判。
      duration: () => mergedDuration.value,
      getContainer: () => props.getContainer?.() ?? config.getPopupContainer?.() ?? document.body,
      maxCount: () => props.maxCount ?? config.maxCount,
      pauseOnHover: () => props.pauseOnHover ?? config.pauseOnHover ?? true,
      showProgress: () => props.showProgress ?? config.showProgress,
      classNames: () => mergeClassNames(config.classNames, props.classNames),
      styles: () => mergeStyles(config.styles, props.styles),
      onAllRemoved: () => props.onAllRemoved?.(),
      stack: () => stackConfig.value,
    });

    // ⚠️ `closeLabel` 必须是 **getter**（Issue #47）：`useInternalNotification.open()` 在每次
    //    调用时现读 `instance.closeLabel` ⇒ 只有 getter 才能拿到「切语言后」的新文案。
    expose({
      ...api,
      get prefixCls() {
        return prefixCls.value;
      },
      get closeLabel() {
        return closeLabel.value;
      },
    });

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
  let disposed = false;
  let queue: Array<(instance: HolderRef) => void> = [];
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
  });
  const open = (input: ArgsProps): void => {
    const config = { ...input };
    submit((instance) => {
      const prefixCls = () => instance.prefixCls ?? 'apollo-notification';
      const noticePrefixCls = () => `${prefixCls()}-notice`;

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

      const configValue = () => toValue(notificationConfig) ?? {};
      // Keep the notice's explicit options and content, and derive only Provider defaults
      // at render time. Reopening a key still goes through the normal update/timer path.
      const mergedClosable = () => {
        // ArgsProps documents null as an explicit request to hide the close button.
        if (closable === null) return false;
        const closeLabel = instance.closeLabel ?? 'Close';
        const realCloseIcon = getCloseIcon(
          noticePrefixCls(),
          getCloseIconConfig(closeIcon, configValue(), undefined),
        );
        const result = computeClosable({ ...configValue(), ...config }, undefined, {
          closable: true,
          closeIcon: realCloseIcon,
          closeIconRender: (node) =>
            isVNode(node) ? getCloseIconWithLabel(noticePrefixCls(), node, closeLabel) : node,
          closeLabel,
        });
        return result.closable
          ? {
              onClose: isPlainObject(closable) ? closable.onClose : undefined,
              closeIcon: result.closeIconNode,
              disabled: result.closeBtnIsDisabled,
              ...result.ariaProps,
            }
          : false;
      };

      const iconNode = icon !== undefined ? icon : type ? h(TypeIcon[type]) : null;

      instance.open({
        placement: configValue().placement ?? DEFAULT_PLACEMENT,
        ...restConfig,
        title: hasTitle ? mergedTitle : null,
        description,
        icon: iconNode,
        actions: mergedActions,
        role,
        classNames: {
          ...configClassNames,
          get icon() {
            return clsx(
              icon === undefined && type ? `${noticePrefixCls()}-icon-${type}` : undefined,
              configClassNames.icon,
            );
          },
        },
        styles,
        className: () => clsx(type ? `${noticePrefixCls()}-${type}` : undefined, className),
        style,
        closable: mergedClosable,
      });
    });
  };

  const destroy = (key?: string | number): void => {
    if (key !== undefined) {
      submit((instance) => instance.close(key));
    } else {
      submit((instance) => instance.destroy());
    }
  };

  const clone: NotificationInstance = {
    open,
    destroy,
    success: (config) => open({ ...config, type: 'success' }),
    info: (config) => open({ ...config, type: 'info' }),
    warning: (config) => open({ ...config, type: 'warning' }),
    error: (config) => open({ ...config, type: 'error' }),
  };

  const holderFactory = (): VNode =>
    h(Holder, {
      ref: holderRef,
      ...(toValue(notificationConfig) ?? {}),
    });

  return [clone, holderFactory] as const;
}

export default function useNotification(
  notificationConfig?: MaybeRefOrGetter<NotificationConfig | undefined>,
): readonly [NotificationInstance, () => VNode] {
  return useInternalNotification(notificationConfig);
}

export type { GlobalConfigProps };
