<script setup lang="ts">
/**
 * `ColorPresets` —— 预设色板（antd `es/color-picker/components/ColorPresets.tsx` 105 行）。
 *
 * 是 `Collapse` 的薄壳：每个 preset 分组一个面板，组内是若干 `ColorBlock`。
 *
 * ── 🚨 四条判据 ───────────────────────────────────────────────────────────────
 *
 * 1. **`isBright` 的判据分两段**：`a <= 0.5` 时看**合成到背景后**的 HSV 亮度
 *    （`> 0.5` 为亮）；否则看 `r*0.299 + g*0.587 + b*0.114 > 192`（感知亮度）。
 *    ⚠️ 第一段用的是 `onBackground(fg, bg)`（半透明前景合成到背景），不是 `mix`
 *    —— 本仓的单一真源在 `_internal/color-composite.ts`。
 * 2. **面板 key 是 `panel-${preset.key ?? index}`** —— 外部给了 `key` 就用它。
 * 3. **`defaultOpen` 缺省是 `true`** ⇒ `activeKeys` 收集的是「**没有**显式
 *    `defaultOpen: false`」的那些。
 * 4. **选中判据是 `presetColor.toCssString() === color?.toCssString()`**
 *    （比较的是 **CSS 串**，不是颜色实例相等）⇒ 渐变也能比。
 *
 * ⚠️ 上游把 `isBright` **导出**是为了它自己的单测；本仓不复用上游测试 ⇒
 * 保持内部函数（少一个对外面）。若将来第二个消费者需要，再按三次法则提出来。
 */

import { useLocale } from '@apollo-design/locale';
import { useToken } from '@apollo-design/theme';
import { computed, h } from 'vue';
import { onBackground } from '../../_internal/color-composite';
import { Collapse } from '../../collapse';
import type { AggregationColor } from '../color';
import { ColorBlock } from '../engine/components/color-block';
import type { PresetsItem } from '../interface';
import { generateColor } from '../util';

interface ColorPresetsProps {
  prefixCls: string;
  presets: PresetsItem[];
  value?: AggregationColor;
  onChange?: (value: AggregationColor) => void;
}

defineOptions({ name: 'AColorPresets', inheritAttrs: false });

const props = withDefaults(defineProps<ColorPresetsProps>(), {
  value: undefined,
  onChange: undefined,
});

const [locale] = useLocale('ColorPicker');
const token = useToken();

/** 判据 1。 */
const isBright = (value: AggregationColor, bgColorToken: string): boolean => {
  const { r, g, b, a } = value.toRgb();
  const hsv = onBackground(value.toRgbString(), bgColorToken).toHsv();
  if (a <= 0.5) {
    // 适配深色模式
    return hsv.v > 0.5;
  }
  return r * 0.299 + g * 0.587 + b * 0.114 > 192;
};

/** 判据 2。 */
const genCollapsePanelKey = (preset: PresetsItem, index: number): string =>
  `panel-${preset.key ?? index}`;

const colorPresetsPrefixCls = computed(() => `${props.prefixCls}-presets`);

const presetsValue = computed(() =>
  props.presets.map((preset) => ({
    ...preset,
    colors: preset.colors.map((c) => generateColor(c)),
  })),
);

/** 判据 3。 */
const activeKeys = computed(() =>
  presetsValue.value.reduce<string[]>((acc, preset, index) => {
    const { defaultOpen = true } = preset;
    if (defaultOpen) {
      acc.push(genCollapsePanelKey(preset, index));
    }
    return acc;
  }, []),
);

const handleClick = (colorValue: AggregationColor): void => {
  props.onChange?.(colorValue);
};

const items = computed(() =>
  presetsValue.value.map((preset, index) => ({
    key: genCollapsePanelKey(preset, index),
    // ⚠️ `preset.label` 是 `VNodeChild`（含 `null`）⇒ 包成数组，否则 `h` 的 children 重载不匹配
    label: h('div', { class: `${colorPresetsPrefixCls.value}-label` }, [preset.label]),
    children: h('div', { class: `${colorPresetsPrefixCls.value}-items` }, [
      preset.colors.length > 0
        ? preset.colors.map((presetColor, colorIndex) => {
            const colorInst = generateColor(presetColor);

            return h(ColorBlock, {
              key: `preset-${colorIndex}-${presetColor.toHexString()}`,
              color: colorInst.toCssString(),
              prefixCls: props.prefixCls,
              className: [
                `${colorPresetsPrefixCls.value}-color`,
                presetColor.toCssString() === props.value?.toCssString()
                  ? `${colorPresetsPrefixCls.value}-color-checked`
                  : '',
                isBright(presetColor, token.value.colorBgElevated)
                  ? `${colorPresetsPrefixCls.value}-color-bright`
                  : '',
              ]
                .filter(Boolean)
                .join(' '),
              onClick: () => handleClick(presetColor),
            });
          })
        : h('span', { class: `${colorPresetsPrefixCls.value}-empty` }, locale.presetEmpty),
    ]),
  })),
);
</script>

<template>
  <div :class="colorPresetsPrefixCls">
    <Collapse :default-active-key="activeKeys" ghost :items="items" />
  </div>
</template>
