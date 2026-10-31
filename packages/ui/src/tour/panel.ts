/** Native Tour content and its stable default action component. */
import { CloseOutlined } from '@apollo-design/icons';
import { useLocale } from '@apollo-design/locale';
import { isEmptyVNode, pickAttrs } from '@apollo-design/utils';
import {
  type ClassValue,
  type CSSProperties,
  defineComponent,
  h,
  type PropType,
  type SlotsType,
  type VNodeChild,
} from 'vue';
import { Button } from '../button';
import type {
  TourClosableConfig,
  TourSemanticClassNames,
  TourSemanticStyles,
  TourSlots,
  TourStepProps,
  TourType,
} from './interface';

export interface TourPanelStep {
  title?: VNodeChild;
  description?: VNodeChild;
  cover?: VNodeChild;
  nextButtonProps?: {
    children?: VNodeChild;
    onClick?: (event: MouseEvent) => void;
    class?: ClassValue;
    style?: CSSProperties;
  };
  prevButtonProps?: {
    children?: VNodeChild;
    onClick?: (event: MouseEvent) => void;
    class?: ClassValue;
    style?: CSSProperties;
  };
  closable?: TourClosableConfig | null;
  className?: string;
  style?: CSSProperties;
  type?: TourType;
  classNames?: TourSemanticClassNames;
  styles?: TourSemanticStyles;
  prefixCls: string;
  total?: number;
  current?: number;
  onClose?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onFinish?: () => void;
}

const TourPanel = defineComponent({
  name: 'ATourPanel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    stepProps: { type: Object as PropType<TourPanelStep>, required: true },
    slotStep: { type: Object as PropType<TourStepProps>, default: () => ({}) },
    current: { type: Number, default: 0 },
    type: { type: String as PropType<TourType>, default: undefined },
    classNames: { type: Object as PropType<TourSemanticClassNames>, default: undefined },
    styles: { type: Object as PropType<TourSemanticStyles>, default: undefined },
    titleId: String,
  },
  slots: Object as SlotsType<TourSlots>,
  setup(props, { slots }) {
    const [globalLocale] = useLocale('global');
    const [tourLocale] = useLocale('Tour');
    const scope = () => ({
      step: props.slotStep,
      current: props.current,
      total: props.stepProps.total ?? 1,
    });
    const renderActions = () => {
      const step = props.stepProps;
      const { current, total } = scope();
      const primary = (step.type ?? props.type) === 'primary';
      const last = current === total - 1;
      const nextFallback = last ? tourLocale.value.Finish : tourLocale.value.Next;
      const nextLabel = slots.nextButton
        ? slots.nextButton(scope())
        : (step.nextButtonProps?.children ?? nextFallback);
      const prevLabel =
        current !== 0
          ? slots.prevButton
            ? slots.prevButton(scope())
            : (step.prevButtonProps?.children ?? tourLocale.value.Previous)
          : null;
      return [
        current !== 0
          ? h(
              Button,
              {
                size: 'small',
                type: 'default',
                ghost: primary,
                'aria-label': isEmptyVNode(prevLabel) ? tourLocale.value.Previous : undefined,
                class: [`${props.prefixCls}-prev-btn`, step.prevButtonProps?.class],
                style: step.prevButtonProps?.style,
                onClick: (event: MouseEvent) => {
                  step.prevButtonProps?.onClick?.(event);
                  if (!event.defaultPrevented) step.onPrev?.();
                },
              },
              {
                default: () => prevLabel,
              },
            )
          : null,
        h(
          Button,
          {
            size: 'small',
            type: primary ? 'default' : 'primary',
            'aria-label': isEmptyVNode(nextLabel) ? nextFallback : undefined,
            class: [`${props.prefixCls}-next-btn`, step.nextButtonProps?.class],
            style: step.nextButtonProps?.style,
            onClick: (event: MouseEvent) => {
              step.nextButtonProps?.onClick?.(event);
              if (!event.defaultPrevented) (last ? step.onFinish : step.onNext)?.();
            },
          },
          {
            default: () => nextLabel,
          },
        ),
      ];
    };
    const OriginActions = defineComponent({
      name: 'ATourOriginActions',
      setup: () => renderActions,
    });
    return () => {
      const step = props.stepProps;
      const p = props.prefixCls;
      const currentScope = scope();
      const className = (key: keyof TourSemanticClassNames) => [
        `${p}-${key}`,
        props.classNames?.[key],
        step.classNames?.[key],
      ];
      const style = (key: keyof TourSemanticStyles) => [props.styles?.[key], step.styles?.[key]];
      const content = (key: 'title' | 'description' | 'cover') =>
        slots[key] ? slots[key](currentScope) : step[key];
      const title = content('title');
      const description = content('description');
      const cover = content('cover');
      const hasTitle = !isEmptyVNode(title);
      const closable = step.closable;
      const indicators = slots.indicators
        ? slots.indicators({ current: currentScope.current, total: currentScope.total })
        : Array.from({ length: currentScope.total }, (_, index) =>
            h('span', {
              key: index,
              class: [
                className('indicator'),
                index === currentScope.current && `${p}-indicator-active`,
              ],
              style: style('indicator'),
            }),
          );
      return h('div', { class: `${p}-panel` }, [
        h('div', { class: className('section'), style: style('section') }, [
          closable
            ? h(
                'button',
                {
                  type: 'button',
                  onClick: (event: MouseEvent) => {
                    if (!event.defaultPrevented) step.onClose?.();
                  },
                  class: className('close'),
                  style: style('close'),
                  'aria-label': globalLocale.value.close,
                  ...pickAttrs(closable, { aria: true, data: true }),
                },
                [
                  closable.closeIcon === undefined
                    ? h(CloseOutlined, { class: `${p}-close-icon` })
                    : closable.closeIcon,
                ],
              )
            : null,
          !isEmptyVNode(cover)
            ? h('div', { class: className('cover'), style: style('cover') }, [cover])
            : null,
          hasTitle
            ? h('div', { class: className('header'), style: style('header') }, [
                h('div', { id: props.titleId, class: className('title'), style: style('title') }, [
                  title,
                ]),
              ])
            : props.titleId
              ? h('span', { id: props.titleId, hidden: true }, 'Tour')
              : null,
          !isEmptyVNode(description)
            ? h('div', { class: className('description'), style: style('description') }, [
                description,
              ])
            : null,
          h('div', { class: className('footer'), style: style('footer') }, [
            currentScope.total > 1
              ? h('div', { class: className('indicators'), style: style('indicators') }, [
                  indicators,
                ])
              : null,
            h('div', { class: className('actions'), style: style('actions') }, [
              slots.actions
                ? slots.actions({
                    current: currentScope.current,
                    total: currentScope.total,
                    originNode: OriginActions,
                  })
                : h(OriginActions),
            ]),
          ]),
        ]),
      ]);
    };
  },
});
export default TourPanel;
