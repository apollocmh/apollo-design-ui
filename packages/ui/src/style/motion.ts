import { type SharedStylePart, type StyleSource, styleSource } from './source';

export const SLIDE_KEYFRAMES: SharedStylePart = {
  name: 'slide-keyframes',
  resource: 'slide-keyframes',
  css: `
@keyframes apollo-slide-up-in{0%{transform:scaleY(0.8);transform-origin:0% 0%;opacity:0;}100%{transform:scaleY(1);transform-origin:0% 0%;opacity:1;}}
@keyframes apollo-slide-down-in{0%{transform:scaleY(0.8);transform-origin:100% 100%;opacity:0;}100%{transform:scaleY(1);transform-origin:100% 100%;opacity:1;}}
@keyframes apollo-slide-up-out{0%{transform:scaleY(1);transform-origin:0% 0%;opacity:1;}100%{transform:scaleY(0.8);transform-origin:0% 0%;opacity:0;}}
@keyframes apollo-slide-down-out{0%{transform:scaleY(1);transform-origin:100% 100%;opacity:1;}100%{transform:scaleY(0.8);transform-origin:100% 100%;opacity:0;}}`,
};

function slideParts(direction: 'up' | 'down') {
  const cls = `.apollo-slide-${direction}`;
  const duration: SharedStylePart = {
    name: `slide-${direction}-duration`,
    resource: 'slide-motion',
    css: `${cls}-enter,${cls}-appear{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
${cls}-leave{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}`,
  };
  const transform: SharedStylePart = {
    name: `slide-${direction}-transform`,
    resource: 'slide-motion',
    css: `${cls}-enter,${cls}-appear{transform:scale(0);transform-origin:0% 0%;opacity:0;animation-timing-function:var(--apollo-motion-ease-out-quint);}
${cls}-enter-prepare,${cls}-appear-prepare{transform:scale(1);}
${cls}-leave{animation-timing-function:var(--apollo-motion-ease-in-quint);}`,
  };
  const active = (
    prefix: string,
  ) => `${cls}-enter${cls}-enter-active,${cls}-appear${cls}-appear-active{animation-name:${prefix}-slide-${direction}-in;animation-play-state:running;}
${cls}-leave${cls}-leave-active{animation-name:${prefix}-slide-${direction}-out;animation-play-state:running;pointer-events:none;}`;
  const defaultActive: SharedStylePart = {
    name: `slide-${direction}-active`,
    resource: 'slide-active',
    css: active('apollo'),
  };
  return {
    shared: styleSource`${duration}
${defaultActive}
${transform}`,
    owned: (prefix: string): StyleSource => styleSource`${duration}
${active(prefix)}
${transform}`,
  };
}
const up = slideParts('up');
const down = slideParts('down');
export const SLIDE_MOTION = styleSource`${up.shared}
${down.shared}`;
export const genSlideUpSource = up.owned;
export const genSlideDownSource = down.owned;

/** Shared phase properties only; each owner retains its actual animation-name rules. */
export function genZoomMotionSource(kind: 'big' | 'big-fast', keyframes: string): StyleSource {
  const cls = `.apollo-zoom-${kind}`;
  const speed = kind === 'big-fast' ? 'fast' : 'mid';
  const duration: SharedStylePart = {
    name: `zoom-${kind}-duration`,
    resource: 'zoom-motion',
    css: `${cls}-enter,${cls}-appear{animation-duration:var(--apollo-motion-duration-${speed});animation-fill-mode:both;animation-play-state:paused;}
${cls}-leave{animation-duration:var(--apollo-motion-duration-${speed});animation-fill-mode:both;animation-play-state:paused;}`,
  };
  const transform: SharedStylePart = {
    name: `zoom-${kind}-transform`,
    resource: 'zoom-motion',
    css: `${cls}-enter,${cls}-appear{transform:scale(0);opacity:0;animation-timing-function:var(--apollo-motion-ease-out-circ);}
${cls}-enter-prepare,${cls}-appear-prepare{transform:none;}
${cls}-leave{animation-timing-function:var(--apollo-motion-ease-in-out-circ);}`,
  };
  return styleSource`${duration}
${cls}-enter${cls}-enter-active,${cls}-appear${cls}-appear-active{animation-name:${keyframes}-zoom-big-in;animation-play-state:running;}
${cls}-leave${cls}-leave-active{animation-name:${keyframes}-zoom-big-out;animation-play-state:running;pointer-events:none;}
${transform}`;
}

export const TREE_KEYFRAMES: SharedStylePart = {
  name: 'tree-keyframes',
  resource: 'tree-motion',
  css: '\n@keyframes apollo-tree-node-fx{0%{opacity:0;}100%{opacity:1;}}',
};
