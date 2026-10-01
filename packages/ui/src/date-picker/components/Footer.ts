/**
 * 浮层页脚（`-footer`）—— 「此刻 / 今天」按钮 + `OK` 按钮 + 自定义扩展。
 *
 * 上游：`@rc-component/picker@1.12.2` 的 `es/PickerInput/Popup/Footer.js`（78 行）。
 *
 * ── 它在浮层的哪一层 ────────────────────────────────────────────────────────
 *
 * ```
 * div.{p}-panel-container
 *   └─ div.{p}-panel-layout
 *       ├─ PresetPanel          ← 未移植（`presets` 属 S5 剩余）
 *       └─ div                 ← 🚨 本组件与 `PickerPanel` **同层**，不是它的子节点
 *           ├─ PickerPanel
 *           └─ Footer（本文件）
 * ```
 *
 * ⇒ `DatePicker.vue` 的 `popupVNode` 里那个「无类名的 div」必须同时装这两者。
 *
 * ── 渲染的完整条件（三个各自独立的开关）─────────────────────────────────────
 *
 * | 节点 | 条件 |
 * |---|---|
 * | 整个 `-footer` | `renderExtraFooter` 可渲染 **或** `-ranges` 可渲染；否则 `return null` |
 * | `-ranges > -now`（`<li>` + `<a>`） | `showNow`（由 `useShowNow` 算，见 `DatePicker.vue`） |
 * | `-ranges > -ok`（`<li>` + `Button`） | `needConfirm` |
 *
 * 🚨 **两个都不满足时返回 `null`（不是渲染空 div）** —— 上游最后那段
 * `if (!isReactRenderable(extraNode) && !isReactRenderable(rangeNode)) return null;`。
 * 这条决定了 `month` / `year` / `multiple` 三个变体**根本没有页脚**
 * （L6 实测：它们的 antd 基线容器高 **309**，而 `basic` 是 **348**，差的 39px 就是页脚）。
 *
 * ── 文案取谁 ────────────────────────────────────────────────────────────────
 *
 * `internalMode === 'date' ? locale.today : locale.now` —— 注意判据是 **`internalMode`**
 * （组件粒度，含 `'datetime'`），**不是**面板当前粒度 `mode`。所以
 * `date + showTime` 的 `datetime` 变体显示的是 **`Now`** 而不是 `Today`
 * （L6 基线截图已核对）。
 */

import type { PickerLangLocale } from '@apollo-design/locale';
import {
  type DisabledDate,
  type GenerateConfig,
  getTimeInfo,
  type PanelDateType,
  type PanelMode,
  type TimePanelConfig,
} from '@apollo-design/picker';
import { isRenderable } from '@apollo-design/utils';
import { computed, defineComponent, h, type PropType, type VNodeChild } from 'vue';
import Button from '../../button/Button.vue';
import type { PickerPopupSemanticClassNames, PickerPopupSemanticStyles } from '../interface';

export interface FooterProps {
  prefixCls: string;
  /** 面板当前粒度（上游 `mergedMode`）—— 只用于 `renderExtraFooter(mode)` */
  mode: PanelMode;
  /** 组件粒度（含 `'datetime'`）—— 决定 `Today` / `Now` 文案 */
  internalMode: PanelMode | 'datetime';
  renderExtraFooter?: (mode: PanelMode) => VNodeChild;
  showNow?: boolean;
  /** `showTime` 原样（`getTimeInfo` 的入参，用来校验「此刻」是否被禁用时段挡住） */
  showTime?: boolean | TimePanelConfig<PanelDateType>;
  needConfirm: boolean;
  /** `OK` 按钮是否禁用（上游 `Popup` 的 `disableSubmit`） */
  invalid: boolean;
  generateConfig: GenerateConfig<PanelDateType>;
  disabledDate?: DisabledDate<PanelDateType>;
  /** 完整语言包（`today` / `now` / `ok` 在这里，**不在** `PickerLocale` 里） */
  locale: PickerLangLocale;
  classNames?: PickerPopupSemanticClassNames;
  styles?: PickerPopupSemanticStyles;
  onNow: (date: PanelDateType) => void;
  onSubmit: () => void;
}

export const Footer = defineComponent({
  name: 'ApolloPickerFooter',
  props: {
    prefixCls: { type: String, required: true as const },
    mode: { type: String as PropType<FooterProps['mode']>, required: true as const },
    internalMode: {
      type: String as PropType<FooterProps['internalMode']>,
      required: true as const,
    },
    renderExtraFooter: {
      type: Function as PropType<FooterProps['renderExtraFooter']>,
      default: undefined,
    },
    // ⚠️ Boolean 必须显式 `undefined` 默认值（PITFALLS 2）：`undefined` = 不渲染
    showNow: { type: Boolean as PropType<boolean | undefined>, default: undefined },
    showTime: {
      type: [Boolean, Object] as PropType<FooterProps['showTime']>,
      default: undefined,
    },
    needConfirm: { type: Boolean as PropType<boolean>, default: false },
    invalid: { type: Boolean as PropType<boolean>, default: false },
    generateConfig: {
      type: Object as PropType<GenerateConfig<PanelDateType>>,
      required: true as const,
    },
    disabledDate: {
      type: Function as PropType<DisabledDate<PanelDateType> | undefined>,
      default: undefined,
    },
    locale: { type: Object as PropType<PickerLangLocale>, required: true as const },
    classNames: {
      type: Object as PropType<PickerPopupSemanticClassNames | undefined>,
      default: undefined,
    },
    styles: {
      type: Object as PropType<PickerPopupSemanticStyles | undefined>,
      default: undefined,
    },
    onNow: { type: Function as PropType<FooterProps['onNow']>, required: true as const },
    onSubmit: { type: Function as PropType<FooterProps['onSubmit']>, required: true as const },
  },
  setup(props) {
    /** 「此刻」是否被 `disabledDate` 挡住（上游 `nowDisabled`）。 */
    const nowDisabled = computed(
      () => props.disabledDate?.(props.generateConfig.getNow(), { type: props.mode }) === true,
    );

    /**
     * 把「此刻」修正到**未被禁用时段**的最近一刻再提交（上游 `useTimeInfo` 的 `getValidTime`）。
     *
     * ⚠️ 这段只在 `showTime` 存在时才有意义；`getTimeInfo` 的档位表由 `showTime`
     * 决定，日期选择器（无时间）下它是恒等变换。
     */
    const onInternalNow = (): void => {
      if (nowDisabled.value) {
        return;
      }
      const now = props.generateConfig.getNow();
      // ⚠️ `showTime: true` 要归一成 `undefined` —— 上游 `useTimeInfo` 是对 `props`
      //    **解构**的（`const { use12Hours, … } = props || {}`），对 `true` 解构
      //    得到全 `undefined`，等价于不传。直接传 `true` 类型也不对。
      const timeConfig = typeof props.showTime === 'object' ? props.showTime : undefined;
      const { getValidTime } = getTimeInfo(props.generateConfig, timeConfig, now);
      props.onNow(getValidTime(now));
    };

    return () => {
      const { prefixCls } = props;

      // ========================== Extra ==========================
      const extraNode = props.renderExtraFooter?.(props.mode);

      // ========================= Ranges =========================
      const nowCls = `${prefixCls}-now`;
      const nowBtnCls = `${nowCls}-btn`;
      const presetNode = props.showNow
        ? h('li', { class: nowCls }, [
            h(
              'a',
              {
                class: [nowBtnCls, nowDisabled.value ? `${nowBtnCls}-disabled` : undefined],
                'aria-disabled': nowDisabled.value,
                onClick: onInternalNow,
              },
              // 🚨 判据是 `internalMode`（组件粒度），不是面板当前粒度
              props.internalMode === 'date' ? props.locale.today : props.locale.now,
            ),
          ])
        : null;

      const okNode = props.needConfirm
        ? h('li', { class: `${prefixCls}-ok` }, [
            h(
              Button,
              { size: 'small', type: 'primary', disabled: props.invalid, onClick: props.onSubmit },
              () => props.locale.ok,
            ),
          ])
        : null;

      const rangeNode =
        presetNode || okNode
          ? h('ul', { class: `${prefixCls}-ranges` }, [presetNode, okNode])
          : null;

      // ========================= Render =========================
      // 🚨 两者都不可渲染 ⇒ **返回 null**（不是空 div）—— 见文件头
      if (!isRenderable(extraNode) && !isRenderable(rangeNode)) {
        return null;
      }

      return h(
        'div',
        {
          class: [`${prefixCls}-footer`, props.classNames?.footer],
          style: props.styles?.footer,
        },
        [
          isRenderable(extraNode)
            ? h('div', { class: `${prefixCls}-footer-extra` }, [extraNode])
            : null,
          rangeNode,
        ],
      );
    };
  },
});

export default Footer;
