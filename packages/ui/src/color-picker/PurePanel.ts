/**
 * `PurePanel` —— antd `genPurePanel(ColorPicker, undefined, props => ({...props,
 * placement: 'bottom', autoAdjustOverflow: false}), 'color-picker', prefixCls => prefixCls)`
 * 的 Vue 版（`components/_util/PurePanel.tsx` 的移植）。
 *
 * `_InternalPanelDoNotUseOrYouWillBeFired` 静态面板（demo / 文档用）：
 * **不渲染浮层定位**，直接把面板挂在一个 `position: relative` 的 holder 里。
 *
 * ── 上游工厂做四件事（逐条对齐）────────────────────────────────────────────────
 *
 * 1. `open` 在**挂载后**强制为 `true`（`useControlledState(false, props.open)` + effect）。
 * 2. `getPopupContainer: () => holderRef.current` —— 浮层**不 portal 到 body**，
 *    而是落在 holder 里（这样它跟着页面流走）。
 * 3. `postProps`：`placement: 'bottom'`、`autoAdjustOverflow: false`（ColorPicker 专属）。
 * 4. 用 `ResizeObserver` 量浮层的 `offsetHeight/offsetWidth`，把
 *    `paddingBottom: height + 8` 与 `minWidth: width` 写到 holder 上
 *    —— 否则浮层会盖住后面的内容。
 *
 * ── 本仓的两处**有意**省略（都登记为缺口）──────────────────────────────────────
 *
 * 1. **不包 `withPureRenderTheme`**（上游包一层 `ConfigProvider theme={{token:{motion:false,
 *    zIndexPopupBase:0}}}`）—— 本仓 `dropdown/PurePanel.ts` / `popover/PurePanel.ts`
 *    同样没包，保持仓内一致。
 * 2. `style` 的 `margin: 0` 覆写照做；但 `alignPropName` 分支不适用（ColorPicker 不传它）。
 */

import { useControlledValue } from '@apollo-design/utils';
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
  type VNodeChild,
} from 'vue';
import { useComponentConfig } from '../config-provider/context';
import ColorPicker from './ColorPicker.vue';
import type { ColorPickerProps } from './interface';

type StyleLike = Record<string, string | number>;

export const PurePanel = defineComponent({
  name: 'AColorPickerPurePanel',
  inheritAttrs: false,
  props: {
    prefixCls: { type: String, default: undefined },
    style: { type: Object as PropType<StyleLike>, default: undefined },
    open: { type: Boolean, default: undefined },
    /** 其余 ColorPicker props 原样透传。 */
    colorPickerProps: { type: Object as PropType<Partial<ColorPickerProps>>, default: undefined },
  },
  setup(props) {
    const { getPrefixCls } = useComponentConfig('color-picker');
    const prefixCls = computed(() => getPrefixCls('color-picker', props.prefixCls));

    const holderRef = ref<HTMLDivElement | null>(null);
    const popupHeight = ref(0);
    const popupWidth = ref(0);

    const [open, setOpen] = useControlledValue<boolean>({
      defaultValue: () => false,
      getValue: () => props.open,
    });

    let timer: ReturnType<typeof setInterval> | undefined;
    let observer: ResizeObserver | undefined;

    onMounted(() => {
      // 1. 挂载后强制打开（上游「不关心 SSR」）
      setOpen(true);

      // 4. 量浮层尺寸
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver((entries) => {
          const target = entries[0]?.target as HTMLElement | undefined;
          if (!target) {
            return;
          }
          popupHeight.value = target.offsetHeight + 8;
          popupWidth.value = target.offsetWidth;
        });

        timer = setInterval(() => {
          // `getDropdownCls` 对 ColorPicker 是恒等函数 ⇒ `.${prefixCls}`
          const popup = holderRef.value?.querySelector(`.${prefixCls.value}`);
          if (popup) {
            if (timer !== undefined) {
              clearInterval(timer);
            }
            observer?.observe(popup);
          }
        }, 10);
      }
    });

    onBeforeUnmount(() => {
      if (timer !== undefined) {
        clearInterval(timer);
      }
      observer?.disconnect();
    });

    return (): VNodeChild => {
      const holderStyle: StyleLike = {
        paddingBottom: `${popupHeight.value}px`,
        position: 'relative',
        minWidth: `${popupWidth.value}px`,
      };

      const mergedProps: Record<string, unknown> = {
        ...(props.colorPickerProps ?? {}),
        style: { ...(props.style ?? {}), margin: 0 },
        open: open.value,
        getPopupContainer: () => holderRef.value as HTMLElement,
        // 3. postProps
        placement: 'bottom',
        autoAdjustOverflow: false,
      };

      return h('div', { ref: holderRef, style: holderStyle }, [
        h(ColorPicker, mergedProps as never),
      ]);
    };
  },
});

export default PurePanel;
