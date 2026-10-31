import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  InfoCircleFilled,
} from '@apollo-design/icons';
import { useLocale } from '@apollo-design/locale';
import { CONTAINER_MAX_OFFSET } from '@apollo-design/portal';
import { useTheme } from '@apollo-design/theme';
import { isFunction, isPlainObject, isRenderable } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, provide, type VNodeChild } from 'vue';
import { type MaskType, normalizeMaskConfig } from '../_internal/use-merged-mask';
import { useComponentConfig } from '../config-provider/context';
import CancelBtn from './components/ConfirmCancelBtn';
import OkBtn from './components/ConfirmOkBtn';
import { modalContextKey } from './context';
import type {
  AutoFocusButton,
  FocusableConfig,
  ModalAction,
  ModalButtonProps,
  ModalFooterExtra,
  ModalFuncProps,
  ModalGetContainer,
  ModalLocale,
  ModalProps,
  ModalSemanticType,
  ModalType,
} from './interface';
import Modal from './Modal';
import { fallbackProp } from './util';

/** 上游 `CONFIRM_OMIT_SEMANTIC_NAMES`：`body` 槽从 Modal 的语义里摘掉。 */
const CONFIRM_OMIT_SEMANTIC_NAMES = ['body'];

export const ConfirmContent = defineComponent({
  name: 'AConfirmContent',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    confirmPrefixCls: { type: String, required: true },
    type: { type: String as PropType<ModalType>, default: undefined },
    // 内部：由命令式/程序化 API 驱动，无模板上下文，VNode prop 合法
    icon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    okType: { type: String as PropType<import('./interface').ModalOkType>, default: undefined },
    confirmLoading: { type: Boolean, default: undefined },
    okCancel: { type: Boolean, default: undefined },
    // 内部：由命令式/程序化 API 驱动，无模板上下文，VNode prop 合法
    okText: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    // 内部：由命令式/程序化 API 驱动，无模板上下文，VNode prop 合法
    cancelText: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    // 内部：由命令式/程序化 API 驱动，无模板上下文，VNode prop 合法
    footer: {
      type: [String, Number, Object, Array, Function] as unknown as PropType<
        VNodeChild | ((originNode: VNodeChild, extra: ModalFooterExtra) => VNodeChild)
      >,
      default: undefined,
    },
    // 内部：由命令式/程序化 API 驱动，无模板上下文，VNode prop 合法
    title: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    // 内部：由命令式/程序化 API 驱动，无模板上下文，VNode prop 合法
    content: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    locale: {
      type: Object as PropType<Partial<ModalLocale>>,
      default: undefined,
    },
    autoFocusButton: {
      type: String as unknown as PropType<AutoFocusButton | undefined>,
      default: undefined,
    },
    focusable: {
      type: Object as PropType<FocusableConfig & { autoFocusButton?: AutoFocusButton }>,
      default: undefined,
    },
    contentClassName: { type: String, default: undefined },
    contentStyle: { type: Object as PropType<import('vue').CSSProperties>, default: undefined },
    okButtonProps: { type: Object as PropType<ModalButtonProps>, default: undefined },
    cancelButtonProps: { type: Object as PropType<ModalButtonProps>, default: undefined },
    closable: { type: [Boolean, Object] as PropType<ModalProps['closable']>, default: undefined },
    // 命令式路径透传
    close: { type: Function as PropType<(...args: unknown[]) => void>, default: undefined },
    onConfirm: { type: Function as PropType<(confirmed: boolean) => void>, default: undefined },
    onOk: { type: Function as PropType<ModalAction>, default: undefined },
    onCancel: { type: Function as PropType<ModalAction>, default: undefined },
    rootPrefixCls: { type: String, default: undefined },
    isSilent: { type: Function as PropType<() => boolean>, default: undefined },
  },
  setup(props, { attrs }) {
    const config = useComponentConfig<{
      infoIcon?: VNodeChild;
      successIcon?: VNodeChild;
      errorIcon?: VNodeChild;
      warningIcon?: VNodeChild;
    }>('modal');

    const [locale] = useLocale('Modal');
    const mergedLocale = computed(() => ({ ...locale.value, ...props.locale }));

    /** `okCancel ?? type === 'confirm'`。 */
    const mergedOkCancel = computed(() => props.okCancel ?? props.type === 'confirm');

    /** ⚠️ 显式 `null` ⇒ 不自动聚焦；未给 ⇒ `'ok'`。 */
    const mergedAutoFocusButton = computed<AutoFocusButton | undefined>(() => {
      const base =
        props.focusable?.autoFocusButton !== undefined
          ? props.focusable.autoFocusButton
          : props.autoFocusButton;
      return base || base === null ? base : 'ok';
    });

    const okTextLocale = computed(() =>
      fallbackProp(
        props.okText,
        mergedOkCancel.value ? mergedLocale.value?.okText : mergedLocale.value?.justOkText,
      ),
    );
    const cancelTextLocale = computed(() =>
      fallbackProp(props.cancelText, mergedLocale.value?.cancelText),
    );

    const onClose = computed(() => {
      const { closable } = props;
      return isPlainObject(closable) ? (closable as { onClose?: () => void }).onClose : undefined;
    });

    provide(
      modalContextKey,
      computed(() => ({
        autoFocusButton: mergedAutoFocusButton.value,
        confirmLoading: props.confirmLoading,
        cancelTextLocale: cancelTextLocale.value,
        okTextLocale: okTextLocale.value,
        mergedOkCancel: mergedOkCancel.value,
        onClose: onClose.value,
        isSilent: props.isSilent,
        rootPrefixCls: props.rootPrefixCls,
        close: props.close,
        onConfirm: props.onConfirm,
        actionOnOk: props.onOk,
        actionOnCancel: props.onCancel,
        okType: props.okType,
        okButtonProps: props.okButtonProps,
        cancelButtonProps: props.cancelButtonProps,
      })),
    );

    return () => {
      const { confirmPrefixCls, type } = props;

      // >>> Icon
      let mergedIcon = props.icon;
      if (props.icon === undefined) {
        switch (type) {
          case 'info':
            mergedIcon = fallbackProp(config.infoIcon, h(InfoCircleFilled));
            break;
          case 'success':
            mergedIcon = fallbackProp(config.successIcon, h(CheckCircleFilled));
            break;
          case 'error':
            mergedIcon = fallbackProp(config.errorIcon, h(CloseCircleFilled));
            break;
          default:
            mergedIcon = fallbackProp(config.warningIcon, h(ExclamationCircleFilled));
        }
      }

      const hasTitle = isRenderable(props.title);
      const hasIcon = isRenderable(mergedIcon);
      const bodyCls = `${confirmPrefixCls}-body`;

      const footerOriginNode: VNodeChild = [h(CancelBtn), h(OkBtn)];
      const footer = props.footer;

      const btnsNode =
        typeof footer === 'undefined' || isFunction(footer)
          ? h('div', { class: `${confirmPrefixCls}-btns` }, [
              isFunction(footer)
                ? footer(footerOriginNode, { OkBtn, CancelBtn })
                : footerOriginNode,
            ])
          : footer;

      return h('div', { class: `${confirmPrefixCls}-body-wrapper` }, [
        h(
          'div',
          {
            class: [
              bodyCls,
              hasTitle ? `${bodyCls}-has-title` : undefined,
              hasIcon ? undefined : `${bodyCls}-no-icon`,
            ]
              .filter(Boolean)
              .join(' '),
          },
          [
            mergedIcon,
            h('div', { class: `${confirmPrefixCls}-paragraph` }, [
              hasTitle ? h('span', { class: `${confirmPrefixCls}-title` }, [props.title]) : null,
              h(
                'div',
                {
                  class: [`${confirmPrefixCls}-content`, props.contentClassName]
                    .filter(Boolean)
                    .join(' '),
                  style: props.contentStyle,
                  ...attrs,
                },
                [props.content],
              ),
            ]),
          ],
        ),
        btnsNode,
      ]);
    };
  },
});

const ConfirmDialog = defineComponent({
  name: 'AConfirmDialog',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    rootPrefixCls: { type: String, default: undefined },
    /** 是否显示（命令式路径由 `HookModal` / `confirm` 控制）。 */
    open: { type: Boolean, default: undefined },
    zIndex: { type: Number, default: undefined },
    width: { type: [String, Number] as PropType<string | number>, default: undefined },
    centered: { type: Boolean, default: undefined },
    closable: { type: [Boolean, Object] as PropType<ModalProps['closable']>, default: false },
    mask: { type: [Boolean, Object] as unknown as PropType<MaskType>, default: undefined },
    maskClosable: { type: Boolean, default: undefined },
    type: { type: String as PropType<ModalType>, default: undefined },
    // 内部：由命令式/程序化 API 驱动，无模板上下文，VNode prop 合法
    title: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    // 内部：由命令式/程序化 API 驱动，无模板上下文，VNode prop 合法
    content: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    // 内部：由命令式/程序化 API 驱动，无模板上下文，VNode prop 合法
    icon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    // 内部：由命令式/程序化 API 驱动，无模板上下文，VNode prop 合法
    okText: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    // 内部：由命令式/程序化 API 驱动，无模板上下文，VNode prop 合法
    cancelText: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    okType: { type: String as PropType<import('./interface').ModalOkType>, default: undefined },
    confirmLoading: { type: Boolean, default: undefined },
    okCancel: { type: Boolean, default: undefined },
    // 内部：由命令式/程序化 API 驱动，无模板上下文，VNode prop 合法
    footer: {
      type: [String, Number, Object, Array, Function] as unknown as PropType<
        VNodeChild | ((originNode: VNodeChild, extra: ModalFooterExtra) => VNodeChild)
      >,
      default: undefined,
    },
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    styles: { type: [Object, Function] as PropType<ModalProps['styles']>, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<ModalProps['classNames']>,
      default: undefined,
    },
    locale: { type: Object as PropType<Partial<ModalLocale>>, default: undefined },
    afterClose: { type: Function as PropType<() => void>, default: undefined },
    afterOpenChange: { type: Function as PropType<(open: boolean) => void>, default: undefined },
    modalRender: { type: Function as PropType<ModalFuncProps['modalRender']>, default: undefined },
    className: { type: String, default: undefined },
    wrapClassName: { type: String, default: undefined },
    bodyStyle: { type: Object as PropType<import('vue').CSSProperties>, default: undefined },
    maskStyle: { type: Object as PropType<import('vue').CSSProperties>, default: undefined },
    direction: { type: String as PropType<'ltr' | 'rtl'>, default: undefined },
    transitionName: { type: String, default: undefined },
    maskTransitionName: { type: String, default: undefined },
    autoFocusButton: {
      type: String as unknown as PropType<AutoFocusButton | undefined>,
      default: undefined,
    },
    focusable: { type: Object as PropType<ModalFuncProps['focusable']>, default: undefined },
    okButtonProps: { type: Object as PropType<ModalButtonProps>, default: undefined },
    cancelButtonProps: { type: Object as PropType<ModalButtonProps>, default: undefined },
    keyboard: { type: Boolean, default: undefined },
    getContainer: {
      type: [String, Boolean, Function, Object] as unknown as PropType<ModalGetContainer>,
      default: undefined,
    },
    // 命令式路径
    close: { type: Function as PropType<(...args: unknown[]) => void>, default: undefined },
    onConfirm: { type: Function as PropType<(confirmed: boolean) => void>, default: undefined },
    onOk: { type: Function as PropType<ModalAction>, default: undefined },
    onCancel: { type: Function as PropType<ModalAction>, default: undefined },
    isSilent: { type: Function as PropType<() => boolean>, default: undefined },
  },
  setup(props, { attrs }) {
    const config = useComponentConfig<{
      cancelButtonProps?: ModalButtonProps;
      okButtonProps?: ModalButtonProps;
    }>('modal');

    const theme = useTheme();
    const confirmPrefixCls = computed(() => `${props.prefixCls}-confirm`);
    const width = computed(() => props.width ?? 416);
    const style = computed(() => props.style || {});

    const semanticStyles = (info: { props: ModalProps }) => ({
      body: props.bodyStyle,
      mask: props.maskStyle,
      ...(typeof props.styles === 'function' ? props.styles(info) : props.styles),
    });

    const classString = computed(() =>
      [
        confirmPrefixCls.value,
        `${confirmPrefixCls.value}-${props.type}`,
        props.direction === 'rtl' ? `${confirmPrefixCls.value}-rtl` : undefined,
        props.className,
      ]
        .filter(Boolean)
        .join(' '),
    );

    /** ⚠️ 默认 `closable: false` —— 与 `Modal` 的 `maskClosable` 默认**相反**。 */
    const mergedMask = computed(() => {
      const nextMaskConfig = normalizeMaskConfig(props.mask, props.maskClosable);
      nextMaskConfig.closable ??= false;
      return nextMaskConfig;
    });

    const mergedZIndex = computed(
      () => props.zIndex ?? theme.token.value.zIndexPopupBase + CONTAINER_MAX_OFFSET,
    );

    return () =>
      h(
        Modal,
        {
          ...attrs,
          prefixCls: props.prefixCls,
          open: props.open,
          // Modal 已迁移到「根 class 走原生 attrs」⇒ 这里用 `class`
          class: classString.value,
          wrapClassName:
            [props.centered ? `${confirmPrefixCls.value}-centered` : undefined, props.wrapClassName]
              .filter(Boolean)
              .join(' ') || undefined,
          onCancel: () => {
            props.close?.({ triggerCancel: true });
            props.onConfirm?.(false);
          },
          transitionName: props.transitionName,
          maskTransitionName: props.maskTransitionName,
          mask: mergedMask.value,
          style: style.value,
          styles: semanticStyles,
          classNames: props.classNames,
          onAfterClose: props.afterClose,
          onAfterOpenChange: props.afterOpenChange,
          width: width.value,
          zIndex: mergedZIndex.value,
          closable: props.closable,
          confirmLoading: props.confirmLoading,
          keyboard: props.keyboard,
          getContainer: props.getContainer,
          centered: props.centered,
          _semanticOmit: CONFIRM_OMIT_SEMANTIC_NAMES,
          _renderSemanticContent: ({
            classNames: mergedClassNames,
            styles: mergedStyles,
          }: {
            classNames: ModalSemanticType['classNames'];
            styles: ModalSemanticType['styles'];
          }) =>
            h(ConfirmContent, {
              prefixCls: props.prefixCls,
              confirmPrefixCls: confirmPrefixCls.value,
              rootPrefixCls: props.rootPrefixCls,
              type: props.type,
              icon: props.icon,
              okCancel: props.okCancel,
              confirmLoading: props.confirmLoading,
              okText: props.okText,
              cancelText: props.cancelText,
              okType: props.okType,
              footer: props.footer,
              title: props.title,
              content: props.content,
              autoFocusButton: props.autoFocusButton,
              focusable: props.focusable,
              close: props.close,
              onConfirm: props.onConfirm,
              onOk: props.onOk,
              onCancel: props.onCancel,
              isSilent: props.isSilent,
              okButtonProps: { ...config.okButtonProps, ...props.okButtonProps },
              cancelButtonProps: { ...config.cancelButtonProps, ...props.cancelButtonProps },
              contentClassName: mergedClassNames?.body,
              contentStyle: mergedStyles?.body,
              locale: props.locale,
            }),
        },
        // 🚨 footer 必须走 **slot** 关闭（C8-R2：Modal 的 footer ReactNode prop 已删除，
        // 传 `footer: null` prop 只是无效 attrs）。空 slot ⇒ readSlot 归一为 null
        // ⇒ Modal 不渲染默认 footer —— 确认框的按钮由 ConfirmContent 自绘。
        // 漏了这条会让 Modal 默认 footer 与 ConfirmContent 的按钮**同屏两份**。
        {
          footer: () => null,
          ...(props.modalRender
            ? {
                modalRender: ({ ModalPanel }: import('./interface').ModalRenderSlotProps) =>
                  props.modalRender?.(h(ModalPanel)),
              }
            : {}),
        },
      );
  },
});

export default ConfirmDialog;
