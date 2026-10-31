import type { ComponentObjectPropsOptions, PropType, VNodeChild } from 'vue';

// Nameable public Vue metadata preserves nullable/boolean VNodeChild without Boolean coercion.
type ContentMetadata = Pick<
  Exclude<
    ComponentObjectPropsOptions<{ value: VNodeChild }>['value'],
    PropType<VNodeChild> | null | undefined
  >,
  'type' | 'default'
>;
export const contentProp: ContentMetadata = { type: null, default: undefined };
