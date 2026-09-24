/**
 * Dragger —— antd `es/upload/Dragger.js` 行为等价物。
 *
 * `type='drag'` 预设：`hasControlInside=false`（根得 role=button/tabIndex）；
 * `height` 并入 style。
 */

import { defineComponent, h, type PropType } from 'vue';
import type { UploadFile, UploadProps } from './interface';
import { UploadComponent } from './Upload';

type CSSStyleLike = Record<string, string | number>;

/** antd 的 DraggerProps：`Omit<UploadProps, …> & { height?, style?, type? }` 的白名单外键排除。 */
export interface DraggerProps<T = unknown> extends Omit<UploadProps<T>, 'type'> {
  height?: number | string;
}

export const DraggerComponent = defineComponent({
  name: 'AUploadDragger',
  inheritAttrs: false,
  props: {
    height: { type: [Number, String] as PropType<number | string>, default: undefined },
    prefixCls: { type: String, default: undefined },
    disabled: { type: Boolean, default: undefined },
  },
  setup(props, { attrs, slots }) {
    return () => {
      const { height } = props;
      const style = (attrs.style ?? undefined) as CSSStyleLike | undefined;
      const mergedStyle: CSSStyleLike = { ...style, ...(height !== undefined ? { height } : {}) };
      const rest = { ...attrs } as Record<string, unknown>;
      delete rest.style;
      return h(
        UploadComponent,
        {
          ...rest,
          hasControlInside: false,
          style: mergedStyle,
          type: 'drag',
        } as never,
        slots.default ? { default: slots.default } : undefined,
      );
    };
  },
});

// 类型重导出（DraggerProps 供文档与消费方使用）
export type { UploadFile };
