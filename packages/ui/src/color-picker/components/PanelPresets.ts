/**
 * `PanelPresets` —— 预设面板的**入口薄壳**（antd `es/color-picker/components/PanelPresets.tsx` 14 行）。
 *
 * 唯一职责：从 context 取 `{ prefixCls, value, presets, onChange }`，
 * **只有 `presets` 是数组时**才渲染 `ColorPresets`，否则返回 `null`。
 *
 * `.ts` 而非 `.vue` 的理由：`COMPONENT-RULES.md` §2 条件 1（纯渲染函数型内部件 ——
 * 它没有模板可言的 DOM，只是一个「读 context → 有条件地渲染子件」的分支）。
 */

import { defineComponent, h, inject, type VNodeChild } from 'vue';
import { panelPresetsContextKey } from '../context';
import ColorPresets from './ColorPresets.vue';

export const PanelPresets = defineComponent({
  name: 'AColorPanelPresets',
  setup() {
    const context = inject(panelPresetsContextKey, undefined);

    return (): VNodeChild => {
      const ctx = context?.value;
      // ⚠️ 判据是 `Array.isArray(presets)`（不是真值）—— 空数组**会**渲染
      //    （渲染出 `-presets-empty` 的「暂无」文案）。
      if (!ctx || !Array.isArray(ctx.presets)) {
        return null;
      }

      return h(ColorPresets, {
        prefixCls: ctx.prefixCls,
        value: ctx.value,
        presets: ctx.presets,
        onChange: ctx.onChange,
      });
    };
  },
});

export default PanelPresets;
