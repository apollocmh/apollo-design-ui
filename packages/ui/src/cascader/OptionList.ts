/**
 * OptionList —— rc-cascader `OptionList/`（List 216 + Column 198 + Checkbox 23 +
 * useActive 23 + useKeyboard 164）的 Vue 版。
 *
 * 结构：RawOptionList（`-menus` 容器）→ Column×N（每级一个 `ul.-menu`）→
 * `li.-menu-item`。列由 `activeValueCells` 逐级下钻；搜索态下第一列被
 * `searchOptions` 替换（每项是拍平的完整路径）。
 *
 * ── 关键判据（实现时对照 rc 源）─────────────────────────────────────────────
 *
 * 1. **搜索项的 fullPath 来自 `SEARCH_MARK`**，非搜索项是 `[...prevValuePath, value]`。
 * 2. **hover 展开时叶子不进 active**（`nextValueCells.pop()`）。
 * 3. **click 选中**：`!multiple || isLeaf` 才触发 onSelect（多选父级靠 checkbox）；
 *    `disableCheckbox` 阻断选中但仍展开。
 * 4. **双击 + changeOnSelect ⇒ 关闭**。
 * 5. **键盘**：UP/DOWN 同列环绕（跳过 disabled）；LEFT/BACKSPACE 回上一列（首列则关）；
 *    RIGHT 进下一列首个可用项；ENTER 选中（搜索项回溯 SEARCH_MARK 原始路径）；ESC 关。
 * 6. **空态**：`-menu-empty` + 一条 `__EMPTY__` 禁用项（label = notFoundContent）。
 * 7. 激活项自动 `scrollIntoParentView`。
 */

import {
  computed,
  defineComponent,
  h,
  nextTick,
  onMounted,
  type PropType,
  ref,
  shallowRef,
  toRaw,
  type VNodeChild,
  watch,
} from 'vue';
import { clsx } from '../_internal/clsx';
import { useCascaderContext } from './context';
import {
  type BaseOptionType,
  getFullPathKeys,
  isLeaf,
  SEARCH_MARK,
  scrollIntoParentView,
  toPathKey,
  toPathKeys,
  type ValueCell,
} from './utils';

/** 空态列的 label 挂载键（rc 的 FIX_LABEL）。 */
export const FIX_LABEL = '__cascader_fix_label__';

const KeyCode = { UP: 38, DOWN: 40, LEFT: 37, RIGHT: 39, ENTER: 13, ESC: 27, BACKSPACE: 8 };

// ⚠️ 这里原先有一份本地 clsx（字符串 + `{[k]: boolean}` 对象形态）—— 2026-10-07 删除，
//    改用共享层的 `_internal/clsx.ts`（行为在本文件的输入空间下完全一致，见 useDrag.ts 的注释）。

// ================================ Checkbox ================================

const Checkbox = defineComponent({
  name: 'ACascaderCheckbox',
  props: {
    prefixCls: { type: String, required: true },
    checked: { type: Boolean, default: false },
    halfChecked: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    disableCheckbox: { type: Boolean, default: false },
  },
  emits: ['click'],
  setup(props, { emit }) {
    const { checkable } = useCascaderContext();
    const customCheckbox =
      typeof checkable !== 'boolean' && checkable !== undefined ? (checkable as VNodeChild) : null;
    return () =>
      h(
        'span',
        {
          class: clsx(props.prefixCls, {
            [`${props.prefixCls}-checked`]: props.checked,
            [`${props.prefixCls}-indeterminate`]: !props.checked && props.halfChecked,
            [`${props.prefixCls}-disabled`]: props.disabled || props.disableCheckbox,
          }),
          onClick: (e: MouseEvent) => emit('click', e),
        },
        customCheckbox ?? undefined,
      );
  },
});

// ================================ OptionList ===============================

const RawOptionList = defineComponent({
  name: 'ACascaderOptionList',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    multiple: { type: Boolean, default: false },
    searchValue: { type: String, default: '' },
    open: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: undefined },
    direction: { type: String as PropType<'ltr' | 'rtl'>, default: 'ltr' },
    lockOptions: { type: Boolean, default: false },
    notFoundContent: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    toggleOpen: { type: Function as PropType<(open: boolean) => void>, required: true },
  },
  setup(props, { expose }) {
    const ctx = useCascaderContext();

    /**
     * ⚠️ **不能在 setup 顶部解构 context**：Panel 的 context 是 Proxy 桥（每次
     * 读取取 computed 最新值），解构会把初值**冻结**——options 变化后 OptionList
     * 仍渲染旧数据（S3 的 loadData 用例抓出）。必须在每次渲染 / 事件处理时
     * 重新解构 `getC()`。
     */
    const getC = () => ctx;
    const mergedPrefixCls = computed(() => getC().popupPrefixCls || props.prefixCls);
    const rtl = computed(() => props.direction === 'rtl');
    const hoverOpen = computed(() => getC().expandTrigger === 'hover');

    const containerRef = shallowRef<HTMLElement | null>(null);

    // ========================= loadData =========================
    const loadingKeys = ref<string[]>([]);
    const internalLoadData = (valueCells: ValueCell): void => {
      const { loadData, fieldNames } = getC();
      if (!loadData || props.searchValue) return;
      const pathOptions = toPathOptionsLocal(valueCells);
      const lastOption = pathOptions[pathOptions.length - 1]?.option;
      if (lastOption && !isLeaf(lastOption, fieldNames)) {
        const pathKey = toPathKey(valueCells);
        if (!loadingKeys.value.includes(pathKey)) {
          loadingKeys.value = [...loadingKeys.value, pathKey];
        }
        loadData(pathOptions.map(({ option }) => option as BaseOptionType));
      }
    };

    /** 本地 toPathOptions（沿 options 逐层找；stringMode 用于 loadingKeys 回查）。 */
    function toPathOptionsLocal(valueCells: ValueCell, stringMode = false) {
      const { fieldNames } = getC();
      let currentList: BaseOptionType[] | undefined = getC().options;
      const valueOptions: { value: unknown; option: BaseOptionType | null }[] = [];
      for (let i = 0; i < valueCells.length; i += 1) {
        const cell = valueCells[i];
        const foundIndex = currentList?.findIndex((option) => {
          const val = option[fieldNames.value];
          return stringMode ? String(val) === String(cell) : val === cell;
        });
        const foundOption =
          foundIndex !== undefined && foundIndex !== -1
            ? (currentList?.[foundIndex] ?? null)
            : null;
        valueOptions.push({ value: foundOption?.[fieldNames.value] ?? cell, option: foundOption });
        currentList = foundOption?.[fieldNames.children] as BaseOptionType[] | undefined;
      }
      return valueOptions;
    }

    // options 变化后清理已加载完的 loading keys（rc 的 useEffect 依赖
    // [options, loadingKeys, fieldNames] —— React 里 setState 相同值会 bail out，
    // ⚠️ Vue 不会：watch 依赖 loadingKeys 又修改它 = 递归自触发（Maximum recursive
    // updates）。这里只依赖 options（语义等价：清理发生在「数据可能已补上」的时刻）。
    watch(
      () => getC().options,
      () => {
        if (!loadingKeys.value.length) return;
        const { fieldNames } = getC();
        loadingKeys.value = loadingKeys.value.filter((key) => {
          const valueStrCells = key.split('__RC_CASCADER_SPLIT__');
          const optionList = toPathOptionsLocal(valueStrCells, true).map(({ option }) => option);
          const lastOption = optionList[optionList.length - 1];
          return !(
            !lastOption ||
            lastOption[fieldNames.children] ||
            isLeaf(lastOption, fieldNames)
          );
        });
      },
    );

    // ========================== Values ==========================
    const checkedSet = computed(() => new Set(toPathKeys(getC().values)));
    const halfCheckedSet = computed(() => new Set(toPathKeys(getC().halfValues)));

    // ====================== Accessibility =======================
    // useActive：单选时 open/values 变化 ⇒ 重置 active 为当前值路径
    const activeValueCells = ref<ValueCell>([]);
    watch(
      [() => props.open, () => getC().values[0]],
      () => {
        if (!props.multiple) {
          activeValueCells.value = (getC().values[0] ?? []) as ValueCell;
        }
      },
      { immediate: true },
    );

    // =========================== Path ===========================
    const onPathOpen = (nextValueCells: ValueCell): void => {
      activeValueCells.value = nextValueCells;
      internalLoadData(nextValueCells);
    };
    const isSelectable = (option: BaseOptionType): boolean => {
      if (props.disabled) return false;
      const { fieldNames, changeOnSelect } = getC();
      const optionDisabled = option.disabled;
      return !optionDisabled && (isLeaf(option, fieldNames) || changeOnSelect || props.multiple);
    };
    const onPathSelect = (valuePath: ValueCell, leaf: boolean, fromKeyboard = false): void => {
      const { onSelect, changeOnSelect } = getC();
      onSelect(valuePath);
      if (!props.multiple && (leaf || (changeOnSelect && (hoverOpen.value || fromKeyboard)))) {
        props.toggleOpen(false);
      }
    };

    // ========================== Option ==========================
    const filteredOptions = computed<BaseOptionType[]>(() =>
      props.searchValue ? getC().searchOptions : getC().options,
    );

    // ========================== Columns =========================
    interface ColumnDef {
      options: BaseOptionType[];
    }
    const optionColumns = computed<ColumnDef[]>(() => {
      const { fieldNames } = getC();
      const optionList: ColumnDef[] = [{ options: filteredOptions.value }];
      let currentList = filteredOptions.value;
      const fullPathKeys = getFullPathKeys(currentList, fieldNames);
      for (let i = 0; i < activeValueCells.value.length; i += 1) {
        const activeValueCell = activeValueCells.value[i];
        const currentOption = currentList.find((option, index) => {
          const matchKey = fullPathKeys[index]
            ? toPathKey(fullPathKeys[index] as (string | number)[])
            : (option[fieldNames.value] as string | number);
          return matchKey === activeValueCell;
        });
        const subOptions = currentOption?.[fieldNames.children] as BaseOptionType[] | undefined;
        if (!subOptions?.length) break;
        currentList = subOptions;
        optionList.push({ options: subOptions });
      }
      return optionList;
    });

    // ========================= Keyboard =========================
    const onKeyboardSelect = (selectValueCells: ValueCell, option: BaseOptionType): void => {
      const { fieldNames } = getC();
      if (isSelectable(option)) {
        onPathSelect(selectValueCells, isLeaf(option, fieldNames), true);
      }
    };

    // useKeyboard 的主体（直接内联，ref expose onKeyDown）
    const computeValidActive = () => {
      const { fieldNames } = getC();
      let activeIndex = -1;
      let currentOptions = filteredOptions.value;
      const mergedActiveIndexes: number[] = [];
      const mergedActiveValueCells: ValueCell = [];
      const pathKeys = getFullPathKeys(filteredOptions.value, fieldNames);

      for (let i = 0; i < activeValueCells.value.length && currentOptions; i += 1) {
        const activeCell = activeValueCells.value[i] as string | number;
        const nextActiveIndex = currentOptions.findIndex((option, index) => {
          const matchKey = pathKeys[index]
            ? toPathKey(pathKeys[index] as (string | number)[])
            : (option[fieldNames.value] as string | number);
          return matchKey === activeCell;
        });
        if (nextActiveIndex === -1) break;
        activeIndex = nextActiveIndex;
        mergedActiveIndexes.push(activeIndex);
        mergedActiveValueCells.push(activeCell);
        currentOptions = (currentOptions[activeIndex]?.[fieldNames.children] ??
          []) as BaseOptionType[];
      }

      let activeOptions = filteredOptions.value;
      for (let i = 0; i < mergedActiveIndexes.length - 1; i += 1) {
        const idx = mergedActiveIndexes[i] as number;
        const next = activeOptions[idx] as BaseOptionType | undefined;
        activeOptions = (next?.[fieldNames.children] ?? []) as BaseOptionType[];
      }
      return {
        mergedActiveValueCells,
        activeIndex,
        activeOptions,
        pathKeys,
      };
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      const { mergedActiveValueCells, activeIndex, activeOptions, pathKeys } = computeValidActive();
      const len = activeOptions.length;
      const currentIndex = activeIndex;

      const setActive = (next: ValueCell) => {
        activeValueCells.value = next;
      };

      // 同列环绕（跳过 disabled）
      const offsetActiveOption = (offset: number): void => {
        let index = activeIndex;
        if (index === -1 && offset < 0) index = len;
        for (let i = 0; i < len; i += 1) {
          index = (index + offset + len) % len;
          const option = activeOptions[index];
          if (option && !option.disabled) {
            const nextActiveCells = mergedActiveValueCells
              .slice(0, -1)
              .concat(
                pathKeys[index]
                  ? toPathKey(pathKeys[index] as (string | number)[])
                  : (option[fieldNames.value] as string | number),
              );
            setActive(nextActiveCells);
            return;
          }
        }
      };

      const { fieldNames } = getC();

      const prevColumn = (): void => {
        if (mergedActiveValueCells.length > 1) {
          setActive(mergedActiveValueCells.slice(0, -1));
        } else {
          props.toggleOpen(false);
        }
      };
      const nextColumn = (): void => {
        const nextOptions = (activeOptions[activeIndex]?.[fieldNames.children] ??
          []) as BaseOptionType[];
        const nextOption = nextOptions.find((option) => !option.disabled);
        if (nextOption) {
          setActive([...mergedActiveValueCells, nextOption[fieldNames.value] as string | number]);
        }
      };

      switch (event.which) {
        case KeyCode.UP:
        case KeyCode.DOWN: {
          const offset = event.which === KeyCode.UP ? -1 : event.which === KeyCode.DOWN ? 1 : 0;
          if (offset !== 0) offsetActiveOption(offset);
          break;
        }
        case KeyCode.LEFT:
          if (!props.searchValue) {
            if (rtl.value) nextColumn();
            else prevColumn();
          }
          break;
        case KeyCode.RIGHT:
          if (!props.searchValue) {
            if (rtl.value) prevColumn();
            else nextColumn();
          }
          break;
        case KeyCode.BACKSPACE:
          if (!props.searchValue) prevColumn();
          break;
        case KeyCode.ENTER: {
          if (mergedActiveValueCells.length) {
            const option = activeOptions[activeIndex] as BaseOptionType | undefined;
            // 搜索项回溯 SEARCH_MARK 的原始路径
            const originOptions = (option?.[SEARCH_MARK] ?? []) as BaseOptionType[];
            if (originOptions.length) {
              onKeyboardSelect(
                originOptions.map((opt) => opt[fieldNames.value] as string | number),
                (originOptions[originOptions.length - 1] ?? {}) as BaseOptionType,
              );
            } else {
              onKeyboardSelect(mergedActiveValueCells, (option ?? {}) as BaseOptionType);
            }
          }
          break;
        }
        case KeyCode.ESC:
          props.toggleOpen(false);
          if (props.open) event.stopPropagation();
          break;
        default:
          break;
      }
      void currentIndex;
    };

    expose({ onKeyDown, onKeyUp: () => {} });

    // >>>>> Active Scroll
    watch(
      [activeValueCells, () => props.searchValue],
      async () => {
        if (props.searchValue) return;
        await nextTick();
        for (let i = 0; i < activeValueCells.value.length; i += 1) {
          const cellPath = activeValueCells.value.slice(0, i + 1);
          const cellKeyPath = toPathKey(cellPath);
          const ele = containerRef.value?.querySelector(
            `li[data-path-key="${cellKeyPath.replace(/\\{0,2}"/g, '\\"')}"]`,
          );
          if (ele) scrollIntoParentView(ele as HTMLElement);
        }
      },
      { flush: 'post' },
    );

    // ========================== Render ==========================
    const isEmpty = computed(() => !(optionColumns.value[0]?.options?.length ?? false));
    const emptyList = computed<BaseOptionType[]>(() => [
      {
        [getC().fieldNames.value]: '__EMPTY__',
        [FIX_LABEL]: props.notFoundContent,
        disabled: true,
      } as BaseOptionType,
    ]);

    /** Column 内单项渲染（rc 的 Column 组件体，内联为函数）。 */
    const renderColumn = (
      colOptions: BaseOptionType[],
      prevValuePath: ValueCell,
      activeValue: string | number | undefined,
      listIndex: number,
    ): VNodeChild => {
      const {
        fieldNames,
        changeOnSelect,
        expandIcon,
        loadingIcon,
        popupMenuColumnStyle,
        optionRender,
        classNames,
        styles,
      } = getC();
      const menuPrefixCls = `${mergedPrefixCls.value}-menu`;
      const menuItemPrefixCls = `${mergedPrefixCls.value}-menu-item`;

      const isOptionDisabled = (disabled?: boolean): boolean => props.disabled || !!disabled;

      const optionInfoList = colOptions.map((option) => {
        const { disabled, disableCheckbox } = option as {
          disabled?: boolean;
          disableCheckbox?: boolean;
        };
        const searchMarks = option[SEARCH_MARK] as BaseOptionType[] | undefined;
        const label = option[FIX_LABEL] ?? option[fieldNames.label];
        const value = option[fieldNames.value] as string | number;
        const isMergedLeaf = isLeaf(option, fieldNames);

        const fullPath: ValueCell = searchMarks
          ? searchMarks.map((opt) => opt[fieldNames.value] as string | number)
          : [...prevValuePath, value];
        const fullPathKey = toPathKey(fullPath);
        const isLoading = loadingKeys.value.includes(fullPathKey);

        return {
          disabled,
          disableCheckbox,
          label,
          value,
          isLeaf: isMergedLeaf,
          isLoading,
          checked: checkedSet.value.has(fullPathKey),
          halfChecked: halfCheckedSet.value.has(fullPathKey),
          option,
          fullPath,
          fullPathKey,
        };
      });

      return h(
        'ul',
        {
          key: listIndex,
          class: clsx(menuPrefixCls, (classNames as { popup?: { list?: string } })?.popup?.list),
          style: (styles as { popup?: { list?: Record<string, string | number> } })?.popup?.list,
          role: 'menu',
        },
        optionInfoList.map(
          ({
            disabled,
            disableCheckbox,
            label,
            value,
            isLeaf: isMergedLeaf,
            isLoading,
            checked,
            halfChecked,
            option,
            fullPath,
            fullPathKey,
          }) => {
            // aria / data 透传（rc 的 pickAttrs）
            const ariaProps: Record<string, unknown> = {};
            Object.keys(toRaw(option)).forEach((key) => {
              if (key.startsWith('aria-') || key.startsWith('data-')) {
                ariaProps[key] = (option as BaseOptionType)[key];
              }
            });

            const triggerOpenPath = (): void => {
              if (isOptionDisabled(disabled)) return;
              const nextValueCells = [...fullPath];
              if (hoverOpen.value && isMergedLeaf) nextValueCells.pop();
              onPathOpen(nextValueCells);
            };
            const triggerSelect = (): void => {
              if (isSelectable(option) && !isOptionDisabled(disabled)) {
                // ⚠️ 这里调的是本组件的 onPathSelect（双参：leaf 驱动「是否关闭浮层」），
                //    不是 ctx.onSelect（单参，由 onPathSelect 内部转发）
                onPathSelect(fullPath, isMergedLeaf);
              }
            };
            const title =
              typeof option.title === 'string'
                ? option.title
                : typeof label === 'string'
                  ? label
                  : undefined;

            return h(
              'li',
              {
                key: fullPathKey,
                ...ariaProps,
                class: clsx(
                  menuItemPrefixCls,
                  (classNames as { popup?: { listItem?: string } })?.popup?.listItem,
                  {
                    [`${menuItemPrefixCls}-expand`]: !isMergedLeaf,
                    [`${menuItemPrefixCls}-active`]:
                      activeValue === value || activeValue === fullPathKey,
                    [`${menuItemPrefixCls}-disabled`]: isOptionDisabled(disabled),
                    [`${menuItemPrefixCls}-loading`]: isLoading,
                  },
                ),
                style: {
                  ...(popupMenuColumnStyle ?? {}),
                  ...(styles as { popup?: { listItem?: Record<string, string | number> } })?.popup
                    ?.listItem,
                },
                role: 'menuitemcheckbox',
                title,
                'aria-checked': checked,
                'data-path-key': fullPathKey,
                onClick: () => {
                  triggerOpenPath();
                  if (disableCheckbox) return;
                  if (!props.multiple || isMergedLeaf) triggerSelect();
                },
                onDblclick: () => {
                  if (changeOnSelect) props.toggleOpen(false);
                },
                onMouseenter: () => {
                  if (hoverOpen.value) triggerOpenPath();
                },
                onMousedown: (e: MouseEvent) => {
                  // 防止 selector 失焦
                  e.preventDefault();
                },
              },
              [
                props.multiple && !isEmpty.value
                  ? h(Checkbox, {
                      key: 'checkbox',
                      prefixCls: `${mergedPrefixCls.value}-checkbox`,
                      checked,
                      halfChecked,
                      disabled: isOptionDisabled(disabled) || !!disableCheckbox,
                      disableCheckbox: !!disableCheckbox,
                      onClick: (e: MouseEvent) => {
                        if (disableCheckbox) return;
                        e.stopPropagation();
                        triggerSelect();
                      },
                    })
                  : null,
                h(
                  'div',
                  { key: 'content', class: `${menuItemPrefixCls}-content` },
                  ((optionRender && value !== '__EMPTY__'
                    ? (optionRender as (opt: BaseOptionType) => VNodeChild)(option)
                    : label) as VNodeChild) ?? undefined,
                ),
                !isLoading && expandIcon && !isMergedLeaf
                  ? h(
                      'div',
                      { key: 'expand', class: `${menuItemPrefixCls}-expand-icon` },
                      (expandIcon as VNodeChild) ?? undefined,
                    )
                  : null,
                isLoading && loadingIcon
                  ? h(
                      'div',
                      { key: 'loading', class: `${menuItemPrefixCls}-loading-icon` },
                      (loadingIcon as VNodeChild) ?? undefined,
                    )
                  : null,
              ],
            );
          },
        ),
      );
    };

    onMounted(() => {
      const first = getC().values[0];
      if (!props.multiple && first) activeValueCells.value = first;
    });

    return () => {
      const mergedOptionColumns = isEmpty.value
        ? [{ options: emptyList.value }]
        : optionColumns.value;

      return h(
        'div',
        {
          class: clsx(`${mergedPrefixCls.value}-menus`, {
            [`${mergedPrefixCls.value}-menu-empty`]: isEmpty.value,
            [`${mergedPrefixCls.value}-rtl`]: rtl.value,
          }),
          ref: containerRef,
        },
        mergedOptionColumns.map((col, index) =>
          renderColumn(
            col.options,
            activeValueCells.value.slice(0, index),
            activeValueCells.value[index],
            index,
          ),
        ),
      );
    };
  },
});

export default RawOptionList;
