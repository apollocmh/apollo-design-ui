<script setup lang="ts">
/**
 * `ColorTrigger` —— 触发器（antd `es/color-picker/components/ColorTrigger.tsx` 148 行）。
 *
 * ```html
 * <div class="{p}-trigger [className] [classNames.root] [-trigger-active] [-trigger-disabled]"
 *      style="{...styles.root, ...style}">
 *   <ColorClear/> | <ColorBlock/>                 ← color.cleared 时是前者
 *   <div class="{p}-trigger-text [classNames.description]">…</div>   ← showText 时
 * </div>
 * ```
 *
 * ── 🚨 五条判据 ───────────────────────────────────────────────────────────────
 *
 * 1. **`color.cleared` 决定渲染 `ColorClear` 还是 `ColorBlock`** —— 这就是「清空」
 *    在 UI 上的唯一表现（`.apollo-color-picker-clear` 出现在触发器里）。
 * 2. **`showText` 有五种分支，优先级从高到低**：`isFunction` → `cleared`（locale 的
 *    `transparent`）→ `isGradient`（逐段 `<span>{rgb} {percent}%</span>`，
 *    非激活段加 `-inactive`）→ 按 `format` 分派 rgb/hsb → 默认 hex
 *    （**alpha < 100 时是 `#RRGGBB,NN%`**，注意 `slice(0, 7)` 只取 6 位 hex）。
 * 3. **`activeIndex` 为 `-1` 时所有渐变段都不加 `-inactive`**（判据是
 *    `activeIndex !== -1 && activeIndex !== index`）—— `-1` 是「浮层没开」的哨兵。
 * 4. **`style` prop 覆盖 `styles.root`**（顺序 `{...styles.root, ...style}`）。
 * 5. **透传属性要过 `pickAttrs`**（上游 `pickAttrs(rest)`）—— 只保留 DOM 合法的
 *    `aria-*` / `data-*` / 已知 HTML 属性，其余丢弃。
 */

import { useLocale } from '@apollo-design/locale';
import { isFunction, pickAttrs } from '@apollo-design/utils';
import { type CSSProperties, computed, h, useAttrs, type VNodeChild } from 'vue';
import { NodeRenderer } from '../../empty/components/NodeRenderer';
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
  style?: CSSProperties;
}

defineOptions({ name: 'AColorTrigger', inheritAttrs: false });

const props = withDefaults(defineProps<ColorTriggerProps>(), {
  disabled: undefined,
  format: undefined,
  open: undefined,
  showText: undefined,
  className: undefined,
  style: undefined,
});

const attrs = useAttrs();
const [locale] = useLocale('ColorPicker');

const colorTriggerPrefixCls = computed(() => `${props.prefixCls}-trigger`);
const colorTextPrefixCls = computed(() => `${colorTriggerPrefixCls.value}-text`);
const colorTextCellPrefixCls = computed(() => `${colorTextPrefixCls.value}-cell`);

/** 判据 2：五种分支。 */
const desc = computed<VNodeChild>(() => {
  if (!props.showText) {
    return '';
  }

  if (isFunction(props.showText)) {
    return props.showText(props.color);
  }

  if (props.color.cleared) {
    return locale.transparent;
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
const forwardedAttrs = computed(() => pickAttrs(attrs as Record<string, unknown>));

/** 判据 4。 */
const rootStyle = computed(() => ({ ...props.styles.root, ...props.style }));
</script>

<template>
  <div
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
    :style="[rootStyle, attrs.style]"
    v-bind="forwardedAttrs"
  >
    <component :is="container.is" v-bind="container.props" />
    <div
      v-if="showText"
      :class="[colorTextPrefixCls, classNames.description]"
      :style="styles.description"
    >
      <NodeRenderer :node="desc" />
    </div>
  </div>
</template>
