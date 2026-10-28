/** Native alert content, current configuration and one owned close lifecycle. */
import {
  CheckCircleFilled,
  CloseCircleFilled,
  CloseOutlined,
  ExclamationCircleFilled,
  InfoCircleFilled,
} from '@apollo-design/icons';
import { CSSMotion, type MotionHooks } from '@apollo-design/motion';
import { isEmptyVNode, mergeDomAttrs, pickAttrs, useDevWarning } from '@apollo-design/utils';
import {
  defineComponent,
  getCurrentInstance,
  h,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
  type SlotsType,
  shallowRef,
  type VNodeChild,
  watchEffect,
} from 'vue';
import {
  mergeClassNames,
  mergeStyles,
  resolveSemantic,
  semanticRootStyle,
  styleAttrs,
} from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import type {
  AlertClosable,
  AlertConfig,
  AlertProps,
  AlertSemanticClassNames,
  AlertSemanticStyles,
  AlertSlots,
  AlertType,
  AlertVariant,
} from './interface';
import { useAlertTheme } from './use-alert-theme';

const closeOptions = (value: AlertProps['closable']): AlertClosable | undefined =>
  typeof value === 'object' && value !== null ? value : undefined;

export default defineComponent({
  name: 'AAlert',
  inheritAttrs: false,
  slots: Object as SlotsType<AlertSlots>,
  props: {
    type: { type: String as PropType<AlertType>, default: undefined },
    variant: { type: String as PropType<AlertVariant>, default: undefined },
    closable: { type: [Boolean, Object] as PropType<AlertProps['closable']>, default: undefined },
    closeText: { type: String, default: undefined },
    title: { type: String, default: undefined },
    message: { type: String, default: undefined },
    description: { type: String, default: undefined },
    onClose: { type: Function as PropType<(event: MouseEvent) => void>, default: undefined },
    onAfterClose: { type: Function as PropType<() => void>, default: undefined },
    afterClose: { type: Function as PropType<() => void>, default: undefined },
    showIcon: { type: Boolean, default: undefined },
    prefixCls: { type: String, default: undefined },
    role: { type: String, default: 'alert' },
    banner: { type: Boolean, default: false },
    closeIcon: {
      type: [String, Boolean, Number] as PropType<AlertProps['closeIcon']>,
      default: undefined,
    },
    id: { type: String, default: undefined },
    onMouseenter: { type: Function as PropType<(event: MouseEvent) => void>, default: undefined },
    onMouseleave: { type: Function as PropType<(event: MouseEvent) => void>, default: undefined },
    onClick: { type: Function as PropType<(event: MouseEvent) => void>, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<AlertProps['classNames']>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<AlertProps['styles']>, default: undefined },
  },
  emits: {
    close: (_event: MouseEvent) => true,
    afterClose: () => true,
  },
  setup(props, { attrs, expose, slots, emit }) {
    const instance = getCurrentInstance();
    const config = useComponentConfig<AlertConfig>('alert');
    const direction = useDirection();
    const prefix = () => config.getPrefixCls('alert', props.prefixCls);
    const theme = useAlertTheme(prefix);
    const rootRef = shallowRef<HTMLDivElement | null>(null);
    const closed = ref(false);
    const reducedMotion = ref(false);
    let media: MediaQueryList | undefined;
    const onPreference = (event: MediaQueryListEvent) => {
      reducedMotion.value = event.matches;
    };
    onMounted(() => {
      if (typeof window.matchMedia !== 'function') return;
      media = window.matchMedia('(prefers-reduced-motion: reduce)');
      reducedMotion.value = media.matches;
      media.addEventListener('change', onPreference);
    });
    let active = true;
    onBeforeUnmount(() => {
      active = false;
      media?.removeEventListener('change', onPreference);
    });
    expose({
      get nativeElement() {
        return rootRef.value;
      },
    });

    const warning = useDevWarning('Alert');
    watchEffect(() => {
      warning.deprecated(props.closeText === undefined, 'closeText', 'closable.closeIcon');
      warning.deprecated(props.message === undefined, 'message', 'title');
    });
    const options = () => closeOptions(props.closable ?? config.closable);
    const isEventListener = (name: string, notify: unknown) =>
      [instance?.vnode.props?.[name], instance?.vnode.props?.[`${name}Once`]].some(
        (listener) => listener === notify || (Array.isArray(listener) && listener.includes(notify)),
      );
    const handleClose = (event: MouseEvent) => {
      if (closed.value) return;
      closed.value = true;
      const notify = options()?.onClose;
      emit('close', event);
      if (typeof notify === 'function' && !isEventListener('onClose', notify)) notify(event);
    };
    let completed = false;
    const onVisibleChanged = (visible: boolean) => {
      if (!active || visible || !closed.value || completed) return;
      completed = true;
      const notify = options()?.afterClose ?? props.afterClose;
      emit('afterClose');
      if (typeof notify === 'function' && !isEventListener('onAfterClose', notify)) notify();
    };
    const hooks: MotionHooks = {
      onLeaveStart: (element) => ({
        maxHeight: `${element?.getBoundingClientRect().height ?? 0}px`,
      }),
    };

    return () => {
      const cls = prefix();
      const type = props.type ?? (props.banner ? 'warning' : 'info');
      const variant = props.variant ?? config.variant ?? 'outlined';
      const title = slots.title ? slots.title() : (props.title ?? props.message);
      const description = slots.description ? slots.description() : props.description;
      const action = slots.action?.();
      const hasTitle = !isEmptyVNode(title);
      const hasDescription = !isEmptyVNode(description);
      const hasAction = !isEmptyVNode(action);
      const configuredIcons: Record<AlertType, VNodeChild> = {
        success: config.successIcon ?? h(CheckCircleFilled),
        info: config.infoIcon ?? h(InfoCircleFilled),
        warning: config.warningIcon ?? h(ExclamationCircleFilled),
        error: config.errorIcon ?? h(CloseCircleFilled),
      };
      const icon = slots.icon ? slots.icon() : configuredIcons[type];
      const wantsIcon = props.showIcon ?? props.banner;
      const hasIcon = wantsIcon && !isEmptyVNode(icon);
      const localOptions = closeOptions(props.closable);
      const providerOptions = closeOptions(config.closable);
      const slotCloseIcon = slots.closeIcon?.();
      const closable = localOptions
        ? true
        : props.closeText
          ? true
          : typeof props.closable === 'boolean'
            ? props.closable
            : props.closeIcon !== undefined
              ? props.closeIcon !== false && props.closeIcon !== null
              : slots.closeIcon && !isEmptyVNode(slotCloseIcon)
                ? true
                : Boolean(config.closable);
      const closeIcon = slots.closeIcon
        ? slotCloseIcon
        : localOptions?.closeIcon !== undefined
          ? localOptions.closeIcon
          : props.closeText
            ? props.closeText
            : props.closeIcon !== undefined
              ? props.closeIcon
              : providerOptions?.closeIcon !== undefined
                ? providerOptions.closeIcon
                : config.closeIcon;
      const semanticProps: AlertProps = {
        ...props,
        type,
        variant,
        prefixCls: cls,
        role: props.role,
        showIcon: hasIcon,
        closable,
      };
      const info = { props: semanticProps };
      // Resolve during the Vue render: slot presence and attrs-only updates are not refs.
      const classNames = mergeClassNames<AlertSemanticClassNames>(
        resolveSemantic(config.classNames, info),
        resolveSemantic(props.classNames, info),
      );
      const styles = mergeStyles<AlertSemanticStyles>(
        resolveSemantic(config.styles, info),
        semanticRootStyle(config.style),
        resolveSemantic(props.styles, info),
      );
      const attributeOptions = props.closable === undefined ? providerOptions : localOptions;
      const closeAttrs = attributeOptions
        ? pickAttrs(attributeOptions, { aria: true, data: true })
        : {};
      const alertAttrs = mergeDomAttrs(
        {
          id: props.id,
          role: props.role,
          class: [
            cls,
            `${cls}-${type}`,
            `${cls}-${variant}`,
            {
              [`${cls}-with-description`]: hasDescription,
              [`${cls}-no-icon`]: !hasIcon,
              [`${cls}-banner`]: props.banner,
              [`${cls}-rtl`]: direction.value === 'rtl',
            },
            config.className,
            classNames.root,
          ],
          ...styleAttrs({ ...theme.styles.value, ...styles.root }),
          onClick: props.onClick,
          onMouseenter: props.onMouseenter,
          onMouseleave: props.onMouseleave,
        },
        attrs,
      );
      alertAttrs.ref = rootRef;
      alertAttrs['data-show'] = !closed.value;
      return h(
        CSSMotion,
        {
          visible: !closed.value,
          motionName: `${cls}-motion`,
          motionAppear: false,
          motionEnter: false,
          supportMotion: theme.motion.value && !reducedMotion.value ? undefined : false,
          hooks,
          onVisibleChanged,
        },
        {
          default: ({
            className,
            style,
          }: {
            className: string;
            style: Record<string, string | number> | null;
          }) =>
            h('div', mergeDomAttrs(alertAttrs, { class: className, ...(style ? { style } : {}) }), [
              hasIcon
                ? h(
                    'span',
                    {
                      class: [`${cls}-icon`, classNames.icon],
                      ...styleAttrs(styles.icon),
                      ...(!slots.icon && config[`${type}Icon`] == null
                        ? { 'aria-hidden': true }
                        : {}),
                    },
                    [icon],
                  )
                : null,
              h(
                'div',
                { class: [`${cls}-section`, classNames.section], ...styleAttrs(styles.section) },
                [
                  hasTitle
                    ? h(
                        'div',
                        { class: [`${cls}-title`, classNames.title], ...styleAttrs(styles.title) },
                        [title],
                      )
                    : null,
                  hasDescription
                    ? h(
                        'div',
                        {
                          class: [`${cls}-description`, classNames.description],
                          ...styleAttrs(styles.description),
                        },
                        [description],
                      )
                    : null,
                ],
              ),
              hasAction
                ? h(
                    'div',
                    {
                      class: [`${cls}-actions`, classNames.actions],
                      ...styleAttrs(styles.actions),
                    },
                    [action],
                  )
                : null,
              closable
                ? h(
                    'button',
                    {
                      type: 'button',
                      tabindex: 0,
                      disabled: closed.value,
                      onClick: handleClose,
                      class: [`${cls}-close-icon`, classNames.close],
                      ...styleAttrs(styles.close),
                      'aria-label': 'Close',
                      ...closeAttrs,
                    },
                    closeIcon === true || closeIcon === undefined
                      ? h(CloseOutlined, { 'aria-hidden': true })
                      : [closeIcon],
                  )
                : null,
            ]),
        },
      );
    };
  },
});
