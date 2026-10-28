/** Native content, decorations and copy/edit/ellipsis operations for the four semantic entries.
 * Algorithm reference: antd6.6.4 typography. Apollo's Vue slot, native action tree,
 * current configuration, focus and measurement contracts are defined in the public docs.
 */

import { EditOutlined } from '@apollo-design/icons';
import { useLocaleReactive } from '@apollo-design/locale';
import {
  isStyleSupport,
  useControlledValue,
  useDelayState,
  useResizeObserver,
} from '@apollo-design/utils';
import {
  type CSSProperties,
  computed,
  defineComponent,
  type ExtractPropTypes,
  h,
  mergeProps,
  normalizeClass,
  normalizeStyle,
  onUpdated,
  type PropType,
  ref,
  watch,
} from 'vue';

import type { DirectionType } from '../config-provider/context';
import Tooltip from '../tooltip/Tooltip';
import {
  isValidText,
  plainText,
  type RenderableChild,
  renderNodes,
  type TypographyNode,
  toNodeList,
} from './_util/nodes';
import { getNode, isEleEllipsis } from './_util/util';
import { CopyBtn } from './CopyBtn';
import { Editable } from './Editable';
import { Ellipsis, type EllipsisSlotProps } from './Ellipsis';
import { EllipsisTooltip } from './EllipsisTooltip';
import { useCopyClick } from './hooks/use-copy-click';
import { useMergedConfig } from './hooks/use-merged-config';
import { useTooltipProps } from './hooks/use-tooltip-props';
import { useTypographySemantic } from './hooks/use-typography-semantic';
import InternalTypography from './InternalTypography.vue';
import type {
  ActionsConfig,
  BaseType,
  BlockProps,
  CopyConfig,
  EditConfig,
  EllipsisConfig,
} from './interface';

const ELLIPSIS_STR = '...';

function nativeStyle(value: unknown): CSSProperties | undefined {
  const style = normalizeStyle([value]);
  return style && typeof style === 'object' ? style : undefined;
}

/**
 * 把可能是数组 / `null` / `undefined` / `false` 的孩子拍平，并剔掉「什么都不画」的项。
 *
 * ⚠️ 这不是「顺手加的一层」。React 渲染 `null` / `undefined` / `false` 子节点时
 *    **不产生任何节点**，而 Vue 会各产生一个**注释节点**（`<!---->`）。
 *    antd 的 `renderOperations` / `renderEllipsis` 在没有内容时返回的正是
 *    `null` / `false`，照搬会让我们的 DOM 里多出 3~4 个注释 ——
 *    与 antd 的 SSR 输出不一致，也让 `wrapper.html()` 的断言带上噪音。
 *    （`React.Children.toArray` 的对应物见 `_util/nodes.ts` 的 `toNodeList`，
 *    那一层处理的是**输入**，这一层处理的是**渲染树**。）
 */
function flattenChildren(nodes: readonly RenderableChild[]): RenderableChild[] {
  const out: RenderableChild[] = [];
  for (const node of nodes) {
    if (Array.isArray(node)) {
      // ⚠️ 断言是必要的：`VNodeArrayChildren` 的元素类型里含 `void`（Vue 允许渲染
      //    函数返回 `void`），而渲染树里**实际不会出现** `void` —— `normalizeVNode`
      //    已经把它变成了注释 vnode。`RenderableChild` 去掉 `void` 正是为了这一点。
      out.push(...flattenChildren(node as RenderableChild[]));
      continue;
    }
    if (node === null || node === undefined || node === false) continue;
    out.push(node);
  }
  return out;
}

/**
 * 七个装饰开关的 prop 名。与 antd 的 `DECORATION_PROPS` 逐字对应。
 *
 * ⚠️ antd 里它有两个用途：
 *   1. `omit(restProps, DECORATION_PROPS)` —— 把装饰名从 DOM 属性里剔掉。
 *      **Vue 侧不需要**：装饰是声明式 props，天然不进 `$attrs`。
 *   2. `Ellipsis` 的 `miscDeps` —— 把它们列为「影响测量结果」的依赖。
 *      **Vue 侧需要**，见 `measureMiscDeps`。
 */
const DECORATION_PROPS = [
  'delete',
  'mark',
  'code',
  'underline',
  'strong',
  'keyboard',
  'italic',
] as const satisfies readonly (keyof BlockProps)[];

/**
 * 装饰包裹。顺序与 antd 的 `wrapperDecorations` 逐字对应：
 * `strong` 最内层，`i` 最外层。
 */
function wrapperDecorations(props: BlockProps, content: RenderableChild[]): RenderableChild {
  let currentContent: RenderableChild = content;

  const wrap = (tag: string, needed?: boolean): void => {
    if (!needed) return;
    currentContent = h(tag, {}, [currentContent]);
  };

  wrap('strong', props.strong);
  wrap('u', props.underline);
  wrap('del', props.delete);
  wrap('code', props.code);
  wrap('mark', props.mark);
  wrap('kbd', props.keyboard);
  wrap('i', props.italic);

  return currentContent;
}

const baseProps = {
  // ---------------------------- 来自 TypographyProps ----------------------------
  /** 不传则从 ConfigProvider 解析（`apollo-typography`）。 */
  prefixCls: { type: String, default: undefined },
  /** 用户传的标签名。`Text`→`span`、`Paragraph`→`div`、`Link`→`a`、`Title`→`h1..h5`。 */
  component: { type: String, default: undefined },
  direction: { type: String as PropType<DirectionType>, default: undefined },
  classNames: {
    type: [Object, Function] as PropType<BlockProps['classNames']>,
    default: undefined,
  },
  styles: {
    type: [Object, Function] as PropType<BlockProps['styles']>,
    default: undefined,
  },

  // ---------------------------- 来自 BlockProps ----------------------------
  actions: { type: Object as PropType<ActionsConfig>, default: undefined },
  title: { type: String, default: undefined },
  editable: {
    type: [Boolean, Object] as PropType<boolean | EditConfig>,
    default: undefined,
  },
  copyable: {
    type: [Boolean, Object] as PropType<boolean | CopyConfig>,
    default: undefined,
  },
  type: { type: String as PropType<BaseType>, default: undefined },
  disabled: { type: Boolean, default: undefined },
  ellipsis: {
    type: [Boolean, Object] as PropType<boolean | EllipsisConfig>,
    default: undefined,
  },

  // 七个装饰开关。⚠️ `default: undefined` 不是冗余的（PITFALLS 46）：
  // 运行时类型含 `Boolean` 时，未传的 prop 会被 Vue 强制成 `false`。
  code: { type: Boolean, default: undefined },
  mark: { type: Boolean, default: undefined },
  underline: { type: Boolean, default: undefined },
  delete: { type: Boolean, default: undefined },
  strong: { type: Boolean, default: undefined },
  keyboard: { type: Boolean, default: undefined },
  italic: { type: Boolean, default: undefined },

  // ⚠️ 事件名必须全小写（PITFALLS 61）。声明成 prop 是为了把它们**从 `$attrs` 里摘出来**：
  //    antd 把 `onMouseEnter` / `onMouseLeave` 解构掉，再包一层自己的逻辑往下传；
  //    留在 `$attrs` 里会被 `{...attrs}` 原样覆盖掉这层逻辑。
  onMouseenter: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
  onMouseleave: { type: Function as PropType<(e: MouseEvent) => void>, default: undefined },
};

const BaseContent = defineComponent({
  name: 'ATypographyContent',
  inheritAttrs: false,
  props: {
    contentProps: {
      type: Object as PropType<Readonly<ExtractPropTypes<typeof baseProps>>>,
      required: true,
    },
    contentNodes: { type: Array as PropType<TypographyNode[]>, required: true },
  },
  setup(content, { attrs, expose }) {
    // 公开 props 对象由外层 setup 持有，身份稳定，值始终保持 Vue 响应性。
    const props = content.contentProps;
    const [textLocale] = useLocaleReactive('Text');

    const typographyRef = ref<{ nativeElement: HTMLElement | null } | null>(null);
    const editIconRef = ref<HTMLButtonElement | null>(null);

    const {
      classNames: mergedClassNames,
      styles: mergedStyles,
      prefixCls,
      direction,
      tokenStyle,
    } = useTypographySemantic(
      props as BlockProps,
      () => props.prefixCls,
      () => props.classNames,
      () => props.styles,
      () => props.direction,
    );

    // 当前默认内容在外层 render 归一后传入；内部状态更新不会重建测量数组。
    const nodeList = computed(() => content.contentNodes);

    /** 有没有可渲染的内容。对应 antd 的 `isReactRenderable(children)`（`copyable` 的图标模式）。 */
    const hasContent = computed(() => nodeList.value.length > 0);

    /**
     * 孩子的纯文本形态 —— **只在「整份孩子就是一段文字」时**给出，其余情况是 `undefined`。
     *
     * 这样才与 antd 的 `children` 对齐：antd 那边 `children` 要么是字符串（此时各判据
     * 都命中），要么是元素/数组（此时 `isValidText` 一律判否、`typeof children === 'string'`
     * 一律为假）。若改成「把节点列表拼成一段」，多节点场景下会把 `[object Object]`
     * 也当成可用的 `aria-label`，与 antd 不一致。
     */
    const childrenText = computed<string | undefined>(() => {
      const list = nodeList.value;
      return list.length === 1 && isValidText(list[0]) ? String(list[0]) : undefined;
    });

    // ========================== Editable ==========================
    const { support: enableEdit, config: editConfig } = useMergedConfig<EditConfig>(
      () => props.editable,
    );
    const [editing, setEditing] = useControlledValue<boolean>({
      defaultValue: false,
      getValue: () => editConfig.value.editing,
    });
    const triggerType = computed(() => editConfig.value.triggerType ?? ['icon']);

    const triggerEdit = (edit: boolean): void => {
      if (edit) {
        editConfig.value.onStart?.();
      }
      setEditing(edit);
    };

    // Capture ownership before Vue removes the editor, then restore after the
    // replacement button exists. A blur to an external control keeps its focus.
    let restoreEditFocus = false;
    let editDocument: Document | undefined;
    watch(editing, (value, oldValue) => {
      restoreEditFocus = false;
      const root = typographyRef.value?.nativeElement;
      if (value || !oldValue || !root) return;
      editDocument = root.ownerDocument;
      const scope = root.getRootNode();
      const active =
        typeof ShadowRoot !== 'undefined' && scope instanceof ShadowRoot
          ? scope.activeElement
          : editDocument.activeElement;
      restoreEditFocus = !!active && root.contains(active);
    });
    watch(
      editing,
      (value, oldValue) => {
        if (!value && oldValue && restoreEditFocus && editDocument) {
          const active = editDocument.activeElement;
          if (!active || active === editDocument.body) editIconRef.value?.focus();
        }
        restoreEditFocus = false;
      },
      { flush: 'post' },
    );

    const onEditClick = (e?: MouseEvent): void => {
      const target = e?.target;
      if (target && 'closest' in target && typeof target.closest === 'function') {
        const control: unknown = target.closest(
          'button,a,input,textarea,select,[contenteditable=true]',
        );
        if (control && control !== e?.currentTarget) return;
      }
      e?.preventDefault();
      triggerEdit(true);
    };

    const onEditChange = (value: string): void => {
      editConfig.value.onChange?.(value);
      triggerEdit(false);
    };

    const onEditCancel = (): void => {
      editConfig.value.onCancel?.();
      triggerEdit(false);
    };

    // ========================== Copyable ==========================
    const { support: enableCopy, config: copyConfig } = useMergedConfig<CopyConfig>(
      () => props.copyable,
    );

    const placement = computed(() => props.actions?.placement ?? 'end');

    const {
      copied,
      copyLoading,
      onClick: onCopyClick,
    } = useCopyClick({
      copyConfig: () => copyConfig.value,
      // antd 的兜底文案是 `toList(children, { skipEmpty: true }).join('')`。
      // 这里把**归一化后的节点数组**交给同一个实现，语义逐字对应：
      // 字符串节点原样拼接，元素节点得到 `'[object Object]'`（上游的真实行为）。
      children: () => nodeList.value,
    });

    // ========================== Ellipsis ==========================
    const isLineClampSupport = ref(false);
    const isTextOverflowSupport = ref(false);

    const isJsEllipsis = ref(false);
    const isNativeEllipsis = ref(false);
    const isNativeVisible = ref(true);

    const { support: enableEllipsis, config: ellipsisConfig } = useMergedConfig<EllipsisConfig>(
      () => props.ellipsis,
      () => ({
        expandable: false as const,
        // antd 的默认 symbol 是语言包里的「展开 / 收起」
        symbol: (isExpanded: boolean) =>
          isExpanded ? textLocale.value.collapse : textLocale.value.expand,
      }),
    );

    const [expanded, setExpanded] = useControlledValue<boolean>({
      defaultValue: () => ellipsisConfig.value.defaultExpanded || false,
      getValue: () => ellipsisConfig.value.expanded,
    });

    const mergedEnableEllipsis = computed(
      () =>
        enableEllipsis.value &&
        (!expanded.value || ellipsisConfig.value.expandable === 'collapsible'),
    );

    /** 共享给下游的 `rows`（antd 的注释：`Shared prop to reduce bundle size`）。 */
    const rows = computed(() => {
      const value = ellipsisConfig.value.rows;
      return typeof value === 'number' && Number.isFinite(value) && value > 0
        ? Math.floor(value)
        : 1;
    });

    const needMeasureEllipsis = computed(
      () =>
        mergedEnableEllipsis.value &&
        // 给了 suffix
        (ellipsisConfig.value.suffix !== undefined ||
          // 或者需要上报省略状态
          !!ellipsisConfig.value.onEllipsis ||
          // 或者要放展开按钮（CSS 省略号做不到）
          !!ellipsisConfig.value.expandable ||
          enableEdit.value ||
          enableCopy.value),
    );

    watch(
      [needMeasureEllipsis, enableEllipsis],
      () => {
        if (enableEllipsis.value && !needMeasureEllipsis.value) {
          isLineClampSupport.value = isStyleSupport('webkitLineClamp');
          isTextOverflowSupport.value = isStyleSupport('textOverflow');
        }
      },
      { immediate: true, flush: 'post' },
    );

    /**
     * 是否走原生 CSS 省略号。
     *
     * ⚠️ 初值是 `mergedEnableEllipsis` —— **SSR 下必须是 `true`**，否则服务端渲染出的
     *    DOM 会缺 `-ellipsis-single-line` / `-ellipsis-multiple-line` 类名，
     *    与 antd 的 SSR 输出对不上。真正的判定在挂载后的 effect 里做。
     */
    const cssEllipsis = ref(mergedEnableEllipsis.value);

    const canUseCssEllipsis = computed(() => {
      if (needMeasureEllipsis.value) return false;
      if (rows.value === 1) return isTextOverflowSupport.value;
      return isLineClampSupport.value;
    });

    watch(
      [canUseCssEllipsis, mergedEnableEllipsis],
      () => {
        cssEllipsis.value = canUseCssEllipsis.value && mergedEnableEllipsis.value;
      },
      { immediate: true, flush: 'post' },
    );

    const tooltipProps = useTooltipProps(
      () => ellipsisConfig.value.tooltip,
      () => editConfig.value.text,
      () => childrenText.value,
    );

    const needNativeEllipsisMeasure = computed(
      () => cssEllipsis.value && !!tooltipProps.value.title,
    );

    const isMergedEllipsis = computed(
      () =>
        mergedEnableEllipsis.value &&
        (cssEllipsis.value
          ? needNativeEllipsisMeasure.value && isNativeEllipsis.value
          : isJsEllipsis.value),
    );

    const cssTextOverflow = computed(
      () => mergedEnableEllipsis.value && rows.value === 1 && cssEllipsis.value,
    );
    const cssLineClamp = computed(
      () => mergedEnableEllipsis.value && rows.value > 1 && cssEllipsis.value,
    );

    /**
     * 传给 `Ellipsis` 的「杂项依赖」。与 antd 的
     * `miscDeps: [copied, expanded, copyLoading, enableEdit, enableCopy, placement, textLocale, ...DECORATION_PROPS.map(key => props[key])]`
     * **逐项对应**。
     *
     * 它的作用是：这些值都会改变**测量容器里渲染出来的内容**（操作区多不多一个按钮、
     * 装饰包裹几层、文案是「展开」还是「收起」），所以任何一个变了都要重新测一次。
     * `Ellipsis` 侧的测量回调**不会**在渲染函数里跑，读不到插槽内容，只能靠这个数组
     * 把依赖显式传下去（这也正是 antd 传 `miscDeps` 的原因）。
     *
     * ⚠️ 用 `computed` 而不是每次渲染新建数组：`computed` 只在依赖真的变了才产生
     *    新数组，`Ellipsis` 的 `watch` 因此不会因为「引用变了但内容没变」而空转。
     */
    const measureRevision = ref(0);
    const measureMiscDeps = computed<unknown[]>(() => [
      measureRevision.value,
      tokenStyle.value,
      mergedStyles.value,
      ellipsisConfig.value,
      copied.value,
      expanded.value,
      copyLoading.value,
      enableEdit.value,
      enableCopy.value,
      placement.value,
      textLocale.value,
      ...DECORATION_PROPS.map((key) => props[key]),
    ]);

    // >>>>> 展开
    const onExpandClick = (e: MouseEvent, info: { expanded: boolean }): void => {
      setExpanded(info.expanded);
      ellipsisConfig.value.onExpand?.(e, info);
    };

    const ellipsisWidth = ref(0);
    const [isHoveringOperations, setIsHoveringOperations] = useDelayState(false);
    /** 鼠标是否停在 Typography 上。**刻意不用 `ref`**：它不参与渲染。 */
    let isHoveringTypography = false;

    const typographyEl = computed<HTMLElement | null>(
      () => typographyRef.value?.nativeElement ?? null,
    );

    /**
     * 暴露给父组件的实例。
     *
     * ⚠️ antd 的四个子组件都是 `forwardRef`，`ref` 直接落到根 DOM 元素上；Vue 里
     *    对应物就是 `expose({ nativeElement })`（与 `Divider` / `Empty` / `Spin` 同形）。
     *    少了它，`<Text ref="x">` 拿不到任何东西 —— 那是**契约缺失**，不是「用不到」。
     */
    expose({ nativeElement: typographyEl });

    let fontSignature = '';
    const refreshMetrics = () => {
      const root = typographyEl.value;
      if (!root || !mergedEnableEllipsis.value) return;
      const style = root.ownerDocument.defaultView?.getComputedStyle(root);
      if (!style) return;
      const signature = [
        style.fontFamily,
        style.fontSize,
        style.fontWeight,
        style.lineHeight,
        style.letterSpacing,
        style.paddingInlineStart,
        style.paddingInlineEnd,
      ].join('|');
      if (signature !== fontSignature) {
        fontSignature = signature;
        measureRevision.value++;
      }
    };
    useResizeObserver({
      target: () => typographyEl.value,
      onResize: (size) => {
        ellipsisWidth.value = size.offsetWidth;
        refreshMetrics();
      },
      disabled: () => !mergedEnableEllipsis.value,
    });

    // >>>>> JS 省略号
    const onJsEllipsis = (jsEllipsis: boolean): void => {
      // ⚠️ 与 antd 的写法**看起来不同、语义相同**。antd 是：
      //      setIsJsEllipsis(jsEllipsis);
      //      if (isJsEllipsis !== jsEllipsis) onEllipsis?.(jsEllipsis);
      //    它读的 `isJsEllipsis` 是**本次渲染闭包里的旧值**（setState 不会同步改闭包变量），
      //    所以判据是「变了没有」。Vue 的 `ref.value` 是**立刻**更新的，照抄会变成
      //    「永远相等 ⇒ 永远不上报」。必须先比较、后赋值。
      const changed = isJsEllipsis.value !== jsEllipsis;
      isJsEllipsis.value = jsEllipsis;
      if (changed) {
        ellipsisConfig.value.onEllipsis?.(jsEllipsis);
      }
    };

    // >>>>> 原生省略号
    const measureNativeEllipsis = (): void => {
      const textEle = typographyEl.value;
      if (enableEllipsis.value && needNativeEllipsisMeasure.value && textEle) {
        const currentEllipsis = isEleEllipsis(textEle, prefixCls.value);
        if (isNativeEllipsis.value !== currentEllipsis) {
          isNativeEllipsis.value = currentEllipsis;
        }
      }
    };

    // 悬浮期间保持结果最新，但**不**让每个实例在批量渲染/缩放时都去读布局。
    //
    // ⚠️ 这里与 antd 的写法有一处**必须**的结构性差异：
    //    antd 的依赖是 `[children, cssLineClamp, isNativeVisible, ellipsisWidth]`，
    //    但 Vue 的 `watch` 在 `setup()` 里**立刻**求值一遍 getter 来收集依赖。
    //    `children` 在 Vue 侧只能靠调用插槽拿到，而「在渲染函数之外调用插槽」会让
    //    Vue 打 `Slot "default" invoked outside of the render function` 告警
    //    （`normalizeSlot` 的 dev 检查，见 `@vue/runtime-core`）。
    //
    //    所以把依赖拆成两类：
    //      · `isNativeVisible` / `ellipsisWidth` —— 它们**不参与渲染**，改值不会触发
    //        组件更新，只能靠 `watch` 捕获 ⇒ 留在 watch 里；
    //      · `children` / `cssLineClamp` —— 它们都参与渲染，任何变化都必然触发一次
    //        组件更新 ⇒ 用 `onUpdated` 捕获（等价于 antd 的 `useLayoutEffect`）。
    //    `onUpdated` 是**更宽**的触发集合（多出来的触发是幂等的），不是更窄的。
    const remeasureWhileHovering = (): void => {
      if (isHoveringTypography) {
        measureNativeEllipsis();
      }
    };

    watch([isNativeVisible, ellipsisWidth], remeasureWhileHovering, { flush: 'post' });
    onUpdated(() => {
      remeasureWhileHovering();
      refreshMetrics();
    });

    // https://github.com/ant-design/ant-design/issues/36786
    // 用 IntersectionObserver 判断元素是否不可见
    watch(
      [needNativeEllipsisMeasure, mergedEnableEllipsis, typographyEl],
      (_value, _oldValue, onCleanup) => {
        const textEle = typographyEl.value;
        if (
          typeof IntersectionObserver === 'undefined' ||
          !textEle ||
          !needNativeEllipsisMeasure.value ||
          !mergedEnableEllipsis.value
        ) {
          return;
        }

        const observer = new IntersectionObserver(() => {
          isNativeVisible.value = !!textEle.offsetParent;
        });
        observer.observe(textEle);

        onCleanup(() => {
          observer.disconnect();
        });
      },
      { immediate: true, flush: 'post' },
    );

    // ========================== Tooltip ===========================
    const topAriaLabel = computed(() => {
      if (!enableEllipsis.value || cssEllipsis.value) {
        return undefined;
      }
      return [
        editConfig.value.text,
        childrenText.value,
        props.title,
        tooltipProps.value.title,
      ].find(isValidText);
    });

    // =========================== Render ===========================
    const rootClassNames = computed(() => [
      { [`${prefixCls.value}-${props.type}`]: !!props.type },
      { [`${prefixCls.value}-disabled`]: !!props.disabled },
      { [`${prefixCls.value}-ellipsis`]: enableEllipsis.value },
      { [`${prefixCls.value}-ellipsis-single-line`]: cssTextOverflow.value },
      { [`${prefixCls.value}-ellipsis-multiple-line`]: cssLineClamp.value },
      { [`${prefixCls.value}-link`]: props.component === 'a' },
      // ⚠️ 用户原生 `class` 不在这里：它经 `...attrs` 透传给 InternalTypography
      //    （`inheritAttrs: false` + 显式 spread，见下方 render）。
      // ⚠️ 语义槽位 root **也不在这里**：InternalTypography 会追加 `classNames.root`
      //    （antd 的 Base className 只有 type/disabled/ellipsis/link + 用户 className；
      //    重复添加会渲染出两份类名 —— L4 实测抓到）。
    ]);

    const rootStyle = computed<CSSProperties>(() => ({
      // ⚠️ 语义槽位 root **不在这里**：styles 经 `classNames`/`styles` prop 传给
      //    InternalTypography，由它做 `{...styles.root, ...style}` 合并 ——
      //    antd 的用户 `style` **覆盖** `styles.root`（Base 的 style 只补
      //    WebkitLineClamp）。在这里再合一次会颠倒顺序（L4 实测抓到）。
      //    用户原生 `style` 走 `$attrs`（InternalTypography 里排在语义根样式之后）。
      ...(cssLineClamp.value ? { WebkitLineClamp: rows.value } : {}),
    }));

    const handleMouseEnter = (e: MouseEvent): void => {
      isHoveringTypography = true;
      measureNativeEllipsis();
      if (props.component !== 'a') props.onMouseenter?.(e);
    };

    const handleMouseLeave = (e: MouseEvent): void => {
      isHoveringTypography = false;
      if (props.component !== 'a') props.onMouseleave?.(e);
    };

    const renderExpand = (): RenderableChild => {
      const { expandable, symbol } = ellipsisConfig.value;
      if (!expandable) return null;
      // ⚠️ 用 `typeof` 而不是 `isFunction`：工具里的类型守卫把结果收窄成
      //    `(...args: never[]) => unknown`，调用处拿不到参数类型。
      const symbolNode = typeof symbol === 'function' ? symbol(expanded.value) : symbol;
      const symbolText = plainText(toNodeList(symbolNode)).trim();
      return h(
        'button',
        {
          type: 'button',
          class: [
            `${prefixCls.value}-${expanded.value ? 'collapse' : 'expand'}`,
            mergedClassNames.value.action,
          ],
          style: mergedStyles.value.action,
          onClick: (e: MouseEvent) => onExpandClick(e, { expanded: !expanded.value }),
          'aria-label':
            symbolText || (expanded.value ? textLocale.value.collapse : textLocale.value.expand),
        },
        [symbolNode],
      );
    };

    const renderEdit = (): RenderableChild => {
      if (!enableEdit.value) return null;

      const { icon, tooltip, tabIndex } = editConfig.value;
      const editTitle = tooltip === undefined || tooltip === true ? textLocale.value.edit : tooltip;
      const ariaLabel =
        typeof editTitle === 'string' && editTitle
          ? editTitle
          : plainText(toNodeList(textLocale.value.edit)) || 'Edit';
      const textOnly = !triggerType.value.includes('icon') && triggerType.value.includes('text');
      if (!triggerType.value.includes('icon') && !textOnly) return null;

      // ⚠️ `triggerType` 不含 `icon` 时**不渲染按钮**（antd 的行为：`text` 触发靠根元素
      //    的 onClick，没有图标可点）。
      const editButton = h(
        'button',
        {
          type: 'button',
          ref: editIconRef,
          class: [
            `${prefixCls.value}-edit`,
            textOnly && `${prefixCls.value}-edit-keyboard`,
            mergedClassNames.value.action,
          ],
          style: mergedStyles.value.action,
          onClick: (event: MouseEvent) => {
            event.stopPropagation();
            onEditClick(event);
          },
          'aria-label': ariaLabel,
          tabIndex,
        },
        [getNode(icon, h(EditOutlined, { 'aria-hidden': true }), true)],
      );
      // antd 逐字：`<Tooltip key="edit" title={tooltip === false ? '' : editTitle}>{button}</Tooltip>`
      // —— `tooltip: false` 是「不弹」而不是「不包」（关闭态 DOM 等价，只 cloneVNode）。
      return textOnly
        ? editButton
        : h(
            Tooltip,
            { title: tooltip === false ? '' : editTitle },
            {
              default: () => editButton,
            },
          );
    };

    const renderCopy = (): RenderableChild => {
      if (!enableCopy.value) return null;
      // ⚠️ 只挑 `CopyBtn` 真正消费的三个字段。antd 用 `{...copyConfig}` 展开，
      //    在 React 里多余的字段会被组件丢弃；Vue 里它们会变成 `$attrs` 落到
      //    按钮 DOM 上（`text="..."`、`format="text/plain"`），所以必须显式挑。
      return h(CopyBtn, {
        icon: copyConfig.value.icon,
        tooltips: copyConfig.value.tooltips,
        tabIndex: copyConfig.value.tabIndex,
        prefixCls: prefixCls.value,
        copied: copied.value,
        locale: textLocale.value,
        onCopy: onCopyClick,
        loading: copyLoading.value,
        iconOnly: !hasContent.value,
        // Tooltip 已迁移到「根 class 走原生 attrs」⇒ 这里用 `class`
        class: mergedClassNames.value.action,
        style: mergedStyles.value.action,
      });
    };

    const renderOperations = (canEllipsis: boolean): RenderableChild => {
      const expandNode = canEllipsis ? renderExpand() : null;
      const editNode = renderEdit();
      const copyNode = renderCopy();

      if (!expandNode && !editNode && !copyNode) {
        return null;
      }

      return h(
        'span',
        {
          class: [
            `${prefixCls.value}-actions`,
            mergedClassNames.value.actions,
            { [`${prefixCls.value}-actions-start`]: placement.value === 'start' },
          ],
          style: mergedStyles.value.actions,
          onMouseenter: () => setIsHoveringOperations(true, true),
          onMouseleave: () =>
            setIsHoveringOperations(false, {
              // 延迟 500ms，体验更好
              ms: 500,
            }),
        },
        // ⚠️ 过 `flattenChildren`：三个节点可能是 `null`（未启用对应能力），
        //    Vue 会把它们渲染成注释节点（见 `flattenChildren` 的说明）。
        flattenChildren([expandNode, editNode, copyNode]),
      );
    };

    const renderEllipsis = (canEllipsis: boolean): RenderableChild[] => [
      canEllipsis && !expanded.value ? h('span', { 'aria-hidden': true }, ELLIPSIS_STR) : null,
      ellipsisConfig.value.suffix,
    ];

    return () => {
      // 根 `class` / `style` 是 Vue 原生 attrs：从 `attrs` 里摘出来单独合并，
      // 其余属性仍按 antd 的 `{...rest}` 原样透传（放在对象末尾 ⇒ 优先级最高）。
      const { class: attrClass, style: attrStyle, ...restAttrs } = attrs as Record<string, unknown>;
      const isLink = props.component === 'a';
      const linkAttrs: Record<string, unknown> = {};
      const rootAttrs: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(restAttrs)) {
        const linkOwned =
          isLink &&
          (key.startsWith('on') ||
            key.startsWith('aria-') ||
            [
              'href',
              'target',
              'rel',
              'download',
              'hreflang',
              'ping',
              'referrerpolicy',
              'role',
              'tabindex',
              'tabIndex',
            ].includes(key));
        (linkOwned ? linkAttrs : rootAttrs)[key] = value;
      }

      // >>>>>>>>>>> 编辑态
      if (editing.value) {
        return h(Editable, {
          ...restAttrs,
          ref: typographyRef,
          value: editConfig.value.text ?? childrenText.value ?? '',
          ariaLabel:
            typeof attrs['aria-label'] === 'string'
              ? attrs['aria-label']
              : plainText(toNodeList(textLocale.value.edit)) || 'Edit',
          onSave: onEditChange,
          onCancel: onEditCancel,
          onEnd: editConfig.value.onEnd,
          prefixCls: prefixCls.value,
          className: normalizeClass(attrClass),
          style: nativeStyle(attrStyle),
          direction: direction.value,
          component: props.component,
          maxLength: editConfig.value.maxLength,
          autoSize: editConfig.value.autoSize,
          enterIcon: editConfig.value.enterIcon,
          classNames: mergedClassNames.value,
          styles: mergedStyles.value,
          tokenStyle: tokenStyle.value,
        });
      }

      // Tooltip owns the real native trigger; operation hover suppresses the content popup.
      return h(
        EllipsisTooltip,
        {
          enableEllipsis: mergedEnableEllipsis.value,
          isEllipsis: isMergedEllipsis.value,
          disabled: isHoveringOperations.value,
          tooltipProps: tooltipProps.value,
        },
        // Forward current native root attrs and a Vue content slot.
        () =>
          h(
            InternalTypography,
            {
              ref: typographyRef,
              prefixCls: prefixCls.value,
              classNames: mergedClassNames.value,
              styles: mergedStyles.value,
              tokenStyle: tokenStyle.value,
              component: isLink ? 'span' : (props.component ?? 'article'),
              ...(direction.value === undefined ? {} : { direction: direction.value }),
              // ⚠️ `class` / `style` **必须**在这里显式合并，且**不能**留在末尾的
              //    `...restAttrs` 里 —— 对象展开是后者胜，`attrs.style` 会把
              //    `WebkitLineClamp` 整段顶掉（L4 的 `style:with-line-clamp` 抓到过）。
              className: normalizeClass([rootClassNames.value, attrClass]),
              style: { ...rootStyle.value, ...nativeStyle(attrStyle) },
              'aria-label': topAriaLabel.value?.toString(),
              title: props.title,
              onMouseenter: handleMouseEnter,
              onMouseleave: handleMouseLeave,
              ...mergeProps(rootAttrs, {
                onClick:
                  !isLink && enableEdit.value && triggerType.value.includes('text')
                    ? onEditClick
                    : undefined,
              }),
            },
            () =>
              h(
                Ellipsis,
                {
                  enableMeasure: mergedEnableEllipsis.value && !cssEllipsis.value,
                  text: nodeList.value,
                  rows: rows.value,
                  width: ellipsisWidth.value,
                  expanded: expanded.value,
                  onEllipsis: onJsEllipsis,
                  miscDeps: measureMiscDeps.value,
                },
                // ⚠️ 带参数的插槽必须写成 `{ default: (arg) => ... }`（`RawSlots`）：
                //    `h()` 的「函数孩子」分支是 `RawChildren`，里面的函数签名是
                //    **零参数** `() => any`，带必填参数的函数不满足它。
                {
                  default: ({ nodes, canEllipsis }: EllipsisSlotProps) => {
                    const content: RenderableChild[] = [];
                    if (isLink) {
                      const link = h(
                        'a',
                        mergeProps(
                          {
                            class: `${prefixCls.value}-link-content`,
                            onClick: (event: MouseEvent) => {
                              if (props.disabled) {
                                event.preventDefault();
                                event.stopImmediatePropagation();
                                return;
                              }
                              if (enableEdit.value && triggerType.value.includes('text'))
                                onEditClick(event);
                            },
                            onMouseenter: props.onMouseenter,
                            onMouseleave: props.onMouseleave,
                          },
                          linkAttrs,
                          {
                            'aria-label': linkAttrs['aria-label'] ?? topAriaLabel.value?.toString(),
                            'aria-disabled': props.disabled || linkAttrs['aria-disabled'],
                            tabIndex: props.disabled
                              ? -1
                              : (linkAttrs.tabIndex ?? linkAttrs.tabindex),
                          },
                        ),
                        [
                          wrapperDecorations(
                            props as BlockProps,
                            flattenChildren([renderNodes(nodes), ...renderEllipsis(canEllipsis)]),
                          ),
                        ],
                      );
                      const operations = renderOperations(canEllipsis);
                      return placement.value === 'start' ? [operations, link] : [link, operations];
                    }

                    if (placement.value === 'start') {
                      content.push(renderOperations(canEllipsis));
                    }

                    if (nodes.length > 0 && canEllipsis && !expanded.value && topAriaLabel.value) {
                      content.push(h('span', { 'aria-hidden': true }, renderNodes(nodes)));
                    } else {
                      content.push(renderNodes(nodes));
                    }

                    content.push(renderEllipsis(canEllipsis));

                    if (placement.value !== 'start') {
                      content.push(renderOperations(canEllipsis));
                    }

                    return wrapperDecorations(props as BlockProps, flattenChildren(content));
                  },
                },
              ),
          ),
      );
    };
  },
});

/** 默认插槽只在这一层 render 求值，状态与量测层消费当前 VNode 数据。 */
export const Base = defineComponent({
  name: 'ATypographyBase',
  inheritAttrs: false,
  props: baseProps,
  setup(props, { attrs, slots, expose }) {
    const contentRef = ref<{ nativeElement: HTMLElement | null } | null>(null);
    expose({ nativeElement: computed(() => contentRef.value?.nativeElement ?? null) });
    return () =>
      h(BaseContent, {
        ...attrs,
        ref: contentRef,
        contentProps: props,
        contentNodes: toNodeList(slots.default?.() ?? null),
      });
  },
});

export default Base;
