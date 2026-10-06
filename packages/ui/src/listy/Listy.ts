/**
 * Listy —— 轻量列表（antd v6 新增组件）。
 *
 * 契约来源：antd 6.6.4 `es/listy/index.js`（87 行薄壳）+ `@rc-component/listy@1.2.3`
 * 的 `List.js` / `RawList/index.js` / `VirtualList/index.js` / `GroupHeader.js`（逐条
 * 对拍；引擎本体在 `engine/` 自建，H5 禁 rc）。渲染函数选型（无 .vue）：
 * Raw / Virtual 两分支 + 吸顶克隆头的 DOM 由上游机械规则决定（见
 * docs/analysis/listy.md §4）。
 *
 * ── 与 antd 的有意差异 ────────────────────────────────────────────────────────
 *
 * 1. `itemRender` ⇒ default slot（作用域 `{ item, index }`）+ 保留同名 prop（I1）。
 * 2. `ref` ⇒ `expose({ scrollTo })`（I3）。
 * 3. 虚拟模式的 DOM 与 rc-virtual-list 不同：复用 `@apollo-design/virtual-list`
 *    （原生滚动、无自绘滚动条）—— PLATFORM，foundation 契约 §5.1 已登记（I4）。
 * 4. `itemHeight`（虚拟估算行高）用**默认主题的构建期解析值**：
 *    `fontHeight + (itemPaddingBlock ?? paddingSM) * 2`。antd 用 `useToken()` 是
 *    主题响应式的；本仓 token 消费都是静态的（D50 同判），主题覆盖
 *    `Listy.itemPaddingBlock` 不会反映到估算行高（见 index.zh-CN.md FAQ）。
 */

import { devUseWarning } from '@apollo-design/utils';
import { VirtualList, type VirtualListExposed } from '@apollo-design/virtual-list';
import { computed, defineComponent, h, type PropType, ref, type VNode, type VNodeChild } from 'vue';
import { useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useConfigContext, useDirection } from '../config-provider/context';
import {
  collectGroupSegments,
  findActiveHeaderIndex,
  flattenRows,
  resolveItemKey,
  scrollRawList,
  stickyPush,
  toTaggedKey,
} from './engine';
import type {
  ListyClassNames,
  ListyGroup,
  ListyKey,
  ListyProps,
  ListyRef,
  ListyScrollAlign,
  ListyScrollToConfig,
  ListyStyles,
} from './interface';
import { itemHeightOf } from './style';

/** 组件内部统一的项类型（泛型薄壳不透传泛型，运行时按 unknown 流转）。 */
type Item = Record<string, unknown>;

/** antd 的 `useSemanticRootStyle`：把平铺 style 包成 { root: style }（空 ⇒ undefined）。 */
const rootStyleSem = (
  style?: Record<string, string | number>,
): Record<string, Record<string, string | number>> | undefined =>
  style ? { root: style } : undefined;

/** antd 薄壳从 `useComponentConfig('listy')` 读取的组件级配置。 */
interface ListyComponentConfig {
  className?: string;
  style?: Record<string, string | number>;
  classNames?: ListyClassNames;
  styles?: ListyStyles;
}

/** antd 的 `itemHeight = fontHeight + (itemPaddingBlock ?? paddingSM) * 2`（文件头差异 4）。 */
const DEFAULT_ITEM_HEIGHT = itemHeightOf();

/** rc `align:'auto'` ⇒ virtual-list 的「缺省 align」（视口外才决定方向，语义等价）。 */
const mapAlign = (align?: ListyScrollAlign): 'top' | 'bottom' | undefined =>
  align === 'auto' ? undefined : align;

export const Listy = defineComponent({
  name: 'AListy',
  inheritAttrs: false,
  props: {
    items: { type: Array as PropType<unknown[]>, default: undefined },
    rowKey: {
      type: [String, Function] as PropType<ListyProps['rowKey']>,
      required: true,
    },
    itemRender: {
      type: Function as PropType<(item: unknown, index: number) => VNodeChild>,
      default: undefined,
    },
    group: { type: Object as PropType<ListyProps['group']>, default: undefined },
    sticky: { type: Boolean, default: undefined },
    virtual: { type: Boolean, default: undefined },
    height: { type: Number, default: undefined },
    prefixCls: { type: String, default: undefined },
    classNames: { type: Object as PropType<ListyClassNames>, default: undefined },
    styles: { type: Object as PropType<ListyStyles>, default: undefined },
    onScroll: {
      type: Function as PropType<((event: Event) => void) | undefined>,
      default: undefined,
    },
  },
  setup(props, { slots, expose, attrs }) {
    const context = useComponentConfig<ListyComponentConfig>('listy');
    const configContext = useConfigContext();
    const contextDirection = useDirection();

    // ⚠️ antd 的 ListyProps Omit 了 direction —— 方向只来自 ConfigProvider（L4 实测）
    const mergedDirection = computed(() => contextDirection.value ?? 'ltr');
    const mergedVirtual = computed(() => props.virtual ?? configContext.virtual ?? false);

    // ============================ Semantic ============================
    const { classNames: mergedClassNames, styles: mergedStyles } = useMergeSemantic<
      ListyProps,
      ListyClassNames,
      ListyStyles
    >(
      [() => context.classNames, () => props.classNames],
      [() => context.styles, () => rootStyleSem(context.style), () => props.styles],
      props as ListyProps,
    );

    const prefixCls = computed(() => context.getPrefixCls('listy', props.prefixCls));

    // antd 把 Component Token 混进 alias token 后算 itemHeight（见文件头差异 4）
    const itemHeight = DEFAULT_ITEM_HEIGHT;

    // ============================== Data ==============================
    const data = computed<Item[]>(() => (props.items ?? []) as Item[]);

    const getItemKey = (item: unknown): ListyKey => resolveItemKey(props.rowKey, item as Item);

    /** 项内容：slot 优先（I1），prop 兜底。 */
    const renderItemContent = (item: unknown, index: number): VNodeChild => {
      if (slots.default) {
        return slots.default({ item, index });
      }
      if (props.itemRender) {
        return props.itemRender(item, index);
      }
      devUseWarning('Listy')(
        false,
        '`itemRender` is required when no default slot is provided; falling back to empty content.',
      );
      return null;
    };

    /** 分组头（GroupHeader.js 的类名三态）。 */
    const renderGroupHeader = (
      group: NonNullable<ListyProps['group']>,
      groupKey: ListyKey,
      groupItems: Item[],
      extra: { sticky?: boolean; fixed?: boolean },
    ): VNode => {
      const cls = prefixCls.value;
      return h(
        'div',
        {
          class: [
            `${cls}-group-header`,
            { [`${cls}-group-header-sticky`]: extra.sticky === true },
            { [`${cls}-group-header-fixed`]: extra.fixed === true },
            mergedClassNames.value.groupHeader,
          ],
          style: mergedStyles.value.groupHeader,
        },
        [group.title(groupKey, groupItems)],
      );
    };

    /** 单个项行（RawList 的 renderItem：div.{p}-item[data-key]）。 */
    const renderItem = (item: unknown, index: number): VNode => {
      const cls = prefixCls.value;
      const key = getItemKey(item);
      return h(
        'div',
        {
          key,
          class: [`${cls}-item`, mergedClassNames.value.item],
          style: mergedStyles.value.item,
          'data-key': toTaggedKey(key, 'item'),
        },
        [renderItemContent(item, index)],
      );
    };

    // ============================== Ref ==============================
    const rawHolderRef = ref<HTMLElement | null>(null);
    const virtualListRef = ref<VirtualListExposed | null>(null);

    expose({
      scrollTo: (config?: ListyScrollToConfig) => {
        if (mergedVirtual.value) {
          scrollToVirtual(config);
        } else {
          scrollRawList(
            rawHolderRef.value,
            config,
            prefixCls.value,
            !!(props.sticky && props.group),
          );
        }
      },
    } as ListyRef);

    /** 虚拟分支的 scrollTo（VirtualList/index.js 的 scrollTo useEvent）。 */
    const scrollToVirtual = (config: unknown): void => {
      const list = virtualListRef.value;
      if (!list) {
        return;
      }
      if (!config || typeof config !== 'object') {
        list.scrollTo(config as never);
        return;
      }
      if ('groupKey' in config) {
        const { groupKey, align, offset } = config as {
          groupKey: ListyKey;
          align?: ListyScrollAlign;
          offset?: number;
        };
        list.scrollTo({
          key: toTaggedKey(groupKey, 'group'),
          align: mapAlign(align),
          offset,
        });
        return;
      }
      if ('key' in config) {
        const cfg = config as { key: ListyKey; align?: ListyScrollAlign; offset?: number };
        const taggedItemKey = toTaggedKey(cfg.key, 'item');
        const stickyGroupKey =
          props.sticky && props.group && cfg.align !== 'bottom'
            ? flat.value.itemKeyToGroupKey.get(taggedItemKey)
            : undefined;
        if (stickyGroupKey === undefined) {
          list.scrollTo({ ...cfg, key: taggedItemKey, align: mapAlign(cfg.align) });
          return;
        }
        list.scrollTo({
          ...cfg,
          key: taggedItemKey,
          align: mapAlign(cfg.align),
          offset: ({ getSize }: { getSize: (k: string) => { top: number; bottom: number } }) => {
            const baseOffset = cfg.offset ?? 0;
            if (cfg.align !== 'top') {
              return baseOffset;
            }
            // 用实测组头高度把项压到吸顶头之下（rc 同式）
            const headerSize = getSize(toTaggedKey(stickyGroupKey, 'group'));
            const headerHeight = headerSize.bottom - headerSize.top;
            return baseOffset + (Number.isFinite(headerHeight) ? headerHeight : 0);
          },
        });
        return;
      }
      list.scrollTo(config as never);
    };

    // =========================== Virtual rows ===========================
    const flat = computed(() =>
      flattenRows(data.value, props.group as ListyGroup<Item> | undefined, getItemKey),
    );

    /** 吸顶克隆头（useStickyGroupHeader 的 extraRender；坐标换算见文件头）。 */
    const renderStickyHeader = (info: {
      getSize: (k: string) => { top: number; bottom: number };
      scrollTop: number;
      virtual: boolean;
    }): VNodeChild => {
      const group = props.group;
      const cls = prefixCls.value;
      if (!(props.sticky && group) || !flat.value.groupKeys.length || !info.virtual) {
        return null;
      }
      const activeIdx = findActiveHeaderIndex(
        flat.value.groupKeys,
        (groupKey) => info.getSize(toTaggedKey(groupKey, 'group')).top,
        info.scrollTop,
      );
      const currGroupKey = flat.value.groupKeys[activeIdx] as ListyKey;
      const groupItems = flat.value.groupKeyToItems.get(currGroupKey) ?? [];
      const currentSize = info.getSize(toTaggedKey(currGroupKey, 'group'));
      const headerHeight = currentSize.bottom - currentSize.top;
      const nextGroupKey = flat.value.groupKeys[activeIdx + 1];
      // rc 在 holder 坐标系算 push；我们渲染在 Filler 内层（translateY(-scrollTop)），
      // 视觉等价 ⇒ 内层坐标 top = scrollTop + push
      const push = stickyPush(
        nextGroupKey !== undefined
          ? info.getSize(toTaggedKey(nextGroupKey, 'group')).top
          : undefined,
        headerHeight,
        info.scrollTop,
      );
      return h('div', { class: `${cls}-group-header-holder` }, [
        h(
          'div',
          {
            class: [
              `${cls}-group-header`,
              `${cls}-group-header-fixed`,
              mergedClassNames.value.groupHeader,
            ],
            // ⚠️ `top` 必须胜过用户在 styles.groupHeader 里给的 top（rc 注释原文），
            //    但 background 等其余样式仍应尊重用户样式 —— 所以分两段合
            style: {
              ...(mergedStyles.value.groupHeader ?? {}),
              top: `${info.scrollTop + push}px`,
            },
          },
          [group.title(currGroupKey, groupItems)],
        ),
      ]);
    };

    // ============================== Render ==============================
    return () => {
      const cls = prefixCls.value;
      const direction = mergedDirection.value;
      const rootClass = [
        context.className,
        mergedClassNames.value.root,
        // 调用方原生 `class`（位置与原先的 props.className/rootClassName 一致）
        attrs.class,
      ];

      // ---------- Raw 分支（默认；RawList/index.js） ----------
      if (!mergedVirtual.value) {
        const groupData = collectGroupSegments<Item>(
          data.value,
          props.group as ListyGroup<Item> | undefined,
        );
        const rawContent: VNodeChild = props.group
          ? Array.from(groupData, ([groupKey, groupItems]) => {
              const currentGroupItems = groupItems.map(({ item }) => item);
              return h(
                'div',
                {
                  key: groupKey,
                  class: `${cls}-group-section`,
                  'data-key': toTaggedKey(groupKey, 'group'),
                },
                [
                  renderGroupHeader(props.group as ListyGroup<Item>, groupKey, currentGroupItems, {
                    sticky: props.sticky,
                  }),
                  ...groupItems.map(({ item, index }) => renderItem(item, index)),
                ],
              );
            })
          : data.value.map((item, index) => renderItem(item, index));

        return h(
          'div',
          {
            ...attrs,
            ref: rawHolderRef,
            class: [cls, { [`${cls}-rtl`]: direction === 'rtl' }, ...rootClass],
            dir: direction,
            style: [
              {
                maxHeight: props.height === undefined ? undefined : `${props.height}px`,
                overflowY: props.height === undefined ? undefined : 'auto',
                overflowAnchor: 'none',
              },
              mergedStyles.value.root,
              attrs.style,
            ],
            onScroll: props.onScroll,
          },
          rawContent,
        );
      }

      // ---------- Virtual 分支（VirtualList/index.js → @apollo-design/virtual-list） ----------
      return h(
        VirtualList,
        {
          ref: virtualListRef,
          data: flat.value.rows,
          itemKey: (row: unknown) => (row as { taggedKey: string }).taggedKey,
          direction,
          fullHeight: false,
          height: props.height,
          itemHeight,
          virtual: true,
          prefixCls: cls,
          onScroll: props.onScroll,
          class: rootClass,
          // 根 `style` 是 Vue 原生 attrs（Virtual 分支原先靠语义列表带上 props.style）
          style: [mergedStyles.value.root, attrs.style],
        },
        {
          default: ({
            item,
          }: {
            item: { type: string; item?: unknown; index?: number; groupKey?: ListyKey };
          }) => {
            if (item.type === 'group') {
              return renderGroupHeader(
                props.group!,
                item.groupKey!,
                flat.value.groupKeyToItems.get(item.groupKey!) ?? [],
                {},
              );
            }
            const cls2 = prefixCls.value;
            return h(
              'div',
              {
                class: [`${cls2}-item`, mergedClassNames.value.item],
                style: mergedStyles.value.item,
              },
              [renderItemContent(item.item, item.index!)],
            );
          },
          extra: renderStickyHeader,
        },
      );
    };
  },
});

export default Listy;
