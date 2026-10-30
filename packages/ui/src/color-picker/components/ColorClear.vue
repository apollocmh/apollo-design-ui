<script setup lang="ts">
/** A named native clear action in the panel; the trigger uses its non-interactive decoration. */

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
  <component
    :is="value ? 'button' : 'span'"
    :type="value ? 'button' : undefined"
    :aria-label="value ? 'Clear color' : undefined"
    :disabled="value ? disabled : undefined"
    :aria-hidden="!value || undefined"
    :class="[`${prefixCls}-clear`, className, { [`${prefixCls}-clear-disabled`]: disabled }]"
    :style="style"
    @click="onClick"
    @keydown="value ? onKeyDown($event) : undefined"
  />
</template>
