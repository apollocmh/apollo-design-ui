/**
 * `Options` —— rc-pagination `Options.js`（119 行）的 Vue 等价物。
 *
 * 一个 `<li class="{p}-options">` 里放两样东西：
 *   1. **尺寸切换器**：由 `sizeChangerRender` 注入（antd 侧渲染成本仓的 Select）；
 *   2. **快速跳转**：`跳至 <input> 页 [确认按钮]`。
 *
 * 判据（`docs/analysis/pagination.md` §5）：
 *   - 两者都没有 ⇒ **整体返回 null**（`!showSizeChanger && !quickGo`）；
 *   - 跳转输入的**合法值**：空 ⇒ `undefined`；非数字 ⇒ `undefined`；其余 `Number(...)`；
 *   - `change` 只接受 `/^\d*$/`（其余字符被吞掉）；
 *   - `blur` 时：有 `goButton` 或输入为空 ⇒ 不动；否则清空输入并 `quickGo(validValue)`，
 *     **但若 relatedTarget 是分页自己的 `-item-link` / `-item`**（即点在页码上）⇒ 不提交；
 *   - 提交（Enter / click）：先清空输入，再 `quickGo(validValue)`；
 *   - 尺寸选项：`pageSizeOptions` 里没有当前 pageSize 时会**追加**并按数值升序排序；
 *   - `buildOptionText` 默认 `${value} ${items_per_page}`。
 *
 * ⚠️ Vue 侧的差异（登记 COMPATIBILITY）：`sizeChangerRender` 的产物由**父组件**通过
 *    `#sizeChanger` 槽或 `sizeChangerRender` prop 提供；本组件只负责在正确位置渲染它。
 */

import { computed, defineComponent, h, type PropType, ref, type VNodeChild } from 'vue';
import type { PaginationLocale, PaginationSizeChangerInfo } from './interface';

/** rc 的默认选项。 */
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default defineComponent({
  name: 'APaginationOptions',
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
    /** 尺寸切换器的渲染函数（对应 rc 的 `sizeChangerRender`）。 */
    sizeChangerRender: {
      type: Function as PropType<(info: PaginationSizeChangerInfo) => VNodeChild>,
      default: undefined,
    },
    /** 切换 pageSize（父组件的 `changePageSize`）。 */
    onChangeSize: {
      type: Function as PropType<(size: number) => void>,
      default: undefined,
    },
  },
  setup(props) {
    const goInputText = ref('');

    const validValue = computed<number | undefined>(() =>
      !goInputText.value || Number.isNaN(Number(goInputText.value))
        ? undefined
        : Number(goInputText.value),
    );

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
      const isEnter = 'keyCode' in e && e.keyCode === 13;
      if (isEnter || e.type === 'click') {
        goInputText.value = '';
        props.quickGo?.(validValue.value as number);
      }
    };

    const handleChange = (e: Event): void => {
      const value = (e.target as HTMLInputElement).value;
      if (/^\d*$/.test(value)) {
        goInputText.value = value;
      }
    };

    const handleBlur = (e: FocusEvent): void => {
      if (props.goButton || goInputText.value === '') return;
      const next = goInputText.value;
      goInputText.value = '';
      const related = e.relatedTarget as HTMLElement | null;
      const relatedClass = related?.className ?? '';
      // ⚠️ 点在分页自己的页码/上下页上时不提交（rc 逐字）
      if (
        relatedClass.includes(`${props.rootPrefixCls}-item-link`) ||
        relatedClass.includes(`${props.rootPrefixCls}-item`)
      ) {
        return;
      }
      void next;
      props.quickGo?.(validValue.value as number);
    };

    return () => {
      if (!props.showSizeChanger && !props.quickGo) return null;

      const prefixCls = `${props.rootPrefixCls}-options`;

      let changeSelect: VNodeChild = null;
      if (props.showSizeChanger && props.sizeChangerRender) {
        changeSelect = props.sizeChangerRender({
          disabled: props.disabled,
          value: props.pageSize,
          onSizeChange: (nextValue) => props.onChangeSize?.(Number(nextValue)),
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
        if (props.goButton) {
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
              : h('span', { onClick: go, onKeyup: go }, [props.goButton as VNodeChild]);
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

      return h('li', { class: prefixCls }, [changeSelect, goInput]);
    };
  },
});
