import {
  computed,
  defineComponent,
  h,
  nextTick,
  onBeforeUnmount,
  type PropType,
  ref,
  type SlotsType,
  shallowRef,
  type VNodeChild,
  watch,
} from 'vue';
import { useCascaderContext } from './context';
import type { CascaderOptionSlots } from './interface';
import {
  type BaseOptionType,
  getOptionChildren,
  getOptionLabel,
  getOptionValue,
  getSearchPath,
  isLeaf,
  scrollIntoParentView,
  toContent,
  toPathKey,
  toPathKeys,
  toPathOptions,
  type ValueCell,
} from './utils';

export const FIX_LABEL = '__cascader_fix_label__';
const legacyKeys: Record<number, string> = {
  38: 'ArrowUp',
  40: 'ArrowDown',
  37: 'ArrowLeft',
  39: 'ArrowRight',
  13: 'Enter',
  27: 'Escape',
  8: 'Backspace',
  32: ' ',
};
export const navigationKeys = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Enter',
  'Escape',
  'Backspace',
  ' ',
]);
export function getNavigationKey(event: KeyboardEvent): string {
  return event.key || legacyKeys[event.which || event.keyCode] || '';
}
export interface CascaderOptionListRef {
  onKeyDown: (event: KeyboardEvent) => void | Promise<void>;
  onKeyUp: () => void;
}

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
    notFoundContent: {
      type: [String, Number, Boolean, Object, Array] as PropType<VNodeChild>,
      default: undefined,
    },
    toggleOpen: { type: Function as PropType<(open: boolean) => void>, required: true },
  },
  slots: Object as SlotsType<CascaderOptionSlots>,
  emits: { popupScroll: (_event: Event) => true },
  setup(props, { expose, slots, emit }) {
    const context = useCascaderContext();
    const container = shallowRef<HTMLElement | null>(null);
    const active = ref<ValueCell>([]);
    const loading = ref(new Set<string>());
    type Request = { path: ValueCell; option: BaseOptionType; promise?: Promise<void> };
    const pending = new Map<string, Request>();
    let disposed = false;
    const finish = (key: string, request: Request): void => {
      if (disposed || pending.get(key) !== request) return;
      pending.delete(key);
      const next = new Set(loading.value);
      next.delete(key);
      loading.value = next;
    };
    onBeforeUnmount(() => {
      disposed = true;
      pending.clear();
    });
    const load = (path: ValueCell): void | Promise<void> => {
      const { loadData, options, fieldNames } = context.value;
      if (!loadData || props.searchValue || props.disabled) return;
      const pathOptions = toPathOptions(path, options, fieldNames).flatMap((item) =>
        item.option ? [item.option] : [],
      );
      const option = pathOptions.at(-1);
      if (
        !option ||
        option.disabled ||
        isLeaf(option, fieldNames) ||
        getOptionChildren(option, fieldNames).length
      )
        return;
      const key = toPathKey(path);
      if (pending.has(key)) return;
      const request: Request = { path, option };
      pending.set(key, request);
      loading.value = new Set([...loading.value, key]);
      let result: void | Promise<void>;
      try {
        result = loadData(pathOptions);
      } catch (error) {
        finish(key, request);
        throw error;
      }
      if (result)
        request.promise = Promise.resolve(result).then(
          () => {
            finish(key, request);
          },
          (error) => {
            finish(key, request);
            throw error;
          },
        );
      return request.promise;
    };
    watch(
      () => [context.value.options, context.value.fieldNames],
      () => {
        const { options, fieldNames } = context.value;
        for (const [key, request] of pending) {
          const current = toPathOptions(request.path, options, fieldNames).at(-1)?.option;
          if (
            current !== request.option ||
            isLeaf(current ?? undefined, fieldNames) ||
            getOptionChildren(current ?? undefined, fieldNames).length
          )
            finish(key, request);
        }
      },
      { deep: true },
    );
    watch(
      [() => props.open, () => context.value.values[0]],
      () => {
        if (!props.multiple) active.value = context.value.values[0] ?? [];
      },
      { immediate: true },
    );
    const checked = computed(() => new Set(toPathKeys(context.value.values)));
    const half = computed(() => new Set(toPathKeys(context.value.halfValues)));
    const options = computed(() =>
      props.searchValue ? context.value.searchOptions : context.value.options,
    );
    const searchPath = (option: BaseOptionType): ValueCell | undefined =>
      getSearchPath(option)?.map((node) => getOptionValue(node, context.value.fieldNames));
    const activeValue = (option: BaseOptionType): string | number => {
      const path = searchPath(option);
      return path ? toPathKey(path) : getOptionValue(option, context.value.fieldNames);
    };
    const columns = computed(() => {
      const result = [options.value];
      if (!props.searchValue) {
        let list = options.value;
        for (const cell of active.value) {
          const option = list.find(
            (item) => getOptionValue(item, context.value.fieldNames) === cell,
          );
          const children = getOptionChildren(option, context.value.fieldNames);
          if (!children.length) break;
          result.push(children);
          list = children;
        }
      }
      return result;
    });
    const canSelect = (option: BaseOptionType): boolean =>
      !props.disabled &&
      !option.disabled &&
      (!props.multiple || (!option.disableCheckbox && option.checkable !== false)) &&
      (props.multiple || context.value.changeOnSelect || isLeaf(option, context.value.fieldNames));
    const select = (path: ValueCell, option: BaseOptionType, keyboard = false): void => {
      if (!canSelect(option)) return;
      context.value.onSelect(path);
      if (
        !props.multiple &&
        (isLeaf(option, context.value.fieldNames) ||
          (context.value.changeOnSelect && (keyboard || context.value.expandTrigger === 'hover')))
      )
        props.toggleOpen(false);
    };
    const openPath = (path: ValueCell, option: BaseOptionType): void | Promise<void> => {
      if (props.disabled || option.disabled) return;
      active.value =
        context.value.expandTrigger === 'hover' && isLeaf(option, context.value.fieldNames)
          ? path.slice(0, -1)
          : path;
      return load(path);
    };
    const onKeyDown = (event: KeyboardEvent): void | Promise<void> => {
      if (props.disabled || event.isComposing) return;
      const key = getNavigationKey(event);
      if (!navigationKeys.has(key) || (key === ' ' && (!props.multiple || props.searchValue)))
        return;
      if (key === 'Backspace' && props.searchValue) return;
      event.preventDefault();
      let columnIndex = Math.min(Math.max(active.value.length - 1, 0), columns.value.length - 1);
      let list = columns.value[columnIndex] ?? [];
      let index = list.findIndex((option) => activeValue(option) === active.value[columnIndex]);
      // A replaced/removed active path starts navigation in the first available column.
      if (index < 0) {
        columnIndex = 0;
        list = options.value;
      }
      const option = list[index];
      const previous = (): void => {
        if (active.value.length > 1) active.value = active.value.slice(0, -1);
        else props.toggleOpen(false);
      };
      const next = (): void | Promise<void> => {
        if (!option || option.disabled) return;
        const children = getOptionChildren(option, context.value.fieldNames);
        const child = children.find((item) => !item.disabled);
        if (child)
          active.value = [...active.value, getOptionValue(child, context.value.fieldNames)];
        else return load(active.value);
      };
      if (key === 'ArrowDown' || key === 'ArrowUp') {
        const direction = key === 'ArrowDown' ? 1 : -1;
        if (index < 0 && direction < 0) index = list.length;
        for (let i = 0; i < list.length; i += 1) {
          index = (index + direction + list.length) % list.length;
          const candidate = list[index];
          if (candidate && !candidate.disabled) {
            active.value = [...active.value.slice(0, columnIndex), activeValue(candidate)];
            break;
          }
        }
      } else if (key === 'ArrowRight' || key === 'ArrowLeft') {
        if (!props.searchValue)
          return (key === 'ArrowRight') !== (props.direction === 'rtl') ? next() : previous();
      } else if (key === 'Backspace') previous();
      else if (key === 'Escape') {
        props.toggleOpen(false);
        event.stopPropagation();
      } else if (option) {
        const origin = getSearchPath(option);
        if (!option.disabled)
          select(
            origin
              ? origin.map((node) => getOptionValue(node, context.value.fieldNames))
              : active.value,
            option,
            true,
          );
      }
    };
    expose({ onKeyDown, onKeyUp: () => {} } satisfies CascaderOptionListRef);
    watch(
      [active, () => props.searchValue],
      async () => {
        if (props.searchValue) return;
        await nextTick();
        const rows = container.value?.querySelectorAll<HTMLElement>('li[data-path-key]');
        if (!rows) return;
        for (let i = 1; i <= active.value.length; i += 1) {
          const key = toPathKey(active.value.slice(0, i));
          const row = Array.from(rows).find((item) => item.dataset.pathKey === key);
          if (row) scrollIntoParentView(row);
        }
      },
      { flush: 'post' },
    );
    return () => {
      const { fieldNames, classNames, styles } = context.value;
      const p = props.prefixCls;
      const isEmpty = !options.value.length;
      const lists = isEmpty
        ? [
            [
              {
                [fieldNames.value]: '__EMPTY__',
                [FIX_LABEL]: props.notFoundContent,
                disabled: true,
              },
            ],
          ]
        : columns.value;
      return h(
        'div',
        {
          ref: container,
          class: [
            `${p}-menus`,
            { [`${p}-menu-empty`]: isEmpty, [`${p}-rtl`]: props.direction === 'rtl' },
          ],
        },
        lists.map((list, columnIndex) =>
          h(
            'ul',
            {
              key: columnIndex,
              class: [`${p}-menu`, classNames.popup?.list],
              style: [context.value.popupMenuColumnStyle, styles.popup?.list],
              role: 'menu',
              onScroll: (event: Event) => emit('popupScroll', event),
            },
            list.map((option) => {
              const pathOptions = getSearchPath(option) ?? [
                ...toPathOptions(
                  active.value.slice(0, columnIndex),
                  context.value.options,
                  fieldNames,
                ).flatMap((item) => (item.option ? [item.option] : [])),
                option,
              ];
              const path = pathOptions.map((item) => getOptionValue(item, fieldNames));
              const key = toPathKey(path);
              const leaf = isLeaf(option, fieldNames),
                disabled = !!(props.disabled || option.disabled);
              const isLoading = !!option.loading || loading.value.has(key);
              const label = isEmpty
                ? toContent(option[FIX_LABEL])
                : getOptionLabel(option, fieldNames, getOptionValue(option, fieldNames));
              const iconScope = { option };
              const expandIcon = slots.expandIcon
                ? slots.expandIcon(iconScope)
                : context.value.expandIcon;
              const loadingIcon = slots.loadingIcon
                ? slots.loadingIcon(iconScope)
                : context.value.loadingIcon;
              const content = isEmpty
                ? label
                : props.searchValue && slots.searchRender
                  ? slots.searchRender({ inputValue: props.searchValue, pathOptions, fieldNames })
                  : slots.optionRender
                    ? slots.optionRender({ option, pathOptions })
                    : label;
              const optionAttrs = Object.fromEntries(
                Object.entries(option).filter(
                  ([name]) => name.startsWith('aria-') || name.startsWith('data-'),
                ),
              );
              return h(
                'li',
                {
                  key,
                  ...optionAttrs,
                  class: [
                    `${p}-menu-item`,
                    classNames.popup?.listItem,
                    {
                      [`${p}-menu-item-expand`]: !leaf,
                      [`${p}-menu-item-active`]: active.value[columnIndex] === activeValue(option),
                      [`${p}-menu-item-disabled`]: disabled,
                      [`${p}-menu-item-loading`]: isLoading,
                    },
                  ],
                  style: styles.popup?.listItem,
                  role: 'menuitemcheckbox',
                  title:
                    typeof option.title === 'string'
                      ? option.title
                      : typeof label === 'string'
                        ? label
                        : undefined,
                  'aria-checked': half.value.has(key) ? 'mixed' : checked.value.has(key),
                  'aria-disabled': disabled || undefined,
                  'aria-expanded': leaf
                    ? undefined
                    : active.value[columnIndex] === activeValue(option),
                  'data-path-key': key,
                  onClick: () => {
                    const result = openPath(path, option);
                    if (!props.multiple || leaf) select(path, option);
                    return result;
                  },
                  onDblclick: () => {
                    if (!disabled && context.value.changeOnSelect) props.toggleOpen(false);
                  },
                  onMouseenter: () => {
                    if (context.value.expandTrigger === 'hover') return openPath(path, option);
                  },
                  onMousedown: (event: MouseEvent) => event.preventDefault(),
                },
                [
                  props.multiple && !isEmpty
                    ? h('span', {
                        class: [
                          `${p}-checkbox`,
                          {
                            [`${p}-checkbox-checked`]: checked.value.has(key),
                            [`${p}-checkbox-indeterminate`]:
                              !checked.value.has(key) && half.value.has(key),
                            [`${p}-checkbox-disabled`]:
                              disabled || option.disableCheckbox || option.checkable === false,
                          },
                        ],
                        onClick: (event: MouseEvent) => {
                          event.stopPropagation();
                          select(path, option);
                        },
                      })
                    : null,
                  h('div', { class: `${p}-menu-item-content` }, [content]),
                  !isLoading && !leaf
                    ? h('div', { class: `${p}-menu-item-expand-icon` }, [expandIcon])
                    : null,
                  isLoading
                    ? h('div', { class: `${p}-menu-item-loading-icon` }, [loadingIcon])
                    : null,
                ],
              );
            }),
          ),
        ),
      );
    };
  },
});
export default RawOptionList;
