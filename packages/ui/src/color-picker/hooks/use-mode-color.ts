/**
 * `useModeColor` —— 颜色与模式的**双向归一**（antd `es/color-picker/hooks/useModeColor.js`
 * 96 行的移植）。
 *
 * ── 🚨 三条判据（顺序即语义）──────────────────────────────────────────────────
 *
 * 1. **`postColor` 在「与 `cacheColor` 相等」时返回 `cacheColor` 本体** ——
 *    因为 `generateColor('')` 会**丢掉 `cleared` 标记**（`generateColor` 对空串
 *    返回一个「新的、cleared 的单色」，而 `cacheColor` 可能是一个 **cleared 的渐变**）。
 *    换成「重新构造」会让「清空后打开面板」丢失渐变缓存。
 * 2. **`postMode` 会被 `modeSet` 夹**：`modeState` 不在用户给的 `mode` 列表里时，
 *    回落到 `modeOptionList[0].value`（默认 `'single'`）。
 * 3. 🚨 **`watch(postColor)` 会覆盖 `modeState`** —— 即「颜色的形态（是否渐变）
 *    才是模式的事实来源」，用户点分段控件只是「请求」。
 *    ⇒ 这条**不能**写成「写状态 → 立刻比较」（PITFALLS 13/207）。
 */

import { useLocale } from '@apollo-design/locale';
import { useControlledValue } from '@apollo-design/utils';
import { type ComputedRef, computed, type Ref, ref, shallowRef, watch } from 'vue';
import type { AggregationColor } from '../color';
import type { ColorValueType, ModeType } from '../interface';
import { generateColor } from '../util';

/** 一个模式选项（`Segmented` 的 `options` 项）。 */
export interface ModeOption {
  label: string;
  value: ModeType;
}

export type ModeOptions = ModeOption[];

export default function useModeColor(
  defaultValue: ColorValueType | undefined,
  value: Ref<ColorValueType | undefined>,
  mode: Ref<ModeType | ModeType[] | undefined>,
): [
  /** `postColor` —— 归一后的颜色。 */
  ComputedRef<AggregationColor>,
  /** `setColor` —— 写状态（同时更新缓存）。 */
  (color: AggregationColor) => void,
  /** `postMode` —— 被 `modeSet` 夹过的模式。 */
  ComputedRef<ModeType>,
  /** `setModeState` —— 写模式**请求**（会被判据 3 覆盖）。 */
  (mode: ModeType) => void,
  /** `modeOptionList` —— 分段控件的选项。 */
  ComputedRef<ModeOptions>,
] {
  const [locale] = useLocale('ColorPicker');

  // ======================== Base ========================
  const [mergedColor, setMergedColor] = useControlledValue<ColorValueType | undefined>({
    defaultValue: () => defaultValue,
    getValue: () => value.value,
  });

  const modeState = ref<ModeType>('single');

  /** `modeOptionList` + `modeSet`（一次算出，两个 computed 都依赖它）。 */
  const modeOptionAndSet = computed(() => {
    const list = (Array.isArray(mode.value) ? mode.value : [mode.value]).filter(
      (m): m is ModeType => !!m,
    );
    if (!list.length) {
      list.push('single');
    }

    const modes = new Set<ModeType>(list);
    const optionList: ModeOptions = [];

    const pushOption = (modeType: ModeType, localeTxt: string): void => {
      if (modes.has(modeType)) {
        optionList.push({ label: localeTxt, value: modeType });
      }
    };

    pushOption('single', locale.singleColor);
    pushOption('gradient', locale.gradientColor);

    return { optionList, modes };
  });

  const modeOptionList = computed(() => modeOptionAndSet.value.optionList);
  const modeSet = computed(() => modeOptionAndSet.value.modes);

  // ======================== Post ========================
  /** 颜色被 `cleared` 时的缓存（见判据 1）。 */
  // ⚠️ `shallowRef`：`ref()` 会把 `AggregationColor` 过一遍 `UnwrapRef`（映射类型）
  //    ⇒ 丢掉类里的私有成员 ⇒ `.value` 不再可赋值给 `AggregationColor`。
  const cacheColor = shallowRef<AggregationColor | null>(null);

  const setColor = (nextColor: AggregationColor): void => {
    cacheColor.value = nextColor;
    setMergedColor(nextColor);
  };

  const postColor = computed<AggregationColor>(() => {
    const colorObj = generateColor(mergedColor.value || '');
    const cached = cacheColor.value;
    return cached && colorObj.equals(cached) ? cached : colorObj;
  });

  const postMode = computed<ModeType>(() => {
    if (modeSet.value.has(modeState.value)) {
      return modeState.value;
    }
    return modeOptionList.value[0]?.value ?? 'single';
  });

  // ======================= Effect =======================
  // 判据 3：颜色形态变化 ⇒ 覆盖模式
  // 🚨 **必须 `immediate: true`** —— 上游是 `React.useEffect`，**挂载时必跑一次**；
  //    Vue 的 `watch` 默认只在**变化时**跑 ⇒ 初始值就是渐变时 `modeState` 会停在 `'single'`
  //    ⇒ ① `GradientColorBar` 因 `mode !== 'gradient'` 整条不渲染；② `Segmented` 选中项错。
  //    这条是 **L6 抓到的真 bug**（`gradientOpen` 三个视口 block-diff 1.5%~5.8%，差异率与
  //    视口宽**反比** = 固定尺寸面 ⇒ 定位到「面板整体上移 16px」= 少了一条渐变条）。
  watch(
    postColor,
    (next) => {
      modeState.value = next.isGradient() ? 'gradient' : 'single';
    },
    { immediate: true },
  );

  const setModeState = (next: ModeType): void => {
    modeState.value = next;
  };

  return [postColor, setColor, postMode, setModeState, modeOptionList];
}
