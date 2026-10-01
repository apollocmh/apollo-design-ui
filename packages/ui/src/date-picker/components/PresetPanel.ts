/**
 * `PresetPanel` —— 浮层左侧的预设列表（上游 `PickerInput/Popup/PresetPanel.js`，31 行）。
 *
 * ```jsx
 * if (!presets.length) return null;
 * <div className={`${prefixCls}-presets`}>
 *   <ul>
 *     {presets.map(({ label, value }, index) => (
 *       <li key={index}
 *           onClick={() => onClick(executeValue(value))}
 *           onMouseEnter={() => onHover(executeValue(value))}
 *           onMouseLeave={() => onHover(null)}>{label}</li>
 *     ))}
 *   </ul>
 * </div>
 * ```
 *
 * ── 三条判据 ─────────────────────────────────────────────────────────────────
 *
 * 1. **空列表整块不渲染**（`null`，不是空 `<div>`）—— 浮层里连 `-presets` 这个类名都没有。
 *    面板宽度因此不受影响（`-presets` 有自己的 `width`）。
 * 2. 🚨 **`value` 每次用都重新求值**（`executeValue`）—— `onClick` 与 `onMouseEnter`
 *    **各求值一次**，不是求值一次缓存起来。对「函数形态的 value」而言，
 *    两次调用可能返回不同的日期（上游的语义就是「以当时为准」）。
 * 3. 🚨 **Vue 的事件 prop 名必须全小写**（`onMouseenter` / `onMouseleave`）——
 *    写成 `onMouseEnter` 会**静默失效**（PITFALLS 跨包判据 1）。
 *
 * ⚠️ 本组件**不认识日期库**：`value` 原样透传给回调，求值只是「是不是函数」的判定。
 */
import { defineComponent, h, type PropType, type VNodeChild } from 'vue';
import { executePresetValue, type MergedPreset } from '../hooks/picker-presets';

export const PresetPanel = defineComponent({
  name: 'ApolloDatePickerPresetPanel',
  props: {
    prefixCls: { type: String, required: true },
    /** 已归一（`usePresets` 的产物）。 */
    presets: {
      type: Array as PropType<readonly MergedPreset<unknown>[]>,
      default: () => [],
    },
    /** 点一个预设（上游 `onPresetSubmit`）。 */
    onClick: { type: Function as PropType<(value: unknown) => void>, default: undefined },
    /** 悬停一个预设 / 离开（`null`）—— 上游用它做「悬停即预览整个区间」。 */
    onHover: {
      type: Function as PropType<(value: unknown | null) => void>,
      default: undefined,
    },
  },
  setup(props) {
    return () => {
      if (!props.presets.length) {
        return null;
      }
      return h('div', { class: `${props.prefixCls}-presets` }, [
        h(
          'ul',
          null,
          props.presets.map(({ label, value }, index) =>
            h(
              'li',
              {
                key: index,
                onClick: () => props.onClick?.(executePresetValue(value)),
                // 🚨 全小写（PITFALLS 跨包判据 1）
                onMouseenter: () => props.onHover?.(executePresetValue(value)),
                onMouseleave: () => props.onHover?.(null),
              },
              [label as VNodeChild],
            ),
          ),
        ),
      ]);
    };
  },
});

export default PresetPanel;
