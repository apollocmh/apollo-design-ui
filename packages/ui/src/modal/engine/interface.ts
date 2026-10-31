import type { VNodeChild } from 'vue';
import type { ModalPanelRef, ModalSlots } from '../interface';

export interface DialogClosableConfig {
  closeIcon?: VNodeChild;
  disabled?: boolean;
  afterClose?: () => void;
  'aria-label'?: string;
  [key: string]: unknown;
}
export type DialogClosable = boolean | DialogClosableConfig | null;
export type DialogSlots = Pick<ModalSlots, 'default' | 'modalRender'>;
export type { ModalPanelRef };
