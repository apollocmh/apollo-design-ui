/**
 * Descriptions —— 描述列表（渲染函数组件）。
 *
 * 契约来源：antd 6.6.4 的 `es/descriptions/index.js`（141 行）+ `Row.js` / `Cell.js` /
 * `hooks/useItems.js` / `hooks/useRow.js`（判据逐条对齐 G1 分析
 * `docs/analysis/descriptions.md`；SSR 探针钉死 DOM）。
 *
 * ── 八条最容易写错的判据 ─────────────────────────────────────────────────────
 *
 * 1. **三形态渲染分支**（Row.js / Cell.js）：
 *    - horizontal 非 bordered：label/content **同一个 td**（`-item` 类 +
 *      `-item-container` div 包两个 span，colSpan=span）；
 *    - bordered：label=`th.-item-label[colSpan=1]`、content=`td.-item-content[colSpan=span*2-1]`，
 *      内容直接 `<span>`（无 container），labelStyle/contentStyle 落 **cell** 上；
 *    - vertical：label 行 + content 行分开（非 bordered 时 cell 类是 `-item`，
 *      container 里 span 才带 `-item-label/-item-content`；bordered 时走 bordered 结构）。
 * 2. **行尾补齐**：行内 span 总和 < column 时，最后一个 item 的 span 扩成
 *    `column - (sum - lastSpan)`（basic 的 4 items / 3 列 ⇒ 末条 colSpan=3）。
 * 3. **bordered 的 colSpan 语义**：`span*2-1`（content），label 恒 1 —— 不是 span。
 * 4. **column 响应式兜底链**：`matchScreen(screens, column) ?? matchScreen(screens,
 *    DEFAULT_COLUMN_MAP) ?? 3`（用户 map 优先，无激活断点才落默认 map）。
 * 5. **header 恒只有 title||extra 才渲染**；title 与 extra 各自独立判空。
 * 6. **用户 style 走语义槽 root**（`style: mergedStyles.root`），不是单独拼 ——
 *    与 antd 的 `useSemanticRootStyle` 同构。
 * 7. **deprecation 三条**：`size="default"`→large、`labelStyle`→styles.label、
 *    `contentStyle`→styles.content。
 * 8. **size 类名只对 medium/middle 与 small**：`-medium` / `-small`；large/default 无类。
 */

import { useDevWarning } from '@apollo-design/utils';
import {
  Comment,
  computed,
  defineComponent,
  Fragment,
  h,
  type PropType,
  shallowRef,
  type VNode,
  type VNodeChild,
  watchEffect,
} from 'vue';
import type { Breakpoint, Screens } from '../_internal/responsive-observer';
import { matchScreen } from '../_internal/responsive-observer';
import {
  mergeClassNames,
  mergeStyles,
  resolveSemantic,
  styleAttrs,
} from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useSize } from '../config-provider/size-context';
import { useBreakpoint } from '../grid/hooks/use-breakpoint';
import type {
  DescriptionsItemType,
  DescriptionsProps,
  DescriptionsRef,
  DescriptionsRowItem,
  DescriptionsSemanticClassNames,
  DescriptionsSemanticStyles,
} from './interface';
import { DEFAULT_COLUMN_MAP, getCalcRows, normalizeItems } from './items';

type CellType = 'label' | 'content' | 'item';

/** renderCells 的环境参数（Row.js 的第二/三参）。 */
interface CellEnv {
  colon: boolean;
  prefixCls: string;
  bordered?: boolean;
}

interface CellStyleEnv {
  rootLabelStyle?: Record<string, string | number>;
  rootContentStyle?: Record<string, string | number>;
  styles?: { label?: Record<string, string | number>; content?: Record<string, string | number> };
  classNames?: { label?: string; content?: string };
}

const isNumber = (v: unknown): v is number => typeof v === 'number';

export const DescriptionsComponent = defineComponent({
  name: 'ADescriptions',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    className: { type: String, default: undefined },
    style: { type: Object as PropType<DescriptionsProps['style']>, default: undefined },
    id: { type: String, default: undefined },
    bordered: { type: Boolean, default: undefined },
    size: { type: String as PropType<NonNullable<DescriptionsProps['size']>>, default: undefined },
    title: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    extra: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    column: {
      type: [Number, Object] as PropType<DescriptionsProps['column']>,
      default: undefined,
    },
    layout: {
      type: String as PropType<NonNullable<DescriptionsProps['layout']>>,
      default: undefined,
    },
    colon: { type: Boolean, default: undefined },
    labelStyle: {
      type: Object as PropType<DescriptionsProps['labelStyle']>,
      default: undefined,
    },
    contentStyle: {
      type: Object as PropType<DescriptionsProps['contentStyle']>,
      default: undefined,
    },
    items: { type: Array as PropType<DescriptionsItemType[]>, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<DescriptionsProps['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as PropType<DescriptionsProps['styles']>,
      default: undefined,
    },
  },
  setup(props, { attrs, slots, expose }) {
    const context = useComponentConfig('descriptions');
    const { getPrefixCls } = context;
    const direction = useDirection();
    const devWarning = useDevWarning('Descriptions');

    // ============================== Warning ==============================
    watchEffect(() => {
      // antd：`warning.deprecated(customizeSize !== 'default', 'size="default"', 'size="large"')`
      devWarning.deprecated(props.size !== 'default', 'size="default"', 'size="large"');
      devWarning.deprecated(props.labelStyle === undefined, 'labelStyle', 'styles.label');
      devWarning.deprecated(props.contentStyle === undefined, 'contentStyle', 'styles.content');
    });

    const prefixCls = computed(() => getPrefixCls('descriptions', props.prefixCls));
    const screens = useBreakpoint();

    // ============================ Column ================================
    // 判据 4：isNumber 短路 → 用户 map → DEFAULT_COLUMN_MAP → 3
    const mergedColumn = computed<number>(() => {
      const column = props.column;
      if (isNumber(column)) {
        return column;
      }
      return (
        matchScreen(
          screens.value ?? ({} as Screens),
          column as Partial<Record<Breakpoint, number>>,
        ) ??
        matchScreen(screens.value ?? ({} as Screens), DEFAULT_COLUMN_MAP) ??
        3
      );
    });

    // ============================== Items ===============================
    const collectChildren = (nodes: VNodeChild[]): VNode[] => {
      const out: VNode[] = [];
      const walk = (list: VNodeChild[]) => {
        for (const node of list) {
          if (!node || typeof node !== 'object') continue;
          const v = node as VNode;
          if (v.type === Comment) continue;
          if (v.type === Fragment) {
            walk((v.children as VNodeChild[]) ?? []);
            continue;
          }
          out.push(v);
        }
      };
      walk(nodes);
      return out;
    };
    // ⚠️ slot 只能在 render 内消费 → shallowRef 承载，让 rows 的 computed 可追踪
    const currentChildren = shallowRef<VNode[]>([]);

    // =============================== Size ===============================
    // ⚠️ 函数形态（PITFALLS 163：useSize(props.size) 非响应式）
    const mergedSize = useSize((ctxSize) => props.size ?? ctxSize);

    // ============================ Semantic ==============================
    const mergedProps = computed<DescriptionsProps>(
      () =>
        ({
          ...props,
          column: mergedColumn.value,
          items: props.items,
          size: mergedSize.value,
        }) as DescriptionsProps,
    );
    const info = computed(() => ({ props: mergedProps.value }));
    const mergedClassNames = computed(() =>
      mergeClassNames<DescriptionsSemanticClassNames>(
        resolveSemantic<DescriptionsSemanticClassNames, DescriptionsProps>(
          props.classNames as never,
          info.value,
        ),
        resolveSemantic<DescriptionsSemanticClassNames, DescriptionsProps>(
          context.classNames as never,
          info.value,
        ),
      ),
    );
    const mergedStyles = computed(() =>
      mergeStyles<DescriptionsSemanticStyles>(
        resolveSemantic<DescriptionsSemanticStyles, DescriptionsProps>(
          props.styles as never,
          info.value,
        ),
        resolveSemantic<DescriptionsSemanticStyles, DescriptionsProps>(
          context.styles as never,
          info.value,
        ),
      ),
    );

    // ============================== Rows ================================
    const rows = computed(() => {
      // antd：`items || transChildren2Items(children)` —— items 优先
      const items = normalizeItems(screens.value, props.items, currentChildren.value);
      const [calcRows, exceed] = getCalcRows(items, mergedColumn.value);
      devWarning(!exceed, 'Sum of column `span` in a line not match `column` of Descriptions.');
      return calcRows;
    });

    // ============================ Ref / Expose ==========================
    const rootRef = shallowRef<HTMLDivElement | null>(null);
    expose({
      get nativeElement() {
        return rootRef.value;
      },
    } satisfies DescriptionsRef);

    // ============================ Cell 渲染 =============================
    const isRenderable = (v: VNodeChild | null | undefined): boolean =>
      v !== null && v !== undefined;

    /** 4 级合并（Row.js renderCells）：rootLabelStyle → rootStyles.label → item.labelStyle → item.styles.label */
    const cellStyles = (
      item: DescriptionsRowItem,
      rootLabelStyle: Record<string, string | number> | undefined,
      rootContentStyle: Record<string, string | number> | undefined,
      rootStyles: DescriptionsSemanticStyles | undefined,
    ): { label: Record<string, string | number>; content: Record<string, string | number> } => ({
      label: {
        ...rootLabelStyle,
        ...rootStyles?.label,
        ...item.labelStyle,
        ...item.styles?.label,
      },
      content: {
        ...rootContentStyle,
        ...rootStyles?.content,
        ...item.contentStyle,
        ...item.styles?.content,
      },
    });

    /** 非 bordered cell（component 为 string）：label/content 同 cell + container。 */
    const renderPlainCell = (
      item: DescriptionsRowItem,
      opts: {
        component: string;
        type: CellType;
        showLabel: boolean;
        showContent: boolean;
      } & CellEnv &
        CellStyleEnv,
    ) => {
      const { colon, prefixCls: p, showLabel, showContent, component } = opts;
      const merged = cellStyles(item, opts.rootLabelStyle, opts.rootContentStyle, opts.styles);
      const rootClassNames = opts.classNames;
      const cells: VNode[] = [
        h(
          opts.component,
          {
            key: `${opts.type}-${item.key ?? item.index}`,
            colSpan: item.span ?? 1,
            class: [`${p}-item`, item.className],
            style: item.style,
          },
          [
            h('div', { class: `${p}-item-container` }, [
              showLabel && isRenderable(item.label)
                ? h(
                    'span',
                    {
                      style: { ...merged.label },
                      class: [
                        `${p}-item-label`,
                        rootClassNames?.label,
                        { [`${p}-item-no-colon`]: !colon },
                      ],
                    },
                    [item.label],
                  )
                : null,
              showContent && isRenderable(item.children)
                ? h(
                    'span',
                    {
                      style: { ...merged.content },
                      class: [`${p}-item-content`, rootClassNames?.content],
                    },
                    [item.children],
                  )
                : null,
            ]),
          ],
        ),
      ];
      void component;
      return cells;
    };

    /** bordered cell：label=th[type 类][colSpan]、content=td[...]，style 落 cell。 */
    const renderBorderedCell = (
      item: DescriptionsRowItem,
      opts: {
        component: string;
        type: 'label' | 'content';
        span: number;
        showLabel?: boolean;
        showContent?: boolean;
      } & CellEnv &
        CellStyleEnv,
    ) => {
      const { component, type, span, prefixCls: p } = opts;
      const merged = cellStyles(item, opts.rootLabelStyle, opts.rootContentStyle, opts.styles);
      const typeStyle = type === 'label' ? merged.label : merged.content;
      const content = type === 'label' ? item.label : item.children;
      const renderable = type === 'label' ? isRenderable(item.label) : isRenderable(item.children);
      return h(
        component,
        {
          key: `${type}-${item.key ?? item.index}`,
          colSpan: span,
          style: { ...item.style, ...typeStyle },
          class: [
            item.className,
            {
              [`${p}-item-${type}`]: type === 'label' || type === 'content',
              [opts.classNames?.label ?? '']: !!opts.classNames?.label && type === 'label',
              [opts.classNames?.content ?? '']: !!opts.classNames?.content && type === 'content',
            },
          ],
        },
        renderable ? [h('span', null, [content])] : [],
      );
    };

    /** Row 渲染（Row.js）。 */
    const renderRow = (row: DescriptionsRowItem[], index: number) => {
      const p = prefixCls.value;
      const vertical = props.layout === 'vertical';
      const rootStyles = mergedStyles.value;
      const rootClassNames = mergedClassNames.value;
      const env: CellEnv & CellStyleEnv = {
        colon: props.colon ?? true,
        prefixCls: p,
        bordered: props.bordered,
        rootLabelStyle: props.labelStyle,
        rootContentStyle: props.contentStyle,
        styles: { label: rootStyles.label, content: rootStyles.content },
        classNames: { label: rootClassNames.label, content: rootClassNames.content },
      };

      if (vertical) {
        // ⚠️ vertical 的 cell：非 bordered 时 component='th'/'td'（string）→ plain 结构
        //   （cell 类是 `-item`，container 里 span 才有 item-label）；bordered 时走 bordered。
        const labelRow = h(
          'tr',
          { key: `label-${index}`, class: `${p}-row` },
          row.flatMap((item) => {
            if (props.bordered) {
              return [
                renderBorderedCell(item, {
                  ...env,
                  component: 'th',
                  type: 'label',
                  span: item.span ?? 1,
                }),
              ];
            }
            return renderPlainCell(item, {
              ...env,
              component: 'th',
              type: 'label',
              showLabel: true,
              showContent: false,
            });
          }),
        );
        const contentRow = h(
          'tr',
          { key: `content-${index}`, class: `${p}-row` },
          row.flatMap((item) => {
            if (props.bordered) {
              return [
                renderBorderedCell(item, {
                  ...env,
                  component: 'td',
                  type: 'content',
                  span: item.span ?? 1,
                }),
              ];
            }
            return renderPlainCell(item, {
              ...env,
              component: 'td',
              type: 'content',
              showLabel: false,
              showContent: true,
            });
          }),
        );
        return [labelRow, contentRow];
      }

      return [
        h(
          'tr',
          { key: index, class: `${p}-row` },
          row.flatMap((item) => {
            if (props.bordered) {
              // 判据 3：label colSpan=1、content colSpan=span*2-1
              return [
                renderBorderedCell(item, {
                  ...env,
                  component: 'th',
                  type: 'label',
                  span: 1,
                  showLabel: true,
                }),
                renderBorderedCell(item, {
                  ...env,
                  component: 'td',
                  type: 'content',
                  span: (item.span ?? 1) * 2 - 1,
                  showContent: true,
                }),
              ];
            }
            return renderPlainCell(item, {
              ...env,
              component: 'td',
              type: 'item',
              showLabel: true,
              showContent: true,
            });
          }),
        ),
      ];
    };

    // ============================== Render ==============================
    return () => {
      // slot 只在 render 里消费
      currentChildren.value = collectChildren((slots.default?.() ?? []) as VNodeChild[]);
      const cls = prefixCls.value;
      const size = mergedSize.value;

      // 判据 8：medium/middle → -medium；small → -small；large/default 无类
      const hasTitle = props.title !== undefined && props.title !== null;
      const hasExtra = props.extra !== undefined && props.extra !== null;

      const {
        class: _attrClass,
        style: _attrStyle,
        ...restAttrs
      } = attrs as Record<string, unknown>;

      return h(
        'div',
        {
          ...restAttrs,
          ref: rootRef,
          id: props.id,
          class: [
            cls,
            context.className as string | undefined,
            mergedClassNames.value.root,
            {
              [`${cls}-medium`]: size === 'medium' || size === 'middle',
              [`${cls}-small`]: size === 'small',
              [`${cls}-bordered`]: !!props.bordered,
              [`${cls}-rtl`]: direction.value === 'rtl',
            },
            props.className,
            props.rootClassName,
          ],
          // 判据 6：用户 style 走语义槽 root（antd 的 useSemanticRootStyle 同构）
          ...styleAttrs({ ...props.style, ...mergedStyles.value.root }),
        },
        [
          (hasTitle || hasExtra) &&
            h(
              'div',
              {
                class: [`${cls}-header`, mergedClassNames.value.header],
                ...styleAttrs(mergedStyles.value.header),
              },
              [
                hasTitle &&
                  h(
                    'div',
                    {
                      class: [`${cls}-title`, mergedClassNames.value.title],
                      ...styleAttrs(mergedStyles.value.title),
                    },
                    [props.title],
                  ),
                hasExtra &&
                  h(
                    'div',
                    {
                      class: [`${cls}-extra`, mergedClassNames.value.extra],
                      ...styleAttrs(mergedStyles.value.extra),
                    },
                    [props.extra],
                  ),
              ],
            ),
          h('div', { class: `${cls}-view` }, [
            h('table', null, [
              h(
                'tbody',
                null,
                rows.value.flatMap((row, index) => renderRow(row, index)),
              ),
            ]),
          ]),
        ],
      );
    };
  },
});

export const DescriptionsComponentWithItem = DescriptionsComponent;
export default DescriptionsComponent;
