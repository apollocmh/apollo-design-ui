/**
 * TourPanel —— antd 自研面板（`es/tour/panelRender.js`，128 行）的 Vue 版。
 *
 * 上游自述（判据）：「Due to the independent design of Panel, it will be too
 * coupled to put in rc-tour, so a set of Panel logic is implemented separately
 * in antd.」⇒ 本仓同样独立成文件，不塞进 rc-tour 等价物（Tour.ts）。
 *
 * ── 与 antd 的面板注入位（panelRender.js 逐条对齐）──────────────────────────
 *
 *   · DOM：`.{p}-panel > .{p}-section > [close?] [cover?] [header>title] [description] .{p}-footer`
 *     —— `. {p}-panel` 固定类、不吃语义槽；其余槽位见 TourSemanticClassNames。
 *   · 关闭按钮：`closable && mergedCloseIcon`（closable 假值 ⇒ 不渲染）；
 *     `aria-label = locale.global.close`（**不是** Tour locale）；
 *     `pickAttrs(closable, true)` 只透传 `aria-*`。
 *   · 按钮：prev 仅 `current !== 0` 渲染；next 恒渲染；
 *     `nextBtnClick` 最后一步调 `onFinish` 否则 `onNext`，之后**总是**调
 *     `nextButtonProps.onClick`（prev 同构）。`mainBtnType = primary ? 'default' : 'primary'`，
 *     prev 是 `type:'default' + ghost: primary`。
 *   · 指示器：`total > 1` 才渲染容器；`indicatorsRender` 优先于默认 span 列表。
 *   · `actionsRender(defaultActionsNode, { current, total })` 优先于默认按钮组。
 *
 * ── Vue 化（C8-R2 的接线在 Tour.ts 完成，本文件只认已解析好的值）──────────────
 *
 * `title` / `description` / `cover` / `nextButtonProps.children` /
 * `prevButtonProps.children` 的 slot 优先逻辑由 Tour.ts 在组装 `TourPanelStep`
 * 时解析（slot 求值结果直接写进 step 字段），本文件保持与 antd 面板同构的
 * 纯渲染 —— 这样 L1 单测可以不挂 slot 上下文直接驱动。
 */

import { CloseOutlined } from '@apollo-design/icons';
import { useLocale } from '@apollo-design/locale';
import { pickAttrs } from '@apollo-design/utils';
import {
  type ClassValue,
  type CSSProperties,
  defineComponent,
  h,
  type PropType,
  type VNodeChild,
} from 'vue';
import { Button } from '../button';
import { clsx as cx } from '../tooltip/util';
import type {
  TourClosableConfig,
  TourSemanticClassNames,
  TourSemanticStyles,
  TourType,
} from './interface';

/** antd `isReactRenderable`（`0` / `''` 合法，`null` / `undefined` / 布尔不算）。 */
function isRenderable(value: unknown): boolean {
  return value !== null && value !== undefined && typeof value !== 'boolean';
}

/**
 * 面板收到的「合并后步骤」—— rc 在把 step 传进面板前注入的字段
 * （`prefixCls` / `total` / `current` / `onClose` / `onPrev` / `onNext` / `onFinish`）
 * + Tour.ts 已解析的 slot 内容（title / description / cover 收宽为 VNodeChild）。
 */
export interface TourPanelStep {
  title?: VNodeChild;
  description?: VNodeChild;
  cover?: VNodeChild;
  nextButtonProps?: {
    children?: VNodeChild;
    onClick?: () => void;
    class?: ClassValue;
    style?: CSSProperties;
  };
  prevButtonProps?: {
    children?: VNodeChild;
    onClick?: () => void;
    class?: ClassValue;
    style?: CSSProperties;
  };
  closable?: TourClosableConfig | null;
  className?: string;
  style?: CSSProperties;
  /** 步骤级形态（覆盖面板的 `type` prop —— `mergedType = stepType ?? type`）。 */
  type?: TourType;
  /** 步骤级语义槽（antd 步骤级不支持函数形态）。 */
  classNames?: TourSemanticClassNames;
  styles?: TourSemanticStyles;
  /** 注入位（rc `TourStepInfo` 的渲染注入，非用户公开面）。 */
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
  props: {
    prefixCls: { type: String, required: true },
    stepProps: { type: Object as PropType<TourPanelStep>, required: true },
    current: { type: Number, default: undefined },
    type: { type: String as PropType<TourType>, default: undefined },
    classNames: { type: Object as PropType<TourSemanticClassNames>, default: undefined },
    styles: { type: Object as PropType<TourSemanticStyles>, default: undefined },
    /** antd `indicatorsRender` 的等价回调（Tour.ts 由 `#indicators` slot 桥接）。 */
    indicatorsRender: {
      type: Function as PropType<(current: number, total: number) => VNodeChild>,
      default: undefined,
    },
    /** antd `actionsRender` 的等价回调（Tour.ts 由 `#actions` slot 桥接）。 */
    actionsRender: {
      type: Function as PropType<
        (originNode: VNodeChild, info: { current: number; total: number }) => VNodeChild
      >,
      default: undefined,
    },
  },
  setup(props) {
    return () => {
      const { stepProps, current, type, classNames, styles, indicatorsRender, actionsRender } =
        props;
      const {
        prefixCls,
        total = 1,
        title,
        onClose,
        onPrev,
        onNext,
        onFinish,
        cover,
        description,
        nextButtonProps,
        prevButtonProps,
        type: stepType,
        closable,
        classNames: stepClassNames = {},
        styles: stepStyles = {},
      } = stepProps;

      // `mergedType = stepType ?? type`（步骤级覆盖全局，panelRender.js 判据）
      const mergedType = stepType ?? type;

      // `pickAttrs(closable ?? {}, true)` —— 只透传 aria-*
      const ariaProps = pickAttrs(closable ?? {}, true);

      const [contextLocaleGlobal] = useLocale('global');
      const [contextLocaleTour] = useLocale('Tour');

      const closeBtnNode = h(
        'button',
        {
          type: 'button',
          onClick: onClose,
          class: cx(`${prefixCls}-close`, stepClassNames.close, classNames?.close),
          style: { ...stepStyles.close, ...styles?.close } as CSSProperties,
          'aria-label': contextLocaleGlobal?.close,
          ...ariaProps,
        },
        // `closable?.closeIcon || <CloseOutlined class="{p}-close-icon" />`（上游 `||`）
        (typeof closable === 'object' && closable !== null ? closable.closeIcon : undefined) ||
          h(CloseOutlined, { class: `${prefixCls}-close-icon` }),
      );

      const isLastStep = current === total - 1;

      const prevBtnClick = () => {
        onPrev?.();
        prevButtonProps?.onClick?.();
      };
      const nextBtnClick = () => {
        if (isLastStep) {
          onFinish?.();
        } else {
          onNext?.();
        }
        nextButtonProps?.onClick?.();
      };

      const headerNode = isRenderable(title)
        ? h(
            'div',
            {
              class: cx(`${prefixCls}-header`, stepClassNames.header, classNames?.header),
              style: { ...stepStyles.header, ...styles?.header } as CSSProperties,
            },
            [
              h(
                'div',
                {
                  class: cx(`${prefixCls}-title`, stepClassNames.title, classNames?.title),
                  style: { ...stepStyles.title, ...styles?.title } as CSSProperties,
                },
                [title],
              ),
            ],
          )
        : null;

      const descriptionNode = isRenderable(description)
        ? h(
            'div',
            {
              class: cx(
                `${prefixCls}-description`,
                stepClassNames.description,
                classNames?.description,
              ),
              style: { ...stepStyles.description, ...styles?.description } as CSSProperties,
            },
            [description],
          )
        : null;

      const coverNode = isRenderable(cover)
        ? h(
            'div',
            {
              class: cx(`${prefixCls}-cover`, stepClassNames.cover, classNames?.cover),
              style: { ...stepStyles.cover, ...styles?.cover } as CSSProperties,
            },
            [cover],
          )
        : null;

      let indicatorNode: VNodeChild;
      if (indicatorsRender) {
        indicatorNode = indicatorsRender(current ?? 0, total);
      } else {
        indicatorNode = Array.from({ length: total }, (_, index) =>
          h('span', {
            key: index,
            class: cx(
              index === current ? `${prefixCls}-indicator-active` : undefined,
              `${prefixCls}-indicator`,
              stepClassNames.indicator,
              classNames?.indicator,
            ),
            style: { ...stepStyles.indicator, ...styles?.indicator } as CSSProperties,
          }),
        );
      }

      const mainBtnType = mergedType === 'primary' ? 'default' : 'primary';

      const defaultActionsNode = [
        current !== 0
          ? h(
              Button,
              {
                size: 'small',
                type: 'default',
                ghost: mergedType === 'primary',
                onClick: prevBtnClick,
                class: [`${prefixCls}-prev-btn`, prevButtonProps?.class],
                style: prevButtonProps?.style,
              },
              { default: () => prevButtonProps?.children ?? contextLocaleTour?.Previous },
            )
          : null,
        h(
          Button,
          {
            size: 'small',
            type: mainBtnType,
            onClick: nextBtnClick,
            class: [`${prefixCls}-next-btn`, nextButtonProps?.class],
            style: nextButtonProps?.style,
          },
          {
            default: () =>
              nextButtonProps?.children ??
              (isLastStep ? contextLocaleTour?.Finish : contextLocaleTour?.Next),
          },
        ),
      ];

      const footerNode = h(
        'div',
        {
          class: cx(`${prefixCls}-footer`, stepClassNames.footer, classNames?.footer),
          style: { ...stepStyles.footer, ...styles?.footer } as CSSProperties,
        },
        [
          total > 1
            ? h(
                'div',
                {
                  class: cx(
                    `${prefixCls}-indicators`,
                    stepClassNames.indicators,
                    classNames?.indicators,
                  ),
                  style: { ...stepStyles.indicators, ...styles?.indicators } as CSSProperties,
                },
                [indicatorNode],
              )
            : null,
          h(
            'div',
            {
              class: cx(`${prefixCls}-actions`, stepClassNames.actions, classNames?.actions),
              style: { ...stepStyles.actions, ...styles?.actions } as CSSProperties,
            },
            [
              actionsRender
                ? actionsRender(defaultActionsNode, { current: current ?? 0, total })
                : defaultActionsNode,
            ],
          ),
        ],
      );

      return h('div', { class: `${prefixCls}-panel` }, [
        h(
          'div',
          {
            class: cx(`${prefixCls}-section`, stepClassNames.section, classNames?.section),
            style: { ...stepStyles.section, ...styles?.section } as CSSProperties,
          },
          // `closable && mergedCloseIcon` —— closable 假值时不渲染关闭按钮
          [
            closable ? closeBtnNode : null,
            coverNode,
            headerNode,
            descriptionNode,
            footerNode,
          ].filter((n) => n !== null),
        ),
      ]);
    };
  },
});

export default TourPanel;
