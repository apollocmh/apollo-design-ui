<script setup lang="ts">
/**
 * `ColorClear` —— 清空按钮（antd `es/color-picker/components/ColorClear.js` 63 行）。
 *
 * ```html
 * <div role="button" aria-label="Clear color" [aria-disabled] [tabindex] class="{p}-clear [-clear-disabled]">
 * ```
 *
 * ── 四条判据 ─────────────────────────────────────────────────────────────────
 *
 * 1. **`aria-label` 是硬编码英文 `"Clear color"`**（上游如此，不进 locale）。
 * 2. `aria-disabled` 用 **`disabled || undefined`** —— 未禁用时属性**不出现**
 *    （不是 `aria-disabled="false"`）。
 * 3. `tabindex` 是 **`disabled ? -1 : 0`**（恒存在，不是可选）。
 * 4. 🚨 **「清空」= 保留色相/饱和度、把 alpha 置 0，并打上 `cleared = true`** ——
 *    不是把值置成 `null`。`cleared` 标记决定了触发器渲染 `ColorClear` 还是 `ColorBlock`。
 *    ⚠️ 守卫是 `onChange && value && !value.cleared`（**已清空时再点不重复发**）。
 */

import type { CSSProperties } from 'vue';
import type { AggregationColor } from '../color';
import { generateColor } from '../util';

interface ColorClearProps {
  prefixCls: string;
  value?: AggregationColor;
  onChange?: (value: AggregationColor) => void;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
}

defineOptions({ name: 'AColorClear', inheritAttrs: false });

const props = withDefaults(defineProps<ColorClearProps>(), {
  value: undefined,
  onChange: undefined,
  className: undefined,
  style: undefined,
  disabled: undefined,
});

const onClick = (): void => {
  if (props.disabled) {
    return;
  }

  // 判据 4
  if (props.onChange && props.value && !props.value.cleared) {
    const hsba = props.value.toHsb();
    hsba.a = 0;
    const genColor = generateColor(hsba);
    genColor.cleared = true;

    props.onChange(genColor);
  }
};

const onKeyDown = (event: KeyboardEvent): void => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onClick();
  }
};
</script>

<template>
  <div
    role="button"
    aria-label="Clear color"
    :aria-disabled="disabled || undefined"
    :tabindex="disabled ? -1 : 0"
    :class="[`${prefixCls}-clear`, className, { [`${prefixCls}-clear-disabled`]: disabled }]"
    :style="style"
    @click="onClick"
    @keydown="onKeyDown"
  />
</template>
