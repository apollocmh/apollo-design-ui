import { SLIDE_MOTION } from './motion';
import { styleSource } from './source';

/**
 * Shared static slide-up/down phase rules, originally extracted from Select.
 * Callers retain their own keyframes; no component layout or paint is included.
 * Keep generation inside this function so unused CSS is removable from consumer JS.
 */
export function genSlideMotionStyle(): string {
  return genSlideMotionSource().css;
}

export function genSlideMotionSource() {
  return styleSource`\n${SLIDE_MOTION}`;
}
