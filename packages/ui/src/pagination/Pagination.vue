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
 * props↔ConfigProvider **`??` 合并**、默认尺寸切换器（渲染成本仓 Select）、
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
 *   - Native root attrs/events and Vue string/object/array styles are forwarded to ul;
 *   - 本组件没有公开 expose 方法，根元素使用 Vue 实例的 `$el`。
 */

import {
  DoubleLeftOutlined,
  DoubleRightOutlined,
  EllipsisOutlined,
  LeftOutlined,
  RightOutlined,
} from '@apollo-design/icons';
import { useLocale } from '@apollo-design/locale';
import { mergeDomAttrs } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  normalizeStyle,
  type PropType,
  ref,
  type SlotsType,
  useAttrs,
  type VNodeChild,
  watch,
} from 'vue';
import { semanticRootStyle, useMergeSemantic } from '../_internal/use-merge-semantic';
import {
  type ComponentStyleConfig,
  useComponentConfig,
  useDirection,
} from '../config-provider/context';
import { useSize } from '../config-provider/size-context';
import { useVariant } from '../form/hooks/useVariants';
import { useBreakpoint } from '../grid/hooks/use-breakpoint';
import Select from '../select';
import { calculatePage, getPagerList } from './getPagerList';
import type {
  PaginationLocale,
  PaginationProps,
  PaginationRange,
  PaginationSemanticClassNames,
  PaginationSemanticStyles,
  PaginationSizeChangerInfo,
  PaginationSlots,
} from './interface';
import Options from './Options';
import Pager from './Pager';
import { usePaginationTheme } from './use-pagination-theme';
import { useShowSizeChanger } from './useShowSizeChanger';

const contentSlots: SlotsType<PaginationSlots> = {};

export default defineComponent({
  name: 'APagination',
  inheritAttrs: false,
  slots: contentSlots,
  props: {
    prefixCls: { type: String, default: undefined },
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
    role: { type: String, default: undefined },
    classNames: {
      type: [Object, Function] as PropType<PaginationProps['classNames']>,
      default: undefined,
    },
    styles: {
      type: [Object, Function] as PropType<PaginationProps['styles']>,
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
    const config = useComponentConfig<
      ComponentStyleConfig &
        Pick<
          PaginationProps,
          'classNames' | 'styles' | 'showSizeChanger' | 'totalBoundaryShowSizeChanger'
        >
    >('pagination');
    const direction = useDirection();
    const prefixCls = computed(() => config.getPrefixCls('pagination', props.prefixCls));
    const themeStyle = usePaginationTheme(() => prefixCls.value);

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
      ],
      props,
    );

    // ---- locale：rc enUS → ConfigProvider → props.locale（props 最优先）----
    const [contextLocale] = useLocale('Pagination');
    const mergedLocale = computed<PaginationLocale>(() => ({
      ...contextLocale.value,
      ...(props.locale ?? {}),
    }));

    // ---- size / variant / responsive ----
    // ⚠️ 必须用**函数形态**：`useSize(props.size)` / `toRef(...)` 都**非响应式**
    //    （本仓 PITFALLS 163 / CHECKLIST #46，input-number / radio / switch 各踩过一次）
    const mergedSize = useSize((ctx) => props.size ?? ctx);
    // ⚠️ 本仓的 `useBreakpoint` 返回 `Ref<Screens | null>`（antd 返回 screens 对象本体）
    // 🚨 取值函数（不是裸布尔）：后者会被订阅闭包捕获一次 ⇒ 永不随 props 变化（VNA-AVATAR-01 同族）
    const screens = useBreakpoint(() => !!props.responsive);
    const isSmall = computed(
      () =>
        mergedSize.value === 'small' ||
        !!(screens.value?.xs && !mergedSize.value && props.responsive),
    );
    // ⚠️ 本仓的 `useVariant` 收**选项对象**、返回 `{ variant, enableVariantCls }`（antd 是位置参数 + 元组）
    const { variant: inputVariant, enableVariantCls } = useVariant({ component: 'pagination' });

    // ---- 状态：pageSize / current（受控 + 内部）----
    const innerPageSize = ref(props.pageSize ?? props.defaultPageSize);
    watch(
      () => props.pageSize,
      (pageSize) => {
        if (pageSize !== undefined) innerPageSize.value = pageSize;
      },
      { flush: 'sync' },
    );
    const mergedPageSize = computed(() => props.pageSize ?? innerPageSize.value);
    const innerCurrent = ref(props.current ?? props.defaultCurrent);

    const allPages = computed(() => calculatePage(mergedPageSize.value, props.total ?? 0));
    watch(
      [() => props.current, allPages],
      ([current, pages]) => {
        innerCurrent.value = Math.max(1, Math.min(current ?? innerCurrent.value, pages));
      },
      { immediate: true, flush: 'sync' },
    );
    const mergedCurrent = computed(() =>
      Math.max(1, Math.min(props.current ?? innerCurrent.value, allPages.value)),
    );
    /** 简化模式输入草稿与实际 current 分开，提交后以模型状态为准。 */
    const inputValue = ref<number | ''>(mergedCurrent.value);
    watch(mergedCurrent, (next) => {
      inputValue.value = next;
    });

    const hasPrev = computed(() => mergedCurrent.value > 1);
    const hasNext = computed(() => mergedCurrent.value < allPages.value);

    // ---- 尺寸切换器（props ↔ ConfigProvider 的 ?? 合并）----
    // ⚠️ `useShowSizeChanger` 是**纯函数**：在 setup 里调用一次 = 快照 ⇒ props / ConfigProvider
    //    后续 false→true→对象→false 的变化都不参与重算（Issue #18）。两路归一必须放进 computed。
    const propSizeChanger = computed(() => useShowSizeChanger(props.showSizeChanger));
    const configSizeChanger = computed(() => useShowSizeChanger(config.showSizeChanger));
    const mergedShowSizeChanger = computed(
      () =>
        propSizeChanger.value[0] ??
        configSizeChanger.value[0] ??
        (props.total ?? 0) >
          (props.totalBoundaryShowSizeChanger ?? config.totalBoundaryShowSizeChanger ?? 50),
    );
    const mergedSizeChangerSelectProps = computed(
      () => propSizeChanger.value[1] ?? configSizeChanger.value[1],
    );

    // ---- 变化入口 ----
    const changeCurrent = (page: number): number => {
      if (
        props.disabled ||
        !Number.isInteger(page) ||
        !Number.isInteger(props.total) ||
        props.total <= 0
      ) {
        return mergedCurrent.value;
      }
      const newPage = Math.max(1, Math.min(page, allPages.value));
      if (newPage === mergedCurrent.value) return mergedCurrent.value;
      if (props.current === undefined) innerCurrent.value = newPage;
      inputValue.value = mergedCurrent.value;
      emit('update:current', newPage);
      emit('change', newPage, mergedPageSize.value);
      return newPage;
    };

    const changePageSize = (size: number): void => {
      if (props.disabled || !Number.isInteger(size) || size <= 0 || size === mergedPageSize.value) {
        return;
      }
      // 🚨 **必须在改 pageSize 之前**把当前页取出来：Vue 的 `computed` 是惰性求值，
      //    一旦 `innerPageSize` 变了，`mergedCurrent`（= clamp(current, 1, allPages)）
      //    会**立刻**按新的 allPages 重新钳制 —— 直接在下面 emit `mergedCurrent.value`
      //    会把 `showSizeChange` 的 current 报成**已经回退后的新页**（rc 报的是旧页）。
      //    （React 那边 `current` 是本次渲染的常量，所以 rc 怎么写都对。）
      const previousCurrent = mergedCurrent.value;
      const newCurrent = calculatePage(size, props.total ?? 0);
      const nextCurrent =
        previousCurrent > newCurrent && newCurrent !== 0 ? newCurrent : previousCurrent;
      if (props.pageSize === undefined) innerPageSize.value = size;
      if (props.current === undefined) innerCurrent.value = nextCurrent;
      inputValue.value = mergedCurrent.value;
      emit('update:pageSize', size);
      emit('showSizeChange', previousCurrent, size);
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
    const hasGoButton = computed(
      () => goButton.value !== undefined && goButton.value !== null && goButton.value !== false,
    );

    const getValidInputValue = (e: Event): number | '' => {
      const raw = (e.target as HTMLInputElement).value;
      const pages = allPages.value;
      if (raw === '') return '';
      if (Number.isNaN(Number(raw))) return inputValue.value;
      if (Number(raw) >= pages) return pages;
      return Number(raw);
    };

    const handleSimpleKeyDown = (e: KeyboardEvent): void => {
      // 防止上下键把光标移到文本开头（rc 附的 stackoverflow 链接）
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.keyCode === 38 || e.keyCode === 40) {
        e.preventDefault();
      }
    };
    const commitSimpleValue = (value: number | ''): void => {
      if (value !== '') changeCurrent(value);
      inputValue.value = mergedCurrent.value;
    };
    const handleSimpleInput = (e: Event): void => {
      inputValue.value = getValidInputValue(e);
      // 状态未变时 Vue 不会 patch value，仍需恢复被拒绝的原生输入。
      (e.target as HTMLInputElement).value = String(inputValue.value);
    };
    const handleSimpleKeyUp = (e: KeyboardEvent): void => {
      const value = getValidInputValue(e);
      inputValue.value = value;
      if (e.key === 'Enter' || e.keyCode === 13) {
        commitSimpleValue(value);
      } else if (value !== '' && (e.key === 'ArrowUp' || e.keyCode === 38)) {
        commitSimpleValue(value - 1);
      } else if (value !== '' && (e.key === 'ArrowDown' || e.keyCode === 40)) {
        commitSimpleValue(value + 1);
      }
    };
    const handleSimpleBlur = (e: FocusEvent): void => {
      commitSimpleValue(getValidInputValue(e));
    };

    // ---- 键盘：仅 Enter 触发 ----
    const runIfEnter = (event: KeyboardEvent, callback: () => void): void => {
      if (event.defaultPrevented) return;
      if (event.key === 'Enter' || event.charCode === 13 || event.keyCode === 13) {
        event.preventDefault();
        callback();
      }
    };

    // ---- 图标（RTL 下左右互换；jump 图标按 direction 选双箭头）----
    const icons = computed(() => {
      const p = prefixCls.value;
      const isRTL = direction.value === 'rtl';
      const ellipsis = h('span', { class: `${p}-item-ellipsis` }, [h(EllipsisOutlined)]);
      return {
        ellipsis,
        prevIcon: h(
          'button',
          {
            class: `${p}-item-link`,
            type: 'button',
            tabIndex: -1,
            disabled: props.disabled || !hasPrev.value,
          },
          [isRTL ? h(RightOutlined) : h(LeftOutlined)],
        ),
        nextIcon: h(
          'button',
          {
            class: `${p}-item-link`,
            type: 'button',
            tabIndex: -1,
            disabled: props.disabled || !hasNext.value,
          },
          [isRTL ? h(LeftOutlined) : h(RightOutlined)],
        ),
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

    // Default Select renderer; caller content travels through native slots.
    const renderDefaultSizeChanger = (info: PaginationSizeChangerInfo) => {
      const selectProps = mergedSizeChangerSelectProps.value ?? {};
      const p = prefixCls.value;
      const selectedValue =
        info.options.find((option) => String(option.value) === String(info.value))?.value ??
        info.value;
      return h(Select, {
        ...selectProps,
        disabled: info.disabled,
        showSearch: true,
        popupMatchSelectWidth: false,
        getPopupContainer: (triggerNode: HTMLElement) => triggerNode.parentNode as HTMLElement,
        'aria-label': info['aria-label'],
        options: info.options,
        value: selectedValue,
        size: mergedSize.value === 'default' ? 'middle' : (mergedSize.value ?? 'middle'),
        // ✅ Select 已迁移到「根 class 走原生 attrs」⇒ 这里用 `class`
        class: [`${p}-options-size-changer-select`, info.className, selectProps.class],
        onChange: (next: unknown) => info.onSizeChange(Number(next)),
      });
    };

    return () => {
      const p = prefixCls.value;
      // ⚠️ `hideOnSinglePage && total <= pageSize` ⇒ 整体不渲染（rc 逐字）
      if (props.hideOnSinglePage && (props.total ?? 0) <= mergedPageSize.value) {
        return null;
      }

      const classNames = mergedSemantic.classNames.value;
      const styles = mergedSemantic.styles.value;

      const { class: _rootClass, style: rootStyle, ...rootAttrs } = attrs;
      const mergedRootStyle = normalizeStyle([themeStyle.value, styles.root, rootStyle]);

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
          return h('li', { class: `${p}-total-text` }, [slots.total({ total, range })]);
        }
        return null;
      })();

      // ---- 简化模式 ----
      const simplePager = (() => {
        if (!props.simple) return null;
        let gotoButton: VNodeChild = null;
        if (hasGoButton.value) {
          const content =
            goButton.value === true
              ? h(
                  'button',
                  {
                    type: 'button',
                    disabled: props.disabled,
                    onClick: () => commitSimpleValue(inputValue.value),
                  },
                  mergedLocale.value.jump_to_confirm,
                )
              : h('span', { onClick: () => commitSimpleValue(inputValue.value) }, [goButton.value]);
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
              onInput: handleSimpleInput,
              onChange: handleSimpleInput,
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
        const content = slots.itemRender
          ? slots.itemRender({ page, type: isPrev ? 'prev' : 'next', element: icon })
          : icon;

        const disabledFlag = isPrev
          ? !hasPrev.value || !allPages.value
          : props.simple
            ? !hasNext.value
            : !hasNext.value || !allPages.value;

        const disabled = props.disabled || disabledFlag;

        // 相邻页只在该方向确实还有页码时请求更新。
        const activate = (): void => {
          if (isPrev ? !hasPrev.value : !hasNext.value) return;
          changeCurrent(isPrev ? mergedCurrent.value - 1 : mergedCurrent.value + 1);
        };

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
            tabIndex: disabled ? undefined : 0,
            'aria-disabled': disabled,
            onClick: activate,
            onKeydown: (e: KeyboardEvent) => runIfEnter(e, activate),
          },
          [content],
        );
      };

      // ⚠️ 必须是 `VNodeChild[]`（`unknown[]` 不被 `h` 的 children 接受 —— 构建门禁的
      //    vue-tsc 步骤会报 TS2769；vitest 不做这层检查，所以只有 `build:ui` 能发现）
      const items: VNodeChild[] = [totalText];

      // ⚠️ rc 的结构是 `<ul>{totalText}{prev}{simple ? simplePager : pagerList}{next}{Options}</ul>`
      //    —— **prev/next 在两种模式下都渲染**（原来把它们放进 `else` 里 ⇒ simple 模式少两个 li，
      //    L4 的子节点数对拍直接抓到）。
      items.push(renderPrevNext('prev'));
      if (props.simple) {
        items.push(...(simplePager ?? []));
      } else {
        for (const item of pagerList.value) {
          if (item.kind === 'page') {
            items.push(
              h(
                Pager,
                {
                  key: `page-${item.page}`,
                  rootPrefixCls: p,
                  page: item.page,
                  active: item.active,
                  disabled: props.disabled || item.disabled,
                  itemClassName: classNames.item,
                  itemStyle: styles.item,
                  // ⚠️ 三选一：`allPages === 0` 的占位项（`-item-disabled`，rc 由外层传入）
                  //    或跳页项相邻的补类
                  extraClass: item.disabled ? 'item-disabled' : item.extraClass,
                  showTitle: props.showTitle,
                  onSelect: changeCurrent,
                },
                slots.itemRender ? { default: slots.itemRender } : {},
              ),
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
                    classNames.item,
                  ]
                    .filter(Boolean)
                    .join(' '),
                  style: styles.item,
                  tabIndex: props.disabled ? undefined : 0,
                  'aria-disabled': props.disabled || undefined,
                  onClick: () => changeCurrent(item.page),
                  onKeydown: (e: KeyboardEvent) => runIfEnter(e, () => changeCurrent(item.page)),
                },
                [
                  slots.itemRender
                    ? slots.itemRender({ page: item.page, type: item.kind, element: icon })
                    : icon,
                ],
              ),
            );
          }
        }
      }
      items.push(renderPrevNext('next'));

      items.push(
        h(
          Options,
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
            onChangeSize: changePageSize,
          },
          { sizeChanger: slots.sizeChanger ?? renderDefaultSizeChanger },
        ),
      );

      const rootClassName = [
        p,
        // 调用方原生 class（位置与原先的 props.className 一致）
        attrs.class,
        config.className,
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
          ...mergeDomAttrs(rootAttrs),
          class: rootClassName,
          // 根 style 是 Vue 原生 attrs（位置与原先的 props.style 一致：最后胜出）
          style: mergedRootStyle,
          role: props.role,
        },
        items,
      );
    };
  },
});
</script>
