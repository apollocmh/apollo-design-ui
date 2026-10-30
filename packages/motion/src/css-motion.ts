import { getElement } from '@apollo-design/utils';
import {
  Comment,
  type CSSProperties,
  cloneVNode,
  defineComponent,
  Fragment,
  isVNode,
  type PropType,
  type SlotsType,
  Text,
  type VNode,
  type VNodeChild,
} from 'vue';
import type { MotionHooks } from './driver';
import type { MotionStatus, StepStatus } from './status';
import { detectSupportMotion } from './support';
import { useMotionStatus } from './use-motion-status';

export interface CSSMotionProps {
  visible?: boolean;
  motionName?: string;
  motionAppear?: boolean;
  motionEnter?: boolean;
  motionLeave?: boolean;
  motionLeaveImmediately?: boolean;
  motionDeadline?: number;
  removeOnLeave?: boolean;
  forceRender?: boolean;
  leavedClassName?: string;
  hooks?: MotionHooks;
  supportMotion?: boolean;
  onVisibleChanged?: (visible: boolean) => void;
}
export interface CSSMotionSlotProps {
  className: string;
  style: CSSProperties | null;
  visible: boolean;
  status: MotionStatus;
  step: StepStatus;
}
export interface CSSMotionSlots {
  default?: (scope: CSSMotionSlotProps) => VNodeChild;
}

/** Shared runtime declarations keep the list's per-item animation contract identical. */
export const motionProps = {
  motionName: { type: String, default: undefined },
  motionAppear: { type: Boolean, default: true },
  motionEnter: { type: Boolean, default: true },
  motionLeave: { type: Boolean, default: true },
  motionLeaveImmediately: { type: Boolean, default: false },
  motionDeadline: { type: Number, default: 0 },
  removeOnLeave: { type: Boolean, default: true },
  forceRender: { type: Boolean, default: false },
  leavedClassName: { type: String, default: undefined },
  hooks: { type: Object as PropType<MotionHooks>, default: undefined },
  supportMotion: { type: Boolean, default: undefined },
};

/** A motion binds one real element/component; fragments and comments add no host. */
function motionChild(content: VNodeChild): VNode | undefined {
  const nodes: VNode[] = [];
  const collect = (child: VNodeChild): void => {
    if (Array.isArray(child)) {
      for (const node of child) collect(node);
      return;
    }
    if (child === null || child === undefined || typeof child === 'boolean') return;
    if (!isVNode(child)) {
      if (typeof child === 'string' && child.trim() === '') return;
      throw new TypeError(
        '[CSSMotion] The default slot requires one element or component to animate',
      );
    }
    if (
      child.type === Comment ||
      (child.type === Text && typeof child.children === 'string' && child.children.trim() === '')
    )
      return;
    if (child.type === Text)
      throw new TypeError('[CSSMotion] Text alone is not an animated element');
    if (child.type === Fragment) {
      const children = child.children;
      if (Array.isArray(children)) for (const node of children) collect(node);
      else if (typeof children === 'string') collect(children);
      return;
    }
    nodes.push(child);
  };
  collect(content);
  if (nodes.length > 1)
    throw new TypeError(
      '[CSSMotion] The default slot has multiple roots; provide one element/component or use MotionList',
    );
  return nodes[0];
}

export const CSSMotion = defineComponent({
  name: 'CSSMotion',
  inheritAttrs: false,
  props: { visible: { type: Boolean, default: false }, ...motionProps },
  slots: Object as SlotsType<CSSMotionSlots>,
  emits: { visibleChanged: (_visible: boolean) => true },
  setup(props, { slots, attrs, emit }) {
    const motion = useMotionStatus({
      visible: () => props.visible,
      motionName: () => props.motionName,
      supportMotion: () => props.supportMotion ?? detectSupportMotion(),
      motionAppear: () => props.motionAppear,
      motionEnter: () => props.motionEnter,
      motionLeave: () => props.motionLeave,
      motionLeaveImmediately: () => props.motionLeaveImmediately,
      motionDeadline: () => props.motionDeadline,
      removeOnLeave: () => props.removeOnLeave,
      forceRender: () => props.forceRender,
      leavedClassName: () => props.leavedClassName,
      hooks: () => props.hooks ?? {},
      onVisibleChanged: (visible) => emit('visibleChanged', visible),
    });
    return () => {
      const mode = motion.renderMode.value;
      // Preserve the verified fresh-mount/SSR/hydration snapshot boundary.
      if (mode === 'null') return null;
      const scope: CSSMotionSlotProps = {
        className:
          mode === 'leaved'
            ? (props.leavedClassName ?? '')
            : mode === 'hidden'
              ? ''
              : motion.className.value,
        style: mode === 'hidden' ? { display: 'none' } : motion.style.value,
        visible: props.visible,
        status: motion.status.value,
        step: motion.step.value,
      };
      const child = motionChild(slots.default?.(scope));
      if (!child) return null;
      return cloneVNode(
        child,
        {
          ...attrs,
          ref: (target: unknown) => {
            motion.elementRef.value = getElement(target);
          },
        },
        true,
      );
    };
  },
});
