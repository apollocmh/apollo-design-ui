/**
 * Step —— 单个步骤的 DOM/事件（rc-steps `Step.js` 166 行的 Vue 自建，结构逐字同构）。
 *
 * DOM：-item > -wrapper > (StepIcon + -section > (-header > (-title + -subtitle +
 * Rail) + -content))。Rail 挂在 -header 内、status 取 nextStatus。
 */

import type { CSSProperties, VNodeChild } from 'vue';
import { computed, defineComponent, h, inject, type PropType } from 'vue';
import { clsx } from '../_internal/clsx';
import type { StepItem, StepsRenderInfo, StepsStatus } from './interface';
import Rail from './Rail';
import StepIcon, {
  provideStepIconSemantic,
  type StepIconSemantic,
  stepsIconContextKey,
} from './StepIcon';

export interface StepProps {
  prefixCls: string;
  classNames?: Record<string, string | undefined>;
  styles?: Record<string, CSSProperties | undefined>;
  data: StepItem;
  last: boolean;
  nextStatus?: StepsStatus;
  /** rc-steps `UnstableContext.railFollowPrevStatus`（由 `Steps` 转发）。 */
  railFollowPrevStatus?: boolean;
  active: boolean;
  index: number;
  onClick?: (next: number) => void;
}

const Step = defineComponent({
  name: 'AStepsStep',
  props: {
    prefixCls: { type: String, required: true },
    classNames: {
      type: Object as PropType<Record<string, string | undefined>>,
      default: undefined,
    },
    styles: {
      type: Object as PropType<Record<string, CSSProperties | undefined>>,
      default: undefined,
    },
    data: { type: Object as PropType<StepItem>, required: true },
    last: { type: Boolean, default: false },
    nextStatus: { type: String as PropType<StepsStatus | undefined>, default: undefined },
    /** rc-steps `UnstableContext.railFollowPrevStatus`（由 `Steps` 转发）。 */
    railFollowPrevStatus: { type: Boolean, default: false },
    active: { type: Boolean, default: false },
    index: { type: Number, required: true },
    onClick: {
      type: Function as PropType<((next: number) => void) | undefined>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const { ItemComponent = 'div' } = inject<Record<string, unknown>>(stepsIconContextKey, {});

    // rc 的 StepIconSemanticContext.Provider：item 级 icon 类名/样式 → StepIcon
    const iconSemantic = computed<StepIconSemantic>(() => ({
      className: props.data.classNames?.icon,
      style: props.data.styles?.icon,
    }));
    provideStepIconSemantic(iconSemantic);

    return () => {
      const data = props.data;
      const itemCls = `${props.prefixCls}-item`;

      // ---- 数据解构（rc 逐字：渲染字段不进 attrs）----
      const {
        onClick: onItemClick,
        title,
        subTitle,
        content,
        description,
        disabled,
        icon,
        status,
        className,
        style,
        classNames: itemClassNamesRaw,
        styles: itemStylesRaw,
        key: _itemKey,
        ...restItemProps
      } = data as StepItem & Record<string, unknown>;
      const itemClassNames = itemClassNamesRaw ?? {};
      const itemStyles = itemStylesRaw ?? {};

      const mergedContent: VNodeChild = content ?? description;
      const renderInfo: StepsRenderInfo = {
        item: { ...data, content: mergedContent },
        index: props.index,
        active: props.active,
      };

      // ---- 点击 / 可访问性 ----
      const clickable = Boolean(props.onClick || onItemClick) && disabled !== true;
      const accessibilityProps: Record<string, unknown> = {};
      if (clickable) {
        accessibilityProps.role = 'button';
        accessibilityProps.tabIndex = 0;
        accessibilityProps.onClick = (e: MouseEvent) => {
          onItemClick?.(e);
          props.onClick?.(props.index);
        };
        accessibilityProps.onKeydown = (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            (e.currentTarget as HTMLElement).click();
          }
        };
      }

      // ---- 类名 ----
      const mergedStatus: StepsStatus = status ?? 'wait';
      const hasTitle = title !== undefined && title !== null;
      const hasSubTitle = subTitle !== undefined && subTitle !== null;
      // ⚠️ 本仓 clsx 是简化版（不支持对象参数）—— 条件类展开成字符串
      const classString = [
        itemCls,
        `${itemCls}-${mergedStatus}`,
        icon ? `${itemCls}-custom` : '',
        props.active ? `${itemCls}-active` : '',
        disabled === true ? `${itemCls}-disabled` : '',
        !hasTitle && !hasSubTitle ? `${itemCls}-empty-header` : '',
        className,
        props.classNames?.item,
        itemClassNames.root,
      ]
        .filter(Boolean)
        .join(' ');

      // ---- icon ----
      // C8-R2：icon 内容由 Steps 的 `#icon` 插槽提供**完整的 StepIcon 节点**
      //（含 status 图标/序号/进度环），Step 只在 #iconRender 插槽存在时替换。
      const iconNode: VNodeChild = (slots.icon?.() as VNodeChild) ?? h(StepIcon);

      // ---- wrapper ----
      let wrapperNode = h(
        'div',
        {
          class: clsx(`${itemCls}-wrapper`, props.classNames?.itemWrapper, itemClassNames.wrapper),
          style: {
            ...props.styles?.itemWrapper,
            ...itemStyles.wrapper,
          } as CSSProperties,
        },
        [
          iconNode,
          h(
            'div',
            {
              class: clsx(
                `${itemCls}-section`,
                props.classNames?.itemSection,
                itemClassNames.section,
              ),
              style: {
                ...props.styles?.itemSection,
                ...itemStyles.section,
              } as CSSProperties,
            },
            [
              h(
                'div',
                {
                  class: clsx(
                    `${itemCls}-header`,
                    props.classNames?.itemHeader,
                    itemClassNames.header,
                  ),
                  style: {
                    ...props.styles?.itemHeader,
                    ...itemStyles.header,
                  } as CSSProperties,
                },
                [
                  hasTitle
                    ? h(
                        'div',
                        {
                          class: clsx(
                            `${itemCls}-title`,
                            props.classNames?.itemTitle,
                            itemClassNames.title,
                          ),
                          style: {
                            ...props.styles?.itemTitle,
                            ...itemStyles.title,
                          } as CSSProperties,
                        },
                        [title as VNodeChild],
                      )
                    : null,
                  hasSubTitle
                    ? h(
                        'div',
                        {
                          title: typeof subTitle === 'string' ? subTitle : undefined,
                          class: clsx(
                            `${itemCls}-subtitle`,
                            props.classNames?.itemSubtitle,
                            itemClassNames.subtitle,
                          ),
                          style: {
                            ...props.styles?.itemSubtitle,
                            ...itemStyles.subtitle,
                          } as CSSProperties,
                        },
                        [subTitle as VNodeChild],
                      )
                    : null,
                  !props.last
                    ? h(Rail, {
                        prefixCls: itemCls,
                        className: clsx(props.classNames?.itemRail, itemClassNames.rail),
                        style: {
                          ...props.styles?.itemRail,
                          ...itemStyles.rail,
                        } as CSSProperties,
                        // rc-steps `Step.js:147`：`railFollowPrevStatus ? status : nextStatus`。
                        // 缺省（false）⇒ 取 nextStatus，「连线通向下一步」；Timeline 的
                        // `reverse` 会传 `true` ⇒ 连线跟**当前项**。
                        status: props.railFollowPrevStatus
                          ? mergedStatus
                          : (props.nextStatus ?? 'wait'),
                      } as never)
                    : null,
                ],
              ),
              mergedContent !== undefined && mergedContent !== null
                ? h(
                    'div',
                    {
                      class: clsx(
                        `${itemCls}-content`,
                        props.classNames?.itemContent,
                        itemClassNames.content,
                      ),
                      style: {
                        ...props.styles?.itemContent,
                        ...itemStyles.content,
                      } as CSSProperties,
                    },
                    [mergedContent as VNodeChild],
                  )
                : null,
            ],
          ),
        ],
      );

      if (slots.itemWrapperRender) {
        const replaced = slots.itemWrapperRender({ itemNode: wrapperNode }) as
          | VNodeChild
          | undefined;
        wrapperNode = (replaced ?? wrapperNode) as typeof wrapperNode;
      }

      let stepNode = h(
        ItemComponent as never,
        {
          ...restItemProps,
          ...accessibilityProps,
          class: classString,
          style: {
            ...props.styles?.item,
            ...itemStyles.root,
            ...style,
          } as CSSProperties,
        },
        { default: () => [wrapperNode] },
      );

      if (slots.itemRender) {
        const replaced = slots.itemRender({
          itemNode: stepNode,
          index: renderInfo.index,
          active: renderInfo.active,
          item: renderInfo.item,
        }) as VNodeChild | undefined;
        stepNode = (replaced || null) as typeof stepNode;
      }

      return stepNode;
    };
  },
});

export default Step;
