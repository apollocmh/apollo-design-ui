<script lang="ts">
/**
 * Form.List —— 列表字段（antd `es/form/FormList.js` 37 行的 Vue 等价物）。
 *
 * 消费 form-core 的 `List`；scoped slot `(fields, operation, meta)`；
 * fields 补 `fieldKey: field.key`；meta 只透传 errors/warnings；
 * name 缺失告警（antd 逐字）。Form.Item 的 noStyle 聚合依赖 ListContext
 * （form-core List 已 provide），本组件只做 prefixCls 前缀与 prefix context。
 */

import { List, listProps } from '@apollo-design/form-core';
import { computed, defineComponent, h, inject, type PropType, provide } from 'vue';
import { useComponentConfig } from '../config-provider/context';
import { formItemPrefixContextKey } from './context';

export default defineComponent({
  name: 'AFormList',
  inheritAttrs: false,
  props: {
    ...listProps,
    prefixCls: { type: String, default: undefined },
  },
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
      return h(List as never, { ...(props as Record<string, unknown>) } as never, {
        default: (fields: unknown, operation: unknown, meta: unknown) => {
          const allFields = (fields as { key: number }[]).map((field) => ({
            ...(field as object),
            fieldKey: field.key,
          }));
          void inject;
          return slots.default?.(
            allFields as never,
            operation as never,
            ((meta as { errors?: unknown[]; warnings?: unknown[] }) ?? {}) as never,
          );
        },
      });
    };
  },
});
</script>
