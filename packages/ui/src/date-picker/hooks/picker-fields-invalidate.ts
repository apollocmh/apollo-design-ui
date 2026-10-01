/**
 * 两个 field 各自的「无效」状态（上游 `PickerInput/hooks/useFieldsInvalidate.js`，42 行）。
 *
 * ── 它解决什么 ───────────────────────────────────────────────────────────────
 *
 * 范围选择器有两个输入框，**各自**要标 `aria-invalid`。来源有两类：
 *   1. **键入非法**（用户打了「2026-13-45」）—— 由 `Selector` 的 `onInvalid` 上报；
 *   2. **值本身无效**（被 `disabledDate` 禁掉、或日期对象非法）—— 由 `isInvalidateDate` 现算。
 *
 * ⇒ `submitInvalidates[index]` 是两者的**并**。
 *
 * ── 🚨 两处「读源码才知道」的判据 ─────────────────────────────────────────────
 *
 * 1. **空值一律不算无效**（`!current ⇒ false`）—— 即 `[2026-01-01, null]` 的右端
 *    不标红。**这与「允许为空」无关**：上游把 `allowEmpty` 那条判断写在了
 *    `!current` 之后，所以它**永远走不到**（`current` 已保证为真）——
 *    这是上游的一处**死代码**，本仓照抄并标注（不「顺手修掉」：
 *    修掉会改变行为，而那属于规格之外的自主决定）。
 * 2. **`fieldsInvalidates` 一旦置真就只由下一次 `onSelectorInvalid` 覆写** ——
 *    它**不会**因为值变合法而自动清掉。清它的是 `Selector` 自己在重新解析成功时
 *    调 `onInvalid(false, index)`（见 `DatePicker.vue` 的 `applyInputText`）。
 */
import { fillIndex } from '@apollo-design/picker';
import { type ComputedRef, computed, ref } from 'vue';
import type { DatePickerDate } from '../interface';

export interface UseFieldsInvalidateResult {
  /** 两端各自的 `aria-invalid`（**已是最终值**）。 */
  submitInvalidates: ComputedRef<boolean[]>;
  /** `Selector` 的 `onInvalid` 回调。 */
  onSelectorInvalid: (invalid: boolean, index: number) => void;
}

export function useFieldsInvalidate(
  calendarValue: () => readonly (DatePickerDate | null | undefined)[],
  isInvalidateDate: (date: DatePickerDate, info: { activeIndex: number }) => boolean,
  allowEmpty: () => readonly boolean[] | undefined,
): UseFieldsInvalidateResult {
  const fieldsInvalidates = ref<boolean[]>([false, false]);

  const onSelectorInvalid = (invalid: boolean, index: number): void => {
    fieldsInvalidates.value = fillIndex(fieldsInvalidates.value, index, invalid);
  };

  const submitInvalidates = computed(() => {
    const values = calendarValue();
    const allowEmptyList = allowEmpty();
    return fieldsInvalidates.value.map((invalid, index) => {
      // ① 键入非法
      if (invalid) {
        return true;
      }
      const current = values[index];
      // ② 空值不算（**先于** `allowEmpty` 判断，见文件头第 1 条）
      if (!current) {
        return false;
      }
      // ③ 上游的死代码：`current` 此时必为真 ⇒ 恒不触发。照抄。
      if (allowEmptyList && !allowEmptyList[index] && !current) {
        return true;
      }
      // ④ 值本身无效
      return isInvalidateDate(current, { activeIndex: index });
    });
  });

  return { submitInvalidates, onSelectorInvalid };
}
