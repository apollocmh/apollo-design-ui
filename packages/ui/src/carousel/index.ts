/**
 * Carousel 的公共导出。
 *
 * 与 antd 的 `es/carousel/index.js` 对齐：默认导出 Carousel。antd 的 Carousel
 * 没有 `__ANT_*` 静态标记、没有子组件 ⇒ 不需要静态属性挂载。
 */

import { withInstall } from '../_internal/with-install';
import { CarouselComponent } from './Carousel';

/** Carousel 组件。注册名 `ACarousel`（COMPONENT-RULES.md 规则 R2）。 */
export const Carousel = withInstall(CarouselComponent);

export default Carousel;

export type {
  CarouselAfterChangeEventHandler,
  CarouselAutoplay,
  CarouselBeforeChangeEventHandler,
  CarouselChildren,
  CarouselDots,
  CarouselEffect,
  CarouselProps,
  CarouselRef,
  CarouselSwipeDirection,
  DotPlacement,
} from './interface';
export { genCarouselStyle, genTokenDecls as genCarouselTokenDecls } from './style';
export type { ComponentToken as CarouselComponentToken } from './style/token';
export { prepareComponentToken as prepareCarouselComponentToken } from './style/token';
