/**
 * rc-select `SelectInput/`（235 + 214 + 179 行）的 Vue 版 —— 选择器的 DOM 层。
 *
 * 结构（对拍 antd v6 真实快照 `__snapshots__/index.test.tsx.snap:3-46`）：
 *
 * ```
 * <div class="{prefixCls} …">                     ← 根（rc 的 SelectInput 根）
 *   <div class="{prefixCls}-prefix">…</div>       ← 仅 prefix 存在时
 *   <div class="{prefixCls}-content">             ← 单选：值/占位 + input；多选：Overflow 根
 *     <div class="{prefixCls}-placeholder">
 *     <input class="{prefixCls}-input" role="combobox" …>
 *   </div>
 *   <div class="{prefixCls}-suffix">…</div>
 *   <button class="{prefixCls}-clear" aria-label>  ← 仅可清除时
 * </div>
 * ```
 *
 * ⚠️ antd v5 的 `-selector` 包裹层在 v6 **已被移除**（rc-select 1.10 重构成 `-content`）——
 * 不要照着旧版 DOM 写。
 *
 * ⚠️ 焦点事件用 `focusin` / `focusout` 而不是 `focus` / `blur`：rc 的
 * `onFocus` / `onBlur` 挂在根 div 上，靠 React 的事件委托等价于冒泡的
 * `focusin`/`focusout`；Vue 的 `onFocus` 是原生不冒泡的 `focus`。
 */

import { isEmptyVNode } from '@apollo-design/utils';
import type { CSSProperties, PropType, StyleValue, VNodeChild } from 'vue';
import { defineComponent, h, inject, mergeProps, ref, shallowRef } from 'vue';
import type {
  CustomTagProps,
  DisplayValueType,
  SelectSemanticClassNames,
  SelectSemanticStyles,
} from '../interface';
import { selectContextKey } from './context';
import SearchInput from './SearchInput';
import TransBtn from './TransBtn';
import { getTitle } from './valueUtil';

const onPreventMouseDown = (event: MouseEvent): void => {
  event.preventDefault();
  event.stopPropagation();
};

export const Selector = defineComponent({
  name: 'ASelectSelector',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, required: true },
    id: { type: String, default: undefined },
    className: { type: String, default: undefined },
    style: { type: [String, Object, Array] as PropType<StyleValue>, default: undefined },
    focused: { type: Boolean, default: false },
    multiple: { type: Boolean, default: false },
    mode: { type: String, default: undefined },
    displayValues: { type: Array as PropType<DisplayValueType[]>, default: () => [] },
    placeholder: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    searchValue: { type: String, default: '' },
    activeValue: { type: String, default: undefined },
    activeDescendantId: { type: String, default: undefined },
    prefix: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    suffix: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    clearIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    clearLabel: { type: String, default: undefined },
    disabled: { type: Boolean, default: undefined },
    loading: { type: Boolean, default: undefined },
    showSearch: { type: Boolean, default: false },
    open: { type: Boolean, default: false },
    rawOpen: { type: Boolean, default: false },
    tabIndex: { type: Number, default: undefined },
    title: { type: String, default: undefined },
    role: { type: String, default: undefined },
    /** 可访问名（原样转发给 combobox input，见 SearchInput 的说明）。 */
    ariaLabel: { type: String, default: undefined },
    ariaLabelledby: { type: String, default: undefined },
    maxLength: { type: Number, default: undefined },
    autoFocus: { type: Boolean, default: false },
    maxTagCount: { type: Number, default: undefined },
    maxTagTextLength: { type: Number, default: undefined },
    maxTagPlaceholder: {
      type: null as unknown as PropType<VNodeChild | ((omitted: DisplayValueType[]) => VNodeChild)>,
      default: undefined,
    },
    tagRender: {
      type: Function as PropType<((props: CustomTagProps) => VNodeChild) | undefined>,
      default: undefined,
    },
    removeIcon: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    tokenWithEnter: { type: Boolean, default: false },
    autoClearSearchValue: { type: Boolean, default: undefined },
    classNames: {
      type: Object as PropType<SelectSemanticClassNames | undefined>,
      default: undefined,
    },
    styles: { type: Object as PropType<SelectSemanticStyles | undefined>, default: undefined },
    // ---- 事件（纯 prop 回调，见 CHECKLIST #78）----
    onToggleOpen: { type: Function as PropType<(next?: boolean) => void>, default: undefined },
    onSearch: {
      type: Function as PropType<
        (text: string, fromTyping: boolean, isCompositing: boolean) => void
      >,
      default: undefined,
    },
    onSearchSubmit: { type: Function as PropType<(text: string) => void>, default: undefined },
    onInputBlur: { type: Function as PropType<() => void>, default: undefined },
    onInputKeyDown: {
      type: Function as PropType<(event: KeyboardEvent) => void>,
      default: undefined,
    },
    onClear: { type: Function as PropType<() => void>, default: undefined },
    onSelectorRemove: {
      type: Function as PropType<(value: DisplayValueType) => void>,
      default: undefined,
    },
  },
  emits: {
    mousedown: (_event: MouseEvent) => true,
    click: (_event: MouseEvent) => true,
    keydown: (_event: KeyboardEvent) => true,
    keyup: (_event: KeyboardEvent) => true,
    focus: (_event: FocusEvent) => true,
    blur: (_event: FocusEvent) => true,
  },
  setup(props, { expose, attrs, emit }) {
    const inputCompRef = shallowRef<InstanceType<typeof SearchInput> | null>(null);
    const rootRef = ref<HTMLElement | null>(null);
    /** rc 的 `event.nativeEvent._select_lazy`：点清除按钮时不要「点开下拉」。 */
    let lazyClick = false;

    const inputEl = (): HTMLInputElement | null => {
      const element = inputCompRef.value?.$el;
      return element instanceof HTMLInputElement ? element : null;
    };

    expose({
      focus: (options?: FocusOptions) => {
        (inputEl() ?? rootRef.value)?.focus(options);
      },
      blur: () => {
        (inputEl() ?? rootRef.value)?.blur();
      },
      nativeElement: () => rootRef.value,
    });

    /** 单选回填项的 `className` / `style` / `title` 来自 option 本身（rc SingleContent）。 */
    const selectCtx = inject(selectContextKey, null);

    const onInternalMouseDown = (event: MouseEvent): void => {
      if (!props.disabled) {
        const dom = inputEl();
        const isClickOnInput =
          !!dom && (dom === event.target || (dom.contains?.(event.target as Node) ?? false));
        if (dom && !isClickOnInput) {
          event.preventDefault();
        }
        const shouldPreventCloseOnSingle =
          props.open && !props.multiple && (props.mode === 'combobox' || props.showSearch);
        const shouldPreventCloseOnMultipleInput = props.open && props.multiple && isClickOnInput;
        if (!lazyClick) {
          dom?.focus();
          if (!(shouldPreventCloseOnSingle || shouldPreventCloseOnMultipleInput)) {
            props.onToggleOpen?.();
          }
        } else if (props.open && !props.multiple) {
          props.onToggleOpen?.(false);
        }
      }
      lazyClick = false;
      emit('mousedown', event);
    };

    // ---------------------------- 占位符 ----------------------------
    const renderPlaceholder = (show = true) => {
      if (props.displayValues.length) return null;
      return h(
        'div',
        {
          class: [props.classNames?.placeholder]
            .filter(Boolean)
            .concat(`${props.prefixCls}-placeholder`)
            .join(' '),
          style: {
            ...(show ? {} : { visibility: 'hidden' }),
            ...(props.styles?.placeholder ?? {}),
          },
        },
        [props.placeholder as never],
      );
    };

    // ---------------------------- 多选 tag ----------------------------
    const renderItem = (item: DisplayValueType, index: number) => {
      const itemDisabled = item.disabled === true;
      const closable = !props.disabled && !itemDisabled;
      let displayLabel = item.label;
      if (typeof props.maxTagTextLength === 'number' && typeof displayLabel === 'string') {
        if (displayLabel.length > props.maxTagTextLength) {
          displayLabel = `${displayLabel.slice(0, props.maxTagTextLength)}...`;
        }
      }
      const onClose = (event?: MouseEvent): void => {
        event?.stopPropagation();
        props.onSelectorRemove?.(item);
      };
      const tagProps: CustomTagProps = {
        label: displayLabel,
        value: item.value,
        disabled: itemDisabled,
        closable,
        onClose,
        isMaxTag: false,
        index,
      };
      if (typeof props.tagRender === 'function') {
        // rc-overflow：rest 项类 = `${prefixCls}-item-rest`（Overflow.js:239）
        return h(
          'div',
          {
            class: [`${props.prefixCls}-content-item`, `${props.prefixCls}-content-item-rest`],
            style: { opacity: '1' },
          },
          [
            h('span', { onMousedown: (e: MouseEvent) => onPreventMouseDown(e) }, [
              props.tagRender(tagProps) as never,
            ]),
          ],
        );
      }
      return h(
        'div',
        {
          class: `${props.prefixCls}-content-item`,
          style: { opacity: '1' },
        },
        [
          h(
            'span',
            {
              title: getTitle(item as unknown as Record<string, unknown>),
              class: [
                `${props.prefixCls}-selection-item`,
                itemDisabled ? `${props.prefixCls}-selection-item-disabled` : '',
                props.classNames?.item,
              ]
                .filter(Boolean)
                .join(' '),
              style: props.styles?.item,
            },
            [
              h(
                'span',
                {
                  class: [
                    `${props.prefixCls}-selection-item-content`,
                    props.classNames?.itemContent,
                  ]
                    .filter(Boolean)
                    .join(' '),
                  style: props.styles?.itemContent,
                },
                [displayLabel as never],
              ),
              closable
                ? h(
                    TransBtn,
                    {
                      className: [
                        `${props.prefixCls}-selection-item-remove`,
                        props.classNames?.itemRemove,
                      ]
                        .filter(Boolean)
                        .join(' '),
                      style: props.styles?.itemRemove as Record<string, string> | undefined,
                      customizeIcon: props.removeIcon,
                      onMousedown: onPreventMouseDown,
                      onClick: onClose,
                    },
                    () => '×',
                  )
                : null,
            ],
          ),
        ],
      );
    };

    const renderRest = (omittedValues: DisplayValueType[]) => {
      if (!props.displayValues.length) return null;
      const content =
        typeof props.maxTagPlaceholder === 'function'
          ? (props.maxTagPlaceholder as (v: DisplayValueType[]) => unknown)(omittedValues)
          : (props.maxTagPlaceholder ?? `+ ${omittedValues.length} ...`);
      if (typeof props.tagRender === 'function') {
        // rc-overflow：rest 项类 = `${prefixCls}-item-rest`（Overflow.js:239）
        return h(
          'div',
          {
            class: [`${props.prefixCls}-content-item`, `${props.prefixCls}-content-item-rest`],
            style: { opacity: '1' },
          },
          [
            h('span', { onMousedown: (e: MouseEvent) => onPreventMouseDown(e) }, [
              props.tagRender({
                label: content,
                value: undefined,
                disabled: false,
                closable: false,
                onClose: () => {},
                isMaxTag: true,
              }) as never,
            ]),
          ],
        );
      }
      return h(
        'div',
        {
          class: [`${props.prefixCls}-content-item`, `${props.prefixCls}-content-item-rest`],
          style: { opacity: '1' },
        },
        [
          h(
            'span',
            {
              class: [`${props.prefixCls}-selection-item`].join(' '),
              style: props.styles?.item,
              // rc defaultRenderSelector({title: content}, ...) —— title 透传到 span
              title: typeof content === 'string' ? content : undefined,
            },
            [
              h(
                'span',
                {
                  class: `${props.prefixCls}-selection-item-content`,
                  style: props.styles?.itemContent,
                },
                [content as never],
              ),
            ],
          ),
        ],
      );
    };

    const renderInput = (options: { syncWidth: boolean; value: string; readOnly: boolean }) =>
      h(SearchInput, {
        ref: inputCompRef,
        prefixCls: props.prefixCls,
        id: props.id,
        value: options.value,
        disabled: props.disabled,
        readOnly: options.readOnly,
        open: props.open,
        activeDescendantId: props.activeDescendantId,
        role: props.role ?? 'combobox',
        ariaLabel: props.ariaLabel,
        ariaLabelledby: props.ariaLabelledby,
        // 其余 `aria-*` 直接落到 combobox input 上（antd 同落点，见 splitAttrs）
        ...splitAttrs().aria,
        tabIndex: props.tabIndex,
        maxLength: props.mode === 'combobox' ? props.maxLength : undefined,
        autoFocus: props.autoFocus,
        syncWidth: options.syncWidth,
        tokenWithEnter: props.tokenWithEnter,
        mode: props.mode,
        inputClass: [`${props.prefixCls}-input`, props.classNames?.input].filter(Boolean).join(' '),
        inputStyle: props.styles?.input,
        onSearch: props.onSearch,
        onSearchSubmit: props.onSearchSubmit,
        onInputKeyDown: props.onInputKeyDown,
        onInputBlur: props.onInputBlur,
      });

    /**
     * 把落到 Selector 上的透传属性按 antd 的落点拆开。
     *
     * rc 的 `SelectInput`（`SelectInput/index.js:160-162`）是：
     * ```js
     * const domProps = omit(restProps, DEFAULT_OMIT_PROPS);
     * const ariaProps = pickAttrs(domProps, { aria: true });   // aria-* + role
     * <div {...omit(domProps, Object.keys(ariaProps))}> … <input {...ariaProps} />
     * ```
     * antd 6.6.4 SSR 实测：`data-*` / `name` / `title` 落**根 div**，
     * `aria-*` 落 **combobox input**。
     *
     * ⚠️ **必须在渲染期读 `attrs`**：`useAttrs()` 返回的是普通对象，
     *    在 setup 解构出来的是快照，父级只改透传属性时永远读到旧值（Issue #4.2）。
     */
    const splitAttrs = () => {
      const aria: Record<string, unknown> = {};
      const rest: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(attrs as Record<string, unknown>)) {
        if (key.startsWith('aria-')) aria[key] = value;
        else rest[key] = value;
      }
      return { aria, rest };
    };

    return () => {
      const { prefixCls } = props;

      // ------------------------------ 单选 ------------------------------
      const renderSingle = () => {
        const displayValue = props.displayValues[0];
        const mergedSearchValue = props.showSearch ? props.searchValue : '';
        const showHasValueCls =
          !!displayValue &&
          displayValue.label !== null &&
          displayValue.label !== undefined &&
          String(displayValue.label).trim() !== '';

        let optionClassName: string | undefined;
        let optionStyle: CSSProperties | undefined;
        let optionTitle: string | undefined;
        if (displayValue) {
          const hit = selectCtx?.value.flattenOptions.find(
            (opt) => opt.value === displayValue.value,
          );
          if (hit?.data) {
            optionClassName = hit.data.className;
            optionStyle = hit.data.style;
            optionTitle = getTitle(hit.data as unknown as Record<string, unknown>);
          }
          if (!optionTitle) {
            optionTitle = getTitle(displayValue as unknown as Record<string, unknown>);
          }
        }
        const hasOptionStyle = Boolean(optionClassName || optionStyle);
        if (props.title !== undefined) optionTitle = props.title;

        const renderValue = displayValue
          ? hasOptionStyle
            ? h(
                'div',
                {
                  class: [`${prefixCls}-content-value`, optionClassName].filter(Boolean).join(' '),
                  style: {
                    ...(mergedSearchValue ? { visibility: 'hidden' } : {}),
                    ...(optionStyle ?? {}),
                  },
                  title: optionTitle,
                },
                [displayValue.label as never],
              )
            : (displayValue.label as never)
          : renderPlaceholder(!mergedSearchValue);

        return h(
          'div',
          {
            class: [
              `${prefixCls}-content`,
              showHasValueCls ? `${prefixCls}-content-has-value` : '',
              mergedSearchValue ? `${prefixCls}-content-has-search-value` : '',
              hasOptionStyle ? `${prefixCls}-content-has-option-style` : '',
              props.classNames?.content,
            ]
              .filter(Boolean)
              .join(' '),
            style: props.styles?.content,
            title: hasOptionStyle ? undefined : optionTitle,
          },
          [
            renderValue,
            renderInput({
              syncWidth: false,
              value: mergedSearchValue,
              readOnly: !props.showSearch,
            }),
          ],
        );
      };

      // ------------------------------ 多选 ------------------------------
      const renderMultiple = () => {
        let computedSearchValue = props.searchValue;
        if (!props.rawOpen && props.mode === 'multiple' && props.autoClearSearchValue !== false) {
          computedSearchValue = '';
        }
        const inputValue = props.showSearch ? computedSearchValue || '' : '';
        const inputEditable = props.showSearch && !props.disabled;

        const items =
          typeof props.maxTagCount === 'number'
            ? props.displayValues.slice(0, props.maxTagCount)
            : props.displayValues;
        const omitted = props.displayValues.slice(items.length);

        return h(
          'div',
          {
            class: [`${prefixCls}-content`, props.classNames?.content].filter(Boolean).join(' '),
            style: props.styles?.content,
          },
          [
            !props.displayValues.length && !inputValue ? renderPlaceholder() : null,
            ...items.map(renderItem),
            omitted.length ? renderRest(omitted) : null,
            // rc Overflow：suffix（搜索输入）外包一层 `-content-item -content-item-suffix`
            h(
              'div',
              {
                class: [`${prefixCls}-content-item`, `${prefixCls}-content-item-suffix`].join(' '),
              },
              [
                renderInput({
                  syncWidth: true,
                  value: inputValue,
                  readOnly: !inputEditable,
                }),
              ],
            ),
          ],
        );
      };

      return h(
        'div',
        mergeProps(splitAttrs().rest, {
          // ⚠️ 透传在前、受控在后：内部事件/类名/样式**压过**同名透传，
          //    避免用户 attrs 把内部处理器顶掉（Issue #4.2 的「防止回写覆盖内部事件」）。
          ref: rootRef,
          class: props.className,
          style: props.style,
          onMousedown: onInternalMouseDown,
          onClick: (event: MouseEvent) => emit('click', event),
          onKeydown: (event: KeyboardEvent) => emit('keydown', event),
          onKeyup: (event: KeyboardEvent) => emit('keyup', event),
          onFocusin: (event: FocusEvent) => emit('focus', event),
          onFocusout: (event: FocusEvent) => emit('blur', event),
        }),
        [
          !isEmptyVNode(props.prefix)
            ? h(
                'div',
                {
                  class: [`${prefixCls}-prefix`, props.classNames?.prefix]
                    .filter(Boolean)
                    .join(' '),
                  style: props.styles?.prefix,
                },
                [props.prefix as never],
              )
            : null,
          props.multiple ? renderMultiple() : renderSingle(),
          // rc：`suffixNode && <div class="-suffix">` —— suffixIcon={null}
          //（AutoComplete）时**不渲染**容器（AutoComplete 期抓出）
          !isEmptyVNode(props.suffix)
            ? h(
                'div',
                {
                  class: [
                    `${prefixCls}-suffix`,
                    props.loading ? `${prefixCls}-suffix-loading` : '',
                    props.classNames?.suffix,
                  ]
                    .filter(Boolean)
                    .join(' '),
                  style: props.styles?.suffix,
                },
                [props.suffix as never],
              )
            : null,
          !isEmptyVNode(props.clearIcon)
            ? h(
                'button',
                {
                  type: 'button',
                  'aria-label': props.clearLabel,
                  class: [`${prefixCls}-clear`, props.classNames?.clear].filter(Boolean).join(' '),
                  style: props.styles?.clear,
                  onMousedown: (event: MouseEvent) => {
                    event.preventDefault();
                    lazyClick = true;
                  },
                  onKeydown: (event: KeyboardEvent) => {
                    // 根 div 把 Enter/Space 当「打开下拉」并 preventDefault，
                    // 会把按钮的原生激活吃掉 ⇒ 在按钮上掐断冒泡。
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.stopPropagation();
                    }
                  },
                  onClick: () => props.onClear?.(),
                },
                [props.clearIcon as never],
              )
            : null,
        ],
      );
    };
  },
});

export default Selector;
