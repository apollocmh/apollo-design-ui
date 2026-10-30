/**
 * `Options` —— rc-pagination `Options.js`（119 行）的 Vue 等价物。
 *
 * 一个 `<li class="{p}-options">` 里放两样东西：
 *   1. **尺寸切换器**：由原生 `#sizeChanger` 槽传入，默认渲染本仓 Select；
 *   2. **快速跳转**：`跳至 <input> 页 [确认按钮]`。
 *
 * 判据（`docs/analysis/pagination.md` §5）：
 *   - 两者都没有 ⇒ **整体返回 null**（`!showSizeChanger && !quickGo`）；
 *   - 跳转输入的**合法值**：空 ⇒ `undefined`；非数字 ⇒ `undefined`；其余 `Number(...)`；
 *   - `change` 只接受 `/^\d*$/`（其余字符被吞掉）；
 *   - `blur` 时：有 `goButton` 或输入为空 ⇒ 不动；否则清空输入并 `quickGo(validValue)`，
 *     **但若 relatedTarget 属于同一分页的页码/上下页/跳页控件** ⇒ 不提交；
 *   - 提交（Enter / click）：先清空输入，再 `quickGo(validValue)`；
 *   - 尺寸选项：`pageSizeOptions` 里没有当前 pageSize 时会**追加**并按数值升序排序；
 *   - `buildOptionText` 默认 `${value} ${items_per_page}`。
 *
 * 父组件以原生 `#sizeChanger` 槽传递当前内容，本组件负责尺寸选项和跳页输入。
 */

import {
  computed,
  defineComponent,
  h,
  type PropType,
  ref,
  type SlotsType,
  type VNodeChild,
} from 'vue';
import type { PaginationLocale, PaginationSlots } from './interface';

/** rc 的默认选项。 */
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const contentSlots: SlotsType<Pick<PaginationSlots, 'sizeChanger'>> = {};

export default defineComponent({
  name: 'APaginationOptions',
  slots: contentSlots,
  props: {
    rootPrefixCls: { type: String, required: true },
    locale: { type: Object as PropType<PaginationLocale>, required: true },
    pageSize: { type: Number, required: true },
    pageSizeOptions: { type: Array as PropType<number[]>, default: undefined },
    disabled: { type: Boolean, default: false },
    showSizeChanger: { type: Boolean, default: false },
    /** 传了 ⇒ 显示快速跳转（`total > pageSize && showQuickJumper`）。 */
    quickGo: { type: Function as PropType<(page: number) => void>, default: undefined },
    /** `showQuickJumper.goButton` 的产物（节点或 `true` ⇒ 用 locale 文案）。 */
    goButton: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    /** 切换 pageSize（父组件的 `changePageSize`）。 */
    onChangeSize: {
      type: Function as PropType<(size: number) => void>,
      default: undefined,
    },
  },
  setup(props, { slots }) {
    const root = ref<HTMLLIElement | null>(null);
    const goInputText = ref('');
    const hasGoButton = computed(
      () => props.goButton !== undefined && props.goButton !== null && props.goButton !== false,
    );

    /** 输入文本 → 合法页号（空 / 非数字 ⇒ `undefined`）。 */
    const readValid = (text: string): number | undefined =>
      !text || Number.isNaN(Number(text)) ? undefined : Number(text);

    const validValue = computed<number | undefined>(() => readValid(goInputText.value));

    const buildOptionText = (value: number): string => `${value} ${props.locale.items_per_page}`;

    /** 选项：当前 pageSize 不在列表里就追加 + 按数值升序（rc 逐字）。 */
    const mergedPageSizeOptions = computed<number[]>(() => {
      const base = props.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS;
      if (base.some((option) => option.toString() === props.pageSize.toString())) {
        return base;
      }
      return [...base, props.pageSize].sort((a, b) => Number(a) - Number(b));
    });

    const go = (e: KeyboardEvent | MouseEvent): void => {
      if (goInputText.value === '') return;
      const isEnter = 'key' in e && (e.key === 'Enter' || e.keyCode === 13);
      if (isEnter || e.type === 'click') {
        // ⚠️ **必须先取值再清空**：Vue 的 `ref` 是**同步**的，清空之后 `validValue` 立刻变
        //    `undefined`（rc 能这么写是因为 React 的 setState 是异步的，事件处理器内读到的
        //    仍是旧值）—— 顺序反了会导致「点确认按钮没反应」且**没有任何报错**。
        const next = validValue.value;
        goInputText.value = '';
        if (next !== undefined) props.quickGo?.(next);
      }
    };

    const handleChange = (e: Event): void => {
      const target = e.target as HTMLInputElement;
      const value = target.value;
      if (/^\d*$/.test(value)) {
        goInputText.value = value;
        return;
      }
      // ⚠️ 非法字符要把 DOM 值**按回去**：React 对受控 input 有 restoreControlledState，
      //    Vue 没有 —— 状态不变 ⇒ 不会 patch ⇒ 用户敲的 `a` 会**留在框里**（实测）。
      target.value = goInputText.value;
    };

    const handleBlur = (e: FocusEvent): void => {
      if (hasGoButton.value || goInputText.value === '') return;
      // 同 `go`：先取值再清空（Vue 的 ref 是同步的）
      const pending = readValid(goInputText.value);
      goInputText.value = '';
      const related = e.relatedTarget;
      const item = related instanceof Element ? related.closest('li') : null;
      if (
        item &&
        item.parentElement === root.value?.parentElement &&
        ['item', 'prev', 'next', 'jump-prev', 'jump-next'].some((part) =>
          item.classList.contains(`${props.rootPrefixCls}-${part}`),
        )
      ) {
        return;
      }
      if (pending !== undefined) props.quickGo?.(pending);
    };

    return () => {
      if (!props.showSizeChanger && !props.quickGo) return null;

      const prefixCls = `${props.rootPrefixCls}-options`;

      let changeSelect: VNodeChild = null;
      if (props.showSizeChanger && slots.sizeChanger) {
        // ⚠️ 两个键给同一个函数：rc 口径 `onSizeChange` + antd `components.sizeChanger` 口径 `onChange`
        const commitSize = (nextValue: number | string): void =>
          props.onChangeSize?.(Number(nextValue));
        changeSelect = slots.sizeChanger({
          disabled: props.disabled,
          value: props.pageSize,
          onSizeChange: commitSize,
          onChange: commitSize,
          'aria-label': props.locale.page_size,
          className: `${prefixCls}-size-changer`,
          options: mergedPageSizeOptions.value.map((opt) => ({
            label: buildOptionText(opt),
            value: opt,
          })),
        });
      }

      let goInput: VNodeChild = null;
      if (props.quickGo) {
        let gotoButton: VNodeChild = null;
        if (hasGoButton.value) {
          gotoButton =
            props.goButton === true
              ? h(
                  'button',
                  {
                    type: 'button',
                    disabled: props.disabled,
                    class: `${prefixCls}-quick-jumper-button`,
                    onClick: go,
                    onKeyup: go,
                  },
                  props.locale.jump_to_confirm,
                )
              : h('span', { onClick: go, onKeyup: go }, [props.goButton]);
        }
        goInput = h('div', { class: `${prefixCls}-quick-jumper` }, [
          props.locale.jump_to,
          h('input', {
            disabled: props.disabled,
            type: 'text',
            value: goInputText.value,
            'aria-label': props.locale.page,
            onInput: handleChange,
            onChange: handleChange,
            onKeyup: go,
            onBlur: handleBlur,
          }),
          props.locale.page,
          gotoButton,
        ]);
      }

      return h('li', { ref: root, class: prefixCls }, [changeSelect, goInput]);
    };
  },
});
