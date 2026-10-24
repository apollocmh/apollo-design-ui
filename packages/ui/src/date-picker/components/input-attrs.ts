import type { InputHTMLAttributes } from 'vue';
import type { PickerCommonProps, RangePickerProps } from '../interface';

/** Only native input metadata crosses this boundary; value, refs and handlers stay internal. */
export type PickerInputAttrs = Pick<
  InputHTMLAttributes,
  'id' | 'name' | 'required' | 'autocomplete' | 'autofocus' | 'tabindex'
> &
  Partial<Record<`aria-${string}`, unknown>>;

type InputProps = Pick<
  PickerCommonProps,
  'name' | 'required' | 'autoComplete' | 'autoFocus' | 'tabIndex'
> & { id?: RangePickerProps['id'] };

/** Called during render: useAttrs() changes must not be frozen in a computed. */
export function splitPickerAttrs(
  attrs: Readonly<Record<string, unknown>>,
  props: InputProps,
  range = false,
): { rootAttrs: Record<string, unknown>; inputAttrsByIndex: PickerInputAttrs[] } {
  const rootAttrs: Record<string, unknown> = {};
  const inputAttrs: PickerInputAttrs = {
    name: props.name,
    required: props.required,
    autocomplete: props.autoComplete ?? 'off',
    'aria-required': props.required,
  };
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('aria-')) {
      inputAttrs[`aria-${key.slice(5)}`] = value;
    } else if (key === 'tabindex' || key === 'tabIndex') {
      if (typeof value === 'string' || typeof value === 'number') inputAttrs.tabindex = value;
    } else if (key !== 'class' && key !== 'style') {
      rootAttrs[key] = value;
    }
  }
  if (props.tabIndex !== undefined) inputAttrs.tabindex = props.tabIndex;
  const ids = typeof props.id === 'string' ? [props.id] : [props.id?.start, props.id?.end];
  return {
    rootAttrs,
    inputAttrsByIndex: Array.from({ length: range ? 2 : 1 }, (_, index) => ({
      ...inputAttrs,
      id: ids[index],
      // Selector assigns autofocus to the first enabled input.
      autofocus: props.autoFocus,
    })),
  };
}
