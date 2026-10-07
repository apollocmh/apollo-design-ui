/**
 * TourPurePanel —— antd `es/tour/PurePanel.js`（55 行）的 Vue 版。
 *
 * 结构（antd 逐字）：外壳是 popover 的 `RawPurePanel`（对 tour 而言就是一个
 * `{prefixCls}` 类名的 div），className 追加 `{p}-pure` 与 `{p}-{type}`；
 * 内部把 stepProps 直接喂给 TourPanel（`total` 默认 **6** —— 上游怪值，逐字保留）。
 *
 * closable 合并用 antd `_util` 的 `useClosable`（**不是** rc-tour 那个双层版），
 * fallback `closable: true`，`closeIconRender` 给图标 vnode 追加 `{p}-close-icon` 类。
 *
 * 按既有惯例导出为 `TourPurePanel`，同时挂 `Tour._InternalPanelDoNotUseOrYouWillBeFired`。
 * title / description / cover 支持 slot 覆盖（C8-R2，与主体同构）。
 */

import { useLocale } from '@apollo-design/locale';
import { cloneVNode, defineComponent, h, isVNode, type PropType, type VNodeChild } from 'vue';
import { clsx } from '../_internal/clsx';
import { type ClosableType, useClosable } from '../_internal/use-closable';
import { useComponentConfig } from '../config-provider/context';
import type {
  TourSemanticClassNames,
  TourSemanticStyles,
  TourStepProps,
  TourType,
} from './interface';
import TourPanel, { type TourPanelStep } from './panel';

const PurePanel = defineComponent({
  name: 'ATourPurePanel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    // antd：current = 0 / total = 6（怪值逐字保留）
    current: { type: Number, default: 0 },
    total: { type: Number, default: 6 },
    type: { type: String as PropType<TourType>, default: undefined },
    closable: {
      type: [Boolean, Object] as PropType<TourStepProps['closable']>,
      default: undefined,
    },
    closeIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    classNames: { type: Object as PropType<TourSemanticClassNames>, default: undefined },
    styles: { type: Object as PropType<TourSemanticStyles>, default: undefined },
    title: { type: String, default: undefined },
    description: { type: String, default: undefined },
    cover: { type: String, default: undefined },
    nextButtonProps: {
      type: Object as PropType<TourStepProps['nextButtonProps']>,
      default: undefined,
    },
    prevButtonProps: {
      type: Object as PropType<TourStepProps['prevButtonProps']>,
      default: undefined,
    },
  },
  setup(props, { slots, attrs }) {
    const { getPrefixCls } = useComponentConfig('tour');

    // antd `_util` 语义的 useClosable（fallback closable: true）
    // ⚠️ TourClosableConfig 的模板字面量索引签名（`aria-${string}`）赋给
    //    ClosableConfig 的整体索引签名（`[key: string]`）是 TS 的已知缺口
    //    （动态键查询的固有代价，与 config-provider context 的断言同判），
    //    运行时 pickAttrs / isPlainObject 对两种形态行为一致。
    const [contextLocaleGlobal] = useLocale('global');
    const closableResult = useClosable(
      () => ({
        closable: props.closable as unknown as ClosableType | undefined,
        closeIcon: props.closeIcon,
      }),
      () => undefined,
      {
        closable: true,
        closeIconRender: (icon) => {
          if (!isVNode(icon)) return icon;
          // antd：closeIconRender 追加 `{p}-close-icon`，并把 locale 的 close
          // 文案注入为 aria-label（antd `_util` computeCloseIcon 的行为；
          // cloneVNode 的 class 会自动合并 —— 别把旧 class 再塞进去，会翻倍）
          return cloneVNode(icon, {
            class: `${props.prefixCls ?? getPrefixCls('tour')}-close-icon`,
            'aria-label': contextLocaleGlobal?.close,
          });
        },
      },
    );

    return () => {
      const p = props.prefixCls ?? getPrefixCls('tour');

      const panelStep: TourPanelStep = {
        ...(props as unknown as TourStepProps),
        prefixCls: p,
        total: props.total,
        current: props.current,
        title:
          slots.title?.({ step: {}, current: props.current, total: props.total }) ?? props.title,
        description:
          slots.description?.({ step: {}, current: props.current, total: props.total }) ??
          props.description,
        cover:
          slots.cover?.({ step: {}, current: props.current, total: props.total }) ?? props.cover,
        closable: closableResult.value.closable
          ? { closeIcon: closableResult.value.closeIconNode as VNodeChild }
          : undefined,
      };

      // antd：RawPurePanel 壳逐字对齐（popover/PurePanel.js RawPurePanel）——
      //   根类名 = clsx(hashId, `{p}`, `{p}-pure`, `{p}-placement-{placement=‘top’}`, className)
      //   其中 className（tour 传入）= clsx(props.className, `{p}-pure`, type && `{p}-{type}`)
      //   ⇒ `-pure` 出现**两次**（机械对拍基线钉住）；内部是 `-arrow` +
      //   `{p}-container`（role="tooltip"，rc-tooltip Popup）两层包裹。
      return h(
        'div',
        {
          class: clsx(
            p,
            `${p}-pure`,
            `${p}-placement-top`,
            `${p}-pure`,
            props.type && `${p}-${props.type}`,
            typeof attrs.class === 'string' ? attrs.class : undefined,
          ),
          // 根 style 是 Vue 原生 attrs
          style: attrs.style,
        },
        [
          h('div', { class: `${p}-arrow` }),
          h('div', { class: `${p}-container`, role: 'tooltip' }, [
            h(TourPanel, {
              prefixCls: p,
              stepProps: panelStep,
              current: props.current,
              type: props.type,
              classNames: props.classNames,
              styles: props.styles,
            }),
          ]),
        ],
      );
    };
  },
});

export default PurePanel;
