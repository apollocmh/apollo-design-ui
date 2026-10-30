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
import { defineComponent, h, type PropType, type SlotsType } from 'vue';
import type { DatePickerSlots, RangeValueDate, ValueDate } from '../interface';

export const PresetPanel = defineComponent({
  name: 'ApolloDatePickerPresetPanel',
  props: {
    prefixCls: { type: String, required: true },
    /** 已归一（`usePresets` 的产物）。 */
    presets: {
      type: Array as PropType<readonly (ValueDate | RangeValueDate)[]>,
      default: () => [],
    },
  },
  emits: { select: (_value: unknown) => true, hover: (_value: unknown) => true },
  slots: Object as SlotsType<Pick<DatePickerSlots, 'presetRender'>>,
  setup(props, { emit, slots }) {
    return () => {
      if (!props.presets.length) {
        return null;
      }
      return h('div', { class: `${props.prefixCls}-presets` }, [
        h(
          'ul',
          null,
          props.presets.map((preset, index) =>
            h(
              'li',
              {
                key: index,
                role: 'button',
                tabindex: 0,
                onKeydown: (event: KeyboardEvent) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    emit(
                      'select',
                      typeof preset.value === 'function' ? preset.value() : preset.value,
                    );
                  }
                },
                onClick: () =>
                  emit(
                    'select',
                    typeof preset.value === 'function' ? preset.value() : preset.value,
                  ),
                // 🚨 全小写（PITFALLS 跨包判据 1）
                onMouseenter: () =>
                  emit('hover', typeof preset.value === 'function' ? preset.value() : preset.value),
                onMouseleave: () => emit('hover', null),
              },
              [slots.presetRender ? slots.presetRender({ preset, index }) : preset.label],
            ),
          ),
        ),
      ]);
    };
  },
});

export default PresetPanel;
