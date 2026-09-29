/**
 * FormItemLabel —— Form.Item 的 label 列（antd `es/form/FormItemLabel.js` 100 行）。
 *
 * 判据：
 * 1. label 为空（null/undefined）不渲染整列；
 * 2. colon：`colon===true || (ctx!==false && colon!==false)`；vertical 布局无 colon；
 *    用户 label 尾部冒号去重（正则 `/[:|：]\s*$/`）；
 * 3. tooltip：convertToTooltipProps（bool ⇒ {title: bool}）；默认图标
 *    QuestionCircleOutlined，tabIndex=-1，onClick preventDefault；
 * 4. requiredMark 四形态：true/undefined ⇒ 红 *（CSS before）；'optional' ⇒ 非必填加
 *    `(optional)` 文案；fn ⇒ 自定义；false ⇒ `-item-required-mark-hidden`；
 * 5. label htmlFor=fieldId；title 仅 string label。
 */

import { QuestionCircleOutlined } from '@apollo-design/icons';
import { useLocale } from '@apollo-design/locale';
import type { PropType, VNodeChild } from 'vue';
import { computed, defineComponent, h } from 'vue';
import { Col } from '../grid';
import Tooltip from '../tooltip';
import { useFormContext } from './context';
import type { ColProps, FormItemProps, FormLabelAlign, RequiredMark } from './interface';

/**
 * rc-util 的 `isRenderable`（`_util/is` 的语义）：非 `null` / `undefined` / boolean。
 *
 * ⚠️ 与 `@apollo-design/utils` 的同名函数**判据不同**（那边把 `''` 也算不可渲染，
 *    因为 Alert 的 `title={''}` 场景需要它）；这里是 `isReactRenderable` 的语义，
 *    `''` 与 `0` 都算可渲染。
 */
function isRenderableNode(value: unknown): boolean {
  return value !== null && value !== undefined && typeof value !== 'boolean';
}

/**
 * antd `convertToTooltipProps(tooltip, context)` 逐字：
 *
 * ⚠️ 判据落在 **Item 级 `tooltip` prop** 上，不是合并后的 context ——
 *    `tooltip` 不可渲染时直接 `null`（context 只参与「可渲染时」的浅合并）。
 *    早期实现把判据放在 context 上，而 Form 的 `mergedTooltip()` 恒返回 `{}`（真值）
 *    ⇒ **每个 label 都多渲染一个问号图标**（L4 契约抓出来的，`form:basic` 用例）。
 */
function convertToTooltipProps(
  tooltip: unknown,
  contextTooltip: { title?: unknown; icon?: unknown } | undefined,
): { title?: unknown; icon?: unknown; children?: unknown } | null {
  if (!isRenderableNode(tooltip)) {
    return null;
  }
  if (typeof tooltip === 'object' && tooltip !== null) {
    return { ...(contextTooltip ?? {}), ...(tooltip as Record<string, unknown>) };
  }
  return { ...(contextTooltip ?? {}), title: tooltip };
}

const FormItemLabel = defineComponent({
  name: 'AFormItemLabel',
  props: {
    prefixCls: { type: String, required: true },
    label: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    htmlFor: { type: String, default: undefined },
    labelCol: { type: Object as PropType<ColProps>, default: undefined },
    labelAlign: { type: String as PropType<FormLabelAlign>, default: undefined },
    colon: { type: Boolean, default: undefined },
    required: { type: Boolean, default: undefined },
    requiredMark: {
      type: [Boolean, String, Function] as PropType<RequiredMark>,
      default: undefined,
    },
    tooltip: { type: null as unknown as PropType<FormItemProps['tooltip']>, default: undefined },
    vertical: { type: Boolean, default: false },
  },
  setup(props) {
    const formContext = useFormContext();
    // antd：`formLocale?.optional || defaultLocale.Form?.optional`
    // ⚠️ 文案来自 **locale**，不是硬编码 —— 早期实现写死 `'optional'`，
    //    en 下少了括号、zh 下整段是英文（L6 的 `form/label` 用例抓出来的）。
    const [formLocale] = useLocale('Form');
    const isLabelRenderable = computed(() => isRenderableNode(props.label));
    return () => {
      if (!isLabelRenderable.value) return null;

      const mergedLabelCol = props.labelCol ?? formContext.labelCol ?? {};
      const mergedLabelAlign = props.labelAlign ?? formContext.labelAlign;
      const labelClsBasic = `${props.prefixCls}-item-label`;
      const labelColClassName = [
        labelClsBasic,
        mergedLabelAlign === 'left' ? `${labelClsBasic}-left` : '',
        (mergedLabelCol as { className?: string }).className ?? '',
        formContext.labelWrap ? `${labelClsBasic}-wrap` : '',
      ]
        .filter(Boolean)
        .join(' ');

      let labelChildren: VNodeChild = props.label;
      // Keep label is original where there should have no colon
      const computedColon =
        props.colon === true || (formContext.colon !== false && props.colon !== false);
      const haveColon = computedColon && !props.vertical;
      if (haveColon && typeof props.label === 'string' && props.label.trim()) {
        labelChildren = props.label.replace(/[:|：]\s*$/, '');
      }

      const tooltipProps = convertToTooltipProps(props.tooltip, formContext.tooltip);
      if (tooltipProps) {
        // antd 逐字：`tooltipProps.icon || tooltipProps.children || <QuestionCircleOutlined/>`
        // ⚠️ 用 `children` 不是 `title` —— `title` 是**气泡内容**，拿它当指示器
        //    会渲染成一个字符串节点（`form:label-tooltip` 契约用例抓出来的）。
        const indicator =
          (tooltipProps.icon as VNodeChild) ??
          (tooltipProps.children as VNodeChild) ??
          h(QuestionCircleOutlined);
        const { icon: _icon, children: _children, ...tooltipRest } = tooltipProps;
        labelChildren = [
          labelChildren,
          h(
            Tooltip as never,
            { ...(tooltipRest as Record<string, unknown>) } as never,
            {
              default: () =>
                h(
                  'span',
                  {
                    class: `${props.prefixCls}-item-tooltip`,
                    onClick: (e: MouseEvent) => {
                      e.preventDefault();
                    },
                    tabindex: -1,
                  },
                  [indicator],
                ),
            } as never,
          ),
        ];
      }

      // Required Mark
      const isOptionalMark = props.requiredMark === 'optional';
      const isRenderMark = typeof props.requiredMark === 'function';
      const hideRequiredMark = props.requiredMark === false;
      if (isRenderMark) {
        labelChildren = (
          props.requiredMark as (l: VNodeChild, i: { required: boolean }) => VNodeChild
        )(labelChildren, { required: !!props.required });
      } else if (isOptionalMark && !props.required) {
        labelChildren = [
          labelChildren,
          h('span', { class: `${props.prefixCls}-item-optional` }, formLocale?.optional),
        ];
      }

      let markType: string | undefined;
      if (hideRequiredMark) {
        markType = 'hidden';
      } else if (isOptionalMark || isRenderMark) {
        markType = 'optional';
      }

      const labelClassName = [
        formContext.classNames?.label,
        props.required ? `${props.prefixCls}-item-required` : '',
        markType ? `${props.prefixCls}-item-required-mark-${markType}` : '',
        !computedColon ? `${props.prefixCls}-item-no-colon` : '',
      ]
        .filter(Boolean)
        .join(' ');

      return h(
        Col,
        {
          ...(mergedLabelCol as Record<string, unknown>),
          className: labelColClassName,
        },
        {
          default: () =>
            h(
              'label',
              {
                for: props.htmlFor,
                class: labelClassName,
                style: formContext.styles?.label,
                title: typeof props.label === 'string' ? props.label : undefined,
              },
              [labelChildren],
            ),
        },
      );
    };
  },
});

export default FormItemLabel;
