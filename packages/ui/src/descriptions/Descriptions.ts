/** Stable Vue description items; row calculations affect geometry, not content ownership. */
import {
  containsComposed,
  getActiveElement,
  getFocusNodeList,
  isEmptyVNode,
  mergeDomAttrs,
  useDevWarning,
} from '@apollo-design/utils';
import {
  cloneVNode,
  computed,
  defineComponent,
  h,
  onBeforeUpdate,
  onUpdated,
  type PropType,
  provide,
  type SlotsType,
  shallowRef,
  watchEffect,
} from 'vue';
import { normalizeNode } from '../_internal/node-renderer';
import { matchScreen } from '../_internal/responsive-observer';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useSize } from '../config-provider/size-context';
import { useBreakpoint } from '../grid/hooks/use-breakpoint';
import { descriptionsContextKey } from './context';
import { DescriptionsItemComponent } from './DescriptionsItem';
import type {
  DescriptionsConfig,
  DescriptionsProps,
  DescriptionsRef,
  DescriptionsSemanticClassNames,
  DescriptionsSemanticStyles,
  DescriptionsSlots,
} from './interface';
import { DEFAULT_COLUMN_MAP, getCalcRows, normalizeItems, positiveInteger } from './items';
import { useDescriptionsTheme } from './use-descriptions-theme';

export const DescriptionsComponent = defineComponent({
  name: 'ADescriptions',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    id: { type: String, default: undefined },
    bordered: { type: Boolean, default: undefined },
    size: { type: String as PropType<DescriptionsProps['size']>, default: undefined },
    title: { type: String, default: undefined },
    column: { type: [Number, Object] as PropType<DescriptionsProps['column']>, default: undefined },
    layout: { type: String as PropType<DescriptionsProps['layout']>, default: undefined },
    colon: { type: Boolean, default: undefined },
    labelStyle: { type: Object as PropType<DescriptionsProps['labelStyle']>, default: undefined },
    contentStyle: {
      type: Object as PropType<DescriptionsProps['contentStyle']>,
      default: undefined,
    },
    items: { type: Array as PropType<DescriptionsProps['items']>, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<DescriptionsProps['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as PropType<DescriptionsProps['styles']>,
      default: undefined,
    },
  },
  slots: Object as SlotsType<DescriptionsSlots>,
  setup(props, { attrs, slots, expose }) {
    const context = useComponentConfig<DescriptionsConfig>('descriptions');
    const direction = useDirection(),
      screens = useBreakpoint();
    const warning = useDevWarning('Descriptions');
    watchEffect(() => {
      warning.deprecated(props.size !== 'default', 'size="default"', 'size="large"');
      warning.deprecated(props.labelStyle === undefined, 'labelStyle', 'styles.label');
      warning.deprecated(props.contentStyle === undefined, 'contentStyle', 'styles.content');
    });
    const prefix = computed(() => context.getPrefixCls('descriptions', props.prefixCls));
    const theme = useDescriptionsTheme(() => prefix.value);
    const column = computed(() =>
      positiveInteger(
        typeof props.column === 'number'
          ? props.column
          : (matchScreen(screens.value, props.column ?? {}) ??
              matchScreen(screens.value, DEFAULT_COLUMN_MAP)),
        3,
      ),
    );
    const size = useSize((current) => props.size ?? current ?? 'large');
    const mergedProps = computed<DescriptionsProps>(() => ({
      ...props,
      column: column.value,
      size: size.value,
    }));
    const semantic = useMergeSemantic<
      DescriptionsProps,
      DescriptionsSemanticClassNames,
      DescriptionsSemanticStyles
    >(
      [() => context.classNames, () => props.classNames],
      [
        () => context.styles,
        () => semanticRootStyle(context.style),
        () => ({ label: props.labelStyle, content: props.contentStyle }),
        () => props.styles,
      ],
      mergedProps,
    );
    provide(
      descriptionsContextKey,
      computed(() => ({
        prefixCls: prefix.value,
        colon: props.colon ?? true,
        classNames: semantic.classNames.value,
        styles: semantic.styles.value,
      })),
    );
    const resolveRows = (children: Parameters<typeof normalizeItems>[2]) => {
      const [rows, exceed] = getCalcRows(
        normalizeItems(screens.value, props.items, children),
        column.value,
      );
      warning(!exceed, 'Sum of column `span` in a line not match `column` of Descriptions.');
      return rows;
    };
    const dataRows = computed(() => resolveRows([]));
    const rootRef = shallowRef<HTMLDivElement | null>(null);
    let focusedBeforeUpdate: ReturnType<typeof getFocusNodeList>[number] | undefined;
    onBeforeUpdate(() => {
      const root = rootRef.value;
      focusedBeforeUpdate = root
        ? getFocusNodeList(root, true).find((node) => node === getActiveElement(root))
        : undefined;
    });
    onUpdated(() => {
      const root = rootRef.value,
        previous = focusedBeforeUpdate;
      focusedBeforeUpdate = undefined;
      if (
        root &&
        previous?.isConnected &&
        containsComposed(root, previous) &&
        getActiveElement(root) === root.ownerDocument.body
      )
        previous.focus({ preventScroll: true });
    });
    expose({
      get nativeElement() {
        return rootRef.value;
      },
    } satisfies DescriptionsRef);
    return () => {
      const p = prefix.value,
        classes = semantic.classNames.value,
        styles = semantic.styles.value;
      const rows = props.items !== undefined ? dataRows.value : resolveRows([slots.default?.()]);
      const title = slots.title ? slots.title() : props.title,
        extra = slots.extra?.();
      const hasTitle = !isEmptyVNode(title),
        hasExtra = !isEmptyVNode(extra);
      return h(
        'div',
        mergeDomAttrs(
          {
            ref: rootRef,
            id: props.id,
            class: [
              p,
              context.className,
              classes.root,
              {
                [`${p}-medium`]: size.value === 'medium' || size.value === 'middle',
                [`${p}-small`]: size.value === 'small',
                [`${p}-bordered`]: !!props.bordered,
                [`${p}-vertical`]: props.layout === 'vertical',
                [`${p}-rtl`]: direction.value === 'rtl',
              },
            ],
            style: [theme.value, styles.root],
          },
          attrs,
        ),
        [
          hasTitle || hasExtra
            ? h(
                'div',
                { key: 'header', class: [`${p}-header`, classes.header], style: styles.header },
                [
                  hasTitle
                    ? h(
                        'div',
                        { key: 'title', class: [`${p}-title`, classes.title], style: styles.title },
                        [title],
                      )
                    : null,
                  hasExtra
                    ? h(
                        'div',
                        { key: 'extra', class: [`${p}-extra`, classes.extra], style: styles.extra },
                        [extra],
                      )
                    : null,
                ],
              )
            : null,
          h('div', { key: 'view', class: `${p}-view` }, [
            h(
              'dl',
              { class: `${p}-list`, style: { '--apollo-descriptions-columns': column.value } },
              rows.flatMap((row, rowIndex) =>
                row.map((item, itemIndex) => {
                  const geometry = {
                    key: item.key ?? item.index,
                    'data-row': rowIndex,
                    'data-span': item.span,
                    class: {
                      [`${p}-item-row-end`]: itemIndex === row.length - 1,
                      [`${p}-item-last-row`]: rowIndex === rows.length - 1,
                    },
                    style: { '--apollo-descriptions-span': item.span },
                  };
                  return item.node
                    ? cloneVNode(item.node, geometry)
                    : h(
                        DescriptionsItemComponent,
                        {
                          ...geometry,
                          prefixCls: item.prefixCls,
                          className: item.className,
                          style: [item.style, geometry.style],
                          labelStyle: item.labelStyle,
                          contentStyle: item.contentStyle,
                          classNames: item.classNames,
                          styles: item.styles,
                        },
                        {
                          label: () => normalizeNode(item.label),
                          default: () => normalizeNode(item.children),
                        },
                      );
                }),
              ),
            ),
          ]),
        ],
      );
    };
  },
});
export const DescriptionsComponentWithItem = DescriptionsComponent;
export default DescriptionsComponent;
