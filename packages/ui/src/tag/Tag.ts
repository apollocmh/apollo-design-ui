/**
 * Tag —— 标签。
 *
 * 契约来源：antd 6.6.4 的 `es/tag/index.js`（判据逐条对齐，G1 分析 §2）。
 *
 * ── 为什么是 render 函数 ──────────────────────────────────────────────────────
 *
 * icon 要 `cloneVNode` 注入语义槽位类名、closeIcon 要注入 role/tabIndex/事件
 * （badge/ScrollNumber 同范式）。
 *
 * ── 五条最容易写错的判据 ─────────────────────────────────────────────────────
 *
 *   1. **useColor 判据链**：`-inverse` 后缀 → solid 且去后缀；solid 且无 color →
 *      'default'；非预设非状态 → 动态内联色（solid 直铺 / 其它 hsl.l=0.95 浅底）。
 *   2. **关闭流程**：disabled 直接 return；stopPropagation → onClose →
 *      defaultPrevented 中止 → href 时 preventDefault → visible=false
 *      （**DOM 保留**，`-hidden` 类隐藏）。
 *   3. **tagStyle 合并**：disabled → 只 styles.root；否则
 *      `{...动态色, ...styles.root}`（语义槽位覆盖动态色）。
 *   4. **icon 存在时** children 包进 content 槽 span。
 *   5. **href → `<a>`**；disabled 时 href 置 undefined + aria-disabled。
 *
 * ⚠️ Wave（点击波纹）未实现：antd 只在 onClick 或 children 是 `<a>` 时包 Wave，
 *    它不改变静态 DOM/SSR 产物（运行时插入动画层）—— 缺口登记 README §7。
 */

import { useLocale } from '@apollo-design/locale';
import {
  isComponentVNode,
  isEmptyVNode,
  isRenderable,
  isVNode,
  useDevWarning,
} from '@apollo-design/utils';
import {
  cloneVNode,
  computed,
  defineComponent,
  Fragment,
  h,
  type PropType,
  ref,
  shallowRef,
  type VNode,
  type VNodeChild,
} from 'vue';
import { useClosable } from '../_internal/use-closable';
import { semanticRootStyle, styleAttrs, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig } from '../config-provider/context';
import { useDisabled } from '../config-provider/disabled-context';
import { useColor } from './hooks/use-color';
import type {
  TagConfig,
  TagProps,
  TagSemanticClassNames,
  TagSemanticStyles,
  TagVariant,
} from './interface';

export default defineComponent({
  name: 'ATag',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    className: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    color: { type: String, default: undefined },
    variant: { type: String as PropType<TagVariant>, default: undefined },
    bordered: { type: Boolean, default: undefined },
    closable: { type: [Boolean, Object] as PropType<TagProps['closable']>, default: undefined },
    onClose: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
    href: { type: String, default: undefined },
    target: { type: String, default: undefined },
    disabled: { type: Boolean, default: undefined },
    style: { type: Object as PropType<Record<string, string | number>>, default: undefined },
    classNames: { type: Object as PropType<TagSemanticClassNames>, default: undefined },
    styles: { type: Object as PropType<TagSemanticStyles>, default: undefined },
  },
  setup(props, { slots, attrs, expose }) {
    // ============ slot：ReactNode / render prop 的唯一入口（规则 C8-R2）============
    /**
     * 「提供了但渲染为空」归一为 null（isEmptyVNode —— comment vnode 判空）。
     * 单元素数组解包成 vnode 本身 —— closeIcon 走 antd 的 replaceElement 语义
     * （closeIconRender 要拿到**单个**用户 vnode 来 clone 注入 role/tabIndex/类）。
     */
    const readSlot = (name: string): unknown => {
      const fn = (slots as Record<string, unknown>)[name];
      if (typeof fn !== 'function') return undefined;
      const nodes = (fn as (...args: unknown[]) => unknown)();
      if (nodes === undefined) return undefined;
      if (isEmptyVNode(nodes)) return null;
      if (Array.isArray(nodes) && nodes.length === 1) return nodes[0];
      return nodes;
    };
    // TagConfig = ComponentStyleConfig & Pick<TagProps,'variant'|'closeIcon'|'closable'|'classNames'|'styles'>
    const context = useComponentConfig<TagConfig>('tag');
    const { getPrefixCls, direction } = context;
    const contextClassName = context.className;
    const contextVariant = context.variant;
    const contextStyle = context.style;
    const contextClassNames = context.classNames;
    const contextStyles = context.styles;
    const contextClosable = context.closable;
    const contextCloseIcon = context.closeIcon;

    const rootRef = shallowRef<HTMLElement | null>(null);
    expose({
      get nativeElement() {
        return rootRef.value;
      },
    });

    // ===================== Warnings =====================
    const warning = useDevWarning('Tag');
    warning.deprecated(props.bordered !== false, 'bordered={false}', 'variant="filled"');
    warning.deprecated(
      !props.color?.endsWith('-inverse'),
      'color="xxx-inverse"',
      'variant="solid"',
    );

    // ====================== Colors ======================
    const colorResult = useColor(
      () => ({ color: props.color, variant: props.variant, bordered: props.bordered }),
      () => contextVariant as TagVariant | undefined,
    );
    const isInternalColor = computed(
      () => colorResult.value.isPreset || colorResult.value.isStatus,
    );

    // ===================== Disabled =====================
    const mergedDisabled = useDisabled(props.disabled);

    // ====================== Visible ======================
    const visible = ref(true);

    // =========== Merged Props for Semantic ===========
    const semanticProps = computed(() => ({
      ...props,
      color: colorResult.value.color,
      variant: colorResult.value.variant,
      disabled: mergedDisabled.value,
    }));

    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      TagProps,
      NonNullable<TagProps['classNames']>,
      NonNullable<TagProps['styles']>
    >(
      [() => contextClassNames, () => props.classNames],
      [
        () => contextStyles as TagSemanticStyles | undefined,
        () => semanticRootStyle(contextStyle as TagProps['style']),
        () => props.styles,
        () => semanticRootStyle(props.style),
      ],
      semanticProps.value,
    );

    /** antd 逐字：disabled → 只 styles.root；否则动态色在前、语义槽位覆盖。 */
    const tagStyle = computed<Record<string, string | number | undefined>>(() => {
      let next: Record<string, string | number | undefined> = { ...mergedStyles.value.root };
      if (!mergedDisabled.value) {
        next = { ...colorResult.value.tagStyle, ...next };
      }
      return next;
    });

    const prefixCls = computed(() => getPrefixCls('tag', props.prefixCls));

    // ===================== Closable =====================
    const triggerClose = (e: MouseEvent) => {
      if (mergedDisabled.value) {
        return;
      }
      e.stopPropagation();
      props.onClose?.(e);
      if (e.defaultPrevented) {
        return;
      }
      if (props.href) {
        e.preventDefault();
      }
      visible.value = false;
    };

    const handleCloseKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!e.repeat) {
          (e.currentTarget as HTMLElement).click();
        }
      }
    };

    const [globalLocale] = useLocale('global');

    const closableResult = useClosable(
      () => pickClosableLocal(),
      () =>
        pickClosableLocal({
          closable: contextClosable as TagProps['closable'],
          closeIcon: contextCloseIcon as VNodeChild,
        }),
      {
        closable: false,
        closeLabel: (globalLocale as { close?: string }).close,
        closeIconRender: (iconNode: unknown) => {
          // antd 的 replaceElement + cloneElement 合并语义：**克隆用户/默认图标
          // 元素本身**注入 role/tabIndex/aria-label/类/事件（单层 DOM —— 基线
          // 产物 `span[role=button][aria-label=Close].anticon.anticon-close.-
          // close-icon` 逐字同构）；非 vnode 值才包 span。
          const origin = isVNode(iconNode) ? (iconNode as VNode) : null;
          if (origin) {
            // ⚠️ 键名按 vnode 类型区分：组件 vnode（如 CloseOutlined）走 tabIndex
            // prop（createIcon 对「有 onClick 且无 tabIndex」兜底 -1，必须显式覆盖）；
            // 元素 vnode 走 tabindex attr。否则禁用态的 -1/0 会错成 -1。
            const tabIndexKey = isComponentVNode(origin) ? 'tabIndex' : 'tabindex';
            return cloneVNode(origin, {
              role: 'button',
              [tabIndexKey]: mergedDisabled.value ? -1 : 0,
              'aria-disabled': mergedDisabled.value || undefined,
              'aria-label': (globalLocale as { close?: string }).close,
              class: [
                (origin.props?.class as string | undefined) ?? '',
                `${prefixCls.value}-close-icon`,
                mergedClassNames.value.close,
              ],
              style: {
                ...(mergedStyles.value.close as Record<string, string | number | undefined>),
                ...(origin.props?.style as object),
              },
              onClick: (e: MouseEvent) => {
                (origin.props?.onClick as ((ev: MouseEvent) => void) | undefined)?.(e);
                triggerClose(e);
              },
              onKeydown: (e: KeyboardEvent) => {
                (origin.props?.onKeyDown as ((ev: KeyboardEvent) => void) | undefined)?.(e);
                if (!e.defaultPrevented) {
                  handleCloseKeyDown(e);
                }
              },
            } as never);
          }
          return h(
            'span',
            {
              role: 'button',
              tabindex: mergedDisabled.value ? -1 : 0,
              'aria-label': (globalLocale as { close?: string }).close,
              class: [`${prefixCls.value}-close-icon`, mergedClassNames.value.close],
              onClick: triggerClose,
              onKeydown: handleCloseKeyDown,
              style: mergedStyles.value.close as never,
            },
            iconNode as never,
          );
        },
      },
    );

    const pickClosableLocal = (source?: {
      closable?: TagProps['closable'];
      closeIcon?: VNodeChild;
    }) =>
      source ?? {
        closable: props.closable,
        closeIcon: readSlot('closeIcon'),
      };

    // ====================== Render ======================
    return () => {
      const TagWrapper = props.href ? 'a' : 'span';

      // icon 克隆注入语义槽位（antd 的 cloneElement 分支）
      const iconSource = slots.icon?.() ?? [];
      const iconFirst = Array.isArray(iconSource) ? iconSource[0] : iconSource;
      const iconNode = isVNode(iconFirst)
        ? cloneVNode(iconFirst, {
            class: mergedClassNames.value.icon,
            style: mergedStyles.value.icon as never,
          })
        : null;

      const childrenVNodes = slots.default?.();
      const hasIcon = iconNode !== null && iconNode !== undefined && isRenderable(iconNode);

      // antd 逐字：iconNode 存在 → children 包 content 槽；否则原样
      const child = hasIcon
        ? h(Fragment, [
            iconNode,
            isRenderable(childrenVNodes)
              ? h(
                  'span',
                  {
                    class: mergedClassNames.value.content,
                    style: mergedStyles.value.content as never,
                  },
                  childrenVNodes,
                )
              : null,
          ])
        : childrenVNodes;

      // 关闭按钮（closable 结果已在 closeIconRender 里包好 —— 但 antd 是把
      // mergedCloseIcon 直接渲染；我们的 fallback/closeIcon 都走 render 包装）
      const mergedClose = closableResult.value;
      const closeIconNode =
        mergedClose.closable && mergedClose.closeIconNode ? mergedClose.closeIconNode : null;

      const restAttrs: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(attrs)) {
        if (key !== 'class' && key !== 'style') {
          restAttrs[key] = value;
        }
      }

      const tagClassName = [
        prefixCls.value,
        contextClassName,
        mergedClassNames.value.root,
        `${prefixCls.value}-${colorResult.value.variant}`,
        {
          [`${prefixCls.value}-${colorResult.value.color}`]: isInternalColor.value,
          [`${prefixCls.value}-hidden`]: !visible.value,
          [`${prefixCls.value}-rtl`]: direction === 'rtl',
          [`${prefixCls.value}-disabled`]: mergedDisabled.value,
        },
        props.className,
        props.rootClassName,
      ];

      return h(
        TagWrapper as 'a' | 'span',
        {
          ref: rootRef,
          ...restAttrs,
          class: tagClassName,
          ...styleAttrs(tagStyle.value),
          href: mergedDisabled.value ? undefined : props.href,
          target: props.target,
          onClick: mergedDisabled.value ? undefined : restAttrs.onClick,
          ...(props.href && mergedDisabled.value ? { 'aria-disabled': true } : {}),
        },
        [child, closeIconNode].filter((n): n is VNode => n !== null),
      );
    };
  },
});
