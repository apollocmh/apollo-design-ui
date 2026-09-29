<script lang="ts">
/**
 * Pagination 主实现 —— antd 6.6.4 `es/pagination/{Pagination,index}.js`（213 行壳）
 * + rc-pagination@1.4.0 `es/Pagination.js`（441 行内核）的 Vue 等价物。
 *
 * 判据逐条见 `docs/analysis/pagination.md`；纯函数形态的页码列表算法在 `./getPagerList.ts`。
 *
 * ── 壳层（antd）──────────────────────────────────────────────────────────────
 * `responsive` 的 breakpoint（xs ⇒ small）、`size`、`variant('input')` 的类名、
 * locale 三级合并（rc enUS → ConfigProvider → props.locale）、`showSizeChanger` 的
 * props↔ConfigProvider **`??` 合并**、`sizeChangerRender`（渲染成本仓 Select）、
 * 4 组图标（RTL 下左右互换）、`wireframe` 的 `-bordered` 类。
 *
 * ── 状态机（rc）──────────────────────────────────────────────────────────────
 * `current` 三重钳制（`clamp(internal, 1, allPages)`）、`pageSize` 受控/非受控、
 * 三个变化入口（handleChange / changePageSize / 简化模式输入）、跳页与相邻页的目标页、
 * 简化模式的 `readOnly`、`shouldDisplayQuickJumper = total > pageSize`。
 *
 * ── Vue 化差异（登记 COMPATIBILITY）──────────────────────────────────────────
 *   - `v-model:current` / `v-model:pageSize`（C11：`update:*` 与语义事件同发）；
 *   - `itemRender` / `showTotal` / `components.sizeChanger` → scoped slot（C8）；
 *   - ⚠️ 属性透传按 rc 的 `pickAttrs({aria, data})`：**只有 `aria-*` / `data-*` 落到根 `<ul>`**，
 *     其余未知属性丢弃（`class` / `style` 走各自的通道）；
 *   - 本组件**没有** expose（上游是 `React.FC`）。
 */

import {
  DoubleLeftOutlined,
  DoubleRightOutlined,
  EllipsisOutlined,
  LeftOutlined,
  RightOutlined,
} from '@apollo-design/icons';
import { useLocale } from '@apollo-design/locale';
import { computed, defineComponent, h, type PropType, ref, toRef, useAttrs, watch } from 'vue';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import { useComponentConfig, useDirection } from '../config-provider/context';
import { useSize } from '../config-provider/size-context';
import { useVariant } from '../form/hooks/useVariants';
import { useBreakpoint } from '../grid/hooks/use-breakpoint';
import Select from '../select';
import { calculatePage, getPagerList } from './getPagerList';
import type {
  PaginationItemType,
  PaginationLocale,
  PaginationProps,
  PaginationRange,
  PaginationSemanticClassNames,
  PaginationSemanticStyles,
  PaginationSizeChangerInfo,
} from './interface';
import Options from './Options';
import Pager from './Pager';
import { useShowSizeChanger } from './useShowSizeChanger';

export default defineComponent({
  name: 'APagination',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    className: { type: String, default: undefined },
    rootClassName: { type: String, default: undefined },
    style: { type: Object as PropType<PaginationProps['style']>, default: undefined },
    total: { type: Number, default: 0 },
    current: { type: Number, default: undefined },
    defaultCurrent: { type: Number, default: 1 },
    pageSize: { type: Number, default: undefined },
    defaultPageSize: { type: Number, default: 10 },
    pageSizeOptions: { type: Array as PropType<number[]>, default: undefined },
    totalBoundaryShowSizeChanger: { type: Number, default: undefined },
    showSizeChanger: {
      type: [Boolean, Object] as PropType<PaginationProps['showSizeChanger']>,
      default: undefined,
    },
    showQuickJumper: {
      type: [Boolean, Object] as PropType<PaginationProps['showQuickJumper']>,
      default: undefined,
    },
    showPrevNextJumpers: { type: Boolean, default: true },
    showLessItems: { type: Boolean, default: undefined },
    showTitle: { type: Boolean, default: true },
    hideOnSinglePage: { type: Boolean, default: undefined },
    simple: { type: [Boolean, Object] as PropType<PaginationProps['simple']>, default: undefined },
    disabled: { type: Boolean, default: undefined },
    size: { type: String as PropType<PaginationProps['size']>, default: undefined },
    responsive: { type: Boolean, default: undefined },
    align: { type: String as PropType<PaginationProps['align']>, default: undefined },
    locale: { type: Object as PropType<PaginationLocale>, default: undefined },
    itemRender: { type: Function as PropType<PaginationProps['itemRender']>, default: undefined },
    showTotal: { type: Function as PropType<PaginationProps['showTotal']>, default: undefined },
    role: { type: String, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<PaginationProps['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as PropType<PaginationProps['styles']>,
      default: undefined,
    },
    sizeChangerRender: {
      type: Function as PropType<PaginationProps['sizeChangerRender']>,
      default: undefined,
    },
  },
  emits: {
    'update:current': (_current: number) => true,
    change: (_current: number, _pageSize: number) => true,
    'update:pageSize': (_pageSize: number) => true,
    showSizeChange: (_current: number, _size: number) => true,
  },
  setup(props, { slots, emit }) {
    const attrs = useAttrs();
    const config = useComponentConfig('pagination') as unknown as {
      getPrefixCls: (suffix?: string, custom?: string) => string;
      className?: string;
      style?: PaginationProps['style'];
      classNames?: PaginationSemanticClassNames;
      styles?: PaginationSemanticStyles;
      showSizeChanger?: PaginationProps['showSizeChanger'];
      totalBoundaryShowSizeChanger?: number;
    };
    const direction = useDirection();
    const prefixCls = computed(() => config.getPrefixCls('pagination', props.prefixCls));

    // ---- 语义合并 ----
    const mergedSemantic = useMergeSemantic<
      PaginationProps,
      PaginationSemanticClassNames,
      PaginationSemanticStyles
    >(
      [computed(() => config.classNames), computed(() => props.classNames)],
      [
        computed(() => config.styles),
        computed(() => semanticRootStyle(config.style)),
        computed(() => props.styles),
        computed(() => semanticRootStyle(props.style)),
      ],
      props,
    );

    // ---- locale：rc enUS → ConfigProvider → props.locale（props 最优先）----
    const [contextLocale] = useLocale('Pagination');
    const mergedLocale = computed<PaginationLocale>(() => ({
      ...contextLocale,
      ...(props.locale ?? {}),
    }));

    // ---- size / variant / responsive ----
    const mergedSize = useSize(toRef(props, 'size'));
    // ⚠️ 本仓的 `useBreakpoint` 返回 `Ref<Screens | null>`（antd 返回 screens 对象本体）
    const screens = useBreakpoint(!!props.responsive);
    const isSmall = computed(
      () =>
        mergedSize.value === 'small' ||
        !!(screens.value?.xs && !mergedSize.value && props.responsive),
    );
    // ⚠️ 本仓的 `useVariant` 收**选项对象**、返回 `{ variant, enableVariantCls }`（antd 是位置参数 + 元组）
    const { variant: inputVariant, enableVariantCls } = useVariant({ component: 'pagination' });

    // ---- 状态：pageSize / current（受控 + 内部）----
    const innerPageSize = ref(props.defaultPageSize);
    const mergedPageSize = computed(() => props.pageSize ?? innerPageSize.value);
    const innerCurrent = ref(props.defaultCurrent);

    const allPages = computed(() => calculatePage(mergedPageSize.value, props.total ?? 0));
    const mergedCurrent = computed(() =>
      Math.max(1, Math.min(props.current ?? innerCurrent.value, allPages.value)),
    );
    /** 简化模式输入框的内部值（rc 的 `internalInputVal`）。 */
    const inputValue = ref(mergedCurrent.value);
    watch(mergedCurrent, (next) => {
      inputValue.value = next;
    });

    const hasPrev = computed(() => mergedCurrent.value > 1);
    const hasNext = computed(() => mergedCurrent.value < allPages.value);

    // ---- 尺寸切换器（props ↔ ConfigProvider 的 ?? 合并）----
    const [propShowSizeChanger, propSizeChangerSelectProps] = useShowSizeChanger(
      props.showSizeChanger,
    );
    const [configShowSizeChanger, configSizeChangerSelectProps] = useShowSizeChanger(
      config.showSizeChanger,
    );
    const mergedShowSizeChanger = computed(
      () =>
        propShowSizeChanger ??
        configShowSizeChanger ??
        (props.total ?? 0) >
          (props.totalBoundaryShowSizeChanger ?? config.totalBoundaryShowSizeChanger ?? 50),
    );
    const mergedSizeChangerSelectProps = computed(
      () => propSizeChangerSelectProps ?? configSizeChangerSelectProps,
    );

    // ---- 变化入口 ----
    const isValid = (page: number): boolean =>
      Number.isInteger(page) &&
      page !== mergedCurrent.value &&
      Number.isInteger(props.total) &&
      (props.total ?? 0) > 0;

    const changeCurrent = (page: number): number => {
      if (isValid(page) && !props.disabled) {
        const total = allPages.value;
        let newPage = page;
        if (page > total) newPage = total;
        else if (page < 1) newPage = 1;
        if (newPage !== inputValue.value) inputValue.value = newPage;
        innerCurrent.value = newPage;
        emit('update:current', newPage);
        emit('change', newPage, mergedPageSize.value);
        return newPage;
      }
      return mergedCurrent.value;
    };

    const changePageSize = (size: number): void => {
      const newCurrent = calculatePage(size, props.total ?? 0);
      const nextCurrent =
        mergedCurrent.value > newCurrent && newCurrent !== 0 ? newCurrent : mergedCurrent.value;
      innerPageSize.value = size;
      inputValue.value = nextCurrent;
      emit('update:pageSize', size);
      emit('showSizeChange', mergedCurrent.value, size);
      innerCurrent.value = nextCurrent;
      emit('update:current', nextCurrent);
      emit('change', nextCurrent, size);
    };

    // ---- 跳页 / 相邻页目标页 ----
    const jumpPages = computed(() => ({
      prev: mergedCurrent.value - 1 > 0 ? mergedCurrent.value - 1 : 0,
      next: mergedCurrent.value + 1 < allPages.value ? mergedCurrent.value + 1 : allPages.value,
    }));

    // ---- 列表（纯函数）----
    const pagerList = computed(() =>
      getPagerList({
        allPages: allPages.value,
        current: mergedCurrent.value,
        showLessItems: !!props.showLessItems,
        showPrevNextJumpers: props.showPrevNextJumpers,
      }),
    );

    // ---- 简化模式 ----
    const isReadOnly = computed(() =>
      typeof props.simple === 'object' ? !!props.simple.readOnly : !props.simple,
    );
    const shouldDisplayQuickJumper = computed(
      () => (props.total ?? 0) > mergedPageSize.value && !!props.showQuickJumper,
    );
    const goButton = computed(() =>
      typeof props.showQuickJumper === 'object' ? props.showQuickJumper.goButton : undefined,
    );

    const getValidInputValue = (e: Event): number | string => {
      const raw = (e.target as HTMLInputElement).value;
      const pages = allPages.value;
      if (raw === '') return '';
      if (Number.isNaN(Number(raw))) return inputValue.value;
      if (Number(raw) >= pages) return pages;
      return Number(raw);
    };

    const handleSimpleKeyDown = (e: KeyboardEvent): void => {
      // 防止上下键把光标移到文本开头（rc 附的 stackoverflow 链接）
      if (e.keyCode === 38 || e.keyCode === 40) e.preventDefault();
    };
    const handleSimpleKeyUp = (e: KeyboardEvent): void => {
      const value = getValidInputValue(e);
      if (value !== inputValue.value) inputValue.value = value as number;
      switch (e.keyCode) {
        case 13:
          changeCurrent(value as number);
          break;
        case 38:
          changeCurrent((value as number) - 1);
          break;
        case 40:
          changeCurrent((value as number) + 1);
          break;
        default:
          break;
      }
    };
    const handleSimpleBlur = (e: FocusEvent): void => {
      changeCurrent(getValidInputValue(e) as number);
    };

    // ---- 键盘：仅 Enter 触发 ----
    const runIfEnter = (
      event: KeyboardEvent,
      callback: (...args: never[]) => void,
      ...rest: never[]
    ): void => {
      if (event.key === 'Enter' || event.charCode === 13 || event.keyCode === 13) {
        callback(...rest);
      }
    };

    // ---- 图标（RTL 下左右互换；jump 图标按 direction 选双箭头）----
    const icons = computed(() => {
      const p = prefixCls.value;
      const isRTL = direction.value === 'rtl';
      const ellipsis = h('span', { class: `${p}-item-ellipsis` }, [h(EllipsisOutlined)]);
      return {
        ellipsis,
        prevIcon: h('button', { class: `${p}-item-link`, type: 'button', tabIndex: -1 }, [
          isRTL ? h(RightOutlined) : h(LeftOutlined),
        ]),
        nextIcon: h('button', { class: `${p}-item-link`, type: 'button', tabIndex: -1 }, [
          isRTL ? h(LeftOutlined) : h(RightOutlined),
        ]),
        jumpPrevIcon: h('a', { class: `${p}-item-link` }, [
          h('div', { class: `${p}-item-container` }, [
            isRTL
              ? h(DoubleRightOutlined, { class: `${p}-item-link-icon` })
              : h(DoubleLeftOutlined, { class: `${p}-item-link-icon` }),
            ellipsis,
          ]),
        ]),
        jumpNextIcon: h('a', { class: `${p}-item-link` }, [
          h('div', { class: `${p}-item-container` }, [
            isRTL
              ? h(DoubleLeftOutlined, { class: `${p}-item-link-icon` })
              : h(DoubleRightOutlined, { class: `${p}-item-link-icon` }),
            ellipsis,
          ]),
        ]),
      };
    });

    // ---- itemRender 通道（slot 优先于 prop）----
    const itemRenderer = computed(() => {
      if (slots.itemRender) {
        return (page: number, type: PaginationItemType, element: unknown) =>
          slots.itemRender?.(page, type, element as never);
      }
      return props.itemRender;
    });

    /** 尺寸切换器的渲染函数（`sizeChangerRender` prop 优先，其次 `#sizeChanger` 槽，最后内置 Select）。 */
    const sizeChangerRender = computed(() => {
      if (props.sizeChangerRender) return props.sizeChangerRender;
      if (slots.sizeChanger) {
        return (info: PaginationSizeChangerInfo) => slots.sizeChanger?.(info);
      }
      return (info: PaginationSizeChangerInfo) => {
        const selectProps = mergedSizeChangerSelectProps.value ?? {};
        const p = prefixCls.value;
        const selectedValue =
          info.options.find((option) => String(option.value) === String(info.value))?.value ??
          info.value;
        return h(
          Select as never,
          {
            ...(selectProps as Record<string, unknown>),
            disabled: info.disabled,
            showSearch: true,
            popupMatchSelectWidth: false,
            getPopupContainer: (triggerNode: HTMLElement) => triggerNode.parentNode as HTMLElement,
            'aria-label': info['aria-label'],
            options: info.options,
            value: selectedValue,
            size: mergedSize.value,
            // ⚠️ 本仓的 Select 用 `className` **prop**（且 `inheritAttrs: false`）
            className: [
              `${p}-options-size-changer-select`,
              info.className,
              (selectProps as { className?: string }).className,
            ]
              .filter(Boolean)
              .join(' '),
            onChange: (next: number) => info.onChange?.(Number(next)),
          } as never,
        );
      };
    });

    return () => {
      const p = prefixCls.value;
      // ⚠️ `hideOnSinglePage && total <= pageSize` ⇒ 整体不渲染（rc 逐字）
      if (props.hideOnSinglePage && (props.total ?? 0) <= mergedPageSize.value) {
        return null;
      }

      const classNames = mergedSemantic.classNames.value;
      const styles = mergedSemantic.styles.value;

      // ---- 属性透传：只放行 aria-* / data-* ----
      const passthrough: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(attrs)) {
        if (key.startsWith('aria-') || key.startsWith('data-')) passthrough[key] = value;
      }

      // ---- 「共 x 条」 ----
      const totalText = (() => {
        const total = props.total ?? 0;
        const range: PaginationRange = [
          total === 0 ? 0 : (mergedCurrent.value - 1) * mergedPageSize.value + 1,
          mergedCurrent.value * mergedPageSize.value > total
            ? total
            : mergedCurrent.value * mergedPageSize.value,
        ];
        if (slots.total) {
          return h('li', { class: `${p}-total-text` }, [slots.total(total, range)]);
        }
        if (props.showTotal) {
          return h('li', { class: `${p}-total-text` }, [props.showTotal(total, range)]);
        }
        return null;
      })();

      // ---- 简化模式 ----
      const simplePager = (() => {
        if (!props.simple) return null;
        let gotoButton = goButton.value;
        if (goButton.value) {
          const content =
            goButton.value === true
              ? h(
                  'button',
                  { type: 'button', onClick: () => changeCurrent(inputValue.value) },
                  mergedLocale.value.jump_to_confirm,
                )
              : h('span', { onClick: () => changeCurrent(inputValue.value) }, [goButton.value]);
          gotoButton = h(
            'li',
            {
              title: props.showTitle
                ? `${mergedLocale.value.jump_to}${mergedCurrent.value}/${allPages.value}`
                : undefined,
              class: `${p}-simple-pager`,
            },
            [content],
          );
        }
        const input = isReadOnly.value
          ? String(inputValue.value)
          : h('input', {
              type: 'text',
              'aria-label': mergedLocale.value.jump_to,
              value: inputValue.value,
              disabled: props.disabled,
              size: 3,
              onKeydown: handleSimpleKeyDown,
              onKeyup: handleSimpleKeyUp,
              onChange: handleSimpleKeyUp,
              onBlur: handleSimpleBlur,
            });
        return [
          h(
            'li',
            {
              title: props.showTitle ? `${mergedCurrent.value}/${allPages.value}` : undefined,
              class: [`${p}-simple-pager`, classNames.item].filter(Boolean).join(' '),
              style: styles.item,
            },
            [input, h('span', { class: `${p}-slash` }, '/'), String(allPages.value)],
          ),
          gotoButton,
        ];
      })();

      // ---- 上一页 / 下一页 ----
      // rc：`itemRender(prevPage, 'prev', getItemIcon(prevIcon, 'prev page'))`，再把结果 clone 上 disabled。
      const renderPrevNext = (which: 'prev' | 'next') => {
        const isPrev = which === 'prev';
        const page = isPrev ? jumpPages.value.prev : jumpPages.value.next;
        const icon = isPrev ? icons.value.prevIcon : icons.value.nextIcon;
        const content = itemRenderer.value
          ? (itemRenderer.value(page, isPrev ? 'prev' : 'next', icon) ?? icon)
          : icon;

        const disabledFlag = isPrev
          ? !hasPrev.value || !allPages.value
          : props.simple
            ? !hasNext.value
            : !hasNext.value || !allPages.value;

        // ⚠️ tabIndex 的两套判据（rc 逐字）：
        //    简化模式下 next 用 **hasPrev**（不是 hasNext）；非简化模式用「!disabled」。
        let tabIndex: number | undefined;
        if (props.simple) {
          tabIndex = isPrev ? (hasPrev.value ? 0 : undefined) : hasPrev.value ? 0 : undefined;
        } else {
          tabIndex = disabledFlag ? undefined : 0;
        }

        const activate = (): void =>
          changeCurrent(isPrev ? mergedCurrent.value - 1 : mergedCurrent.value + 1);

        return h(
          'li',
          {
            title: props.showTitle
              ? isPrev
                ? mergedLocale.value.prev_page
                : mergedLocale.value.next_page
              : undefined,
            class: [`${p}-${which}`, classNames.item, disabledFlag ? `${p}-disabled` : '']
              .filter(Boolean)
              .join(' '),
            style: styles.item,
            tabIndex,
            'aria-disabled': disabledFlag,
            onClick: activate,
            onKeydown: (e: KeyboardEvent) => runIfEnter(e, activate),
          },
          [content],
        );
      };

      const items: unknown[] = [totalText];

      if (props.simple) {
        items.push(...(simplePager ?? []));
      } else {
        items.push(renderPrevNext('prev'));
        for (const item of pagerList.value) {
          if (item.kind === 'page') {
            items.push(
              h(Pager, {
                key: `page-${item.page}`,
                rootPrefixCls: p,
                page: item.page,
                active: item.active,
                itemClassName: classNames.item,
                itemStyle: styles.item,
                extraClass: item.extraClass,
                showTitle: props.showTitle,
                itemRender: itemRenderer.value as never,
                onClick: (page: number) => changeCurrent(page),
                onKeydown: runIfEnter as never,
              }),
            );
          } else {
            const isPrev = item.kind === 'jump-prev';
            const icon = isPrev ? icons.value.jumpPrevIcon : icons.value.jumpNextIcon;
            items.push(
              h(
                'li',
                {
                  key: item.kind,
                  title: props.showTitle
                    ? isPrev
                      ? props.showLessItems
                        ? mergedLocale.value.prev_3
                        : mergedLocale.value.prev_5
                      : props.showLessItems
                        ? mergedLocale.value.next_3
                        : mergedLocale.value.next_5
                    : undefined,
                  class: [
                    `${p}-${item.kind}`,
                    isPrev ? `${p}-jump-prev-custom-icon` : `${p}-jump-next-custom-icon`,
                  ].join(' '),
                  tabIndex: 0,
                  onClick: () => changeCurrent(item.page),
                  onKeydown: (e: KeyboardEvent) => runIfEnter(e, () => changeCurrent(item.page)),
                },
                [icon],
              ),
            );
          }
        }
        items.push(renderPrevNext('next'));
      }

      items.push(
        h(
          Options as never,
          {
            rootPrefixCls: p,
            locale: mergedLocale.value,
            pageSize: mergedPageSize.value,
            pageSizeOptions: props.pageSizeOptions,
            disabled: props.disabled,
            showSizeChanger: mergedShowSizeChanger.value,
            quickGo: shouldDisplayQuickJumper.value
              ? (page: number) => changeCurrent(page)
              : undefined,
            goButton: goButton.value,
            sizeChangerRender: sizeChangerRender.value,
            onChangeSize: changePageSize,
          } as never,
        ),
      );

      const rootClassName = [
        p,
        props.className,
        config.className,
        props.rootClassName,
        classNames.root,
        props.align ? `${p}-${props.align}` : '',
        mergedSize.value ? `${p}-${mergedSize.value}` : '',
        enableVariantCls.value && inputVariant.value !== 'outlined'
          ? `${p}-${inputVariant.value}`
          : '',
        isSmall.value ? `${p}-mini` : '',
        direction.value === 'rtl' ? `${p}-rtl` : '',
        props.simple ? `${p}-simple` : '',
        props.disabled ? `${p}-disabled` : '',
      ]
        .filter(Boolean)
        .join(' ');

      return h(
        'ul',
        {
          ...passthrough,
          class: rootClassName,
          style: { ...styles.root },
          role: props.role,
        },
        items,
      );
    };
  },
});
</script>
