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
  type PropType,
  provide,
  type VNodeChild,
  watchEffect,
} from 'vue';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { type SizeType, useSize } from '../config-provider/size-context';
import { useBreakpoint } from '../grid/hooks/use-breakpoint';
import Tooltip from '../tooltip/Tooltip';
import { stepsInternalContextKey, stepsUnstableContextKey } from './context';
import type {
  StepItem,
  StepsProps,
  StepsSemanticClassNames,
  StepsSemanticStyles,
  StepsStatus,
  StepsType,
} from './interface';
import PanelArrow from './PanelArrow';
import ProgressIcon from './ProgressIcon';
import Step from './Step';
import StepIcon, { stepsIconContextKey } from './StepIcon';
import { useDisplaySteps } from './useDisplaySteps';

export const Steps = defineComponent({
  name: 'ASteps',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    classNames: {
      type: Object as PropType<StepsSemanticClassNames>,
      default: undefined,
    },
    styles: { type: Object as PropType<StepsSemanticStyles>, default: undefined },

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

    // ---- 事件 ----
    onChange: {
      type: Function as PropType<((current: number) => void) | undefined>,
      default: undefined,
    },
  },
  setup(props, { attrs, slots }) {
    const {
      getPrefixCls,
      // ⚠️ 组件级配置的**全部**四项 —— 原先只取了 `getPrefixCls`
      //    ⇒ ConfigProvider 的 `components.steps.className/style/classNames/styles` 被静默忽略。
      className: contextClassName,
      style: contextStyle,
      classNames: contextClassNames,
      styles: contextStyles,
    } = useComponentConfig<{
      className?: string;
      style?: CSSProperties;
      classNames?: StepsSemanticClassNames;
      styles?: StepsSemanticStyles;
    }>('steps');
    const directionCtx = useDirection();
    const warning = useDevWarning('Steps');

    const rootPrefixCls = getPrefixCls();
    const prefixCls = computed(() => getPrefixCls('steps', props.prefixCls));

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
    const mergedSize = useSize<SizeType | undefined>((ctx) => {
      const raw = props.size;
      const normalized =
        raw === 'default' ? ('medium' as const) : ((raw ?? ctx) as SizeType | undefined);
      return normalized ?? ctx;
    });

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
    const xs = useBreakpointXs(props.responsive !== false);
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
    const { canApplyMaxCount, displaySteps, mappedDisplayCurrent, displayItems } = useDisplaySteps(
      mergedItems.value,
      props.current ?? 0,
      props.initial ?? 0,
      props.maxCount,
      prefixCls.value,
    );

    // ---- semantic merge ----
    /**
     * 🚨 函数式语义槽读到的 `props` 必须是**解析后**的值（antd 传 `mergedProps`）。
     *
     * 原先这里传的是 `{} as never` ⇒ `classNames: ({ props }) => \`dir-${props.orientation}\``
     * 恒拿到 `undefined`（实测渲染出 `dir-undefined`）。**是 L4 契约抓到的**。
     */
    const semanticProps = { ...props } as StepsProps;
    watchEffect(() => {
      Object.assign(semanticProps, props, {
        size: mergedSize.value as StepsProps['size'],
        type: mergedType.value,
        orientation: mergedOrientation.value,
        titlePlacement: mergedTitlePlacement.value,
        percent: mergedPercent.value,
        variant: props.variant ?? 'filled',
      });
    });

    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      StepsProps,
      StepsSemanticClassNames,
      StepsSemanticStyles
    >(
      // ⚠️ 顺序 = 优先级（后者拼接在前者之后）：ConfigProvider → 组件自身
      [() => contextClassNames, () => props.classNames],
      [() => contextStyles, () => semanticRootStyle(contextStyle), () => props.styles],
      semanticProps,
    );

    // ---- internalIconRender（render fn → 在 Step 的 #icon slot 内执行）----
    const iconContentOf = (info: { item: StepItem; mappedIndex: number }): VNodeChild => {
      const { status, icon } = info.item;
      const itemIconCls = `${prefixCls.value}-item-icon`;

      let iconContent: VNodeChild = null;
      if (isDot.value || icon) {
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
      displayItems.map((item) =>
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
          if (index === mappedDisplayCurrent) {
            return props.status ?? 'process';
          }
          if (index < mappedDisplayCurrent) {
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
      if (props.onChange && mappedDisplayCurrent !== displayIndex) {
        const target = displaySteps[displayIndex];
        if (target && target.originIndex >= 0) {
          props.onChange((props.initial ?? 0) + target.originIndex);
        }
      }
    };

    const cssVarCls = computed(() => `${prefixCls.value}-css-var`);

    // ⚠️ 这条注释**曾经是错的**（2026-10-07 订正）：它说本仓 clsx「不支持对象参数」，
    //    而 `notification/engine/util` 那份**一直有** object 分支（`{k: on}` → `k`）。
    //    现在那份 clsx 已搬到 `_internal/clsx.ts`（裁决 `early-extract-table-core-tree-core` = C），
    //    支持的形态是 string / number / array / object —— **包含**对象参数。
    //    这里仍然手写展开，是因为条件类本来就该显式展开（可读性，不是能力限制）。
    const stepsClassName = computed(() =>
      [
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
        canApplyMaxCount ? `${prefixCls.value}-max-count` : '',
        mergedPercent.value !== undefined ? `${prefixCls.value}-with-progress` : '',
        mergedSize.value === 'small' ? `${prefixCls.value}-small` : '',
        contextClassName,
        // 调用方原生 class（位置与原先的 props.className/rootClassName 一致）
        attrs.class as string | undefined,
        mergedClassNames.value?.root,
        cssVarCls.value,
      ]
        .filter(Boolean)
        .join(' '),
    );

    // ---- root style ----
    const rootStyle = computed(() => ({
      // ⚠️ **恒写**（含 `offset: 0`）—— 上游 SSR 产物在 offset=0 时也有
      //    `style="--ant-cmp-steps-items-offset:0"`（L4 基线逐条确认）。
      //    原先只在 `offset !== 0` 时写 ⇒ 37 条契约用例全部差这一条。
      [`--${rootPrefixCls}-cmp-steps-items-offset`]: String(props.offset),
      // 根 style 是 Vue 原生 attrs：位置与原先的 props.style 一致（被语义 root 覆盖）。
      // ⚠️ 这里用 `attrs.style` 而不是 render 里的 `_attrStyle` —— 本 computed 在
      //    setup 期创建，看不到 render 函数内的局部解构。
      ...((attrs.style as Record<string, unknown>) ?? {}),
      ...mergedStyles.value?.root,
    }));

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
    } as never);

    return () => {
      const itemCls = prefixCls.value;

      const renderStep = (item: StepItem, index: number): VNodeChild => {
        const stepIndex = index;
        const itemStatus = statuses.value[index];
        const nextStatus = statuses.value[index + 1];
        const data: StepItem = { ...item, status: itemStatus };
        const mappedIndex = displaySteps[index]?.originIndex;
        const realIndex =
          mappedIndex !== undefined && mappedIndex >= 0
            ? (props.initial ?? 0) + mappedIndex
            : (props.initial ?? 0) + index;

        return h(
          Step,
          {
            key: (item.key as string | number) ?? stepIndex,
            prefixCls: itemCls,
            classNames: mergedClassNames.value,
            styles: mergedStyles.value,
            data,
            nextStatus,
            // rc-steps 的 `UnstableContext.railFollowPrevStatus`：缺省 `false` ⇒ 恒取 nextStatus
            railFollowPrevStatus: unstableContext?.railFollowPrevStatus,
            active: stepIndex === mappedDisplayCurrent,
            index: stepIndex,
            last: displayItemsWithEllipsisIcon.value.length - 1 === index,
            onClick: props.onChange ? onStepClick : undefined,
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
                  active: stepIndex === mappedDisplayCurrent,
                  item: data,
                }) as VNodeChild | undefined;
                iconNode = replaced ?? iconNode;
              } else if (slots.progressDot && isDot.value) {
                const replaced = slots.progressDot({
                  iconNode,
                  index: realIndex,
                  status: itemStatus,
                  title: (data.title ?? null) as VNodeChild,
                  description: (data.description ?? null) as VNodeChild,
                  content: (data.content ?? null) as VNodeChild,
                }) as VNodeChild | undefined;
                iconNode = replaced ?? iconNode;
              }
              return iconNode;
            },
            itemRender: slots.itemRender
              ? (p: { itemNode: VNodeChild }) => {
                  // antd：inline 且有 content ⇒ 包 Tooltip；外层 Wave（本仓 v1 无 wave 基建，降级）
                  let content: VNodeChild = p.itemNode;
                  if (isInline.value && data.content !== undefined && data.content !== null) {
                    content = h(
                      Tooltip,
                      { destroyOnHidden: true, title: data.content as never },
                      { default: () => content },
                    );
                  }
                  return (slots.itemRender as (p2: never) => unknown)({
                    itemNode: content,
                    index: realIndex,
                    active: stepIndex === mappedDisplayCurrent,
                    item: data,
                  } as never);
                }
              : undefined,
            // antd：panel 类型在 wrapper 后追加 PanelArrow（用户 #itemWrapperRender 插槽优先）
            itemWrapperRender:
              slots.itemWrapperRender ??
              (mergedType.value === 'panel'
                ? (p: { itemNode: VNodeChild }) =>
                    [
                      p.itemNode,
                      h(PanelArrow, { prefixCls: prefixCls.value }),
                    ] as unknown as VNodeChild
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
        {
          class: stepsClassName.value,
          style: rootStyle.value,
          ...restAttrs,
        },
        nodes,
      );
    };
  },
});

/** useBreakpoint 的 xs 切片（responsive=false ⇒ 恒 false，不订阅）。 */
function useBreakpointXs(responsive: boolean): ComputedRef<boolean> {
  if (!responsive) {
    return computed(() => false);
  }
  const screens = useBreakpoint();
  return computed(() => Boolean(screens.value?.xs));
}

export default Steps;
