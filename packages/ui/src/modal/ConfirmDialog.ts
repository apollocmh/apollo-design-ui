/**
 * `ConfirmDialog` —— antd `components/modal/ConfirmDialog.tsx` 的 Vue 版。
 *
 * 两个组件：
 *   - `ConfirmContent`：正文（图标 + 标题 + 内容 + 按钮组），被 `Modal` 以
 *     `_renderSemanticContent` 的形式塞进 body；
 *   - `ConfirmDialog`：把上面那棵树包成 `Modal`（`footer: null`、`closable` 默认 false、
 *     `width` 默认 416、mask 的 `closable` 默认 **false**）。
 *
 * 关键判据：
 *   1. `mergedOkCancel = okCancel ?? type === 'confirm'`；
 *   2. `autoFocusButton` 默认 **`'ok'`** —— 判据是 `base || base === null ? base : 'ok'`，
 *      即**显式 `null` 表示不自动聚焦**（不能当成 undefined）；
 *   3. 图标只在 `icon === undefined` 时取默认：`info` → InfoCircleFilled、
 *      `success` → CheckCircleFilled、`error` → CloseCircleFilled、
 *      其余（含 `confirm` / `warning` / `warn`）→ ExclamationCircleFilled；
 *   4. `hasTitle` / `hasIcon` 用 `isRenderable` 判，决定 `-has-title` / `-no-icon` 两个类；
 *   5. `okText` 默认取 `mergedOkCancel ? locale.okText : locale.justOkText`；
 *   6. `zIndex` 默认 `zIndexPopupBase + CONTAINER_MAX_OFFSET`（静态方法恒用最大层级）。
 *
 * ⚠️ 与上游的一处**结构差异**：上游在树尾渲染一个 `<Confirm/>`（cssinjs 的
 *    `genSubStyleComponent` 占位组件，只负责注册样式、**不产出 DOM**）。
 *    本仓是静态 CSS（构建期已落进 `dist/index.css`）⇒ 不需要它，也不产出 DOM。
 */
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  InfoCircleFilled,
} from '@apollo-design/icons';
import { useLocale } from '@apollo-design/locale';
import { CONTAINER_MAX_OFFSET } from '@apollo-design/portal';
import { getDesignToken } from '@apollo-design/theme';
import { isFunction, isPlainObject, isRenderable, omit } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, provide, type VNodeChild } from 'vue';
import { type MaskType, normalizeMaskConfig } from '../_internal/use-merged-mask';
import { useComponentConfig } from '../config-provider/context';
import CancelBtn from './components/ConfirmCancelBtn';
import OkBtn from './components/ConfirmOkBtn';
import { modalContextKey } from './context';
import type {
  AutoFocusButton,
  FocusableConfig,
  ModalButtonProps,
  ModalFooterExtra,
  ModalGetContainer,
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
    icon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    okCancel: { type: Boolean, default: undefined },
    okText: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    cancelText: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    footer: { type: [Function, null] as unknown as PropType<unknown>, default: undefined },
    title: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    content: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    locale: {
      type: Object as PropType<{ okText?: string; cancelText?: string }>,
      default: undefined,
    },
    autoFocusButton: {
      type: String as unknown as PropType<AutoFocusButton | undefined>,
      default: undefined,
    },
    focusable: { type: Object as PropType<FocusableConfig>, default: undefined },
    contentClassName: { type: String, default: undefined },
    contentStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    okButtonProps: { type: Object as PropType<ModalButtonProps>, default: undefined },
    cancelButtonProps: { type: Object as PropType<ModalButtonProps>, default: undefined },
    closable: { type: [Boolean, Object, null] as unknown as PropType<unknown>, default: undefined },
    // 命令式路径透传
    close: { type: Function as PropType<(...args: unknown[]) => void>, default: undefined },
    onConfirm: { type: Function as PropType<(confirmed: boolean) => void>, default: undefined },
    onOk: { type: Function as PropType<(...args: unknown[]) => unknown>, default: undefined },
    onCancel: { type: Function as PropType<(...args: unknown[]) => unknown>, default: undefined },
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
    const mergedLocale = computed(() => props.locale ?? locale);

    /** `okCancel ?? type === 'confirm'`。 */
    const mergedOkCancel = computed(() => props.okCancel ?? props.type === 'confirm');

    /** ⚠️ 显式 `null` ⇒ 不自动聚焦；未给 ⇒ `'ok'`。 */
    const mergedAutoFocusButton = computed<AutoFocusButton | undefined>(() => {
      const base = props.focusable?.autoFocusButton || props.autoFocusButton;
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
        cancelTextLocale: cancelTextLocale.value,
        okTextLocale: okTextLocale.value,
        mergedOkCancel: mergedOkCancel.value,
        onClose: onClose.value,
        isSilent: props.isSilent,
        rootPrefixCls: props.rootPrefixCls,
        close: props.close,
        onConfirm: props.onConfirm,
        onOk: props.onOk,
        onCancel: props.onCancel,
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
            mergedIcon = fallbackProp(config.infoIcon, h(InfoCircleFilled)) as VNodeChild;
            break;
          case 'success':
            mergedIcon = fallbackProp(config.successIcon, h(CheckCircleFilled)) as VNodeChild;
            break;
          case 'error':
            mergedIcon = fallbackProp(config.errorIcon, h(CloseCircleFilled)) as VNodeChild;
            break;
          default:
            mergedIcon = fallbackProp(config.warningIcon, h(ExclamationCircleFilled)) as VNodeChild;
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
                ? (footer as (node: VNodeChild, extra: ModalFooterExtra) => VNodeChild)(
                    footerOriginNode,
                    { OkBtn, CancelBtn },
                  )
                : footerOriginNode,
            ])
          : (footer as VNodeChild);

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
            mergedIcon as never,
            h('div', { class: `${confirmPrefixCls}-paragraph` }, [
              hasTitle
                ? h('span', { class: `${confirmPrefixCls}-title` }, props.title as never)
                : null,
              h(
                'div',
                {
                  class: [`${confirmPrefixCls}-content`, props.contentClassName]
                    .filter(Boolean)
                    .join(' '),
                  style: props.contentStyle,
                  ...(attrs as Record<string, unknown>),
                },
                props.content as never,
              ),
            ]),
          ],
        ),
        btnsNode,
      ]);
    };
  },
});

/** 静态方法恒用最大层级（上游 `token.zIndexPopupBase + CONTAINER_MAX_OFFSET`）。 */
function confirmMaxZIndex(): number {
  return (getDesignToken() as { zIndexPopupBase: number }).zIndexPopupBase + CONTAINER_MAX_OFFSET;
}

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
    closable: { type: [Boolean, Object, null] as unknown as PropType<unknown>, default: false },
    mask: { type: [Boolean, Object] as unknown as PropType<MaskType>, default: undefined },
    maskClosable: { type: Boolean, default: undefined },
    type: { type: String as PropType<ModalType>, default: undefined },
    title: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    content: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    icon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    okText: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    cancelText: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    okType: { type: String as PropType<import('./interface').ModalOkType>, default: undefined },
    okCancel: { type: Boolean, default: undefined },
    footer: { type: [Function, null] as unknown as PropType<unknown>, default: undefined },
    style: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    styles: {
      type: [Object, Function] as unknown as PropType<unknown>,
      default: undefined,
    },
    className: { type: String, default: undefined },
    wrapClassName: { type: String, default: undefined },
    bodyStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    maskStyle: { type: Object as PropType<Record<string, unknown>>, default: undefined },
    direction: { type: String as PropType<'ltr' | 'rtl'>, default: undefined },
    transitionName: { type: String, default: undefined },
    maskTransitionName: { type: String, default: undefined },
    autoFocusButton: {
      type: String as unknown as PropType<AutoFocusButton | undefined>,
      default: undefined,
    },
    focusable: { type: Object as PropType<FocusableConfig>, default: undefined },
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
    onOk: { type: Function as PropType<(...args: unknown[]) => unknown>, default: undefined },
    onCancel: { type: Function as PropType<(...args: unknown[]) => unknown>, default: undefined },
    isSilent: { type: Function as PropType<() => boolean>, default: undefined },
  },
  setup(props, { attrs }) {
    const config = useComponentConfig<{
      cancelButtonProps?: ModalButtonProps;
      okButtonProps?: ModalButtonProps;
    }>('modal');

    const confirmPrefixCls = computed(() => `${props.prefixCls}-confirm`);
    const width = computed(() => props.width || 416);
    const style = computed(() => props.style || {});

    /** `styles` 支持函数形态：`{ body: bodyStyle, mask: maskStyle, ...styles(info) }`。 */
    const semanticStyles = computed<Record<string, unknown>>(() => {
      const base = { body: props.bodyStyle, mask: props.maskStyle };
      const raw = props.styles;
      return isFunction(raw)
        ? { ...base, ...(raw as (info: { props: unknown }) => Record<string, unknown>)({ props }) }
        : { ...base, ...((raw ?? {}) as Record<string, unknown>) };
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

    const mergedZIndex = computed(() => props.zIndex ?? confirmMaxZIndex());

    return () =>
      h(Modal, {
        ...(omit(attrs as Record<string, unknown>, ['bodyStyle', 'maskStyle']) as Record<
          string,
          unknown
        >),
        prefixCls: props.prefixCls,
        open: props.open,
        className: classString.value,
        wrapClassName:
          [props.centered ? `${confirmPrefixCls.value}-centered` : undefined, props.wrapClassName]
            .filter(Boolean)
            .join(' ') || undefined,
        onCancel: () => {
          props.close?.({ triggerCancel: true });
          props.onConfirm?.(false);
        },
        title: props.title,
        footer: null,
        transitionName: props.transitionName,
        maskTransitionName: props.maskTransitionName,
        mask: mergedMask.value as unknown as MaskType,
        style: style.value,
        styles: semanticStyles.value as ModalSemanticType['styles'],
        width: width.value,
        zIndex: mergedZIndex.value,
        closable: props.closable,
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
            ...(attrs as Record<string, unknown>),
            prefixCls: props.prefixCls,
            confirmPrefixCls: confirmPrefixCls.value,
            rootPrefixCls: props.rootPrefixCls,
            type: props.type,
            icon: props.icon,
            okCancel: props.okCancel,
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
          } as never),
      } as never);
  },
});

export default ConfirmDialog;
