<script lang="ts">
/**
 * Form.List —— 列表字段（antd `es/form/FormList.js` 37 行的 Vue 等价物）。
 *
 * 消费 form-core 的 `List`；scoped slot 载荷是**单对象** `{ fields, operations, meta }`；
 * fields 补 `fieldKey: field.key`；meta 只透传 errors/warnings；
 * name 缺失告警（antd 逐字）。Form.Item 的 noStyle 聚合依赖 ListContext
 * （form-core List 已 provide），本组件只做 prefixCls 前缀与 prefix context。
 */

import { List, type ListSlots, listProps } from '@apollo-design/form-core';
import { computed, defineComponent, h, provide, type SlotsType } from 'vue';
import { useComponentConfig } from '../config-provider/context';
import { formItemPrefixContextKey } from './context';
import type { FormListSlots } from './interface';

export default defineComponent({
  name: 'AFormList',
  inheritAttrs: false,
  props: {
    ...listProps,
    prefixCls: { type: String, default: undefined },
  },
  slots: Object as SlotsType<FormListSlots>,
  setup(props, { slots }) {
    const { getPrefixCls } = useComponentConfig('form');
    const prefixCls = computed(() => getPrefixCls('form', props.prefixCls));

    // FormItemPrefixContext（prefixCls + status:'error'，antd 逐字）
    provide(formItemPrefixContextKey, {
      get prefixCls() {
        return prefixCls.value;
      },
      status: 'error',
    });

    return () => {
      return h(List, props, {
        default: ({
          fields,
          operations,
          meta,
        }: Parameters<NonNullable<ListSlots['default']>>[0]) => {
          const allFields = fields.map((field) => ({
            ...field,
            fieldKey: field.key,
          }));
          return slots.default?.({
            fields: allFields,
            operations,
            meta: { errors: meta.errors, warnings: meta.warnings },
          });
        },
      });
    };
  },
});
</script>
