/**
 * Popconfirm 的 Overlay 与 PurePanel —— antd `popconfirm/PurePanel.tsx` 的 Vue 版。
 *
 * ── 判据（最容易写错的几条）──────────────────────────────────────────────────
 *
 * 1. **DOM 结构固定四层**：`-inner-content`（含 `onPopupClick`）→
 *    `-message`（`-message-icon` + `-message-text`）→ 内部 `-title` / `-description`
 *    → `-buttons`（Cancel / OK）。
 * 2. **title 为 `0` 时仍渲染**：`isRenderable` 排除 null/undefined/boolean，`0` 合法
 *    （上游「should render title when it is the number 0」）。
 * 3. **okText / cancelText 为 falsy 时回退 locale**（空串也回退 —— 上游
 *    「okText & cancelText could be empty」断言按钮文案仍是 OK / Cancel）。
 * 4. **description 的语义槽是 `content`**（不是 `description`）—— 上游源码
 *    `classNames?.content` / `styles?.content`，逐字保留。
 * 5. **Cancel 是普通 `Button`，OK 才是 `ActionButton`**（异步 loading / 防重复点击）。
 * 6. ActionButton 的三个开关：`quitOnNullishReturnValue` + `emitEvent` + `close`。
 */

import { ExclamationCircleFilled } from '@apollo-design/icons';
import { useLocale } from '@apollo-design/locale';
import { isEmptyVNode, isRenderable } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, type SlotsType } from 'vue';

import ActionButton, { convertLegacyProps } from '../_internal/action-button';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import Button from '../button/Button.vue';
import { useComponentConfig } from '../config-provider/context';
import { PopoverPurePanel } from '../popover';
import { providePopoverInjection } from '../popover/Popover';
import type { PopconfirmProps, PopconfirmSemanticType, PopconfirmSlots } from './interface';
import { usePopconfirmTheme } from './use-popconfirm-theme';

/** 语义槽（合并后的形态）。 */
type MergedClassNames = NonNullable<PopconfirmSemanticType['classNames']>;
type MergedStyles = NonNullable<PopconfirmSemanticType['styles']>;

export interface OverlayProps
  extends Pick<
    PopconfirmProps,
    | 'icon'
    | 'okButtonProps'
    | 'cancelButtonProps'
    | 'cancelText'
    | 'okText'
    | 'okType'
    | 'showCancel'
    | 'title'
    | 'description'
    | 'onPopupClick'
  > {
  prefixCls?: string;
  close?: (...args: unknown[]) => void;
  /** ⚠️ 返回值有意义（Promise ⇒ 等 resolve 才关），不能声明成 void。 */
  onConfirm?: (e?: MouseEvent) => unknown;
  onCancel?: (e?: MouseEvent) => void;
  classNames?: MergedClassNames;
  styles?: MergedStyles;
}

export const Overlay = defineComponent({
  name: 'APopconfirmOverlay',
  inheritAttrs: false,
  slots: Object as SlotsType<Omit<PopconfirmSlots, 'default'>>,
  props: {
    prefixCls: { type: String, required: true },
    icon: {
      type: [Object, String, Boolean] as PropType<PopconfirmProps['icon']>,
      default: undefined,
    },
    okButtonProps: {
      type: Object as PropType<PopconfirmProps['okButtonProps']>,
      default: undefined,
    },
    cancelButtonProps: {
      type: Object as PropType<PopconfirmProps['cancelButtonProps']>,
      default: undefined,
    },
    cancelText: { type: String, default: undefined },
    okText: { type: String, default: undefined },
    okType: { type: String as PropType<PopconfirmProps['okType']>, default: 'primary' },
    showCancel: { type: Boolean, default: true },
    // Only the action button belongs to an open session; content stays mounted.
    confirmSession: { type: Number, default: 0 },
    title: {
      type: [Object, String, Number, Boolean, Array] as PropType<PopconfirmProps['title']>,
      default: undefined,
    },
    description: {
      type: [Object, String, Number, Boolean, Array] as PropType<PopconfirmProps['description']>,
      default: undefined,
    },
    close: { type: Function as PropType<(...args: unknown[]) => void>, default: undefined },
    onConfirm: { type: Function as PropType<(e?: MouseEvent) => unknown>, default: undefined },
    onCancel: { type: Function as PropType<(e?: MouseEvent) => void>, default: undefined },
    classNames: { type: Object as PropType<MergedClassNames>, default: undefined },
    styles: { type: Object as PropType<MergedStyles>, default: undefined },
  },
  emits: { popupClick: (_event: MouseEvent) => true },
  setup(props, { slots, emit }) {
    const [contextLocale] = useLocale('Popconfirm');

    return () => {
      const icon = slots.icon
        ? slots.icon()
        : props.icon === undefined
          ? h(ExclamationCircleFilled)
          : props.icon;
      const hasIcon = icon !== '' && !isEmptyVNode(icon);
      const title = slots.title ? slots.title() : props.title;
      const description = slots.description ? slots.description() : props.description;
      // 只有未提供槽时才以字符串 prop / locale 兜底；空槽保持为空。
      const okText = slots.okText ? slots.okText() : props.okText || contextLocale.value.okText;
      const cancelText = slots.cancelText
        ? slots.cancelText()
        : props.cancelText || contextLocale.value.cancelText;

      return h(
        'div',
        {
          class: `${props.prefixCls}-inner-content`,
          onClick: (event: MouseEvent) => emit('popupClick', event),
        },
        [
          h('div', { class: `${props.prefixCls}-message` }, [
            hasIcon
              ? h(
                  'span',
                  {
                    key: 'icon',
                    class: [`${props.prefixCls}-message-icon`, props.classNames?.icon],
                    style: props.styles?.icon,
                  },
                  [icon],
                )
              : null,
            h('div', { key: 'text', class: `${props.prefixCls}-message-text` }, [
              isRenderable(title)
                ? h(
                    'div',
                    {
                      key: 'title',
                      class: [`${props.prefixCls}-title`, props.classNames?.title],
                      style: props.styles?.title,
                    },
                    [title],
                  )
                : null,
              isRenderable(description)
                ? h(
                    'div',
                    {
                      key: 'description',
                      // ⚠️ 判据 4：description 的语义槽是 `content`
                      class: [`${props.prefixCls}-description`, props.classNames?.content],
                      style: props.styles?.content,
                    },
                    [description],
                  )
                : null,
            ]),
          ]),
          h('div', { class: `${props.prefixCls}-buttons` }, [
            props.showCancel
              ? h(
                  Button,
                  {
                    key: 'cancel',
                    size: 'small',
                    ...props.cancelButtonProps,
                    onClick: props.onCancel,
                  },
                  { default: () => cancelText },
                )
              : null,
            h(
              ActionButton,
              {
                key: props.confirmSession,
                actionFn: props.onConfirm,
                close: props.close,
                quitOnNullishReturnValue: true,
                emitEvent: true,
                buttonProps: {
                  size: 'small',
                  ...convertLegacyProps(props.okType),
                  ...props.okButtonProps,
                },
              },
              { default: () => okText },
            ),
          ]),
        ],
      );
    };
  },
});

export interface PurePanelProps extends Omit<OverlayProps, 'prefixCls'> {
  placement?: PopconfirmProps['placement'];
}

const PurePanel = defineComponent({
  name: 'APopconfirmPurePanel',
  inheritAttrs: false,
  slots: Object as SlotsType<Omit<PopconfirmSlots, 'default'>>,
  props: {
    prefixCls: { type: String, default: undefined },
    placement: { type: String as PropType<PopconfirmProps['placement']>, default: undefined },
    title: {
      type: [Object, String, Number, Boolean, Array] as PropType<PopconfirmProps['title']>,
      default: undefined,
    },
    description: {
      type: [Object, String, Number, Boolean, Array] as PropType<PopconfirmProps['description']>,
      default: undefined,
    },
    icon: {
      type: [Object, String, Boolean] as PropType<PopconfirmProps['icon']>,
      default: undefined,
    },
    okText: { type: String, default: undefined },
    cancelText: { type: String, default: undefined },
    okType: { type: String as PropType<PopconfirmProps['okType']>, default: 'primary' },
    okButtonProps: {
      type: Object as PropType<PopconfirmProps['okButtonProps']>,
      default: undefined,
    },
    cancelButtonProps: {
      type: Object as PropType<PopconfirmProps['cancelButtonProps']>,
      default: undefined,
    },
    showCancel: { type: Boolean, default: true },
    // ⚠️ Issue #26.2：公开类型 `PurePanelProps extends OverlayProps` 承诺的字段，
    //    这里原先一个都没声明 ⇒ 传进来只落到外层 attrs，内部 Overlay 收不到
    //    （点了 OK 不触发 onConfirm、icon 语义槽不生效）。
    close: { type: Function as PropType<(...args: unknown[]) => void>, default: undefined },
    onConfirm: { type: Function as PropType<(e?: MouseEvent) => unknown>, default: undefined },
    onCancel: { type: Function as PropType<(e?: MouseEvent) => void>, default: undefined },
    classNames: { type: Object as PropType<MergedClassNames>, default: undefined },
    styles: { type: Object as PropType<MergedStyles>, default: undefined },
  },
  emits: { popupClick: (_event: MouseEvent) => true },
  setup(props, { attrs, slots, emit }) {
    const context = useComponentConfig<{
      classNames?: PopconfirmProps['classNames'];
      styles?: PopconfirmProps['styles'];
      className?: string;
      style?: Record<string, string | number>;
    }>('popconfirm');
    const popconfirmTheme = usePopconfirmTheme();
    providePopoverInjection(() => popconfirmTheme.componentToken.value.zIndexPopup);
    const semanticProps = computed<PopconfirmProps>(() => ({ ...props }));
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      PopconfirmProps,
      MergedClassNames,
      MergedStyles
    >(
      [() => context.classNames, () => props.classNames],
      [
        () => context.styles,
        () => (context.style ? { root: context.style } : undefined),
        () => props.styles,
      ],
      semanticProps,
    );
    return () => {
      const prefixCls = context.getPrefixCls('popconfirm', props.prefixCls);

      return h(
        PopoverPurePanel,
        {
          ...attrs,
          placement: props.placement,
          class: [prefixCls, context.className, attrs.class],
          style: attrs.style,
          classNames: {
            root: mergedClassNames.value.root,
            container: mergedClassNames.value.container,
            arrow: mergedClassNames.value.arrow,
          },
          styles: {
            root: { ...popconfirmTheme.style.value, ...mergedStyles.value.root },
            container: mergedStyles.value.container,
            arrow: mergedStyles.value.arrow,
          },
        },
        {
          content: () =>
            h(
              Overlay,
              {
                prefixCls,
                icon: props.icon,
                okButtonProps: props.okButtonProps,
                cancelButtonProps: props.cancelButtonProps,
                cancelText: props.cancelText,
                okText: props.okText,
                okType: props.okType,
                showCancel: props.showCancel,
                title: props.title,
                description: props.description,
                onPopupClick: (event: MouseEvent) => emit('popupClick', event),
                close: props.close,
                onConfirm: props.onConfirm,
                onCancel: props.onCancel,
                classNames: mergedClassNames.value,
                styles: mergedStyles.value,
              },
              {
                icon: slots.icon ? () => slots.icon?.() : undefined,
                title: slots.title ? () => slots.title?.() : undefined,
                description: slots.description ? () => slots.description?.() : undefined,
                okText: slots.okText ? () => slots.okText?.() : undefined,
                cancelText: slots.cancelText ? () => slots.cancelText?.() : undefined,
              },
            ),
        },
      );
    };
  },
});

export default PurePanel;
