import type { CheckableTagGroupValue, CheckableTagValue } from './interface';

export function selectedValues<T extends CheckableTagValue>(
  value: T | T[] | null | undefined,
): T[] {
  return Array.isArray(value) ? value : value === null || value === undefined ? [] : [value];
}
export function initialGroupValue<T extends CheckableTagValue, M extends boolean>(
  multiple: M | undefined,
  value: CheckableTagGroupValue<T, M> | undefined,
): CheckableTagGroupValue<T, M>;
export function initialGroupValue<T extends CheckableTagValue>(
  multiple: boolean | undefined,
  value: T | T[] | null | undefined,
): T | T[] | null {
  const values = selectedValues(value);
  return multiple ? values : (values[0] ?? null);
}
export function nextGroupValue<T extends CheckableTagValue, M extends boolean>(
  multiple: M | undefined,
  value: CheckableTagGroupValue<T, M>,
  option: T,
  checked: boolean,
): CheckableTagGroupValue<T, M>;
export function nextGroupValue<T extends CheckableTagValue>(
  multiple: boolean | undefined,
  value: T | T[] | null,
  option: T,
  checked: boolean,
): T | T[] | null {
  if (!multiple) return checked ? option : null;
  const values = selectedValues(value);
  return checked
    ? values.includes(option)
      ? values
      : [...values, option]
    : values.filter((item) => item !== option);
}
