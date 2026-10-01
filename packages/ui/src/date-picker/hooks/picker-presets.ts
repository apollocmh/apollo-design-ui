/**
 * `presets` 的归一（上游 `PickerInput/hooks/usePresets.js`，16 行）。
 *
 * ```js
 * if (presets) return presets;
 * if (legacyRanges) { warning(false, '`ranges` is deprecated. Please use `presets` instead.');
 *                     return Object.entries(legacyRanges).map(([label, value]) => ({ label, value })); }
 * return [];
 * ```
 *
 * ── 三条判据 ─────────────────────────────────────────────────────────────────
 *
 * 1. **`presets` 优先，且**只要非 `undefined` 就用它**（空数组也算「给了」）——
 *    所以 `presets={[]}` **不会**回落到 `ranges`。
 * 2. **`ranges` 是 deprecated 的 `Record` 形态**，被**归一成 `presets` 的数组形态**
 *    （`{ label, value }`），而不是走另一条渲染路径 —— 上游只有一个 `PresetPanel`。
 *    ⚠️ 告警只在**真的用到 `ranges`** 时发（没传就不发）。
 * 3. **两者都没有 ⇒ 空数组**（不是 `undefined`）—— `PresetPanel` 靠 `.length` 判空。
 *
 * ⚠️ 本仓用 `computed` 而不是「setup 里算一次」：`presets` / `ranges` 是响应式 prop，
 * 算一次会让后续替换失效（React 的 `useMemo` 有依赖数组，语义等价于 `computed`）。
 */
import { useDevWarning } from '@apollo-design/utils';
import { type ComputedRef, computed } from 'vue';

/** 归一后的预设项（单值与范围共用形状：`label` + `value`）。 */
export interface MergedPreset<PresetValue> {
  label: unknown;
  value: PresetValue;
}

export function usePresets<PresetValue>(
  presets: () => readonly MergedPreset<PresetValue>[] | undefined,
  legacyRanges: () => Record<string, PresetValue> | undefined,
): ComputedRef<readonly MergedPreset<PresetValue>[]> {
  const devWarning = useDevWarning('DatePicker');

  return computed<readonly MergedPreset<PresetValue>[]>(() => {
    const list = presets();
    if (list !== undefined) {
      return list;
    }
    const ranges = legacyRanges();
    if (ranges !== undefined) {
      devWarning.deprecated(false, 'ranges', 'presets');
      return Object.entries(ranges).map(([label, value]) => ({ label, value }));
    }
    return [];
  });
}

/**
 * 预设值的**求值**（上游 `PresetPanel.js:2-4` 的 `executeValue`）。
 *
 * 上游把它定义在 `PresetPanel` 模块里，但**两处**要用（面板的 `onClick` / `onMouseEnter`
 * 都各自调一次）⇒ 本仓抽出来，保证「同一次交互里 label 与 value 的求值次数一致」。
 */
export function executePresetValue<PresetValue>(
  value: PresetValue | (() => PresetValue),
): PresetValue {
  return typeof value === 'function' ? (value as () => PresetValue)() : value;
}
