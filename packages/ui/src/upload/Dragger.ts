import { defineComponent, h, type PropType, type SlotsType, shallowRef } from 'vue';
import type { UploadFile, UploadProps, UploadRef, UploadSlots } from './interface';
import { UploadComponent, uploadEmits, uploadProps } from './Upload';

export interface DraggerProps<T = unknown> extends Omit<UploadProps<T>, 'type'> {
  height?: number | string;
}

export const DraggerComponent = defineComponent({
  name: 'AUploadDragger',
  inheritAttrs: false,
  expose: [
    'nativeElement',
    'fileList',
    'upload',
    'onBatchStart',
    'onSuccess',
    'onProgress',
    'onError',
  ],
  props: {
    ...uploadProps,
    height: { type: [Number, String] as PropType<number | string>, default: undefined },
    hasControlInside: { type: Boolean, default: false },
  },
  emits: uploadEmits,
  slots: Object as SlotsType<UploadSlots>,
  setup(props, { attrs, slots, emit }) {
    const upload = shallowRef<UploadRef | null>(null);
    const exposed: UploadRef = {
      get nativeElement() {
        return upload.value?.nativeElement ?? null;
      },
      get fileList() {
        return upload.value?.fileList ?? [];
      },
      get upload() {
        return upload.value?.upload ?? null;
      },
      onBatchStart: (...args) => upload.value?.onBatchStart(...args),
      onSuccess: (...args) => upload.value?.onSuccess(...args),
      onProgress: (...args) => upload.value?.onProgress(...args),
      onError: (...args) => upload.value?.onError(...args),
    };
    const renderDragger = () => {
      const { height, ...rest } = props;
      return h(
        UploadComponent,
        {
          ...attrs,
          ...rest,
          ref: upload,
          type: 'drag',
          style: [
            attrs.style,
            height !== undefined
              ? { height: typeof height === 'number' ? `${height}px` : height }
              : undefined,
          ],
          'onUpdate:fileList': (files: UploadFile[]) => emit('update:fileList', files),
          onChange: (info) => emit('change', info),
          onDrop: (event) => emit('drop', event),
        },
        slots,
      );
    };
    return {
      get nativeElement() {
        return exposed.nativeElement;
      },
      get fileList() {
        return exposed.fileList;
      },
      get upload() {
        return exposed.upload;
      },
      onBatchStart: exposed.onBatchStart,
      onSuccess: exposed.onSuccess,
      onProgress: exposed.onProgress,
      onError: exposed.onError,
      renderDragger,
    };
  },
  render() {
    return this.renderDragger();
  },
});

export type { UploadFile };
