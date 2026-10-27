import { h, isVNode, toRaw, type VNodeChild } from 'vue';
import type { EmptyImage } from '../interface';

/** Only a top-level string is an image URL; all other Vue content keeps its own meaning. */
export function imageContent(image: EmptyImage, alt: string): VNodeChild {
  if (typeof image === 'string') {
    return image ? h('img', { draggable: false, alt, src: image }) : undefined;
  }
  if (
    image &&
    !Array.isArray(image) &&
    !isVNode(image) &&
    (typeof image === 'object' || typeof image === 'function')
  ) {
    return h(toRaw(image));
  }
  return image;
}
