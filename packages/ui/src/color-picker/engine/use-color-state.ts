/**
 * `useColorState` —— 引擎的受控 / 非受控归一（rc `hooks/useColorState.js` 12 行）。
 *
 * 上游是 `useControlledState(defaultValue, value)` + `useMemo(() => generateColor(mergedValue))`。
 * 本仓用 `@apollo-design/utils` 的 `useControlledValue`（签名不同但语义同构：
 * `getValue()` 返回 `undefined` 即「非受控」）。
 *
 * ⚠️ 三处**必须保留**的语义：
 *   1. `generateColor` 的归一发生在**读取时**（`computed`），不是写入时 ——
 *      所以外部传进来的字符串 / HSBA 对象会被转成 `Color`，而 `setValue` 存的是**原样**的值。
 *   2. `value` 的类型是 `ColorGenInput`（**不是 `Color`**）：antd 的 `PanelPicker` 传的是
 *      `mergedPickerColor?.toHsb()`（一个 `HSBA` 对象），由 `generateColor` 兜住。
 *   3. 非受控时**没有** `onChange` 回调（引擎不对外发事件，antd 层自己接 `onChange`）。
 */

import { useControlledValue } from '@apollo-design/utils';
import { type ComputedRef, computed, type Ref } from 'vue';
import type { Color } from './color';
import type { ColorGenInput } from './interface';
import { generateColor } from './util';

export function useColorState(
  defaultValue: ColorGenInput,
  value: Ref<ColorGenInput | undefined> | undefined,
): [ComputedRef<Color>, (next: Color) => void] {
  const [mergedValue, setValue] = useControlledValue<ColorGenInput>({
    defaultValue: () => defaultValue,
    getValue: () => value?.value,
  });

  const color = computed(() => generateColor(mergedValue.value));

  return [color, setValue];
}
