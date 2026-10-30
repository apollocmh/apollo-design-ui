<script setup lang="ts">
/** Native trigger button; current text slots and native attrs belong to this element. */

import { useLocale } from '@apollo-design/locale';
import { pickAttrs, toVueDomAttrs } from '@apollo-design/utils';
import { computed, h, normalizeStyle, useAttrs, type VNodeChild } from 'vue';
import { NodeRenderer } from '../../_internal/node-renderer';
import type { AggregationColor } from '../color';
import { ColorBlock } from '../engine/components/color-block';
import type {
  ColorFormatType,
  ColorPickerProps,
  ColorPickerSemanticClassNames,
  ColorPickerSemanticStyles,
} from '../interface';
import { getColorAlpha } from '../util';
import ColorClear from './ColorClear.vue';

interface ColorTriggerProps {
  prefixCls: string;
  color: AggregationColor;
  classNames: ColorPickerSemanticClassNames;
  styles: ColorPickerSemanticStyles;
  activeIndex: number;
  disabled?: boolean;
  format?: ColorFormatType;
  open?: boolean;
  showText?: ColorPickerProps['showText'];
  className?: string;
}

defineOptions({ name: 'AColorTrigger', inheritAttrs: false });

const props = withDefaults(defineProps<ColorTriggerProps>(), {
  disabled: undefined,
  format: undefined,
  open: undefined,
  showText: undefined,
  className: undefined,
});

const attrs = useAttrs();
const slots = defineSlots<{ showText?: (scope: { color: AggregationColor }) => VNodeChild }>();
const [locale] = useLocale('ColorPicker');

const colorTriggerPrefixCls = computed(() => `${props.prefixCls}-trigger`);
const colorTextPrefixCls = computed(() => `${colorTriggerPrefixCls.value}-text`);
const colorTextCellPrefixCls = computed(() => `${colorTextPrefixCls.value}-cell`);

/** 判据 2：五种分支。 */
const desc = computed<VNodeChild>(() => {
  if (!props.showText) {
    return '';
  }

  if (props.color.cleared) {
    return locale.value.transparent;
  }

  if (props.color.isGradient()) {
    return props.color.getColors().map((c, index) => {
      // 判据 3
      const inactive = props.activeIndex !== -1 && props.activeIndex !== index;

      return h(
        'span',
        {
          key: index,
          class: [
            colorTextCellPrefixCls.value,
            inactive && `${colorTextCellPrefixCls.value}-inactive`,
          ],
        },
        `${c.color.toRgbString()} ${c.percent}%`,
      );
    });
  }

  const hexString = props.color.toHexString().toUpperCase();
  const alpha = getColorAlpha(props.color);
  switch (props.format) {
    case 'rgb':
      return props.color.toRgbString();
    case 'hsb':
      return props.color.toHsbString();
    default:
      return alpha < 100 ? `${hexString.slice(0, 7)},${alpha}%` : hexString;
  }
});

/** 判据 1。 */
const container = computed(() =>
  props.color.cleared
    ? {
        is: ColorClear,
        props: {
          prefixCls: props.prefixCls,
          className: props.classNames.body,
          style: props.styles.body,
          disabled: props.disabled,
        },
      }
    : {
        is: ColorBlock,
        props: {
          prefixCls: props.prefixCls,
          color: props.color.toCssString(),
          className: props.classNames.body,
          innerClassName: props.classNames.content,
          style: props.styles.body,
          innerStyle: props.styles.content,
        },
      },
);

/** 判据 5。 */
const forwardedAttrs = () => {
  const { class: _class, style: _style, ...rest } = attrs;
  return toVueDomAttrs(pickAttrs(rest));
};
</script>

<template>
  <button
    type="button"
    :disabled="disabled"
    :aria-label="color.cleared ? locale.transparent : color.toCssString()"
    aria-haspopup="dialog"
    :aria-expanded="!!open"
    :class="[
      colorTriggerPrefixCls,
      className,
      classNames.root,
      {
        [`${colorTriggerPrefixCls}-active`]: open,
        [`${colorTriggerPrefixCls}-disabled`]: disabled,
      },
      attrs.class,
    ]"
    :style="[styles.root, normalizeStyle(attrs.style)]"
    v-bind="forwardedAttrs()"
  >
    <component :is="container.is" v-bind="container.props" />
    <div
      v-if="showText"
      :class="[colorTextPrefixCls, classNames.description]"
      :style="styles.description"
    >
      <slot v-if="slots.showText" name="showText" :color="color" />
      <NodeRenderer v-else :node="desc" />
    </div>
  </button>
</template>
