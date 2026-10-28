/**
 * Shared static slide-up/down phase rules, originally extracted from Select.
 * Callers retain their own keyframes; no component layout or paint is included.
 * Keep generation inside this function so unused CSS is removable from consumer JS.
 */
export function genSlideMotionStyle(): string {
  return `
.apollo-slide-up-enter,.apollo-slide-up-appear{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-slide-up-leave{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-slide-up-enter.apollo-slide-up-enter-active,.apollo-slide-up-appear.apollo-slide-up-appear-active{animation-name:apollo-slide-up-in;animation-play-state:running;}
.apollo-slide-up-leave.apollo-slide-up-leave-active{animation-name:apollo-slide-up-out;animation-play-state:running;pointer-events:none;}
.apollo-slide-up-enter,.apollo-slide-up-appear{transform:scale(0);transform-origin:0% 0%;opacity:0;animation-timing-function:var(--apollo-motion-ease-out-quint);}
.apollo-slide-up-enter-prepare,.apollo-slide-up-appear-prepare{transform:scale(1);}
.apollo-slide-up-leave{animation-timing-function:var(--apollo-motion-ease-in-quint);}
.apollo-slide-down-enter,.apollo-slide-down-appear{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-slide-down-leave{animation-duration:var(--apollo-motion-duration-mid);animation-fill-mode:both;animation-play-state:paused;}
.apollo-slide-down-enter.apollo-slide-down-enter-active,.apollo-slide-down-appear.apollo-slide-down-appear-active{animation-name:apollo-slide-down-in;animation-play-state:running;}
.apollo-slide-down-leave.apollo-slide-down-leave-active{animation-name:apollo-slide-down-out;animation-play-state:running;pointer-events:none;}
.apollo-slide-down-enter,.apollo-slide-down-appear{transform:scale(0);transform-origin:0% 0%;opacity:0;animation-timing-function:var(--apollo-motion-ease-out-quint);}
.apollo-slide-down-enter-prepare,.apollo-slide-down-appear-prepare{transform:scale(1);}
.apollo-slide-down-leave{animation-timing-function:var(--apollo-motion-ease-in-quint);}`;
}
