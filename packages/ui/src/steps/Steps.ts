/**
 * Steps —— 步骤条（G4 产物）。
 *
 * 结构：rc-steps 1.2.3 内核（Steps 119 + Step/StepIcon/Rail 见各文件）的 Vue 自建
 * + antd 6.6.4 壳（index.tsx 493 行）的 12 件事 —— type 推导 / responsive 断点 /
 * useDisplaySteps 折叠 / internalIconRender / inline Tooltip / panel PanelArrow /
 * deprecated 告警。分析：docs/analysis/steps.md。
 *
 * C8-R2：iconRender / itemRender / itemWrapperRender / progressDot(fn) 一律
 * scoped slot；items 数据 API 的 VNodeChild 合法。
 */

import { CheckOutlined, CloseOutlined, EllipsisOutlined } from '@apollo-design/icons';
import { useDevWarning } from '@apollo-design/utils';
import {
  type ComputedRef,
  type CSSProperties,
  computed,
  defineComponent,
  h,
  inject,
  mergeProps,
  normalizeClass,
  normalizeStyle,
  type PropType,
  provide,
  type SlotsType,
  type VNodeChild,
} from 'vue';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useSize } from '../config-provider/size-context';
import { useBreakpoint } from '../grid/hooks/use-breakpoint';
import Tooltip from '../tooltip/Tooltip';
import { stepsInternalContextKey, stepsUnstableContextKey } from './context';
import type {
  StepItem,
  StepsProps,
  StepsSemanticClassNames,
  StepsSemanticStyles,
  StepsSlots,
  StepsStatus,
  StepsType,
} from './interface';
import PanelArrow from './PanelArrow';
import ProgressIcon from './ProgressIcon';
import Step from './Step';
import StepIcon, { stepsIconContextKey } from './StepIcon';
import { useStepsTheme } from './use-theme';
import { useDisplaySteps } from './useDisplaySteps';

export const Steps = defineComponent({
  name: 'ASteps',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<StepsProps['classNames']>,
      default: undefined,
    },
    styles: { type: [Object, Function] as PropType<StepsProps['styles']>, default: undefined },

    variant: { type: String as PropType<StepsProps['variant']>, default: 'filled' },
    size: { type: String as PropType<StepsProps['size']>, default: undefined },

    // ---- 布局 ----
    type: { type: String as PropType<StepsType>, default: undefined },
    direction: { type: String as PropType<StepsProps['direction']>, default: undefined },
    orientation: { type: String as PropType<StepsProps['orientation']>, default: undefined },
    labelPlacement: { type: String as PropType<StepsProps['labelPlacement']>, default: undefined },
    titlePlacement: { type: String as PropType<StepsProps['titlePlacement']>, default: undefined },
    progressDot: { type: Boolean, default: undefined },
    responsive: { type: Boolean, default: undefined },
    ellipsis: { type: Boolean, default: undefined },
    maxCount: { type: Number, default: undefined },
    offset: { type: Number, default: 0 },

    // ---- 数据 ----
    current: { type: Number, default: 0 },
    initial: { type: Number, default: 0 },
    items: { type: Array as PropType<StepItem[]>, default: undefined },
    percent: { type: Number, default: undefined },
    status: { type: String as PropType<StepsStatus>, default: undefined },

    // Declared listeners keep the optional interaction affordance reactive.
    // Vue emit owns delivery, including arrays and .once.
    onChange: {
      type: [Function, Array] as PropType<StepsProps['onChange']>,
      default: undefined,
    },
    onChangeOnce: {
      type: [Function, Array] as PropType<StepsProps['onChangeOnce']>,
      default: undefined,
    },
  },
  emits: { change: (_current: number) => true },
  slots: Object as SlotsType<StepsSlots>,
  setup(props, { attrs, emit, slots }) {
    const config = useComponentConfig<{
      className?: string;
      style?: CSSProperties;
      classNames?: StepsSemanticClassNames;
      styles?: StepsSemanticStyles;
    }>('steps');
    const directionCtx = useDirection();
    const warning = useDevWarning('Steps');

    const rootPrefixCls = computed(() => config.getPrefixCls());
    const prefixCls = computed(() => config.getPrefixCls('steps', props.prefixCls));
    const themeStyle = useStepsTheme(() => prefixCls.value);

    // ---- deprecated / usage 告警 ----
    if (props.size === 'default') {
      warning(false, '`size="default"` is deprecated. Please use `size="medium"` instead.');
    }
    if (props.labelPlacement !== undefined) {
      warning(false, '`labelPlacement` is deprecated. Please use `titlePlacement` instead.');
    }
    if (props.progressDot !== undefined) {
      warning(false, '`progressDot` is deprecated. Please use `type="dot"` instead.');
    }
    if (props.direction !== undefined) {
      warning(false, '`direction` is deprecated. Please use `orientation` instead.');
    }
    if ((props.items ?? []).some((item) => item.description !== undefined)) {
      warning(false, '`items.description` is deprecated. Please use `items.content` instead.');
    }
    if (props.maxCount !== undefined && props.maxCount < 3) {
      warning(false, '`maxCount` should be greater than or equal to 3.');
    }

    // ---- size ----
    // size 的 `default` 是 deprecated 别名（运行时告警后按 medium 处理）
    const contextSize = useSize((ctx) =>
      props.size === 'default' ? 'medium' : (props.size ?? ctx),
    );
    // Steps has no large variant; the global large default resolves to medium.
    const mergedSize = computed(() =>
      contextSize.value === 'small'
        ? 'small'
        : contextSize.value === undefined
          ? undefined
          : 'medium',
    );

    // ---- items ----
    const mergedItems = computed<StepItem[]>(() => (props.items ?? []).filter(Boolean));

    // ---- type 推导 ----
    const mergedType = computed<StepsType | undefined>(() => {
      if (props.type && props.type !== 'default') {
        return props.type;
      }
      if (props.progressDot) {
        return 'dot';
      }
      return props.type;
    });
    const isInline = computed(() => mergedType.value === 'inline');
    const isDot = computed(() => mergedType.value === 'dot' || isInline.value);

    // ---- orientation / titlePlacement ----
    // responsive 断点：antd useBreakpoint(responsive).xs；SSR/挂载前恒 false
    const xs = useBreakpointXs(() => props.responsive !== false);
    const mergedOrientation = computed<StepsProps['orientation']>(() => {
      const nextOrientation = props.orientation ?? props.direction;
      if (mergedType.value === 'panel') {
        return 'horizontal';
      }
      return (props.responsive !== false && xs.value) || nextOrientation === 'vertical'
        ? 'vertical'
        : 'horizontal';
    });
    const mergedTitlePlacement = computed<StepsProps['titlePlacement']>(() => {
      if (isDot.value || mergedOrientation.value === 'vertical') {
        return mergedOrientation.value === 'vertical' ? 'horizontal' : 'vertical';
      }
      if (props.type === 'navigation') {
        return 'horizontal';
      }
      return props.titlePlacement ?? props.labelPlacement ?? 'horizontal';
    });

    // ---- percent ----
    const mergedPercent = computed(() => (isInline.value ? undefined : props.percent));

    // ---- maxCount 折叠 ----
    const display = computed(() =>
      useDisplaySteps(
        mergedItems.value,
        props.current ?? 0,
        props.initial ?? 0,
        props.maxCount,
        prefixCls.value,
      ),
    );

    // ---- semantic merge ----
    /**
     * 🚨 函数式语义槽读到的 `props` 必须是**解析后**的值（antd 传 `mergedProps`）。
     *
     * 原先这里传的是 `{} as never` ⇒ `classNames: ({ props }) => \`dir-${props.orientation}\``
     * 恒拿到 `undefined`（实测渲染出 `dir-undefined`）。**是 L4 契约抓到的**。
     */
    const semanticProps = computed<StepsProps>(() => ({
      ...props,
      size: mergedSize.value,
      type: mergedType.value,
      orientation: mergedOrientation.value,
      titlePlacement: mergedTitlePlacement.value,
      percent: mergedPercent.value,
      variant: props.variant ?? 'filled',
    }));

    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      StepsProps,
      StepsSemanticClassNames,
      StepsSemanticStyles
    >(
      // ⚠️ 顺序 = 优先级（后者拼接在前者之后）：ConfigProvider → 组件自身
      [() => config.classNames, () => props.classNames],
      [() => config.styles, () => semanticRootStyle(config.style), () => props.styles],
      semanticProps,
    );

    // ---- internalIconRender（render fn → 在 Step 的 #icon slot 内执行）----
    const iconContentOf = (info: { item: StepItem; mappedIndex: number }): VNodeChild => {
      const { status, icon } = info.item;
      const itemIconCls = `${prefixCls.value}-item-icon`;

      let iconContent: VNodeChild = null;
      if (isDot.value || (icon !== undefined && icon !== null)) {
        iconContent = icon ?? null;
      } else {
        switch (status) {
          case 'finish':
            iconContent = h(CheckOutlined, { class: `${itemIconCls}-finish` });
            break;
          case 'error':
            iconContent = h(CloseOutlined, { class: `${itemIconCls}-error` });
            break;
          default: {
            const numberNode = h(
              'span',
              { class: `${itemIconCls}-number` },
              String(info.mappedIndex + 1),
            );
            if (status === 'process' && mergedPercent.value !== undefined) {
              // ⚠️ 闭包必须捕获**赋值前**的 numberNode —— 引用变量自身会无限递归
              //（default: () => numNode 在 numNode 被重赋值为 ProgressIcon 后指向自身）
              iconContent = h(
                ProgressIcon,
                { prefixCls: prefixCls.value, percent: mergedPercent.value },
                { default: () => numberNode },
              );
            } else {
              iconContent = numberNode;
            }
          }
        }
      }
      return iconContent;
    };

    // ---- maxCount 的 ellipsis 步需要注入 EllipsisOutlined 图标 ----
    const displayItemsWithEllipsisIcon = computed<StepItem[]>(() =>
      display.value.displayItems.map((item) =>
        item.className?.includes('-ellipsis') ? { ...item, icon: h(EllipsisOutlined) } : item,
      ),
    );

    // ---- statuses 推导（rc Steps 逐字）----
    // antd 传给 rc 的是 initial=0 + current=mappedDisplayCurrent（display 索引）——
    // statuses 的比较全部使用 display 索引。
    const statuses = computed<StepsStatus[]>(() =>
      displayItemsWithEllipsisIcon.value.map((item, index) => {
        if (!item.status) {
          // ⚠️ useDisplaySteps 返回的是**数字**（非 ref）—— 不能 .value
          if (index === display.value.mappedDisplayCurrent) {
            return props.status ?? 'process';
          }
          if (index < display.value.mappedDisplayCurrent) {
            return 'finish';
          }
          return 'wait';
        }
        return item.status;
      }),
    );

    // ---- onChange（display 索引 → origin 索引）----
    const onStepClick = (displayIndex: number): void => {
      // 比较基准是 **display 索引的当前步**（mappedDisplayCurrent），不是原始 current
      if (display.value.mappedDisplayCurrent !== displayIndex) {
        const target = display.value.displaySteps[displayIndex];
        if (target && target.originIndex >= 0) {
          emit('change', (props.initial ?? 0) + target.originIndex);
        }
      }
    };

    const cssVarCls = computed(() => `${prefixCls.value}-css-var`);

    // ⚠️ 这条注释**曾经是错的**（2026-10-07 订正）：它说本仓 clsx「不支持对象参数」，
    //    而 `notification/engine/util` 那份**一直有** object 分支（`{k: on}` → `k`）。
    //    现在那份 clsx 已搬到 `_internal/clsx.ts`（裁决 `early-extract-table-core-tree-core` = C），
    //    支持的形态是 string / number / array / object —— **包含**对象参数。
    //    这里仍然手写展开，是因为条件类本来就该显式展开（可读性，不是能力限制）。
    const stepsClassName = () =>
      normalizeClass([
        prefixCls.value,
        // rc Steps 的 classString：orientation + titlePlacement 两个布局类
        `${prefixCls.value}-${mergedOrientation.value}`,
        `${prefixCls.value}-title-${mergedTitlePlacement.value}`,
        `${prefixCls.value}-${props.variant ?? 'filled'}`,
        mergedType.value && mergedType.value !== 'dot'
          ? `${prefixCls.value}-${mergedType.value}`
          : '',
        directionCtx.value === 'rtl' ? `${prefixCls.value}-rtl` : '',
        isDot.value ? `${prefixCls.value}-dot` : '',
        props.ellipsis ? `${prefixCls.value}-ellipsis` : '',
        display.value.canApplyMaxCount ? `${prefixCls.value}-max-count` : '',
        mergedPercent.value !== undefined ? `${prefixCls.value}-with-progress` : '',
        mergedSize.value === 'small' ? `${prefixCls.value}-small` : '',
        config.className,
        // 调用方原生 class（位置与原先的 props.className/rootClassName 一致）
        attrs.class,
        mergedClassNames.value?.root,
        cssVarCls.value,
      ]);

    // ---- root style ----
    const rootStyle = () =>
      normalizeStyle([
        themeStyle.value,
        { [`--${rootPrefixCls.value}-cmp-steps-items-offset`]: String(props.offset) },
        attrs.style,
        mergedStyles.value?.root,
      ]);

    // 🚨 **内部上下文**（Timeline 用）：必须由 Steps **接住并转发** ——
    //    因为 Steps 自己也 provide 同族的键，外层 provide 会被「最近的赢」遮蔽
    //    （PITFALLS 256 的形态）。见 `steps/context.ts` 的文件头。
    const internalContext = inject(stepsInternalContextKey, undefined);
    const unstableContext = inject(stepsUnstableContextKey, undefined);

    provide(stepsIconContextKey, {
      get prefixCls() {
        return prefixCls.value;
      },
      get classNames() {
        return mergedClassNames.value;
      },
      get styles() {
        return mergedStyles.value;
      },
      // `Step` 读它作项标签（缺省 `'div'`）；Timeline 传 `'li'`
      get ItemComponent() {
        return internalContext?.itemComponent;
      },
    });

    return () => {
      const itemCls = prefixCls.value;

      const renderStep = (item: StepItem, index: number): VNodeChild => {
        const stepIndex = index;
        const itemStatus = statuses.value[index] ?? 'wait';
        const nextStatus = statuses.value[index + 1];
        const data: StepItem = { ...item, status: itemStatus };
        const mappedIndex = display.value.displaySteps[index]?.originIndex;
        const realIndex =
          mappedIndex !== undefined && mappedIndex >= 0
            ? (props.initial ?? 0) + mappedIndex
            : (props.initial ?? 0) + index;

        const renderItem = slots.itemRender;
        const inlineContent = data.content ?? data.description;
        const hasInlineContent =
          isInline.value && inlineContent !== undefined && inlineContent !== null;

        return h(
          Step,
          {
            key: item.key ?? stepIndex,
            prefixCls: itemCls,
            classNames: mergedClassNames.value,
            styles: mergedStyles.value,
            data,
            nextStatus,
            // rc-steps 的 `UnstableContext.railFollowPrevStatus`：缺省 `false` ⇒ 恒取 nextStatus
            railFollowPrevStatus: unstableContext?.railFollowPrevStatus,
            active: stepIndex === display.value.mappedDisplayCurrent,
            index: stepIndex,
            last: displayItemsWithEllipsisIcon.value.length - 1 === index,
            onClick: props.onChange || props.onChangeOnce ? onStepClick : undefined,
          },
          {
            icon: () => {
              const defaultIconNode = h(
                StepIcon,
                {},
                { default: () => iconContentOf({ item: data, mappedIndex: realIndex }) },
              );
              let iconNode: VNodeChild = defaultIconNode;
              if (slots.iconRender) {
                const replaced = slots.iconRender({
                  iconNode,
                  index: realIndex,
                  active: stepIndex === display.value.mappedDisplayCurrent,
                  item: data,
                });
                iconNode = replaced ?? iconNode;
              } else if (slots.progressDot && isDot.value) {
                const replaced = slots.progressDot({
                  iconNode,
                  index: realIndex,
                  status: itemStatus,
                  title: data.title ?? null,
                  description: data.description ?? null,
                  content: data.content ?? null,
                });
                iconNode = replaced ?? iconNode;
              }
              return iconNode;
            },
            itemRender:
              renderItem || hasInlineContent
                ? (p: { itemNode: VNodeChild }) => {
                    // Capture the original before wrapping; a closure over the
                    // assigned Tooltip node recursively mounts that Tooltip itself.
                    const originNode = p.itemNode;
                    const content = hasInlineContent
                      ? h(
                          Tooltip,
                          { destroyOnHidden: true },
                          { default: () => originNode, title: () => inlineContent },
                        )
                      : originNode;
                    return renderItem
                      ? renderItem({
                          itemNode: content,
                          index: realIndex,
                          active: stepIndex === display.value.mappedDisplayCurrent,
                          item: data,
                        })
                      : content;
                  }
                : undefined,
            // antd：panel 类型在 wrapper 后追加 PanelArrow（用户 #itemWrapperRender 插槽优先）
            itemWrapperRender:
              slots.itemWrapperRender ??
              (mergedType.value === 'panel'
                ? (p: { itemNode: VNodeChild }) => [
                    p.itemNode,
                    h(PanelArrow, { prefixCls: prefixCls.value }),
                  ]
                : undefined),
          },
        );
      };

      const nodes: VNodeChild[] = displayItemsWithEllipsisIcon.value.map((item, index) =>
        renderStep(item, index),
      );

      // ⚠️ `class` / `style` 都已被显式消费（见 stepsClassName / rootStyle）⇒
      //    必须从 restAttrs 里摘掉，否则末尾的 `...restAttrs` 会把它们整段顶掉。
      const { class: _attrsClass, style: _attrStyle, ...restAttrs } = attrs;
      // ⚠️ 根标签可由内部上下文覆盖（Timeline 传 `'ol'`）；缺省仍是 `'div'`
      return h(
        internalContext?.rootComponent ?? 'div',
        // Outer native attrs are merged at the actual DOM boundary, so native
        // change listeners never enter Steps.onChange. Keep internal root
        // class/style last; mergeProps composes listeners without dropping them.
        mergeProps(restAttrs, internalContext?.rootAttrs ?? {}, {
          class: stepsClassName(),
          style: rootStyle(),
        }),
        nodes,
      );
    };
  },
});

/** Keep the current viewport available when responsive is enabled later. */
function useBreakpointXs(responsive: () => boolean): ComputedRef<boolean> {
  const screens = useBreakpoint(responsive);
  return computed(() => Boolean(screens.value?.xs));
}

export default Steps;
