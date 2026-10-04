/**
 * `Base` —— `Text` / `Title` / `Paragraph` / `Link` 的共同底座。
 *
 * 契约来源：antd 6.6.4 的 `es/typography/Base/index.js`（**逐条对齐**）。
 * 它承担 Typography 家族**全部**的复杂度：语义色、禁用、七个装饰开关、
 * `ellipsis` / `copyable` / `editable`、操作区、以及省略号的四种测量状态。
 *
 * ── 渲染树（无省略号时的主干）────────────────────────────────────────────────────
 *
 * ```
 * InternalTypography（根元素，类名 = 语义色/禁用/省略/链接 + className）
 *   └─ Ellipsis（渲染属性：把 nodes + canEllipsis 交回给本组件）
 *        └─ wrapperDecorations(...)     ← strong→u→del→code→mark→kbd→i 逐层包裹
 *             ├─ [placement=start] 操作区
 *             ├─ 内容（有 aria-label 时再包一层 aria-hidden 的 span）
 *             ├─ 省略号 + suffix
 *             └─ [placement=end]   操作区
 * ```
 *
 * ── 五条必须保留的判据 ────────────────────────────────────────────────────────
 *
 *   1. **装饰的嵌套顺序是 `strong → u → del → code → mark → kbd → i`**，
 *      即最终 DOM 是 `<i><kbd><mark><code><del><u><strong>x</strong></u></del></code></mark></kbd></i>`。
 *      顺序反了「看起来一样」但 DOM 契约会红。
 *   2. **`-link` 类名的判据是 `component === 'a'`**，不是「有没有 `type`」。
 *      所以 `<Link type="danger">` 同时有 `-danger` 与 `-link`。
 *   3. **`topAriaLabel` 只在「有省略号且走 JS 测量」时才算**（`!enableEllipsis || cssEllipsis`
 *      ⇒ `undefined`）。它的候选顺序是 `[editConfig.text, children, title, tooltipProps.title]`，
 *      取**第一个字符串或数字**。
 *   4. **`<span aria-hidden>` 只包「内容」**，且只在
 *      `node.length > 0 && canEllipsis && !expanded && topAriaLabel` 四个条件同时成立时。
 *      它的用途是「可访问名走根元素的 `aria-label`，屏幕阅读器别把截断后的文字再读一遍」。
 *   5. **操作区在 `placement === 'start'` 时渲染在内容之前**（`-actions-start` 类名同理）。
 *      两个位置都调用同一个 `renderOperations(canEllipsis)`。
 *
 * ── 与 antd 的差异 ────────────────────────────────────────────────────────────
 *
 *   - **D5**：无 CSS-in-JS 的 `hashId` / `cssVarCls` 类名。
 *   - ~~D-typography-8~~：2026-10-04 起 Tooltip 已落地，编辑按钮 / 复制按钮 / 省略号
 *     提示均已接线（关闭态 DOM 与基线一致，见 EllipsisTooltip / CopyBtn）。
 *     DOM 上等价（rc-tooltip 未展开时只渲染 children），`tooltipProps.title` 仍完整
 *     参与 `topAriaLabel` 的计算。
 *   - **D-typography-11（PLATFORM）**：`ellipsis` 的测量时序。见 `Ellipsis.ts` 文件头。
 *   - **D-typography-12（PLATFORM）**：`usePrevious` 不需要单独实现 —— Vue 的
 *     `watch(cb)` 回调直接给 `oldValue`，等价于「上一轮的 editing」。
 *   - **D-typography-13（PLATFORM）**：`children` 必须**归一化**才能与 antd 的
 *     `children` 对齐。React 的 `children` 是「字符串 / 元素 / 数组」，Vue 的插槽
 *     返回的却总是 **vnode 数组**（纯文字被包成 `Text` vnode、单子节点还可能被包成
 *     `Fragment`）。见 `nodeList` / `childrenText` / `hasContent` 三处的说明。
 *   - **D-typography-14（PLATFORM）**：`Ellipsis` 的测量依赖必须**显式下传**
 *     （`miscDeps`）。antd 的 `useLayoutEffect` 可以依赖「渲染出来的内容」，Vue 的
 *     `watch` 不行 —— 它在 `setup()` 里就求值 getter 来收集依赖，而「在渲染函数之外
 *     调用插槽」会触发 Vue 的 dev 告警。见 `measureMiscDeps` 与 `Ellipsis.ts`。
 *   - **D-typography-15**：`isReactRenderable(children)` → `hasContent`（`nodeList`
 *     非空）。唯一差别：`children === ''` 时 antd 判 `false`、这里判 `true`
 *     （只影响 `-copy-icon-only` 这一个类名，且空字符串本身没有任何可渲染内容）。
 *
 * ── 为什么是 `.ts` 渲染函数而不是 `.vue` ────────────────────────────────────────
 *
 * 渲染树是**数据驱动的动态嵌套**：装饰层数取决于 7 个开关、操作区位置取决于
 * `placement`、内容要不要包 `aria-hidden` 取决于 4 个条件的与、省略号要拿到
 * 测量后的节点列表。模板表达不了这种条件包裹（COMPONENT-RULES.md §2 第 2 条）。
 * 先例：`config-provider/ConfigProvider.ts`。
 *
 * ── 这个组件没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明真实排版下的省略号像素结果（jsdom 的 `clientHeight` 恒为 0），见 L6。
 *   - 没证明 `Tooltip` 的交互 —— Tooltip 未落地。
 */

import { EditOutlined } from '@apollo-design/icons';
import { useLocale } from '@apollo-design/locale';
import {
  isStyleSupport,
  toList,
  useControlledValue,
  useDelayState,
  useResizeObserver,
} from '@apollo-design/utils';
import {
  type Component,
  type CSSProperties,
  computed,
  defineComponent,
  h,
  onUpdated,
  type PropType,
  ref,
  watch,
} from 'vue';

import type { DirectionType } from '../config-provider/context';
import Tooltip from '../tooltip/Tooltip';
import {
  isValidText,
  type RenderableChild,
  renderNodes,
  type TypographyNode,
  toNodeList,
} from './_util/nodes';
import { isEleEllipsis } from './_util/util';
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

/**
 * `InternalTypography` 的「宽松」视图。
 *
 * ⚠️ `h()` 的类型重载要求 props **精确匹配**组件的 props 类型
 *    （`RawProps & P`，见 `@vue/runtime-core` 的 `h` 声明）。而 `Base` 必须把用户的
 *    `$attrs` 一起并进去 —— 合并后的对象类型退化成 `Record<string, unknown>`，
 *    于是任何重载都过不了。
 *
 *    Vue 没有为「透传 attrs」提供类型友好的重载（模板里的 fallthrough attrs 是
 *    编译器做的，不经 `h()`）。所以这里把组件断言成 `Component`，`P` 退化为 `any`。
 *    **代价只有这一处的 prop 检查**：`InternalTypography` 自己的 props 声明、
 *    以及 `__tests__/` 里对它的直接断言都还在。
 */
const LooseInternalTypography = InternalTypography as Component;

/**
 * `Ellipsis` 的「宽松」视图。理由同 `LooseInternalTypography` ——
 * `h()` 推断不出 `Ellipsis` 的 props 类型（它把 `P` 推断成了**公共实例**类型），
 * 于是任何 props 都过不了。见 `LooseInternalTypography` 的说明。
 */
const LooseEllipsis = Ellipsis as Component;

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

export const Base = defineComponent({
  name: 'ATypographyBase',
  inheritAttrs: false,
  props: {
    // ---------------------------- 来自 TypographyProps ----------------------------
    /** 不传则从 ConfigProvider 解析（`apollo-typography`）。 */
    prefixCls: { type: String, default: undefined },
    /** 用户传的标签名。`Text`→`span`、`Paragraph`→`div`、`Link`→`a`、`Title`→`h1..h5`。 */
    component: { type: String, default: undefined },
    direction: { type: String as PropType<DirectionType>, default: undefined },
    /** antd 的 `className` prop。用户直接写的 `class` 走 `$attrs`。 */
    className: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    style: { type: Object as PropType<CSSProperties>, default: undefined },
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
  },
  setup(props, { attrs, slots, expose }) {
    const [textLocale] = useLocale('Text');

    const typographyRef = ref<{ nativeElement: HTMLElement | null } | null>(null);
    const editIconRef = ref<HTMLButtonElement | null>(null);

    const {
      classNames: mergedClassNames,
      styles: mergedStyles,
      prefixCls,
      direction,
    } = useTypographySemantic(
      props as BlockProps,
      () => props.prefixCls,
      () => props.classNames,
      () => props.styles,
      () => props.direction,
    );

    /**
     * 默认插槽的**归一化**节点列表。
     *
     * ⚠️ 这不是「顺手多包一层」。antd 的 `children` 是一个**字符串 / React 元素 /
     *    数组**；Vue 的插槽返回的却总是一个 **vnode 数组**，纯文字被包成 `Text`
     *    vnode、单子节点还可能被包成 `Fragment`。凡是用到「`children` 是不是字符串」
     *    的判据（`topAriaLabel`、`copyable` 的兜底文案、`Editable` 的初始值）都会因此
     *    失准。归一化规则与理由见 `_util/nodes.ts` 的文件头。
     *
     * ⚠️ 它是 `computed`（而不是在渲染函数里现取现用），因为 `Ellipsis` 需要一份
     *    **引用稳定**的内容来喂给它的 `watch`。每次渲染都新建数组会让测量依赖
     *    每帧都「变了」，进而把二分裁剪打成死循环。
     */
    const nodeList = computed<TypographyNode[]>(() => toNodeList(slots.default?.() ?? null));

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

    // 退出编辑态后把焦点还给编辑图标。
    //
    // ⚠️ `flush: 'post'` **不是**可省的：默认的 `flush: 'pre'` 会在**组件重渲染之前**跑，
    //    而那一刻编辑图标还没被 patch 出来（`editIconRef.value` 仍是进入编辑态时被置的
    //    `null`）—— `focus()` 静默落空，可访问性回归（键盘用户退出编辑后焦点掉回 body）。
    //    antd 的 `useLayoutEffect` 是 commit 之后跑的，`flush: 'post'` 才是它的等价物。
    watch(
      editing,
      (value, oldValue) => {
        if (!value && oldValue) {
          editIconRef.value?.focus();
        }
      },
      { flush: 'post' },
    );

    const onEditClick = (e?: MouseEvent): void => {
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
        symbol: (isExpanded: boolean) => (isExpanded ? textLocale?.collapse : textLocale?.expand),
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
    const rows = computed(() => ellipsisConfig.value.rows ?? 1);

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
    const measureMiscDeps = computed<unknown[]>(() => [
      copied.value,
      expanded.value,
      copyLoading.value,
      enableEdit.value,
      enableCopy.value,
      placement.value,
      textLocale,
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

    useResizeObserver({
      target: () => typographyEl.value,
      onResize: (size) => {
        ellipsisWidth.value = size.offsetWidth;
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
    onUpdated(remeasureWhileHovering);

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
      props.className,
      // ⚠️ 语义槽位 root **不在这里**：InternalTypography 会追加 `classNames.root`
      //    （antd 的 Base className 只有 type/disabled/ellipsis/link + 用户 className；
      //    重复添加会渲染出两份类名 —— L4 实测抓到）。
    ]);

    const rootStyle = computed<CSSProperties>(() => ({
      // ⚠️ 语义槽位 root **不在这里**：styles 经 `classNames`/`styles` prop 传给
      //    InternalTypography，由它做 `{...styles.root, ...style}` 合并 ——
      //    antd 的用户 `style` **覆盖** `styles.root`（Base 的 style 只补
      //    WebkitLineClamp）。在这里再合一次会颠倒顺序（L4 实测抓到）。
      ...props.style,
      ...(cssLineClamp.value ? { WebkitLineClamp: rows.value } : {}),
    }));

    const handleMouseEnter = (e: MouseEvent): void => {
      isHoveringTypography = true;
      measureNativeEllipsis();
      props.onMouseenter?.(e);
    };

    const handleMouseLeave = (e: MouseEvent): void => {
      isHoveringTypography = false;
      props.onMouseleave?.(e);
    };

    const renderExpand = (): RenderableChild => {
      const { expandable, symbol } = ellipsisConfig.value;
      if (!expandable) return null;
      // ⚠️ 用 `typeof` 而不是 `isFunction`：工具里的类型守卫把结果收窄成
      //    `(...args: never[]) => unknown`，调用处拿不到参数类型。
      const symbolNode = typeof symbol === 'function' ? symbol(expanded.value) : symbol;
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
          'aria-label': expanded.value ? textLocale?.collapse : textLocale?.expand,
        },
        [symbolNode],
      );
    };

    const renderEdit = (): RenderableChild => {
      if (!enableEdit.value) return null;

      const { icon, tooltip, tabIndex } = editConfig.value;
      const editTitle = toList(tooltip)[0] || textLocale?.edit;
      const ariaLabel = typeof editTitle === 'string' ? editTitle : '';

      // ⚠️ `triggerType` 不含 `icon` 时**不渲染按钮**（antd 的行为：`text` 触发靠根元素
      //    的 onClick，没有图标可点）。
      const editButton = h(
        'button',
        {
          type: 'button',
          ref: editIconRef,
          class: [`${prefixCls.value}-edit`, mergedClassNames.value.action],
          style: mergedStyles.value.action,
          onClick: onEditClick,
          'aria-label': ariaLabel,
          tabIndex,
        },
        [icon || h(EditOutlined, { role: 'button' })],
      );
      // antd 逐字：`<Tooltip key="edit" title={tooltip === false ? '' : editTitle}>{button}</Tooltip>`
      // —— `tooltip: false` 是「不弹」而不是「不包」（关闭态 DOM 等价，只 cloneVNode）。
      return triggerType.value.includes('icon')
        ? h(Tooltip, { title: tooltip === false ? '' : editTitle } as never, {
            default: () => editButton,
          })
        : null;
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
        locale: textLocale,
        onCopy: onCopyClick,
        loading: copyLoading.value,
        iconOnly: !hasContent.value,
        className: mergedClassNames.value.action,
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
      // >>>>>>>>>>> 编辑态
      if (editing.value) {
        return h(Editable, {
          value: editConfig.value.text ?? childrenText.value ?? '',
          onSave: onEditChange,
          onCancel: onEditCancel,
          onEnd: editConfig.value.onEnd,
          prefixCls: prefixCls.value,
          className: props.className,
          style: props.style,
          direction: direction.value,
          component: props.component,
          maxLength: editConfig.value.maxLength,
          autoSize: editConfig.value.autoSize,
          enterIcon: editConfig.value.enterIcon,
          classNames: mergedClassNames.value,
          styles: mergedStyles.value,
        });
      }

      // ⚠️ `EllipsisTooltip` 目前是**直通**的（Tooltip 未落地，见其文件头）。
      //    这里保留完整的四元判定链，是为了让 Tooltip 落地时**只改那一个文件**。
      return h(
        EllipsisTooltip,
        {
          enableEllipsis: mergedEnableEllipsis.value,
          isEllipsis: isMergedEllipsis.value,
          disabled: isHoveringOperations.value,
          tooltipProps: tooltipProps.value,
        },
        // ⚠️ 用 `LooseInternalTypography`（见其声明处的说明）。
        //    插槽也用**函数**而不是 `{ default: ... }` 对象 —— 后者的重载同样要求
        //    props 精确匹配。本仓库的 `ConfigProvider.ts` 也是传函数。
        () =>
          h(
            LooseInternalTypography,
            {
              ref: typographyRef,
              prefixCls: prefixCls.value,
              classNames: mergedClassNames.value,
              styles: mergedStyles.value,
              component: props.component,
              direction: direction.value,
              className: rootClassNames.value,
              rootClassName: props.rootClassName,
              style: rootStyle.value,
              onClick: triggerType.value.includes('text') ? onEditClick : undefined,
              'aria-label': topAriaLabel.value?.toString(),
              title: props.title,
              onMouseenter: handleMouseEnter,
              onMouseleave: handleMouseLeave,
              ...attrs,
            },
            () =>
              h(
                LooseEllipsis,
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

export default Base;
