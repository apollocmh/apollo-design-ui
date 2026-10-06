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
import { isRenderable } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, type VNodeChild } from 'vue';

import ActionButton, { convertLegacyProps } from '../_internal/action-button';
import Button from '../button/Button.vue';
import { useComponentConfig } from '../config-provider/context';
import { PopoverPurePanel } from '../popover';
import type { PopconfirmProps, PopconfirmSemanticType } from './interface';

/** 语义槽（合并后的形态）。 */
type MergedClassNames = NonNullable<PopconfirmSemanticType['classNames']>;
type MergedStyles = NonNullable<PopconfirmSemanticType['styles']>;

/** antd `getRenderPropValue`：惰性求值（title/description 可为函数）。 */
function getRenderPropValue(value: unknown): VNodeChild {
  return typeof value === 'function' ? (value as () => VNodeChild)() : (value as VNodeChild);
}

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
    title: {
      type: [Object, String, Number, Function] as PropType<PopconfirmProps['title']>,
      default: undefined,
    },
    description: {
      type: [Object, String, Number, Function] as PropType<PopconfirmProps['description']>,
      default: undefined,
    },
    onPopupClick: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
    close: { type: Function as PropType<(...args: unknown[]) => void>, default: undefined },
    onConfirm: { type: Function as PropType<(e?: MouseEvent) => unknown>, default: undefined },
    onCancel: { type: Function as PropType<(e?: MouseEvent) => void>, default: undefined },
    classNames: { type: Object as PropType<MergedClassNames>, default: undefined },
    styles: { type: Object as PropType<MergedStyles>, default: undefined },
  },
  setup(props, { slots }) {
    // ⚠️ useLocale 返回的是**普通对象**（不是 ref）—— 别写 `.value`（empty 同判）
    const [contextLocale] = useLocale('Popconfirm');

    const titleNode = computed<VNodeChild>(() =>
      getRenderPropValue(props.title ?? slots.title?.()),
    );
    const descriptionNode = computed<VNodeChild>(() =>
      getRenderPropValue(props.description ?? slots.description?.()),
    );

    /** 判据 3：falsy（含空串）回退 locale。 */
    const mergedOkText = computed<VNodeChild>(
      () => props.okText || (contextLocale.okText as string),
    );
    const mergedCancelText = computed<VNodeChild>(
      () => props.cancelText || (contextLocale.cancelText as string),
    );

    /**
     * 默认图标（antd：`icon = <ExclamationCircleFilled />`）。
     * 只有显式传 `false` 才不渲染 —— undefined 走默认。
     */
    const mergedIcon = computed<VNodeChild>(() =>
      props.icon === undefined ? h(ExclamationCircleFilled) : (props.icon as VNodeChild),
    );

    return () => {
      const icon = mergedIcon.value;
      const title = titleNode.value;
      const description = descriptionNode.value;

      return h(
        'div',
        {
          class: `${props.prefixCls}-inner-content`,
          onClick: props.onPopupClick,
        },
        [
          h('div', { class: `${props.prefixCls}-message` }, [
            // `icon` 显式 false 时不渲染（上游 `{icon && …}`）
            icon
              ? h(
                  'span',
                  {
                    key: 'icon',
                    class: [`${props.prefixCls}-message-icon`, props.classNames?.icon],
                    style: props.styles?.icon,
                  },
                  (icon as VNodeChild) ?? undefined,
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
                    (title as VNodeChild) ?? undefined,
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
                    (description as VNodeChild) ?? undefined,
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
                  } as never,
                  { default: () => mergedCancelText.value },
                )
              : null,
            h(
              ActionButton,
              {
                key: 'ok',
                actionFn: props.onConfirm as never,
                close: props.close,
                quitOnNullishReturnValue: true,
                emitEvent: true,
                buttonProps: {
                  size: 'small',
                  ...convertLegacyProps(props.okType),
                  ...props.okButtonProps,
                },
              } as never,
              { default: () => mergedOkText.value },
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
  props: {
    prefixCls: { type: String, default: undefined },
    placement: { type: String as PropType<PopconfirmProps['placement']>, default: undefined },
    title: {
      type: [Object, String, Number, Function] as PropType<PopconfirmProps['title']>,
      default: undefined,
    },
    description: {
      type: [Object, String, Number, Function] as PropType<PopconfirmProps['description']>,
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
  },
  setup(props, { attrs }) {
    const { getPrefixCls } = useComponentConfig('popconfirm');
    return () => {
      const prefixCls = getPrefixCls('popconfirm', props.prefixCls);
      // ⚠️ content 走 **slot** 而不是 prop：`Popover.PurePanel` 的 `content`
      //    prop 按 C8-R2 收窄为 String（富内容走同名 slot），Overlay 是 VNode。
      // ⚠️ 末尾的 `...restAttrs` 会**覆盖** `class` / `style`（对象展开后者胜）
      //    ⇒ 先把它们摘掉，否则整条 `class: [prefixCls, …]` 被顶掉。
      const {
        class: _attrsClass,
        style: _attrsStyle,
        ...restAttrs
      } = attrs as Record<string, unknown>;
      void _attrsClass;
      void _attrsStyle;

      return h(
        PopoverPurePanel,
        {
          placement: props.placement,
          // 调用方原生 class / style（位置与原先的 props.className / props.style 一致）
          class: [prefixCls, attrs.class],
          style: attrs.style,
          ...restAttrs,
        } as never,
        {
          content: () =>
            h(Overlay, {
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
            }),
        } as never,
      );
    };
  },
});

export default PurePanel;
