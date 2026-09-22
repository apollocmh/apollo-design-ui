/**
 * Statistic —— 统计数值。
 *
 * 契约来源：antd 6.6.4 的 `es/statistic/Statistic.js`（判据逐条对齐，G1 §2）。
 *
 * ── 为什么是 render 函数 ─────────────────────────────────────────────────────
 *
 * valueRender / Timer 的克隆注入需要拿到 valueNode 的 VNode 引用（badge/Tag 同范式）；
 * Skeleton 包裹用 `h()` 比 SFC 模板里的双分支更贴近上游形态。
 *
 * ── 七条最容易写错的判据 ─────────────────────────────────────────────────────
 *
 * 1. **可渲染判据 = `isRenderable`**（= rc 的 `isReactRenderable`：非 null/undefined、
 *    非 false、非 ''）—— `0` **渲染**（测试钉住 title/prefix/suffix 传 0）、
 *    `true` 也过判据（React 渲染成空文本但包裹 div 存在）。
 * 2. **类名顺序**（clsx 参数序就是契约）：root = prefixCls → `-rtl` →
 *    contextClassName → className → rootClassName → mergedClassNames.root
 *    （⚠️ 与 skeleton 的顺序不同：语义化 root 在用户类名**之后**）。
 * 3. **content 的 style**：`{...valueStyle, ...mergedStyles.content}` ——
 *    valueStyle（deprecated）在前 ⇒ 被语义化样式覆盖。
 * 4. **Skeleton 包裹**：`paragraph:false, loading, className:-skeleton, active:true`；
 *    loading=false 时 Skeleton 渲染 children 本体（无包裹层）。
 * 5. **aria/data 过滤**：`pickAttrs(attrs, {aria:true, data:true})` —— 其余 attrs
 *    （包括 onClick 等）**不透传**（antd 同判）。
 * 6. **Number 的 groupSeparator 默认 `','`（Statistic 解构默认）**，但 Number 组件
 *    自身默认 `''` —— 两条默认值属于两个组件。
 * 7. **formatter 只认函数**：`false` / `'number'` / `'countdown'` 都走内部格式化。
 *
 * ── 语义化合并（与 skeleton 同形态）─────────────────────────────────────────
 *
 * ```
 * classNames: [contextClassNames, classNames]                                  —— 拼接
 * styles:     [contextStyles, {root: contextStyle}, styles, {root: style}]     —— 后者胜
 * ```
 */

import { isFunction, isRenderable, pickAttrs, useDevWarning } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  type PropType,
  shallowRef,
  type VNode,
  type VNodeChild,
  watchEffect,
} from 'vue';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import Skeleton from '../skeleton';
import type {
  StatisticConfig,
  StatisticFormatter,
  StatisticProps,
  StatisticSemanticClassNames,
  StatisticSemanticStyles,
  ValueType,
} from './interface';
import StatisticNumber from './Number';

export default defineComponent({
  name: 'AStatistic',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    className: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    style: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    value: { type: [Number, String] as PropType<ValueType>, default: 0 },
    valueStyle: {
      type: Object as PropType<Record<string, string | number>>,
      default: undefined,
    },
    valueRender: {
      type: Function as PropType<(node: VNode) => VNodeChild>,
      default: undefined,
    },
    title: { type: null as unknown as PropType<StatisticProps['title']>, default: undefined },
    prefix: { type: null as unknown as PropType<StatisticProps['prefix']>, default: undefined },
    suffix: { type: null as unknown as PropType<StatisticProps['suffix']>, default: undefined },
    loading: { type: Boolean, default: false },
    /* --- FormatConfig --- */
    formatter: {
      type: [Boolean, String, Function] as PropType<StatisticFormatter>,
      default: undefined,
    },
    precision: { type: Number, default: undefined },
    decimalSeparator: { type: String, default: '.' },
    groupSeparator: { type: String, default: ',' },
    /* --- 事件（antd 的显式 props） --- */
    onMouseenter: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
    onMouseleave: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
    /* --- 语义化 --- */
    // 语义化输入是「对象 | 函数」（antd 的 GenerateSemantic 两态）——
    // Vue 的 prop 校验需要显式放行 Function，否则函数形态触发 Invalid prop 告警。
    classNames: {
      type: [Object, Function] as PropType<StatisticProps['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as PropType<StatisticProps['styles']>,
      default: undefined,
    },
  },
  setup(props, { attrs, expose, slots }) {
    // StatisticConfig = ComponentStyleConfig & Pick<StatisticProps,'classNames'|'styles'>
    const context = useComponentConfig<StatisticConfig>('statistic');
    const { getPrefixCls } = context;
    const contextClassName = context.className;
    const contextStyle = context.style;
    const contextClassNames = context.classNames;
    const contextStyles = context.styles;
    const direction = useDirection();

    const rootRef = shallowRef<HTMLDivElement | null>(null);
    expose({
      get nativeElement() {
        return rootRef.value;
      },
    });

    // ============================= Warning ==============================
    const warning = useDevWarning('Statistic');
    warning.deprecated(props.valueStyle === undefined, 'valueStyle', 'styles.content');

    const prefixCls = computed(() => getPrefixCls('statistic', props.prefixCls));

    // =========== Merged Props for Semantic ===========
    // antd：{...props, decimalSeparator, groupSeparator, loading, value} ——
    // 后四者是解构带默认值的结果，Vue 的 props 已应用默认，逐字等价。
    // 普通对象 + watchEffect 同步（skeleton 同条：函数式语义化的 info.props
    // 要「身份稳定、内容随 props 同步」）。
    const semanticProps: StatisticProps = { ...props };
    watchEffect(() => {
      Object.assign(semanticProps, props);
    });

    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      StatisticProps,
      StatisticSemanticClassNames,
      StatisticSemanticStyles
    >(
      [() => contextClassNames, () => props.classNames],
      [
        () => contextStyles as StatisticSemanticStyles | undefined,
        () => semanticRootStyle(contextStyle as StatisticProps['style']),
        () => props.styles,
        () => semanticRootStyle(props.style),
      ],
      semanticProps,
    );

    // ============================= Render ===============================
    return () => {
      // ReactNode prop 的 Vue 双通道（button/icon 同约定）：**prop 优先，插槽兜底**。
      const titleValue = props.title ?? slots.title?.();
      const prefixValue = props.prefix ?? slots.prefix?.();
      const suffixValue = props.suffix ?? slots.suffix?.();
      const cls = prefixCls.value;
      const rootClassNames = [
        cls,
        {
          [`${cls}-rtl`]: direction.value === 'rtl',
        },
        contextClassName,
        props.className,
        props.rootClassName,
        mergedClassNames.value.root,
      ];
      const headerClassNames = [`${cls}-header`, mergedClassNames.value.header].filter(
        (c): c is string => !!c,
      );
      const titleClassNames = [`${cls}-title`, mergedClassNames.value.title].filter(
        (c): c is string => !!c,
      );
      const contentClassNames = [`${cls}-content`, mergedClassNames.value.content].filter(
        (c): c is string => !!c,
      );
      const valueClassNames = [`${cls}-content-value`, mergedClassNames.value.value].filter(
        (c): c is string => !!c,
      );
      const prefixClassNames = [`${cls}-content-prefix`, mergedClassNames.value.prefix].filter(
        (c): c is string => !!c,
      );
      const suffixClassNames = [`${cls}-content-suffix`, mergedClassNames.value.suffix].filter(
        (c): c is string => !!c,
      );

      const valueNode = h(StatisticNumber, {
        decimalSeparator: props.decimalSeparator,
        groupSeparator: props.groupSeparator,
        prefixCls: cls,
        formatter: props.formatter,
        precision: props.precision,
        value: props.value,
        className: valueClassNames,
        style: mergedStyles.value.value as never,
      } as never);

      // antd 逐字：isFunction(valueRender) ? valueRender(valueNode) : valueNode
      const mergedValueNode = isFunction(props.valueRender)
        ? props.valueRender(valueNode as VNode)
        : (valueNode as VNodeChild);

      const contentNode = h(
        'div',
        {
          class: contentClassNames,
          style: {
            ...(props.valueStyle as Record<string, string | number | undefined>),
            ...(mergedStyles.value.content as Record<string, string | number | undefined>),
          },
        },
        [
          isRenderable(prefixValue)
            ? h(
                'span',
                {
                  class: prefixClassNames,
                  style: mergedStyles.value.prefix as never,
                },
                [prefixValue as VNodeChild],
              )
            : null,
          mergedValueNode,
          isRenderable(suffixValue)
            ? h(
                'span',
                {
                  class: suffixClassNames,
                  style: mergedStyles.value.suffix as never,
                },
                [suffixValue as VNodeChild],
              )
            : null,
        ],
      );

      const restProps = pickAttrs(attrs, { aria: true, data: true });

      return h(
        'div',
        {
          ...restProps,
          ref: rootRef,
          class: rootClassNames,
          ...styleAttrs(mergedStyles.value.root),
          onMouseenter: props.onMouseenter,
          onMouseleave: props.onMouseleave,
        },
        [
          isRenderable(titleValue)
            ? h(
                'div',
                {
                  class: headerClassNames,
                  style: mergedStyles.value.header as never,
                },
                [
                  h(
                    'div',
                    {
                      class: titleClassNames,
                      style: mergedStyles.value.title as never,
                    },
                    [titleValue as VNodeChild],
                  ),
                ],
              )
            : null,
          h(
            Skeleton,
            {
              paragraph: false,
              loading: props.loading,
              className: `${cls}-skeleton`,
              active: true,
            },
            { default: () => contentNode },
          ),
        ],
      );
    };
  },
});
