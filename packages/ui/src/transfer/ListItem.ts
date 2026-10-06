/**
 * ListItem —— Transfer 列表的单行。
 *
 * 契约来源：antd 6.6.4 `es/transfer/ListItem.js`（**机械移植**）。
 *
 * 两种形态：
 *  - `showRemove`（oneWay 右列）：行内容 + 删除按钮（`aria-label` 走 locale.remove）；
 *  - 默认：checkbox（展示勾选态，点击由**行本体的 onClick** 承担）+ 行内容。
 *
 * ⚠️ disabled 的判定是 `disabled || item.disabled` 双路合并（面板级 + 行级）。
 */

import { DeleteOutlined } from '@apollo-design/icons';
import { useLocale } from '@apollo-design/locale';
import { computed, defineComponent, h, type PropType, type VNodeChild } from 'vue';
import Checkbox from '../checkbox/Checkbox';
import type { TransferItem, TransferSemanticClassNames, TransferSemanticStyles } from './interface';

const ListItem = defineComponent({
  name: 'ATransferListItem',
  props: {
    prefixCls: { type: String, required: true },
    classNames: { type: Object as PropType<TransferSemanticClassNames>, default: undefined },
    styles: { type: Object as PropType<TransferSemanticStyles>, default: undefined },
    renderedText: { type: [String, Number], default: undefined },
    renderedEl: { type: null as unknown as PropType<VNodeChild>, default: undefined },
    item: { type: Object as PropType<TransferItem>, required: true },
    checked: { type: Boolean, default: undefined },
    disabled: { type: Boolean, default: undefined },
    showRemove: { type: Boolean, default: undefined },
    removeLabel: { type: String, default: undefined },
    onClick: {
      type: Function as PropType<(item: TransferItem, e: MouseEvent) => void>,
      default: undefined,
    },
    onRemove: {
      type: Function as PropType<(item: TransferItem) => void>,
      default: undefined,
    },
  },
  setup(props) {
    const [contextLocale] = useLocale('Transfer');
    const mergedDisabled = computed(() => props.disabled || !!props.item?.disabled);
    const classes = computed(() => ({
      [`${props.prefixCls}-content-item`]: true,
      [`${props.prefixCls}-content-item-disabled`]: mergedDisabled.value,
      [`${props.prefixCls}-content-item-checked`]: !!props.checked && !mergedDisabled.value,
      ...(props.classNames?.item ? { [props.classNames.item as string]: true } : {}),
    }));
    const title = computed(() => {
      const rt = props.renderedText;
      if (typeof rt === 'string' || typeof rt === 'number') return String(rt);
      return undefined;
    });

    return () => {
      const p = props.prefixCls;
      const labelNode = h(
        'span',
        {
          class: [`${p}-content-item-text`, props.classNames?.itemContent as string | undefined],
          style: props.styles?.itemContent,
        },
        props.renderedEl as never,
      );

      if (props.showRemove) {
        return h('li', { class: classes.value, style: props.styles?.item, title: title.value }, [
          labelNode,
          h(
            'button',
            {
              type: 'button',
              disabled: mergedDisabled.value,
              class: `${p}-content-item-remove`,
              'aria-label': props.removeLabel ?? contextLocale?.remove,
              onClick: () => props.onRemove?.(props.item),
            },
            h(DeleteOutlined),
          ),
        ]);
      }

      return h(
        'li',
        {
          class: classes.value,
          style: props.styles?.item,
          title: title.value,
          onClick: mergedDisabled.value
            ? undefined
            : (event: MouseEvent) => props.onClick?.(props.item, event),
        },
        [
          h(Checkbox, {
            // Checkbox 已迁移到「根 class 走原生 attrs」⇒ 这里用 `class`
            class: props.classNames?.itemIcon
              ? `${p}-checkbox ${props.classNames.itemIcon}`
              : `${p}-checkbox`,
            // ⚠️ Checkbox 的语义 `styles.root` 落在 label（wrapper）上 —— antd 的
            //    `styles.itemIcon` 同样落在 checkbox wrapper（antd SSR 逐字对拍）。
            styles: props.styles?.itemIcon ? { root: props.styles.itemIcon } : undefined,
            checked: props.checked,
            disabled: mergedDisabled.value,
            // 有意增强（超出 antd）：原生 input 经 attrs 透传 aria-label，
            // 否则行 checkbox 无可访问名（axe `label` 规则违规）。
            'aria-label': title.value,
          } as never),
          labelNode,
        ],
      );
    };
  },
});

export default ListItem;
